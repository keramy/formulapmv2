/**
 * Admin API - User Management for Impersonation
 * Allows admins to list all users for impersonation feature
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/middleware'
import { createServerClient } from '@/lib/supabase'
import { UserRole } from '@/types/auth'

// ============================================================================
// GET /api/admin/users - List all users for impersonation
// ============================================================================

export async function GET(request: NextRequest) {
  // Authentication check
  const { user, profile, error } = await verifyAuth(request)
  
  if (error || !user || !profile) {
    return NextResponse.json(
      { success: false, error: error || 'Authentication required' },
      { status: 401 }
    )
  }

  // Authorization check - only company owners and admins can list users
  const adminRoles: UserRole[] = ['company_owner', 'admin']
  if (!adminRoles.includes(profile.role)) {
    return NextResponse.json(
      { success: false, error: 'Admin access required' },
      { status: 403 }
    )
  }

  try {
    const url = new URL(request.url)
    const includeInactive = url.searchParams.get('include_inactive') === 'true'
    const roleFilter = url.searchParams.get('role')

    // Import admin client dynamically to bypass RLS for user management
    const { supabaseAdmin } = await import('@/lib/supabase')

    // Build query to get all users with their profiles
    const { data: users, error: fetchError } = await supabaseAdmin
      .from('user_profiles')
      .select(`
        id,
        role,
        first_name,
        last_name,
        email,
        phone,
        company,
        department,
        is_active,
        created_at,
        updated_at
      `)
      .eq('is_active', true)
      .order('role', { ascending: true })
      .order('last_name', { ascending: true })

    if (fetchError) {
      console.error('Users fetch error:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    // Group users by role for better organization
    const usersByRole: Record<string, any[]> = {}
    const roleOrder: UserRole[] = [
      'company_owner',
      'general_manager', 
      'deputy_general_manager',
      'technical_director',
      'admin',
      'project_manager',
      'purchase_director',
      'architect',
      'technical_engineer',
      'purchase_specialist',
      'field_worker',
      'client'
    ]

    // Initialize role groups
    roleOrder.forEach(role => {
      usersByRole[role] = []
    })

    // Group users by role
    users?.forEach(user => {
      if (usersByRole[user.role]) {
        usersByRole[user.role].push({
          id: user.id,
          role: user.role,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          company: user.company,
          department: user.department,
          is_active: user.is_active,
          created_at: user.created_at,
          updated_at: user.updated_at,
          display_name: `${user.first_name} ${user.last_name}`,
          role_display: user.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        })
      }
    })

    // Remove empty role groups for cleaner response
    const filteredUsersByRole = Object.fromEntries(
      Object.entries(usersByRole).filter(([_, users]) => users.length > 0)
    )

    // Also provide flat list for simple use cases
    const flatUserList = users?.map(user => ({
      id: user.id,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      company: user.company,
      department: user.department,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at,
      display_name: `${user.first_name} ${user.last_name}`,
      role_display: user.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    })) || []

    // Security: Filter out the current admin from impersonation list
    // (can't impersonate yourself)
    const availableForImpersonation = flatUserList.filter(u => u.id !== user.id)

    // For company_owner: can impersonate everyone except themselves
    // For admin: can impersonate non-owner/admin roles
    let secureList = []
    
    if (profile.role === 'company_owner') {
      // Company owners can impersonate anyone except themselves
      secureList = availableForImpersonation
    } else if (profile.role === 'admin') {
      // Admins can impersonate non-admin/owner roles
      secureList = availableForImpersonation.filter(u => !['company_owner', 'admin'].includes(u.role))
    } else {
      // Non-admin users cannot impersonate anyone
      secureList = []
    }

    return NextResponse.json({
      success: true,
      data: {
        users: flatUserList,
        users_by_role: filteredUsersByRole,
        available_for_impersonation: secureList,
        total_users: flatUserList.length,
        active_users: flatUserList.filter(u => u.is_active).length,
        inactive_users: flatUserList.filter(u => !u.is_active).length,
        current_admin: {
          id: user.id,
          email: user.email,
          role: profile.role,
          can_impersonate_count: secureList.length
        }
      },
      metadata: {
        requested_by: user.email,
        admin_role: profile.role,
        include_inactive: includeInactive,
        role_filter: roleFilter || 'all',
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Admin users API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}