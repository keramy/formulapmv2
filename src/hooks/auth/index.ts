/**
 * Auth-related hooks for role checking and PM seniority management
 * 
 * These hooks provide focused, reusable logic for handling user roles
 * and project manager seniority levels throughout the application.
 */

// Role checking hooks
export { useRoleChecks, hasRoleType, getRoleTypes, hasAnyRoleType } from './useRoleChecks'
export type { RoleCheckResults } from './useRoleChecks'

// PM seniority hooks
export { 
  usePMSeniority, 
  canApproveShopDrawings, 
  filterPMsBySeniority, 
  sortPMsBySeniority 
} from './usePMSeniority'
export type { PMSeniorityResults, PMSeniorityActions } from './usePMSeniority'