/**
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
    const key = `${endpoint}:${clientId}`;
    
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
