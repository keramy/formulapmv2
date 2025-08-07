/**
 * Performance Monitoring System
 * Real-time performance tracking and alerting
 */
// import { setCachedData, getCachedData } from './cache-middleware'; // Functions not available

interface PerformanceMetrics {
  authTime: number;
  queryTime: number;
  totalTime: number;
  endpoint: string;
  timestamp: number;
  userId?: string;
  statusCode: number;
  method: string;
}

interface PerformanceAlert {
  type: 'AUTH_SLOW' | 'QUERY_SLOW' | 'ENDPOINT_SLOW' | 'HIGH_ERROR_RATE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  endpoint: string;
  value: number;
  threshold: number;
  timestamp: number;
}

interface PerformanceThresholds {
  authTime: number;
  queryTime: number;
  totalTime: number;
  errorRate: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  
  private thresholds: PerformanceThresholds = {
    authTime: 10, // 10ms
    queryTime: 100, // 100ms
    totalTime: 200, // 200ms
    errorRate: 5 // 5%
  };
  
  static getInstance(): PerformanceMonitor {
    if (!this.instance) {
      this.instance = new PerformanceMonitor();
    }
    return this.instance;
  }
  
  /**
   * Record a performance metric
   */
  async recordMetric(metric: PerformanceMetrics): Promise<void> {
    this.metrics.push(metric);
    
    // Keep only last 1000 metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
    
    // Store in cache for dashboard
    // await setCachedData('performance:metrics', this.metrics, 3600); // Function not available
    
    // Check for performance degradation
    await this.checkPerformanceThresholds(metric);
    
    // Store daily aggregates
    await this.updateDailyAggregates(metric);
  }
  
  /**
   * Check performance thresholds and generate alerts
   */
  private async checkPerformanceThresholds(metric: PerformanceMetrics): Promise<void> {
    const alerts: PerformanceAlert[] = [];
    
    if (metric.authTime > this.thresholds.authTime) {
      alerts.push({
        type: 'AUTH_SLOW',
        severity: metric.authTime > 50 ? 'CRITICAL' : 'HIGH',
        message: `Authentication time exceeded: ${metric.authTime}ms`,
        endpoint: metric.endpoint,
        value: metric.authTime,
        threshold: this.thresholds.authTime,
        timestamp: Date.now()
      });
    }
    
    if (metric.queryTime > this.thresholds.queryTime) {
      alerts.push({
        type: 'QUERY_SLOW',
        severity: metric.queryTime > 1000 ? 'CRITICAL' : 'HIGH',
        message: `Query time exceeded: ${metric.queryTime}ms`,
        endpoint: metric.endpoint,
        value: metric.queryTime,
        threshold: this.thresholds.queryTime,
        timestamp: Date.now()
      });
    }
    
    if (metric.totalTime > this.thresholds.totalTime) {
      alerts.push({
        type: 'ENDPOINT_SLOW',
        severity: metric.totalTime > 2000 ? 'CRITICAL' : 'HIGH',
        message: `Total response time exceeded: ${metric.totalTime}ms`,
        endpoint: metric.endpoint,
        value: metric.totalTime,
        threshold: this.thresholds.totalTime,
        timestamp: Date.now()
      });
    }
    
    // Check error rate for this endpoint
    const recentMetrics = this.metrics
      .filter(m => m.endpoint === metric.endpoint && m.timestamp > Date.now() - 300000) // Last 5 minutes
      .slice(-20); // Last 20 requests
    
    if (recentMetrics.length >= 10) {
      const errorCount = recentMetrics.filter(m => m.statusCode >= 400).length;
      const errorRate = (errorCount / recentMetrics.length) * 100;
      
      if (errorRate > this.thresholds.errorRate) {
        alerts.push({
          type: 'HIGH_ERROR_RATE',
          severity: errorRate > 20 ? 'CRITICAL' : 'HIGH',
          message: `High error rate: ${errorRate.toFixed(1)}%`,
          endpoint: metric.endpoint,
          value: errorRate,
          threshold: this.thresholds.errorRate,
          timestamp: Date.now()
        });
      }
    }
    
    // Store and log alerts
    if (alerts.length > 0) {
      this.alerts.push(...alerts);
      
      // Keep only last 100 alerts
      if (this.alerts.length > 100) {
        this.alerts = this.alerts.slice(-100);
      }
      
      // Store alerts in cache
      // await setCachedData('performance:alerts', this.alerts, 3600); // Function not available
      
      // Log critical alerts
      alerts.forEach(alert => {
        if (alert.severity === 'CRITICAL') {
          console.error('🚨 CRITICAL PERFORMANCE ALERT:', alert);
        } else {
          console.warn('⚠️ Performance alert:', alert);
        }
      });
    }
  }
  
  /**
   * Update daily performance aggregates
   */
  private async updateDailyAggregates(metric: PerformanceMetrics): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `performance:daily:${today}`;
    
    let dailyStats: any = {
      date: today,
      totalRequests: 0,
      totalAuthTime: 0,
      totalQueryTime: 0,
      totalResponseTime: 0,
      errorCount: 0,
      endpoints: {}
    };
    
    dailyStats.totalRequests++;
    dailyStats.totalAuthTime += metric.authTime;
    dailyStats.totalQueryTime += metric.queryTime;
    dailyStats.totalResponseTime += metric.totalTime;
    
    if (metric.statusCode >= 400) {
      dailyStats.errorCount++;
    }
    
    // Track per-endpoint stats
    if (!dailyStats.endpoints[metric.endpoint]) {
      dailyStats.endpoints[metric.endpoint] = {
        requests: 0,
        totalTime: 0,
        errors: 0
      };
    }
    
    dailyStats.endpoints[metric.endpoint].requests++;
    dailyStats.endpoints[metric.endpoint].totalTime += metric.totalTime;
    
    if (metric.statusCode >= 400) {
      dailyStats.endpoints[metric.endpoint].errors++;
    }
    
    // Store updated stats (cache for 25 hours to overlap days)
    // await setCachedData(cacheKey, dailyStats, 90000); // Function not available
  }
  
  /**
   * Get current performance metrics
   */
  async getMetrics(): Promise<PerformanceMetrics[]> {
    return this.metrics;
  }
  
  /**
   * Get recent alerts
   */
  async getAlerts(): Promise<PerformanceAlert[]> {
    return this.alerts;
  }
  
  /**
   * Get average performance metrics
   */
  async getAverageMetrics(): Promise<{
    avgAuthTime: number;
    avgQueryTime: number;
    avgTotalTime: number;
    errorRate: number;
    count: number;
  }> {
    if (this.metrics.length === 0) {
      return { avgAuthTime: 0, avgQueryTime: 0, avgTotalTime: 0, errorRate: 0, count: 0 };
    }
    
    const totals = this.metrics.reduce((acc, metric) => ({
      authTime: acc.authTime + metric.authTime,
      queryTime: acc.queryTime + metric.queryTime,
      totalTime: acc.totalTime + metric.totalTime,
      errors: acc.errors + (metric.statusCode >= 400 ? 1 : 0)
    }), { authTime: 0, queryTime: 0, totalTime: 0, errors: 0 });
    
    return {
      avgAuthTime: Math.round(totals.authTime / this.metrics.length),
      avgQueryTime: Math.round(totals.queryTime / this.metrics.length),
      avgTotalTime: Math.round(totals.totalTime / this.metrics.length),
      errorRate: Math.round((totals.errors / this.metrics.length) * 100 * 100) / 100,
      count: this.metrics.length
    };
  }
  
  /**
   * Get daily performance summary
   */
  async getDailyStats(date?: string): Promise<any> {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const cacheKey = `performance:daily:${targetDate}`;
    
    const dailyStats = null; // await getCachedData<any>(cacheKey); // Function not available
    
    if (!dailyStats) {
      return null;
    }
    
    // Calculate averages (commented out due to cache function unavailability)
    /*
    const avgAuthTime = Math.round(dailyStats.totalAuthTime / dailyStats.totalRequests);
    const avgQueryTime = Math.round(dailyStats.totalQueryTime / dailyStats.totalRequests);
    const avgResponseTime = Math.round(dailyStats.totalResponseTime / dailyStats.totalRequests);
    const errorRate = Math.round((dailyStats.errorCount / dailyStats.totalRequests) * 100 * 100) / 100;
    
    return {
      ...dailyStats,
      avgAuthTime,
      avgQueryTime,
      avgResponseTime,
      errorRate
    };
    */
    
    return null;
  }
  
  /**
   * Get endpoint performance summary
   */
  async getEndpointStats(): Promise<Record<string, any>> {
    const endpointStats: Record<string, any> = {};
    
    this.metrics.forEach(metric => {
      if (!endpointStats[metric.endpoint]) {
        endpointStats[metric.endpoint] = {
          requests: 0,
          totalTime: 0,
          authTime: 0,
          queryTime: 0,
          errors: 0,
          minTime: Infinity,
          maxTime: 0
        };
      }
      
      const stats = endpointStats[metric.endpoint];
      stats.requests++;
      stats.totalTime += metric.totalTime;
      stats.authTime += metric.authTime;
      stats.queryTime += metric.queryTime;
      
      if (metric.statusCode >= 400) {
        stats.errors++;
      }
      
      stats.minTime = Math.min(stats.minTime, metric.totalTime);
      stats.maxTime = Math.max(stats.maxTime, metric.totalTime);
    });
    
    // Calculate averages
    Object.keys(endpointStats).forEach(endpoint => {
      const stats = endpointStats[endpoint];
      stats.avgTime = Math.round(stats.totalTime / stats.requests);
      stats.avgAuthTime = Math.round(stats.authTime / stats.requests);
      stats.avgQueryTime = Math.round(stats.queryTime / stats.requests);
      stats.errorRate = Math.round((stats.errors / stats.requests) * 100 * 100) / 100;
    });
    
    return endpointStats;
  }
  
  /**
   * Update performance thresholds
   */
  updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }
  
  /**
   * Clear old metrics and alerts
   */
  async cleanup(): Promise<void> {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    this.alerts = this.alerts.filter(a => a.timestamp > cutoff);
    
    // Update cache
    // await setCachedData('performance:metrics', this.metrics, 3600); // Function not available
    // await setCachedData('performance:alerts', this.alerts, 3600); // Function not available
  }
}

/**
 * Middleware to automatically track performance
 */
export function withPerformanceTracking(handler: Function, endpoint: string) {
  return async (req: any) => {
    const startTime = Date.now();
    const authStartTime = Date.now();
    
    try {
      const response = await handler(req);
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Record performance metric
      const monitor = PerformanceMonitor.getInstance();
      await monitor.recordMetric({
        authTime: 0, // Will be set by auth middleware
        queryTime: 0, // Will be set by query operations
        totalTime,
        endpoint,
        timestamp: startTime,
        userId: (req as any).user?.id,
        statusCode: response.status || 200,
        method: req.method
      });
      
      return response;
    } catch (error) {
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      // Record error metric
      const monitor = PerformanceMonitor.getInstance();
      await monitor.recordMetric({
        authTime: 0,
        queryTime: 0,
        totalTime,
        endpoint,
        timestamp: startTime,
        userId: (req as any).user?.id,
        statusCode: 500,
        method: req.method
      });
      
      throw error;
    }
  };
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();