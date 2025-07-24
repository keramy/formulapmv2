import { useMemo } from 'react'
import { UserRole, SeniorityLevel, ApprovalLimits } from '@/types/auth'

// OPTIMIZED PERMISSIONS FOR 5-ROLE STRUCTURE (down from 13 roles)
export const PERMISSIONS = {
  // Project Management - Simplified for 5 roles
  'projects.create': ['management', 'project_manager', 'admin'],
  'projects.read.all': ['management', 'admin'],
  'projects.read.assigned': ['project_manager', 'technical_lead', 'purchase_manager'],
  'projects.read.own': ['client'],
  'projects.update': ['management', 'project_manager', 'admin'],
  'projects.delete': ['management', 'admin'],
  'projects.archive': ['management', 'project_manager', 'admin'],

  // Scope Management - Unified under project_manager and technical_lead
  'scope.create': ['management', 'project_manager', 'technical_lead', 'admin'],
  'scope.read.full': ['management', 'technical_lead', 'purchase_manager', 'admin'],
  'scope.read.assigned': ['project_manager'],
  'scope.read.limited': ['client'],
  'scope.update': ['management', 'project_manager', 'technical_lead', 'admin'],
  'scope.pricing.set': ['management', 'technical_lead', 'purchase_manager', 'admin'],
  'scope.upload': ['technical_lead'], // Key feature for technical leads
  'scope.prices.view': ['management', 'technical_lead', 'purchase_manager', 'admin'],

  // Subcontractor Management - New entity-based system
  'subcontractors.create': ['management', 'technical_lead', 'admin'],
  'subcontractors.read': ['management', 'technical_lead', 'project_manager', 'purchase_manager', 'admin'],
  'subcontractors.update': ['management', 'technical_lead', 'admin'],
  'subcontractors.assign': ['technical_lead', 'project_manager'], // Key workflow
  'subcontractors.rate': ['management', 'technical_lead', 'project_manager', 'admin'],
  'subcontractors.payments.view': ['management', 'technical_lead', 'purchase_manager', 'admin'],

  // Document Management - Simplified
  'documents.create': ['management', 'project_manager', 'technical_lead', 'admin'],
  'documents.read.all': ['management', 'admin'],
  'documents.read.project': ['project_manager', 'technical_lead', 'purchase_manager'],
  'documents.read.client_visible': ['client'],
  'documents.update': ['management', 'project_manager', 'technical_lead', 'admin'],
  'documents.delete': ['management', 'admin'],
  'documents.approve': ['management', 'project_manager', 'technical_lead', 'client', 'admin'],
  'documents.approve.client': ['client'],

  // Shop Drawing Permissions - Under project_manager (was project_manager)
  'shop_drawings.create': ['project_manager', 'technical_lead'],
  'shop_drawings.edit': ['project_manager', 'technical_lead'],
  'shop_drawings.delete': ['management', 'project_manager', 'technical_lead', 'admin'],
  'shop_drawings.view': ['management', 'project_manager', 'technical_lead', 'client', 'admin'],
  'shop_drawings.approve': ['management', 'project_manager', 'technical_lead', 'client', 'admin'],
  'shop_drawings.approve.client': ['client'],

  // Purchase & Supplier Permissions - Unified under purchase_manager
  'suppliers.create': ['management', 'purchase_manager', 'admin'],
  'suppliers.read': ['management', 'technical_lead', 'project_manager', 'purchase_manager', 'admin'],
  'suppliers.approve': ['management', 'purchase_manager', 'admin'],
  'suppliers.evaluate': ['purchase_manager', 'project_manager', 'technical_lead'],
  'suppliers.select.scope': ['purchase_manager', 'technical_lead'],
  'payments.view': ['management', 'purchase_manager', 'admin'],
  'payments.track': ['purchase_manager'],

  // Purchase Department Workflow - Simplified
  'purchase.requests.create': ['project_manager', 'technical_lead', 'purchase_manager'],
  'purchase.requests.read': ['management', 'project_manager', 'technical_lead', 'purchase_manager', 'admin'],
  'purchase.requests.update': ['project_manager', 'technical_lead', 'purchase_manager'],
  'purchase.requests.delete': ['management', 'purchase_manager', 'admin'],
  'purchase.requests.approve': ['management', 'purchase_manager', 'admin'], // With hierarchy
  
  'purchase.orders.create': ['purchase_manager'],
  'purchase.orders.read': ['management', 'project_manager', 'technical_lead', 'purchase_manager', 'admin'],
  'purchase.orders.update': ['purchase_manager'],
  'purchase.orders.delete': ['management', 'purchase_manager', 'admin'],
  'purchase.orders.send': ['purchase_manager'],
  'purchase.orders.confirm': ['purchase_manager'],
  
  'purchase.vendors.create': ['purchase_manager'],
  'purchase.vendors.read': ['management', 'project_manager', 'technical_lead', 'purchase_manager', 'admin'],
  'purchase.vendors.update': ['purchase_manager'],
  'purchase.vendors.rate': ['project_manager', 'technical_lead', 'purchase_manager'],
  'purchase.vendors.approve': ['management', 'purchase_manager', 'admin'],
  
  'purchase.approvals.view': ['management', 'project_manager', 'technical_lead', 'purchase_manager', 'admin'],
  'purchase.approvals.process': ['management', 'purchase_manager', 'admin'], // With PM hierarchy
  'purchase.approvals.delegate': ['management', 'purchase_manager', 'admin'],
  
  'purchase.deliveries.confirm': ['project_manager', 'technical_lead', 'purchase_manager'],
  'purchase.deliveries.reject': ['project_manager', 'technical_lead', 'purchase_manager'],
  'purchase.deliveries.view': ['management', 'project_manager', 'technical_lead', 'purchase_manager', 'admin'],
  
  'purchase.financials.view': ['management', 'purchase_manager', 'admin'],
  'purchase.reports.view': ['management', 'project_manager', 'technical_lead', 'purchase_manager', 'admin'],

  // Reporting Permissions - Unified under project_manager
  'reports.create': ['management', 'project_manager', 'technical_lead', 'admin'],
  'reports.create.client': ['project_manager'],
  'reports.read.all': ['management', 'admin'],
  'reports.read.project': ['project_manager', 'technical_lead', 'purchase_manager'],
  'reports.read.own': ['client'],
  'reports.approve': ['management', 'project_manager', 'admin'],
  'reports.generate': ['management', 'project_manager', 'technical_lead', 'admin'], // PDF generation

  // Task Management - Simplified
  'tasks.create': ['management', 'project_manager', 'technical_lead', 'admin'],
  'tasks.assign': ['management', 'project_manager', 'admin'],
  'tasks.read.all': ['management', 'admin'],
  'tasks.read.assigned': ['project_manager', 'technical_lead'],
  'tasks.update.status': ['project_manager', 'technical_lead'],
  'tasks.approve': ['management', 'project_manager', 'admin'], // With hierarchy

  // User Management
  'users.create': ['management', 'admin'],
  'users.read.all': ['management', 'admin'],
  'users.read.team': ['project_manager', 'technical_lead'],
  'users.update': ['management', 'admin'],
  'users.deactivate': ['management', 'admin'],
  'users.roles.assign': ['management', 'admin'],

  // PM Hierarchy & Management Oversight - NEW FEATURES
  'management.dashboard.view': ['management', 'admin'],
  'management.pm_workload.view': ['management', 'admin'],
  'management.pm_workload.manage': ['management', 'admin'],
  'management.approvals.override': ['management', 'admin'],
  'management.projects.reassign': ['management', 'admin'],
  'management.resources.allocate': ['management', 'admin'],
  
  'approvals.create': ['project_manager', 'technical_lead', 'purchase_manager'],
  'approvals.process.senior': ['project_manager'], // Senior PMs only
  'approvals.process.management': ['management', 'admin'],
  'approvals.view.own': ['project_manager', 'technical_lead', 'purchase_manager'],
  'approvals.view.all': ['management', 'admin'],

  // Global Navigation - Simplified
  'dashboard.view': ['management', 'project_manager', 'technical_lead', 'purchase_manager', 'client', 'admin'],
  'tasks.view': ['management', 'project_manager', 'technical_lead', 'admin'],
  'scope.view': ['management', 'project_manager', 'technical_lead', 'purchase_manager', 'admin'],
  'shop_drawings.view_all': ['management', 'project_manager', 'technical_lead', 'admin'],
  'clients.view': ['management', 'project_manager', 'admin'],
  'clients.manage': ['management', 'admin'],
  'procurement.view': ['management', 'project_manager', 'technical_lead', 'purchase_manager', 'admin'],
  'procurement.manage': ['purchase_manager'],
  'procurement.approve': ['management', 'admin'],

  // Financial Data - Cost visibility control
  'financials.view': ['management', 'technical_lead', 'purchase_manager', 'admin'],
  'budgets.approve': ['management', 'admin'],
  'costs.view.full': ['management', 'technical_lead', 'purchase_manager', 'admin'],
  'costs.view.limited': ['project_manager'], // Based on seniority level

  // System Administration
  'system.admin': ['admin'],
  'system.settings': ['management', 'admin'],

  // Client Portal - Simplified
  'client_portal.access': ['client'],
  'client_portal.dashboard.view': ['client'],
  'client_portal.projects.view': ['client'],
  'client_portal.documents.view': ['client'],
  'client_portal.documents.download': ['client'],
  'client_portal.documents.approve': ['client'],
  'client_portal.reports.view': ['client'], // Key feature
  'client_portal.progress.view': ['client'], // Key feature
  'client_portal.profile.view': ['client'],
  'client_portal.profile.update': ['client'],

  // Client Portal Administration
  'client_portal.admin.view': ['management', 'admin'],
  'client_portal.admin.manage': ['management', 'admin'],

} as const

export type Permission = keyof typeof PERMISSIONS

// SIMPLIFIED PERMISSION CHECKING
export const hasPermission = (userRole: UserRole, permission: Permission, seniorityLevel?: SeniorityLevel): boolean => {
  const allowedRoles = PERMISSIONS[permission] as readonly UserRole[]
  
  if (!allowedRoles?.includes(userRole)) {
    return false
  }
  
  // Special cases for PM hierarchy
  if (permission === 'approvals.process.senior' && userRole === 'project_manager') {
    return seniorityLevel === 'senior'
  }
  
  if (permission === 'costs.view.full' && userRole === 'project_manager') {
    return seniorityLevel === 'senior'
  }
  
  return true
}

// Enhanced permission checking with approval limits
export const hasPermissionWithLimits = (
  userRole: UserRole, 
  permission: Permission, 
  seniorityLevel?: SeniorityLevel,
  approvalLimits?: ApprovalLimits,
  requestAmount?: number
): boolean => {
  if (!hasPermission(userRole, permission, seniorityLevel)) {
    return false
  }
  
  // Check approval limits for budget-related permissions
  if (permission.includes('approve') && requestAmount && approvalLimits?.budget) {
    if (approvalLimits.budget === 'unlimited') {
      return true
    }
    if (typeof approvalLimits.budget === 'number') {
      return requestAmount <= approvalLimits.budget
    }
  }
  
  return true
}

export const getUserPermissions = (userRole: UserRole, seniorityLevel?: SeniorityLevel): Permission[] => {
  return Object.keys(PERMISSIONS).filter(permission => 
    hasPermission(userRole, permission as Permission, seniorityLevel)
  ) as Permission[]
}

// SIMPLIFIED ROLE CHECKING FUNCTIONS
export const isManagementRole = (userRole: UserRole): boolean => {
  return userRole === 'management' || userRole === 'admin'
}

export const isProjectRole = (userRole: UserRole): boolean => {
  return userRole === 'project_manager'
}

export const isTechnicalRole = (userRole: UserRole): boolean => {
  return userRole === 'technical_lead'
}

export const isPurchaseRole = (userRole: UserRole): boolean => {
  return userRole === 'purchase_manager'
}

export const isExternalRole = (userRole: UserRole): boolean => {
  return userRole === 'client'
}

export const hasCostAccess = (userRole: UserRole, seniorityLevel?: SeniorityLevel): boolean => {
  if (['management', 'technical_lead', 'purchase_manager', 'admin'].includes(userRole)) {
    return true
  }
  
  // Senior project managers have cost access
  if (userRole === 'project_manager' && seniorityLevel === 'senior') {
    return true
  }
  
  return false
}

// SIMPLIFIED ROLE HIERARCHY (5 roles instead of 13)
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  'management': 100,    // Highest level - company oversight
  'admin': 95,          // System administration
  'technical_lead': 80, // Technical oversight and scope management
  'purchase_manager': 70, // Purchase operations
  'project_manager': 60, // Project coordination (with seniority levels)
  client: 10          // External read-only access
}

export const hasHigherRole = (userRole: UserRole, comparedRole: UserRole): boolean => {
  return ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[comparedRole]
}

export const canManageUser = (managerRole: UserRole, targetRole: UserRole): boolean => {
  // Only management and admin can manage other management and admin
  if (['management', 'admin'].includes(targetRole)) {
    return ['management', 'admin'].includes(managerRole)
  }
  
  // Management roles can manage lower roles
  return hasHigherRole(managerRole, targetRole)
}

// PM HIERARCHY FUNCTIONS
export const canApproveRequest = (
  approverRole: UserRole,
  approverSeniority: SeniorityLevel | undefined,
  requestAmount: number,
  approvalLimits?: ApprovalLimits
): boolean => {
  // Management can approve anything
  if (approverRole === 'management' || approverRole === 'admin') {
    return true
  }
  
  // Check approval limits
  if (approvalLimits?.budget) {
    if (approvalLimits.budget === 'unlimited') {
      return true
    }
    if (typeof approvalLimits.budget === 'number') {
      return requestAmount <= approvalLimits.budget
    }
  }
  
  // Default limits based on role and seniority
  const defaultLimits = getDefaultApprovalLimits(approverRole, approverSeniority)
  if (typeof defaultLimits.budget === 'number') {
    return requestAmount <= defaultLimits.budget
  }
  
  return false
}

export const getDefaultApprovalLimits = (role: UserRole, seniorityLevel?: SeniorityLevel): ApprovalLimits => {
  switch (role) {
    case 'management':
      return {
        budget: 'unlimited',
        scope_changes: 'all',
        timeline_extensions: 'unlimited',
        resource_allocation: 'unlimited'
      }
    
    case 'technical_lead':
      return {
        budget: 75000,
        scope_changes: 'all',
        timeline_extensions: 'unlimited',
        subcontractor_assignment: 'all'
      }
    
    case 'purchase_manager':
      return {
        budget: seniorityLevel === 'senior' ? 100000 : 25000,
        vendor_management: 'all',
        purchase_orders: 'unlimited'
      }
    
    case 'project_manager':
      return {
        budget: seniorityLevel === 'senior' ? 50000 : 15000,
        scope_changes: seniorityLevel === 'senior' ? 'major' : 'minor',
        timeline_extensions: seniorityLevel === 'senior' ? 30 : 7
      }
    
    case 'client':
      return {
        document_approval: 'assigned_projects',
        report_access: 'assigned_projects'
      }
    
    default:
      return {}
  }
}

// APPROVAL CHAIN FUNCTIONS
export const getApprovalChain = (
  requestType: 'budget' | 'scope_change' | 'timeline_extension' | 'resource_request',
  requestAmount?: number,
  requesterRole?: UserRole,
  requesterSeniority?: SeniorityLevel
): UserRole[] => {
  switch (requestType) {
    case 'budget':
      if (!requestAmount) return ['management']
      
      if (requestAmount <= 15000) {
        return requesterSeniority === 'senior' ? [] : ['project_manager'] // Senior PM can approve
      } else if (requestAmount <= 50000) {
        return ['project_manager'] // Senior PM approval needed
      } else {
        return ['project_manager', 'management'] // Senior PM → Management
      }
    
    case 'scope_change':
      return ['project_manager', 'management']
    
    case 'timeline_extension':
      return ['project_manager', 'management']
    
    case 'resource_request':
      return ['project_manager', 'management']
    
    default:
      return ['management']
  }
}