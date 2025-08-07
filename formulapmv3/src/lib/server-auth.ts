/**
 * Server-Side Page Authentication Helper
 * Provides consistent authentication checks for pages with proper redirects
 */
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'
import type { UserProfile, UserRole } from '@/types/auth'
import { hasPermission, Permission } from '@/lib/permissions'

export interface AuthResult {
  user: User
  profile: UserProfile
}

export interface PageAuthOptions {
  /** Specific roles allowed to access the page */
  allowedRoles?: UserRole[]
  /** Specific permission required */
  requiredPermission?: Permission
  /** Require management level access */
  requireManagement?: boolean
  /** Require admin level access */
  requireAdmin?: boolean
  /** Custom redirect path for unauthenticated users */
  loginRedirect?: string
  /** Custom redirect path for unauthorized users */
  unauthorizedRedirect?: string
}

/**
 * Main server-side authentication check for pages
 * Handles redirects automatically and returns user/profile data
 */
export async function requireAuth(options: PageAuthOptions = {}): Promise<AuthResult> {
  const {
    allowedRoles,
    requiredPermission,
    requireManagement,
    requireAdmin,
    loginRedirect = '/auth/login',
    unauthorizedRedirect = '/unauthorized'
  } = options

  console.log('🔐 [Server Auth] requireAuth() called with options:', options)

  try {
    const supabase = await createClient()
    console.log('🔐 [Server Auth] Supabase client created')
    
    // Get current user - use getSession for more reliable session check
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    console.log('🔐 [Server Auth] getSession() result:', { 
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id, 
      error: sessionError?.message,
      expiresAt: session?.expires_at
    })
    
    if (sessionError || !session || !session.user) {
      console.log('🔐 [Server Auth] No valid session, redirecting to login')
      console.log('🔐 [Server Auth] About to call redirect() with:', loginRedirect)
      redirect(loginRedirect)
      console.log('🔐 [Server Auth] This line should never execute after redirect()')
    }
    
    const user = session.user
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile) {
      console.log('🔐 [Server Auth] Profile not found:', profileError?.message)
      redirect(loginRedirect)
    }
    
    // Check if account is active
    if (!profile.is_active) {
      console.log('🔐 [Server Auth] Account is deactivated')
      redirect('/account-deactivated')
    }
    
    // Check admin requirement
    if (requireAdmin) {
      const adminRoles: UserRole[] = ['management', 'admin']
      if (!adminRoles.includes(profile.role)) {
        console.log('🔐 [Server Auth] Admin access required, user has role:', profile.role)
        redirect(unauthorizedRedirect)
      }
    }
    
    // Check management requirement
    if (requireManagement) {
      const managementRoles: UserRole[] = ['management', 'technical_lead', 'admin']
      if (!managementRoles.includes(profile.role)) {
        console.log('🔐 [Server Auth] Management access required, user has role:', profile.role)
        redirect(unauthorizedRedirect)
      }
    }
    
    // Check specific roles
    if (allowedRoles && !allowedRoles.includes(profile.role)) {
      console.log('🔐 [Server Auth] Role not allowed:', profile.role, 'Required:', allowedRoles)
      redirect(unauthorizedRedirect)
    }
    
    // Check specific permission
    if (requiredPermission && !hasPermission(profile.role, requiredPermission)) {
      console.log('🔐 [Server Auth] Permission denied:', requiredPermission, 'for role:', profile.role)
      redirect(unauthorizedRedirect)
    }
    
    console.log('✅ [Server Auth] Access granted for user:', profile.email, 'role:', profile.role)
    return { user, profile }
    
  } catch (error) {
    console.error('🔐 [Server Auth] Authentication error:', error)
    redirect(loginRedirect)
  }
}

/**
 * Check authentication without redirecting
 * Useful for conditional rendering or API routes
 */
export async function checkAuth(): Promise<AuthResult | null> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return null
    
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile || !profile.is_active) return null
    
    return { user, profile }
  } catch (error) {
    console.error('🔐 [Server Auth] Check auth error:', error)
    return null
  }
}

/**
 * Redirect authenticated users away from auth pages
 */
export async function redirectIfAuthenticated(redirectTo: string = '/dashboard'): Promise<void> {
  const auth = await checkAuth()
  if (auth) {
    console.log('🔐 [Server Auth] User already authenticated, redirecting to:', redirectTo)
    redirect(redirectTo)
  }
}

// Convenience functions for common auth patterns
export const requireManagementAuth = () => requireAuth({ requireManagement: true })
export const requireAdminAuth = () => requireAuth({ requireAdmin: true })
export const requireClientAuth = () => requireAuth({ allowedRoles: ['client'] })
export const requireTechnicalAuth = () => requireAuth({ allowedRoles: ['technical_lead', 'management', 'admin'] })
export const requirePurchaseAuth = () => requireAuth({ allowedRoles: ['purchase_manager', 'management', 'admin'] })