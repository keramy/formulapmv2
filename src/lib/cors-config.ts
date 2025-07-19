/**
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
