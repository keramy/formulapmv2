import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, supabaseAdmin } from '@/lib/supabase'
import { LoginCredentials } from '@/types/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password }: LoginCredentials = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
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
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    // Get user profile using admin client to bypass RLS
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    // Check if user is active
    if (!profile.is_active) {
      return NextResponse.json(
        { error: 'Account is deactivated. Please contact administrator.' },
        { status: 403 }
      )
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

    return NextResponse.json({
      success: true,
      user: data.user,
      profile,
      session: data.session
    })

  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}