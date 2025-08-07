import { NextRequest, NextResponse } from 'next/server'

/**
 * Simple health check endpoint for testing API connectivity
 */
export async function GET(req: NextRequest) {
  try {
    const timestamp = new Date().toISOString()
    
    return NextResponse.json({
      success: true,
      status: 'healthy',
      timestamp,
      message: 'API is responding correctly',
      data: {
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform
      }
    })
  } catch (error) {
    console.error('Health check error:', error)
    
    return NextResponse.json({
      success: false,
      status: 'error',
      timestamp: new Date().toISOString(),
      message: error instanceof Error ? error.message : 'Unknown error',
      error: 'Health check failed'
    }, { status: 500 })
  }
}