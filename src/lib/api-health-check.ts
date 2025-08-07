/**
 * API Health Check Utilities
 * 
 * Used to diagnose API connectivity and authentication issues
 */

import { authService } from '@/services/AuthenticationService'

export interface HealthCheckResult {
  success: boolean
  status: number
  message: string
  responseTime: number
  details?: any
}

/**
 * Test basic API connectivity without authentication
 */
export async function testApiConnectivity(): Promise<HealthCheckResult> {
  const startTime = Date.now()
  
  try {
    const response = await fetch('/api/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const responseTime = Date.now() - startTime
    
    return {
      success: response.ok,
      status: response.status,
      message: response.ok ? 'API connectivity successful' : `API returned ${response.status}`,
      responseTime,
      details: {
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      }
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    
    return {
      success: false,
      status: 0,
      message: error instanceof Error ? error.message : 'Unknown network error',
      responseTime,
      details: { error }
    }
  }
}

/**
 * Test authenticated API endpoint
 */
export async function testAuthenticatedApi(endpoint: string): Promise<HealthCheckResult> {
  const startTime = Date.now()
  
  try {
    console.log(`🔍 [HealthCheck] Testing ${endpoint}...`)
    
    // Get token from service
    const token = await authService.getAccessToken()
    
    if (!token) {
      return {
        success: false,
        status: 0,
        message: 'No access token available',
        responseTime: Date.now() - startTime
      }
    }
    
    console.log(`🔍 [HealthCheck] Using token: ${token.substring(0, 20)}...`)
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    const responseTime = Date.now() - startTime
    const responseText = await response.text()
    
    console.log(`🔍 [HealthCheck] Response: ${response.status} ${response.statusText}`)
    console.log(`🔍 [HealthCheck] Response body: ${responseText.substring(0, 200)}...`)
    
    return {
      success: response.ok,
      status: response.status,
      message: response.ok ? 'Authentication successful' : `Authentication failed: ${response.status}`,
      responseTime,
      details: {
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText.substring(0, 500)
      }
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error(`🔍 [HealthCheck] Error testing ${endpoint}:`, error)
    
    return {
      success: false,
      status: 0,
      message: error instanceof Error ? error.message : 'Unknown authentication error',
      responseTime,
      details: { error }
    }
  }
}

/**
 * Comprehensive API health check
 */
export async function runComprehensiveHealthCheck(): Promise<{
  connectivity: HealthCheckResult
  testAuth: HealthCheckResult
  scope: HealthCheckResult
  suppliers: HealthCheckResult
  authService: {
    initialized: boolean
    hasUser: boolean
    hasToken: boolean
    serviceState: any
  }
}> {
  console.log('🔍 [HealthCheck] Running comprehensive API health check...')
  
  // Check auth service state
  const serviceState = authService.getState()
  const authServiceInfo = {
    initialized: true, // Service should be initialized by now
    hasUser: !!serviceState.user,
    hasToken: !!serviceState.accessToken,
    serviceState
  }
  
  console.log('🔍 [HealthCheck] Auth service state:', authServiceInfo)
  
  // Test endpoints
  const [connectivity, testAuth, scope, suppliers] = await Promise.all([
    testApiConnectivity(),
    testAuthenticatedApi('/api/test-auth'),
    testAuthenticatedApi('/api/scope'),
    testAuthenticatedApi('/api/suppliers')
  ])
  
  return {
    connectivity,
    testAuth,
    scope,
    suppliers,
    authService: authServiceInfo
  }
}

/**
 * Debug API issue with detailed logging
 */
export async function debugApiIssue(endpoint: string): Promise<void> {
  console.log(`🔍 [DebugAPI] Debugging ${endpoint}...`)
  
  // 1. Check auth service state
  const serviceState = authService.getState()
  console.log('🔍 [DebugAPI] Auth service state:', serviceState)
  
  // 2. Try to get fresh token
  try {
    const token = await authService.getAccessToken()
    console.log('🔍 [DebugAPI] Token available:', !!token)
    if (token) {
      console.log('🔍 [DebugAPI] Token preview:', token.substring(0, 50) + '...')
    }
  } catch (error) {
    console.error('🔍 [DebugAPI] Error getting token:', error)
  }
  
  // 3. Test the endpoint
  const result = await testAuthenticatedApi(endpoint)
  console.log('🔍 [DebugAPI] Test result:', result)
  
  // 4. Additional network checks
  try {
    const networkTest = await fetch(endpoint, { method: 'HEAD' })
    console.log('🔍 [DebugAPI] Network HEAD test:', networkTest.status)
  } catch (error) {
    console.error('🔍 [DebugAPI] Network HEAD test failed:', error)
  }
}

/**
 * Auto-run health check for debugging (call from console)
 */
export async function quickHealthCheck(): Promise<void> {
  console.log('🔍 [QuickHealthCheck] Starting...')
  
  const results = await runComprehensiveHealthCheck()
  
  console.log('🔍 [QuickHealthCheck] Results:')
  console.table({
    'Auth Service': results.authService.hasUser ? '✅ Has User' : '❌ No User',
    'Auth Token': results.authService.hasToken ? '✅ Has Token' : '❌ No Token',
    'API Connectivity': results.connectivity.success ? '✅ Connected' : '❌ Failed',
    'Auth Test': results.testAuth.success ? '✅ Working' : '❌ Failed',
    'Scope API': results.scope.success ? '✅ Working' : '❌ Failed',
    'Suppliers API': results.suppliers.success ? '✅ Working' : '❌ Failed'
  })
  
  if (!results.testAuth.success) {
    console.error('🔍 [QuickHealthCheck] Auth test issue:', results.testAuth)
  }
  
  if (!results.scope.success) {
    console.error('🔍 [QuickHealthCheck] Scope API issue:', results.scope)
  }
  
  if (!results.suppliers.success) {
    console.error('🔍 [QuickHealthCheck] Suppliers API issue:', results.suppliers)
  }
}

// Make functions available globally for console debugging
if (typeof window !== 'undefined') {
  (window as any).apiHealthCheck = quickHealthCheck
  (window as any).debugApiIssue = debugApiIssue
}