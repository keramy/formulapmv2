/**
 * SECURE VERSION - tasks API Route
 * Updated for 5-role structure with enhanced security
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { hasPermission } from '@/lib/permissions'
import { createServerClient } from '@/lib/supabase'

export const GET = withAuth(async (request: NextRequest, { user, profile }) => {
  try {
    // Permission check for new 5-role structure
    if (!hasPermission(profile.role, 'tasks.read')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const supabase = createServerClient()
    
    // Your API logic here
    // Use profile.role which now contains: management, purchase_manager, technical_lead, project_manager, client, admin
    // Use profile.seniority_level for PM hierarchy: executive, senior, regular, standard, system
    // Use profile.approval_limits for budget/approval checks
    
    return NextResponse.json({
      success: true,
      data: [], // Your data here
      user: {
        id: user.id,
        role: profile.role,
        seniority: profile.seniority_level
      }
    })
    
  } catch (error) {
    console.error('tasks API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const POST = withAuth(async (request: NextRequest, { user, profile }) => {
  try {
    // Permission check for new 5-role structure
    if (!hasPermission(profile.role, 'tasks.create')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const supabase = createServerClient()
    
    // Your API logic here
    
    return NextResponse.json({
      success: true,
      message: 'tasks created successfully'
    })
    
  } catch (error) {
    console.error('tasks API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}, {
  permission: 'tasks.create' // Optional: specify required permission
})