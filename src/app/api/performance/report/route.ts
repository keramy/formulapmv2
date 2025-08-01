import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-middleware';

/**
 * Performance Reporting API Endpoint
 * 
 * Receives performance metrics and Core Web Vitals data from the client
 * and stores them for analysis and monitoring.
 */

interface PerformanceReportData {
  url: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
  webVitals: Record<string, any>;
  customMetrics: Array<{
    name: string;
    value: number;
    timestamp: number;
    metadata?: Record<string, any>;
  }>;
  deviceInfo: {
    userAgent: string;
    connection?: any;
    memory?: any;
    hardware?: any;
  };
  recommendations: string[];
}

export async function POST(request: NextRequest) {
  try {
    const data: PerformanceReportData = await request.json();
    
    // Validate required fields
    if (!data.url || !data.sessionId || !data.timestamp) {
      return createErrorResponse('Missing required fields', 400);
    }

    // Log performance data (in production, this would go to a proper analytics service)
    console.log('📊 [Performance Report] Received:', {
      url: data.url,
      sessionId: data.sessionId,
      timestamp: new Date(data.timestamp).toISOString(),
      webVitalsCount: Object.keys(data.webVitals).length,
      customMetricsCount: data.customMetrics?.length || 0,
      recommendationsCount: data.recommendations?.length || 0
    });

    // Log Core Web Vitals specifically
    if (data.webVitals) {
      Object.entries(data.webVitals).forEach(([name, metric]: [string, any]) => {
        console.log(`🎯 [WebVital] ${name}: ${metric.value?.toFixed(2) || 'N/A'}ms (${metric.rating || 'unknown'})`);
      });
    }

    // Log poor performing metrics
    const poorMetrics = Object.entries(data.webVitals || {})
      .filter(([_, metric]: [string, any]) => metric.rating === 'poor')
      .map(([name]) => name);
    
    if (poorMetrics.length > 0) {
      console.warn('🚨 [Performance Alert] Poor metrics detected:', poorMetrics);
    }

    // Log recommendations
    if (data.recommendations?.length > 0) {
      console.log('💡 [Performance Recommendations]:', data.recommendations);
    }

    // In a real application, you would:
    // 1. Store in database (e.g., Supabase, MongoDB)
    // 2. Send to analytics service (e.g., Google Analytics, Mixpanel)
    // 3. Alert on performance issues
    // 4. Generate performance dashboards
    
    // Example: Store in Supabase (commented out)
    /*
    const { error } = await supabase
      .from('performance_reports')
      .insert({
        url: data.url,
        session_id: data.sessionId,
        user_id: data.userId,
        web_vitals: data.webVitals,
        custom_metrics: data.customMetrics,
        device_info: data.deviceInfo,
        recommendations: data.recommendations,
        timestamp: new Date(data.timestamp).toISOString()
      });
    
    if (error) {
      console.error('Failed to store performance report:', error);
      return createErrorResponse('Failed to store performance data', 500);
    }
    */

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return createSuccessResponse({
      message: 'Performance report received',
      sessionId: data.sessionId,
      metricsProcessed: Object.keys(data.webVitals || {}).length + (data.customMetrics?.length || 0)
    });
    
  } catch (error) {
    console.error('Error processing performance report:', error);
    return createErrorResponse('Failed to process performance report', 500);
  }
}

// Health check endpoint
export async function GET() {
  return createSuccessResponse({
    status: 'healthy',
    endpoint: 'performance-reporting',
    timestamp: new Date().toISOString()
  });
}
