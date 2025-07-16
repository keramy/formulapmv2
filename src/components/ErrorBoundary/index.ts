/**
 * Error Boundary Module
 * Comprehensive error boundary system for React component crash recovery
 */

// Core error boundary components
export {
  ErrorBoundary,
  PageErrorBoundary,
  FeatureErrorBoundary,
  ComponentErrorBoundary,
  EnhancedErrorBoundary,
  withErrorBoundary,
  ErrorBoundaryProvider,
  ErrorBoundaryContext,
  useErrorBoundary,
  useErrorReporting,
  useErrorBoundaryContext
} from '../ErrorBoundary';

// Specialized fallback components
export {
  NetworkErrorFallback,
  DatabaseErrorFallback,
  ServerErrorFallback,
  PermissionErrorFallback,
  NotFoundErrorFallback,
  ComponentErrorFallback,
  InlineErrorFallback,
  getErrorFallback
} from './fallback-components';

// Error utilities and helpers
export {
  generateErrorId,
  getErrorInfo,
  classifyError,
  shouldAutoRetry,
  calculateRetryDelay,
  reportError,
  sanitizeErrorForDisplay,
  generateUserMessage,
  getRecoverySuggestions,
  isTransientError,
  requiresUserAction,
  getRetryStrategy
} from './error-utils';

// Test components (development only)
export {
  ErrorBoundaryTestPage,
  SimpleErrorTest,
  NestedErrorBoundaryTest
} from './test-components';

// Types
export type {
  ErrorInfo,
  ErrorContext,
  ErrorClassification
} from './error-utils';

// Re-export main ErrorBoundary component as default
export { ErrorBoundary as default } from '../ErrorBoundary';