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
  | 'subcontractor'

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

// Task Types
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  due_date?: string
  project_id: string
  assigned_to: string[]
  created_by: string
  created_at: string
  updated_at: string

  // Relations
  project?: Project
  assignees?: UserProfile[]
  creator?: UserProfile
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

// Document Types
export type DocumentType = 'drawing' | 'specification' | 'contract' | 'report' | 'photo' | 'other'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'revision_requested'

export interface Document {
  id: string
  name: string
  file_path: string
  file_size: number
  file_type: string
  document_type: DocumentType
  project_id: string
  uploaded_by: string
  requires_approval: boolean
  approval_status?: ApprovalStatus
  created_at: string
  updated_at: string

  // Relations
  project?: Project
  uploader?: UserProfile
  approvals?: DocumentApproval[]
}

export interface DocumentApproval {
  id: string
  document_id: string
  approver_id: string
  status: ApprovalStatus
  comments?: string
  approved_at?: string
  created_at: string

  // Relations
  document?: Document
  approver?: UserProfile
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
  | 'dashboard.view'
  | 'projects.view'
  | 'projects.create'
  | 'projects.edit'
  | 'projects.delete'
  | 'tasks.view'
  | 'tasks.create'
  | 'tasks.edit'
  | 'tasks.delete'
  | 'scope.view'
  | 'scope.create'
  | 'scope.edit'
  | 'scope.delete'
  | 'drawings.view'
  | 'drawings.upload'
  | 'drawings.approve'
  | 'clients.view'
  | 'clients.create'
  | 'clients.edit'
  | 'procurement.view'
  | 'procurement.create'
  | 'procurement.edit'
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'reports.view'
  | 'reports.create'
  | 'settings.view'
  | 'settings.edit'

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