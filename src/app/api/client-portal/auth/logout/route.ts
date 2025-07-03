/**
 * Client Portal Authentication - Logout Endpoint
 * Secure session termination with activity logging
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  invalidateClientSession,
  logClientActivity,
  getClientIdentifier
} from '@/lib/middleware/client-auth'
import { ClientApiResponse } from '@/types/client-portal'

// ============================================================================
// POST /api/client-portal/auth/logout - Client Portal Logout
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const identifier = getClientIdentifier(request)
    const ipAddress = request.ip || 
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Get session token from cookie or header
    const sessionToken = request.cookies.get('client-session')?.value ||
                        request.headers.get('x-client-session')

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'No active session found' } as ClientApiResponse<null>,
        { status: 400 }
      )
    }

    // Get client user ID from session for logging (if possible)
    let clientUserId = 'unknown'
    try {
      // We could validate session to get user ID, but for logout we'll just invalidate
      // In a more sophisticated implementation, you might want to log the user ID
    } catch (error) {
      // Session might be invalid, but we still want to clean up
    }

    // Invalidate the session
    invalidateClientSession(sessionToken)

    // Log logout activity
    await logClientActivity(clientUserId, 'logout', {
      action_taken: 'User logged out',
      description: 'Client session terminated',
      ip_address: ipAddress,
      user_agent: userAgent,
      session_id: sessionToken,
      metadata: {
        logout_type: 'manual',
        session_invalidated: true
      }
    })

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: 'Logout successful'
      } as ClientApiResponse<null>,
      { status: 200 }
    )

    // Clear session cookie
    response.cookies.set('client-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/api/client-portal'
    })

    return response

  } catch (error) {
    console.error('Client logout error:', error)

    // Log error
    await logClientActivity('unknown', 'logout', {
      action_taken: 'Logout error occurred',
      description: 'Internal server error during logout process',
      ip_address: request.ip || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        error_occurred: true,
        error_type: 'internal_server_error'
      }
    })

    return NextResponse.json(
      { success: false, error: 'Logout service temporarily unavailable' } as ClientApiResponse<null>,
      { status: 500 }
    )
  }
}