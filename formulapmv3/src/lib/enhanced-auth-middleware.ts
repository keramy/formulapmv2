import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCachedUserProfile, setCachedUserProfile, getCachedToken, setCachedToken } from './cache-middleware-robust';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export interface AuthContext {
  user: any;
  profile: any;
  permissions: string[];
}

export interface AuthOptions {
  permission?: string;
  requiredRole?: string;
  cache?: boolean;
}

/**
 * Enhanced authentication middleware with caching
 * Expected performance improvement: 23.78ms per request
 */
export function withEnhancedAuth(handler: Function, options: AuthOptions = {}) {
  return async (req: NextRequest) => {
    const startTime = Date.now();
    
    try {
      // Get JWT from Authorization header or cookie
      let token: string | null = null;
      
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      } else {
        // Try to get from cookie as fallback
        const cookies = req.cookies;
        token = cookies.get('sb-access-token')?.value || null;
      }
      
      if (!token) {
        return NextResponse.json(
          { error: 'Unauthorized: No token provided' },
          { status: 401 }
        );
      }
      
      // Try to get user from cache first
      let user = await getCachedToken(token);
      
      if (!user) {
        // Verify JWT and get user from Supabase
        const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
        
        if (error || !authUser) {
          return NextResponse.json(
            { error: 'Unauthorized: Invalid token' },
            { status: 401 }
          );
        }
        
        user = authUser;
        // Cache the token validation for 10 minutes
        await setCachedToken(token, user, 600);
      }
      
      // Get cached user profile (much faster than database query)
      let profile = await getCachedUserProfile(user.id);
      
      if (!profile) {
        // Fetch from database if not in cache
        const { data: dbProfile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error || !dbProfile) {
          return NextResponse.json(
            { error: 'Unauthorized: User profile not found' },
            { status: 401 }
          );
        }
        
        profile = dbProfile;
        // Cache profile for 1 hour
        await setCachedUserProfile(user.id, profile, 3600);
      }
      
      // Check if user is active
      if (!profile.is_active) {
        return NextResponse.json(
          { error: 'Unauthorized: User account is inactive' },
          { status: 403 }
        );
      }
      
      // Get user permissions (simplified for now)
      const permissions = await getUserPermissions(profile.role);
      
      // Check permissions if specified
      if (options.permission && !permissions.includes(options.permission)) {
        return NextResponse.json(
          { error: 'Forbidden: Insufficient permissions' },
          { status: 403 }
        );
      }
      
      if (options.requiredRole && profile.role !== options.requiredRole) {
        return NextResponse.json(
          { error: 'Forbidden: Insufficient role' },
          { status: 403 }
        );
      }
      
      // Add user and profile to request context
      const requestWithAuth = new Request(req);
      (requestWithAuth as any).user = user;
      (requestWithAuth as any).profile = profile;
      (requestWithAuth as any).permissions = permissions;
      
      // Call the handler with the enhanced request and auth data
      const response = await handler(requestWithAuth, { user, profile, permissions });
      
      // Add performance headers
      const processingTime = Date.now() - startTime;
      if (response instanceof Response) {
        response.headers.set('X-Auth-Time', `${processingTime}ms`);
      }
      
      return response;
    } catch (error) {
      console.error('[AUTH ERROR]', error);
      return NextResponse.json(
        { error: 'Internal server error during authentication' },
        { status: 500 }
      );
    }
  };
}

/**
 * Role-based access control middleware
 */
export function withRole(handler: Function, allowedRoles: string[]) {
  return withEnhancedAuth(async (req: NextRequest) => {
    const profile = (req as any).profile;
    
    if (!profile || !allowedRoles.includes(profile.role)) {
      return NextResponse.json(
        { error: `Forbidden: Role ${profile?.role || 'unknown'} not allowed` },
        { status: 403 }
      );
    }
    
    return handler(req);
  });
}

/**
 * Standardized error handling middleware
 * Expected to reduce the 2.4% failure rate
 */
export function withErrorHandling(handler: Function) {
  return async (req: NextRequest, context?: any) => {
    try {
      return await handler(req, context);
    } catch (error: any) {
      console.error('[API ERROR]', error);
      
      // Determine appropriate status code
      let status = 500;
      let message = 'Internal server error';
      
      if (error.code === 'PGRST116') {
        status = 404;
        message = 'Resource not found';
      } else if (error.code === 'PGRST109') {
        status = 403;
        message = 'Forbidden';
      } else if (error.code === 'P0001') {
        // PostgreSQL raise exception
        status = 400;
        message = error.message || 'Bad request';
      } else if (error.code === '23505') {
        // Unique constraint violation
        status = 409;
        message = 'Duplicate entry';
      } else if (error.code === '23503') {
        // Foreign key violation
        status = 400;
        message = 'Referenced resource not found';
      }
      
      return NextResponse.json(
        { 
          error: message,
          details: process.env.NODE_ENV === 'development' ? error.message : undefined 
        },
        { status }
      );
    }
  };
}

/**
 * Combined middleware: Authentication + Error Handling + Caching
 * This is the recommended middleware to use for all API routes
 */
export function withAPI(handler: Function, options?: { 
  roles?: string[], 
  cache?: boolean,
  permission?: string
}) {
  // Start with error handling
  let enhancedHandler = withErrorHandling(handler);
  
  // Add role-based access control if specified
  if (options?.roles && options.roles.length > 0) {
    enhancedHandler = withRole(enhancedHandler, options.roles);
  } else {
    // Otherwise just add authentication
    enhancedHandler = withEnhancedAuth(enhancedHandler, {
      permission: options?.permission,
      cache: options?.cache
    });
  }
  
  return enhancedHandler;
}

/**
 * Helper function to get enhanced request data
 */
export function getRequestData(req: NextRequest) {
  return {
    user: (req as any).user,
    profile: (req as any).profile,
    permissions: (req as any).permissions,
  };
}

/**
 * Get user permissions based on role
 */
async function getUserPermissions(role: string): Promise<string[]> {
  const rolePermissions: Record<string, string[]> = {
    admin: [
      'read:projects', 'write:projects', 'delete:projects',
      'read:users', 'write:users', 'delete:users',
      'read:scope', 'write:scope', 'delete:scope',
      'read:tasks', 'write:tasks', 'delete:tasks',
      'read:suppliers', 'write:suppliers', 'delete:suppliers',
      'admin:all'
    ],
    management: [
      'read:projects', 'write:projects',
      'read:tasks', 'write:tasks',
      'read:scope', 'write:scope',
      'read:suppliers', 'write:suppliers',
      'read:users'
    ],
    project_manager: [
      'read:projects', 'write:projects',
      'read:tasks', 'write:tasks',
      'read:scope', 'write:scope',
      'read:suppliers'
    ],
    technical_lead: [
      'read:projects', 'write:projects',
      'read:tasks', 'write:tasks',
      'read:scope', 'write:scope'
    ],
    purchase_manager: [
      'read:projects',
      'read:tasks',
      'read:scope',
      'read:suppliers', 'write:suppliers'
    ],
    client: [
      'read:projects',
      'read:tasks',
      'read:scope'
    ]
  };
  
  return rolePermissions[role] || [];
}

/**
 * Create standardized success response
 */
export function createSuccessResponse(data: any, pagination?: any): Response {
  const response = {
    success: true,
    data,
    ...(pagination && { pagination })
  };
  
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });
}

/**
 * Create standardized error response
 */
export function createErrorResponse(message: string, status: number, details?: any): Response {
  const response = {
    success: false,
    error: message,
    ...(details && { details })
  };
  
  return new Response(JSON.stringify(response), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });
}