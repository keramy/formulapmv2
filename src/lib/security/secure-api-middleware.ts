/**
 * Secure API Middleware
 * Enhanced version of api-middleware with comprehensive security features
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission, Permission } from '@/lib/permissions'
import { z } from 'zod'
import { 
  validateRequestParams, 
  checkRateLimit, 
  RateLimitConfig,
  sanitizeHTML,
  isValidUUID
} from './input-validation'
import { createSecureQuery, validateSearchParams } from './query-builder'

// Enhanced API response types with security metadata
export interface SecureApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  security?: {
    rateLimitRemaining?: number
    rateLimitReset?: number
    requestId: string
    timestamp: string
  }
  pagination?: {
    page: number
    limit: number
    total: number
    has_more: boolean
  }
}

// Security configuration for different endpoints
export interface SecurityConfig {
  rateLimit?: RateLimitConfig
  requireAuth?: boolean
  requirePermission?: Permission
  requireRoles?: string[]
  validateInput?: boolean
  sanitizeOutput?: boolean
  logRequests?: boolean
  blockSuspiciousRequests?: boolean
}

// Default security configurations
const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    keyGenerator: (req) => req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  },
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
    keyGenerator: (req) => req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  },
  upload: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 uploads per minute
    keyGenerator: (req) => req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  }
}

/**
 * Enhanced authentication wrapper with comprehensive security
 */
export function withSecureAuth<T extends any[]>(
  handler: (request: NextRequest, context: { user: any, profile: any, requestId: string }, ...args: T) => Promise<NextResponse>,
  config: SecurityConfig = {}
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const requestId = generateRequestId()
    const startTime = Date.now()

    try {
      // 1. Rate limiting check
      if (config.rateLimit) {
        const rateLimitResult = checkRateLimit(config.rateLimit, request)
        if (!rateLimitResult.allowed) {
          return createSecureErrorResponse(
            'Rate limit exceeded',
            429,
            requestId,
            {
              rateLimitRemaining: rateLimitResult.remaining,
              rateLimitReset: rateLimitResult.resetTime
            }
          )
        }
      }

      // 2. Suspicious request detection
      if (config.blockSuspiciousRequests) {
        const suspiciousCheck = detectSuspiciousRequest(request)
        if (suspiciousCheck.isSuspicious) {
          console.warn(`🚨 Suspicious request blocked: ${suspiciousCheck.reason}`, {
            requestId,
            url: request.url,
            method: request.method,
            userAgent: request.headers.get('user-agent'),
            ip: request.headers.get('x-forwarded-for')
          })
          return createSecureErrorResponse('Request blocked', 403, requestId)
        }
      }

      // 3. Authentication check
      let user = null
      let profile = null
      
      if (config.requireAuth !== false) {
        const authResult = await verifyAuth(request)
        if (authResult.error) {
          return createSecureErrorResponse(authResult.error, 401, requestId)
        }
        user = authResult.user
        profile = authResult.profile
      }

      // 4. Permission checks
      if (config.requirePermission && profile && !hasPermission(profile.role, config.requirePermission)) {
        return createSecureErrorResponse(
          `Insufficient permissions. Required: ${config.requirePermission}`,
          403,
          requestId
        )
      }

      if (config.requireRoles && profile && !config.requireRoles.includes(profile.role)) {
        return createSecureErrorResponse(
          `Access denied. Required roles: ${config.requireRoles.join(', ')}`,
          403,
          requestId
        )
      }

      // 5. Request logging
      if (config.logRequests) {
        console.log(`🔐 Secure API Request: ${request.method} ${request.url}`, {
          requestId,
          userId: user?.id,
          userRole: profile?.role,
          ip: request.headers.get('x-forwarded-for'),
          userAgent: request.headers.get('user-agent')?.substring(0, 100)
        })
      }

      // 6. Call the handler
      const response = await handler(request, { user, profile, requestId }, ...args)

      // 7. Add security headers to response
      const secureResponse = addSecurityHeaders(response, requestId)

      // 8. Log response time
      const duration = Date.now() - startTime
      if (duration > 5000) { // Log slow requests
        console.warn(`⚠️ Slow API request: ${request.method} ${request.url} took ${duration}ms`, {
          requestId,
          userId: user?.id
        })
      }

      return secureResponse

    } catch (error) {
      console.error(`❌ Secure API error [${requestId}]:`, error)
      return createSecureErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        500,
        requestId
      )
    }
  }
}

/**
 * Input validation middleware with comprehensive sanitization
 */
export function withSecureValidation<T>(schema: z.ZodSchema<T>) {
  return function<U extends any[]>(
    handler: (request: NextRequest, validatedData: T, ...args: U) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: U): Promise<NextResponse> => {
      const requestId = generateRequestId()
      
      try {
        let body: any = {}
        
        // Parse request body safely
        if (request.method !== 'GET' && request.method !== 'DELETE') {
          const contentType = request.headers.get('content-type') || ''
          
          if (contentType.includes('application/json')) {
            try {
              const rawBody = await request.text()
              
              // Check for potential JSON injection
              if (rawBody.length > 1024 * 1024) { // 1MB limit
                return createSecureErrorResponse('Request body too large', 413, requestId)
              }
              
              body = JSON.parse(rawBody)
            } catch (error) {
              return createSecureErrorResponse('Invalid JSON format', 400, requestId)
            }
          } else if (contentType.includes('multipart/form-data')) {
            // Handle file uploads separately
            body = await request.formData()
          }
        }

        // Validate and sanitize input
        const validationResult = validateRequestParams(schema, body)
        if (!validationResult.success) {
          console.warn(`🚨 Validation failed [${requestId}]:`, {
            errors: validationResult.error.errors,
            url: request.url,
            method: request.method
          })
          
          return createSecureErrorResponse(
            'Validation failed',
            400,
            requestId,
            { details: validationResult.error.errors }
          )
        }

        // Sanitize validated data
        const sanitizedData = sanitizeValidatedData(validationResult.data)

        return await handler(request, sanitizedData, ...args)
        
      } catch (error) {
        console.error(`❌ Validation middleware error [${requestId}]:`, error)
        return createSecureErrorResponse('Validation error', 500, requestId)
      }
    }
  }
}

/**
 * Secure database operation wrapper
 */
export async function withSecureDatabase<T>(
  operation: (supabase: any) => Promise<{ data: T | null, error: any }>,
  requestId: string = generateRequestId()
): Promise<{ data: T | null, error: string | null }> {
  try {
    const supabase = createServerClient()
    const startTime = Date.now()
    
    const { data, error } = await operation(supabase)
    
    const duration = Date.now() - startTime
    
    // Log slow database operations
    if (duration > 3000) {
      console.warn(`⚠️ Slow database operation [${requestId}]: ${duration}ms`)
    }

    if (error) {
      // Log database errors securely (without exposing sensitive data)
      console.error(`❌ Database error [${requestId}]:`, {
        code: error.code,
        message: error.message,
        hint: error.hint
      })

      // Return user-friendly error messages
      if (error.code === 'PGRST116') {
        return { data: null, error: 'Record not found' }
      } else if (error.code === 'PGRST302') {
        return { data: null, error: 'Access denied' }
      } else if (error.code?.startsWith('23')) {
        return { data: null, error: 'Data validation error' }
      } else if (error.code === '42501') {
        return { data: null, error: 'Insufficient database permissions' }
      } else {
        return { data: null, error: 'Database operation failed' }
      }
    }

    return { data, error: null }
  } catch (error) {
    console.error(`❌ Database wrapper error [${requestId}]:`, error)
    return { data: null, error: 'Database connection failed' }
  }
}

/**
 * Create secure success response
 */
export function createSecureSuccessResponse<T>(
  data: T,
  requestId: string = generateRequestId(),
  pagination?: SecureApiResponse['pagination']
): NextResponse {
  const response: SecureApiResponse<T> = {
    success: true,
    data,
    security: {
      requestId,
      timestamp: new Date().toISOString()
    },
    ...(pagination && { pagination })
  }

  return NextResponse.json(response)
}

/**
 * Create secure error response
 */
export function createSecureErrorResponse(
  error: string,
  status: number = 500,
  requestId: string = generateRequestId(),
  details?: any
): NextResponse {
  const response: SecureApiResponse = {
    success: false,
    error,
    security: {
      requestId,
      timestamp: new Date().toISOString()
    },
    ...(details && { details })
  }

  return NextResponse.json(response, { status })
}

/**
 * Parse and validate query parameters securely
 */
export function parseSecureQueryParams(request: NextRequest): Record<string, any> {
  const { searchParams } = new URL(request.url)
  const params: Record<string, any> = {}

  // Convert URLSearchParams to plain object
  for (const [key, value] of searchParams.entries()) {
    params[key] = value
  }

  // Validate and sanitize parameters
  return validateSearchParams(params)
}

/**
 * Generate unique request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Detect suspicious request patterns
 */
function detectSuspiciousRequest(request: NextRequest): { isSuspicious: boolean; reason?: string } {
  const url = request.url
  const userAgent = request.headers.get('user-agent') || ''
  const method = request.method

  // Check for common attack patterns
  const suspiciousPatterns = [
    /[<>'"]/g, // XSS attempts
    /union\s+select/i, // SQL injection
    /script\s*:/i, // Script injection
    /javascript\s*:/i, // JavaScript injection
    /\.\.\/\.\.\//g, // Path traversal
    /etc\/passwd/i, // File access attempts
    /proc\/self/i, // Process access attempts
    /cmd\.exe/i, // Command execution
    /powershell/i, // PowerShell execution
  ]

  // Check URL for suspicious patterns
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url)) {
      return { isSuspicious: true, reason: `Suspicious URL pattern: ${pattern}` }
    }
  }

  // Check for suspicious user agents
  const suspiciousUserAgents = [
    /sqlmap/i,
    /nikto/i,
    /nessus/i,
    /burp/i,
    /nmap/i,
    /masscan/i,
    /zap/i
  ]

  for (const pattern of suspiciousUserAgents) {
    if (pattern.test(userAgent)) {
      return { isSuspicious: true, reason: `Suspicious user agent: ${userAgent}` }
    }
  }

  // Check for unusual request methods
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']
  if (!allowedMethods.includes(method)) {
    return { isSuspicious: true, reason: `Unusual HTTP method: ${method}` }
  }

  return { isSuspicious: false }
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse, requestId: string): NextResponse {
  // Clone the response to avoid modifying the original
  const secureResponse = new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  })

  // Add security headers
  secureResponse.headers.set('X-Request-ID', requestId)
  secureResponse.headers.set('X-Content-Type-Options', 'nosniff')
  secureResponse.headers.set('X-Frame-Options', 'DENY')
  secureResponse.headers.set('X-XSS-Protection', '1; mode=block')
  secureResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  secureResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  return secureResponse
}

/**
 * Sanitize validated data to prevent any remaining security issues
 */
function sanitizeValidatedData(data: any): any {
  if (typeof data === 'string') {
    return sanitizeHTML(data)
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeValidatedData(item))
  }
  
  if (data && typeof data === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeValidatedData(value)
    }
    return sanitized
  }
  
  return data
}

/**
 * Create pagination helper with security validation
 */
export function createSecurePagination(page: number, limit: number, total: number) {
  // Validate and sanitize pagination parameters
  const safePage = Math.max(1, Math.min(1000, page))
  const safeLimit = Math.max(1, Math.min(100, limit))
  const safeTotal = Math.max(0, total)

  return {
    page: safePage,
    limit: safeLimit,
    total: safeTotal,
    has_more: safePage * safeLimit < safeTotal
  }
}