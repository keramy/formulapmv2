'use client'

import { useEffect, useState, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { UserProfile, UserRole, SeniorityLevel } from '@/types/auth'
import { useImpersonation } from './useImpersonation'
import { getSeniorityFromProfile } from '@/lib/seniority-utils'
import { authCache } from '@/lib/auth-cache'

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

  // Enhanced profile fetching with caching
  const fetchUserProfile = useCallback(async (userId: string): Promise<void> => {
    // Check cache first
    const cached = authCache.getCachedAuth();
    if (cached && cached.user?.id === userId && cached.profile && !authCache.needsRefresh()) {
      // console.log('🔐 [useAuth] Using cached profile for user:', userId); // Reduced logging
      setProfile(cached.profile);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error || !data) {
        console.error('🔐 [useAuth] Profile fetch error:', error?.message || 'No profile found')
        setAuthError('Failed to load user profile');
        return;
      }

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
      
      setProfile(profile);
      
      // Cache the successful result
      authCache.setCachedAuth(user, profile);
      
    } catch (error) {
      console.error('🔐 [useAuth] Profile fetch exception:', error);
      if (error instanceof Error && !error.message.includes('Refresh Token')) {
        setAuthError('Profile loading failed');
      }
    }
  }, [user])

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
  }, [isImpersonating, impersonatedUser, originalAdmin, originalProfile, profile])

  useEffect(() => {
    // console.log('🔐 [useAuth] Initializing auth hook') // Reduced logging
    
    // Simplified token refresh (every 30 minutes) - removed complex validation loops
    const refreshInterval = setInterval(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error || !session) return
        
        // console.log('🔄 [useAuth] Auto-refreshing token...') // Reduced logging
        const { error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError) {
          console.warn('🔄 [useAuth] Token refresh failed:', refreshError.message)
        }
      } catch (error) {
        console.warn('🔄 [useAuth] Token refresh error:', error)
      }
    }, 30 * 60 * 1000) // 30 minutes
    
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('🔐 [useAuth] Session error:', error)
          
          // Handle invalid refresh token errors by clearing local state only
          if (error.message.includes('Invalid Refresh Token') || error.message.includes('Refresh Token Not Found')) {
            console.log('🔐 [useAuth] Invalid refresh token detected - clearing storage')
            
            if (typeof window !== 'undefined') {
              Object.keys(window.localStorage).forEach(key => {
                if (key.startsWith('sb-') || key.startsWith('supabase')) {
                  window.localStorage.removeItem(key)
                }
              })
            }
            
            setAuthError(null)
          } else {
            setAuthError(error.message)
          }
          
          setLoading(false)
          return
        }

        if (session?.user) {
          // console.log('🔐 [useAuth] Session found, setting user immediately') // Reduced logging
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
          // console.log('🔐 [useAuth] No session found') // Reduced logging
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
        // console.log('🔐 [useAuth] Auth state change:', event, session?.user?.id, error?.message) // Reduced logging
        
        // Handle auth errors during state changes WITHOUT recursive signOut
        if (error && (error.message.includes('Invalid Refresh Token') || error.message.includes('Refresh Token Not Found'))) {
          console.log('🔐 [useAuth] Invalid refresh token detected - clearing state only')
          
          setUser(null)
          setProfile(null)
          setOriginalProfile(null)
          setAuthError(null)
          setIsSigningIn(false)
          
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
                // console.log('🔐 [useAuth] User signed in:', session.user.id) // Reduced logging
                setUser(session.user)
                setAuthError(null)
                setIsSigningIn(false)
                
                // Cache the user immediately
                authCache.setCachedAuth(session.user, null, session.access_token);
                
                // Load profile asynchronously
                fetchUserProfile(session.user.id).catch(error => {
                  console.error('🔐 [useAuth] Profile fetch failed after sign in:', error)
                })
              }
              break
              
            case 'SIGNED_OUT':
              // console.log('🔐 [useAuth] User signed out') // Reduced logging
              authCache.clearCache();
              setUser(null)
              setProfile(null)
              setOriginalProfile(null)
              setAuthError(null)
              setIsSigningIn(false)
              break
              
            case 'TOKEN_REFRESHED':
              if (session?.user) {
                // console.log('🔐 [useAuth] Token refreshed for user:', session.user.id) // Reduced logging
                setUser(session.user)
                
                // Update cache with new token
                if (profile) {
                  authCache.setCachedAuth(session.user, profile, session.access_token);
                }
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
      
      // Clear cache first
      authCache.clearCache();
      
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
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        try {
          Object.keys(window.localStorage).forEach(key => {
            if (key.startsWith('sb-') || key.startsWith('supabase')) {
              window.localStorage.removeItem(key)
            }
          })
          
          window.localStorage.removeItem('auth_token')
          window.localStorage.removeItem('access_token')
          
          console.log('🧹 [useAuth] localStorage cleanup completed')
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

  const getAccessToken = useCallback(async () => {
    try {
      // Check cache first for quick access
      const cached = authCache.getCachedAuth();
      if (cached && cached.accessToken && !authCache.needsRefresh()) {
        // console.log('🔐 [useAuth] Using cached access token'); // Reduced logging
        return cached.accessToken;
      }
      
      // Fetch fresh token
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('🔐 [useAuth] Token fetch error:', error);
        return null;
      }
      
      if (!session?.access_token) {
        console.warn('🔐 [useAuth] No access token available');
        return null;
      }
      
      // Update cache with fresh token
      if (session.user && profile) {
        authCache.setCachedAuth(session.user, profile, session.access_token);
      }
      
      return session.access_token;
    } catch (error) {
      console.error('🔐 [useAuth] Get access token error:', error);
      return null;
    }
  }, [profile])

  const clearAuthError = useCallback(() => {
    setAuthError(null)
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
    clearAuthError,
    
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
    isManagement: profile ? ['management', 'technical_lead', 'admin'].includes(profile.role) : false,
    isProjectRole: profile ? ['project_manager'].includes(profile.role) : false,
    isPurchaseRole: profile ? ['purchase_manager'].includes(profile.role) : false,
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
    
    // Cache management utilities (simplified)
    cache: {
      stats: authCache.getStats(),
      clear: () => authCache.clearCache(),
      needsRefresh: () => authCache.needsRefresh()
    },
    
    // Simplified debug info
    debugInfo: {
      authState: isSigningOut ? 'signing_out' : isSigningIn ? 'signing_in' : loading ? 'checking' : (user && profile) ? 'authenticated' : 'idle',
      hasError: !!authError,
      errorCode: authError ? 'AUTH_ERROR' : undefined,
      isRecovering: loading && !isSigningIn,
      isUserInitiated: isSigningIn,
      sessionState: isSigningIn ? 'signing_in' : loading ? 'checking' : (user && profile) ? 'authenticated' : 'idle',
      isImpersonating,
      impersonatedUserEmail: impersonatedUser?.email,
      originalAdminEmail: originalAdmin?.email,
      pmSeniority: profile ? getSeniorityFromProfile(profile) : undefined,
      cache: authCache.getStats()
    }
  }
}