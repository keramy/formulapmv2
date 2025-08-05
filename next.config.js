/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false,
})

const nextConfig = {
  // Essential image configuration
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  
  // Skip linting during build to prevent worker overload
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Essential server packages
  serverExternalPackages: [
    'bcrypt',
    'bcryptjs'
  ],
  
  // Minimal experimental features
  experimental: {
    // Only enable in production and only essential optimizations
    ...(process.env.NODE_ENV === 'production' ? {
      optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    } : {}),
  },
  
  // Basic settings
  poweredByHeader: false,
  compress: true,
  
  // Simplified webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Development: Keep it simple for fast builds
    if (dev) {
      // Minimal optimization to prevent worker crashes
      config.optimization.splitChunks = {
        chunks: 'async',
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      };
      return config;
    }
    
    // Production: Essential optimizations only
    if (!isServer && !dev) {
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 10, // Reduced from 25
        maxAsyncRequests: 10,   // Reduced from 25
        cacheGroups: {
          // Core vendor chunk
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          // Common application code
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
          },
        },
      };
    }
    
    return config;
  },
  
  // Essential security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'development' 
              ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co http://127.0.0.1:54321 ws://127.0.0.1:54321;"
              : "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co;",
          },
        ],
      },
    ]
  },
}

module.exports = withBundleAnalyzer(nextConfig)