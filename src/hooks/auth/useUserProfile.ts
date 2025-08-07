'use client'

import { useCallback, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { UserProfile, UserRole } from '@/types/auth'

/**
 * User profile management hook
 * 
 * Handles user profile fetching and management:
 * - Profile data fetching from user_profiles table
 * - Profile loading state management
 * - Database data transformation to UserProfile type
 * - Profile caching integration
 * 
 * This hook is focused solely on user profile operations and does not handle:
 * - Authentication state or sessions
 * - Authentication actions (signIn, signOut)
 * - Token management
 * - Impersonation logic
 * 
 * Usage:
 * ```tsx
 * const { profile, loading, error, fetchProfile, refetchProfile } = useUserProfile(userId)
 * ```
 */

export interface UserProfileState {
  /** Current user profile data */
  profile: UserProfile | null
  /** Loading state during profile fetch operations */
  loading: boolean
  /** Profile fetch error message */
  error: string | null
  /** Function to manually fetch profile for a specific user */
  fetchProfile: (userId: string) => Promise<UserProfile | null>
  /** Function to refetch the current user's profile */
  refetchProfile: () => Promise<void>
  /** Clear any profile errors */
  clearError: () => void
}

/**
 * Hook for managing user profile data
 * 
 * @param userId - User ID to fetch profile for. If not provided, profile won't be auto-fetched
 * @param autoFetch - Whether to automatically fetch profile when userId changes (default: true)
 * @returns UserProfileState object with profile data and management functions
 */
export const useUserProfile = (
  userId?: string, 
  autoFetch: boolean = true
): UserProfileState => {
  // Profile state management
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Transform database user_profiles row to UserProfile type
   * 
   * @param data - Raw database row from user_profiles table
   * @returns Transformed UserProfile object
   */
  const transformDatabaseProfile = useCallback((data: any): UserProfile => {
    return {
      id: data.id,
      role: data.role as UserRole,
      first_name: data.full_name?.split(' ')[0] || '',
      last_name: data.full_name?.split(' ').slice(1).join(' ') || '',
      email: data.email,
      phone: data.phone,
      company: '', // Not in database schema
      department: '', // Not in database schema
      avatar_url: data.avatar_url,
      permissions: data.permissions || {},
      is_active: data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at,
      seniority_level: data.seniority_level,
      dashboard_preferences: data.dashboard_preferences,
      previous_role: data.previous_role,
      role_migrated_at: data.role_migrated_at
    }
  }, [])

  /**
   * Fetch user profile from database with timeout protection
   * 
   * @param targetUserId - User ID to fetch profile for
   * @returns Promise<UserProfile | null> - User profile or null if not found/error
   */
  const fetchProfile = useCallback(async (targetUserId: string): Promise<UserProfile | null> => {
    if (!targetUserId) {
      console.warn('🔐 [useUserProfile] No userId provided to fetchProfile')
      setLoading(false)
      return null
    }

    console.log('🔐 [useUserProfile] Starting fetchProfile for user:', targetUserId)
    console.log('🔐 [useUserProfile] Current state before fetch - loading:', loading, 'profile:', !!profile, 'error:', error)
    
    setLoading(true)
    setError(null)

    try {
      // Add timeout to database query to prevent hanging
      const queryPromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', targetUserId)
        .maybeSingle()

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 8000)
      })

      const { data, error } = await Promise.race([queryPromise, timeoutPromise])

      if (error) {
        console.error('🔐 [useUserProfile] Database error:', error.message)
        
        // Handle timeout or connection errors gracefully
        if (error.message.includes('timeout') || error.message.includes('Profile fetch timeout')) {
          console.warn('🔐 [useUserProfile] Profile fetch timeout - continuing without profile')
          setError(null) // Don't block authentication for timeouts
        } else {
          setError(`Failed to fetch profile: ${error.message}`)
        }
        
        setProfile(null)
        return null
      }

      if (!data) {
        console.warn('🔐 [useUserProfile] No profile found for user:', targetUserId)
        // Don't set error for missing profiles - this is common in development
        // and shouldn't block authentication
        setError(null)
        setProfile(null)
        return null
      }

      console.log('🔐 [useUserProfile] Profile fetched successfully:', data.email)
      
      // Transform database data to UserProfile type
      const transformedProfile = transformDatabaseProfile(data)
      setProfile(transformedProfile)
      
      return transformedProfile

    } catch (exception) {
      console.error('🔐 [useUserProfile] Fetch exception:', exception)
      const errorMessage = exception instanceof Error ? exception.message : 'Profile fetch failed'
      
      // Handle timeouts and connection issues gracefully
      if (errorMessage.includes('timeout') || 
          errorMessage.includes('Profile fetch timeout') ||
          errorMessage.includes('Refresh Token')) {
        console.warn('🔐 [useUserProfile] Profile fetch issue (timeout/auth) - not blocking authentication')
        setError(null) // Don't block authentication for these issues
      } else {
        setError(errorMessage)
      }
      
      setProfile(null)
      return null

    } finally {
      setLoading(false)
    }
  }, [transformDatabaseProfile])

  /**
   * Refetch the current user's profile
   * Convenience method for refreshing profile data
   */
  const refetchProfile = useCallback(async (): Promise<void> => {
    if (!userId) {
      console.warn('🔐 [useUserProfile] Cannot refetch profile - no userId provided')
      return
    }

    await fetchProfile(userId)
  }, [userId, fetchProfile])

  /**
   * Clear profile error state
   * Useful for dismissing error messages in the UI
   */
  const clearError = useCallback((): void => {
    console.log('🔐 [useUserProfile] Clearing profile error')
    setError(null)
  }, [])

  /**
   * Auto-fetch profile when userId changes
   * Only runs if autoFetch is true and userId is provided
   * Fixed: Removed fetchProfile dependency to prevent infinite loop
   */
  useEffect(() => {
    if (!autoFetch) {
      console.log('🔐 [useUserProfile] Auto-fetch disabled')
      return
    }

    if (!userId) {
      console.log('🔐 [useUserProfile] Skipping auto-fetch - no userId provided')
      setLoading(false) // Ensure loading state is cleared when no userId
      return
    }

    // Add timeout for profile fetching to prevent infinite loading
    const fetchTimeout = setTimeout(() => {
      console.warn('🔐 [useUserProfile] Profile fetch timeout for user:', userId)
      setLoading(false)
    }, 10000) // 10 second timeout for profile fetch

    console.log('🔐 [useUserProfile] Auto-fetching profile for user:', userId)
    
    // Inline profile fetching to avoid dependency issues
    const doFetch = async () => {
      if (!userId) {
        console.warn('🔐 [useUserProfile] No userId provided to fetchProfile')
        setLoading(false)
        return null
      }

      console.log('🔐 [useUserProfile] Starting fetchProfile for user:', userId)
      setLoading(true)
      setError(null)

      try {
        // Add timeout to database query to prevent hanging
        const queryPromise = supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle()

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Profile fetch timeout')), 8000)
        })

        const { data, error } = await Promise.race([queryPromise, timeoutPromise])

        if (error) {
          console.error('🔐 [useUserProfile] Database error:', error.message)
          
          // Handle timeout or connection errors gracefully
          if (error.message.includes('timeout') || error.message.includes('Profile fetch timeout')) {
            console.warn('🔐 [useUserProfile] Profile fetch timeout - continuing without profile')
            setError(null) // Don't block authentication for timeouts
          } else {
            setError(`Failed to fetch profile: ${error.message}`)
          }
          
          setProfile(null)
          return null
        }

        if (!data) {
          console.warn('🔐 [useUserProfile] No profile found for user:', userId)
          setError(null)
          setProfile(null)
          return null
        }

        console.log('🔐 [useUserProfile] Profile fetched successfully:', data.email)
        
        // Transform database data to UserProfile type
        const transformedProfile = transformDatabaseProfile(data)
        setProfile(transformedProfile)
        
        return transformedProfile

      } catch (exception) {
        console.error('🔐 [useUserProfile] Fetch exception:', exception)
        const errorMessage = exception instanceof Error ? exception.message : 'Profile fetch failed'
        
        // Handle timeouts and connection issues gracefully
        if (errorMessage.includes('timeout') || 
            errorMessage.includes('Profile fetch timeout') ||
            errorMessage.includes('Refresh Token')) {
          console.warn('🔐 [useUserProfile] Profile fetch issue (timeout/auth) - not blocking authentication')
          setError(null) // Don't block authentication for these issues
        } else {
          setError(errorMessage)
        }
        
        setProfile(null)
        return null

      } finally {
        setLoading(false)
      }
    }

    doFetch()
      .then(() => {
        clearTimeout(fetchTimeout)
      })
      .catch(error => {
        console.error('🔐 [useUserProfile] Auto-fetch failed:', error)
        clearTimeout(fetchTimeout)
      })

    return () => {
      clearTimeout(fetchTimeout)
    }
  }, [userId, autoFetch]) // Removed fetchProfile from dependencies to prevent infinite loop

  // Debug logging for profile state changes - DISABLED to reduce console spam
  useEffect(() => {
    const debugEnabled = false // Disabled to prevent console spam
    if (!debugEnabled || process.env.NODE_ENV !== 'development') return
    
    // Only log critical state changes
    if (error || (userId && !loading && !profile)) {
      console.warn('🔐 [useUserProfile] Critical state:', {
        userId,
        hasProfile: !!profile,
        loading,
        error
      })
    }
  }, [userId, profile, loading, error])

  return {
    profile,
    loading,
    error,
    fetchProfile,
    refetchProfile,
    clearError
  }
}

/**
 * Hook for fetching multiple user profiles by IDs
 * Useful for fetching profiles for multiple users at once
 * 
 * @param userIds - Array of user IDs to fetch profiles for
 * @returns Object with profiles map, loading state, and error handling
 */
export const useMultipleUserProfiles = (userIds: string[]) => {
  const [profiles, setProfiles] = useState<Map<string, UserProfile>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMultipleProfiles = useCallback(async (targetUserIds: string[]): Promise<Map<string, UserProfile>> => {
    if (targetUserIds.length === 0) {
      return new Map()
    }

    console.log('🔐 [useMultipleUserProfiles] Fetching profiles for users:', targetUserIds.length)
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .in('id', targetUserIds)

      if (error) {
        console.error('🔐 [useMultipleUserProfiles] Database error:', error.message)
        setError(`Failed to fetch profiles: ${error.message}`)
        return new Map()
      }

      // Transform and map profiles
      const profilesMap = new Map<string, UserProfile>()
      data?.forEach(profileData => {
        const transformedProfile: UserProfile = {
          id: profileData.id,
          role: profileData.role as UserRole,
          first_name: profileData.full_name?.split(' ')[0] || '',
          last_name: profileData.full_name?.split(' ').slice(1).join(' ') || '',
          email: profileData.email,
          phone: profileData.phone,
          company: '',
          department: '',
          avatar_url: profileData.avatar_url,
          permissions: profileData.permissions || {},
          is_active: profileData.is_active,
          created_at: profileData.created_at,
          updated_at: profileData.updated_at,
          seniority_level: profileData.seniority_level,
          dashboard_preferences: profileData.dashboard_preferences,
          previous_role: profileData.previous_role,
          role_migrated_at: profileData.role_migrated_at
        }
        profilesMap.set(profileData.id, transformedProfile)
      })

      console.log('🔐 [useMultipleUserProfiles] Fetched', profilesMap.size, 'profiles')
      setProfiles(profilesMap)
      
      return profilesMap

    } catch (exception) {
      console.error('🔐 [useMultipleUserProfiles] Fetch exception:', exception)
      const errorMessage = exception instanceof Error ? exception.message : 'Profiles fetch failed'
      setError(errorMessage)
      return new Map()

    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-fetch when userIds change
  useEffect(() => {
    if (userIds.length > 0) {
      fetchMultipleProfiles(userIds)
    }
  }, [userIds, fetchMultipleProfiles])

  return {
    profiles,
    loading,
    error,
    fetchMultipleProfiles,
    getProfile: (userId: string) => profiles.get(userId),
    clearError: () => setError(null)
  }
}