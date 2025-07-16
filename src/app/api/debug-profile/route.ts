import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'

export const GET = withAuth(async (request: NextRequest, { user, profile, supabase }) => {
  // Only allow in development environment
  if (process.env.NODE_ENV !== 'development') {
    return createErrorResponse('Debug endpoints only available in development', 403)
  }

  const userId = '217af21a-6a43-4464-bb6d-696d1d2e88e7'

  console.log('🔍 Debug: Testing direct profile fetch')

  try {
    const result = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    console.log('🔍 Debug: Direct profile result', {
      hasData: !!result.data,
      error: result.error?.message,
      errorCode: result.error?.code,
      data: result.data
    })

    return createSuccessResponse({
      hasData: !!result.data,
      error: result.error?.message,
      errorCode: result.error?.code,
      data: result.data,
      requestedBy: user.id,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('🔍 Debug: Exception in profile fetch', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Unknown error',
      500
    )
  }
}, { permission: 'system.debug' })