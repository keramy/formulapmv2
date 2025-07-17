/**
 * Authentication Helper
 * Centralized authentication logic for API routes
 */
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'
import type { UserProfile } from '@/types/auth'

export interface AuthenticatedUser {
  user: User
  profile: UserProfile
}

export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  try {
    const supabase = createClient()
    
    // Get user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.log('Authentication failed:', userError?.message)
      return null
    }

    // Get user profile with caching
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.log('Profile fetch failed:', profileError?.message)
      return null
    }

    return { user, profile }
    
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

export function hasPermission(
  profile: UserProfile,
  requiredPermission: string
): boolean {
  // Role-based permission checking
  const rolePermissions = {
    admin: ['*'], // Admin has all permissions
    management: [
      'view_all_projects',
      'manage_users',
      'view_reports',
      'approve_budgets'
    ],
    technical_lead: [
      'view_projects',
      'manage_scope',
      'approve_technical',
      'assign_tasks'
    ],
    project_manager: [
      'view_projects',
      'manage_tasks',
      'view_scope',
      'create_milestones'
    ],
    purchase_manager: [
      'view_projects',
      'manage_materials',
      'approve_purchases',
      'view_suppliers'
    ],
    client: [
      'view_assigned_projects',
      'view_reports',
      'comment_on_items'
    ]
  }

  const userPermissions = rolePermissions[profile.role] || []
  
  return userPermissions.includes('*') || userPermissions.includes(requiredPermission)
}

export function requirePermission(
  profile: UserProfile,
  requiredPermission: string
): void {
  if (!hasPermission(profile, requiredPermission)) {
    throw new Error(`Insufficient permissions: ${requiredPermission} required`)
  }
}
