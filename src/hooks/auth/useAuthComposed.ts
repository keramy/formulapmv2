'use client'

import { useMemo, useCallback, useEffect, useState, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { UserProfile } from '@/types/auth'
import type { AuthResponse } from '@supabase/supabase-js'

// Import all specialized authentication hooks
import { useAuthCore, type AuthCoreState } from './useAuthCore'
import { useAuthActions, type AuthActions } from './useAuthActions'
import { useUserProfile, type UserProfileState } from './useUserProfile'
import { useProfileCache, type ProfileCacheInterface } from './useProfileCache'
import { useAccessToken, type AccessTokenInterface } from './useAccessToken'
import { useRoleChecks, type RoleChecksInterface } from './useRoleChecks'
import { usePMSeniority, type PMSeniorityInterface } from './usePMSeniority'

/**
 * Composed Authentication Hook
 * 
 * This hook composes all specialized authentication hooks into a single, comprehensive
 * interface while maintaining 100% backward compatibility with the existing useAuth hook.
 * 
 * ## Architecture
 * 
 * The composed hook follows a modular architecture where each specialized hook handles
 * a specific domain of authentication functionality:
 * 
 * - **useAuthCore**: Core session management and auth state
 * - **useAuthActions**: Authentication actions (signIn, signOut, error clearing)
 * - **useUserProfile**: User profile fetching and management
 * - **useProfileCache**: Profile caching operations
 * - **useAccessToken**: Access token management with caching and refresh
 * - **useRoleChecks**: Role-based permission checks
 * - **usePMSeniority**: PM seniority level calculations
 * 
 * ## Performance Optimizations
 * 
 * - Uses `useMemo` for expensive computed values to prevent re-computation
 * - Minimizes re-renders by memoizing derived state objects
 * - Leverages caching from individual hooks
 * - Combines loading states intelligently
 * - Only calls hooks that are needed based on current state
 * 
 * ## Backward Compatibility
 * 
 * This hook returns the EXACT same interface as the original useAuth hook,
 * ensuring all 65+ files that depend on useAuth continue to work without
 * any code changes. This allows for gradual migration to individual hooks
 * where appropriate.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Drop-in replacement for existing useAuth
 * const auth = useAuthComposed()
 * 
 * // All existing properties and methods work identically:
 * const { user, profile, signIn, signOut, isAuthenticated, debugInfo } = auth
 * ```
 * 
 * ## Migration Path
 * 
 * Components can gradually migrate to use individual hooks:
 * 
 * ```typescript
 * // Instead of:
 * const { getAccessToken } = useAuth()
 * 
 * // Use:
 * const { getAccessToken } = useAccessToken()
 * ```
 * 
 * @returns Complete authentication interface matching original useAuth
 */

export interface ComposedAuthInterface {
  // Core auth state (matching original useAuth interface)
  user: User | null
  profile: UserProfile | null
  loading: boolean
  authError: string | null
  
  // Auth actions (matching original useAuth interface)
  signIn: (email: string, password: string) => Promise<AuthResponse>
  signOut: () => Promise<void>
  getAccessToken: () => Promise<string | null>
  clearAuthError: () => void
  
  // Authentication state properties (matching original useAuth interface)
  isAuthenticated: boolean
  authState: 'signing_out' | 'loading' | 'recovering' | 'authenticated' | 'idle'
  isError: boolean
  isRecoveringSession: boolean
  isUserInitiated: boolean
  sessionState: 'signing_in' | 'checking' | 'authenticated' | 'idle'
  
  // Role checks (matching original useAuth interface)
  isManagement: boolean
  isAdmin: boolean
  isPurchaseManager: boolean
  isTechnicalLead: boolean
  isProjectManager: boolean
  isClient: boolean
  isManagementRole: boolean
  isProjectRole: boolean
  isPurchaseRole: boolean
  isFieldRole: boolean
  isExternalRole: boolean
  canAccessAdminPanel: boolean
  canManageUsers: boolean
  canViewAllProjects: boolean
  canCreateProjects: boolean
  canDeleteProjects: boolean
  canManageProjectSettings: boolean
  canViewFinancials: boolean
  canApproveExpenses: boolean
  hasPermission: (permission: string) => boolean
  checkMultiplePermissions: (permissions: string[], requireAll?: boolean) => boolean
  
  // PM Seniority helpers (matching original useAuth interface)
  getSeniority: () => string | null
  isPMWithSeniority: () => boolean
  canPerformAction: (action: string) => boolean
  compareSeniority: (otherLevel: any) => 'higher' | 'equal' | 'lower' | 'not_pm'
  hasMinimumSeniority: (minSeniority: string) => boolean
  pmSeniorityInfo: {
    seniority: string | null
    displayName: string
    canApproveShopDrawings: boolean
    isPM: boolean
    isRegularPM: boolean
    isSeniorPM: boolean
    isExecutivePM: boolean
  }
  
  // Cache management utilities (matching original useAuth interface)
  cache: {
    stats: any
    clear: () => void
    needsRefresh: () => boolean
  }
  
  // Debug info (matching original useAuth interface)
  debugInfo: {
    authState: string
    hasError: boolean
    errorCode: string | undefined
    isRecovering: boolean
    isUserInitiated: boolean
    sessionState: string
    pmSeniority: string | null
    roleChecks: {
      isManagement: boolean
      isProjectRole: boolean
      isPurchaseRole: boolean
      isFieldRole: boolean
      isExternalRole: boolean
    }
    cache: any
  }
}

/**
 * Composed authentication hook that combines all specialized auth hooks
 * while maintaining 100% backward compatibility with the existing useAuth interface.
 * 
 * This hook orchestrates multiple specialized hooks to provide a comprehensive
 * authentication solution with optimal performance and maintainability.
 * 
 * @returns ComposedAuthInterface - Complete auth interface matching original useAuth
 */
export const useAuthComposed = (): ComposedAuthInterface => {
  // Circuit breaker state to prevent infinite authentication cycles
  const [circuitBreakerTripped, setCircuitBreakerTripped] = useState(false)
  const [authStartTime] = useState(() => Date.now())
  
  // Initialize ALL hooks unconditionally to prevent Rules of Hooks violations
  const authCore = useAuthCore()
  const authActions = useAuthActions()
  const profileCache = useProfileCache()
  const accessToken = useAccessToken()
  
  // Stabilize the user ID to prevent unnecessary profile refetches
  const stableUserId = useMemo(() => authCore.user?.id, [authCore.user?.id])
  
  // Initialize user profile hook with current user ID
  const userProfile = useUserProfile(stableUserId, true)
  
  // Get the current user profile (no impersonation)
  const effectiveProfile = userProfile.profile
  
  // Initialize role checks and PM seniority with effective profile
  const roleChecks = useRoleChecks(effectiveProfile)
  const pmSeniority = usePMSeniority(effectiveProfile)
  
  // Circuit breaker: Force authentication resolution after maximum time
  useEffect(() => {
    if (circuitBreakerTripped) return
    
    const circuitBreakerTimeout = setTimeout(() => {
      const elapsed = Date.now() - authStartTime
      console.warn(`🔐 [useAuthComposed] Circuit breaker triggered after ${elapsed}ms - forcing authentication resolution`)
      setCircuitBreakerTripped(true)
      
      // Health check: Clear any stuck localStorage entries
      if (typeof window !== 'undefined') {
        const stuckKeys = Object.keys(window.localStorage).filter(key => 
          key.startsWith('sb-') && key.includes('session')
        )
        
        if (stuckKeys.length > 0) {
          console.warn('🔐 [useAuthComposed] Clearing potentially stuck session data:', stuckKeys)
          stuckKeys.forEach(key => window.localStorage.removeItem(key))
        }
      }
    }, 15000) // 15 second maximum authentication time
    
    // Clear timeout if authentication resolves normally
    if (!authCore.loading && !userProfile.loading) {
      clearTimeout(circuitBreakerTimeout)
    }
    
    return () => clearTimeout(circuitBreakerTimeout)
  }, [authCore.loading, userProfile.loading, circuitBreakerTripped, authStartTime])
  
  // Authentication recovery mechanism
  const resetAuthState = useCallback(() => {
    console.warn('🔐 [useAuthComposed] Resetting authentication state due to persistent issues')
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      Object.keys(window.localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.startsWith('supabase')) {
          window.localStorage.removeItem(key)
        }
      })
    }
    
    // Force circuit breaker to resolve
    setCircuitBreakerTripped(true)
    
    // Trigger page reload as last resort
    setTimeout(() => {
      if (window.location.pathname !== '/auth/login') {
        window.location.reload()
      }
    }, 1000)
  }, [])
  
  // Auto-recovery for extreme cases
  useEffect(() => {
    if (!circuitBreakerTripped) return
    
    const recoveryTimeout = setTimeout(() => {
      console.warn('🔐 [useAuthComposed] Authentication still stuck after circuit breaker - initiating recovery')
      resetAuthState()
    }, 30000) // 30 seconds after circuit breaker
    
    return () => clearTimeout(recoveryTimeout)
  }, [circuitBreakerTripped, resetAuthState])
  
  
  /**
   * Combined loading state with timeout protection and circuit breaker
   * Simplified logic to prevent infinite loading loops
   */
  const combinedLoading = useMemo(() => {
    // Circuit breaker: Force loading to false if tripped
    if (circuitBreakerTripped) {
      console.log('🔐 [useAuthComposed] Circuit breaker active - forcing loading to false')
      return false
    }
    
    // Priority 1: Action loading states (user initiated)
    if (authActions.isSigningIn || authActions.isSigningOut) {
      return true
    }
    
    // Priority 2: Core auth loading (session initialization)
    if (authCore.loading) {
      return true
    }
    
    // Priority 3: Profile loading (only if critical conditions met)
    // Only consider profile loading if:
    // - We have a user (authenticated)
    // - No profile exists yet 
    // - Profile is actively loading (not stuck)
    // - No profile error (don't wait for failed profiles)
    if (authCore.user && 
        !effectiveProfile && 
        userProfile.loading && 
        !userProfile.error) {
      return true
    }
    
    // Default: Not loading
    return false
  }, [
    // Carefully ordered dependencies to prevent circular updates
    circuitBreakerTripped,
    authActions.isSigningIn,
    authActions.isSigningOut,
    authCore.loading,
    authCore.user,
    effectiveProfile,
    userProfile.loading,
    userProfile.error
  ])
  
  /**
   * Combined error state
   * Prioritizes errors from different sources
   */
  const combinedError = useMemo(() => {
    // Auth action errors take priority (user-facing)
    if (authActions.authError) return authActions.authError
    
    // Core auth errors
    if (authCore.error) return authCore.error
    
    // Profile errors (only if we have a user but profile fetch failed)
    if (authCore.user && userProfile.error) return userProfile.error
    
    return null
  }, [authActions.authError, authCore.error, authCore.user, userProfile.error])
  
  /**
   * Authentication state computation
   * Simplified and more deterministic to prevent infinite loops
   */
  const authState = useMemo(() => {
    // Priority 1: Active user actions
    if (authActions.isSigningOut) return 'signing_out'
    if (authActions.isSigningIn) return 'loading'
    
    // Priority 2: Loading states
    if (combinedLoading) return 'recovering'
    
    // Priority 3: Authenticated state
    if (authCore.user) {
      // If we have an active profile, we're fully authenticated
      if (effectiveProfile?.is_active) {
        return 'authenticated'
      }
      // If profile failed to load or is inactive, still allow basic access
      if (userProfile.error || (effectiveProfile && !effectiveProfile.is_active)) {
        return 'authenticated' // Authenticated but with limitations
      }
      // User exists but profile is still loading - remain in loading state briefly
      if (userProfile.loading) {
        return 'recovering'
      }
      // User exists but no profile - consider authenticated for basic access
      return 'authenticated'
    }
    
    // Priority 4: No user
    return 'idle'
  }, [
    authActions.isSigningOut, 
    authActions.isSigningIn, 
    combinedLoading, 
    authCore.user, 
    effectiveProfile, 
    userProfile.error,
    userProfile.loading
  ])
  
  /**
   * Session state computation
   * Matches the original useAuth session state exactly
   */
  const sessionState = useMemo(() => {
    if (authActions.isSigningIn) return 'signing_in'
    if (combinedLoading) return 'checking'
    if (authCore.user && effectiveProfile) return 'authenticated'
    return 'idle'
  }, [authActions.isSigningIn, combinedLoading, authCore.user, effectiveProfile])
  
  /**
   * Authentication status with circuit breaker support
   * Simplified logic focusing on user session existence
   */
  const isAuthenticated = useMemo(() => {
    // Don't consider authenticated during signing actions
    if (authActions.isSigningIn || authActions.isSigningOut) return false
    
    // Don't consider authenticated during core loading (unless circuit breaker tripped)
    if (authCore.loading && !circuitBreakerTripped) return false
    
    // Must have a user to be authenticated
    if (!authCore.user) return false
    
    // If we have an active profile, we're definitely authenticated
    if (effectiveProfile?.is_active) return true
    
    // If profile is inactive, user is not authenticated
    if (effectiveProfile && !effectiveProfile.is_active) return false
    
    // If circuit breaker tripped and we have a user, allow authentication
    if (circuitBreakerTripped && authCore.user) {
      console.log('🔐 [useAuthComposed] Circuit breaker active - allowing authentication with user session only')
      return true
    }
    
    // If no profile but user exists, allow authentication for basic access
    // This handles cases where profile might be missing or still loading
    return true
  }, [
    authCore.loading, 
    authCore.user, 
    effectiveProfile,
    authActions.isSigningIn,
    authActions.isSigningOut,
    circuitBreakerTripped
  ])
  
  /**
   * PM Seniority info object
   * Matches the original useAuth pmSeniorityInfo structure exactly
   * Returns default values during loading states
   */
  const pmSeniorityInfo = useMemo(() => {
    // Return default values during initial loading
    if (authCore.loading && !authCore.user) {
      return {
        seniority: null,
        displayName: 'Loading...',
        canApproveShopDrawings: false,
        isPM: false,
        isRegularPM: false,
        isSeniorPM: false,
        isExecutivePM: false
      }
    }

    return {
      seniority: pmSeniority.seniority,
      displayName: pmSeniority.displayName,
      canApproveShopDrawings: pmSeniority.canApproveShopDrawings,
      isPM: pmSeniority.isPM,
      isRegularPM: pmSeniority.isRegularPM,
      isSeniorPM: pmSeniority.isSeniorPM,
      isExecutivePM: pmSeniority.isExecutivePM
    }
  }, [authCore.loading, authCore.user, pmSeniority])
  
  /**
   * Cache utilities object
   * Matches the original useAuth cache structure exactly
   */
  const cache = useMemo(() => ({
    stats: profileCache.stats,
    clear: profileCache.clearCache,
    needsRefresh: profileCache.needsRefresh
  }), [profileCache.stats, profileCache.clearCache, profileCache.needsRefresh])
  
  /**
   * Debug info object
   * Matches the original useAuth debugInfo structure exactly
   */
  const debugInfo = useMemo(() => ({
    authState: authState,
    hasError: !!combinedError,
    errorCode: combinedError ? 'AUTH_ERROR' : undefined,
    isRecovering: combinedLoading && !authActions.isSigningIn,
    isUserInitiated: authActions.isSigningIn,
    sessionState: sessionState,
    pmSeniority: pmSeniority.seniority,
    roleChecks: {
      isManagement: roleChecks.isManagement,
      isProjectRole: roleChecks.isProjectRole,
      isPurchaseRole: roleChecks.isPurchaseRole,
      isFieldRole: roleChecks.isFieldRole,
      isExternalRole: roleChecks.isExternalRole
    },
    cache: profileCache.stats
  }), [
    authState, 
    combinedError, 
    combinedLoading, 
    authActions.isSigningIn, 
    sessionState,
    pmSeniority.seniority, 
    roleChecks, 
    profileCache.stats
  ])
  
  // Debug logging - DISABLED to prevent console spam and improve performance
  // Re-enable only for specific debugging when needed
  const lastDebugLogRef = useRef(0)
  useEffect(() => {
    const debugEnabled = false // Disabled to stop console spam
    if (!debugEnabled) return
    
    const now = Date.now()
    const shouldLog = now - lastDebugLogRef.current > 30000 || // Only on critical events
                      authActions.isSigningIn || 
                      authActions.isSigningOut ||
                      circuitBreakerTripped
    
    if (shouldLog) {
      console.log('🔐 [useAuthComposed] Critical auth event:', {
        isAuthenticated: isAuthenticated,
        loading: combinedLoading,
        authState: authState,
        hasUser: !!authCore.user,
        hasProfile: !!effectiveProfile,
        circuitBreakerTripped
      })
      lastDebugLogRef.current = now
    }
  }, [
    authActions.isSigningIn,
    authActions.isSigningOut,
    circuitBreakerTripped,
    isAuthenticated,
    combinedLoading,
    authState
    // Reduced dependencies to minimum for performance
  ])
  
  // Return the complete interface matching original useAuth exactly
  return {
    // Core auth state
    user: authCore.user,
    profile: effectiveProfile,
    loading: combinedLoading,
    authError: combinedError,
    
    // Auth actions
    signIn: authActions.signIn,
    signOut: authActions.signOut,
    getAccessToken: accessToken.getAccessToken,
    clearAuthError: authActions.clearAuthError,
    
    
    // Authentication state properties
    isAuthenticated,
    authState,
    isError: !!combinedError,
    isRecoveringSession: combinedLoading && !authActions.isSigningIn,
    isUserInitiated: authActions.isSigningIn,
    sessionState,
    
    // Role checks (spread all role check properties)
    ...roleChecks,
    
    // PM Seniority helpers
    getSeniority: pmSeniority.getSeniority,
    isPMWithSeniority: pmSeniority.isPMWithSeniority,
    canPerformAction: pmSeniority.canPerformAction,
    compareSeniority: pmSeniority.compareSeniority,
    hasMinimumSeniority: pmSeniority.hasMinimumSeniority,
    pmSeniorityInfo,
    
    // Cache management utilities
    cache,
    
    // Debug info
    debugInfo
  }
}

/**
 * Default export for backward compatibility
 * This allows existing imports to continue working without changes
 */
export default useAuthComposed