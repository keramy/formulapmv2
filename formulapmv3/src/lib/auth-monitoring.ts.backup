/**
 * Authentication Monitoring System
 * Tracks auth failures, detects loops, and provides monitoring metrics
 */

interface AuthEvent {
  timestamp: number
  userId?: string
  event: 'AUTH_FAILURE' | 'AUTH_SUCCESS' | 'TOKEN_REFRESH' | 'CIRCUIT_BREAKER_OPEN' | 'PROFILE_ERROR'
  error?: string
  errorCode?: string
  retryCount?: number
  correlationId?: string
  metadata?: Record<string, any>
}

interface AuthMetrics {
  totalAuthFailures: number
  uniqueUsersWithFailures: number
  authLoopDetections: number
  circuitBreakerActivations: number
  averageFailuresPerUser: number
  recentFailures: AuthEvent[]
  topErrorCodes: Record<string, number>
  performanceMetrics: {
    avgTokenRefreshTime: number
    avgProfileFetchTime: number
    slowestOperations: Array<{
      operation: string
      duration: number
      timestamp: number
    }>
  }
}

interface AuthLoopDetection {
  userId: string
  failureCount: number
  firstFailure: number
  lastFailure: number
  isActiveLoop: boolean
  errors: string[]
}

class AuthMonitor {
  private events: AuthEvent[] = []
  private loopDetections: Map<string, AuthLoopDetection> = new Map()
  private readonly MAX_EVENTS = 1000
  private readonly LOOP_DETECTION_WINDOW = 30000 // 30 seconds
  private readonly LOOP_FAILURE_THRESHOLD = 5
  private readonly PERFORMANCE_THRESHOLD = 2000 // 2 seconds

  constructor() {
    this.loadPersistedData()
    this.setupPeriodicCleanup()
  }

  /**
   * Record an authentication event
   */
  recordEvent(event: Omit<AuthEvent, 'timestamp'>): void {
    const authEvent: AuthEvent = {
      ...event,
      timestamp: Date.now()
    }

    this.events.push(authEvent)
    
    // Maintain max events limit
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS)
    }

    // Process event for loop detection
    this.processEventForLoopDetection(authEvent)
    
    // Log event
    this.logEvent(authEvent)
    
    // Persist to localStorage
    this.persistData()
  }

  /**
   * Record a 401 authentication failure
   */
  recordAuthFailure(userId: string, error: string, errorCode?: string, correlationId?: string): void {
    this.recordEvent({
      userId,
      event: 'AUTH_FAILURE',
      error,
      errorCode,
      correlationId,
      metadata: {
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown'
      }
    })
  }

  /**
   * Record a successful authentication
   */
  recordAuthSuccess(userId: string, correlationId?: string): void {
    this.recordEvent({
      userId,
      event: 'AUTH_SUCCESS',
      correlationId
    })

    // Clear loop detection for this user
    this.clearLoopDetection(userId)
  }

  /**
   * Record token refresh event
   */
  recordTokenRefresh(userId: string, duration: number, success: boolean, error?: string): void {
    this.recordEvent({
      userId,
      event: 'TOKEN_REFRESH',
      error: success ? undefined : error,
      metadata: {
        duration,
        success
      }
    })

    // Track performance
    if (duration > this.PERFORMANCE_THRESHOLD) {
      this.recordSlowOperation('token_refresh', duration)
    }
  }

  /**
   * Record circuit breaker activation
   */
  recordCircuitBreakerOpen(userId: string, failureCount: number, correlationId?: string): void {
    this.recordEvent({
      userId,
      event: 'CIRCUIT_BREAKER_OPEN',
      retryCount: failureCount,
      correlationId,
      metadata: {
        reason: 'max_failures_reached'
      }
    })
  }

  /**
   * Record profile-related errors
   */
  recordProfileError(userId: string, error: string, errorCode?: string, correlationId?: string): void {
    this.recordEvent({
      userId,
      event: 'PROFILE_ERROR',
      error,
      errorCode,
      correlationId
    })
  }

  /**
   * Process event for auth loop detection
   */
  private processEventForLoopDetection(event: AuthEvent): void {
    if (event.event !== 'AUTH_FAILURE' || !event.userId) return

    const now = Date.now()
    const userId = event.userId
    
    let detection = this.loopDetections.get(userId)
    
    if (!detection) {
      detection = {
        userId,
        failureCount: 0,
        firstFailure: now,
        lastFailure: now,
        isActiveLoop: false,
        errors: []
      }
      this.loopDetections.set(userId, detection)
    }

    // Check if this failure is within the detection window
    if (now - detection.firstFailure > this.LOOP_DETECTION_WINDOW) {
      // Reset detection window
      detection.firstFailure = now
      detection.failureCount = 0
      detection.errors = []
    }

    detection.failureCount++
    detection.lastFailure = now
    detection.errors.push(event.error || 'Unknown error')

    // Check for auth loop
    if (detection.failureCount >= this.LOOP_FAILURE_THRESHOLD) {
      if (!detection.isActiveLoop) {
        detection.isActiveLoop = true
        this.alertAuthLoop(detection)
      }
    }
  }

  /**
   * Alert about detected auth loop
   */
  private alertAuthLoop(detection: AuthLoopDetection): void {
    const alert = {
      type: 'AUTH_LOOP_DETECTED',
      userId: detection.userId,
      failureCount: detection.failureCount,
      duration: detection.lastFailure - detection.firstFailure,
      errors: detection.errors,
      timestamp: Date.now()
    }

    // Log alert
    console.error('🚨 AUTH LOOP DETECTED', alert)

    // Send to external monitoring if available
    this.sendToMonitoring(alert)
  }

  /**
   * Clear loop detection for a user
   */
  private clearLoopDetection(userId: string): void {
    this.loopDetections.delete(userId)
  }

  /**
   * Record slow operation for performance monitoring
   */
  private recordSlowOperation(operation: string, duration: number): void {
    // This would typically be sent to a performance monitoring service
    console.warn(`🐌 Slow auth operation detected: ${operation} took ${duration}ms`)
  }

  /**
   * Get comprehensive auth metrics
   */
  getMetrics(): AuthMetrics {
    const now = Date.now()
    const last24Hours = now - 24 * 60 * 60 * 1000
    const recentEvents = this.events.filter(e => e.timestamp >= last24Hours)
    
    const failures = recentEvents.filter(e => e.event === 'AUTH_FAILURE')
    const uniqueUsers = new Set(failures.map(e => e.userId).filter(Boolean))
    const tokenRefreshEvents = recentEvents.filter(e => e.event === 'TOKEN_REFRESH')
    
    // Calculate error codes frequency
    const errorCodes: Record<string, number> = {}
    failures.forEach(f => {
      if (f.errorCode) {
        errorCodes[f.errorCode] = (errorCodes[f.errorCode] || 0) + 1
      }
    })

    // Calculate performance metrics
    const tokenRefreshTimes = tokenRefreshEvents
      .map(e => e.metadata?.duration)
      .filter(d => typeof d === 'number')
    
    const avgTokenRefreshTime = tokenRefreshTimes.length > 0 
      ? tokenRefreshTimes.reduce((sum, time) => sum + time, 0) / tokenRefreshTimes.length
      : 0

    return {
      totalAuthFailures: failures.length,
      uniqueUsersWithFailures: uniqueUsers.size,
      authLoopDetections: Array.from(this.loopDetections.values()).filter(d => d.isActiveLoop).length,
      circuitBreakerActivations: recentEvents.filter(e => e.event === 'CIRCUIT_BREAKER_OPEN').length,
      averageFailuresPerUser: uniqueUsers.size > 0 ? failures.length / uniqueUsers.size : 0,
      recentFailures: failures.slice(-10), // Last 10 failures
      topErrorCodes: errorCodes,
      performanceMetrics: {
        avgTokenRefreshTime,
        avgProfileFetchTime: 0, // TODO: Implement profile fetch tracking
        slowestOperations: [] // TODO: Implement slow operation tracking
      }
    }
  }

  /**
   * Get active auth loops
   */
  getActiveLoops(): AuthLoopDetection[] {
    return Array.from(this.loopDetections.values()).filter(d => d.isActiveLoop)
  }

  /**
   * Get user-specific auth metrics
   */
  getUserMetrics(userId: string): {
    totalFailures: number
    recentFailures: AuthEvent[]
    hasActiveLoop: boolean
    loopDetails?: AuthLoopDetection
  } {
    const userEvents = this.events.filter(e => e.userId === userId)
    const failures = userEvents.filter(e => e.event === 'AUTH_FAILURE')
    const loopDetection = this.loopDetections.get(userId)

    return {
      totalFailures: failures.length,
      recentFailures: failures.slice(-5),
      hasActiveLoop: loopDetection?.isActiveLoop || false,
      loopDetails: loopDetection
    }
  }

  /**
   * Reset monitoring data
   */
  reset(): void {
    this.events = []
    this.loopDetections.clear()
    this.persistData()
  }

  /**
   * Log event with structured format
   */
  private logEvent(event: AuthEvent): void {
    const logLevel = event.event === 'AUTH_FAILURE' ? 'error' : 'info'
    const message = `Auth Monitor: ${event.event} ${event.userId ? `for user ${event.userId}` : ''}`
    
    if (logLevel === 'error') {
      console.error(message, {
        ...event,
        timestamp: new Date(event.timestamp).toISOString()
      })
    } else {
      console.log(message, {
        ...event,
        timestamp: new Date(event.timestamp).toISOString()
      })
    }
  }

  /**
   * Load persisted data from localStorage
   */
  private loadPersistedData(): void {
    if (typeof window === 'undefined') return

    try {
      const eventsData = localStorage.getItem('auth_monitoring_events')
      if (eventsData) {
        const parsed = JSON.parse(eventsData)
        this.events = parsed.slice(-this.MAX_EVENTS) // Limit loaded events
      }

      const loopsData = localStorage.getItem('auth_monitoring_loops')
      if (loopsData) {
        const parsed = JSON.parse(loopsData)
        this.loopDetections = new Map(Object.entries(parsed))
      }
    } catch (error) {
      console.warn('Failed to load auth monitoring data:', error)
    }
  }

  /**
   * Persist data to localStorage
   */
  private persistData(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem('auth_monitoring_events', JSON.stringify(this.events))
      localStorage.setItem('auth_monitoring_loops', JSON.stringify(Object.fromEntries(this.loopDetections)))
    } catch (error) {
      console.warn('Failed to persist auth monitoring data:', error)
    }
  }

  /**
   * Send alert to external monitoring service
   */
  private sendToMonitoring(alert: any): void {
    // In a real implementation, this would send to services like:
    // - Sentry
    // - DataDog
    // - New Relic
    // - Custom webhook
    
    console.log('📊 Sending to monitoring service:', alert)
  }

  /**
   * Setup periodic cleanup of old data
   */
  private setupPeriodicCleanup(): void {
    if (typeof window === 'undefined') return

    setInterval(() => {
      const now = Date.now()
      const cutoff = now - 24 * 60 * 60 * 1000 // 24 hours

      // Clean old events
      this.events = this.events.filter(e => e.timestamp >= cutoff)

      // Clean old loop detections
      for (const [userId, detection] of this.loopDetections.entries()) {
        if (detection.lastFailure < cutoff) {
          this.loopDetections.delete(userId)
        }
      }

      this.persistData()
    }, 60000) // Run every minute
  }
}

// Singleton instance
export const authMonitor = new AuthMonitor()

// Export types for external use
export type { AuthEvent, AuthMetrics, AuthLoopDetection }