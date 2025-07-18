/**
 * Authentication Helper
 * Centralized authentication logic for API routes with Redis caching
 */
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'
import type { UserProfile } from '@/types/auth'
import { 
  getCachedUserProfile, 
  setCachedUserProfile, 
  getCachedToken,
  setCachedToken,
  invalidateUserCache 
} from './cache-middleware'

export interface AuthenticatedUser {
  user: User
  profile: UserProfile
}

export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  const startTime = Date.now()
  
  try {
    const supabase = createClient()
    
    // Extract token for caching
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.split(' ')[1]
    
    // Try cached token validation first
    let user: User | null = null
    if (token) {
      user = await getCachedToken(token)
      if (user) {
        console.log(`Auth cache HIT for token (${Date.now() - startTime}ms)`)
      }
    }
    
    // Fallback to Supabase validation
    if (!user) {
      const { data: { user: freshUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !freshUser) {
        console.log('Authentication failed:', userError?.message)
        return null
      }
      
      user = freshUser
      
      // Cache the token for 10 minutes
      if (token) {
        await setCachedToken(token, user, 600)
        console.log(`Auth cache MISS for token (${Date.now() - startTime}ms)`)
      }
    }

    // Try cached profile first
    let profile = await getCachedUserProfile(user.id)
    
    if (!profile) {
      // Fallback to database
      const { data: freshProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError || !freshProfile) {
        console.log('Profile fetch failed:', profileError?.message)
        return null
      }

      profile = freshProfile
      
      // Cache profile for 1 hour
      await setCachedUserProfile(user.id, profile, 3600)
      console.log(`Profile cache MISS for user ${user.id} (${Date.now() - startTime}ms)`)
    } else {
      console.log(`Profile cache HIT for user ${user.id} (${Date.now() - startTime}ms)`)
    }

    const totalTime = Date.now() - startTime
    console.log(`Total auth time: ${totalTime}ms`)

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
