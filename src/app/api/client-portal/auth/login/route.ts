/**
 * Client Portal Authentication - Login Endpoint
 * External client authentication separate from internal system
 * Security-first implementation with comprehensive validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { 
  clientLoginSchema,
  validateClientPortalInput 
} from '@/lib/validation/client-portal'
import { 
  createClientSession,
  getClientIdentifier,
  clientRateLimit,
  logClientActivity,
  detectSuspiciousActivity
} from '@/lib/middleware/client-auth'
import { 
  ClientApiResponse, 
  ClientAuthSession,
  ClientUser 
} from '@/types/client-portal'
import bcrypt from 'bcryptjs'

// ============================================================================
// POST /api/client-portal/auth/login - Client Portal Login
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get client identifier for rate limiting and logging
    const identifier = getClientIdentifier(request)
    const ipAddress = request.ip || 
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Check for suspicious activity
    if (detectSuspiciousActivity(request)) {
      await logClientActivity('unknown', 'login', {
        action_taken: 'Suspicious login attempt blocked',
        description: 'Request blocked due to suspicious activity patterns',
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: {
          reason: 'suspicious_user_agent_or_headers',
          blocked: true
        }
      })

      return NextResponse.json(
        { 
          success: false, 
          error: 'Request blocked due to security policy' 
        } as ClientApiResponse<null>,
        { status: 403 }
      )
    }

    // Apply strict rate limiting for login attempts
    const rateLimitResult = clientRateLimit(identifier, {
      maxRequests: 5, // Only 5 login attempts per window
      windowMs: 15 * 60 * 1000, // 15 minutes
      blockDurationMs: 60 * 60 * 1000, // 1 hour block
      suspiciousThreshold: 10
    })

    if (!rateLimitResult.allowed) {
      await logClientActivity('unknown', 'login', {
        action_taken: 'Login attempt rate limited',
        description: 'Login attempt blocked due to rate limiting',
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: {
          remaining: rateLimitResult.remaining,
          blocked: rateLimitResult.blocked,
          rate_limited: true
        }
      })

      return NextResponse.json(
        { 
          success: false, 
          error: rateLimitResult.blocked ? 
            'Account temporarily locked due to suspicious activity' : 
            'Too many login attempts. Please try again later.',
          details: [
            `Please wait ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 60000)} minutes before trying again`
          ]
        } as ClientApiResponse<null>,
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString()
          }
        }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = validateClientPortalInput(clientLoginSchema, body)

    if (!validationResult.success) {
      await logClientActivity('unknown', 'login', {
        action_taken: 'Login attempt with invalid data',
        description: 'Login validation failed',
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: {
          validation_errors: validationResult.error.errors,
          invalid_data: true
        }
      })

      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid login data',
          details: validationResult.error.errors.map(e => e.message)
        } as ClientApiResponse<null>,
        { status: 400 }
      )
    }

    const { email, password, company_code } = validationResult.data
    const supabase = createServerClient()

    // Find client user by email and optional company code
    let clientQuery = supabase
      .from('client_users')
      .select(`
        *,
        user_profile:user_profiles(id, first_name, last_name, email, password_hash, is_active),
        client_company:client_companies(id, company_name, company_type, is_active)
      `)
      .eq('user_profile.email', email)
      .eq('portal_access_enabled', true)

    // If company code is provided, filter by it
    if (company_code) {
      // Assuming company_code is stored in client_companies table
      clientQuery = clientQuery.eq('client_company.company_code', company_code)
    }

    const { data: clientUsers, error: queryError } = await clientQuery

    if (queryError) {
      console.error('Client login query error:', queryError)
      await logClientActivity('unknown', 'login', {
        action_taken: 'Login query failed',
        description: 'Database query error during login',
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: {
          error: queryError.message,
          query_failed: true
        }
      })

      return NextResponse.json(
        { success: false, error: 'Login service temporarily unavailable' } as ClientApiResponse<null>,
        { status: 500 }
      )
    }

    if (!clientUsers || clientUsers.length === 0) {
      await logClientActivity('unknown', 'login', {
        action_taken: 'Login attempt with non-existent credentials',
        description: 'No client user found for provided credentials',
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: {
          email_provided: email,
          company_code_provided: !!company_code,
          user_not_found: true
        }
      })

      return NextResponse.json(
        { success: false, error: 'Invalid email or password' } as ClientApiResponse<null>,
        { status: 401 }
      )
    }

    const clientUser = clientUsers[0] as ClientUser & {
      user_profile: any,
      client_company: any
    }

    // Check if user profile is active
    if (!clientUser.user_profile?.is_active) {
      await logClientActivity(clientUser.id, 'login', {
        action_taken: 'Login attempt on deactivated account',
        description: 'User profile is deactivated',
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: {
          account_deactivated: true
        }
      })

      return NextResponse.json(
        { success: false, error: 'Account is deactivated' } as ClientApiResponse<null>,
        { status: 401 }
      )
    }

    // Check if company is active
    if (!clientUser.client_company?.is_active) {
      await logClientActivity(clientUser.id, 'login', {
        action_taken: 'Login attempt for inactive company',
        description: 'Company account is deactivated',
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: {
          company_deactivated: true
        }
      })

      return NextResponse.json(
        { success: false, error: 'Company account is deactivated' } as ClientApiResponse<null>,
        { status: 401 }
      )
    }

    // Check if account is locked
    if (clientUser.account_locked) {
      await logClientActivity(clientUser.id, 'login', {
        action_taken: 'Login attempt on locked account',
        description: 'Account is locked due to security policy',
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: {
          account_locked: true,
          login_attempts: clientUser.login_attempts
        }
      })

      return NextResponse.json(
        { success: false, error: 'Account is locked. Please contact support.' } as ClientApiResponse<null>,
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, clientUser.user_profile.password_hash)

    if (!isValidPassword) {
      // Increment login attempts
      const newAttempts = clientUser.login_attempts + 1
      const shouldLock = newAttempts >= 5 // Lock after 5 failed attempts

      await supabase
        .from('client_users')
        .update({
          login_attempts: newAttempts,
          account_locked: shouldLock,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientUser.id)

      await logClientActivity(clientUser.id, 'login', {
        action_taken: 'Failed login attempt',
        description: `Invalid password provided. Attempts: ${newAttempts}`,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: {
          login_attempts: newAttempts,
          account_locked: shouldLock,
          invalid_password: true
        }
      })

      return NextResponse.json(
        { 
          success: false, 
          error: shouldLock ? 
            'Account locked due to multiple failed attempts. Please contact support.' :
            'Invalid email or password'
        } as ClientApiResponse<null>,
        { status: 401 }
      )
    }

    // Successful login - reset login attempts and update last login
    await supabase
      .from('client_users')
      .update({
        login_attempts: 0,
        last_login: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', clientUser.id)

    // Create client session
    const session = createClientSession(clientUser.id, ipAddress, userAgent)

    // Log successful login
    await logClientActivity(clientUser.id, 'login', {
      action_taken: 'Successful login',
      description: 'Client user successfully authenticated',
      ip_address: ipAddress,
      user_agent: userAgent,
      session_id: session.id,
      metadata: {
        successful_login: true,
        session_created: true
      }
    })

    // Prepare response data
    const authSession: ClientAuthSession = {
      client_user: clientUser,
      access_token: session.id, // Using session ID as access token for simplicity
      refresh_token: '', // Implement refresh token logic if needed
      expires_at: session.expires_at,
      session_id: session.id
    }

    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        data: {
          session: authSession,
          user: {
            id: clientUser.id,
            email: clientUser.user_profile.email,
            name: `${clientUser.user_profile.first_name} ${clientUser.user_profile.last_name}`,
            company: clientUser.client_company.company_name,
            access_level: clientUser.access_level,
            preferences: {
              language: clientUser.language,
              timezone: clientUser.timezone,
              theme: clientUser.theme
            }
          }
        }
      } as ClientApiResponse<{
        session: ClientAuthSession,
        user: any
      }>,
      { status: 200 }
    )

    // Set secure session cookie
    response.cookies.set('client-session', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60, // 8 hours in seconds
      path: '/api/client-portal'
    })

    return response

  } catch (error) {
    console.error('Client login error:', error)
    
    // Log error without exposing sensitive details
    await logClientActivity('unknown', 'login', {
      action_taken: 'Login error occurred',
      description: 'Internal server error during login process',
      ip_address: request.ip || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        error_occurred: true,
        error_type: 'internal_server_error'
      }
    })

    return NextResponse.json(
      { success: false, error: 'Login service temporarily unavailable' } as ClientApiResponse<null>,
      { status: 500 }
    )
  }
}