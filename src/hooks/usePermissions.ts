import { useMemo } from 'react'
'use client'

import { useAuth } from './useAuth'
import { hasPermission as checkUserPermission, getUserPermissions, Permission, isManagementRole, isProjectRole, isPurchaseRole, isTechnicalRole, isExternalRole, hasHigherRole, canManageUser } from '@/lib/permissions'
import { UserRole } from '@/types/auth'

export const usePermissions = () => {
  const { profile } = useAuth()

  const checkPermission = (permission: Permission): boolean => {
    if (!profile) return false
    return checkUserPermission(profile.role, permission)
  }

  // Direct permission function export for compatibility
  const hasPermission = (permission: Permission): boolean => {
    return checkPermission(permission)
  }

  const canAccessProject = (projectId?: string): boolean => {
    if (!profile) return false
    
    // Management can access all projects
    if (isManagementRole(profile.role)) {
      return true
    }
    
    // Other roles need to be assigned to the project
    // For project-level access, use project hooks for actual assignment checking
    if (!projectId) {
      return isProjectRole(profile.role) || isPurchaseRole(profile.role) || isTechnicalRole(profile.role)
    }
    
    // For specific project access, this should be checked via the project hooks
    // which have access to the actual project assignment data
    return isProjectRole(profile.role) || isPurchaseRole(profile.role) || isTechnicalRole(profile.role)
  }

  // Helper function for checking if user can access certain role-based features
  const canAccess = (roles: string[]): boolean => {
    if (!profile) return false
    return roles.includes(profile.role)
  }

  const canViewPricing = (): boolean => {
    return checkPermission('scope.prices.view')
  }

  const canCreateProject = (): boolean => {
    return checkPermission('projects.create')
  }

  const canReadAllProjects = (): boolean => {
    return checkPermission('projects.read.all')
  }

  const canReadAssignedProjects = (): boolean => {
    return checkPermission('projects.read.assigned')
  }

  const canReadOwnProjects = (): boolean => {
    return checkPermission('projects.read.own')
  }

  const canUpdateProjects = (): boolean => {
    return checkPermission('projects.update')
  }

  const canDeleteProjects = (): boolean => {
    return checkPermission('projects.delete')
  }

  const canArchiveProjects = (): boolean => {
    return checkPermission('projects.archive')
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
    return checkPermission('tasks.read.all')
  }

  const canComment = (): boolean => {
    return checkPermission('tasks.view') // Use tasks.view permission for commenting
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
    return checkPermission('shop_drawings.approve')
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

  // Purchase Department Permissions
  const canCreatePurchaseRequests = (): boolean => {
    return checkPermission('purchase.requests.create')
  }

  const canViewPurchaseRequests = (): boolean => {
    return checkPermission('purchase.requests.read')
  }

  const canUpdatePurchaseRequests = (): boolean => {
    return checkPermission('purchase.requests.update')
  }

  const canDeletePurchaseRequests = (): boolean => {
    return checkPermission('purchase.requests.delete')
  }

  const canApprovePurchaseRequests = (): boolean => {
    return checkPermission('purchase.requests.approve')
  }

  const canCreatePurchaseOrders = (): boolean => {
    return checkPermission('purchase.orders.create')
  }

  const canViewPurchaseOrders = (): boolean => {
    return checkPermission('purchase.orders.read')
  }

  const canUpdatePurchaseOrders = (): boolean => {
    return checkPermission('purchase.orders.update')
  }

  const canSendPurchaseOrders = (): boolean => {
    return checkPermission('purchase.orders.send')
  }

  const canManagePurchaseVendors = (): boolean => {
    return checkPermission('purchase.vendors.create') && checkPermission('purchase.vendors.update')
  }

  const canViewPurchaseVendors = (): boolean => {
    return checkPermission('purchase.vendors.read')
  }

  const canRatePurchaseVendors = (): boolean => {
    return checkPermission('purchase.vendors.rate')
  }

  const canViewPurchaseApprovals = (): boolean => {
    return checkPermission('purchase.approvals.view')
  }

  const canProcessPurchaseApprovals = (): boolean => {
    return checkPermission('purchase.approvals.process')
  }

  const canConfirmPurchaseDeliveries = (): boolean => {
    return checkPermission('purchase.deliveries.confirm')
  }

  const canViewPurchaseDeliveries = (): boolean => {
    return checkPermission('purchase.deliveries.view')
  }

  const canViewPurchaseFinancials = (): boolean => {
    return checkPermission('purchase.financials.view')
  }

  const canViewPurchaseReports = (): boolean => {
    return checkPermission('purchase.reports.view')
  }

  const canViewReports = (): boolean => {
    return checkPermission('reports.read.all') || 
           checkPermission('reports.read.project') || 
           checkPermission('reports.read.own')
  }

  const canCreateReports = (): boolean => {
    return checkPermission('projects.update') || 
           checkPermission('reports.create.client') || 
           checkPermission('projects.read.assigned')
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
    return checkPermission('projects.update') || 
           checkPermission('documents.approve.client')
  }

  // Client Portal Permissions - External Client Access
  const canAccessClientPortal = (): boolean => {
    return checkPermission('client_portal.access')
  }

  const canViewClientPortalDashboard = (): boolean => {
    return checkPermission('client_portal.dashboard.view')
  }

  const canViewClientPortalProjects = (): boolean => {
    return checkPermission('client_portal.projects.view')
  }

  const canViewClientPortalDocuments = (): boolean => {
    return checkPermission('client_portal.documents.view')
  }

  const canDownloadClientPortalDocuments = (): boolean => {
    return checkPermission('client_portal.documents.download')
  }

  const canCommentClientPortalDocuments = (): boolean => {
    return checkPermission('client_portal.admin.manage')
  }

  const canApproveClientPortalDocuments = (): boolean => {
    return checkPermission('client_portal.documents.approve')
  }

  const canViewClientPortalCommunications = (): boolean => {
    return checkPermission('client_portal.admin.manage')
  }

  const canCreateClientPortalCommunications = (): boolean => {
    return checkPermission('client_portal.admin.manage')
  }

  const canReplyClientPortalCommunications = (): boolean => {
    return checkPermission('client_portal.admin.manage')
  }

  const canViewClientPortalNotifications = (): boolean => {
    return checkPermission('client_portal.admin.manage')
  }

  const canManageClientPortalNotifications = (): boolean => {
    return checkPermission('client_portal.admin.manage')
  }

  const canViewClientPortalProfile = (): boolean => {
    return checkPermission('client_portal.profile.view')
  }

  const canUpdateClientPortalProfile = (): boolean => {
    return checkPermission('client_portal.profile.update')
  }

  // Client Portal Administration - Internal Management
  const canViewClientPortalAdmin = (): boolean => {
    return checkPermission('client_portal.admin.view')
  }

  const canManageClientPortalUsers = (): boolean => {
    return checkPermission('client_portal.admin.manage')
  }

  const canManageClientPortalCompanies = (): boolean => {
    return checkPermission('client_portal.admin.manage')
  }

  const canManageClientPortalAccess = (): boolean => {
    return checkPermission('client_portal.admin.manage')
  }

  const canManageClientPortalPermissions = (): boolean => {
    return checkPermission('client_portal.admin.manage')
  }

  const canViewClientPortalAnalytics = (): boolean => {
    return checkPermission('client_portal.admin.manage')
  }

  const canManageClientPortalBranding = (): boolean => {
    return checkPermission('client_portal.admin.manage')
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
    return isTechnicalRole(profile.role)
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
    if (canViewPurchaseRequests()) navItems.push('purchase')
    if (canViewReports()) navItems.push('reports')
    if (canViewDocuments()) navItems.push('documents')
    if (canAccessSystemSettings()) navItems.push('settings')

    return navItems
  }

  return {
    // Permission checking
    hasPermission,
    checkPermission,
    
    // Project access
    canAccessProject,
    canAccess,
    canViewPricing,
    canCreateProject,
    canReadAllProjects,
    canReadAssignedProjects,
    canReadOwnProjects,
    canUpdateProjects,
    canDeleteProjects,
    canArchiveProjects,
    
    // Suppliers and procurement
    canApproveSuppliers,
    canViewProcurement,
    canManageProcurement,
    canApproveProcurement,
    
    // Purchase Department
    canCreatePurchaseRequests,
    canViewPurchaseRequests,
    canUpdatePurchaseRequests,
    canDeletePurchaseRequests,
    canApprovePurchaseRequests,
    canCreatePurchaseOrders,
    canViewPurchaseOrders,
    canUpdatePurchaseOrders,
    canSendPurchaseOrders,
    canManagePurchaseVendors,
    canViewPurchaseVendors,
    canRatePurchaseVendors,
    canViewPurchaseApprovals,
    canProcessPurchaseApprovals,
    canConfirmPurchaseDeliveries,
    canViewPurchaseDeliveries,
    canViewPurchaseFinancials,
    canViewPurchaseReports,
    
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
    canComment,
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
    
    // Client Portal - External Client Access
    canAccessClientPortal,
    canViewClientPortalDashboard,
    canViewClientPortalProjects,
    canViewClientPortalDocuments,
    canDownloadClientPortalDocuments,
    canCommentClientPortalDocuments,
    canApproveClientPortalDocuments,
    canViewClientPortalCommunications,
    canCreateClientPortalCommunications,
    canReplyClientPortalCommunications,
    canViewClientPortalNotifications,
    canManageClientPortalNotifications,
    canViewClientPortalProfile,
    canUpdateClientPortalProfile,
    
    // Client Portal Administration - Internal Management
    canViewClientPortalAdmin,
    canManageClientPortalUsers,
    canManageClientPortalCompanies,
    canManageClientPortalAccess,
    canManageClientPortalPermissions,
    canViewClientPortalAnalytics,
    canManageClientPortalBranding,
    
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