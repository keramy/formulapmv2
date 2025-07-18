import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'

export const GET = withAuth(async (request: NextRequest, { user, profile }) => {
  console.log('🔍 Test Auth Endpoint Called')
  console.log('Headers:', Object.fromEntries(request.headers.entries()))
return NextResponse.json({
    timestamp: new Date().toISOString(),
    authResult: {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      hasProfile: !!profile,
      profileId: profile?.id,
      profileRole: profile?.role,
      error: error
    },
    headers: {
      authorization: request.headers.get('authorization')?.substring(0, 50) + '...',
      userAgent: request.headers.get('user-agent')
    }
  })
})