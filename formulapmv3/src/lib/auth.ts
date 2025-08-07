// SIMPLE AUTHENTICATION UTILITY - NO DEPENDENCIES
// This version works without Redis or complex middleware
import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export interface AuthResult {
  user: any | null
  profile: any | null
  error: string | null
}

export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // Get JWT token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        user: null,
        profile: null,
        error: 'No authorization token provided'
      }
    }

    const token = authHeader.split(' ')[1]
    if (!token) {
      return {
        user: null,
        profile: null,
        error: 'Invalid authorization format'
      }
    }

    // Verify the JWT token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return {
        user: null,
        profile: null,
        error: 'Invalid or expired token'
      }
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return {
        user: null,
        profile: null,
        error: 'User profile not found'
      }
    }

    // Check if user is active
    if (!profile.is_active) {
      return {
        user: null,
        profile: null,
        error: 'User account is inactive'
      }
    }

    return {
      user,
      profile,
      error: null
    }

  } catch (error) {
    console.error('Authentication error:', error)
    return {
      user: null,
      profile: null,
      error: 'Authentication failed'
    }
  }
}