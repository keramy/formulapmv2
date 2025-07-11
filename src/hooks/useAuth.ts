'use client'

import { useEffect, useState, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { UserProfile, UserRole } from '@/types/auth'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  const fetchUserProfile = useCallback(async (userId: string): Promise<boolean> => {
    try {
      console.log('🔐 [useAuth] Fetching user profile for:', userId)
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('🔐 [useAuth] Profile fetch error:', error)
        
        // If profile doesn't exist for admin user, try to create it
        if (error.code === 'PGRST116') {
          const { data: { user } } = await supabase.auth.getUser()
          if (user?.email === 'admin@formulapm.com') {
            console.log('🔐 [useAuth] Creating missing admin profile')
            
            // Use admin client to bypass RLS
            const { supabaseAdmin } = await import('@/lib/supabase')
            const { data: newProfile, error: createError } = await supabaseAdmin
              .from('user_profiles')
              .insert({
                id: userId,
                role: 'company_owner',
                first_name: 'Admin',
                last_name: 'User',
                email: user.email,
                phone: null,
                company: 'Formula PM',
                department: 'Administration',
                permissions: {},
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select('*')
              .single()
            
            if (createError) {
              console.error('🔐 [useAuth] Failed to create admin profile:', createError)
              setProfile(null)
              return false
            }
            
            if (newProfile) {
              const profile: UserProfile = {
                id: newProfile.id,
                role: newProfile.role as UserRole,
                first_name: newProfile.first_name,
                last_name: newProfile.last_name,
                email: newProfile.email,
                phone: newProfile.phone,
                company: newProfile.company,
                department: newProfile.department,
                permissions: newProfile.permissions || {},
                is_active: newProfile.is_active,
                created_at: newProfile.created_at,
                updated_at: newProfile.updated_at
              }
              setProfile(profile)
              return true
            }
          }
        }
        
        setProfile(null)
        return false
      }

      if (!data) {
        console.error('🔐 [useAuth] No profile data returned')
        setProfile(null)
        return false
      }
      
      const profile: UserProfile = {
        id: data.id,
        role: data.role as UserRole,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        department: data.department,
        permissions: data.permissions || {},
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at
      }
      
      setProfile(profile)
      console.log('🔐 [useAuth] Profile fetched successfully:', { 
        userId, 
        role: profile.role, 
        email: profile.email,
        isActive: profile.is_active 
      })
      return true
      
    } catch (error) {
      console.error('🔐 [useAuth] Profile fetch exception:', error)
      setProfile(null)
      return false
    }
  }, [])

  useEffect(() => {
    console.log('🔐 [useAuth] Initializing auth hook')
    
    const initializeAuth = async () => {
      try {
        setLoading(true)
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('🔐 [useAuth] Session error:', error)
          setAuthError(error.message)
          return
        }

        if (session?.user) {
          console.log('🔐 [useAuth] Existing session found:', session.user.id)
          setUser(session.user)
          await fetchUserProfile(session.user.id)
        } else {
          console.log('🔐 [useAuth] No existing session')
        }
      } catch (error) {
        console.error('🔐 [useAuth] Auth initialization failed:', error)
        setAuthError(error instanceof Error ? error.message : 'Authentication failed')
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 [useAuth] Auth state change:', event, session?.user?.id)
        
        try {
          switch (event) {
            case 'SIGNED_IN':
              if (session?.user) {
                setUser(session.user)
                await fetchUserProfile(session.user.id)
                setAuthError(null)
              }
              break
              
            case 'SIGNED_OUT':
              setUser(null)
              setProfile(null)
              setAuthError(null)
              break
              
            case 'TOKEN_REFRESHED':
              if (session?.user) {
                setUser(session.user)
              }
              break
              
            case 'USER_UPDATED':
              if (session?.user) {
                setUser(session.user)
                await fetchUserProfile(session.user.id)
              }
              break
          }
        } catch (error) {
          console.error('🔐 [useAuth] Error handling auth state change:', error)
          setAuthError(error instanceof Error ? error.message : 'Authentication error')
        }
      }
    )

    return () => {
      console.log('🔐 [useAuth] Cleanup')
      subscription.unsubscribe()
    }
  }, [fetchUserProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    console.log('🔐 [useAuth] Starting sign in')
    setLoading(true)
    setAuthError(null)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      })
      
      if (error) {
        console.error('🔐 [useAuth] Sign in failed:', error)
        setAuthError(error.message)
        throw error
      }
      
      console.log('🔐 [useAuth] Sign in successful')
      // User and profile will be set by the auth state change listener
      return data
      
    } catch (error) {
      console.error('🔐 [useAuth] Sign in exception:', error)
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed'
      setAuthError(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    console.log('🔐 [useAuth] Signing out')
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('🔐 [useAuth] Sign out error:', error)
      }
    } catch (error) {
      console.error('🔐 [useAuth] Sign out exception:', error)
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
    
    // Computed auth state
    isAuthenticated: !!user && !!profile && profile.is_active,
    authState: loading ? 'loading' : (user && profile ? 'authenticated' : 'idle'),
    isError: !!authError,
    isRecoveringSession: false,
    
    // Role checks
    isManagement: profile ? ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin'].includes(profile.role) : false,
    isProjectRole: profile ? ['project_manager', 'architect', 'technical_engineer'].includes(profile.role) : false,
    isPurchaseRole: profile ? ['purchase_director', 'purchase_specialist'].includes(profile.role) : false,
    isFieldRole: profile ? ['field_worker'].includes(profile.role) : false,
    isExternalRole: profile ? ['client'].includes(profile.role) : false,
    
    // Debug info
    debugInfo: {
      authState: loading ? 'loading' : (user && profile ? 'authenticated' : 'idle'),
      recoveryAttempts: 0,
      hasError: !!authError,
      errorCode: authError ? 'AUTH_ERROR' : undefined,
      isRecovering: false
    }
  }
}