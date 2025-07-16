import { NextRequest, NextResponse } from 'next/server'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const correlationId = Math.random().toString(36).substr(2, 9)
  const startTime = Date.now()

  try {
    console.log(`🔍 [diagnostics:${correlationId}] Starting auth diagnostics`, {
      timestamp: new Date().toISOString(),
      url: request.url,
      method: request.method,
      userAgent: request.headers.get('user-agent')?.substring(0, 50)
    })

    const authHeader = request.headers.get('authorization')
    const diagnostics = {
      timestamp: new Date().toISOString(),
      correlationId,
      checks: {
        authHeader: {
          present: !!authHeader,
          format: authHeader ? (authHeader.startsWith('Bearer ') ? 'valid' : 'invalid') : 'missing',
          length: authHeader ? authHeader.length : 0
        },
        token: {
          present: false,
          format: 'unknown',
          length: 0,
          isJWT: false
        },
        user: {
          authenticated: false,
          id: null as string | null,
          email: null as string | null,
          confirmed: false,
          lastSignIn: null as string | null
        },
        profile: {
          exists: false,
          id: null as string | null,
          role: null as string | null,
          active: false,
          hasPermissions: false,
          createdAt: null as string | null,
          updatedAt: null as string | null
        },
        rls: {
          accessible: false,
          error: null as string | null
        }
      },
      performance: {
        totalDuration: 0,
        tokenValidationDuration: 0,
        profileFetchDuration: 0
      },
      errors: [] as string[],
      recommendations: [] as string[]
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      diagnostics.errors.push('No valid authorization header found')
      diagnostics.recommendations.push('Include Authorization header with Bearer token')
      
      return NextResponse.json({
        success: false,
        diagnostics,
        overall: 'FAILED - No authentication token'
      })
    }

    const token = authHeader.substring(7)
    diagnostics.checks.token = {
      present: true,
      format: 'bearer',
      length: token.length,
      isJWT: token.split('.').length === 3
    }

    if (!diagnostics.checks.token.isJWT) {
      diagnostics.errors.push('Token is not a valid JWT format')
      diagnostics.recommendations.push('Ensure token is a valid JWT with 3 parts separated by dots')
    }

    const supabase = createServerClient()
    
    // Test token validation
    const tokenValidationStart = Date.now()
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    diagnostics.performance.tokenValidationDuration = Date.now() - tokenValidationStart

    if (userError || !user) {
      diagnostics.errors.push(`Token validation failed: ${userError?.message || 'Unknown error'}`)
      diagnostics.recommendations.push('Refresh your authentication token')
      
      if (userError?.message?.includes('expired')) {
        diagnostics.recommendations.push('Token has expired, obtain a new one')
      }
      if (userError?.message?.includes('invalid')) {
        diagnostics.recommendations.push('Token is malformed or invalid')
      }

      return NextResponse.json({
        success: false,
        diagnostics,
        overall: 'FAILED - Token validation failed'
      })
    }

    diagnostics.checks.user = {
      authenticated: true,
      id: user.id,
      email: user.email || null,
      confirmed: !!user.confirmed_at,
      lastSignIn: user.last_sign_in_at || null
    }

    // Test profile fetch
    const profileFetchStart = Date.now()
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    diagnostics.performance.profileFetchDuration = Date.now() - profileFetchStart

    if (profileError) {
      diagnostics.errors.push(`Profile fetch failed: ${profileError.message}`)
      diagnostics.checks.rls.error = profileError.message
      
      if (profileError.code === 'PGRST116') {
        diagnostics.recommendations.push('Profile does not exist - use /api/auth/recover-profile to create it')
      } else if (profileError.code === 'PGRST302') {
        diagnostics.recommendations.push('RLS policy blocking profile access')
      } else {
        diagnostics.recommendations.push('Database connection or query issue')
      }
    } else if (!profile) {
      diagnostics.errors.push('Profile not found')
      diagnostics.recommendations.push('Use /api/auth/recover-profile to create missing profile')
    } else {
      diagnostics.checks.profile = {
        exists: true,
        id: profile.id,
        role: profile.role,
        active: profile.is_active,
        hasPermissions: !!(profile.permissions && typeof profile.permissions === 'object'),
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      }
      diagnostics.checks.rls.accessible = true

      if (!profile.is_active) {
        diagnostics.errors.push('Profile is deactivated')
        diagnostics.recommendations.push('Contact administrator to activate your account')
      }

      if (!profile.permissions || typeof profile.permissions !== 'object') {
        diagnostics.errors.push('Profile permissions are corrupted')
        diagnostics.recommendations.push('Use /api/auth/recover-profile to repair permissions')
      }

      // Check for missing required fields
      if (!profile.first_name || !profile.last_name || !profile.email) {
        diagnostics.errors.push('Profile has missing required fields')
        diagnostics.recommendations.push('Use /api/auth/recover-profile to repair profile data')
      }
    }

    diagnostics.performance.totalDuration = Date.now() - startTime

    // Overall assessment
    let overall = 'HEALTHY'
    if (diagnostics.errors.length > 0) {
      overall = profile ? 'DEGRADED' : 'FAILED'
    }

    // Performance recommendations
    if (diagnostics.performance.tokenValidationDuration > 1000) {
      diagnostics.recommendations.push('Token validation is slow - possible network issues')
    }
    if (diagnostics.performance.profileFetchDuration > 1000) {
      diagnostics.recommendations.push('Profile fetch is slow - possible database issues')
    }

    console.log(`✅ [diagnostics:${correlationId}] Diagnostics completed`, {
      overall,
      errorsCount: diagnostics.errors.length,
      duration: diagnostics.performance.totalDuration,
      userId: user.id,
      hasProfile: !!profile
    })

    return createSuccessResponse({
      diagnostics,
      overall,
      timestamp: new Date().toISOString(),
      correlationId
    })

  } catch (error) {
    console.error(`❌ [diagnostics:${correlationId}] Diagnostics failed`, {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    })

    return createErrorResponse(
      error instanceof Error ? error.message : 'Diagnostics failed',
      500
    )
  }
}