/**
 * Client Portal Authentication Middleware
 * Handles authentication and security isolation for external client portal access
 * Maintains complete separation from internal Formula PM authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify, SignJWT } from 'jose'

// Configuration
const CLIENT_JWT_SECRET = new TextEncoder().encode(
  process.env.CLIENT_PORTAL_JWT_SECRET || 'client-portal-secret-key-change-in-production'
)
const CLIENT_SESSION_TIMEOUT = 8 * 60 * 60 * 1000 // 8 hours
const CLIENT_REFRESH_THRESHOLD = 60 * 60 * 1000 // 1 hour

// Types for client authentication
export interface ClientAuthUser {
  id: string
  email: string
  client_company_id: string
  access_level: string
  portal_access_enabled: boolean
  session_id: string
  company_name?: string
  theme?: string
  language?: string
  timezone?: string
}

export interface ClientAuthSession {
  user: ClientAuthUser
  expires_at: number
  issued_at: number
  session_id: string
}

export interface ClientAuthRequest extends NextRequest {
  clientAuth?: {
    user: ClientAuthUser
    session: ClientAuthSession
    isAuthenticated: boolean
  }
}

/**
 * Create client portal JWT token
 */
export async function createClientToken(user: ClientAuthUser): Promise<string> {
  const now = Date.now()
  const expiresAt = now + CLIENT_SESSION_TIMEOUT

  const payload = {
    sub: user.id,
    email: user.email,
    client_company_id: user.client_company_id,
    access_level: user.access_level,
    session_id: user.session_id,
    iat: Math.floor(now / 1000),
    exp: Math.floor(expiresAt / 1000),
    aud: 'client-portal',
    iss: 'formula-pm'
  }

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .sign(CLIENT_JWT_SECRET)
}

/**
 * Verify client portal JWT token
 */
export async function verifyClientToken(token: string): Promise<ClientAuthSession | null> {
  try {
    const { payload } = await jwtVerify(token, CLIENT_JWT_SECRET, {
      audience: 'client-portal',
      issuer: 'formula-pm'
    })

    // Validate payload structure
    if (
      !payload.sub ||
      !payload.email ||
      !payload.client_company_id ||
      !payload.access_level ||
      !payload.session_id ||
      !payload.exp
    ) {
      return null
    }

    const user: ClientAuthUser = {
      id: payload.sub as string,
      email: payload.email as string,
      client_company_id: payload.client_company_id as string,
      access_level: payload.access_level as string,
      portal_access_enabled: true,
      session_id: payload.session_id as string
    }

    const session: ClientAuthSession = {
      user,
      expires_at: (payload.exp as number) * 1000,
      issued_at: (payload.iat as number) * 1000,
      session_id: payload.session_id as string
    }

    // Check if token is expired
    if (session.expires_at < Date.now()) {
      return null
    }

    return session
  } catch (error) {
    console.error('Client token verification failed:', error)
    return null
  }
}

/**
 * Check if client session needs refresh
 */
export function shouldRefreshClientSession(session: ClientAuthSession): boolean {
  const timeUntilExpiry = session.expires_at - Date.now()
  return timeUntilExpiry < CLIENT_REFRESH_THRESHOLD
}

/**
 * Set client authentication cookies
 */
export function setClientAuthCookies(response: NextResponse, token: string): void {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: CLIENT_SESSION_TIMEOUT / 1000,
    path: '/client-portal'
  }

  response.cookies.set('client-portal-token', token, cookieOptions)
}

/**
 * Clear client authentication cookies
 */
export function clearClientAuthCookies(response: NextResponse): void {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 0,
    path: '/client-portal'
  }

  response.cookies.set('client-portal-token', '', cookieOptions)
}

/**
 * Get client authentication from request
 */
export async function getClientAuth(request: NextRequest): Promise<ClientAuthSession | null> {
  const token = request.cookies.get('client-portal-token')?.value

  if (!token) {
    return null
  }

  return await verifyClientToken(token)
}

/**
 * Client portal authentication middleware
 */
export async function clientPortalAuthMiddleware(
  request: NextRequest,
  requireAuth: boolean = true
): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl

  // Skip authentication for login and public routes
  const publicRoutes = [
    '/client-portal/login',
    '/client-portal/register',
    '/client-portal/reset-password',
    '/client-portal/api/auth/login',
    '/client-portal/api/auth/register',
    '/client-portal/api/auth/reset'
  ]

  if (publicRoutes.includes(pathname)) {
    return null // Continue to next middleware
  }

  // Get client authentication
  const clientAuth = await getClientAuth(request)

  // If authentication is required but not present, redirect to login
  if (requireAuth && !clientAuth) {
    const loginUrl = new URL('/client-portal/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If authenticated, check if session needs refresh
  if (clientAuth && shouldRefreshClientSession(clientAuth)) {
    // In a real implementation, you would refresh the token here
    // For now, we'll just log that it needs refresh
    console.log('Client session needs refresh for user:', clientAuth.user.email)
  }

  // Add client auth to request headers for API routes
  if (clientAuth && pathname.startsWith('/api/client-portal/')) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-client-auth', JSON.stringify(clientAuth))
    
    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    })
  }

  return null // Continue to next middleware
}

/**
 * Rate limiting for client portal API routes
 */
interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

export function clientPortalRateLimit(
  clientId: string,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean {
  const now = Date.now()
  const key = `client:${clientId}`
  
  // Clean up expired entries
  for (const [k, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(k)
    }
  }

  const entry = rateLimitStore.get(key)
  
  if (!entry) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    })
    return true
  }

  if (entry.resetTime < now) {
    entry.count = 1
    entry.resetTime = now + windowMs
    return true
  }

  if (entry.count >= maxRequests) {
    return false
  }

  entry.count++
  return true
}

/**
 * Security headers for client portal
 */
export function addClientPortalSecurityHeaders(response: NextResponse): void {
  // Content Security Policy for client portal
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
}

/**
 * Activity logging for client portal
 */
export async function logClientActivity(
  clientUserId: string,
  activityType: string,
  details: Record<string, any> = {},
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    // In a real implementation, this would log to your database
    console.log('Client Activity:', {
      client_user_id: clientUserId,
      activity_type: activityType,
      details,
      ip_address: ipAddress,
      user_agent: userAgent,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to log client activity:', error)
  }
}

/**
 * Client portal middleware configuration
 */
export const clientPortalConfig = {
  protectedPaths: [
    '/client-portal/dashboard',
    '/client-portal/projects',
    '/client-portal/documents',
    '/client-portal/communications',
    '/client-portal/notifications',
    '/client-portal/profile'
  ],
  apiPaths: [
    '/api/client-portal/'
  ],
  publicPaths: [
    '/client-portal/login',
    '/client-portal/register',
    '/client-portal/reset-password'
  ]
}

/**
 * Main client portal middleware function
 */
export async function handleClientPortalRequest(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl
  
  // Only handle client portal routes
  if (!pathname.startsWith('/client-portal') && !pathname.startsWith('/api/client-portal')) {
    return NextResponse.next()
  }

  // Apply authentication middleware
  const authResult = await clientPortalAuthMiddleware(request, !clientPortalConfig.publicPaths.includes(pathname))
  if (authResult) {
    return authResult
  }

  // Get client auth for rate limiting and logging
  const clientAuth = await getClientAuth(request)
  
  // Apply rate limiting for API routes
  if (pathname.startsWith('/api/client-portal/') && clientAuth) {
    const isAllowed = clientPortalRateLimit(clientAuth.user.id)
    if (!isAllowed) {
      return new NextResponse('Rate limit exceeded', { status: 429 })
    }
  }

  // Create response with security headers
  const response = NextResponse.next()
  addClientPortalSecurityHeaders(response)

  // Log client activity for authenticated requests
  if (clientAuth && !pathname.startsWith('/api/client-portal/dashboard/activities')) {
    await logClientActivity(
      clientAuth.user.id,
      pathname.startsWith('/api/') ? 'api_request' : 'page_visit',
      { pathname },
      request.ip,
      request.headers.get('user-agent') || undefined
    )
  }

  return response
}