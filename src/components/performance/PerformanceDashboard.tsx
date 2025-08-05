'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Zap, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download
} from 'lucide-react';
import { useWebVitals, WebVitalMetric, PerformanceReport } from '@/lib/performance/WebVitalsTracker';
import { useLoadingOrchestrator } from '@/components/ui/SimpleLoadingOrchestrator';

/**
 * Comprehensive Performance Dashboard
 * 
 * Displays real-time performance metrics, Core Web Vitals,
 * loading states, and optimization recommendations.
 */

interface PerformanceDashboardProps {
  className?: string;
  showRecommendations?: boolean;
  showLoadingStates?: boolean;
  autoRefresh?: boolean;
}

export function PerformanceDashboard({
  className = '',
  showRecommendations = true,
  showLoadingStates = true,
  autoRefresh = true
}: PerformanceDashboardProps) {
  const { metrics, report, generateReport, sendReport } = useWebVitals();
  const { loadingStates } = useLoadingOrchestrator();
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      generateReport();
      setLastRefresh(Date.now());
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, generateReport]);

  const handleManualRefresh = () => {
    generateReport();
    setLastRefresh(Date.now());
  };

  const handleExportReport = () => {
    const currentReport = generateReport();
    const blob = new Blob([JSON.stringify(currentReport, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const webVitalsArray = Array.from(metrics.values());
  const poorMetrics = webVitalsArray.filter(m => m.rating === 'poor');
  const goodMetrics = webVitalsArray.filter(m => m.rating === 'good');
  // Simple loading metrics
  const activeLoadingCount = Object.values(loadingStates).filter(Boolean).length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Performance Overview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Performance Monitor
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleManualRefresh}
                className="h-8 px-2"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleExportReport}
                className="h-8 px-2"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 px-3"
              >
                {isExpanded ? 'Collapse' : 'Expand'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Good Metrics</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {goodMetrics.length}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Poor Metrics</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {poorMetrics.length}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Loading</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {activeLoadingCount > 0 ? 'Active' : 'Idle'}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Total Load</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {activeLoadingCount}
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>Last updated: {new Date(lastRefresh).toLocaleTimeString()}</span>
            <span>Session: {report?.sessionId?.slice(-8) || 'N/A'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Core Web Vitals */}
      <Card>
        <CardHeader>
          <CardTitle>Core Web Vitals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {webVitalsArray.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No Web Vitals data available yet</p>
                <p className="text-xs">Metrics will appear as the page loads</p>
              </div>
            ) : (
              webVitalsArray.map((metric) => (
                <WebVitalCard key={metric.name} metric={metric} />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading States */}
      {showLoadingStates && (
        <Card>
          <CardHeader>
            <CardTitle>Active Loading States</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(loadingStates).length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <CheckCircle className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p>No active loading operations</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.values(loadingStates).map((state) => (
                  <div key={state.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                      <div>
                        <p className="font-medium text-sm">{state.label}</p>
                        <p className="text-xs text-muted-foreground">
                          Priority: {state.priority} • Started: {new Date(state.startTime).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={state.priority === 'critical' ? 'destructive' : 'secondary'}>
                      {state.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Performance Recommendations */}
      {showRecommendations && report?.recommendations && report.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-orange-800">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expanded Details */}
      {isExpanded && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Core Web Vitals Details */}
              <div>
                <h4 className="font-medium mb-3">Core Web Vitals Breakdown</h4>
                <div className="grid gap-4">
                  {webVitalsArray.map((metric) => (
                    <div key={metric.name} className="flex justify-between items-center py-2 border-b">
                      <span className="font-medium">{metric.name.toUpperCase()}</span>
                      <span className="text-muted-foreground">{metric.value?.toFixed(2) || 'N/A'}ms</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Loading States */}
              <div>
                <h4 className="font-medium mb-3">Active Loading States</h4>
                <div className="grid gap-2">
                  {Object.entries(loadingStates).map(([component, isLoading]) => (
                    isLoading && (
                      <div key={component} className="flex justify-between items-center py-2 px-3 bg-muted/30 rounded">
                        <span className="text-sm font-medium">{component}</span>
                        <span className="text-sm text-green-600">Loading...</span>
                      </div>
                    )
                  ))}
                  {activeLoadingCount === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      <p>No active loading states</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Summary */}
              <div>
                <h4 className="font-medium mb-3">Performance Summary</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">Active Loading</p>
                    <p className="text-lg font-bold text-blue-900">{activeLoadingCount}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm font-medium text-purple-800">Web Vitals</p>
                    <p className="text-lg font-bold text-purple-900">{webVitalsArray.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Individual Web Vital Metric Card
 */
function WebVitalCard({ metric }: { metric: WebVitalMetric }) {
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'text-green-600';
      case 'needs-improvement': return 'text-orange-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case 'good': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'needs-improvement': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'poor': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getMetricDescription = (name: string) => {
    switch (name) {
      case 'FCP': return 'First Contentful Paint - Time until first text/image is painted';
      case 'LCP': return 'Largest Contentful Paint - Time until largest content element is painted';
      case 'CLS': return 'Cumulative Layout Shift - Visual stability of the page';
      case 'FID': return 'First Input Delay - Time from first interaction to browser response';
      case 'TTFB': return 'Time to First Byte - Time from navigation to first byte received';
      case 'INP': return 'Interaction to Next Paint - Responsiveness to user interactions';
      default: return `${name} metric`;
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        {getRatingIcon(metric.rating)}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{metric.name}</span>
            <Badge variant={metric.rating === 'good' ? 'secondary' : 
                            metric.rating === 'needs-improvement' ? 'outline' : 'destructive'}>
              {metric.rating}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {getMetricDescription(metric.name)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <div className={`text-lg font-bold ${getRatingColor(metric.rating)}`}>
          {metric.name === 'CLS' ? metric.value.toFixed(3) : `${metric.value.toFixed(0)}ms`}
        </div>
        <div className="text-xs text-muted-foreground">
          ID: {metric.id.slice(-6)}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact Performance Widget for embedding in other components
 */
export function PerformanceWidget({ className = '' }: { className?: string }) {
  const { metrics } = useWebVitals();
  const { loadingStates: globalLoadingStates } = useLoadingOrchestrator();
  const isAnyLoading = Object.values(globalLoadingStates).some(Boolean);
  
  const webVitalsArray = Array.from(metrics.values());
  const poorCount = webVitalsArray.filter(m => m.rating === 'poor').length;
  const goodCount = webVitalsArray.filter(m => m.rating === 'good').length;
  
  const overallStatus = poorCount > 0 ? 'poor' : 
                       goodCount === webVitalsArray.length ? 'good' : 'fair';
  
  const statusColor = overallStatus === 'good' ? 'text-green-600' :
                     overallStatus === 'fair' ? 'text-orange-600' : 'text-red-600';
  
  const statusIcon = overallStatus === 'good' ? <CheckCircle className="h-4 w-4" /> :
                    overallStatus === 'fair' ? <AlertTriangle className="h-4 w-4" /> : 
                    <XCircle className="h-4 w-4" />;
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex items-center gap-1 ${statusColor}`}>
        {statusIcon}
        <span className="text-sm font-medium capitalize">{overallStatus}</span>
      </div>
      <div className="text-xs text-muted-foreground">
        {webVitalsArray.length} metrics
      </div>
      {isAnyLoading && (
        <div className="flex items-center gap-1 text-blue-600">
          <RefreshCw className="h-3 w-3 animate-spin" />
          <span className="text-xs">Loading</span>
        </div>
      )}
    </div>
  );
}
