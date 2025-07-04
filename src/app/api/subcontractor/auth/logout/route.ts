/**
 * Subcontractor Logout API Route
 * POST /api/subcontractor/auth/logout
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  getSubcontractorAuth, 
  clearSubcontractorAuthCookies,
  logSubcontractorActivity 
} from '@/lib/middleware/subcontractor-auth'

export async function POST(request: NextRequest) {
  try {
    // Get current subcontractor auth
    const subcontractorAuth = await getSubcontractorAuth(request)
    
    if (subcontractorAuth) {
      // Log activity before logout
      await logSubcontractorActivity(
        subcontractorAuth.user.id,
        'logout',
        { session_id: subcontractorAuth.session_id },
        request.ip,
        request.headers.get('user-agent') || undefined
      )
    }

    // Sign out from Supabase
    const supabase = createClient()
    await supabase.auth.signOut()

    // Create response and clear cookies
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

    clearSubcontractorAuthCookies(response)

    return response

  } catch (error) {
    console.error('Subcontractor logout error:', error)
    
    // Even if there's an error, clear cookies and return success
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

    clearSubcontractorAuthCookies(response)
    return response
  }
}