/**
 * Security Issues Fix Script
 * Addresses vulnerabilities identified in security audit
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 Fixing Security Issues');
console.log('Addressing vulnerabilities identified in security audit');
console.log('='.repeat(60));

// Security issues identified from audit
const SECURITY_ISSUES = [
  {
    type: 'MISSING_RATE_LIMITING',
    severity: 'MEDIUM',
    description: 'Authentication endpoints lack rate limiting',
    priority: 'HIGH'
  },
  {
    type: 'CORS_CONFIG',
    severity: 'LOW',
    description: 'CORS configuration may be too permissive',
    priority: 'MEDIUM'
  },
  {
    type: 'INFORMATION_DISCLOSURE',
    severity: 'LOW',
    description: 'Error messages may leak internal details',
    priority: 'LOW'
  }
];

// Function to implement rate limiting middleware
function implementRateLimiting() {
  console.log('\n🔧 Implementing rate limiting middleware...');
  
  const rateLimitPath = path.join(process.cwd(), 'src', 'lib', 'rate-limit-middleware.ts');
  
  const rateLimitMiddleware = `/**
 * Rate Limiting Middleware
 * Prevents brute force attacks on authentication endpoints
 */

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  '/api/auth/login': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    message: 'Too many login attempts. Please try again in 15 minutes.'
  },
  '/api/auth/register': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 registrations per hour
    message: 'Too many registration attempts. Please try again in 1 hour.'
  },
  '/api/auth/reset-password': {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 reset attempts per hour
    message: 'Too many password reset attempts. Please try again in 1 hour.'
  }
};

export function withRateLimit(handler: Function, endpoint: string) {
  return async (req: Request) => {
    const config = RATE_LIMITS[endpoint];
    if (!config) {
      return handler(req);
    }
    
    // Get client identifier (IP address or user ID)
    const clientId = getClientIdentifier(req);
    const now = Date.now();
    const key = \`\${endpoint}:\${clientId}\`;
    
    // Get current rate limit data
    let rateLimitData = rateLimitStore.get(key);
    
    // Reset if window has expired
    if (!rateLimitData || now > rateLimitData.resetTime) {
      rateLimitData = {
        count: 0,
        resetTime: now + config.windowMs
      };
    }
    
    // Check if limit exceeded
    if (rateLimitData.count >= config.maxRequests) {
      const resetIn = Math.ceil((rateLimitData.resetTime - now) / 1000);
      
      return new Response(JSON.stringify({
        error: config.message,
        retryAfter: resetIn
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': resetIn.toString(),
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitData.resetTime.toString()
        }
      });
    }
    
    // Increment counter
    rateLimitData.count++;
    rateLimitStore.set(key, rateLimitData);
    
    // Add rate limit headers to response
    const response = await handler(req);
    
    if (response instanceof Response) {
      response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', (config.maxRequests - rateLimitData.count).toString());
      response.headers.set('X-RateLimit-Reset', rateLimitData.resetTime.toString());
    }
    
    return response;
  };
}

function getClientIdentifier(req: Request): string {
  // Try to get IP address from various headers
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  
  return forwarded?.split(',')[0] || 
         realIp || 
         cfConnectingIp || 
         'unknown';
}

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Cleanup every 5 minutes
`;

  try {
    fs.writeFileSync(rateLimitPath, rateLimitMiddleware);
    console.log('✅ Rate limiting middleware created');
    return true;
  } catch (error) {
    console.error('❌ Failed to create rate limiting middleware:', error.message);
    return false;
  }
}

// Function to create secure CORS configuration
function implementSecureCORS() {
  console.log('\n🔧 Implementing secure CORS configuration...');
  
  const corsConfigPath = path.join(process.cwd(), 'src', 'lib', 'cors-config.ts');
  
  const corsConfig = `/**
 * Secure CORS Configuration
 * Restricts cross-origin requests to authorized domains
 */

export const CORS_CONFIG = {
  development: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3003',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3003'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin'
    ]
  },
  production: {
    origin: [
      'https://formulapm.com',
      'https://www.formulapm.com',
      'https://app.formulapm.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With'
    ]
  }
};

export function getCORSHeaders(origin?: string): Record<string, string> {
  const config = process.env.NODE_ENV === 'production' 
    ? CORS_CONFIG.production 
    : CORS_CONFIG.development;
  
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': config.methods.join(', '),
    'Access-Control-Allow-Headers': config.allowedHeaders.join(', '),
    'Access-Control-Max-Age': '86400' // 24 hours
  };
  
  // Check if origin is allowed
  if (origin && config.origin.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    if (config.credentials) {
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
  }
  
  return headers;
}

export function withCORS(handler: Function) {
  return async (req: Request) => {
    const origin = req.headers.get('origin');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: getCORSHeaders(origin)
      });
    }
    
    // Process the actual request
    const response = await handler(req);
    
    // Add CORS headers to response
    if (response instanceof Response) {
      const corsHeaders = getCORSHeaders(origin);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }
    
    return response;
  };
}
`;

  try {
    fs.writeFileSync(corsConfigPath, corsConfig);
    console.log('✅ Secure CORS configuration created');
    return true;
  } catch (error) {
    console.error('❌ Failed to create CORS configuration:', error.message);
    return false;
  }
}

// Function to implement secure error handling
function implementSecureErrorHandling() {
  console.log('\n🔧 Implementing secure error handling...');
  
  const errorHandlerPath = path.join(process.cwd(), 'src', 'lib', 'secure-error-handler.ts');
  
  const errorHandler = `/**
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
`;

  try {
    fs.writeFileSync(errorHandlerPath, errorHandler);
    console.log('✅ Secure error handling created');
    return true;
  } catch (error) {
    console.error('❌ Failed to create secure error handler:', error.message);
    return false;
  }
}

// Function to create security headers middleware
function implementSecurityHeaders() {
  console.log('\n🔧 Implementing security headers middleware...');
  
  const securityHeadersPath = path.join(process.cwd(), 'src', 'lib', 'security-headers.ts');
  
  const securityHeaders = `/**
 * Security Headers Middleware
 * Adds security headers to all responses
 */

export const SECURITY_HEADERS = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Enable XSS protection
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' http://127.0.0.1:54321 ws://127.0.0.1:54321",
    "frame-ancestors 'none'"
  ].join('; '),
  
  // Strict Transport Security (HTTPS only)
  ...(process.env.NODE_ENV === 'production' && {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  })
};

export function withSecurityHeaders(handler: Function) {
  return async (req: Request) => {
    const response = await handler(req);
    
    if (response instanceof Response) {
      // Add security headers
      Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        if (value) {
          response.headers.set(key, value);
        }
      });
      
      // Remove potentially sensitive headers
      response.headers.delete('Server');
      response.headers.delete('X-Powered-By');
    }
    
    return response;
  };
}
`;

  try {
    fs.writeFileSync(securityHeadersPath, securityHeaders);
    console.log('✅ Security headers middleware created');
    return true;
  } catch (error) {
    console.error('❌ Failed to create security headers:', error.message);
    return false;
  }
}

// Main execution function
async function fixSecurityIssues() {
  console.log('🔒 Starting security fixes...');
  
  const results = {
    rateLimitingImplemented: false,
    corsConfigured: false,
    errorHandlingSecured: false,
    securityHeadersAdded: false
  };
  
  try {
    // Implement rate limiting
    results.rateLimitingImplemented = implementRateLimiting();
    
    // Configure secure CORS
    results.corsConfigured = implementSecureCORS();
    
    // Implement secure error handling
    results.errorHandlingSecured = implementSecureErrorHandling();
    
    // Add security headers
    results.securityHeadersAdded = implementSecurityHeaders();
    
    // Generate summary
    console.log('\n' + '='.repeat(60));
    console.log('🔒 SECURITY FIXES SUMMARY');
    console.log('='.repeat(60));
    
    SECURITY_ISSUES.forEach(issue => {
      const icon = issue.severity === 'HIGH' ? '🔴' : 
                   issue.severity === 'MEDIUM' ? '🟡' : '🟢';
      console.log(`${icon} ${issue.description} - ${issue.priority} Priority`);
    });
    
    console.log('\n📋 Applied Fixes:');
    console.log(`✅ Rate Limiting: ${results.rateLimitingImplemented ? 'Implemented' : 'Failed'}`);
    console.log(`✅ CORS Configuration: ${results.corsConfigured ? 'Secured' : 'Failed'}`);
    console.log(`✅ Error Handling: ${results.errorHandlingSecured ? 'Secured' : 'Failed'}`);
    console.log(`✅ Security Headers: ${results.securityHeadersAdded ? 'Added' : 'Failed'}`);
    
    console.log('\n🎯 Security Improvements:');
    console.log('- Rate limiting prevents brute force attacks');
    console.log('- CORS configuration restricts unauthorized origins');
    console.log('- Error messages sanitized to prevent information disclosure');
    console.log('- Security headers protect against common attacks');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Update API routes to use new security middleware');
    console.log('2. Test rate limiting functionality');
    console.log('3. Verify CORS configuration in production');
    console.log('4. Proceed to data security audit (Task 4.2)');
    
    console.log('\n✅ Security fixes completed!');
    
  } catch (error) {
    console.error('❌ Security fixes failed:', error);
  }
}

// Run the fixes
if (require.main === module) {
  fixSecurityIssues();
}

module.exports = { fixSecurityIssues };