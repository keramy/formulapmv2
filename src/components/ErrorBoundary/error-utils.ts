/**
 * Error Boundary Utilities
 * Helpers for error classification, reporting, and recovery
 */

import { authMonitor } from '@/lib/auth-monitoring';

export interface ErrorInfo {
  errorId: string;
  timestamp: number;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId?: string;
  buildVersion?: string;
  environment: string;
}

export interface ErrorContext {
  componentName: string;
  level: 'page' | 'feature' | 'component';
  props?: Record<string, any>;
  state?: Record<string, any>;
  previousError?: Error;
  retryCount: number;
  maxRetries: number;
}

export interface ErrorClassification {
  type: 'network' | 'database' | 'server' | 'permission' | 'validation' | 'component' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  retryable: boolean;
  userActionRequired: boolean;
}

/**
 * Generate unique error ID
 */
export function generateErrorId(): string {
  return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract error information from the environment
 */
export function getErrorInfo(userId?: string): ErrorInfo {
  return {
    errorId: generateErrorId(),
    timestamp: Date.now(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    userId,
    sessionId: typeof window !== 'undefined' ? sessionStorage.getItem('sessionId') || undefined : undefined,
    buildVersion: process.env.NEXT_PUBLIC_BUILD_VERSION || 'unknown',
    environment: process.env.NODE_ENV || 'unknown'
  };
}

/**
 * Classify error based on message, stack, and context
 */
export function classifyError(error: Error, context?: ErrorContext): ErrorClassification {
  const message = error.message.toLowerCase();
  const stack = error.stack?.toLowerCase() || '';
  
  // Network errors
  if (message.includes('network') || message.includes('fetch') || message.includes('timeout') || 
      message.includes('connection') || stack.includes('networkerror')) {
    return {
      type: 'network',
      severity: 'medium',
      recoverable: true,
      retryable: true,
      userActionRequired: false
    };
  }
  
  // Database errors
  if (message.includes('database') || message.includes('sql') || message.includes('query') ||
      message.includes('supabase') || message.includes('postgresql')) {
    return {
      type: 'database',
      severity: 'high',
      recoverable: true,
      retryable: true,
      userActionRequired: false
    };
  }
  
  // Server errors
  if (message.includes('server') || message.includes('500') || message.includes('502') ||
      message.includes('503') || message.includes('504')) {
    return {
      type: 'server',
      severity: 'high',
      recoverable: true,
      retryable: true,
      userActionRequired: false
    };
  }
  
  // Permission errors
  if (message.includes('permission') || message.includes('403') || message.includes('unauthorized') ||
      message.includes('access denied') || message.includes('forbidden')) {
    return {
      type: 'permission',
      severity: 'medium',
      recoverable: false,
      retryable: false,
      userActionRequired: true
    };
  }
  
  // Validation errors
  if (message.includes('validation') || message.includes('invalid') || message.includes('required') ||
      message.includes('format') || message.includes('schema')) {
    return {
      type: 'validation',
      severity: 'low',
      recoverable: true,
      retryable: false,
      userActionRequired: true
    };
  }
  
  // Component errors (React-specific)
  if (stack.includes('react') || stack.includes('component') || stack.includes('render') ||
      message.includes('hook') || message.includes('props')) {
    return {
      type: 'component',
      severity: context?.level === 'page' ? 'critical' : 'medium',
      recoverable: true,
      retryable: true,
      userActionRequired: false
    };
  }
  
  // Default classification
  return {
    type: 'unknown',
    severity: 'medium',
    recoverable: true,
    retryable: true,
    userActionRequired: false
  };
}

/**
 * Determine if error should be retried automatically
 */
export function shouldAutoRetry(error: Error, context: ErrorContext): boolean {
  const classification = classifyError(error, context);
  
  // Don't retry if max retries reached
  if (context.retryCount >= context.maxRetries) {
    return false;
  }
  
  // Don't retry non-retryable errors
  if (!classification.retryable) {
    return false;
  }
  
  // Don't retry permission errors
  if (classification.type === 'permission') {
    return false;
  }
  
  // Don't retry validation errors
  if (classification.type === 'validation') {
    return false;
  }
  
  return true;
}

/**
 * Calculate retry delay with exponential backoff
 */
export function calculateRetryDelay(retryCount: number, baseDelay: number = 1000): number {
  const maxDelay = 30000; // 30 seconds max
  const delay = baseDelay * Math.pow(2, retryCount);
  return Math.min(delay, maxDelay);
}

/**
 * Report error to monitoring systems
 */
export function reportError(
  error: Error, 
  context: ErrorContext, 
  errorInfo: ErrorInfo,
  reactErrorInfo?: React.ErrorInfo
): void {
  const classification = classifyError(error, context);
  
  // Console logging with context
  const logData = {
    errorId: errorInfo.errorId,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    context: {
      componentName: context.componentName,
      level: context.level,
      retryCount: context.retryCount,
      maxRetries: context.maxRetries
    },
    classification,
    errorInfo,
    reactErrorInfo: reactErrorInfo ? {
      componentStack: reactErrorInfo.componentStack,
      errorBoundary: reactErrorInfo.errorBoundary
    } : undefined
  };
  
  // Log to console
  console.error(`[ErrorBoundary] ${classification.severity.toUpperCase()} ERROR:`, logData);
  
  // Report to auth monitoring system
  if (typeof window !== 'undefined') {
    authMonitor.recordEvent({
      event: 'PROFILE_ERROR',
      error: `${context.componentName}: ${error.message}`,
      errorCode: `${classification.type.toUpperCase()}_ERROR`,
      userId: errorInfo.userId,
      metadata: {
        ...logData,
        errorStack: error.stack,
        userAgent: errorInfo.userAgent,
        url: errorInfo.url,
        timestamp: new Date(errorInfo.timestamp).toISOString()
      }
    });
  }
  
  // Report to external monitoring services
  reportToExternalServices(error, context, errorInfo, classification);
}

/**
 * Report to external monitoring services (placeholder)
 */
function reportToExternalServices(
  error: Error,
  context: ErrorContext,
  errorInfo: ErrorInfo,
  classification: ErrorClassification
): void {
  // In a real implementation, this would send to services like:
  // - Sentry
  // - DataDog
  // - LogRocket
  // - Custom analytics
  
  if (classification.severity === 'critical') {
    console.log('📊 [ErrorBoundary] Would send to critical error monitoring');
  }
  
  // Example webhook reporting
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ERROR_WEBHOOK) {
    fetch(process.env.NEXT_PUBLIC_ERROR_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        errorId: errorInfo.errorId,
        error: error.message,
        context: context.componentName,
        classification,
        timestamp: errorInfo.timestamp,
        url: errorInfo.url
      })
    }).catch(err => {
      console.warn('Failed to send error to webhook:', err);
    });
  }
}

/**
 * Sanitize error for display to users
 */
export function sanitizeErrorForDisplay(error: Error): string {
  const message = error.message;
  
  // Remove sensitive information
  let sanitized = message
    .replace(/password=\w+/gi, 'password=***')
    .replace(/token=\w+/gi, 'token=***')
    .replace(/api_key=\w+/gi, 'api_key=***')
    .replace(/secret=\w+/gi, 'secret=***');
  
  // Simplify technical messages for users
  if (sanitized.includes('fetch')) {
    return 'Failed to load data from server';
  }
  
  if (sanitized.includes('network')) {
    return 'Network connection error';
  }
  
  if (sanitized.includes('timeout')) {
    return 'Request timed out';
  }
  
  if (sanitized.includes('403') || sanitized.includes('unauthorized')) {
    return 'Access denied';
  }
  
  if (sanitized.includes('404')) {
    return 'Resource not found';
  }
  
  if (sanitized.includes('500') || sanitized.includes('server')) {
    return 'Server error';
  }
  
  return sanitized;
}

/**
 * Generate user-friendly error message
 */
export function generateUserMessage(error: Error, context: ErrorContext): string {
  const classification = classifyError(error, context);
  
  switch (classification.type) {
    case 'network':
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    case 'database':
      return 'Unable to load data. This might be a temporary issue.';
    case 'server':
      return 'The server encountered an error. Please try again later.';
    case 'permission':
      return 'You don\'t have permission to access this resource.';
    case 'validation':
      return 'Please check your input and try again.';
    case 'component':
      return `The ${context.componentName} component encountered an error and couldn't load properly.`;
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Get recovery suggestions based on error type
 */
export function getRecoverySuggestions(error: Error, context: ErrorContext): string[] {
  const classification = classifyError(error, context);
  
  switch (classification.type) {
    case 'network':
      return [
        'Check your internet connection',
        'Try refreshing the page',
        'Wait a moment and try again'
      ];
    case 'database':
      return [
        'Try refreshing the page',
        'Wait a moment and try again',
        'Contact support if the problem persists'
      ];
    case 'server':
      return [
        'Try again in a few minutes',
        'Refresh the page',
        'Contact support if the problem continues'
      ];
    case 'permission':
      return [
        'Contact your administrator',
        'Check if you need to sign in again',
        'Verify your account permissions'
      ];
    case 'validation':
      return [
        'Check your input values',
        'Ensure all required fields are filled',
        'Try a different approach'
      ];
    case 'component':
      return [
        'Try refreshing the page',
        'Clear your browser cache',
        'Try again later'
      ];
    default:
      return [
        'Try refreshing the page',
        'Wait a moment and try again',
        'Contact support if the problem persists'
      ];
  }
}

/**
 * Check if error is transient (temporary)
 */
export function isTransientError(error: Error): boolean {
  const message = error.message.toLowerCase();
  
  return (
    message.includes('timeout') ||
    message.includes('network') ||
    message.includes('connection') ||
    message.includes('503') ||
    message.includes('502') ||
    message.includes('504') ||
    message.includes('temporary')
  );
}

/**
 * Check if error requires immediate user attention
 */
export function requiresUserAction(error: Error, context: ErrorContext): boolean {
  const classification = classifyError(error, context);
  return classification.userActionRequired;
}

/**
 * Get appropriate retry strategy
 */
export function getRetryStrategy(error: Error, context: ErrorContext): {
  shouldRetry: boolean;
  delay: number;
  exponentialBackoff: boolean;
} {
  const classification = classifyError(error, context);
  
  if (!classification.retryable) {
    return {
      shouldRetry: false,
      delay: 0,
      exponentialBackoff: false
    };
  }
  
  const baseDelay = classification.type === 'network' ? 2000 : 1000;
  
  return {
    shouldRetry: context.retryCount < context.maxRetries,
    delay: calculateRetryDelay(context.retryCount, baseDelay),
    exponentialBackoff: true
  };
}