/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  // Suppress hydration warnings caused by browser extensions
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons'],
  },
  // Additional options to reduce hydration warnings
  poweredByHeader: false,
}

module.exports = nextConfig