import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  console.log('🔍 Test Auth Endpoint Called')
  console.log('Headers:', Object.fromEntries(request.headers.entries()))
  
  const { user, profile, error } = await verifyAuth(request)
  
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
}