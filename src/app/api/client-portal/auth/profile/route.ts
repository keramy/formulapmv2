/**
 * Client Portal Authentication - Profile Endpoint
 * Get and update client profile information
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { 
  clientPasswordChangeSchema,
  clientUserUpdateSchema,
  validateClientPortalInput 
} from '@/lib/validation/client-portal'
import { 
  withClientAuth,
  getClientUser,
  logClientActivity
} from '@/lib/middleware/client-auth'
import { ClientApiResponse } from '@/types/client-portal'
import bcrypt from 'bcryptjs'

// ============================================================================
// GET /api/client-portal/auth/profile - Get Client Profile
// ============================================================================

export const GET = withClientAuth(async (request: NextRequest) => {
  try {
    const clientUser = getClientUser(request)
    if (!clientUser) {
      return NextResponse.json(
        { success: false, error: 'Client user not found in request' } as ClientApiResponse<null>,
        { status: 401 }
      )
    }

    const supabase = createServerClient()

    // Get complete client profile with related data
    const { data: profile, error } = await supabase
      .from('client_users')
      .select(`
        *,
        user_profile:user_profiles(
          id, first_name, last_name, email, phone, 
          is_active, created_at, updated_at
        ),
        client_company:client_companies(
          id, company_name, company_type, primary_email, 
          primary_phone, address, logo_url, brand_colors,
          is_active
        )
      `)
      .eq('id', clientUser.id)
      .single()

    if (error || !profile) {
      console.error('Client profile fetch error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch profile' } as ClientApiResponse<null>,
        { status: 500 }
      )
    }

    // Log profile access
    await logClientActivity(clientUser.id, 'profile_update', {
      action_taken: 'Profile viewed',
      description: 'Client user accessed their profile information',
      ip_address: request.ip,
      user_agent: request.headers.get('user-agent') || undefined,
      metadata: {
        profile_accessed: true
      }
    })

    // Prepare safe profile data (exclude sensitive fields)
    const safeProfile = {
      id: profile.id,
      access_level: profile.access_level,
      portal_access_enabled: profile.portal_access_enabled,
      two_factor_enabled: profile.two_factor_enabled,
      notification_preferences: profile.notification_preferences,
      language: profile.language,
      timezone: profile.timezone,
      theme: profile.theme,
      last_login: profile.last_login,
      last_activity: profile.last_activity,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      user_profile: {
        id: profile.user_profile.id,
        first_name: profile.user_profile.first_name,
        last_name: profile.user_profile.last_name,
        email: profile.user_profile.email,
        phone: profile.user_profile.phone,
        is_active: profile.user_profile.is_active,
        created_at: profile.user_profile.created_at,
        updated_at: profile.user_profile.updated_at
      },
      client_company: {
        id: profile.client_company.id,
        company_name: profile.client_company.company_name,
        company_type: profile.client_company.company_type,
        primary_email: profile.client_company.primary_email,
        primary_phone: profile.client_company.primary_phone,
        address: profile.client_company.address,
        logo_url: profile.client_company.logo_url,
        brand_colors: profile.client_company.brand_colors,
        is_active: profile.client_company.is_active
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: { profile: safeProfile }
      } as ClientApiResponse<{ profile: any }>,
      { status: 200 }
    )

  } catch (error) {
    console.error('Client profile fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' } as ClientApiResponse<null>,
      { status: 500 }
    )
  }
})

// ============================================================================
// PUT /api/client-portal/auth/profile - Update Client Profile
// ============================================================================

export const PUT = withClientAuth(async (request: NextRequest) => {
  try {
    const clientUser = getClientUser(request)
    if (!clientUser) {
      return NextResponse.json(
        { success: false, error: 'Client user not found in request' } as ClientApiResponse<null>,
        { status: 401 }
      )
    }

    const body = await request.json()
    const validationResult = validateClientPortalInput(clientUserUpdateSchema, body)

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid profile data',
          details: validationResult.error.errors.map(e => e.message)
        } as ClientApiResponse<null>,
        { status: 400 }
      )
    }

    const updateData = validationResult.data
    const supabase = createServerClient()

    // Update client user preferences
    const { data: updatedUser, error: updateError } = await supabase
      .from('client_users')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientUser.id)
      .select(`
        *,
        user_profile:user_profiles(
          id, first_name, last_name, email, phone, is_active
        ),
        client_company:client_companies(
          id, company_name, company_type, is_active
        )
      `)
      .single()

    if (updateError) {
      console.error('Client profile update error:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update profile' } as ClientApiResponse<null>,
        { status: 500 }
      )
    }

    // Log profile update
    await logClientActivity(clientUser.id, 'profile_update', {
      action_taken: 'Profile updated',
      description: 'Client user updated their profile preferences',
      ip_address: request.ip,
      user_agent: request.headers.get('user-agent') || undefined,
      metadata: {
        profile_updated: true,
        updated_fields: Object.keys(updateData)
      }
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Profile updated successfully',
        data: { profile: updatedUser }
      } as ClientApiResponse<{ profile: any }>,
      { status: 200 }
    )

  } catch (error) {
    console.error('Client profile update error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' } as ClientApiResponse<null>,
      { status: 500 }
    )
  }
})

// ============================================================================
// POST /api/client-portal/auth/profile - Change Password
// ============================================================================

export const POST = withClientAuth(async (request: NextRequest) => {
  try {
    const clientUser = getClientUser(request)
    if (!clientUser) {
      return NextResponse.json(
        { success: false, error: 'Client user not found in request' } as ClientApiResponse<null>,
        { status: 401 }
      )
    }

    const body = await request.json()
    const validationResult = validateClientPortalInput(clientPasswordChangeSchema, body)

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid password change data',
          details: validationResult.error.errors.map(e => e.message)
        } as ClientApiResponse<null>,
        { status: 400 }
      )
    }

    const { current_password, new_password } = validationResult.data
    const supabase = createServerClient()

    // Get current password hash
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('password_hash')
      .eq('id', clientUser.user_profile_id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { success: false, error: 'Failed to verify current password' } as ClientApiResponse<null>,
        { status: 500 }
      )
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(current_password, userProfile.password_hash)
    if (!isValidPassword) {
      await logClientActivity(clientUser.id, 'profile_update', {
        action_taken: 'Password change failed',
        description: 'Invalid current password provided',
        ip_address: request.ip,
        user_agent: request.headers.get('user-agent') || undefined,
        metadata: {
          password_change_failed: true,
          reason: 'invalid_current_password'
        }
      })

      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' } as ClientApiResponse<null>,
        { status: 400 }
      )
    }

    // Hash new password
    const saltRounds = 12
    const newPasswordHash = await bcrypt.hash(new_password, saltRounds)

    // Update password
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientUser.user_profile_id)

    if (updateError) {
      console.error('Password update error:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update password' } as ClientApiResponse<null>,
        { status: 500 }
      )
    }

    // Reset password_reset_required flag if it was set
    await supabase
      .from('client_users')
      .update({
        password_reset_required: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientUser.id)

    // Log successful password change
    await logClientActivity(clientUser.id, 'profile_update', {
      action_taken: 'Password changed',
      description: 'Client user successfully changed their password',
      ip_address: request.ip,
      user_agent: request.headers.get('user-agent') || undefined,
      metadata: {
        password_changed: true,
        security_action: true
      }
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Password changed successfully'
      } as ClientApiResponse<null>,
      { status: 200 }
    )

  } catch (error) {
    console.error('Client password change error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to change password' } as ClientApiResponse<null>,
      { status: 500 }
    )
  }
})