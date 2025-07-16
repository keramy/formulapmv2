import { NextRequest, NextResponse } from 'next/server'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Get the current session (may be expired, that's okay for logout)
    const { data: { session } } = await supabase.auth.getSession()

    if (session) {
      // Sign out the user
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('Logout error:', error)
        return createErrorResponse('Failed to logout', 500)
      }
    }

    return createSuccessResponse({
      message: 'Logged out successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Logout API error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}