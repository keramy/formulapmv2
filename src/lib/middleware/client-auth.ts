/**
 * Client Portal Authentication Middleware Wrapper
 * Simplified version for integration with Next.js middleware
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleClientPortalRequest } from './client-portal-auth'

/**
 * Client Portal Middleware for Next.js middleware.ts
 * This is the main function to be called from the root middleware
 */
export async function clientPortalMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl
  
  // Only handle client portal and client portal API routes
  if (!pathname.startsWith('/client-portal') && !pathname.startsWith('/api/client-portal')) {
    return null // Not a client portal route, continue to next middleware
  }

  // Handle the client portal request
  return await handleClientPortalRequest(request)
}

/**
 * Client API authentication wrapper for API routes
 * Use this in API route handlers to authenticate client requests
 */
export function withClientAuth<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  options?: {
    requireAuth?: boolean
    allowedAccessLevels?: string[]
  }
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // Get client auth from request headers (set by middleware)
      const clientAuthHeader = request.headers.get('x-client-auth')
      
      if (!clientAuthHeader && options?.requireAuth !== false) {
        return NextResponse.json(
          { success: false, error: 'Client authentication required' },
          { status: 401 }
        )
      }

      let clientAuth = null
      if (clientAuthHeader) {
        try {
          clientAuth = JSON.parse(clientAuthHeader)
        } catch (error) {
          return NextResponse.json(
            { success: false, error: 'Invalid client authentication' },
            { status: 401 }
          )
        }

        // Check access levels if specified
        if (options?.allowedAccessLevels?.length) {
          if (!options.allowedAccessLevels.includes(clientAuth.user.access_level)) {
            return NextResponse.json(
              { success: false, error: 'Insufficient access level' },
              { status: 403 }
            )
          }
        }

        // Check if portal access is enabled
        if (!clientAuth.user.portal_access_enabled) {
          return NextResponse.json(
            { success: false, error: 'Portal access disabled' },
            { status: 403 }
          )
        }
      }

      // Add client auth to request
      ;(request as any).clientAuth = clientAuth

      return handler(request, ...args)
    } catch (error) {
      console.error('Client auth middleware error:', error)
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Get client auth from authenticated request
 */
export function getClientAuth(request: any) {
  return request.clientAuth
}

/**
 * Get client user from authenticated request
 */
export function getClientUser(request: any) {
  const clientAuth = getClientAuth(request)
  return clientAuth?.user || null
}

/**
 * Client session management
 */
interface ClientSession {
  id: string
  client_user_id: string
  ip_address: string
  user_agent: string
  created_at: string
  expires_at: string
  last_activity: string
  is_active: boolean
}

// In-memory session store (for development - use Redis/database in production)
const clientSessions = new Map<string, ClientSession>()

/**
 * Create client session
 */
export function createClientSession(
  clientUserId: string, 
  ipAddress: string, 
  userAgent: string
): ClientSession {
  const sessionId = generateSecureSessionId()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 8 * 60 * 60 * 1000) // 8 hours

  const session: ClientSession = {
    id: sessionId,
    client_user_id: clientUserId,
    ip_address: ipAddress,
    user_agent: userAgent,
    created_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    last_activity: now.toISOString(),
    is_active: true
  }

  clientSessions.set(sessionId, session)
  return session
}

/**
 * Generate secure session ID
 */
function generateSecureSessionId(): string {
  // Generate cryptographically secure random session ID
  const bytes = new Uint8Array(32)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes)
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256)
    }
  }
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Get client identifier for rate limiting and logging
 */
export function getClientIdentifier(request: NextRequest): string {
  // Use IP address + User Agent hash for identification
  const ip = request.ip || 
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
    'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  // Create a hash for the identifier
  return `${ip}-${hashString(userAgent)}`
}

/**
 * Simple string hash function
 */
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16)
}

/**
 * Rate limiting for client requests
 */
interface RateLimitOptions {
  maxRequests: number
  windowMs: number
  blockDurationMs?: number
  suspiciousThreshold?: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  blocked: boolean
}

const rateLimitStore = new Map<string, {
  count: number
  resetTime: number
  blocked: boolean
  blockUntil?: number
}>()

/**
 * Client rate limiting with suspicious activity detection
 */
export function clientRateLimit(
  identifier: string, 
  options: RateLimitOptions
): RateLimitResult {
  const { maxRequests, windowMs, blockDurationMs = 0, suspiciousThreshold = 0 } = options
  const now = Date.now()
  const key = `client-rate:${identifier}`

  // Clean up expired entries
  for (const [k, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now && (!entry.blockUntil || entry.blockUntil < now)) {
      rateLimitStore.delete(k)
    }
  }

  let entry = rateLimitStore.get(key)

  // Check if currently blocked
  if (entry?.blocked && entry.blockUntil && entry.blockUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      blocked: true
    }
  }

  // Initialize or reset entry
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + windowMs,
      blocked: false
    }
    rateLimitStore.set(key, entry)
    
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: entry.resetTime,
      blocked: false
    }
  }

  // Increment count
  entry.count++

  // Check if exceeded suspicious threshold
  if (suspiciousThreshold > 0 && entry.count >= suspiciousThreshold && blockDurationMs > 0) {
    entry.blocked = true
    entry.blockUntil = now + blockDurationMs
    
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      blocked: true
    }
  }

  // Check rate limit
  if (entry.count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      blocked: false
    }
  }

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - entry.count),
    resetTime: entry.resetTime,
    blocked: false
  }
}

/**
 * Detect suspicious activity patterns
 */
export function detectSuspiciousActivity(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || ''
  const acceptHeader = request.headers.get('accept') || ''
  
  // Check for common bot/automation patterns
  const suspiciousPatterns = [
    /bot|crawl|spider|scrape/i,
    /curl|wget|python|php|java/i,
    /automated|script|tool/i
  ]

  const isSuspiciousUserAgent = suspiciousPatterns.some(pattern => pattern.test(userAgent))
  
  // Check for missing or suspicious headers
  const hasSuspiciousHeaders = (
    !acceptHeader.includes('text/html') ||
    !request.headers.get('accept-language') ||
    !request.headers.get('accept-encoding')
  )

  return isSuspiciousUserAgent || hasSuspiciousHeaders
}

/**
 * Check client project access
 */
export async function checkClientProjectAccess(
  clientUserId: string,
  projectId: string,
  requiredPermission?: string
): Promise<boolean> {
  try {
    // In a real implementation, this would query the database
    // For now, return true to allow access (implement database logic later)
    console.log(`Checking project access for client ${clientUserId} to project ${projectId}`)
    return true
  } catch (error) {
    console.error('Error checking client project access:', error)
    return false
  }
}

/**
 * Check client document access
 */
export async function checkClientDocumentAccess(
  clientUserId: string,
  documentId: string,
  accessType: 'view' | 'download' | 'comment' | 'approve' = 'view'
): Promise<boolean> {
  try {
    // In a real implementation, this would query the database
    // For now, return true to allow access (implement database logic later)
    console.log(`Checking document access for client ${clientUserId} to document ${documentId} with ${accessType} permission`)
    return true
  } catch (error) {
    console.error('Error checking client document access:', error)
    return false
  }
}

/**
 * Enhanced activity logging for client portal
 */
interface ClientActivityLog {
  client_user_id: string
  activity_type: string
  action_taken: string
  description?: string
  ip_address?: string
  user_agent?: string
  session_id?: string
  metadata?: Record<string, any>
  timestamp: string
}

/**
 * Log client activity with comprehensive details
 */
export async function logClientActivity(
  clientUserId: string,
  activityType: string,
  details: {
    action_taken: string
    description?: string
    ip_address?: string
    user_agent?: string
    session_id?: string
    metadata?: Record<string, any>
  }
): Promise<void> {
  try {
    const logEntry: ClientActivityLog = {
      client_user_id: clientUserId,
      activity_type: activityType,
      action_taken: details.action_taken,
      description: details.description,
      ip_address: details.ip_address,
      user_agent: details.user_agent,
      session_id: details.session_id,
      metadata: details.metadata || {},
      timestamp: new Date().toISOString()
    }

    // In a real implementation, this would be saved to database
    console.log('Client Activity Log:', logEntry)

    // For security-critical activities, you might want to send alerts
    const criticalActivities = ['login', 'document_approve', 'profile_update']
    if (criticalActivities.includes(activityType)) {
      console.log('SECURITY LOG - Critical activity detected:', logEntry)
    }

  } catch (error) {
    console.error('Failed to log client activity:', error)
  }
}