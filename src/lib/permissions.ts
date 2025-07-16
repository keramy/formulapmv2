import { UserRole } from '@/types/database'

export const PERMISSIONS = {
  // Project Management
  'projects.create': ['company_owner', 'general_manager', 'deputy_general_manager', 'project_manager', 'admin'],
  'projects.read.all': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin'],
  'projects.read.assigned': ['project_manager', 'architect', 'technical_engineer', 'purchase_director', 'purchase_specialist'],
  'projects.read.own': ['client', 'field_worker'],
  'projects.update': ['company_owner', 'general_manager', 'deputy_general_manager', 'project_manager', 'admin'],
  'projects.delete': ['company_owner', 'general_manager', 'admin'],
  'projects.archive': ['company_owner', 'general_manager', 'deputy_general_manager', 'project_manager', 'admin'],

  // Scope Management
  'scope.create': ['project_manager', 'technical_engineer', 'deputy_general_manager'],
  'scope.read.full': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'technical_engineer'],
  'scope.read.limited': ['architect', 'field_worker'],
  'scope.update': ['project_manager', 'technical_engineer'],
  'scope.pricing.set': ['technical_engineer', 'project_manager'],
  'scope.supplier.assign': ['purchase_director', 'purchase_specialist'],
  'scope.prices.view': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'purchase_director', 'purchase_specialist', 'technical_engineer'],

  // Document Management
  'documents.create': ['project_manager', 'architect', 'technical_engineer', 'field_worker'],
  'documents.read': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'architect', 'technical_engineer', 'field_worker', 'purchase_director', 'purchase_specialist'],
  'documents.read.all': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin'],
  'documents.read.project': ['project_manager', 'architect', 'technical_engineer', 'field_worker', 'purchase_director', 'purchase_specialist'],
  'documents.read.client_visible': ['client'],
  'documents.update': ['project_manager', 'architect', 'technical_engineer'],
  'documents.delete': ['project_manager', 'technical_director', 'general_manager', 'admin'],
  'documents.version.manage': ['project_manager', 'architect'],
  
  // Document Approval Workflow
  'documents.view': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'architect', 'technical_engineer', 'field_worker', 'purchase_director', 'purchase_specialist', 'client'],
  'documents.manage': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager'],
  'documents.approve': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'architect', 'technical_engineer', 'client'],
  'documents.approve.internal': ['project_manager', 'technical_director', 'general_manager'],
  'documents.approve.client': ['client'],

  // Shop Drawing Permissions (V3)
  'shop_drawings.create': ['architect', 'project_manager', 'company_owner', 'general_manager', 'technical_director', 'admin'],
  'shop_drawings.read': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'architect', 'technical_engineer', 'field_worker', 'client'],
  'shop_drawings.update': ['architect', 'project_manager', 'company_owner', 'general_manager', 'technical_director', 'admin'],
  'shop_drawings.delete': ['architect', 'project_manager', 'technical_director', 'admin'],
  'shop_drawings.review': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'architect', 'client'],
  'shop_drawings.approve': ['architect', 'project_manager', 'general_manager', 'deputy_general_manager', 'technical_director', 'client'],

  // Report Creation Permissions (V3)
  'reports.create': ['project_manager', 'architect', 'technical_engineer', 'field_worker'],
  'reports.read': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'architect', 'technical_engineer', 'field_worker', 'client'],
  'reports.update': ['project_manager', 'architect', 'technical_engineer', 'field_worker', 'company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin'],
  'reports.delete': ['project_manager', 'technical_director', 'general_manager', 'admin'],
  'reports.publish': ['project_manager', 'general_manager', 'deputy_general_manager', 'company_owner'],
  'reports.generate_pdf': ['project_manager', 'architect', 'technical_engineer', 'field_worker'],
  'reports.share': ['project_manager', 'general_manager', 'deputy_general_manager', 'company_owner'],

  // Purchase & Supplier Permissions
  'suppliers.create': ['purchase_director', 'purchase_specialist'],
  'suppliers.read': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'purchase_director', 'purchase_specialist'],
  'suppliers.approve': ['general_manager', 'deputy_general_manager'],
  'suppliers.evaluate': ['purchase_director', 'purchase_specialist', 'project_manager'],
  'suppliers.select.scope': ['purchase_director', 'purchase_specialist'],
  'payments.view': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'purchase_director'],
  'payments.track': ['purchase_director', 'purchase_specialist'],

  // Purchase Department Workflow Permissions
  'purchase.requests.create': ['project_manager', 'technical_engineer', 'field_worker', 'purchase_director', 'purchase_specialist'],
  'purchase.requests.read': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'technical_engineer', 'field_worker', 'purchase_director', 'purchase_specialist'],
  'purchase.requests.update': ['project_manager', 'technical_engineer', 'purchase_director', 'purchase_specialist'],
  'purchase.requests.delete': ['project_manager', 'purchase_director', 'purchase_specialist'],
  'purchase.requests.approve': ['project_manager', 'general_manager', 'deputy_general_manager', 'purchase_director'],
  'purchase.requests.emergency': ['project_manager', 'general_manager', 'deputy_general_manager', 'purchase_director'],
  
  'purchase.orders.create': ['purchase_director', 'purchase_specialist'],
  'purchase.orders.read': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'purchase_director', 'purchase_specialist'],
  'purchase.orders.update': ['purchase_director', 'purchase_specialist'],
  'purchase.orders.delete': ['purchase_director', 'general_manager', 'deputy_general_manager'],
  'purchase.orders.send': ['purchase_director', 'purchase_specialist'],
  'purchase.orders.confirm': ['purchase_director', 'purchase_specialist'],
  
  'purchase.vendors.create': ['purchase_director', 'purchase_specialist'],
  'purchase.vendors.read': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'purchase_director', 'purchase_specialist'],
  'purchase.vendors.update': ['purchase_director', 'purchase_specialist'],
  'purchase.vendors.rate': ['project_manager', 'purchase_director', 'purchase_specialist'],
  'purchase.vendors.approve': ['general_manager', 'deputy_general_manager', 'purchase_director'],
  
  'purchase.approvals.view': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'purchase_director', 'purchase_specialist'],
  'purchase.approvals.process': ['project_manager', 'general_manager', 'deputy_general_manager', 'purchase_director'],
  'purchase.approvals.delegate': ['project_manager', 'general_manager', 'deputy_general_manager', 'purchase_director'],
  
  'purchase.deliveries.confirm': ['field_worker', 'project_manager', 'technical_engineer', 'purchase_director', 'purchase_specialist'],
  'purchase.deliveries.reject': ['field_worker', 'project_manager', 'technical_engineer', 'purchase_director', 'purchase_specialist'],
  'purchase.deliveries.view': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'technical_engineer', 'field_worker', 'purchase_director', 'purchase_specialist'],
  
  'purchase.financials.view': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'purchase_director'],
  'purchase.reports.view': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'purchase_director', 'purchase_specialist'],

  // Reporting Permissions
  'reports.create.internal': ['project_manager', 'architect', 'technical_engineer'],
  'reports.create.client': ['project_manager'],
  'reports.create.field': ['field_worker'],
  'reports.read.all': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin'],
  'reports.read.project': ['project_manager', 'architect', 'technical_engineer'],
  'reports.read.own': ['field_worker', 'client'],
  'reports.approve': ['project_manager', 'general_manager'],

  // Task Management Permissions
  'tasks.create': ['deputy_general_manager', 'project_manager', 'technical_director'],
  'tasks.assign': ['deputy_general_manager', 'project_manager'],
  'tasks.read.all': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin'],
  'tasks.read.assigned': ['project_manager', 'architect', 'technical_engineer', 'field_worker'],
  'tasks.update.status': ['project_manager', 'architect', 'technical_engineer', 'field_worker'],
  'tasks.approve': ['project_manager', 'deputy_general_manager'],

  // User Management Permissions
  'users.create': ['company_owner', 'general_manager', 'admin'],
  'users.read.all': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin'],
  'users.read.team': ['project_manager'],
  'users.update': ['company_owner', 'general_manager', 'admin'],
  'users.deactivate': ['company_owner', 'general_manager', 'admin'],
  'users.roles.assign': ['company_owner', 'admin'],

  // Global Navigation Permissions
  'dashboard.view': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'architect', 'technical_engineer', 'purchase_director', 'purchase_specialist', 'field_worker', 'client'],
  'tasks.view': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'architect', 'technical_engineer', 'field_worker'],
  'tasks.manage_all': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin'],
  'scope.view': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'architect', 'technical_engineer', 'purchase_director', 'purchase_specialist'],
  'shop_drawings.view_all': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'architect', 'technical_engineer'],
  'clients.view': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager'],
  'clients.manage': ['company_owner', 'general_manager', 'deputy_general_manager', 'admin'],
  'procurement.view': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'purchase_director', 'purchase_specialist'],
  'procurement.manage': ['purchase_director', 'purchase_specialist'],
  'procurement.approve': ['company_owner', 'general_manager', 'deputy_general_manager'],

  // Financial Data
  'financials.view': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'purchase_director'],
  'budgets.approve': ['company_owner', 'general_manager', 'deputy_general_manager'],

  // System Administration
  'system.admin': ['company_owner', 'admin'],
  'system.settings': ['company_owner', 'general_manager', 'admin'],

  // Client Portal Permissions - External Client Access
  'client_portal.access': ['client'],
  'client_portal.dashboard.view': ['client'],
  'client_portal.projects.view': ['client'],
  'client_portal.documents.view': ['client'],
  'client_portal.documents.download': ['client'],
  'client_portal.documents.comment': ['client'],
  'client_portal.documents.approve': ['client'],
  'client_portal.communications.view': ['client'],
  'client_portal.communications.create': ['client'],
  'client_portal.communications.reply': ['client'],
  'client_portal.notifications.view': ['client'],
  'client_portal.notifications.manage': ['client'],
  'client_portal.profile.view': ['client'],
  'client_portal.profile.update': ['client'],

  // Client Portal Administration - Internal Management
  'client_portal.admin.view': ['company_owner', 'general_manager', 'deputy_general_manager', 'admin'],
  'client_portal.admin.manage_users': ['company_owner', 'general_manager', 'admin'],
  'client_portal.admin.manage_companies': ['company_owner', 'general_manager', 'admin'],
  'client_portal.admin.manage_access': ['company_owner', 'general_manager', 'deputy_general_manager', 'project_manager', 'admin'],
  'client_portal.admin.manage_permissions': ['company_owner', 'general_manager', 'admin'],
  'client_portal.admin.view_analytics': ['company_owner', 'general_manager', 'deputy_general_manager', 'project_manager', 'admin'],
  'client_portal.admin.manage_branding': ['company_owner', 'general_manager', 'admin'],

  // ============================================================================
  // V3 REPORTS SYSTEM PERMISSIONS
  // ============================================================================

  // Reports - Core CRUD Operations
  'reports.read': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'project_manager', 'architect', 'technical_engineer', 'purchase_director', 'admin'],
  'reports.create': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'project_manager', 'architect', 'technical_engineer', 'admin'],
  'reports.update': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'project_manager', 'architect', 'technical_engineer', 'admin'],
  'reports.delete': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin'],

  // Reports - Advanced Operations
  'reports.generate_pdf': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'project_manager', 'architect', 'technical_engineer', 'admin'],
  'reports.publish': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'project_manager', 'admin'],
  'reports.share': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'project_manager', 'admin'],

  // Report Lines - Content Management
  'reports.lines.create': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'project_manager', 'architect', 'technical_engineer', 'admin'],
  'reports.lines.update': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'project_manager', 'architect', 'technical_engineer', 'admin'],
  'reports.lines.delete': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'project_manager', 'architect', 'technical_engineer', 'admin'],

  // Report Photos - Media Management
  'reports.photos.upload': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'project_manager', 'architect', 'technical_engineer', 'admin'],
  'reports.photos.delete': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'project_manager', 'architect', 'technical_engineer', 'admin'],

} as const

export type Permission = keyof typeof PERMISSIONS

export const hasPermission = (userRole: UserRole, permission: Permission): boolean => {
  return (PERMISSIONS[permission] as readonly UserRole[])?.includes(userRole) ?? false
}

export const getUserPermissions = (userRole: UserRole): Permission[] => {
  return Object.keys(PERMISSIONS).filter(permission => 
    hasPermission(userRole, permission as Permission)
  ) as Permission[]
}

export const isManagementRole = (userRole: UserRole): boolean => {
  return ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin'].includes(userRole)
}

export const isProjectRole = (userRole: UserRole): boolean => {
  return ['project_manager', 'architect', 'technical_engineer'].includes(userRole)
}

export const isPurchaseRole = (userRole: UserRole): boolean => {
  return ['purchase_director', 'purchase_specialist'].includes(userRole)
}

export const isFieldRole = (userRole: UserRole): boolean => {
  return ['field_worker'].includes(userRole)
}

export const isExternalRole = (userRole: UserRole): boolean => {
  return ['client'].includes(userRole)
}

// Role hierarchy for permission inheritance
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  'company_owner': 100,
  'general_manager': 90,
  'deputy_general_manager': 80,
  'technical_director': 70,
  'admin': 65,
  'project_manager': 60,
  'purchase_director': 55,
  'architect': 50,
  'technical_engineer': 45,
  'purchase_specialist': 40,
  'field_worker': 30,
  'client': 10
}

export const hasHigherRole = (userRole: UserRole, comparedRole: UserRole): boolean => {
  return ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[comparedRole]
}

export const canManageUser = (managerRole: UserRole, targetRole: UserRole): boolean => {
  // Only owners and admins can manage other owners and admins
  if (['company_owner', 'admin'].includes(targetRole)) {
    return ['company_owner', 'admin'].includes(managerRole)
  }
  
  // Management roles can manage lower roles
  return hasHigherRole(managerRole, targetRole)
}