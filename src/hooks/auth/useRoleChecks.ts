'use client'

import { useMemo } from 'react'
import { UserProfile } from '@/types/auth'

/**
 * Role checking configuration for different user types
 */
const ROLE_CHECKS = {
  management: ['management', 'technical_lead', 'admin'] as const,
  project: ['project_manager'] as const,
  purchase: ['purchase_manager'] as const,
  field: ['project_manager'] as const,
  external: ['client'] as const
} as const

export interface RoleChecksInterface {
  isManagement: boolean
  isProjectRole: boolean
  isPurchaseRole: boolean
  isFieldRole: boolean
  isExternalRole: boolean
}

/**
 * Specialized hook for role checking logic
 * 
 * @param profile - UserProfile to check roles against
 * @returns Object with boolean flags for each role type
 * 
 * @example
 * ```typescript
 * const { isManagement, isProjectRole } = useRoleChecks(userProfile)
 * 
 * if (isManagement) {
 *   // Show management features
 * }
 * ```
 */
export const useRoleChecks = (profile: UserProfile | null): RoleChecksInterface => {
  const roleChecks = useMemo(() => {
    if (!profile) {
      return {
        isManagement: false,
        isProjectRole: false,
        isPurchaseRole: false,
        isFieldRole: false,
        isExternalRole: false
      }
    }

    return {
      // Management roles: management, technical_lead, admin
      isManagement: ROLE_CHECKS.management.includes(profile.role as any),
      
      // Project roles: project_manager
      isProjectRole: ROLE_CHECKS.project.includes(profile.role as any),
      
      // Purchase roles: purchase_manager
      isPurchaseRole: ROLE_CHECKS.purchase.includes(profile.role as any),
      
      // Field roles: project_manager (same as project for now)
      isFieldRole: ROLE_CHECKS.field.includes(profile.role as any),
      
      // External roles: client
      isExternalRole: ROLE_CHECKS.external.includes(profile.role as any)
    }
  }, [profile])

  return roleChecks
}

/**
 * Utility function to check if a profile has a specific role type
 * 
 * @param profile - UserProfile to check
 * @param roleType - Type of role to check
 * @returns boolean indicating if the profile has the specified role type
 */
export const hasRoleType = (
  profile: UserProfile | null, 
  roleType: keyof typeof ROLE_CHECKS
): boolean => {
  if (!profile) return false
  return ROLE_CHECKS[roleType].includes(profile.role as any)
}

/**
 * Utility function to get all role types for a profile
 * 
 * @param profile - UserProfile to analyze
 * @returns Array of role type strings that apply to the profile
 */
export const getRoleTypes = (profile: UserProfile | null): string[] => {
  if (!profile) return []
  
  const roleTypes: string[] = []
  
  Object.entries(ROLE_CHECKS).forEach(([roleType, roles]) => {
    if (roles.includes(profile.role as any)) {
      roleTypes.push(roleType)
    }
  })
  
  return roleTypes
}

/**
 * Utility function to check multiple role types at once
 * 
 * @param profile - UserProfile to check
 * @param roleTypes - Array of role types to check
 * @param requireAll - Whether all role types must match (AND) or any (OR)
 * @returns boolean indicating if the profile matches the role type criteria
 */
export const hasAnyRoleType = (
  profile: UserProfile | null,
  roleTypes: (keyof typeof ROLE_CHECKS)[],
  requireAll = false
): boolean => {
  if (!profile || roleTypes.length === 0) return false
  
  const matches = roleTypes.map(roleType => hasRoleType(profile, roleType))
  
  return requireAll ? matches.every(Boolean) : matches.some(Boolean)
}