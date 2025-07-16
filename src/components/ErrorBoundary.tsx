'use client';

import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Bug, Home, ArrowLeft } from 'lucide-react';
import { DataStateWrapper } from '@/components/ui/loading-states';
import { authMonitor } from '@/lib/auth-monitoring';
import { cn } from '@/lib/utils';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level?: 'page' | 'component' | 'feature';
  name?: string;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
  retryCount: number;
  resetKeys?: Array<string | number>;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryAttempts = 0;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;
  
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      retryCount: 0,
      resetKeys: props.resetKeys 
    };
  }
  
  componentDidUpdate(prevProps: Props) {
    const { resetOnPropsChange = false, resetKeys } = this.props;
    
    if (resetOnPropsChange || resetKeys) {
      const hasResetKeyChanged = resetKeys && 
        (!this.state.resetKeys || 
         resetKeys.some((key, idx) => key !== this.state.resetKeys![idx]));
        
      if (hasResetKeyChanged && this.state.hasError) {
        this.setState({
          hasError: false,
          error: undefined,
          errorInfo: undefined,
          errorId: undefined,
          retryCount: 0,
          resetKeys
        });
      }
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { 
      hasError: true, 
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { level = 'component', name = 'Unknown' } = this.props;
    
    this.setState({ errorInfo });
    
    // Enhanced error logging with context
    const errorContext = {
      level,
      name,
      errorId: this.state.errorId,
      retryCount: this.state.retryCount,
      componentStack: errorInfo.componentStack,
      errorBoundary: errorInfo.errorBoundary,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    };
    
    console.error(`[ErrorBoundary] ${level.toUpperCase()} ERROR in ${name}:`, {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context: errorContext
    });
    
    // Report to auth monitoring system
    if (typeof window !== 'undefined') {
      authMonitor.recordEvent({
        event: 'PROFILE_ERROR',
        error: `${name}: ${error.message}`,
        errorCode: 'COMPONENT_ERROR',
        metadata: {
          ...errorContext,
          errorStack: error.stack
        }
      });
    }
    
    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    if (this.retryAttempts >= this.maxRetries) {
      console.warn('[ErrorBoundary] Maximum retry attempts reached');
      return;
    }
    
    this.retryAttempts++;
    
    setTimeout(() => {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        errorId: undefined,
        retryCount: this.retryAttempts
      });
    }, this.retryDelay);
  };
  
  handleNavigateHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
  };
  
  handleNavigateBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };
  
  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { level = 'component', name = 'Unknown Component' } = this.props;
      const canRetry = this.retryAttempts < this.maxRetries;
      
      // Different UI based on error level
      const renderPageError = () => (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl border-red-200 bg-red-50">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-red-500" />
              </div>
              <CardTitle className="text-2xl text-red-700">
                Application Error
              </CardTitle>
              <p className="text-red-600 mt-2">
                The page encountered an error and couldn't load properly.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-red-600">
                  Error in: {name}
                </p>
                <p className="text-xs text-red-500">
                  Error ID: {this.state.errorId}
                </p>
                {this.retryAttempts > 0 && (
                  <p className="text-xs text-red-500">
                    Retry attempts: {this.retryAttempts}/{this.maxRetries}
                  </p>
                )}
              </div>
              
              {process.env.NODE_ENV === 'development' && (
                <details className="border border-red-200 rounded p-3">
                  <summary className="cursor-pointer text-sm text-red-600 font-medium mb-2">
                    Error Details (Development Only)
                  </summary>
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-medium text-red-700">Message:</span>
                      <pre className="text-xs bg-red-100 p-2 rounded mt-1">
                        {this.state.error?.message}
                      </pre>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-red-700">Stack:</span>
                      <pre className="text-xs bg-red-100 p-2 rounded mt-1 overflow-auto max-h-32">
                        {this.state.error?.stack}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <span className="text-xs font-medium text-red-700">Component Stack:</span>
                        <pre className="text-xs bg-red-100 p-2 rounded mt-1 overflow-auto max-h-32">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
              
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                {canRetry && (
                  <Button 
                    onClick={this.handleRetry}
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again ({this.maxRetries - this.retryAttempts} left)
                  </Button>
                )}
                <Button 
                  onClick={this.handleNavigateHome}
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
                <Button 
                  onClick={this.handleReload}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
      
      const renderFeatureError = () => (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <Bug className="h-5 w-5" />
              Feature Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">
              The {name} feature encountered an error and couldn't load properly.
            </p>
            <div className="text-xs text-red-500 mb-4">
              Error ID: {this.state.errorId}
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="mb-4">
                <summary className="cursor-pointer text-sm text-red-500 mb-2">
                  Error details (development only)
                </summary>
                <pre className="text-xs bg-red-100 p-2 rounded overflow-auto max-h-24">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
            
            <div className="flex gap-2">
              {canRetry && (
                <Button 
                  onClick={this.handleRetry}
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}
              <Button 
                onClick={this.handleNavigateBack}
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      );
      
      const renderComponentError = () => (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Component Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">
              The {name} component encountered an error and couldn't load properly.
            </p>
            <div className="text-xs text-red-500 mb-4">
              Error ID: {this.state.errorId}
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="mb-4">
                <summary className="cursor-pointer text-sm text-red-500 mb-2">
                  Error details (development only)
                </summary>
                <pre className="text-xs bg-red-100 p-2 rounded overflow-auto max-h-20">
                  {this.state.error?.message}
                </pre>
              </details>
            )}
            
            {canRetry && (
              <Button 
                onClick={this.handleRetry}
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
      
      // Return appropriate error UI based on level
      switch (level) {
        case 'page':
          return renderPageError();
        case 'feature':
          return renderFeatureError();
        case 'component':
        default:
          return renderComponentError();
      }
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  if (error) {
    throw error;
  }

  return setError;
}

// Hook for manual error reporting
export function useErrorReporting() {
  const reportError = React.useCallback((error: Error, context?: Record<string, any>) => {
    console.error('[Manual Error Report]', error, context);
    
    // Report to auth monitoring system
    if (typeof window !== 'undefined') {
      authMonitor.recordEvent({
        event: 'PROFILE_ERROR',
        error: error.message,
        errorCode: 'MANUAL_ERROR',
        metadata: {
          ...context,
          errorStack: error.stack,
          timestamp: new Date().toISOString(),
          userAgent: window.navigator.userAgent,
          url: window.location.href
        }
      });
    }
  }, []);
  
  return { reportError };
}

/**
 * Page-level error boundary for route-level errors
 */
export function PageErrorBoundary({ 
  children, 
  pageName,
  onError 
}: { 
  children: ReactNode;
  pageName: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}) {
  return (
    <ErrorBoundary
      level="page"
      name={pageName}
      onError={onError}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Feature-level error boundary for major feature sections
 */
export function FeatureErrorBoundary({ 
  children, 
  featureName,
  onError 
}: { 
  children: ReactNode;
  featureName: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}) {
  return (
    <ErrorBoundary
      level="feature"
      name={featureName}
      onError={onError}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Component-level error boundary for individual components
 */
export function ComponentErrorBoundary({ 
  children, 
  componentName,
  onError,
  resetOnPropsChange = false,
  resetKeys 
}: { 
  children: ReactNode;
  componentName: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}) {
  return (
    <ErrorBoundary
      level="component"
      name={componentName}
      onError={onError}
      resetOnPropsChange={resetOnPropsChange}
      resetKeys={resetKeys}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * HOC for wrapping components with error boundaries
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    name: string;
    level?: 'page' | 'component' | 'feature';
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    resetOnPropsChange?: boolean;
    resetKeys?: (props: P) => Array<string | number>;
  }
) {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => {
    const resetKeys = options.resetKeys ? options.resetKeys(props) : undefined;
    
    return (
      <ErrorBoundary
        level={options.level || 'component'}
        name={options.name}
        onError={options.onError}
        resetOnPropsChange={options.resetOnPropsChange}
        resetKeys={resetKeys}
      >
        <Component {...props} ref={ref} />
      </ErrorBoundary>
    );
  });
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;
  
  return WrappedComponent;
}

/**
 * Enhanced ErrorBoundary with DataStateWrapper integration
 * This provides consistent error handling that works with our optimization patterns
 */
export function EnhancedErrorBoundary({
  children,
  fallback,
  onError,
  showRetry = true,
  showDetails = process.env.NODE_ENV === 'development'
}: Props & {
  showRetry?: boolean;
  showDetails?: boolean;
}) {
  return (
    <ErrorBoundary
      onError={onError}
      fallback={fallback || (
        <DataStateWrapper
          loading={false}
          error="Component Error"
          data={null}
          emptyComponent={
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center text-red-700">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Component Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-600 mb-4">
                  This component encountered an error and couldn't load properly.
                </p>
                {showDetails && (
                  <details className="mb-4">
                    <summary className="cursor-pointer text-sm text-red-500 mb-2">
                      Error details (development only)
                    </summary>
                    <pre className="text-xs bg-red-100 p-2 rounded overflow-auto">
                      Component failed to render
                    </pre>
                  </details>
                )}
                {showRetry && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reload Page
                  </Button>
                )}
              </CardContent>
            </Card>
          }
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Error boundary context for passing error information down the tree
 */
export const ErrorBoundaryContext = React.createContext<{
  reportError: (error: Error, context?: Record<string, any>) => void;
  hasError: boolean;
  errorId?: string;
}>({
  reportError: () => {},
  hasError: false
});

/**
 * Provider component for error boundary context
 */
export function ErrorBoundaryProvider({ children }: { children: ReactNode }) {
  const { reportError } = useErrorReporting();
  const [hasError, setHasError] = React.useState(false);
  const [errorId, setErrorId] = React.useState<string>();
  
  const contextValue = React.useMemo(() => ({
    reportError: (error: Error, context?: Record<string, any>) => {
      const id = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setErrorId(id);
      setHasError(true);
      reportError(error, { ...context, errorId: id });
    },
    hasError,
    errorId
  }), [reportError, hasError, errorId]);
  
  return (
    <ErrorBoundaryContext.Provider value={contextValue}>
      {children}
    </ErrorBoundaryContext.Provider>
  );
}

/**
 * Hook for accessing error boundary context
 */
export function useErrorBoundaryContext() {
  const context = React.useContext(ErrorBoundaryContext);
  if (!context) {
    throw new Error('useErrorBoundaryContext must be used within an ErrorBoundaryProvider');
  }
  return context;
}