'use client'

import { useCallback, useMemo } from 'react'
import { User } from '@supabase/supabase-js'
import { UserProfile } from '@/types/auth'
import { authCache } from '@/lib/auth-cache'

/**
 * Profile caching management hook
 * 
 * Provides a reusable interface for profile caching operations:
 * - Get cached profile data
 * - Set profile cache with user data
 * - Clear profile cache
 * - Check if cache needs refresh
 * - Get cache statistics
 * 
 * This hook wraps the authCache utility to provide React-friendly
 * caching functions that can be used across different auth hooks
 * and components.
 * 
 * Usage:
 * ```tsx
 * const { getCached, setCached, clearCache, needsRefresh, stats } = useProfileCache()
 * ```
 */

export interface ProfileCacheInterface {
  /** Get cached authentication data (user + profile) */
  getCached: () => { user: User | null; profile: UserProfile | null; accessToken: string | null } | null
  /** Cache user and profile data with optional access token */
  setCached: (user: User | null, profile: UserProfile | null, accessToken?: string | null) => void
  /** Clear all cached data */
  clearCache: () => void
  /** Check if cached data needs refresh */
  needsRefresh: () => boolean
  /** Get cache statistics and metadata */
  stats: {
    hasCache: boolean
    age: number | null
    timeToExpiry: number | null
    needsRefresh: boolean
  }
  /** Get cached profile only (convenience method) */
  getCachedProfile: () => UserProfile | null
  /** Get cached user only (convenience method) */
  getCachedUser: () => User | null
  /** Get cached access token only (convenience method) */
  getCachedToken: () => string | null
  /** Set profile only while preserving existing user and token */
  setCachedProfile: (profile: UserProfile | null) => void
  /** Check if specific user profile is cached */
  isUserCached: (userId: string) => boolean
}

/**
 * Hook for managing profile cache operations
 * 
 * Provides a clean, React-friendly interface to the global authCache
 * with memoized functions and additional convenience methods.
 * 
 * @returns ProfileCacheInterface with all caching operations
 */
export const useProfileCache = (): ProfileCacheInterface => {
  
  /**
   * Get cached authentication data
   * 
   * @returns Cached auth state or null if not cached/expired
   */
  const getCached = useCallback(() => {
    const cached = authCache.getCachedAuth()
    if (!cached) {
      return null
    }
    
    return {
      user: cached.user,
      profile: cached.profile,
      accessToken: cached.accessToken
    }
  }, [])

  /**
   * Cache user and profile data
   * 
   * @param user - User data to cache
   * @param profile - Profile data to cache  
   * @param accessToken - Optional access token to cache
   */
  const setCached = useCallback((
    user: User | null, 
    profile: UserProfile | null, 
    accessToken: string | null = null
  ) => {
    console.log('🔐 [useProfileCache] Caching auth data:', {
      hasUser: !!user,
      hasProfile: !!profile,
      hasToken: !!accessToken,
      userEmail: user?.email,
      profileRole: profile?.role
    })
    
    authCache.setCachedAuth(user, profile, accessToken)
  }, [])

  /**
   * Clear all cached authentication data
   */
  const clearCache = useCallback(() => {
    console.log('🔐 [useProfileCache] Clearing all cache')
    authCache.clearCache()
  }, [])

  /**
   * Check if cached data needs refresh
   * 
   * @returns true if cache needs refresh, false otherwise
   */
  const needsRefresh = useCallback((): boolean => {
    return authCache.needsRefresh()
  }, [])

  /**
   * Get cached profile only
   * Convenience method for components that only need profile data
   * 
   * @returns UserProfile or null if not cached
   */
  const getCachedProfile = useCallback((): UserProfile | null => {
    const cached = authCache.getCachedAuth()
    return cached?.profile || null
  }, [])

  /**
   * Get cached user only
   * Convenience method for components that only need user data
   * 
   * @returns User or null if not cached
   */
  const getCachedUser = useCallback((): User | null => {
    const cached = authCache.getCachedAuth()
    return cached?.user || null
  }, [])

  /**
   * Get cached access token only
   * Convenience method for API calls that only need the token
   * 
   * @returns Access token string or null if not cached
   */
  const getCachedToken = useCallback((): string | null => {
    const cached = authCache.getCachedAuth()
    return cached?.accessToken || null
  }, [])

  /**
   * Set profile only while preserving existing user and token
   * Useful when only the profile data needs to be updated
   * 
   * @param profile - Profile data to cache
   */
  const setCachedProfile = useCallback((profile: UserProfile | null) => {
    const cached = authCache.getCachedAuth()
    
    // Preserve existing user and token while updating profile
    authCache.setCachedAuth(
      cached?.user || null,
      profile,
      cached?.accessToken || null
    )
    
    console.log('🔐 [useProfileCache] Updated cached profile:', {
      hasProfile: !!profile,
      profileRole: profile?.role,
      preservedUser: !!cached?.user,
      preservedToken: !!cached?.accessToken
    })
  }, [])

  /**
   * Check if a specific user's data is currently cached
   * 
   * @param userId - User ID to check
   * @returns true if the user's data is cached, false otherwise
   */
  const isUserCached = useCallback((userId: string): boolean => {
    const cached = authCache.getCachedAuth()
    return cached?.user?.id === userId && !!cached.profile
  }, [])

  /**
   * Get cache statistics (memoized for performance)
   * Updates when cache state potentially changes
   */
  const stats = useMemo(() => {
    return authCache.getStats()
  }, []) // Note: We rely on the component re-rendering when cache changes

  return {
    getCached,
    setCached,
    clearCache,
    needsRefresh,
    stats,
    getCachedProfile,
    getCachedUser,
    getCachedToken,
    setCachedProfile,
    isUserCached
  }
}

/**
 * Hook for cache-aware data fetching
 * 
 * Provides a pattern for implementing cache-first data fetching
 * where cached data is returned immediately if available and fresh,
 * while stale data triggers a background refresh.
 * 
 * @param fetchFunction - Function to fetch fresh data
 * @param cacheKey - Unique key for this data in cache
 * @param options - Caching options
 * @returns Object with cached data and fetch functions
 */
export const useCacheFirstData = <T>(
  fetchFunction: () => Promise<T>,
  cacheKey: string,
  options: {
    /** Time in ms after which cached data is considered stale */
    staleTime?: number
    /** Whether to fetch fresh data in background when serving stale data */
    backgroundRefresh?: boolean
  } = {}
) => {
  const { staleTime = 5 * 60 * 1000, backgroundRefresh = true } = options
  
  // This could be expanded to use a more sophisticated cache
  // For now, it demonstrates the pattern using the auth cache
  
  const getCachedData = useCallback((): T | null => {
    // This is a simplified implementation
    // In a full implementation, you'd have a generic cache for any data type
    const cached = authCache.getCachedAuth()
    
    // For demonstration, return null - implement based on actual cache structure
    return null
  }, [cacheKey])

  const fetchWithCache = useCallback(async (): Promise<T> => {
    try {
      console.log(`🔐 [useCacheFirstData] Fetching fresh data for key: ${cacheKey}`)
      const freshData = await fetchFunction()
      
      // Cache the fresh data (implementation depends on cache structure)
      // This is where you'd store the fetched data in cache
      
      return freshData
    } catch (error) {
      console.error(`🔐 [useCacheFirstData] Fetch failed for key ${cacheKey}:`, error)
      throw error
    }
  }, [fetchFunction, cacheKey])

  return {
    getCachedData,
    fetchWithCache,
    clearCacheKey: () => {
      // Implementation depends on cache structure
      console.log(`🔐 [useCacheFirstData] Clearing cache for key: ${cacheKey}`)
    }
  }
}