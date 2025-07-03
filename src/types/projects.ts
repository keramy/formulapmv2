/**
 * Formula PM 2.0 Project Management Types
 * Wave 2 Business Logic Implementation
 * 
 * Comprehensive project management types that integrate with the Formula PM
 * database schema and authentication system.
 */

import { 
  Project as BaseProject, 
  ProjectStatus, 
  ProjectAssignment as BaseProjectAssignment,
  UserProfile,
  Client,
  ScopeItem,
  Document
} from '@/types/database'

// ============================================================================
// EXTENDED PROJECT TYPES
// ============================================================================

export interface ProjectFormData {
  // Basic Information
  name: string
  description?: string
  project_type?: string
  priority: number
  location?: string
  
  // Client & Assignment
  client_id?: string
  project_manager_id?: string
  
  // Timeline & Budget
  start_date?: string
  end_date?: string
  budget?: number
  
  // Team Assignments
  team_assignments: ProjectTeamAssignment[]
  
  // Workflow Settings
  approval_workflow_enabled?: boolean
  client_portal_enabled?: boolean
  mobile_reporting_enabled?: boolean
  
  // Template
  template_id?: string
  
  // Metadata
  metadata?: Record<string, any>
}

export interface ProjectTeamAssignment {
  user_id: string
  role: string
  responsibilities: string[]
  access_level: 'full' | 'limited' | 'read_only'
}

export interface ProjectTemplate {
  id: string
  name: string
  description: string
  project_type: string
  default_scope_categories: string[]
  default_team_roles: string[]
  default_workflows: string[]
  template_data: Partial<ProjectFormData>
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface ProjectWithDetails extends BaseProject {
  // Relations
  client?: Client
  project_manager?: UserProfile
  assignments?: ProjectAssignmentWithUser[]
  
  // Aggregated data
  scope_items_count?: number
  scope_items_completed?: number
  documents_count?: number
  team_size?: number
  progress_percentage?: number
  days_remaining?: number
  budget_used_percentage?: number
  
  // Recent activity
  recent_scope_items?: ScopeItem[]
  recent_documents?: Document[]
  pending_approvals_count?: number
}

export interface ProjectAssignmentWithUser extends BaseProjectAssignment {
  user?: UserProfile
}

export interface ProjectMetrics {
  total_projects: number
  active_projects: number
  completed_projects: number
  projects_on_hold: number
  planning_projects: number
  cancelled_projects: number
  total_budget: number
  total_actual_cost: number
  budget_variance: number
  average_completion_percentage: number
}

export interface ProjectStatistics {
  project_id: string
  total_scope_items: number
  completed_scope_items: number
  in_progress_scope_items: number
  blocked_scope_items: number
  total_documents: number
  pending_approvals: number
  team_members: number
  budget_utilization: number
  timeline_progress: number
  risk_factors: ProjectRiskFactor[]
}

export interface ProjectRiskFactor {
  type: 'budget' | 'timeline' | 'scope' | 'quality' | 'resource'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  impact: string
  mitigation?: string
}

// ============================================================================
// PROJECT FILTERS AND QUERIES
// ============================================================================

export interface ProjectFilters {
  status?: ProjectStatus[]
  client_id?: string
  project_manager_id?: string
  project_type?: string
  priority_min?: number
  priority_max?: number
  start_date_from?: string
  start_date_to?: string
  end_date_from?: string
  end_date_to?: string
  budget_min?: number
  budget_max?: number
  search?: string
  assigned_user_id?: string
  has_pending_approvals?: boolean
  created_by?: string
}

export interface ProjectSortOptions {
  field: 'name' | 'status' | 'priority' | 'start_date' | 'end_date' | 'budget' | 'progress' | 'created_at'
  direction: 'asc' | 'desc'
}

export interface ProjectListParams {
  page?: number
  limit?: number
  filters?: ProjectFilters
  sort?: ProjectSortOptions
  include_details?: boolean
}

// ============================================================================
// PROJECT OPERATIONS
// ============================================================================

export interface CreateProjectPayload {
  project_data: ProjectFormData
  initialize_structure?: boolean
  send_notifications?: boolean
}

export interface UpdateProjectPayload {
  project_data: Partial<ProjectFormData>
  update_assignments?: boolean
  notify_team?: boolean
}

export interface ProjectAssignmentPayload {
  assignments: ProjectTeamAssignment[]
  replace_existing?: boolean
  notify_assigned_users?: boolean
}

export interface ProjectStatusUpdate {
  status: ProjectStatus
  reason?: string
  notify_team?: boolean
  update_scope_items?: boolean
}

export interface ProjectBudgetUpdate {
  budget?: number
  actual_cost?: number
  reason?: string
  approval_required?: boolean
}

// ============================================================================
// PROJECT DASHBOARD & ANALYTICS
// ============================================================================

export interface ProjectDashboardData {
  project: ProjectWithDetails
  statistics: ProjectStatistics
  recent_activity: ProjectActivity[]
  upcoming_milestones: ProjectMilestone[]
  team_workload: TeamMemberWorkload[]
  budget_breakdown: BudgetBreakdown
  timeline_status: TimelineStatus
}

export interface ProjectActivity {
  id: string
  project_id: string
  type: 'scope_added' | 'scope_completed' | 'document_uploaded' | 'status_changed' | 'team_assigned' | 'budget_updated'
  description: string
  performed_by: string
  performed_by_user?: UserProfile
  metadata?: Record<string, any>
  created_at: string
}

export interface ProjectMilestone {
  id: string
  project_id: string
  title: string
  description?: string
  due_date: string
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  completion_percentage: number
  dependencies: string[]
  assigned_to: string[]
}

export interface TeamMemberWorkload {
  user_id: string
  user: UserProfile
  role: string
  assigned_scope_items: number
  completed_scope_items: number
  pending_tasks: number
  workload_percentage: number
  availability_status: 'available' | 'busy' | 'overloaded'
}

export interface BudgetBreakdown {
  total_budget: number
  allocated_budget: number
  spent_amount: number
  pending_amount: number
  remaining_budget: number
  variance: number
  categories: BudgetCategory[]
  forecast: BudgetForecast
}

export interface BudgetCategory {
  category: string
  allocated: number
  spent: number
  remaining: number
  percentage: number
}

export interface BudgetForecast {
  projected_total_cost: number
  projected_completion_date: string
  confidence_level: 'high' | 'medium' | 'low'
  risk_factors: string[]
}

export interface TimelineStatus {
  planned_start: string
  actual_start?: string
  planned_end: string
  projected_end: string
  current_phase: string
  completion_percentage: number
  days_ahead_behind: number
  critical_path_items: string[]
  bottlenecks: ProjectBottleneck[]
}

export interface ProjectBottleneck {
  type: 'resource' | 'dependency' | 'approval' | 'external'
  description: string
  impact_days: number
  resolution_plan?: string
  responsible_party?: string
}

// ============================================================================
// PROJECT TEMPLATES & INITIALIZATION
// ============================================================================

export interface ProjectInitializationOptions {
  create_default_scope_categories?: boolean
  setup_document_folders?: boolean
  assign_default_team_roles?: boolean
  enable_workflows?: boolean
  send_welcome_notifications?: boolean
  copy_from_template?: string
}

export interface DefaultScopeCategory {
  category: string
  title: string
  description: string
  estimated_hours?: number
  estimated_cost?: number
  priority: number
}

export interface ProjectWorkflow {
  id: string
  name: string
  description: string
  workflow_type: 'approval' | 'review' | 'notification' | 'automation'
  trigger_conditions: WorkflowTrigger[]
  actions: WorkflowAction[]
  is_active: boolean
}

export interface WorkflowTrigger {
  type: 'status_change' | 'date_reached' | 'document_uploaded' | 'scope_completed' | 'budget_threshold'
  conditions: Record<string, any>
}

export interface WorkflowAction {
  type: 'send_notification' | 'update_status' | 'assign_task' | 'create_document' | 'send_email'
  parameters: Record<string, any>
  delay_minutes?: number
}

// ============================================================================
// ACCESS CONTROL & PERMISSIONS
// ============================================================================

export interface ProjectAccessControl {
  project_id: string
  user_id: string
  access_level: 'owner' | 'manager' | 'member' | 'viewer' | 'client'
  permissions: ProjectPermission[]
  restrictions?: ProjectRestriction[]
  granted_by: string
  granted_at: string
  expires_at?: string
}

export type ProjectPermission = 
  | 'project.view'
  | 'project.edit'
  | 'project.delete'
  | 'project.manage_team'
  | 'project.view_budget'
  | 'project.edit_budget'
  | 'project.view_timeline'
  | 'project.edit_timeline'
  | 'project.view_scope'
  | 'project.edit_scope'
  | 'project.view_documents'
  | 'project.upload_documents'
  | 'project.approve_documents'
  | 'project.view_reports'
  | 'project.create_reports'
  | 'project.manage_settings'

export interface ProjectRestriction {
  type: 'scope_category' | 'document_type' | 'budget_limit' | 'timeline_period'
  value: string | number
  description?: string
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ProjectApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  metadata?: {
    total_count?: number
    page?: number
    limit?: number
    has_more?: boolean
  }
}

export type ProjectListResponse = ProjectApiResponse<{
  projects: ProjectWithDetails[]
  total_count: number
  page: number
  limit: number
  has_more: boolean
}>

export type ProjectDetailResponse = ProjectApiResponse<{
  project: ProjectWithDetails
  dashboard_data?: ProjectDashboardData
}>

export type ProjectMetricsResponse = ProjectApiResponse<{
  metrics: ProjectMetrics
  statistics: ProjectStatistics[]
}>

export type ProjectTemplatesResponse = ProjectApiResponse<{
  templates: ProjectTemplate[]
}>

// ============================================================================
// FORM VALIDATION TYPES
// ============================================================================

export interface ProjectValidationError {
  field: string
  message: string
  code: string
}

export interface ProjectValidationResult {
  is_valid: boolean
  errors: ProjectValidationError[]
  warnings?: string[]
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

// Role-based project access helper
export const getProjectAccessLevel = (userRole: string, assignment?: ProjectAssignmentWithUser): 'full' | 'limited' | 'read_only' | 'none' => {
  // Management roles get full access to all projects
  if (['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin'].includes(userRole)) {
    return 'full'
  }
  
  // Project managers get full access to assigned projects
  if (userRole === 'project_manager' && assignment) {
    return 'full'
  }
  
  // Other roles get access based on assignment
  if (assignment) {
    return assignment?.role === 'project_manager' ? 'full' : 'limited'
  }
  
  // External roles (client, subcontractor) get read-only for assigned projects
  if (['client', 'subcontractor'].includes(userRole) && assignment) {
    return 'read_only'
  }
  
  return 'none'
}

// Project status helpers
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: 'Planning',
  bidding: 'Bidding',
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled'
}

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  planning: 'blue',
  bidding: 'yellow',
  active: 'green',
  on_hold: 'orange',
  completed: 'gray',
  cancelled: 'red'
}

// Default project categories by type
export const DEFAULT_PROJECT_CATEGORIES = {
  commercial: ['construction', 'electrical', 'mechanical', 'millwork'],
  residential: ['construction', 'electrical', 'mechanical'],
  industrial: ['construction', 'electrical', 'mechanical'],
  renovation: ['construction', 'electrical', 'millwork'],
  tenant_improvement: ['construction', 'electrical', 'mechanical', 'millwork'],
  infrastructure: ['construction', 'electrical', 'mechanical']
}