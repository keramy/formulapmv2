// User and Authentication Types
export type UserRole = 
  | 'company_owner'
  | 'general_manager'
  | 'deputy_general_manager'
  | 'technical_director'
  | 'admin'
  | 'project_manager'
  | 'architect'
  | 'technical_engineer'
  | 'purchase_director'
  | 'purchase_specialist'
  | 'field_worker'
  | 'client'

export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  user_id: string
  first_name: string
  last_name: string
  role: UserRole
  phone?: string
  avatar_url?: string
  department?: string
  company_id?: string
  created_at: string
  updated_at: string
}

// Project Types
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Project {
  id: string
  name: string
  description: string
  status: ProjectStatus
  priority: ProjectPriority
  progress: number
  start_date: string
  end_date: string
  budget?: number
  actual_cost?: number
  project_manager_id: string
  client_id: string
  company_id: string
  created_at: string
  updated_at: string

  // Relations
  project_manager?: UserProfile
  client?: Client
  team_members?: ProjectMember[]
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: string
  permissions: string[]
  joined_at: string

  // Relations
  user?: UserProfile
}

// Client Types
export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  contact_person?: string
  company_id: string
  created_at: string
  updated_at: string
}

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
  placeholder?: string
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
  role: UserRole
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