import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { authMonitor } from '@/lib/auth-monitoring'

export async function GET(request: NextRequest) {
  const correlationId = Math.random().toString(36).substr(2, 9)
  const startTime = Date.now()

  try {
    console.log(`🔍 [auth-state:${correlationId}] Admin auth state request`, {
      timestamp: new Date().toISOString(),
      url: request.url,
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    })

    // Verify admin access
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const supabase = createServerClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid admin token' },
        { status: 401 }
      )
    }

    // Check if user has admin privileges
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, email')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Admin profile not found' },
        { status: 403 }
      )
    }

    const isAdmin = ['management', 'admin', 'management'].includes(profile.role)
    if (!isAdmin) {
      console.warn(`🚫 [auth-state:${correlationId}] Non-admin access attempt`, {
        userId: user.id,
        userEmail: profile.email,
        userRole: profile.role
      })
      return NextResponse.json(
        { success: false, error: 'Admin privileges required' },
        { status: 403 }
      )
    }

    // Get specific user ID from query params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (userId) {
      // Return specific user's auth state
      const userMetrics = authMonitor.getUserMetrics(userId)
      
      // Get user details
      const { data: userProfile, error: userProfileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      // Get user's current session info
      let sessionInfo = null
      try {
        const { data: { user: sessionUser }, error: sessionError } = await supabase.auth.getUser()
        if (sessionUser && sessionUser.id === userId) {
          sessionInfo = {
            isCurrentUser: true,
            lastSignIn: sessionUser.last_sign_in_at,
            emailConfirmed: !!sessionUser.confirmed_at,
            phone: sessionUser.phone,
            createdAt: sessionUser.created_at
          }
        }
      } catch (error) {
        // Session info not available
      }

      return NextResponse.json({
        success: true,
        data: {
          userId,
          profile: userProfile,
          profileError: userProfileError?.message,
          sessionInfo,
          authMetrics: userMetrics,
          circuitBreakerState: await getCircuitBreakerState(userId),
          timestamp: new Date().toISOString()
        }
      })
    }

    // Return system-wide auth state
    const metrics = authMonitor.getMetrics()
    const activeLoops = authMonitor.getActiveLoops()
    
    // Get recent failed users
    const recentFailedUsers = await getRecentFailedUsers(supabase)
    
    // Get circuit breaker statistics
    const circuitBreakerStats = await getCircuitBreakerStats()

    console.log(`✅ [auth-state:${correlationId}] Admin auth state retrieved`, {
      duration: Date.now() - startTime,
      adminUserId: user.id,
      totalFailures: metrics.totalAuthFailures,
      activeLoops: activeLoops.length
    })

    return NextResponse.json({
      success: true,
      data: {
        systemMetrics: metrics,
        activeLoops,
        recentFailedUsers,
        circuitBreakerStats,
        timestamp: new Date().toISOString(),
        correlationId
      }
    })

  } catch (error) {
    console.error(`❌ [auth-state:${correlationId}] Admin auth state failed`, {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve auth state',
      correlationId
    }, { status: 500 })
  }
}

async function getRecentFailedUsers(supabase: any) {
  try {
    // This would typically come from a separate auth_events table
    // For now, we'll use the monitoring data
    const metrics = authMonitor.getMetrics()
    const userIds = [...new Set(metrics.recentFailures.map(f => f.userId).filter(Boolean))]
    
    if (userIds.length === 0) return []

    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('id, email, role, first_name, last_name, is_active')
      .in('id', userIds)
      .limit(10)

    return users || []
  } catch (error) {
    console.error('Failed to get recent failed users:', error)
    return []
  }
}

async function getCircuitBreakerStats() {
  try {
    if (typeof window === 'undefined') return null

    const stats = localStorage.getItem('auth_circuit_breaker_stats')
    return stats ? JSON.parse(stats) : null
  } catch (error) {
    return null
  }
}

async function getCircuitBreakerState(userId: string) {
  try {
    if (typeof window === 'undefined') return null

    const state = localStorage.getItem(`auth_circuit_breaker_state_${userId}`)
    return state ? JSON.parse(state) : null
  } catch (error) {
    return null
  }
}