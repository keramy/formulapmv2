import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Skip middleware for API routes, static files, and public paths
  if (
    req.nextUrl.pathname.startsWith('/api') ||
    req.nextUrl.pathname.startsWith('/_next') ||
    req.nextUrl.pathname.startsWith('/favicon') ||
    req.nextUrl.pathname === '/' ||
    req.nextUrl.pathname.startsWith('/auth')
  ) {
    return res
  }

  try {
    const supabase = createMiddlewareClient({ req, res })
    const { data: { session } } = await supabase.auth.getSession()
    
    // Redirect unauthenticated users to login for protected routes
    if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
      const loginUrl = new URL('/auth/login', req.url)
      return NextResponse.redirect(loginUrl)
    }
    
    // Redirect authenticated users away from auth pages
    if (session && req.nextUrl.pathname.startsWith('/auth')) {
      const dashboardUrl = new URL('/dashboard', req.url)
      return NextResponse.redirect(dashboardUrl)
    }
    
    return res
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, allow the request to continue to avoid breaking the app
    return res
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}