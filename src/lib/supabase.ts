import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Environment variable validation with detailed error messages
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Comprehensive environment validation
function validateEnvironment() {
  const missing = []

  if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  if (!supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY')

  if (missing.length > 0) {
    throw new Error(
      `Missing required Supabase environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file and ensure all required variables are set.'
    )
  }

  // Validate URL format
  try {
    new URL(supabaseUrl!)
  } catch {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL must be a valid URL')
  }
}

// Validate environment on module load
validateEnvironment()

// Client for browser/client-side operations with optimized configuration
export const supabase = createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,  // Disabled to prevent URL conflicts
    flowType: 'implicit',       // Using implicit flow for better compatibility
    debug: process.env.NODE_ENV === 'development'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'formulapm-web'
    }
  }
})

// Admin client for server-side operations with elevated permissions
export const supabaseAdmin = createClient<Database>(supabaseUrl!, supabaseServiceKey!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
})

// Server-side client for API routes with validation
export const createServerClient = () => {
  // Ensure environment is still valid at runtime
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables not properly initialized')
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
    db: {
      schema: 'public'
    }
  })
}