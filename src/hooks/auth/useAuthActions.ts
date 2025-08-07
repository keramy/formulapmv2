'use client'

import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { authCache } from '@/lib/auth-cache'
import type { AuthResponse } from '@supabase/supabase-js'

/**
 * Authentication actions hook
 * 
 * Provides reusable authentication actions:
 * - signIn: Authenticate user with email/password
 * - signOut: Sign out current user and clean up state
 * - clearAuthError: Clear any authentication errors
 * 
 * This hook is focused solely on authentication actions and does not handle:
 * - Authentication state management
 * - User profiles or roles
 * - Impersonation logic
 * - Token access methods
 * 
 * All functions use useCallback for optimal performance and to prevent
 * unnecessary re-renders in consuming components.
 */

export interface AuthActions {
  /** Sign in user with email and password */
  signIn: (email: string, password: string) => Promise<AuthResponse>
  /** Sign out current user and clean up all auth state */
  signOut: () => Promise<void>
  /** Clear any authentication error state */
  clearAuthError: () => void
  /** Whether a sign in operation is currently in progress */
  isSigningIn: boolean
  /** Whether a sign out operation is currently in progress */
  isSigningOut: boolean
  /** Current authentication error, if any */
  authError: string | null
}

export const useAuthActions = (): AuthActions => {
  // Action state management
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  /**
   * Sign in user with email and password
   * 
   * @param email - User email address
   * @param password - User password
   * @returns Promise<AuthResponse> - Supabase auth response
   * @throws Error if authentication fails
   */
  const signIn = useCallback(async (email: string, password: string): Promise<AuthResponse> => {
    console.log('🔐 [useAuthActions] Starting sign in for:', email)
    setIsSigningIn(true)
    setAuthError(null)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      })
      
      if (error) {
        console.error('🔐 [useAuthActions] Sign in failed:', error)
        setAuthError(error.message)
        setIsSigningIn(false)
        throw error
      }
      
      console.log('🔐 [useAuthActions] Sign in successful for user:', data.user?.id)
      
      // Cache the successful authentication
      if (data.session?.user && data.session?.access_token) {
        authCache.setCachedAuth(data.session.user, null, data.session.access_token)
      }
      
      return { data, error: null }
      
    } catch (error) {
      console.error('🔐 [useAuthActions] Sign in exception:', error)
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed'
      setAuthError(errorMessage)
      setIsSigningIn(false)
      throw error
    }
  }, [])

  /**
   * Sign out current user and perform complete cleanup
   * 
   * Clears:
   * - Supabase session
   * - Authentication cache
   * - Local storage entries
   * - Component state
   */
  const signOut = useCallback(async (): Promise<void> => {
    console.log('🔐 [useAuthActions] Starting sign out')
    setIsSigningOut(true)
    
    try {
      // Clear authentication cache first
      authCache.clearCache()
      
      // Clear component error state
      setAuthError(null)
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('🔐 [useAuthActions] Supabase sign out error:', error)
        // Continue with cleanup even if Supabase sign out fails
      }
      
      // Clean up localStorage entries
      if (typeof window !== 'undefined') {
        try {
          Object.keys(window.localStorage).forEach(key => {
            if (key.startsWith('sb-') || key.startsWith('supabase')) {
              window.localStorage.removeItem(key)
            }
          })
          
          // Remove any custom auth tokens
          window.localStorage.removeItem('auth_token')
          window.localStorage.removeItem('access_token')
          
          console.log('🧹 [useAuthActions] localStorage cleanup completed')
        } catch (error) {
          console.error('🧹 [useAuthActions] Error during localStorage cleanup:', error)
        }
      }
      
      console.log('🔐 [useAuthActions] Sign out completed successfully')
    } catch (error) {
      console.error('🔐 [useAuthActions] Sign out exception:', error)
      // Don't throw here as we want sign out to always succeed from the UI perspective
    } finally {
      setIsSigningOut(false)
    }
  }, [])

  /**
   * Clear any authentication error state
   * 
   * Useful for dismissing error messages in the UI or
   * clearing errors before attempting a new operation
   */
  const clearAuthError = useCallback((): void => {
    console.log('🔐 [useAuthActions] Clearing auth error')
    setAuthError(null)
  }, [])

  return {
    signIn,
    signOut,
    clearAuthError,
    isSigningIn,
    isSigningOut,
    authError
  }
}