'use client'

import { useCallback, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { authCache } from '@/lib/auth-cache'

/**
 * Access token management hook
 * 
 * Provides secure access token operations:
 * - Get current access token (with caching)
 * - Auto-refresh mechanism with 30-minute intervals
 * - Token caching for performance
 * - Refresh token on demand
 * - Token expiry detection and handling
 * 
 * This hook is focused solely on access token management and does not handle:
 * - User authentication or sessions
 * - User profiles or roles
 * - Authentication actions (signIn, signOut)
 * - Impersonation logic
 * 
 * Usage:
 * ```tsx
 * const { getAccessToken, refreshToken, isRefreshing } = useAccessToken()
 * const token = await getAccessToken() // Returns cached token or fetches fresh
 * ```
 */

export interface AccessTokenInterface {
  /** Get current access token (cached or fresh) */
  getAccessToken: () => Promise<string | null>
  /** Manually refresh the access token */
  refreshToken: () => Promise<string | null>
  /** Whether a token refresh is currently in progress */
  isRefreshing: boolean
  /** Check if current token is expired or close to expiry */
  isTokenExpired: () => boolean
  /** Clear cached token (forces fresh fetch on next getAccessToken) */
  clearTokenCache: () => void
  /** Get token expiry time in milliseconds (null if no token) */
  getTokenExpiry: () => number | null
  /** Get time until token expires in milliseconds (null if no token) */
  getTimeUntilExpiry: () => number | null
}

/**
 * Hook for managing access token operations
 * 
 * Implements intelligent caching, auto-refresh, and expiry detection
 * to provide seamless token management for API calls.
 * 
 * Features:
 * - Cache-first token retrieval for performance
 * - Automatic background refresh every 30 minutes
 * - Handles token expiry and refresh token errors
 * - Prevents multiple simultaneous refresh operations
 * - Integrates with the global auth cache system
 * 
 * @returns AccessTokenInterface with token management functions
 */
export const useAccessToken = (): AccessTokenInterface => {
  // Track refresh state to prevent duplicate operations
  const isRefreshingRef = useRef(false)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  /**
   * Get current access token with intelligent caching
   * 
   * Order of operations:
   * 1. Check cache for valid, non-expired token
   * 2. If cached token is valid, return it immediately
   * 3. If no cached token or expired, fetch fresh from Supabase
   * 4. Cache the fresh token for future use
   * 
   * @returns Promise<string | null> - Access token or null if unavailable
   */
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      // Check cache first for quick access
      const cached = authCache.getCachedAuth()
      
      if (cached?.accessToken && !authCache.needsRefresh()) {
        console.log('🔐 [useAccessToken] Using cached access token')
        return cached.accessToken
      }

      if (cached?.accessToken && !isTokenExpiredHelper(cached.accessToken)) {
        console.log('🔐 [useAccessToken] Using cached token (not expired)')
        return cached.accessToken
      }

      console.log('🔐 [useAccessToken] Fetching fresh access token')
      
      // Fetch fresh token from Supabase
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('🔐 [useAccessToken] Session error:', error.message)
        
        // Handle refresh token errors by clearing cache
        if (error.message.includes('Refresh Token') || error.message.includes('Invalid token')) {
          console.log('🔐 [useAccessToken] Invalid refresh token, clearing cache')
          authCache.clearCache()
        }
        
        return null
      }
      
      if (!session?.access_token) {
        console.warn('🔐 [useAccessToken] No access token in session')
        return null
      }
      
      console.log('🔐 [useAccessToken] Fresh token retrieved successfully')
      
      // Update cache with fresh token and user data
      if (session.user && cached?.profile) {
        authCache.setCachedAuth(session.user, cached.profile, session.access_token)
      } else if (session.user) {
        authCache.setCachedAuth(session.user, null, session.access_token)
      }
      
      return session.access_token
      
    } catch (exception) {
      console.error('🔐 [useAccessToken] Get access token exception:', exception)
      return null
    }
  }, [])

  /**
   * Manually refresh the access token
   * 
   * Forces a token refresh operation and updates the cache.
   * Includes duplicate operation prevention to avoid race conditions.
   * 
   * @returns Promise<string | null> - New access token or null if refresh failed
   */
  const refreshToken = useCallback(async (): Promise<string | null> => {
    // Prevent duplicate refresh operations
    if (isRefreshingRef.current) {
      console.log('🔄 [useAccessToken] Refresh already in progress, waiting...')
      
      // Wait for current refresh to complete
      let attempts = 0
      const maxAttempts = 50 // 5 seconds max wait
      
      while (isRefreshingRef.current && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100))
        attempts++
      }
      
      // Return token from cache after waiting
      return getCachedTokenHelper()
    }

    console.log('🔄 [useAccessToken] Starting manual token refresh')
    isRefreshingRef.current = true
    
    try {
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('🔄 [useAccessToken] Token refresh error:', error.message)
        
        // Clear cache on refresh token errors
        if (error.message.includes('Refresh Token') || error.message.includes('Invalid token')) {
          console.log('🔄 [useAccessToken] Invalid refresh token, clearing cache')
          authCache.clearCache()
        }
        
        return null
      }
      
      if (!data.session?.access_token) {
        console.warn('🔄 [useAccessToken] No access token in refreshed session')
        return null
      }
      
      console.log('🔄 [useAccessToken] Token refreshed successfully')
      
      // Update cache with refreshed token
      const cached = authCache.getCachedAuth()
      authCache.setCachedAuth(
        data.session.user, 
        cached?.profile || null, 
        data.session.access_token
      )
      
      return data.session.access_token
      
    } catch (exception) {
      console.error('🔄 [useAccessToken] Refresh token exception:', exception)
      return null
    } finally {
      isRefreshingRef.current = false
    }
  }, [])

  /**
   * Check if current token is expired or close to expiry
   * 
   * @returns boolean - true if token is expired or expires within 5 minutes
   */
  const isTokenExpired = useCallback((): boolean => {
    const cached = authCache.getCachedAuth()
    
    if (!cached?.accessToken) {
      return true
    }
    
    return isTokenExpiredHelper(cached.accessToken)
  }, [])

  /**
   * Clear cached token to force fresh fetch
   * 
   * Useful when you know the token is invalid and want to force
   * a fresh fetch on the next getAccessToken call
   */
  const clearTokenCache = useCallback((): void => {
    console.log('🔐 [useAccessToken] Clearing token cache')
    const cached = authCache.getCachedAuth()
    
    // Clear token but preserve user and profile
    authCache.setCachedAuth(cached?.user || null, cached?.profile || null, null)
  }, [])

  /**
   * Get token expiry time in milliseconds
   * 
   * @returns number | null - Expiry timestamp or null if no token
   */
  const getTokenExpiry = useCallback((): number | null => {
    const cached = authCache.getCachedAuth()
    return cached?.expiresAt || null
  }, [])

  /**
   * Get time until token expires in milliseconds
   * 
   * @returns number | null - Time until expiry or null if no token
   */
  const getTimeUntilExpiry = useCallback((): number | null => {
    const expiresAt = getTokenExpiry()
    
    if (!expiresAt) {
      return null
    }
    
    const timeLeft = expiresAt - Date.now()
    return Math.max(0, timeLeft)
  }, [getTokenExpiry])

  /**
   * Set up automatic token refresh interval
   * Refreshes token every 30 minutes to keep it fresh
   * Fixed: Removed refreshToken dependency to prevent infinite loop
   */
  useEffect(() => {
    console.log('🔄 [useAccessToken] Setting up auto-refresh interval')
    
    // Clear any existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
    }
    
    // Set up 30-minute refresh interval
    refreshIntervalRef.current = setInterval(async () => {
      try {
        const cached = authCache.getCachedAuth()
        
        // Only refresh if we have a user session
        if (cached?.user) {
          console.log('🔄 [useAccessToken] Auto-refresh triggered')
          // Call refreshToken directly to avoid dependency issues
          try {
            const { data, error } = await supabase.auth.refreshSession()
            if (error) {
              console.warn('🔄 [useAccessToken] Auto-refresh failed:', error.message)
            } else if (data.session?.access_token) {
              console.log('🔄 [useAccessToken] Auto-refresh successful')
              // Update cache with refreshed token
              const cached = authCache.getCachedAuth()
              authCache.setCachedAuth(
                data.session.user, 
                cached?.profile || null, 
                data.session.access_token
              )
            }
          } catch (refreshError) {
            console.warn('🔄 [useAccessToken] Auto-refresh exception:', refreshError)
          }
        }
      } catch (error) {
        console.warn('🔄 [useAccessToken] Auto-refresh failed:', error)
      }
    }, 30 * 60 * 1000) // 30 minutes

    // Cleanup function
    return () => {
      if (refreshIntervalRef.current) {
        console.log('🔄 [useAccessToken] Clearing auto-refresh interval')
        clearInterval(refreshIntervalRef.current)
        refreshIntervalRef.current = null
      }
    }
  }, []) // Empty dependency array to prevent infinite loop

  return {
    getAccessToken,
    refreshToken,
    isRefreshing: isRefreshingRef.current,
    isTokenExpired,
    clearTokenCache,
    getTokenExpiry,
    getTimeUntilExpiry
  }
}

/**
 * Helper function to check if a JWT token is expired
 * 
 * @param token - JWT access token string
 * @returns boolean - true if expired or expires within 5 minutes
 */
function isTokenExpiredHelper(token: string): boolean {
  try {
    // Decode JWT payload
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.warn('🔐 [useAccessToken] Invalid JWT format')
      return true
    }
    
    const payload = JSON.parse(atob(parts[1]))
    const expiryTime = payload.exp * 1000 // Convert to milliseconds
    const now = Date.now()
    const fiveMinutes = 5 * 60 * 1000
    
    // Consider expired if expires within 5 minutes
    return expiryTime <= (now + fiveMinutes)
    
  } catch (error) {
    console.warn('🔐 [useAccessToken] Error checking token expiry:', error)
    return true // Assume expired if we can't decode
  }
}

/**
 * Helper function to get cached token
 * 
 * @returns string | null - Cached access token or null
 */
function getCachedTokenHelper(): string | null {
  const cached = authCache.getCachedAuth()
  return cached?.accessToken || null
}