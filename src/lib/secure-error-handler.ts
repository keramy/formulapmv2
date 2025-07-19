/**
 * Secure Error Handler
 * Sanitizes error messages to prevent information disclosure
 */

interface SecureError {
  message: string;
  code?: string;
  statusCode: number;
}

const SAFE_ERROR_MESSAGES: Record<string, string> = {
  // Authentication errors
  'Invalid login credentials': 'Invalid email or password',
  'Email not confirmed': 'Please verify your email address',
  'User not found': 'Invalid email or password',
  'Invalid password': 'Invalid email or password',
  
  // Authorization errors
  'Insufficient permissions': 'Access denied',
  'Role not authorized': 'Access denied',
  'Resource not found': 'Resource not found',
  
  // Database errors
  'Connection failed': 'Service temporarily unavailable',
  'Query timeout': 'Request timeout',
  'Constraint violation': 'Invalid data provided',
  
  // Generic errors
  'Internal server error': 'An unexpected error occurred',
  'Service unavailable': 'Service temporarily unavailable'
};

export function sanitizeError(error: any): SecureError {
  // Default secure error
  let secureError: SecureError = {
    message: 'An unexpected error occurred',
    statusCode: 500
  };
  
  // Handle known error types
  if (error.code === 'PGRST116') {
    secureError = {
      message: 'Resource not found',
      statusCode: 404
    };
  } else if (error.code === 'PGRST109') {
    secureError = {
      message: 'Access denied',
      statusCode: 403
    };
  } else if (error.code === '23505') {
    secureError = {
      message: 'Duplicate entry',
      statusCode: 409
    };
  } else if (error.code === '23503') {
    secureError = {
      message: 'Invalid reference',
      statusCode: 400
    };
  } else if (error.message && SAFE_ERROR_MESSAGES[error.message]) {
    secureError = {
      message: SAFE_ERROR_MESSAGES[error.message],
      statusCode: error.statusCode || 400
    };
  }
  
  // In development, include more details
  if (process.env.NODE_ENV === 'development') {
    secureError.code = error.code;
    // Still sanitize but provide more context
    if (error.message && !SAFE_ERROR_MESSAGES[error.message]) {
      secureError.message = error.message;
    }
  }
  
  return secureError;
}

export function createSecureErrorResponse(error: any): Response {
  const secureError = sanitizeError(error);
  
  // Log the actual error for debugging (server-side only)
  console.error('[SECURE_ERROR]', {
    originalError: error.message,
    code: error.code,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    timestamp: new Date().toISOString()
  });
  
  return new Response(JSON.stringify({
    success: false,
    error: secureError.message,
    ...(secureError.code && { code: secureError.code })
  }), {
    status: secureError.statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });
}
