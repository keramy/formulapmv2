/**
 * Tab Error Boundary - PERFORMANCE OPTIMIZATION PHASE 1.3
 * 
 * Error boundaries for each tab to prevent cascade failures
 * with retry mechanisms and user-friendly error displays
 */

'use client';

import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Bug from 'lucide-react/dist/esm/icons/bug';

interface TabErrorBoundaryProps {
  children: ReactNode;
  tabName: string;
  fallback?: ReactNode;
}

interface TabErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  retryCount: number;
}

export class TabErrorBoundary extends Component<TabErrorBoundaryProps, TabErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: TabErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<TabErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({
      error,
      errorInfo
    });

    // Log error for monitoring
    console.error(`Tab Error [${this.props.tabName}]:`, error, errorInfo);
    
    // You could integrate with error reporting service here
    // this.reportError(error, errorInfo, this.props.tabName);
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount >= 3) {
      // Max retries reached
      return;
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleAutoRetry = () => {
    if (this.state.retryCount < 2) {
      // Auto-retry after 2 seconds for the first two attempts
      this.retryTimeoutId = setTimeout(() => {
        this.handleRetry();
      }, 2000);
    }
  };

  render() {
    const { hasError, error, retryCount } = this.state;
    const { children, tabName, fallback } = this.props;

    if (hasError) {
      // Start auto-retry for the first error
      if (retryCount === 0) {
        this.handleAutoRetry();
      }

      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {tabName} Tab Error
            </CardTitle>
            <CardDescription>
              Something went wrong while loading this tab
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <Bug className="h-4 w-4" />
              <AlertDescription>
                {error?.message || 'An unexpected error occurred'}
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {retryCount > 0 && (
                  <span>Retry attempt: {retryCount}/3</span>
                )}
              </div>
              
              <div className="flex gap-2">
                {retryCount < 3 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={this.handleRetry}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reload Page
                  </Button>
                )}
              </div>
            </div>

            {/* Error details for development */}
            {process.env.NODE_ENV === 'development' && error && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 whitespace-pre-wrap text-xs bg-muted p-2 rounded">
                  {error.stack}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      );
    }

    return children;
  }
}

// Hook for using error boundary in functional components
export function useTabErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  return { captureError };
}

// HOC for wrapping components with error boundary
export function withTabErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  tabName: string
) {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <TabErrorBoundary tabName={tabName}>
      <Component {...props} ref={ref} />
    </TabErrorBoundary>
  ));

  WrappedComponent.displayName = `withTabErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}