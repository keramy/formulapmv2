import { NextRequest, NextResponse } from 'next/server'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'
import { createServerClient } from '@/lib/supabase'
import { ResetPasswordData } from '@/types/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email }: ResetPasswordData = body

    // Validate input
    if (!email) {
      return createErrorResponse('Email is required', 400)
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return createErrorResponse('Invalid email format', 400)
    }

    const supabase = createServerClient()

    // Check if user exists and is active
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, is_active')
      .eq('email', email.trim().toLowerCase())
      .single()

    if (!profile) {
      // Don't reveal if user exists or not for security
      return createSuccessResponse({
        message: 'If an account with that email exists, a password reset link has been sent.',
        timestamp: new Date().toISOString()
      })
    }

    if (!profile.is_active) {
      return createErrorResponse('Account is deactivated. Please contact administrator.', 403)
    }

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password/confirm`
    })

    if (error) {
      console.error('Password reset error:', error)
      return createErrorResponse('Failed to send password reset email', 500)
    }

    return createSuccessResponse({
      message: 'Password reset link sent to your email address',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Reset password API error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { password, confirmPassword } = body

    // Validate input
    if (!password || !confirmPassword) {
      return NextResponse.json(
        { error: 'Password and confirmation are required' },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Get current session (from reset link)
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 401 }
      )
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      console.error('Password update error:', error)
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    })

  } catch (error) {
    console.error('Password update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}