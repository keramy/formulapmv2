/**
 * Formula PM 2.0 Type Definitions Index
 * 
 * Central export point for all TypeScript type definitions
 * Exports from individual type files to avoid duplication
 */

// Authentication Types
export * from './auth'

// Project Types  
export * from './projects'

// Scope Management Types
export * from './scope'

// Material Specifications Types
export * from './material-specs'

// Note: database.ts types are included via individual type files to avoid conflicts

// Re-export commonly used types for convenience
export type { UserRole, User, UserProfile } from './auth'
export type { Project, ProjectStatus } from './projects'
export type { ScopeItem, ScopeCategory, ScopeStatus } from './scope'
export type { MaterialSpec, MaterialStatus, MaterialPriority } from './material-specs'

// Navigation Types
export interface NavigationItem {
  id: string
  label: string
  href: string
  icon: string
  permission: string
  badge?: () => Promise<number>
  description?: string
  children?: NavigationItem[]
}

// Form Types
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'select' | 'textarea' | 'date' | 'number' | 'file'
  implementation?: string
  required?: boolean
  options?: { value: string; label: string }[]
  validation?: {
    required?: string
    minLength?: { value: number; message: string }
    maxLength?: { value: number; message: string }
    pattern?: { value: RegExp; message: string }
  }
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> {
  data: T[]
  count: number
  page: number
  limit: number
  totalPages: number
}

// Component Props Types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface LoadingState {
  isLoading: boolean
  error?: string | null
}

// Permission Types
export type Permission = 
  // Project Management
  | 'projects.create'
  | 'projects.read.all'
  | 'projects.read.assigned'
  | 'projects.read.own'
  | 'projects.update'
  | 'projects.delete'
  | 'projects.archive'
  
  // Scope Management
  | 'scope.create'
  | 'scope.read.full'
  | 'scope.read.limited'
  | 'scope.update'
  | 'scope.pricing.set'
  | 'scope.supplier.assign'
  | 'scope.prices.view'
  
  // User Management
  | 'users.create'
  | 'users.read.all'
  | 'users.read.limited'
  | 'users.update'
  | 'users.delete'
  | 'users.assign.projects'
  
  // Purchase Management
  | 'purchase.create'
  | 'purchase.read.all'
  | 'purchase.read.assigned'
  | 'purchase.update'
  | 'purchase.delete'
  | 'purchase.approve'
  | 'purchase.orders.create'
  | 'purchase.orders.approve'
  | 'purchase.deliveries.confirm'
  | 'purchase.invoices.process'
  | 'purchase.vendors.manage'
  
  // Financial Management
  | 'financials.view'
  | 'financials.edit'
  | 'financials.budgets.manage'
  | 'financials.costs.track'
  | 'financials.reports.generate'
  
  // Client Portal
  | 'client_portal.access'
  | 'client_portal.projects.view'
  | 'client_portal.documents.view'
  | 'client_portal.communications.access'
  | 'client_portal.notifications.receive'
  | 'client_portal.admin.manage_users'
  | 'client_portal.admin.manage_projects'
  | 'client_portal.admin.manage_communications'
  | 'client_portal.admin.manage_settings'
  | 'client_portal.admin.manage_branding'
  
  // System Administration
  | 'system.admin'
  | 'system.settings'
  | 'system.audit.view'

export interface RolePermissions {
  role: import('./auth').UserRole
  permissions: Permission[]
}

// Theme and Design Types
export type ThemeMode = 'light' | 'dark' | 'system'

export interface DesignSystemColors {
  primary: string
  secondary: string
  accent: string
  background: string
  foreground: string
  muted: string
  border: string
  input: string
  ring: string
  destructive: string
  management: string
  project: string
  technical: string
  purchase: string
  field: string
  client: string
  external: string
}