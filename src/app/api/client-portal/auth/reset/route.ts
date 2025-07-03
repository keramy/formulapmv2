/**
 * Client Portal Authentication - Password Reset Endpoint
 * Secure password reset with email verification
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { 
  clientPasswordResetSchema,
  validateClientPortalInput 
} from '@/lib/validation/client-portal'
import { 
  getClientIdentifier,
  clientRateLimit,
  logClientActivity,
  detectSuspiciousActivity
} from '@/lib/middleware/client-auth'
import { ClientApiResponse } from '@/types/client-portal'
import { randomBytes } from 'crypto'

// ============================================================================
// POST /api/client-portal/auth/reset - Client Portal Password Reset
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const identifier = getClientIdentifier(request)
    const ipAddress = request.ip || 
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Check for suspicious activity
    if (detectSuspiciousActivity(request)) {
      await logClientActivity('unknown', 'profile_update', {
        action_taken: 'Suspicious password reset attempt blocked',
        description: 'Request blocked due to suspicious activity patterns',
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: {
          reason: 'suspicious_user_agent_or_headers',
          blocked: true,
          action_type: 'password_reset'
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

    // Apply rate limiting for password reset attempts
    const rateLimitResult = clientRateLimit(identifier, {
      maxRequests: 3, // Only 3 password reset attempts per window
      windowMs: 60 * 60 * 1000, // 1 hour
      blockDurationMs: 4 * 60 * 60 * 1000, // 4 hour block
      suspiciousThreshold: 5
    })

    if (!rateLimitResult.allowed) {
      await logClientActivity('unknown', 'profile_update', {
        action_taken: 'Password reset attempt rate limited',
        description: 'Password reset blocked due to rate limiting',
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: {
          remaining: rateLimitResult.remaining,
          blocked: rateLimitResult.blocked,
          rate_limited: true,
          action_type: 'password_reset'
        }
      })

      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many password reset attempts. Please try again later.',
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
    const validationResult = validateClientPortalInput(clientPasswordResetSchema, body)

    if (!validationResult.success) {
      await logClientActivity('unknown', 'profile_update', {
        action_taken: 'Password reset attempt with invalid data',
        description: 'Password reset validation failed',
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: {
          validation_errors: validationResult.error.errors,
          invalid_data: true,
          action_type: 'password_reset'
        }
      })

      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid reset data',
          details: validationResult.error.errors.map(e => e.message)
        } as ClientApiResponse<null>,
        { status: 400 }
      )
    }

    const { email, company_code } = validationResult.data
    const supabase = createServerClient()

    // Find client user by email and optional company code
    let clientQuery = supabase
      .from('client_users')
      .select(`
        *,
        user_profile:user_profiles(id, first_name, last_name, email, is_active),
        client_company:client_companies(id, company_name, company_type, is_active)
      `)
      .eq('user_profile.email', email)
      .eq('portal_access_enabled', true)

    // If company code is provided, filter by it
    if (company_code) {
      clientQuery = clientQuery.eq('client_company.company_code', company_code)
    }

    const { data: clientUsers, error: queryError } = await clientQuery

    if (queryError) {
      console.error('Client password reset query error:', queryError)
      await logClientActivity('unknown', 'profile_update', {
        action_taken: 'Password reset query failed',
        description: 'Database query error during password reset',
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: {
          error: queryError.message,
          query_failed: true,
          action_type: 'password_reset'
        }
      })

      return NextResponse.json(
        { success: false, error: 'Password reset service temporarily unavailable' } as ClientApiResponse<null>,
        { status: 500 }
      )
    }

    // Always return success to prevent email enumeration attacks
    // But only actually send email if user exists and is active
    let actuallyProcessed = false

    if (clientUsers && clientUsers.length > 0) {
      const clientUser = clientUsers[0]

      // Check if user and company are active
      if (clientUser.user_profile?.is_active && 
          clientUser.client_company?.is_active && 
          !clientUser.account_locked) {
        
        // Generate reset token
        const resetToken = randomBytes(32).toString('hex')
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

        // Store reset token in database
        const { error: updateError } = await supabase
          .from('client_users')
          .update({
            password_reset_token: resetToken,
            password_reset_expires: resetExpires.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', clientUser.id)

        if (!updateError) {
          // TODO: Send password reset email
          // This would typically integrate with your email service
          await sendPasswordResetEmail(
            clientUser.user_profile.email,
            `${clientUser.user_profile.first_name} ${clientUser.user_profile.last_name}`,
            resetToken,
            clientUser.client_company.company_name
          )

          actuallyProcessed = true

          await logClientActivity(clientUser.id, 'profile_update', {
            action_taken: 'Password reset initiated',
            description: 'Password reset token generated and email sent',
            ip_address: ipAddress,
            user_agent: userAgent,
            metadata: {
              reset_token_generated: true,
              email_sent: true,
              action_type: 'password_reset'
            }
          })
        }
      }
    }

    // Log the attempt regardless of whether user exists (for security monitoring)
    await logClientActivity('unknown', 'profile_update', {
      action_taken: 'Password reset attempt',
      description: `Password reset requested for email: ${email}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: {
        email_provided: email,
        company_code_provided: !!company_code,
        actually_processed: actuallyProcessed,
        action_type: 'password_reset'
      }
    })

    // Always return success message to prevent email enumeration
    return NextResponse.json(
      {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
        data: {
          email_sent: true,
          expires_in: '1 hour'
        }
      } as ClientApiResponse<{ email_sent: boolean; expires_in: string }>,
      { status: 200 }
    )

  } catch (error) {
    console.error('Client password reset error:', error)
    
    await logClientActivity('unknown', 'profile_update', {
      action_taken: 'Password reset error occurred',
      description: 'Internal server error during password reset process',
      ip_address: request.ip || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        error_occurred: true,
        error_type: 'internal_server_error',
        action_type: 'password_reset'
      }
    })

    return NextResponse.json(
      { success: false, error: 'Password reset service temporarily unavailable' } as ClientApiResponse<null>,
      { status: 500 }
    )
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetToken: string,
  companyName: string
): Promise<void> {
  try {
    // TODO: Implement email sending logic
    // This would integrate with your email service (SendGrid, AWS SES, etc.)
    
    const resetUrl = `${process.env.NEXT_PUBLIC_CLIENT_PORTAL_URL}/reset-password?token=${resetToken}`
    
    console.log(`Password reset email would be sent to ${email}`)
    console.log(`Reset URL: ${resetUrl}`)
    console.log(`User: ${name}`)
    console.log(`Company: ${companyName}`)
    
    // Example email content structure:
    const emailContent = {
      to: email,
      subject: `Password Reset - ${companyName} Client Portal`,
      html: `
        <h2>Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>You have requested a password reset for your ${companyName} client portal account.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this reset, please ignore this email.</p>
        <p>Best regards,<br>The ${companyName} Team</p>
      `,
      text: `
        Password Reset Request
        
        Hello ${name},
        
        You have requested a password reset for your ${companyName} client portal account.
        
        Click the link below to reset your password:
        ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you did not request this reset, please ignore this email.
        
        Best regards,
        The ${companyName} Team
      `
    }
    
    // Here you would call your email service API
    // await emailService.send(emailContent)
    
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    throw error
  }
}