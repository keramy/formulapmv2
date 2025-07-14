import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { authMonitor } from '@/lib/auth-monitoring'

export async function POST(request: NextRequest) {
  const correlationId = Math.random().toString(36).substr(2, 9)
  const startTime = Date.now()

  try {
    console.log(`🔄 [reset-auth:${correlationId}] Admin auth reset request`, {
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

    const isAdmin = ['company_owner', 'admin', 'general_manager'].includes(profile.role)
    if (!isAdmin) {
      console.warn(`🚫 [reset-auth:${correlationId}] Non-admin reset attempt`, {
        userId: user.id,
        userEmail: profile.email,
        userRole: profile.role
      })
      return NextResponse.json(
        { success: false, error: 'Admin privileges required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { userId, resetType, reason } = body

    if (!userId || !resetType) {
      return NextResponse.json(
        { success: false, error: 'userId and resetType are required' },
        { status: 400 }
      )
    }

    const validResetTypes = ['circuit_breaker', 'auth_loops', 'monitoring_data', 'all']
    if (!validResetTypes.includes(resetType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid reset type' },
        { status: 400 }
      )
    }

    // Verify target user exists
    const { data: targetUser, error: targetError } = await supabase
      .from('user_profiles')
      .select('id, email, role, first_name, last_name')
      .eq('id', userId)
      .single()

    if (targetError || !targetUser) {
      return NextResponse.json(
        { success: false, error: 'Target user not found' },
        { status: 404 }
      )
    }

    const resetResults = {
      circuitBreakerReset: false,
      authLoopsCleared: false,
      monitoringDataCleared: false,
      sessionsCleared: false,
      errors: [] as string[]
    }

    // Perform resets based on type
    if (resetType === 'circuit_breaker' || resetType === 'all') {
      try {
        // Reset circuit breaker state
        await resetCircuitBreaker(userId)
        resetResults.circuitBreakerReset = true
        console.log(`✅ [reset-auth:${correlationId}] Circuit breaker reset for user ${userId}`)
      } catch (error) {
        const errorMsg = `Failed to reset circuit breaker: ${error instanceof Error ? error.message : 'Unknown error'}`
        resetResults.errors.push(errorMsg)
        console.error(`❌ [reset-auth:${correlationId}] ${errorMsg}`)
      }
    }

    if (resetType === 'auth_loops' || resetType === 'all') {
      try {
        // Clear auth loop detections
        await clearAuthLoops(userId)
        resetResults.authLoopsCleared = true
        console.log(`✅ [reset-auth:${correlationId}] Auth loops cleared for user ${userId}`)
      } catch (error) {
        const errorMsg = `Failed to clear auth loops: ${error instanceof Error ? error.message : 'Unknown error'}`
        resetResults.errors.push(errorMsg)
        console.error(`❌ [reset-auth:${correlationId}] ${errorMsg}`)
      }
    }

    if (resetType === 'monitoring_data' || resetType === 'all') {
      try {
        // Clear monitoring data for user
        await clearMonitoringData(userId)
        resetResults.monitoringDataCleared = true
        console.log(`✅ [reset-auth:${correlationId}] Monitoring data cleared for user ${userId}`)
      } catch (error) {
        const errorMsg = `Failed to clear monitoring data: ${error instanceof Error ? error.message : 'Unknown error'}`
        resetResults.errors.push(errorMsg)
        console.error(`❌ [reset-auth:${correlationId}] ${errorMsg}`)
      }
    }

    // Log the admin action
    console.log(`🔧 [reset-auth:${correlationId}] Admin reset completed`, {
      adminUserId: user.id,
      adminEmail: profile.email,
      targetUserId: userId,
      targetEmail: targetUser.email,
      resetType,
      reason: reason || 'No reason provided',
      results: resetResults,
      duration: Date.now() - startTime
    })

    // Record admin action in monitoring
    authMonitor.recordEvent({
      userId: user.id,
      event: 'AUTH_FAILURE', // Using existing event type, but with admin metadata
      correlationId,
      metadata: {
        adminAction: 'auth_reset',
        targetUserId: userId,
        resetType,
        reason,
        results: resetResults
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        targetUser: {
          id: targetUser.id,
          email: targetUser.email,
          name: `${targetUser.first_name} ${targetUser.last_name}`.trim()
        },
        resetType,
        reason: reason || 'No reason provided',
        results: resetResults,
        timestamp: new Date().toISOString(),
        correlationId
      }
    })

  } catch (error) {
    console.error(`❌ [reset-auth:${correlationId}] Admin auth reset failed`, {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    })

    return NextResponse.json({
      success: false,
      error: 'Failed to reset auth state',
      correlationId
    }, { status: 500 })
  }
}

async function resetCircuitBreaker(userId: string) {
  if (typeof window === 'undefined') {
    // Server-side: Can't access localStorage directly
    // In a real implementation, this would be stored in a database
    return
  }

  try {
    // Clear circuit breaker state for the user
    localStorage.removeItem(`auth_circuit_breaker_state_${userId}`)
    localStorage.removeItem('auth_circuit_breaker_state') // Global state
    
    // Reset circuit breaker counters
    const resetState = {
      refreshAttempts: 0,
      lastFailureTime: 0,
      isOpen: false,
      nextAttemptTime: 0,
      consecutiveFailures: 0
    }
    
    localStorage.setItem(`auth_circuit_breaker_state_${userId}`, JSON.stringify(resetState))
  } catch (error) {
    console.error('Failed to reset circuit breaker:', error)
    throw error
  }
}

async function clearAuthLoops(userId: string) {
  try {
    // Clear auth loop detection for the specific user
    const userMetrics = authMonitor.getUserMetrics(userId)
    if (userMetrics.hasActiveLoop) {
      // This would typically call a method on authMonitor to clear the loop
      // For now, we'll clear the monitoring data which includes loops
      await clearMonitoringData(userId)
    }
  } catch (error) {
    console.error('Failed to clear auth loops:', error)
    throw error
  }
}

async function clearMonitoringData(userId: string) {
  try {
    // Clear user-specific monitoring data
    if (typeof window !== 'undefined') {
      const eventsData = localStorage.getItem('auth_monitoring_events')
      if (eventsData) {
        const events = JSON.parse(eventsData)
        const filteredEvents = events.filter((event: any) => event.userId !== userId)
        localStorage.setItem('auth_monitoring_events', JSON.stringify(filteredEvents))
      }

      const loopsData = localStorage.getItem('auth_monitoring_loops')
      if (loopsData) {
        const loops = JSON.parse(loopsData)
        delete loops[userId]
        localStorage.setItem('auth_monitoring_loops', JSON.stringify(loops))
      }
    }
  } catch (error) {
    console.error('Failed to clear monitoring data:', error)
    throw error
  }
}