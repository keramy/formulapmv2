import { UserProfile, SeniorityLevel } from '@/types/auth'

/**
 * Utility functions for handling PM seniority levels
 * Uses permissions field as temporary storage until database column is added
 */

export const getSeniorityFromProfile = (profile: UserProfile): SeniorityLevel | undefined => {
  // Only PMs have seniority
  if (profile.role !== 'project_manager') {
    return undefined
  }

  // Check if seniority is stored in profile directly
  if (profile.seniority_level) {
    return profile.seniority_level
  }

  // Fallback: check permissions field for temporary storage
  if (profile.permissions?.seniority) {
    const seniority = profile.permissions.seniority as string
    if (['executive', 'senior', 'regular'].includes(seniority)) {
      return seniority as SeniorityLevel
    }
  }

  // Default to regular if no seniority set
  return 'regular'
}

export const setSeniorityInPermissions = (
  permissions: Record<string, any>, 
  seniority: SeniorityLevel
): Record<string, any> => {
  return {
    ...permissions,
    seniority
  }
}

export const canPMApproveShopDrawing = (seniority?: SeniorityLevel): boolean => {
  return seniority === 'senior' || seniority === 'executive'
}

export const getSeniorityDisplayName = (seniority?: SeniorityLevel): string => {
  switch (seniority) {
    case 'executive':
      return 'Executive PM'
    case 'senior':
      return 'Senior PM'
    case 'regular':
      return 'Project Manager'
    default:
      return 'Project Manager'
  }
}

export const getSeniorityDescription = (seniority?: SeniorityLevel): string => {
  switch (seniority) {
    case 'executive':
      return 'Highest PM level - can approve all shop drawings and manage other PMs'
    case 'senior':
      return 'Senior level - can approve shop drawings and mentor junior PMs'
    case 'regular':
      return 'Standard level - focuses on project coordination'
    default:
      return 'Standard project manager role'
  }
}