import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'
import { ChangePasswordData } from '@/types/auth'

export const POST = withAuth(async (request: NextRequest, { user, profile }) => {
  if (!user || !profile) {
    return createErrorResponse('Authentication required', 401)
  }

  try {
    const body = await request.json()
    const { currentPassword, newPassword, confirmPassword }: ChangePasswordData = body

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return createErrorResponse('All password fields are required', 400)
    }

    if (newPassword !== confirmPassword) {
      return createErrorResponse('New passwords do not match', 400)
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return createErrorResponse('New password must be at least 8 characters long', 400)
    }

    if (currentPassword === newPassword) {
      return createErrorResponse('New password must be different from current password', 400)
    }

    // Additional password complexity checks
    const hasUpperCase = /[A-Z]/.test(newPassword)
    const hasLowerCase = /[a-z]/.test(newPassword)
    const hasNumbers = /\d/.test(newPassword)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)

    if (!(hasUpperCase && hasLowerCase && hasNumbers)) {
      return createErrorResponse('Password must contain at least one uppercase letter, one lowercase letter, and one number', 400)
    }

    const { createServerClient } = require('@/lib/supabase')
    const supabase = createServerClient()

    // Get current session
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return createErrorResponse('No active session found', 401)
    }

    // Verify current password by attempting to sign in
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: session.user.email!,
      password: currentPassword
    })

    if (verifyError) {
      return createErrorResponse('Current password is incorrect', 400)
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (updateError) {
      console.error('Password update error:', updateError)
      return createErrorResponse('Failed to update password', 500)
    }

    // Update the user profile's updated_at timestamp
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', session.user.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
      // Don't fail the request if this fails
    }

    return createSuccessResponse({ message: 'Password updated successfully' })

  } catch (error) {
    console.error('Change password API error:', error)
    return createErrorResponse('Internal server error', 500)
  }
})