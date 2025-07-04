/**
 * Subcontractor Authentication Middleware
 * Handles authentication and security for external subcontractor portal access
 * Based on client portal patterns but simplified for subcontractor use
 */

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify, SignJWT } from 'jose'

// Configuration
const SUBCONTRACTOR_JWT_SECRET = new TextEncoder().encode(
  process.env.SUBCONTRACTOR_JWT_SECRET || 'subcontractor-secret-key-change-in-production'
)
const SUBCONTRACTOR_SESSION_TIMEOUT = 8 * 60 * 60 * 1000 // 8 hours
const SUBCONTRACTOR_REFRESH_THRESHOLD = 60 * 60 * 1000 // 1 hour

// Types for subcontractor authentication
export interface SubcontractorAuthUser {
  id: string
  email: string
  company_name: string
  contact_person: string
  user_profile_id: string
  is_active: boolean
  session_id: string
  assigned_projects: string[]
}

export interface SubcontractorAuthSession {
  user: SubcontractorAuthUser
  expires_at: number
  issued_at: number
  session_id: string
}

export interface SubcontractorAuthRequest extends NextRequest {
  subcontractorAuth?: {
    user: SubcontractorAuthUser
    session: SubcontractorAuthSession
    isAuthenticated: boolean
  }
}

/**
 * Create subcontractor portal JWT token
 */
export async function createSubcontractorToken(user: SubcontractorAuthUser): Promise<string> {
  const now = Date.now()
  const expiresAt = now + SUBCONTRACTOR_SESSION_TIMEOUT

  const payload = {
    sub: user.id,
    email: user.email,
    company_name: user.company_name,
    contact_person: user.contact_person,
    user_profile_id: user.user_profile_id,
    session_id: user.session_id,
    assigned_projects: user.assigned_projects,
    iat: Math.floor(now / 1000),
    exp: Math.floor(expiresAt / 1000),
    aud: 'subcontractor-portal',
    iss: 'formula-pm'
  }

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .sign(SUBCONTRACTOR_JWT_SECRET)
}

/**
 * Verify subcontractor portal JWT token
 */
export async function verifySubcontractorToken(token: string): Promise<SubcontractorAuthSession | null> {
  try {
    const { payload } = await jwtVerify(token, SUBCONTRACTOR_JWT_SECRET, {
      audience: 'subcontractor-portal',
      issuer: 'formula-pm'
    })

    // Validate payload structure
    if (
      !payload.sub ||
      !payload.email ||
      !payload.company_name ||
      !payload.contact_person ||
      !payload.user_profile_id ||
      !payload.session_id ||
      !payload.exp
    ) {
      return null
    }

    const user: SubcontractorAuthUser = {
      id: payload.sub as string,
      email: payload.email as string,
      company_name: payload.company_name as string,
      contact_person: payload.contact_person as string,
      user_profile_id: payload.user_profile_id as string,
      is_active: true,
      session_id: payload.session_id as string,
      assigned_projects: (payload.assigned_projects as string[]) || []
    }

    const session: SubcontractorAuthSession = {
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
    console.error('Subcontractor token verification failed:', error)
    return null
  }
}

/**
 * Check if subcontractor session needs refresh
 */
export function shouldRefreshSubcontractorSession(session: SubcontractorAuthSession): boolean {
  const timeUntilExpiry = session.expires_at - Date.now()
  return timeUntilExpiry < SUBCONTRACTOR_REFRESH_THRESHOLD
}

/**
 * Set subcontractor authentication cookies
 */
export function setSubcontractorAuthCookies(response: NextResponse, token: string): void {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: SUBCONTRACTOR_SESSION_TIMEOUT / 1000,
    path: '/subcontractor'
  }

  response.cookies.set('subcontractor-portal-token', token, cookieOptions)
}

/**
 * Clear subcontractor authentication cookies
 */
export function clearSubcontractorAuthCookies(response: NextResponse): void {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 0,
    path: '/subcontractor'
  }

  response.cookies.set('subcontractor-portal-token', '', cookieOptions)
}

/**
 * Get subcontractor authentication from request
 */
export async function getSubcontractorAuth(request: NextRequest): Promise<SubcontractorAuthSession | null> {
  const token = request.cookies.get('subcontractor-portal-token')?.value

  if (!token) {
    return null
  }

  return await verifySubcontractorToken(token)
}

/**
 * Subcontractor portal authentication middleware
 */
export async function subcontractorPortalAuthMiddleware(
  request: NextRequest,
  requireAuth: boolean = true
): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl

  // Skip authentication for login and public routes
  const publicRoutes = [
    '/subcontractor/login',
    '/api/subcontractor/auth/login'
  ]

  if (publicRoutes.includes(pathname)) {
    return null // Continue to next middleware
  }

  // Get subcontractor authentication
  const subcontractorAuth = await getSubcontractorAuth(request)

  // If authentication is required but not present, redirect to login
  if (requireAuth && !subcontractorAuth) {
    const loginUrl = new URL('/subcontractor/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If authenticated, check if session needs refresh
  if (subcontractorAuth && shouldRefreshSubcontractorSession(subcontractorAuth)) {
    console.log('Subcontractor session needs refresh for user:', subcontractorAuth.user.email)
  }

  // Add subcontractor auth to request headers for API routes
  if (subcontractorAuth && pathname.startsWith('/api/subcontractor/')) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-subcontractor-auth', JSON.stringify(subcontractorAuth))
    
    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    })
  }

  return null // Continue to next middleware
}

/**
 * Rate limiting for subcontractor portal API routes
 */
interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

export function subcontractorPortalRateLimit(
  subcontractorId: string,
  maxRequests: number = 50,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean {
  const now = Date.now()
  const key = `subcontractor:${subcontractorId}`
  
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
 * Security headers for subcontractor portal
 */
export function addSubcontractorPortalSecurityHeaders(response: NextResponse): void {
  // Content Security Policy for subcontractor portal
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
 * Activity logging for subcontractor portal
 */
export async function logSubcontractorActivity(
  subcontractorUserId: string,
  activityType: string,
  details: Record<string, any> = {},
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    console.log('Subcontractor Activity:', {
      subcontractor_user_id: subcontractorUserId,
      activity_type: activityType,
      details,
      ip_address: ipAddress,
      user_agent: userAgent,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to log subcontractor activity:', error)
  }
}

/**
 * Subcontractor portal middleware configuration
 */
export const subcontractorPortalConfig = {
  protectedPaths: [
    '/subcontractor',
    '/subcontractor/reports',
    '/subcontractor/documents',
    '/subcontractor/profile'
  ],
  apiPaths: [
    '/api/subcontractor/'
  ],
  publicPaths: [
    '/subcontractor/login'
  ]
}

/**
 * Main subcontractor portal middleware function
 */
export async function handleSubcontractorPortalRequest(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl
  
  // Only handle subcontractor portal routes
  if (!pathname.startsWith('/subcontractor') && !pathname.startsWith('/api/subcontractor')) {
    return NextResponse.next()
  }

  // Apply authentication middleware
  const authResult = await subcontractorPortalAuthMiddleware(request, !subcontractorPortalConfig.publicPaths.includes(pathname))
  if (authResult) {
    return authResult
  }

  // Get subcontractor auth for rate limiting and logging
  const subcontractorAuth = await getSubcontractorAuth(request)
  
  // Apply rate limiting for API routes
  if (pathname.startsWith('/api/subcontractor/') && subcontractorAuth) {
    const isAllowed = subcontractorPortalRateLimit(subcontractorAuth.user.id)
    if (!isAllowed) {
      return new NextResponse('Rate limit exceeded', { status: 429 })
    }
  }

  // Create response with security headers
  const response = NextResponse.next()
  addSubcontractorPortalSecurityHeaders(response)

  // Log subcontractor activity for authenticated requests
  if (subcontractorAuth && !pathname.includes('/api/subcontractor/profile')) {
    await logSubcontractorActivity(
      subcontractorAuth.user.id,
      pathname.startsWith('/api/') ? 'api_request' : 'page_visit',
      { pathname },
      request.ip,
      request.headers.get('user-agent') || undefined
    )
  }

  return response
}