'use client'

import { useState, useEffect, useCallback } from 'react'
import { UserProfile } from '@/types/auth'
import { useAdvancedApiQuery } from './useAdvancedApiQuery'

interface ImpersonationState {
  originalAdmin: UserProfile
  impersonatedUser: UserProfile
  timestamp: number
}

const IMPERSONATION_KEY = 'formula_pm_impersonation'
const IMPERSONATION_TIMEOUT = 4 * 60 * 60 * 1000 // 4 hours in milliseconds

export const useImpersonation = () => {
  const [impersonationState, setImpersonationState] = useState<ImpersonationState | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load impersonation state from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(IMPERSONATION_KEY)
      if (stored) {
        const parsed: ImpersonationState = JSON.parse(stored)
        
        // Check if impersonation has expired
        const now = Date.now()
        if (now - parsed.timestamp < IMPERSONATION_TIMEOUT) {
          setImpersonationState(parsed)
          console.log('🎭 [useImpersonation] Restored impersonation state:', {
            originalAdmin: parsed.originalAdmin.email,
            impersonatedUser: parsed.impersonatedUser.email,
            timestamp: new Date(parsed.timestamp).toISOString()
          })
        } else {
          // Expired impersonation, clear it
          sessionStorage.removeItem(IMPERSONATION_KEY)
          console.log('🎭 [useImpersonation] Impersonation expired, cleared state')
        }
      }
    } catch (error) {
      console.error('🎭 [useImpersonation] Error loading impersonation state:', error)
      sessionStorage.removeItem(IMPERSONATION_KEY)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Start impersonating a user
  const impersonateUser = useCallback((originalAdmin: UserProfile, targetUser: UserProfile): boolean => {
    try {
      // Security check: Only allow admins to impersonate
      const adminRoles = ['management', 'admin']
      if (!adminRoles.includes(originalAdmin.role)) {
        console.error('🎭 [useImpersonation] Unauthorized impersonation attempt:', {
          adminRole: originalAdmin.role,
          targetUser: targetUser.email
        })
        return false
      }

      // Security check: Don't allow impersonating other admins (unless you're company_owner)
      if (adminRoles.includes(targetUser.role) && originalAdmin.role !== 'management') {
        console.error('🎭 [useImpersonation] Cannot impersonate admin user:', {
          adminRole: originalAdmin.role,
          targetRole: targetUser.role
        })
        return false
      }

      // Don't allow self-impersonation
      if (originalAdmin.id === targetUser.id) {
        console.warn('🎭 [useImpersonation] Cannot impersonate self')
        return false
      }

      const newState: ImpersonationState = {
        originalAdmin,
        impersonatedUser: targetUser,
        timestamp: Date.now()
      }

      sessionStorage.setItem(IMPERSONATION_KEY, JSON.stringify(newState))
      setImpersonationState(newState)

      console.log('🎭 [useImpersonation] Started impersonation:', {
        originalAdmin: originalAdmin.email,
        impersonatedUser: targetUser.email,
        targetRole: targetUser.role
      })

      return true
    } catch (error) {
      console.error('🎭 [useImpersonation] Error starting impersonation:', error)
      return false
    }
  }, [])

  // Stop impersonating and return to original admin
  const stopImpersonation = useCallback((): boolean => {
    try {
      if (!impersonationState) {
        console.warn('🎭 [useImpersonation] No active impersonation to stop')
        return false
      }

      console.log('🎭 [useImpersonation] Stopping impersonation:', {
        originalAdmin: impersonationState.originalAdmin.email,
        impersonatedUser: impersonationState.impersonatedUser.email
      })

      sessionStorage.removeItem(IMPERSONATION_KEY)
      setImpersonationState(null)
      return true
    } catch (error) {
      console.error('🎭 [useImpersonation] Error stopping impersonation:', error)
      return false
    }
  }, [impersonationState])

  // Check if currently impersonating
  const isImpersonating = Boolean(impersonationState)

  // Get the current effective user (impersonated user or null)
  const impersonatedUser = impersonationState?.impersonatedUser || null

  // Get the original admin user
  const originalAdmin = impersonationState?.originalAdmin || null

  // Check if user can impersonate others
  const canImpersonate = useCallback((userRole: string): boolean => {
    return ['management', 'admin'].includes(userRole)
  }, [])

  // Get impersonation info for display
  const getImpersonationInfo = useCallback(() => {
    if (!impersonationState) return null

    return {
      originalAdminName: `${impersonationState.originalAdmin.first_name} ${impersonationState.originalAdmin.last_name}`,
      originalAdminEmail: impersonationState.originalAdmin.email,
      impersonatedUserName: `${impersonationState.impersonatedUser.first_name} ${impersonationState.impersonatedUser.last_name}`,
      impersonatedUserEmail: impersonationState.impersonatedUser.email,
      impersonatedUserRole: impersonationState.impersonatedUser.role,
      startTime: new Date(impersonationState.timestamp),
      remainingTime: IMPERSONATION_TIMEOUT - (Date.now() - impersonationState.timestamp)
    }
  }, [impersonationState])

  return {
    // State
    isImpersonating,
    impersonatedUser,
    originalAdmin,
    isLoading,
    
    // Actions
    impersonateUser,
    stopImpersonation,
    
    // Utilities
    canImpersonate,
    getImpersonationInfo
  }
}

/**
 * Enhanced Impersonation hook using advanced API query patterns
 * This demonstrates the optimized approach with intelligent caching and validation
 */
export function useImpersonationAdvanced() {
  const [impersonationState, setImpersonationState] = useState<ImpersonationState | null>(null)

  // Use advanced API query for admin validation
  const {
    data: adminValidation,
    loading: validationLoading,
    error: validationError,
    refetch: validateAdmin
  } = useAdvancedApiQuery<{ canImpersonate: boolean; adminLevel: string }>({
    queryKey: ['admin-validation', impersonationState?.originalAdmin?.id],
    queryFn: async () => {
      if (!impersonationState?.originalAdmin) return { canImpersonate: false, adminLevel: 'none' }

      const response = await fetch('/api/admin/validate-impersonation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: impersonationState.originalAdmin.id })
      })

      if (!response.ok) throw new Error('Failed to validate admin permissions')

      return response.json()
    },
    enabled: !!impersonationState?.originalAdmin,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false
  })

  // Enhanced impersonation state management
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(IMPERSONATION_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.originalAdmin && parsed.impersonatedUser) {
          setImpersonationState(parsed)
        }
      }
    } catch (error) {
      console.error('🎭 [useImpersonationAdvanced] Error loading state:', error)
      sessionStorage.removeItem(IMPERSONATION_KEY)
    }
  }, [])

  // Enhanced start impersonation with validation
  const startImpersonationAdvanced = useCallback(async (originalAdmin: UserProfile, targetUser: UserProfile) => {
    try {
      // Validate admin permissions first
      await validateAdmin()

      if (!adminValidation?.canImpersonate) {
        throw new Error('Insufficient permissions for impersonation')
      }

      const newState: ImpersonationState = {
        originalAdmin,
        impersonatedUser: targetUser,
        startedAt: new Date().toISOString()
      }

      sessionStorage.setItem(IMPERSONATION_KEY, JSON.stringify(newState))
      setImpersonationState(newState)

      return true
    } catch (error) {
      console.error('🎭 [useImpersonationAdvanced] Error starting impersonation:', error)
      return false
    }
  }, [adminValidation, validateAdmin])

  // Enhanced stop impersonation
  const stopImpersonationAdvanced = useCallback(async () => {
    try {
      sessionStorage.removeItem(IMPERSONATION_KEY)
      setImpersonationState(null)
      return true
    } catch (error) {
      console.error('🎭 [useImpersonationAdvanced] Error stopping impersonation:', error)
      return false
    }
  }, [])

  return {
    // State
    isImpersonating: !!impersonationState,
    impersonatedUser: impersonationState?.impersonatedUser || null,
    originalAdmin: impersonationState?.originalAdmin || null,

    // Loading states
    loading: validationLoading,
    validationError,

    // Actions
    startImpersonation: startImpersonationAdvanced,
    stopImpersonation: stopImpersonationAdvanced,

    // Enhanced utilities
    canImpersonate: adminValidation?.canImpersonate || false,
    adminLevel: adminValidation?.adminLevel || 'none',

    // Validation
    validateAdmin
  }
}