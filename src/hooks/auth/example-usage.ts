/**
 * Example Usage of Specialized Auth Hooks
 * 
 * This file demonstrates how to use the new specialized authentication hooks
 * in different scenarios. These examples show the hooks working independently
 * and how they can be composed together.
 * 
 * NOTE: This is a documentation/example file and should not be imported
 * into actual application components.
 */

'use client'

import { useCallback, useEffect } from 'react'
import { 
  useUserProfile, 
  useProfileCache, 
  useAccessToken,
  useAuthCore,
  useAuthActions
} from './index'

/**
 * Example 1: Simple profile fetching
 * 
 * Use case: Component that needs to display user profile information
 */
export const ExampleUserProfileDisplay = ({ userId }: { userId: string }) => {
  const { profile, loading, error, refetchProfile } = useUserProfile(userId)
  
  // Example usage in component
  if (loading) return 'Loading profile...'
  if (error) return `Error: ${error}`
  if (!profile) return 'No profile found'
  
  return {
    email: profile.email,
    role: profile.role,
    name: `${profile.first_name} ${profile.last_name}`,
    refreshProfile: refetchProfile
  }
}

/**
 * Example 2: Manual profile management
 * 
 * Use case: Admin component that needs to fetch profiles for different users
 */
export const ExampleAdminProfileManager = () => {
  const { profile, loading, error, fetchProfile, clearError } = useUserProfile(undefined, false)
  
  const loadUserProfile = useCallback(async (userId: string) => {
    clearError() // Clear previous errors
    const userProfile = await fetchProfile(userId)
    
    if (userProfile) {
      console.log('Loaded profile for:', userProfile.email)
    }
  }, [fetchProfile, clearError])
  
  return {
    currentProfile: profile,
    isLoading: loading,
    error,
    loadUserProfile,
    clearError
  }
}

/**
 * Example 3: Profile caching operations
 * 
 * Use case: Component that needs to manage profile cache efficiently
 */
export const ExampleCacheManager = () => {
  const { 
    getCached, 
    setCached, 
    clearCache, 
    getCachedProfile, 
    isUserCached,
    stats 
  } = useProfileCache()
  
  const checkUserInCache = useCallback((userId: string) => {
    const isCached = isUserCached(userId)
    console.log(`User ${userId} is ${isCached ? 'cached' : 'not cached'}`)
    return isCached
  }, [isUserCached])
  
  const getCachedUserProfile = useCallback(() => {
    const cachedProfile = getCachedProfile()
    if (cachedProfile) {
      console.log('Found cached profile:', cachedProfile.email)
    }
    return cachedProfile
  }, [getCachedProfile])
  
  return {
    checkUserInCache,
    getCachedUserProfile,
    clearCache,
    cacheStats: stats
  }
}

/**
 * Example 4: Access token management
 * 
 * Use case: API service that needs fresh access tokens
 */
export const ExampleApiService = () => {
  const { 
    getAccessToken, 
    refreshToken, 
    isTokenExpired, 
    getTimeUntilExpiry 
  } = useAccessToken()
  
  const makeAuthenticatedRequest = useCallback(async (endpoint: string) => {
    // Check if token is expired before making request
    if (isTokenExpired()) {
      console.log('Token expired, refreshing...')
      await refreshToken()
    }
    
    const token = await getAccessToken()
    if (!token) {
      throw new Error('No access token available')
    }
    
    // Make API request with token
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    return response
  }, [getAccessToken, refreshToken, isTokenExpired])
  
  const checkTokenStatus = useCallback(() => {
    const timeLeft = getTimeUntilExpiry()
    const expired = isTokenExpired()
    
    return {
      isExpired: expired,
      timeUntilExpiry: timeLeft ? Math.round(timeLeft / 1000 / 60) : null, // minutes
      needsRefresh: expired || (timeLeft && timeLeft < 5 * 60 * 1000) // less than 5 minutes
    }
  }, [isTokenExpired, getTimeUntilExpiry])
  
  return {
    makeAuthenticatedRequest,
    checkTokenStatus
  }
}

/**
 * Example 5: Composing hooks together
 * 
 * Use case: Complete authentication management using all hooks
 */
export const ExampleCompleteAuthManager = () => {
  // Core auth state
  const { user, loading: authLoading, isAuthenticated } = useAuthCore()
  
  // Auth actions
  const { signIn, signOut, isSigningIn } = useAuthActions()
  
  // User profile management
  const { profile, loading: profileLoading, refetchProfile } = useUserProfile(
    user?.id, 
    !!user // Only auto-fetch if user exists
  )
  
  // Token management
  const { getAccessToken, isTokenExpired } = useAccessToken()
  
  // Cache operations
  const { clearCache, stats: cacheStats } = useProfileCache()
  
  // Combined loading state
  const isLoading = authLoading || profileLoading || isSigningIn
  
  // Complete sign out with cleanup
  const completeSignOut = useCallback(async () => {
    clearCache() // Clear cache first
    await signOut() // Then sign out
  }, [clearCache, signOut])
  
  // Refresh user data
  const refreshUserData = useCallback(async () => {
    if (user?.id) {
      await refetchProfile()
    }
  }, [user?.id, refetchProfile])
  
  // Check authentication status
  const getAuthStatus = useCallback(async () => {
    const token = await getAccessToken()
    const tokenExpired = isTokenExpired()
    
    return {
      isAuthenticated,
      hasValidToken: !!token && !tokenExpired,
      userProfile: profile,
      cacheStats
    }
  }, [isAuthenticated, getAccessToken, isTokenExpired, profile, cacheStats])
  
  return {
    // State
    user,
    profile,
    isLoading,
    isAuthenticated,
    
    // Actions
    signIn,
    signOut: completeSignOut,
    refreshUserData,
    getAuthStatus,
    
    // Utilities
    cacheStats
  }
}

/**
 * Example 6: Hook composition for specific use cases
 * 
 * Use case: Creating specialized hooks by composing basic ones
 */
export const useAuthenticatedApiCall = () => {
  const { getAccessToken } = useAccessToken()
  const { isAuthenticated } = useAuthCore()
  
  return useCallback(async (endpoint: string, options: RequestInit = {}) => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated')
    }
    
    const token = await getAccessToken()
    if (!token) {
      throw new Error('No access token available')
    }
    
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }
    
    return response.json()
  }, [getAccessToken, isAuthenticated])
}

/**
 * Example 7: Profile-aware hook
 * 
 * Use case: Hook that needs both auth and profile information
 */
export const useUserPermissions = (userId?: string) => {
  const { profile } = useUserProfile(userId)
  
  const hasPermission = useCallback((permission: string): boolean => {
    if (!profile || !profile.is_active) {
      return false
    }
    
    return profile.permissions[permission] === true
  }, [profile])
  
  const hasRole = useCallback((role: string): boolean => {
    return profile?.role === role
  }, [profile])
  
  const isAdmin = useCallback((): boolean => {
    return profile?.role === 'admin'
  }, [profile])
  
  return {
    profile,
    hasPermission,
    hasRole,
    isAdmin,
    isActive: profile?.is_active || false
  }
}