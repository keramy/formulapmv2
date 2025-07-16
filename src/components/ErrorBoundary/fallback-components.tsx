'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  ArrowLeft, 
  Bug, 
  Wifi, 
  Database,
  Server,
  ShieldX,
  Clock,
  FileX
} from 'lucide-react';

interface FallbackProps {
  error?: Error;
  resetError?: () => void;
  errorId?: string;
  retryCount?: number;
  maxRetries?: number;
}

/**
 * Network-related error fallback
 */
export function NetworkErrorFallback({ 
  error, 
  resetError, 
  errorId, 
  retryCount = 0,
  maxRetries = 3 
}: FallbackProps) {
  const canRetry = retryCount < maxRetries;
  
  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Wifi className="h-12 w-12 text-orange-500" />
        </div>
        <CardTitle className="text-orange-700">Connection Error</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-orange-600">
          Unable to connect to the server. Please check your internet connection and try again.
        </p>
        
        {errorId && (
          <div className="text-xs text-orange-500">
            Error ID: {errorId}
          </div>
        )}
        
        {retryCount > 0 && (
          <div className="text-xs text-orange-500">
            Retry attempts: {retryCount}/{maxRetries}
          </div>
        )}
        
        <div className="flex gap-2 justify-center">
          {canRetry && resetError && (
            <Button onClick={resetError} variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload Page
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Database-related error fallback
 */
export function DatabaseErrorFallback({ 
  error, 
  resetError, 
  errorId, 
  retryCount = 0,
  maxRetries = 3 
}: FallbackProps) {
  const canRetry = retryCount < maxRetries;
  
  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Database className="h-12 w-12 text-red-500" />
        </div>
        <CardTitle className="text-red-700">Database Error</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-red-600">
          Unable to load data from the database. This might be a temporary issue.
        </p>
        
        {errorId && (
          <div className="text-xs text-red-500">
            Error ID: {errorId}
          </div>
        )}
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Data might be temporarily unavailable. Please try refreshing the page.
          </AlertDescription>
        </Alert>
        
        <div className="flex gap-2 justify-center">
          {canRetry && resetError && (
            <Button onClick={resetError} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry ({maxRetries - retryCount} left)
            </Button>
          )}
          <Button 
            onClick={() => window.location.href = '/dashboard'} 
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <Home className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Server-related error fallback
 */
export function ServerErrorFallback({ 
  error, 
  resetError, 
  errorId, 
  retryCount = 0 
}: FallbackProps) {
  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Server className="h-12 w-12 text-purple-500" />
        </div>
        <CardTitle className="text-purple-700">Server Error</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-purple-600">
          The server encountered an error while processing your request.
        </p>
        
        {errorId && (
          <div className="text-xs text-purple-500">
            Error ID: {errorId}
          </div>
        )}
        
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            This is usually a temporary issue. The server team has been notified.
          </AlertDescription>
        </Alert>
        
        <div className="flex gap-2 justify-center">
          {resetError && (
            <Button onClick={resetError} variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-100">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
          <Button 
            onClick={() => window.history.back()} 
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Permission-related error fallback
 */
export function PermissionErrorFallback({ 
  error, 
  resetError, 
  errorId 
}: FallbackProps) {
  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <ShieldX className="h-12 w-12 text-yellow-500" />
        </div>
        <CardTitle className="text-yellow-700">Access Denied</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-yellow-600">
          You don't have permission to access this resource.
        </p>
        
        {errorId && (
          <div className="text-xs text-yellow-500">
            Error ID: {errorId}
          </div>
        )}
        
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Contact your administrator if you believe this is an error.
          </AlertDescription>
        </Alert>
        
        <div className="flex gap-2 justify-center">
          <Button 
            onClick={() => window.location.href = '/dashboard'} 
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <Home className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Button>
          <Button 
            onClick={() => window.history.back()} 
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * File/Resource not found error fallback
 */
export function NotFoundErrorFallback({ 
  error, 
  resetError, 
  errorId 
}: FallbackProps) {
  return (
    <Card className="border-gray-200 bg-gray-50">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <FileX className="h-12 w-12 text-gray-500" />
        </div>
        <CardTitle className="text-gray-700">Resource Not Found</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-gray-600">
          The requested resource could not be found or has been moved.
        </p>
        
        {errorId && (
          <div className="text-xs text-gray-500">
            Error ID: {errorId}
          </div>
        )}
        
        <div className="flex gap-2 justify-center">
          <Button 
            onClick={() => window.location.href = '/dashboard'} 
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <Home className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Button>
          <Button 
            onClick={() => window.history.back()} 
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Generic component error fallback
 */
export function ComponentErrorFallback({ 
  error, 
  resetError, 
  errorId, 
  componentName 
}: FallbackProps & { componentName?: string }) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700">
          <Bug className="h-5 w-5" />
          Component Error
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-red-600 mb-4">
          The {componentName || 'component'} encountered an error and couldn't load properly.
        </p>
        
        {errorId && (
          <div className="text-xs text-red-500 mb-4">
            Error ID: {errorId}
          </div>
        )}
        
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mb-4">
            <summary className="cursor-pointer text-sm text-red-500 mb-2">
              Error details (development only)
            </summary>
            <pre className="text-xs bg-red-100 p-2 rounded overflow-auto max-h-24">
              {error.message}
            </pre>
          </details>
        )}
        
        {resetError && (
          <Button 
            onClick={resetError}
            variant="outline"
            size="sm"
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Inline error fallback for smaller components
 */
export function InlineErrorFallback({ 
  error, 
  resetError, 
  errorId, 
  componentName 
}: FallbackProps & { componentName?: string }) {
  return (
    <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
      <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
      <span className="text-red-600 flex-1">
        {componentName || 'Component'} failed to load
      </span>
      {resetError && (
        <Button 
          onClick={resetError}
          variant="ghost"
          size="sm"
          className="h-auto p-1 text-red-700 hover:bg-red-100"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

/**
 * Helper function to determine appropriate fallback component based on error type
 */
export function getErrorFallback(error: Error, props: FallbackProps & { componentName?: string }) {
  const errorMessage = error.message.toLowerCase();
  
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return <NetworkErrorFallback {...props} error={error} />;
  }
  
  if (errorMessage.includes('database') || errorMessage.includes('sql')) {
    return <DatabaseErrorFallback {...props} error={error} />;
  }
  
  if (errorMessage.includes('server') || errorMessage.includes('500')) {
    return <ServerErrorFallback {...props} error={error} />;
  }
  
  if (errorMessage.includes('permission') || errorMessage.includes('403') || errorMessage.includes('unauthorized')) {
    return <PermissionErrorFallback {...props} error={error} />;
  }
  
  if (errorMessage.includes('not found') || errorMessage.includes('404')) {
    return <NotFoundErrorFallback {...props} error={error} />;
  }
  
  // Default to component error fallback
  return <ComponentErrorFallback {...props} error={error} />;
}