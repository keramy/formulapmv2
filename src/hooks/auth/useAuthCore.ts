'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { authCache } from '@/lib/auth-cache'

/**
 * Core authentication state management hook
 * 
 * Handles only the essential authentication state:
 * - User session state (user, loading, error)
 * - Session initialization and auth state changes
 * - Token refresh management
 * 
 * This hook is focused solely on authentication state and does not handle:
 * - User profiles, roles, or permissions
 * - Authentication actions (signIn, signOut)
 * - Impersonation logic
 * - Token access methods
 */

export interface AuthCoreState {
  /** Current authenticated user from Supabase */
  user: User | null
  /** Loading state during session initialization and recovery */
  loading: boolean
  /** Authentication error message */
  error: string | null
  /** Whether user is currently authenticated */
  isAuthenticated: boolean
  /** Whether we're currently recovering a session */
  isRecoveringSession: boolean
}

export const useAuthCore = (): AuthCoreState => {
  // Core authentication state - minimal and focused
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Reduced logging - only log in development for debugging
    const debugEnabled = false // Set to true only when debugging auth issues
    if (debugEnabled && process.env.NODE_ENV === 'development') {
      console.log('🔐 [useAuthCore] Initializing core auth state')
    }
    let initializationCompleted = false
    
    // Health check: Clear corrupted localStorage entries on startup
    const performHealthCheck = (debugMode: boolean) => {
      if (typeof window === 'undefined') return
      
      try {
        // Check for corrupted Supabase entries
        const supabaseKeys = Object.keys(window.localStorage).filter(key => 
          key.startsWith('sb-') || key.startsWith('supabase')
        )
        
        for (const key of supabaseKeys) {
          try {
            const value = window.localStorage.getItem(key)
            if (value) {
              JSON.parse(value) // Test if valid JSON
            }
          } catch (error) {
            console.warn('🔐 [useAuthCore] Removing corrupted localStorage entry:', key)
            window.localStorage.removeItem(key)
          }
        }
        
        // Reduced logging - only log if debugEnabled
        if (debugMode && process.env.NODE_ENV === 'development') {
          console.log('🔐 [useAuthCore] Authentication health check completed')
        }
      } catch (error) {
        console.warn('🔐 [useAuthCore] Health check failed:', error)
      }
    }
    
    // Perform health check before initialization
    performHealthCheck(debugEnabled)
    
    // Circuit breaker: Force loading to false after maximum timeout
    const loadingTimeout = setTimeout(() => {
      if (!initializationCompleted) {
        console.warn('🔐 [useAuthCore] Authentication initialization timeout - forcing resolution')
        setLoading(false)
        initializationCompleted = true
      }
    }, 8000) // 8 second maximum loading time
    
    // Token refresh interval (every 30 minutes)
    const refreshInterval = setInterval(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error || !session) return
        
        console.log('🔄 [useAuthCore] Auto-refreshing token...')
        const { error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError) {
          console.warn('🔄 [useAuthCore] Token refresh failed:', refreshError.message)
        }
      } catch (error) {
        console.warn('🔄 [useAuthCore] Token refresh error:', error)
      }
    }, 30 * 60 * 1000) // 30 minutes

    /**
     * Initialize authentication state with timeout protection
     * Retrieves current session and sets initial user state
     */
    const initializeAuth = async () => {
      if (initializationCompleted) return
      
      try {
        console.log('🔐 [useAuthCore] Starting session retrieval...')
        
        // Add timeout to session retrieval to prevent hanging
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Session retrieval timeout')), 5000)
        })
        
        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]) as any
        
        if (initializationCompleted) return // Double-check in case timeout fired
        
        if (error) {
          console.error('🔐 [useAuthCore] Session error:', error)
          
          // Handle invalid refresh token errors by clearing local state
          if (error.message.includes('Invalid Refresh Token') || 
              error.message.includes('Refresh Token Not Found') ||
              error.message.includes('Session retrieval timeout')) {
            console.log('🔐 [useAuthCore] Invalid/timeout session detected - clearing storage')
            
            // Clear Supabase localStorage entries
            if (typeof window !== 'undefined') {
              Object.keys(window.localStorage).forEach(key => {
                if (key.startsWith('sb-') || key.startsWith('supabase')) {
                  window.localStorage.removeItem(key)
                }
              })
            }
            
            setError(null)
          } else {
            setError(error.message)
          }
          
          initializationCompleted = true
          setLoading(false)
          clearTimeout(loadingTimeout)
          return
        }

        if (session?.user) {
          console.log('🔐 [useAuthCore] Session found, setting user:', session.user.id)
          setUser(session.user)
          
          // Cache user session for quick access
          authCache.setCachedAuth(session.user, null, session.access_token)
        } else {
          console.log('🔐 [useAuthCore] No session found')
        }
        
        initializationCompleted = true
        setLoading(false)
        clearTimeout(loadingTimeout)
        
      } catch (error) {
        if (initializationCompleted) return
        
        console.error('🔐 [useAuthCore] Auth initialization failed:', error)
        setError(error instanceof Error ? error.message : 'Authentication failed')
        initializationCompleted = true
        setLoading(false)
        clearTimeout(loadingTimeout)
      }
    }

    // Initialize authentication
    initializeAuth()

    /**
     * Listen for authentication state changes
     * Handles sign in, sign out, token refresh, and user updates
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session, error) => {
        console.log('🔐 [useAuthCore] Auth state change:', event, session?.user?.id, error?.message)
        
        // Handle auth errors during state changes
        if (error && (error.message.includes('Invalid Refresh Token') || error.message.includes('Refresh Token Not Found'))) {
          console.log('🔐 [useAuthCore] Invalid refresh token detected - clearing state')
          
          setUser(null)
          setError(null)
          
          // Clear Supabase localStorage entries
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
                console.log('🔐 [useAuthCore] User signed in:', session.user.id)
                setUser(session.user)
                setError(null)
                
                // Cache the user session immediately
                authCache.setCachedAuth(session.user, null, session.access_token)
              }
              break
              
            case 'SIGNED_OUT':
              console.log('🔐 [useAuthCore] User signed out')
              authCache.clearCache()
              setUser(null)
              setError(null)
              break
              
            case 'TOKEN_REFRESHED':
              if (session?.user) {
                console.log('🔐 [useAuthCore] Token refreshed for user:', session.user.id)
                setUser(session.user)
                
                // Update cache with new token
                const cached = authCache.getCachedAuth()
                if (cached?.profile) {
                  authCache.setCachedAuth(session.user, cached.profile, session.access_token)
                }
              }
              break
              
            case 'USER_UPDATED':
              if (session?.user) {
                console.log('🔐 [useAuthCore] User updated:', session.user.id)
                setUser(session.user)
              }
              break
          }
        } catch (error) {
          console.error('🔐 [useAuthCore] Error handling auth state change:', error)
          if (!error instanceof Error || !error.message.includes('Refresh Token')) {
            setError(error instanceof Error ? error.message : 'Authentication error')
          }
        }
      }
    )

    // Cleanup function
    return () => {
      initializationCompleted = true
      clearTimeout(loadingTimeout)
      subscription.unsubscribe()
      clearInterval(refreshInterval)
    }
  }, []) // Empty dependency array to prevent infinite loops

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isRecoveringSession: loading && !!user
  }
}