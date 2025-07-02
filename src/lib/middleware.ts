import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { hasPermission, Permission } from '@/lib/permissions'
import { UserRole } from '@/types/auth'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email: string
    role: UserRole
    profile: any
  }
}

// Middleware to verify JWT token and get user
export async function verifyAuth(request: NextRequest): Promise<{
  user: any | null
  profile: any | null
  error: string | null
}> {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, profile: null, error: 'No authentication token provided' }
    }

    const token = authHeader.substring(7)
    const supabase = createServerClient()

    // Verify the JWT token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return { user: null, profile: null, error: 'Invalid or expired token' }
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { user, profile: null, error: 'User profile not found' }
    }

    if (!profile.is_active) {
      return { user, profile, error: 'Account is deactivated' }
    }

    return { user, profile, error: null }
  } catch (error) {
    console.error('Auth verification error:', error)
    return { user: null, profile: null, error: 'Authentication failed' }
  }
}

// Middleware to check specific permissions
export async function requirePermission(
  request: NextRequest,
  permission: Permission
): Promise<NextResponse | null> {
  const { user, profile, error } = await verifyAuth(request)

  if (error || !user || !profile) {
    return NextResponse.json(
      { error: error || 'Authentication required' },
      { status: 401 }
    )
  }

  if (!hasPermission(profile.role, permission)) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  // Add user info to request for use in API handlers
  const response = NextResponse.next()
  response.headers.set('x-user-id', user.id)
  response.headers.set('x-user-role', profile.role)
  
  return null // Allow request to continue
}

// Middleware to check specific roles
export async function requireRole(
  request: NextRequest,
  allowedRoles: UserRole[]
): Promise<NextResponse | null> {
  const { user, profile, error } = await verifyAuth(request)

  if (error || !user || !profile) {
    return NextResponse.json(
      { error: error || 'Authentication required' },
      { status: 401 }
    )
  }

  if (!allowedRoles.includes(profile.role)) {
    return NextResponse.json(
      { error: 'Insufficient role privileges' },
      { status: 403 }
    )
  }

  return null // Allow request to continue
}

// Middleware to require management level access
export async function requireManagement(request: NextRequest): Promise<NextResponse | null> {
  return requireRole(request, [
    'company_owner',
    'general_manager', 
    'deputy_general_manager',
    'technical_director',
    'admin'
  ])
}

// Middleware to require admin level access
export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  return requireRole(request, ['company_owner', 'admin'])
}

// Helper function to create protected API handler
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  options?: {
    permission?: Permission
    roles?: UserRole[]
    requireManagement?: boolean
    requireAdmin?: boolean
  }
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // Check authentication
      const { user, profile, error } = await verifyAuth(request)

      if (error || !user || !profile) {
        return NextResponse.json(
          { error: error || 'Authentication required' },
          { status: 401 }
        )
      }

      // Check specific permission
      if (options?.permission && !hasPermission(profile.role, options.permission)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      // Check specific roles
      if (options?.roles && !options.roles.includes(profile.role)) {
        return NextResponse.json(
          { error: 'Insufficient role privileges' },
          { status: 403 }
        )
      }

      // Check management requirement
      if (options?.requireManagement) {
        const managementRoles: UserRole[] = [
          'company_owner',
          'general_manager',
          'deputy_general_manager',
          'technical_director',
          'admin'
        ]
        if (!managementRoles.includes(profile.role)) {
          return NextResponse.json(
            { error: 'Management access required' },
            { status: 403 }
          )
        }
      }

      // Check admin requirement
      if (options?.requireAdmin) {
        const adminRoles: UserRole[] = ['company_owner', 'admin']
        if (!adminRoles.includes(profile.role)) {
          return NextResponse.json(
            { error: 'Admin access required' },
            { status: 403 }
          )
        }
      }

      // Attach user info to request
      ;(request as AuthenticatedRequest).user = {
        id: user.id,
        email: user.email!,
        role: profile.role,
        profile
      }

      return handler(request, ...args)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// Utility to get user from authenticated request
export function getAuthenticatedUser(request: AuthenticatedRequest) {
  return request.user
}

// Rate limiting helper (basic implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean {
  const now = Date.now()
  const resetTime = now + windowMs
  
  const existing = requestCounts.get(identifier)
  
  if (!existing || now > existing.resetTime) {
    requestCounts.set(identifier, { count: 1, resetTime })
    return true
  }
  
  if (existing.count >= maxRequests) {
    return false
  }
  
  existing.count++
  return true
}

// Clean up old rate limit entries
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime) {
      requestCounts.delete(key)
    }
  }
}, 5 * 60 * 1000) // Clean up every 5 minutes