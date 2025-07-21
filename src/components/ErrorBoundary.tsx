'use client';

import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { DataStateWrapper } from '@/components/ui/loading-states';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive mb-4">
              This component encountered an error and couldn't load properly.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <details className="mb-4">
                <summary className="cursor-pointer text-sm text-destructive/80 mb-2">
                  Error details (development only)
                </summary>
                <pre className="text-xs bg-destructive/10 p-2 rounded overflow-auto">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
            <Button 
              onClick={this.handleRetry}
              variant="outline"
              size="sm"
              className="border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
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
            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader>
                <CardTitle className="flex items-center text-destructive">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Component Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-destructive mb-4">
                  This component encountered an error and couldn't load properly.
                </p>
                {showDetails && (
                  <details className="mb-4">
                    <summary className="cursor-pointer text-sm text-destructive/80 mb-2">
                      Error details (development only)
                    </summary>
                    <pre className="text-xs bg-destructive/10 p-2 rounded overflow-auto">
                      Component failed to render
                    </pre>
                  </details>
                )}
                {showRetry && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="border-destructive/30 text-destructive hover:bg-destructive/10"
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