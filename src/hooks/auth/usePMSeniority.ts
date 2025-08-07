'use client'

import { useMemo, useCallback } from 'react'
import { UserProfile, SeniorityLevel } from '@/types/auth'
import { getSeniorityFromProfile } from '@/lib/seniority-utils'

/**
 * Seniority level hierarchy with numeric values for comparison
 * Higher numbers indicate higher seniority levels
 */
const SENIORITY_LEVELS = {
  regular: 1,
  senior: 2,
  executive: 3
} as const

export interface PMSeniorityInterface {
  seniority: SeniorityLevel | null
  isPM: boolean
  hasSeniority: boolean
  isRegularPM: boolean
  isSeniorPM: boolean
  isExecutivePM: boolean
  seniorityLevel: number
  displayName: string
  canApproveShopDrawings: boolean
  getSeniority: () => SeniorityLevel | null
  isPMWithSeniority: (requiredLevel?: SeniorityLevel) => boolean
  canPerformAction: (requiredLevel: SeniorityLevel) => boolean
  compareSeniority: (otherLevel: SeniorityLevel) => 'higher' | 'equal' | 'lower' | 'not_pm'
  hasMinimumSeniority: (minimumLevel: SeniorityLevel) => boolean
}

/**
 * Specialized hook for PM seniority logic and hierarchy management
 * 
 * @param profile - UserProfile to analyze for PM seniority
 * @returns Object with seniority information and comparison methods
 * 
 * @example
 * ```typescript
 * const { seniority, isPMWithSeniority, canPerformAction } = usePMSeniority(userProfile)
 * 
 * if (isPMWithSeniority('senior')) {
 *   // Show senior PM features
 * }
 * 
 * if (canPerformAction('executive')) {
 *   // Show executive PM actions
 * }
 * ```
 */
export const usePMSeniority = (profile: UserProfile | null): PMSeniorityInterface => {
  // Memoized seniority analysis
  const seniorityInfo = useMemo(() => {
    if (!profile) {
      return {
        seniority: null,
        isPM: false,
        hasSeniority: false,
        isRegularPM: false,
        isSeniorPM: false,
        isExecutivePM: false,
        seniorityLevel: 0,
        displayName: '',
        canApproveShopDrawings: false
      }
    }

    const isPM = profile.role === 'project_manager'
    const seniority = isPM ? getSeniorityFromProfile(profile) : null
    const hasSeniority = !!seniority
    const seniorityLevel = seniority ? SENIORITY_LEVELS[seniority] : 0

    return {
      seniority,
      isPM,
      hasSeniority,
      isRegularPM: seniority === 'regular',
      isSeniorPM: seniority === 'senior',
      isExecutivePM: seniority === 'executive',
      seniorityLevel,
      displayName: getSeniorityDisplayName(seniority),
      canApproveShopDrawings: seniority === 'senior' || seniority === 'executive'
    }
  }, [profile])

  // Memoized action functions
  const getSeniority = useCallback(() => {
    return seniorityInfo.seniority
  }, [seniorityInfo.seniority])

  const isPMWithSeniority = useCallback((requiredLevel?: SeniorityLevel) => {
    if (!seniorityInfo.isPM || !seniorityInfo.hasSeniority) {
      return false
    }

    if (!requiredLevel) {
      return seniorityInfo.hasSeniority
    }

    const requiredLevelValue = SENIORITY_LEVELS[requiredLevel]
    return seniorityInfo.seniorityLevel >= requiredLevelValue
  }, [seniorityInfo.isPM, seniorityInfo.hasSeniority, seniorityInfo.seniorityLevel])

  const canPerformAction = useCallback((requiredLevel: SeniorityLevel) => {
    if (!seniorityInfo.isPM || !seniorityInfo.hasSeniority) {
      return false
    }

    const requiredLevelValue = SENIORITY_LEVELS[requiredLevel]
    return seniorityInfo.seniorityLevel >= requiredLevelValue
  }, [seniorityInfo.isPM, seniorityInfo.hasSeniority, seniorityInfo.seniorityLevel])

  const compareSeniority = useCallback((otherLevel: SeniorityLevel): 'higher' | 'equal' | 'lower' | 'not_pm' => {
    if (!seniorityInfo.isPM || !seniorityInfo.hasSeniority) {
      return 'not_pm'
    }

    const currentLevel = seniorityInfo.seniorityLevel
    const otherLevelValue = SENIORITY_LEVELS[otherLevel]

    if (currentLevel > otherLevelValue) return 'higher'
    if (currentLevel === otherLevelValue) return 'equal'
    return 'lower'
  }, [seniorityInfo.isPM, seniorityInfo.hasSeniority, seniorityInfo.seniorityLevel])

  const hasMinimumSeniority = useCallback((minimumLevel: SeniorityLevel) => {
    if (!seniorityInfo.isPM || !seniorityInfo.hasSeniority) {
      return false
    }

    const minimumLevelValue = SENIORITY_LEVELS[minimumLevel]
    return seniorityInfo.seniorityLevel >= minimumLevelValue
  }, [seniorityInfo.isPM, seniorityInfo.hasSeniority, seniorityInfo.seniorityLevel])

  return {
    ...seniorityInfo,
    getSeniority,
    isPMWithSeniority,
    canPerformAction,
    compareSeniority,
    hasMinimumSeniority
  }
}

/**
 * Utility function to get display name for seniority level
 * 
 * @param seniority - SeniorityLevel to get display name for
 * @returns Formatted display name
 */
const getSeniorityDisplayName = (seniority?: SeniorityLevel): string => {
  switch (seniority) {
    case 'executive':
      return 'Executive PM'
    case 'senior':
      return 'Senior PM'
    case 'regular':
      return 'Project Manager'
    default:
      return ''
  }
}

/**
 * Utility function to check if a profile can approve shop drawings
 * 
 * @param profile - UserProfile to check
 * @returns boolean indicating if the profile can approve shop drawings
 */
export const canApproveShopDrawings = (profile: UserProfile | null): boolean => {
  if (!profile || profile.role !== 'project_manager') {
    return false
  }

  const seniority = getSeniorityFromProfile(profile)
  return seniority === 'senior' || seniority === 'executive'
}

/**
 * Utility function to get all PMs with minimum seniority level
 * 
 * @param profiles - Array of UserProfiles to filter
 * @param minimumLevel - Minimum seniority level required
 * @returns Array of profiles that are PMs with at least the minimum seniority
 */
export const filterPMsBySeniority = (
  profiles: UserProfile[],
  minimumLevel: SeniorityLevel
): UserProfile[] => {
  const minimumLevelValue = SENIORITY_LEVELS[minimumLevel]

  return profiles.filter(profile => {
    if (profile.role !== 'project_manager') return false

    const seniority = getSeniorityFromProfile(profile)
    if (!seniority) return false

    const profileLevel = SENIORITY_LEVELS[seniority]
    return profileLevel >= minimumLevelValue
  })
}

/**
 * Utility function to sort PMs by seniority level (highest first)
 * 
 * @param profiles - Array of UserProfiles to sort
 * @returns Array of profiles sorted by seniority level (executive > senior > regular)
 */
export const sortPMsBySeniority = (profiles: UserProfile[]): UserProfile[] => {
  return profiles
    .filter(profile => profile.role === 'project_manager')
    .sort((a, b) => {
      const seniorityA = getSeniorityFromProfile(a)
      const seniorityB = getSeniorityFromProfile(b)

      if (!seniorityA && !seniorityB) return 0
      if (!seniorityA) return 1
      if (!seniorityB) return -1

      const levelA = SENIORITY_LEVELS[seniorityA]
      const levelB = SENIORITY_LEVELS[seniorityB]

      return levelB - levelA // Descending order (highest first)
    })
}