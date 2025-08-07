import { withAPI, createSuccessResponse, createErrorResponse } from '@/lib/enhanced-auth-middleware'
import { NextRequest } from 'next/server'

/**
 * GET /api/auth/status
 * 
 * Returns the current authentication status of the user.
 * This endpoint is commonly called by frontend applications to check
 * if the user is still authenticated and get current user information.
 */

// Export with authentication middleware
export const GET = withAPI(async (req: NextRequest) => {
  const user = (req as any).user
  const profile = (req as any).profile
  
  try {
    return createSuccessResponse({
      isAuthenticated: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        email_confirmed_at: user.email_confirmed_at
      },
      profile: {
        id: profile.id,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        role: profile.role,
        is_active: profile.is_active,
        department: profile.department,
        phone: profile.phone,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      },
      session: {
        authenticated_at: new Date().toISOString(),
        expires_at: user.expires_at
      }
    })
  } catch (error) {
    console.error('Auth status error:', error)
    return createErrorResponse('Failed to get authentication status', 500)
  }
})
export const dynamic = 'force-dynamic'