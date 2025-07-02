'use client'

import { useAuth } from './useAuth'
import { hasPermission, getUserPermissions, Permission, isManagementRole, isProjectRole, isPurchaseRole, isFieldRole, isExternalRole, hasHigherRole, canManageUser } from '@/lib/permissions'
import { UserRole } from '@/types/auth'

export const usePermissions = () => {
  const { profile } = useAuth()

  const checkPermission = (permission: Permission): boolean => {
    if (!profile) return false
    return hasPermission(profile.role, permission)
  }

  const canAccessProject = (projectId?: string): boolean => {
    if (!profile) return false
    
    // Management can access all projects
    if (isManagementRole(profile.role)) {
      return true
    }
    
    // Other roles need to be assigned to the project
    // This would require a separate query to project_assignments
    // For now, return true for project roles when no projectId is provided
    if (!projectId) {
      return isProjectRole(profile.role) || isPurchaseRole(profile.role)
    }
    
    // TODO: Implement actual project assignment check
    return false
  }

  const canViewPricing = (): boolean => {
    return checkPermission('scope.prices.view')
  }

  const canCreateProject = (): boolean => {
    return checkPermission('projects.create')
  }

  const canApproveSuppliers = (): boolean => {
    return checkPermission('suppliers.approve')
  }

  const canManageUsers = (): boolean => {
    return checkPermission('users.create')
  }

  const canViewFinancials = (): boolean => {
    return checkPermission('financials.view')
  }

  const canApproveBudgets = (): boolean => {
    return checkPermission('budgets.approve')
  }

  const canAccessSystemSettings = (): boolean => {
    return checkPermission('system.settings')
  }

  const canAdministerSystem = (): boolean => {
    return checkPermission('system.admin')
  }

  // Global Navigation Permissions
  const canViewDashboard = (): boolean => {
    return checkPermission('dashboard.view')
  }

  const canViewTasks = (): boolean => {
    return checkPermission('tasks.view')
  }

  const canCreateTasks = (): boolean => {
    return checkPermission('tasks.create')
  }

  const canManageAllTasks = (): boolean => {
    return checkPermission('tasks.manage_all')
  }

  const canViewScope = (): boolean => {
    return checkPermission('scope.view')
  }

  const canEditScope = (): boolean => {
    return checkPermission('scope.update')
  }

  const canCreateScope = (): boolean => {
    return checkPermission('scope.create')
  }

  const canViewShopDrawings = (): boolean => {
    return checkPermission('shop_drawings.view_all')
  }

  const canCreateShopDrawings = (): boolean => {
    return checkPermission('shop_drawings.create')
  }

  const canEditShopDrawings = (): boolean => {
    return checkPermission('shop_drawings.edit')
  }

  const canApproveShopDrawings = (): boolean => {
    return checkPermission('shop_drawings.approve.internal')
  }

  const canViewClients = (): boolean => {
    return checkPermission('clients.view')
  }

  const canManageClients = (): boolean => {
    return checkPermission('clients.manage')
  }

  const canViewProcurement = (): boolean => {
    return checkPermission('procurement.view')
  }

  const canManageProcurement = (): boolean => {
    return checkPermission('procurement.manage')
  }

  const canApproveProcurement = (): boolean => {
    return checkPermission('procurement.approve')
  }

  const canViewReports = (): boolean => {
    return checkPermission('reports.read.all') || 
           checkPermission('reports.read.project') || 
           checkPermission('reports.read.own')
  }

  const canCreateReports = (): boolean => {
    return checkPermission('reports.create.internal') || 
           checkPermission('reports.create.client') || 
           checkPermission('reports.create.field')
  }

  const canViewDocuments = (): boolean => {
    return checkPermission('documents.read.all') || 
           checkPermission('documents.read.project') || 
           checkPermission('documents.read.client_visible')
  }

  const canCreateDocuments = (): boolean => {
    return checkPermission('documents.create')
  }

  const canApproveDocuments = (): boolean => {
    return checkPermission('documents.approve.internal') || 
           checkPermission('documents.approve.client')
  }

  // User Management Permissions
  const canCreateUsers = (): boolean => {
    return checkPermission('users.create')
  }

  const canViewAllUsers = (): boolean => {
    return checkPermission('users.read.all')
  }

  const canUpdateUsers = (): boolean => {
    return checkPermission('users.update')
  }

  const canDeactivateUsers = (): boolean => {
    return checkPermission('users.deactivate')
  }

  const canAssignRoles = (): boolean => {
    return checkPermission('users.roles.assign')
  }

  const canManageSpecificUser = (targetRole: UserRole): boolean => {
    if (!profile) return false
    return canManageUser(profile.role, targetRole)
  }

  // Role helpers
  const isManagement = (): boolean => {
    if (!profile) return false
    return isManagementRole(profile.role)
  }

  const isProject = (): boolean => {
    if (!profile) return false
    return isProjectRole(profile.role)
  }

  const isPurchase = (): boolean => {
    if (!profile) return false
    return isPurchaseRole(profile.role)
  }

  const isField = (): boolean => {
    if (!profile) return false
    return isFieldRole(profile.role)
  }

  const isExternal = (): boolean => {
    if (!profile) return false
    return isExternalRole(profile.role)
  }

  const hasHigherRoleThan = (comparedRole: UserRole): boolean => {
    if (!profile) return false
    return hasHigherRole(profile.role, comparedRole)
  }

  // Get all permissions for current user
  const allPermissions = profile ? getUserPermissions(profile.role) : []

  // Get user role
  const userRole = profile?.role || null

  // Navigation helpers - determine which navigation items should be visible
  const getVisibleNavItems = () => {
    const navItems = []

    if (canViewDashboard()) navItems.push('dashboard')
    if (canViewTasks()) navItems.push('tasks')
    if (canViewScope()) navItems.push('scope')
    if (canViewShopDrawings()) navItems.push('shop-drawings')
    if (canViewClients()) navItems.push('clients')
    if (canViewProcurement()) navItems.push('procurement')
    if (canViewReports()) navItems.push('reports')
    if (canViewDocuments()) navItems.push('documents')
    if (canAccessSystemSettings()) navItems.push('settings')

    return navItems
  }

  return {
    // Permission checking
    checkPermission,
    
    // Project access
    canAccessProject,
    canViewPricing,
    canCreateProject,
    
    // Suppliers and procurement
    canApproveSuppliers,
    canViewProcurement,
    canManageProcurement,
    canApproveProcurement,
    
    // User management
    canManageUsers,
    canCreateUsers,
    canViewAllUsers,
    canUpdateUsers,
    canDeactivateUsers,
    canAssignRoles,
    canManageSpecificUser,
    
    // Financial
    canViewFinancials,
    canApproveBudgets,
    
    // System
    canAccessSystemSettings,
    canAdministerSystem,
    
    // Navigation and features
    canViewDashboard,
    canViewTasks,
    canCreateTasks,
    canManageAllTasks,
    canViewScope,
    canEditScope,
    canCreateScope,
    canViewShopDrawings,
    canCreateShopDrawings,
    canEditShopDrawings,
    canApproveShopDrawings,
    canViewClients,
    canManageClients,
    canViewReports,
    canCreateReports,
    canViewDocuments,
    canCreateDocuments,
    canApproveDocuments,
    
    // Role helpers
    isManagement,
    isProject,
    isPurchase,
    isField,
    isExternal,
    hasHigherRoleThan,
    
    // Data
    allPermissions,
    userRole,
    
    // Navigation
    getVisibleNavItems
  }
}