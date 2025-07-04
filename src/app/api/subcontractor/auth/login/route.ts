/**
 * Subcontractor Login API Route
 * POST /api/subcontractor/auth/login
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { 
  createSubcontractorToken, 
  setSubcontractorAuthCookies,
  logSubcontractorActivity 
} from '@/lib/middleware/subcontractor-auth'
import { SubcontractorLoginForm } from '@/types/subcontractor'

export async function POST(request: NextRequest) {
  try {
    const { email, password }: SubcontractorLoginForm = await request.json()

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // First, authenticate the user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Get subcontractor profile
    const { data: subcontractorData, error: subcontractorError } = await supabase
      .from('subcontractor_users')
      .select(`
        *,
        subcontractor_scope_access (
          scope_item_id,
          scope_items (
            project_id,
            projects (
              id,
              name,
              status
            )
          )
        )
      `)
      .eq('user_profile_id', authData.user.id)
      .eq('is_active', true)
      .single()

    if (subcontractorError || !subcontractorData) {
      // Sign out the user since they don't have subcontractor access
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'Subcontractor access not found or inactive' },
        { status: 403 }
      )
    }

    // Extract assigned projects
    const assignedProjects = [
      ...new Set(
        subcontractorData.subcontractor_scope_access
          ?.map((access: any) => access.scope_items?.project_id)
          .filter(Boolean) || []
      )
    ]

    // Generate session ID
    const sessionId = crypto.randomUUID()

    // Create JWT token
    const token = await createSubcontractorToken({
      id: subcontractorData.id,
      email: subcontractorData.email,
      company_name: subcontractorData.company_name,
      contact_person: subcontractorData.contact_person,
      user_profile_id: subcontractorData.user_profile_id,
      is_active: subcontractorData.is_active,
      session_id: sessionId,
      assigned_projects: assignedProjects
    })

    // Update last login
    await supabase
      .from('subcontractor_users')
      .update({ 
        last_login: new Date().toISOString(),
        login_attempts: 0,
        account_locked: false
      })
      .eq('id', subcontractorData.id)

    // Create response and set cookies
    const response = NextResponse.json({
      success: true,
      user: {
        id: subcontractorData.id,
        email: subcontractorData.email,
        company_name: subcontractorData.company_name,
        contact_person: subcontractorData.contact_person,
        assigned_projects: assignedProjects
      }
    })

    setSubcontractorAuthCookies(response, token)

    // Log activity
    await logSubcontractorActivity(
      subcontractorData.id,
      'login',
      { success: true },
      request.ip,
      request.headers.get('user-agent') || undefined
    )

    return response

  } catch (error) {
    console.error('Subcontractor login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}