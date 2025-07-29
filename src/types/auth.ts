import { User as SupabaseUser } from '@supabase/supabase-js'

// New optimized 5-role structure (down from 13 roles)
export type UserRole = 
  | 'management'        // Owner + GM + Deputy GM (unified oversight)
  | 'purchase_manager'  // Purchase Director + Specialist (unified operations)
  | 'technical_lead'    // Technical Director (enhanced with scope management)
  | 'project_manager'   // PM + Architect + Engineer + Field Worker (unified coordination)
  | 'client'           // Client (simplified read-only access)
  | 'admin'            // System admin (unchanged)

// Legacy role type for migration compatibility (deprecated - migration complete)
export type LegacyUserRole = 
  | 'management'        // Migrated from: management, management, management
  | 'technical_lead'    // Migrated from: technical_lead
  | 'project_manager'   // Migrated from: project_manager, project_manager, project_manager
  | 'purchase_manager'  // Migrated from: purchase_manager, purchase_manager
  | 'client'           // Unchanged
  | 'admin'            // Unchanged

// PM hierarchy levels (only for project_manager role)
export type SeniorityLevel = 
  | 'executive'    // Executive Project Manager - highest PM level, can approve all shop drawings
  | 'senior'       // Senior Project Manager - can approve shop drawings
  | 'regular'      // Regular Project Manager - cannot approve shop drawings

// Approval limits structure
export interface ApprovalLimits {
  budget?: number | 'unlimited'
  scope_changes?: 'none' | 'minor' | 'major' | 'all'
  timeline_extensions?: number | 'unlimited'
  resource_allocation?: 'none' | 'limited' | 'full' | 'unlimited'
  vendor_management?: 'none' | 'assigned' | 'all'
  purchase_orders?: 'none' | 'standard' | 'unlimited'
  subcontractor_assignment?: 'none' | 'assigned' | 'all'
  technical_specs?: 'none' | 'assigned_projects' | 'all'
  document_approval?: 'none' | 'assigned_projects' | 'all'
  report_access?: 'none' | 'assigned_projects' | 'all'
}

// Re-export Supabase User as our User type
export interface User extends SupabaseUser {
  // Add any custom user properties here if needed
}

export interface UserProfile {
  id: string
  role: UserRole
  first_name: string
  last_name: string
  email: string
  phone?: string
  company?: string
  department?: string
  avatar_url?: string
  permissions: Record<string, boolean>
  is_active: boolean
  created_at: string
  updated_at: string
  
  // PM hierarchy (only for project_manager role)
  seniority_level?: SeniorityLevel // Only used when role === 'project_manager'
  dashboard_preferences?: DashboardPreferences
  previous_role?: LegacyUserRole
  role_migrated_at?: string
}

// Dashboard preferences for management oversight
export interface DashboardPreferences {
  dashboardAccess?: string[]
  specialPermissions?: string[]
  defaultView?: 'company_overview' | 'pm_workload' | 'project_list' | 'approval_pipeline'
  notifications?: {
    email?: boolean
    inApp?: boolean
    approvalAlerts?: boolean
    performanceAlerts?: boolean
  }
}

// Subcontractor entity (no longer a user role)
export interface Subcontractor {
  id: string
  name: string
  company?: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  specialties: string[]
  hourly_rate?: number
  daily_rate?: number
  contract_terms?: string
  performance_rating: number
  total_assignments: number
  completed_assignments: number
  total_payments: number
  availability_status: 'available' | 'busy' | 'unavailable'
  preferred_project_types?: string[]
  certifications?: string[]
  insurance_info?: Record<string, any>
  emergency_contact?: Record<string, any>
  notes?: string
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

// Subcontractor assignment tracking
export interface SubcontractorAssignment {
  id: string
  subcontractor_id: string
  scope_item_id: string
  project_id: string
  assigned_by: string
  assignment_type: 'task' | 'consultation' | 'full_scope'
  
  // Pricing and time tracking
  agreed_rate?: number
  rate_type: 'hourly' | 'daily' | 'fixed'
  estimated_hours?: number
  actual_hours: number
  estimated_cost?: number
  actual_cost: number
  
  // Timeline
  start_date?: string
  end_date?: string
  actual_start_date?: string
  actual_end_date?: string
  
  // Status and progress
  status: 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'
  progress_percentage: number
  quality_rating?: number
  
  // Documentation
  work_description?: string
  completion_notes?: string
  issues_encountered?: string
  photos?: string[]
  documents?: string[]
  
  // Approval and sign-off
  work_approved_by?: string
  work_approved_at?: string
  payment_approved_by?: string
  payment_approved_at?: string
  payment_status: 'pending' | 'approved' | 'paid'
  
  created_at: string
  updated_at: string
}

// PM hierarchy approval requests
export interface ApprovalRequest {
  id: string
  request_type: 'budget' | 'scope_change' | 'timeline_extension' | 'resource_request'
  project_id?: string
  scope_item_id?: string
  
  // Request details
  requested_by: string
  request_title: string
  request_description?: string
  request_data?: Record<string, any>
  requested_amount?: number
  
  // Approval chain
  current_approver?: string
  approval_chain?: string[]
  approval_level: number
  
  // Status and timeline
  status: 'pending' | 'approved' | 'rejected' | 'escalated' | 'cancelled'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  due_date?: string
  
  // Approval details
  approved_by?: string
  approved_at?: string
  approval_notes?: string
  rejection_reason?: string
  escalation_reason?: string
  
  // Audit trail
  approval_history?: Array<{
    timestamp: string
    action: string
    old_status?: string
    new_status?: string
    changed_by?: string
    notes?: string
  }>
  
  created_at: string
  updated_at: string
}

export interface AuthContextType {
  user: SupabaseUser | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData extends LoginCredentials {
  first_name: string
  last_name: string
  role: UserRole
  phone?: string
  company?: string
  department?: string
}

export interface ResetPasswordData {
  email: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface AuthError {
  code: string
  message: string
  timestamp: number
  retryCount: number
  category: 'AUTH' | 'NETWORK' | 'PROFILE' | 'TOKEN' | 'CIRCUIT_BREAKER'
  isRecoverable: boolean
}