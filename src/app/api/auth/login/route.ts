import { createSuccessResponse, createErrorResponse } from '@/lib/enhanced-auth-middleware';
import { validateInput, loginSchema } from '@/lib/validation';
import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

// Initialize Supabase client for authentication
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Login API route - handles email/password authentication
 * POST /api/auth/login
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input data
    const validation = validateInput(loginSchema, body);
    if (!validation.success) {
      return createErrorResponse(
        'Invalid login credentials format',
        400,
        { validationErrors: validation.errors }
      );
    }
    
    const { email, password } = validation.data;
    
    // Attempt to sign in with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });
    
    if (authError) {
      console.error('🔐 [Login API] Authentication failed:', authError.message);
      
      // Map Supabase auth errors to user-friendly messages
      let errorMessage = 'Login failed';
      let statusCode = 401;
      
      switch (authError.message) {
        case 'Invalid login credentials':
        case 'Email not confirmed':
          errorMessage = 'Invalid email or password';
          break;
        case 'Too many requests':
          errorMessage = 'Too many login attempts. Please try again later.';
          statusCode = 429;
          break;
        case 'User not found':
          errorMessage = 'Account not found';
          break;
        default:
          errorMessage = 'Authentication failed. Please try again.';
      }
      
      return createErrorResponse(errorMessage, statusCode, {
        code: authError.message
      });
    }
    
    if (!authData.user || !authData.session) {
      return createErrorResponse(
        'Authentication failed - no session created',
        401
      );
    }
    
    // Fetch user profile to ensure it exists
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (profileError || !profile) {
      console.error('🔐 [Login API] Profile fetch failed:', profileError?.message);
      return createErrorResponse(
        'User profile not found. Please contact administrator.',
        404,
        { profileError: profileError?.message }
      );
    }
    
    // Check if user account is active
    if (!profile.is_active) {
      return createErrorResponse(
        'Account is inactive. Please contact administrator.',
        403,
        { reason: 'account_inactive' }
      );
    }
    
    console.log('🔐 [Login API] Login successful for user:', authData.user.email);
    
    // Return successful response with essential data
    return createSuccessResponse({
      user: {
        id: authData.user.id,
        email: authData.user.email,
        email_confirmed_at: authData.user.email_confirmed_at,
        last_sign_in_at: authData.user.last_sign_in_at
      },
      profile: {
        id: profile.id,
        role: profile.role,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        is_active: profile.is_active,
        permissions: profile.permissions
      },
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at,
        expires_in: authData.session.expires_in
      }
    });
    
  } catch (error) {
    console.error('🔐 [Login API] Unexpected error:', error);
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return createErrorResponse(
        'Invalid request format',
        400,
        { error: 'Invalid JSON in request body' }
      );
    }
    
    return createErrorResponse(
      'Internal server error during login',
      500,
      { error: process.env.NODE_ENV === 'development' ? String(error) : undefined }
    );
  }
}

/**
 * Handle unsupported HTTP methods
 */
export async function GET() {
  return createErrorResponse('Method not allowed', 405);
}

export async function PUT() {
  return createErrorResponse('Method not allowed', 405);
}

export async function DELETE() {
  return createErrorResponse('Method not allowed', 405);
}