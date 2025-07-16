import { NextRequest, NextResponse } from 'next/server'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'
import { createServerClient, supabaseAdmin } from '@/lib/supabase'
import { LoginCredentials } from '@/types/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password }: LoginCredentials = body

    // Validate input
    if (!email || !password) {
      return createErrorResponse('Email and password are required', 400)
    }

    // Create server client
    const supabase = createServerClient()

    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    })

    if (error) {
      console.error('Login error:', error)
      return createErrorResponse(error.message, 401)
    }

    // Get user profile using admin client to bypass RLS
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return createErrorResponse('Failed to fetch user profile', 500)
    }

    // Check if user is active
    if (!profile.is_active) {
      return createErrorResponse('Account is deactivated. Please contact administrator.', 403)
    }

    // Update JWT claims with user role information
    try {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        data.user.id,
        {
          app_metadata: {
            user_role: profile.role,
            user_id: profile.id,
            is_active: profile.is_active,
            updated_at: new Date().toISOString()
          }
        }
      )

      if (updateError) {
        console.error('JWT claims update error:', updateError)
        // Don't fail the login, just log the error
      }
    } catch (jwtError) {
      console.error('JWT update error:', jwtError)
      // Don't fail the login, just log the error
    }

    return createSuccessResponse({
      user: data.user,
      profile,
      session: data.session,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Login API error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}