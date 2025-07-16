import { NextRequest, NextResponse } from 'next/server'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'
import { createServerClient } from '@/lib/supabase'
import { RegisterData } from '@/types/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, first_name, last_name, role, phone, company, department }: RegisterData = body

    // Validate required fields
    if (!email || !password || !first_name || !last_name || !role) {
      return createErrorResponse('Email, password, first name, last name, and role are required', 400)
    }

    // Validate password strength
    if (password.length < 8) {
      return createErrorResponse('Password must be at least 8 characters long', 400)
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return createErrorResponse('Invalid email format', 400)
    }

    // Create server client with service role for user creation
    const { supabaseAdmin } = await import('@/lib/supabase')
    const supabase = supabaseAdmin

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .single()

    if (existingUser) {
      return createErrorResponse('User with this email already exists', 409)
    }

    // Create auth user using admin client
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        role
      }
    })

    if (authError) {
      console.error('Auth signup error:', authError)
      return createErrorResponse(authError.message, 400)
    }

    if (!authData.user) {
      return createErrorResponse('Failed to create user account', 500)
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        role,
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        company: company?.trim() || null,
        department: department?.trim() || null,
        permissions: {},
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      
      // Try to clean up auth user if profile creation failed
      try {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(authData.user.id)
        if (deleteError) {
          console.error('Failed to cleanup auth user:', deleteError)
        }
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError)
      }
      
      return createErrorResponse('Failed to create user profile', 500)
    }

    return createSuccessResponse({
      message: 'User registered successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        first_name,
        last_name,
        role
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Register API error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}