import { NextRequest, NextResponse } from 'next/server'
import { withAuth, getAuthenticatedUser } from '@/lib/middleware'
import { UserProfile } from '@/types/auth'

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const user = getAuthenticatedUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const { createServerClient } = require('@/lib/supabase')
    const supabase = createServerClient()

    // Get user profile
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Profile fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        role: profile.role,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone: profile.phone,
        company: profile.company,
        department: profile.department,
        permissions: profile.permissions || {},
        is_active: profile.is_active,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      }
    })

  } catch (error) {
    console.error('Profile API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const PUT = withAuth(async (request: NextRequest) => {
  try {
    const user = getAuthenticatedUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const updates: Partial<UserProfile> = body

    // Validate allowed fields for update
    const allowedFields = ['first_name', 'last_name', 'phone', 'department']
    const filteredUpdates: any = {}

    for (const field of allowedFields) {
      if (updates[field as keyof UserProfile] !== undefined) {
        filteredUpdates[field] = updates[field as keyof UserProfile]
      }
    }

    // Validate required fields
    if (filteredUpdates.first_name !== undefined && !filteredUpdates.first_name?.trim()) {
      return NextResponse.json(
        { error: 'First name is required' },
        { status: 400 }
      )
    }

    if (filteredUpdates.last_name !== undefined && !filteredUpdates.last_name?.trim()) {
      return NextResponse.json(
        { error: 'Last name is required' },
        { status: 400 }
      )
    }

    // Validate phone format if provided
    if (filteredUpdates.phone) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
      if (!phoneRegex.test(filteredUpdates.phone.replace(/[-\s\(\)]/g, ''))) {
        return NextResponse.json(
          { error: 'Invalid phone number format' },
          { status: 400 }
        )
      }
    }

    const { createServerClient } = require('@/lib/supabase')
    const supabase = createServerClient()

    // Update user profile
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...filteredUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Profile update error:', error)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        id: data.id,
        role: data.role,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        department: data.department,
        permissions: data.permissions || {},
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at
      }
    })

  } catch (error) {
    console.error('Profile update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})