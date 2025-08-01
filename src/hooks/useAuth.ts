'use client'

import { useEffect, useState, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { UserProfile, UserRole, SeniorityLevel } from '@/types/auth'
import { useImpersonation } from './useImpersonation'
import { useAdvancedApiQuery } from './useAdvancedApiQuery'
import { getSeniorityFromProfile } from '@/lib/seniority-utils'

export const useAuth = () => {
  // Simplified state management - only essential states
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [originalProfile, setOriginalProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  // Integrate impersonation system
  const { isImpersonating, impersonatedUser, originalAdmin, stopImpersonation, canImpersonate } = useImpersonation()

  // Optimized profile fetching - async, non-blocking
  const fetchUserProfile = async (userId: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error || !data) {
        if (error) {
          console.error('🔐 [useAuth] Profile fetch error:', error.message || error)
        } else {
          console.log('🔐 [useAuth] No profile found for user:', userId)
        }
        
        // For now, just set error for missing profile - don't try to create one automatically
        console.log('🔐 [useAuth] Profile not found - user needs to contact admin')
        
        setAuthError('Failed to load user profile');
        return;
      } else {
        const profile: UserProfile = {
          id: data.id,
          role: data.role as UserRole,
          first_name: data.full_name?.split(' ')[0] || '',
          last_name: data.full_name?.split(' ').slice(1).join(' ') || '',
          email: data.email,
          phone: data.phone,
          company: '', // Not in database schema
          department: '', // Not in database schema
          permissions: data.permissions || {},
          is_active: data.is_active,
          created_at: data.created_at,
          updated_at: data.updated_at
        }
        
        setProfile(profile)
      }
      
    } catch (error) {
      console.error('🔐 [useAuth] Profile fetch exception:', error);
      // Don't set error if it's a refresh token issue - the auth state listener will handle it
      if (error instanceof Error && !error.message.includes('Refresh Token')) {
        setAuthError('Profile loading failed');
      }
    }
  }

  // Effect to handle impersonation changes
  useEffect(() => {
    if (isImpersonating && impersonatedUser && originalAdmin) {
      console.log('🎭 [useAuth] Applying impersonation:', {
        originalAdmin: originalAdmin.email,
        impersonatedUser: impersonatedUser.email
      })
      
      // Store original profile if not already stored
      if (!originalProfile && profile) {
        setOriginalProfile(profile)
      }
      
      // Use impersonated user's profile
      setProfile(impersonatedUser)
    } else if (!isImpersonating && originalProfile) {
      console.log('🎭 [useAuth] Restoring original profile')
      
      // Restore original profile when impersonation stops
      setProfile(originalProfile)
      setOriginalProfile(null)
    }
  }, [isImpersonating, impersonatedUser, originalAdmin, originalProfile])

  useEffect(() => {
    console.log('🔐 [useAuth] Initializing auth hook')
    
    // Set up automatic token refresh (every 30 minutes)
    const refreshInterval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        console.log('🔄 [useAuth] Auto-refreshing token...')
        await supabase.auth.refreshSession()
      }
    }, 30 * 60 * 1000) // 30 minutes
    
    const initializeAuth = async () => {
      try {
        // Session-first pattern: Get session immediately, defer profile loading
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('🔐 [useAuth] Session error:', error)
          
          // Handle invalid refresh token errors by clearing local state only
          if (error.message.includes('Invalid Refresh Token') || error.message.includes('Refresh Token Not Found')) {
            console.log('🔐 [useAuth] Invalid refresh token detected - clearing local storage and state')
            
            // Clear storage directly without triggering signOut to avoid loops
            if (typeof window !== 'undefined') {
              Object.keys(window.localStorage).forEach(key => {
                if (key.startsWith('sb-') || key.startsWith('supabase')) {
                  window.localStorage.removeItem(key)
                }
              })
            }
            
            setAuthError(null) // Don't show error for invalid tokens
          } else {
            setAuthError(error.message)
          }
          
          setLoading(false)
          return
        }

        if (session?.user) {
          console.log('🔐 [useAuth] Session found, setting user immediately')
          setUser(session.user)
          
          // Load profile before setting loading to false to prevent flickering
          try {
            await fetchUserProfile(session.user.id)
          } catch (error) {
            console.error('🔐 [useAuth] Profile fetch failed during init:', error)
          } finally {
            setLoading(false)
          }
        } else {
          console.log('🔐 [useAuth] No session found')
          setLoading(false)
        }
      } catch (error) {
        console.error('🔐 [useAuth] Auth initialization failed:', error)
        setAuthError(error instanceof Error ? error.message : 'Authentication failed')
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session, error) => {
        console.log('🔐 [useAuth] Auth state change:', event, session?.user?.id, error?.message)
        
        // Handle auth errors during state changes WITHOUT recursive signOut
        if (error && (error.message.includes('Invalid Refresh Token') || error.message.includes('Refresh Token Not Found'))) {
          console.log('🔐 [useAuth] Invalid refresh token detected - clearing state only (no recursive signOut)')
          
          // Clear state directly without triggering another signOut
          setUser(null)
          setProfile(null)
          setOriginalProfile(null)
          setAuthError(null)
          setIsSigningIn(false)
          
          // Clear storage but don't call supabase.auth.signOut() to avoid recursion
          if (typeof window !== 'undefined') {
            Object.keys(window.localStorage).forEach(key => {
              if (key.startsWith('sb-') || key.startsWith('supabase')) {
                window.localStorage.removeItem(key)
              }
            })
          }
          
          return
        }
        
        try {
          switch (event) {
            case 'SIGNED_IN':
              if (session?.user) {
                console.log('🔐 [useAuth] User signed in:', session.user.id)
                setUser(session.user)
                setAuthError(null)
                setIsSigningIn(false)
                // Load profile asynchronously (don't await here to avoid blocking auth flow)
                fetchUserProfile(session.user.id).catch(error => {
                  console.error('🔐 [useAuth] Profile fetch failed after sign in:', error)
                })
              }
              break
              
            case 'SIGNED_OUT':
              console.log('🔐 [useAuth] User signed out')
              setUser(null)
              setProfile(null)
              setOriginalProfile(null)
              setAuthError(null)
              setIsSigningIn(false)
              break
              
            case 'TOKEN_REFRESHED':
              if (session?.user) {
                console.log('🔐 [useAuth] Token refreshed for user:', session.user.id)
                setUser(session.user)
                // Don't refetch profile on token refresh to avoid unnecessary calls
              }
              break
              
            case 'USER_UPDATED':
              if (session?.user) {
                console.log('🔐 [useAuth] User updated:', session.user.id)
                setUser(session.user)
                fetchUserProfile(session.user.id)
              }
              break
          }
        } catch (error) {
          console.error('🔐 [useAuth] Error handling auth state change:', error)
          // Don't set auth error for token refresh issues to avoid UI confusion
          if (!error instanceof Error || !error.message.includes('Refresh Token')) {
            setAuthError(error instanceof Error ? error.message : 'Authentication error')
          }
        }
      }
    )

    return () => {
      subscription.unsubscribe()
      clearInterval(refreshInterval)
    }
  }, []) // Empty dependency array to prevent infinite loops

  const signIn = useCallback(async (email: string, password: string) => {
    console.log('🔐 [useAuth] Starting sign in')
    setIsSigningIn(true)
    setAuthError(null)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      })
      
      if (error) {
        console.error('🔐 [useAuth] Sign in failed:', error)
        setAuthError(error.message)
        setIsSigningIn(false)
        throw error
      }
      
      console.log('🔐 [useAuth] Sign in successful')
      // User and profile will be set by the auth state change listener
      return data
      
    } catch (error) {
      console.error('🔐 [useAuth] Sign in exception:', error)
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed'
      setAuthError(errorMessage)
      setIsSigningIn(false)
      throw error
    }
  }, [])

  const signOut = useCallback(async () => {
    console.log('🔐 [useAuth] Signing out')
    try {
      setIsSigningOut(true)
      
      // Clear all state first
      setUser(null)
      setProfile(null)
      setOriginalProfile(null)
      setAuthError(null)
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('🔐 [useAuth] Sign out error:', error)
      }
      
      // Clear localStorage to prevent auto-login and resolve token conflicts
      if (typeof window !== 'undefined') {
        try {
          // Clear all Supabase authentication keys
          Object.keys(window.localStorage).forEach(key => {
            if (key.startsWith('sb-') || key.startsWith('supabase')) {
              window.localStorage.removeItem(key)
              console.log(`🧹 [useAuth] Cleared storage key: ${key}`)
            }
          })
          
          // Also clear any legacy auth tokens
          window.localStorage.removeItem('auth_token')
          window.localStorage.removeItem('access_token')
          
          console.log('🧹 [useAuth] Complete localStorage cleanup completed')
        } catch (error) {
          console.error('🧹 [useAuth] Error during localStorage cleanup:', error)
        }
      }
    } catch (error) {
      console.error('🔐 [useAuth] Sign out exception:', error)
    } finally {
      setIsSigningOut(false)
    }
  }, [])

  const refreshToken = useCallback(async () => {
    try {
      console.log('🔄 [useAuth] Manually refreshing token...')
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('🔐 [useAuth] Token refresh error:', error)
        return false
      }
      
      console.log('✅ [useAuth] Token refreshed successfully')
      return true
    } catch (error) {
      console.error('🔐 [useAuth] Token refresh exception:', error)
      return false
    }
  }, [])

  const getAccessToken = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('🔐 [useAuth] Token fetch error:', error)
        return null
      }
      
      if (!session?.access_token) {
        console.warn('🔐 [useAuth] No access token available')
        return null
      }
      
      return session.access_token
    } catch (error) {
      console.error('🔐 [useAuth] Get access token error:', error)
      return null
    }
  }, [])

  const clearAuthError = useCallback(() => {
    setAuthError(null)
  }, [])

  const clearStaleSession = useCallback(async () => {
    console.log('🔐 [useAuth] Clearing stale session')
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      setOriginalProfile(null)
      setAuthError(null)
    } catch (error) {
      console.error('🔐 [useAuth] Error clearing session:', error)
      setAuthError('Failed to clear session')
    }
  }, [])

  return {
    // Core auth state
    user,
    profile,
    loading,
    authError,
    
    // Auth actions
    signIn,
    signOut,
    getAccessToken,
    refreshToken,
    clearAuthError,
    clearStaleSession,
    
    // Impersonation system
    isImpersonating,
    impersonatedUser,
    originalAdmin,
    originalProfile,
    stopImpersonation,
    canImpersonate,
    
    // Simplified auth state - compatible with existing components
    isAuthenticated: !!user && !!profile && profile.is_active,
    authState: isSigningOut ? 'signing_out' :
               isSigningIn ? 'loading' : 
               loading ? 'recovering' :
               (user && profile) ? 'authenticated' : 'idle',
    isError: !!authError,
    isRecoveringSession: loading && !isSigningIn,
    isUserInitiated: isSigningIn,
    sessionState: isSigningIn ? 'signing_in' : 
                  loading ? 'checking' :
                  (user && profile) ? 'authenticated' : 'idle',
    
    // Role checks (based on current effective profile - original or impersonated)
    isManagement: profile ? ['management', 'management', 'management', 'technical_lead', 'admin'].includes(profile.role) : false,
    isProjectRole: profile ? ['project_manager', 'project_manager', 'project_manager'].includes(profile.role) : false,
    isPurchaseRole: profile ? ['purchase_manager', 'purchase_manager'].includes(profile.role) : false,
    isFieldRole: profile ? ['project_manager'].includes(profile.role) : false,
    isExternalRole: profile ? ['client'].includes(profile.role) : false,
    
    // PM Seniority helpers
    getSeniority: () => profile ? getSeniorityFromProfile(profile) : undefined,
    isPMWithSeniority: (requiredLevel?: SeniorityLevel) => {
      if (!profile || profile.role !== 'project_manager') return false
      const currentSeniority = getSeniorityFromProfile(profile)
      if (!requiredLevel) return !!currentSeniority
      
      // Executive > Senior > Regular
      const levels = { executive: 3, senior: 2, regular: 1 }
      const currentLevel = levels[currentSeniority || 'regular']
      const requiredLevelValue = levels[requiredLevel]
      return currentLevel >= requiredLevelValue
    },
    
    // Simplified debug info
    debugInfo: {
      authState: isSigningOut ? 'signing_out' : isSigningIn ? 'signing_in' : loading ? 'checking' : (user && profile) ? 'authenticated' : 'idle',
      recoveryAttempts: 0,
      hasError: !!authError,
      errorCode: authError ? 'AUTH_ERROR' : undefined,
      isRecovering: loading && !isSigningIn,
      isUserInitiated: isSigningIn,
      sessionState: isSigningIn ? 'signing_in' : loading ? 'checking' : (user && profile) ? 'authenticated' : 'idle',
      isImpersonating,
      impersonatedUserEmail: impersonatedUser?.email,
      originalAdminEmail: originalAdmin?.email,
      pmSeniority: profile ? getSeniorityFromProfile(profile) : undefined
    }
  }
}

/**
 * Enhanced Auth hook using advanced API query patterns
 * This demonstrates the optimized approach with intelligent caching and real-time updates
 */
export function useAuthAdvanced() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  // Use direct profile fetching for auth hook
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  
  const refetchProfile = useCallback(async () => {
    if (!user?.id) return null
    
    setProfileLoading(true)
    setProfileError(null)
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        setProfileError(error.message)
        return null
      }

      setProfile(data as UserProfile)
      return data as UserProfile
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfileError(error instanceof Error ? error.message : 'Unknown error')
      return null
    } finally {
      setProfileLoading(false)
    }
  }, [user?.id])

  // Fetch profile when user changes
  useEffect(() => {
    refetchProfile()
  }, [refetchProfile])
  
  const mutateProfile = useCallback((newProfile: UserProfile | null) => {
    setProfile(newProfile)
  }, [])

  // Enhanced authentication state management
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Error getting session:', error)
          setAuthError(error.message)
        } else {
          setUser(session?.user ?? null)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        setAuthError('Failed to initialize authentication')
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Enhanced auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log('Auth state changed:', event)

        setUser(session?.user ?? null)
        setAuthError(null)

        // Invalidate profile cache on auth changes
        if (event === 'SIGNED_IN') {
          refetchProfile()
        } else if (event === 'SIGNED_OUT') {
          mutateProfile(null)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [mutateProfile])

  // Enhanced sign in with caching
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setAuthError(null)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setAuthError(error.message)
        return { success: false, error: error.message }
      }

      // Preload profile data
      if (data.user) {
        refetchProfile()
      }

      return { success: true, user: data.user }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed'
      setAuthError(message)
      return { success: false, error: message }
    }
  }, [refetchProfile])

  // Enhanced sign out with cache cleanup
  const signOut = useCallback(async () => {
    try {
      setAuthError(null)
      const { error } = await supabase.auth.signOut()

      if (error) {
        setAuthError(error.message)
        return { success: false, error: error.message }
      }

      // Clear profile cache
      mutateProfile(null)

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign out failed'
      setAuthError(message)
      return { success: false, error: message }
    }
  }, [mutateProfile])

  return {
    // Core auth state
    user,
    profile,
    loading: loading || profileLoading,
    authError: authError || profileError,

    // Loading states
    authLoading: loading,
    profileLoading,

    // Actions
    signIn,
    signOut,
    refetchProfile,
    mutateProfile,

    // Computed values
    isAuthenticated: !!user,
    hasProfile: !!profile,
    userRole: profile?.role as UserRole,

    // Enhanced debugging
    debugInfo: {
      userId: user?.id,
      profileId: profile?.id,
      hasSession: !!user,
      hasProfile: !!profile
    }
  }
}