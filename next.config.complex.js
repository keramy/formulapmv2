/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false,
})

const isDev = process.env.NODE_ENV === 'development';

const nextConfig = {
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    // Optimize image loading
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  // Skip linting during build for now
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Optimize server components
  serverExternalPackages: [
    'bcrypt',
    'bcryptjs'
  ],
  // Suppress hydration warnings caused by browser extensions and performance optimizations
  experimental: {
    // Only enable heavy optimizations in production
    ...(isDev ? {} : {
      // Enhanced package import optimization
      optimizePackageImports: [
        // Icons and UI components
        'lucide-react',
        '@radix-ui/react-icons',
        '@radix-ui/react-dialog',
        '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-select',
        '@radix-ui/react-popover',
        '@radix-ui/react-tooltip',
        '@radix-ui/react-tabs',
        '@radix-ui/react-checkbox',
        '@radix-ui/react-radio-group',
        
        // Core framework
        'react',
        'react-dom',
        
        // Supabase
        '@supabase/supabase-js',
        '@supabase/auth-helpers-nextjs',
        '@supabase/ssr',
        
        // Utilities
        'date-fns',
        'clsx',
        'class-variance-authority',
        'tailwind-merge',
        
        // Forms and validation
        'react-hook-form',
        '@hookform/resolvers',
        'zod',
        
        // Charts and visualization
        'recharts',
        
        // Table
        '@tanstack/react-table'
      ],
      // Enable optimized CSS handling in production
      optimizeCss: true,
    }),
    
    // Enable React compiler optimizations (if supported)
    // reactCompiler: true
  },
  // Additional options to reduce hydration warnings
  poweredByHeader: false,
  compress: true,
  // Enhanced bundle analysis and performance optimizations
  webpack: (config, { dev, isServer, webpack }) => {
    
    if (dev) {
      // Minimal optimization for faster builds in development
      config.optimization.splitChunks = {
        chunks: 'async', // Only split async chunks in dev
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\/]node_modules[\/]/,
            name: 'vendors',
            priority: -10,
            reuseExistingChunk: true,
          },
        },
      };
      config.optimization.minimizer = [];
      return config;
    }
    
    // Enhanced chunk splitting for better caching and loading performance (production only)
    if (!isServer && !dev) {
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        maxAsyncRequests: 25,
        cacheGroups: {
          // React framework chunk (React, Next.js core) - TEMPORARILY DISABLED
          // reactFramework: {
          //   test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
          //   name: 'react-framework',
          //   chunks: 'all',
          //   priority: 40,
          //   enforce: true,
          // },
          // Supabase chunk
          supabase: {
            test: /[\\/]node_modules[\\/]@supabase[\\/]/,
            name: 'supabase',
            chunks: 'all',
            priority: 35,
            enforce: true,
          },
          // Radix UI chunk
          radixui: {
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            name: 'radix-ui',
            chunks: 'all',
            priority: 30,
            enforce: true,
          },
          // Charts and visualization
          charts: {
            test: /[\\/]node_modules[\\/](recharts|d3|chart\.js)[\\/]/,
            name: 'charts',
            chunks: 'all',
            priority: 25,
            enforce: true,
          },
          // Icons chunk
          icons: {
            test: /[\\/]node_modules[\\/](lucide-react|@radix-ui\/react-icons)[\\/]/,
            name: 'icons',
            chunks: 'all',
            priority: 20,
            enforce: true,
          },
          // Utilities chunk
          utils: {
            test: /[\\/]node_modules[\\/](date-fns|clsx|class-variance-authority|tailwind-merge)[\\/]/,
            name: 'utils',
            chunks: 'all',
            priority: 15,
            enforce: true,
          },
          // PDF and document processing
          documents: {
            test: /[\\/]node_modules[\\/](@react-pdf|react-pdf|exceljs)[\\/]/,
            name: 'documents',
            chunks: 'all',
            priority: 10,
            enforce: true,
          },
          // Default vendor chunk for remaining node_modules
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 5,
            minChunks: 1,
          },
          // Common application code
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 1,
            enforce: true,
          },
        },
      };
      
      // Tree shaking optimizations
      // Note: usedExports conflicts with cacheUnaffected in Next.js 15
      // config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      
      // Module concatenation for better performance
      config.optimization.concatenateModules = true;
    }
    
    // Bundle analyzer integration
    if (process.env.ANALYZE === 'true') {
      config.plugins.push(
        new webpack.DefinePlugin({
          '__BUNDLE_ANALYZE__': JSON.stringify(true),
        })
      );
    }
    
    // Development-specific optimizations
    if (dev) {
      // Faster rebuilds in development
      config.optimization.removeAvailableModules = false;
      config.optimization.removeEmptyChunks = false;
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          // Smaller chunks in development for faster HMR
          default: {
            minChunks: 1,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      };
    }
    
    // Production-specific optimizations
    if (!dev) {
      // Enable aggressive chunk optimization in production
      config.optimization.realContentHash = true;
      
      // Minimize chunk overhead
      config.optimization.moduleIds = 'deterministic';
      config.optimization.chunkIds = 'deterministic';
    }
    
    // Add performance hints with more realistic limits
    config.performance = {
      hints: dev ? false : 'warning',
      maxEntrypointSize: 1024000, // 1MB - more realistic for modern React apps
      maxAssetSize: 1024000, // 1MB
    };
    
    // Optimize resolve for faster builds
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        // Optimize common imports
        '@': require('path').resolve(__dirname, './src'),
      },
    };
    
    return config;
  },
  // Security headers
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
            key: 'X-XSS-Protection',
            value: '1; mode=block',
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