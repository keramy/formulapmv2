import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, supabaseAdmin } from '@/lib/supabase'
import { hasPermission, Permission } from '@/lib/permissions'
import { UserRole } from '@/types/auth'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email: string
    role: UserRole
    profile: any
  }
}

// Auth validation cache with 30-second TTL
interface AuthCacheEntry {
  user: any
  profile: any
  timestamp: number
}

const authCache = new Map<string, AuthCacheEntry>()
const CACHE_TTL = 30 * 1000 // 30 seconds

// Clean up expired cache entries
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of authCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      authCache.delete(key)
    }
  }
}, 60 * 1000) // Clean up every minute

// Helper function for exponential backoff
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Retry wrapper for transient failures
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  correlationId: string = 'unknown'
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxRetries) {
        console.error(`❌ [retry:${correlationId}] Max retries reached`, {
          attempt: attempt + 1,
          maxRetries: maxRetries + 1,
          lastError: lastError.message
        })
        throw lastError
      }
      
      // Check if error is retryable
      const isRetryable = error instanceof Error && (
        error.message.includes('network') ||
        error.message.includes('timeout') ||
        error.message.includes('connection') ||
        error.message.includes('ECONNRESET') ||
        error.message.includes('ETIMEDOUT')
      )
      
      if (!isRetryable) {
        console.log(`⚠️ [retry:${correlationId}] Non-retryable error`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          attempt: attempt + 1
        })
        throw error
      }
      
      const delay = baseDelay * Math.pow(2, attempt)
      console.log(`🔄 [retry:${correlationId}] Retrying operation`, {
        attempt: attempt + 1,
        maxRetries: maxRetries + 1,
        delay,
        error: lastError.message
      })
      
      await sleep(delay)
    }
  }
  
  throw lastError
}

// Middleware to verify JWT token and get user
export async function verifyAuth(request: NextRequest): Promise<{
  user: any | null
  profile: any | null
  error: string | null
}> {
  const correlationId = Math.random().toString(36).substr(2, 9)
  const startTime = Date.now()
  
  try {
    const authHeader = request.headers.get('authorization')
    const requestUrl = request.url
    const requestMethod = request.method
    
    console.log(`🔐 [verifyAuth:${correlationId}] Starting auth verification`, { 
      url: requestUrl,
      method: requestMethod,
      hasAuthHeader: !!authHeader,
      authHeaderStart: authHeader?.substring(0, 20) + '...',
      userAgent: request.headers.get('user-agent')?.substring(0, 50),
      timestamp: new Date().toISOString()
    })
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log(`❌ [verifyAuth:${correlationId}] No valid auth header`, {
        url: requestUrl,
        method: requestMethod,
        authHeader: authHeader?.substring(0, 50),
        duration: Date.now() - startTime
      })
      return { user: null, profile: null, error: 'No authentication token provided' }
    }

    const token = authHeader.substring(7)
    
    // Check cache first (temporarily disabled for debugging)
    const cacheKey = `auth:${token.substring(0, 20)}` // Use first 20 chars as cache key
    const cached = authCache.get(cacheKey)
    
    // Clear cache to force fresh fetch for debugging
    authCache.delete(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`💨 [verifyAuth:${correlationId}] Cache hit`, {
        userId: cached.user.id,
        cacheAge: Date.now() - cached.timestamp,
        duration: Date.now() - startTime
      })
      return { user: cached.user, profile: cached.profile, error: null }
    }

    const supabase = createServerClient()
    
    console.log(`🔐 [verifyAuth:${correlationId}] Token extracted`, { 
      tokenLength: token.length,
      tokenStart: token.substring(0, 20) + '...',
      tokenEnd: '...' + token.substring(token.length - 10),
      isValidJWT: token.split('.').length === 3
    })

    // Verify the JWT token with retry logic
    const tokenVerifyStart = Date.now()
    const tokenResult = await retryOperation(
      async () => {
        const result = await supabase.auth.getUser(token)
        if (result.error) throw new Error(result.error.message)
        return result
      },
      3,
      1000,
      correlationId
    )
    const { data: { user }, error: userError } = tokenResult
    const tokenVerifyDuration = Date.now() - tokenVerifyStart
    
    console.log(`🔐 [verifyAuth:${correlationId}] Token verification result`, { 
      url: requestUrl,
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      verifyDuration: tokenVerifyDuration,
      userRole: user?.role,
      userConfirmedAt: user?.confirmed_at,
      userLastSignInAt: user?.last_sign_in_at
    })
    
    if (!user) {
      console.log(`❌ [verifyAuth:${correlationId}] Token verification failed`, {
        url: requestUrl,
        tokenWasProvided: !!token,
        tokenLength: token?.length,
        duration: Date.now() - startTime,
        possibleCauses: [
          'Token expired',
          'Token malformed',
          'Token revoked',
          'Network connectivity issue',
          'Supabase service issue'
        ]
      })
      return { user: null, profile: null, error: 'Invalid or expired token' }
    }

    // Get user profile with retry logic using service role
    console.log(`🔐 [verifyAuth:${correlationId}] Fetching user profile`, { userId: user.id })
    const profileFetchStart = Date.now()
    const profileResult = await retryOperation(
      async () => {
        // Use the supabaseAdmin client to bypass RLS for profile fetching
        console.log(`🔐 [verifyAuth:${correlationId}] Using supabaseAdmin for profile fetch`)
        console.log(`🔐 [verifyAuth:${correlationId}] Admin client config`, {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          serviceKeyStart: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...'
        })
        
        const result = await supabaseAdmin
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        console.log(`🔐 [verifyAuth:${correlationId}] Admin client result`, { 
          hasData: !!result.data,
          error: result.error?.message,
          errorCode: result.error?.code,
          userId: user.id
        })
        
        // Don't throw error for profile not found, let it be handled later
        if (result.error && result.error.code !== 'PGRST116') {
          console.log(`🔐 [verifyAuth:${correlationId}] Profile fetch error that won't be retried`, {
            error: result.error?.message,
            code: result.error?.code
          })
        }
        return result
      },
      3,
      1000,
      correlationId
    )
    const { data: profile, error: profileError } = profileResult
    const profileFetchDuration = Date.now() - profileFetchStart

    console.log(`🔐 [verifyAuth:${correlationId}] Profile fetch result`, { 
      hasProfile: !!profile,
      profileId: profile?.id,
      profileRole: profile?.role,
      profileActive: profile?.is_active,
      fetchDuration: profileFetchDuration,
      profileEmail: profile?.email,
      profileCompany: profile?.company,
      profileCreatedAt: profile?.created_at,
      profileUpdatedAt: profile?.updated_at
    })

    if (!profile) {
      console.log(`❌ [verifyAuth:${correlationId}] Profile fetch failed`, {
        userId: user.id,
        userEmail: user.email,
        duration: Date.now() - startTime,
        possibleCauses: [
          'Profile not found in database',
          'RLS policy blocking access',
          'Database connection issue',
          'Profile table schema mismatch'
        ]
      })
      return { user, profile: null, error: 'User profile not found' }
    }

    if (!profile.is_active) {
      console.log(`❌ [verifyAuth:${correlationId}] Account deactivated`, { 
        userId: user.id,
        profileRole: profile.role,
        duration: Date.now() - startTime
      })
      return { user, profile, error: 'Account is deactivated' }
    }

    // Cache successful authentication
    authCache.set(cacheKey, {
      user,
      profile,
      timestamp: Date.now()
    })

    console.log(`✅ [verifyAuth:${correlationId}] Auth verification successful`, { 
      userId: user.id,
      userEmail: user.email,
      profileRole: profile.role,
      profileActive: profile.is_active,
      totalDuration: Date.now() - startTime,
      tokenVerifyDuration,
      profileFetchDuration,
      cached: false
    })
    return { user, profile, error: null }
  } catch (error) {
    console.error(`❌ [verifyAuth:${correlationId}] Auth verification exception:`, {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      duration: Date.now() - startTime,
      url: request.url,
      method: request.method
    })
    return { user: null, profile: null, error: 'Authentication failed' }
  }
}

// Middleware to check specific permissions
export async function requirePermission(
  request: NextRequest,
  permission: Permission
): Promise<NextResponse | null> {
  const { user, profile, error } = await verifyAuth(request)

  if (error || !user || !profile) {
    return NextResponse.json(
      { error: error || 'Authentication required' },
      { status: 401 }
    )
  }

  if (!hasPermission(profile.role, permission)) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  // Add user info to request for use in API handlers
  const response = NextResponse.next()
  response.headers.set('x-user-id', user.id)
  response.headers.set('x-user-role', profile.role)
  
  return null // Allow request to continue
}

// Middleware to check specific roles
export async function requireRole(
  request: NextRequest,
  allowedRoles: UserRole[]
): Promise<NextResponse | null> {
  const { user, profile, error } = await verifyAuth(request)

  if (error || !user || !profile) {
    return NextResponse.json(
      { error: error || 'Authentication required' },
      { status: 401 }
    )
  }

  if (!allowedRoles.includes(profile.role)) {
    return NextResponse.json(
      { error: 'Insufficient role privileges' },
      { status: 403 }
    )
  }

  return null // Allow request to continue
}

// Middleware to require management level access
export async function requireManagement(request: NextRequest): Promise<NextResponse | null> {
  return requireRole(request, [
    'company_owner',
    'general_manager', 
    'deputy_general_manager',
    'technical_director',
    'admin'
  ])
}

// Middleware to require admin level access
export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  return requireRole(request, ['company_owner', 'admin'])
}

// Helper function to create protected API handler
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  options?: {
    permission?: Permission
    roles?: UserRole[]
    requireManagement?: boolean
    requireAdmin?: boolean
  }
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // Check authentication
      const { user, profile, error } = await verifyAuth(request)

      if (error || !user || !profile) {
        return NextResponse.json(
          { error: error || 'Authentication required' },
          { status: 401 }
        )
      }

      // Check specific permission
      if (options?.permission && !hasPermission(profile.role, options.permission)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      // Check specific roles
      if (options?.roles && !options.roles.includes(profile.role)) {
        return NextResponse.json(
          { error: 'Insufficient role privileges' },
          { status: 403 }
        )
      }

      // Check management requirement
      if (options?.requireManagement) {
        const managementRoles: UserRole[] = [
          'company_owner',
          'general_manager',
          'deputy_general_manager',
          'technical_director',
          'admin'
        ]
        if (!managementRoles.includes(profile.role)) {
          return NextResponse.json(
            { error: 'Management access required' },
            { status: 403 }
          )
        }
      }

      // Check admin requirement
      if (options?.requireAdmin) {
        const adminRoles: UserRole[] = ['company_owner', 'admin']
        if (!adminRoles.includes(profile.role)) {
          return NextResponse.json(
            { error: 'Admin access required' },
            { status: 403 }
          )
        }
      }

      // Attach user info to request
      ;(request as AuthenticatedRequest).user = {
        id: user.id,
        email: user.email!,
        role: profile.role,
        profile
      }

      return handler(request, ...args)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// Utility to get user from authenticated request
export function getAuthenticatedUser(request: AuthenticatedRequest) {
  return request.user
}

// Rate limiting helper (basic implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean {
  const now = Date.now()
  const resetTime = now + windowMs
  
  const existing = requestCounts.get(identifier)
  
  if (!existing || now > existing.resetTime) {
    requestCounts.set(identifier, { count: 1, resetTime })
    return true
  }
  
  if (existing.count >= maxRequests) {
    return false
  }
  
  existing.count++
  return true
}

// Clean up old rate limit entries
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime) {
      requestCounts.delete(key)
    }
  }
}, 5 * 60 * 1000) // Clean up every 5 minutes