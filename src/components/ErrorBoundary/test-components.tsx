'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  PageErrorBoundary, 
  FeatureErrorBoundary, 
  ComponentErrorBoundary,
  useErrorBoundaryContext 
} from '@/components/ErrorBoundary';
import { 
  Bug, 
  AlertTriangle, 
  TestTube, 
  Zap,
  Database,
  Wifi,
  Shield,
  Server
} from 'lucide-react';

/**
 * Test component that throws errors on demand
 */
function ErrorThrowingComponent({ 
  errorType = 'generic',
  delay = 0 
}: { 
  errorType?: 'generic' | 'network' | 'database' | 'permission' | 'validation' | 'async';
  delay?: number;
}) {
  const [shouldError, setShouldError] = useState(false);
  const [asyncError, setAsyncError] = useState(false);
  
  // Throw error during render
  if (shouldError) {
    const errors = {
      generic: new Error('Test component error'),
      network: new Error('Network connection failed'),
      database: new Error('Database query failed'),
      permission: new Error('Permission denied - 403 unauthorized'),
      validation: new Error('Validation failed - invalid input format'),
      async: new Error('Async operation failed')
    };
    
    throw errors[errorType] || errors.generic;
  }
  
  // Throw async error
  React.useEffect(() => {
    if (asyncError) {
      setTimeout(() => {
        throw new Error('Async error in useEffect');
      }, delay);
    }
  }, [asyncError, delay]);
  
  return (
    <Card className="border-2 border-dashed border-gray-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Error Test Component
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShouldError(true)}
          >
            <Bug className="h-4 w-4 mr-2" />
            Throw {errorType} Error
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAsyncError(true)}
          >
            <Zap className="h-4 w-4 mr-2" />
            Async Error
          </Button>
        </div>
        
        <Badge variant="secondary" className="w-full justify-center">
          Ready to test error boundaries
        </Badge>
      </CardContent>
    </Card>
  );
}

/**
 * Manual error reporting test component
 */
function ManualErrorReportingComponent() {
  const { reportError } = useErrorBoundaryContext();
  
  const handleManualError = () => {
    const error = new Error('Manually reported error');
    reportError(error, {
      action: 'manual_report',
      component: 'ManualErrorReportingComponent',
      userInitiated: true
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Manual Error Reporting
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={handleManualError} variant="outline">
          Report Error Manually
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Network error simulation component
 */
function NetworkErrorComponent() {
  const [loading, setLoading] = useState(false);
  
  const simulateNetworkError = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      throw new Error('Network timeout: Failed to fetch data from server');
    }, 1000);
  };
  
  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-700">
          <Wifi className="h-5 w-5" />
          Network Error Test
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={simulateNetworkError}
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          {loading ? 'Simulating...' : 'Simulate Network Error'}
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Database error simulation component
 */
function DatabaseErrorComponent() {
  const [loading, setLoading] = useState(false);
  
  const simulateDatabaseError = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      throw new Error('Database connection failed: PostgreSQL query timeout');
    }, 1000);
  };
  
  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700">
          <Database className="h-5 w-5" />
          Database Error Test
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={simulateDatabaseError}
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          {loading ? 'Simulating...' : 'Simulate Database Error'}
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Permission error simulation component
 */
function PermissionErrorComponent() {
  const simulatePermissionError = () => {
    throw new Error('Permission denied: User does not have access to this resource (403)');
  };
  
  return (
    <Card className="border-yellow-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-700">
          <Shield className="h-5 w-5" />
          Permission Error Test
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={simulatePermissionError}
          variant="outline"
          className="w-full"
        >
          Simulate Permission Error
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Server error simulation component
 */
function ServerErrorComponent() {
  const simulateServerError = () => {
    throw new Error('Server error: Internal server error (500)');
  };
  
  return (
    <Card className="border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-700">
          <Server className="h-5 w-5" />
          Server Error Test
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={simulateServerError}
          variant="outline"
          className="w-full"
        >
          Simulate Server Error
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Component error boundary test page
 */
export function ErrorBoundaryTestPage() {
  const [key, setKey] = useState(0);
  
  const resetAll = () => {
    setKey(prev => prev + 1);
  };
  
  return (
    <PageErrorBoundary pageName="Error Boundary Test Page">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Error Boundary Testing</h1>
            <p className="text-gray-600">Test comprehensive error boundary functionality</p>
          </div>
          <Button onClick={resetAll} variant="outline">
            Reset All Tests
          </Button>
        </div>
        
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            These components are designed to test error boundaries. They will intentionally throw errors when buttons are clicked.
          </AlertDescription>
        </Alert>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Component Level Error Boundaries */}
          <ComponentErrorBoundary componentName="Generic Error Test" key={`generic-${key}`}>
            <ErrorThrowingComponent errorType="generic" />
          </ComponentErrorBoundary>
          
          <ComponentErrorBoundary componentName="Network Error Test" key={`network-${key}`}>
            <NetworkErrorComponent />
          </ComponentErrorBoundary>
          
          <ComponentErrorBoundary componentName="Database Error Test" key={`database-${key}`}>
            <DatabaseErrorComponent />
          </ComponentErrorBoundary>
          
          <ComponentErrorBoundary componentName="Permission Error Test" key={`permission-${key}`}>
            <PermissionErrorComponent />
          </ComponentErrorBoundary>
          
          <ComponentErrorBoundary componentName="Server Error Test" key={`server-${key}`}>
            <ServerErrorComponent />
          </ComponentErrorBoundary>
          
          <ComponentErrorBoundary componentName="Manual Error Reporting" key={`manual-${key}`}>
            <ManualErrorReportingComponent />
          </ComponentErrorBoundary>
        </div>
        
        {/* Feature Level Error Boundary */}
        <FeatureErrorBoundary featureName="Advanced Error Testing" key={`feature-${key}`}>
          <Card>
            <CardHeader>
              <CardTitle>Feature-Level Error Boundary Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ComponentErrorBoundary componentName="Async Error Test" resetOnPropsChange={true}>
                  <ErrorThrowingComponent errorType="async" delay={2000} />
                </ComponentErrorBoundary>
                
                <ComponentErrorBoundary componentName="Validation Error Test" resetOnPropsChange={true}>
                  <ErrorThrowingComponent errorType="validation" />
                </ComponentErrorBoundary>
              </div>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This section tests feature-level error boundaries that can contain multiple component errors.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </FeatureErrorBoundary>
      </div>
    </PageErrorBoundary>
  );
}

/**
 * Simple error boundary test component for basic testing
 */
export function SimpleErrorTest() {
  return (
    <ComponentErrorBoundary componentName="Simple Error Test">
      <ErrorThrowingComponent />
    </ComponentErrorBoundary>
  );
}

/**
 * Nested error boundary test to verify hierarchy
 */
export function NestedErrorBoundaryTest() {
  return (
    <PageErrorBoundary pageName="Nested Error Test">
      <FeatureErrorBoundary featureName="Outer Feature">
        <ComponentErrorBoundary componentName="Outer Component">
          <FeatureErrorBoundary featureName="Inner Feature">
            <ComponentErrorBoundary componentName="Inner Component">
              <ErrorThrowingComponent />
            </ComponentErrorBoundary>
          </FeatureErrorBoundary>
        </ComponentErrorBoundary>
      </FeatureErrorBoundary>
    </PageErrorBoundary>
  );
}