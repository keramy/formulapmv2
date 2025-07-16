import { NextRequest, NextResponse } from 'next/server'
import { checkDatabaseHealth } from '@/lib/api-middleware'
import { validateDatabaseSchema } from '@/lib/database'

/**
 * Database Health Check Endpoint
 * Provides real-time database connectivity and performance metrics
 */
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    
    // Basic connectivity check
    const healthCheck = await checkDatabaseHealth()
    
    // Schema validation (optional, can be expensive)
    const includeSchema = request.nextUrl.searchParams.get('schema') === 'true'
    let schemaCheck = null
    
    if (includeSchema) {
      schemaCheck = await validateDatabaseSchema()
    }
    
    const totalTime = Date.now() - startTime
    
    const response = {
      timestamp: new Date().toISOString(),
      status: healthCheck.healthy ? 'healthy' : 'unhealthy',
      connectivity: {
        healthy: healthCheck.healthy,
        latency: healthCheck.latency,
        error: healthCheck.error
      },
      schema: schemaCheck ? {
        valid: schemaCheck.isValid,
        missingTables: schemaCheck.missingTables,
        errors: schemaCheck.errors
      } : null,
      performance: {
        totalCheckTime: totalTime,
        connectionLatency: healthCheck.latency
      }
    }
    
    const status = healthCheck.healthy ? 200 : 503
    
    return NextResponse.json(response, { status })
    
  } catch (error) {
    console.error('Database health check failed:', error)
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
