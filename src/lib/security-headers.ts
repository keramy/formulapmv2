/**
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
