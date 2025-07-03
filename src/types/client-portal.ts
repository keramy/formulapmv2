/**
 * Client Portal System Type Definitions
 * External client access types for Formula PM 2.0
 */

// ============================================================================
// Enums
// ============================================================================

export type ClientAccessLevel = 'view_only' | 'reviewer' | 'approver' | 'project_owner'
export type ClientCompanyType = 'individual' | 'corporation' | 'partnership' | 'government' | 'non_profit'
export type ClientProjectAccessLevel = 'viewer' | 'reviewer' | 'approver' | 'stakeholder'
export type ClientPermissionType = 'document_access' | 'project_access' | 'communication' | 'reporting' | 'financial'
export type ClientDocumentAccessType = 'view' | 'download' | 'comment' | 'approve'
export type ClientApprovalDecision = 'approved' | 'approved_with_conditions' | 'rejected' | 'requires_revision'
export type ClientCommentType = 'general' | 'revision_request' | 'question' | 'approval_condition' | 'concern'
export type ClientCommentStatus = 'open' | 'addressed' | 'resolved' | 'closed'
export type ClientPriority = 'low' | 'medium' | 'high' | 'urgent'
export type ClientNotificationType = 
  | 'document_submitted' 
  | 'approval_required' 
  | 'approval_received' 
  | 'project_milestone'
  | 'schedule_change' 
  | 'budget_update' 
  | 'quality_issue' 
  | 'delivery_notification'
  | 'message_received' 
  | 'system_announcement'
export type ClientDeliveryMethod = 'in_app' | 'email' | 'sms' | 'push'
export type ClientActivityType = 
  | 'login' 
  | 'logout' 
  | 'document_view' 
  | 'document_download' 
  | 'document_approve'
  | 'comment_add' 
  | 'message_send' 
  | 'project_access' 
  | 'profile_update'
export type ClientThreadType = 'general' | 'technical' | 'commercial' | 'quality' | 'schedule' | 'support'
export type ClientThreadStatus = 'open' | 'pending_response' | 'resolved' | 'closed'
export type ClientMessageType = 'text' | 'file' | 'image' | 'system'

// ============================================================================
// Core Interfaces
// ============================================================================

export interface ClientUser {
  id: string
  user_profile_id: string
  client_company_id: string
  access_level: ClientAccessLevel
  portal_access_enabled: boolean
  
  // Security & Authentication
  last_login?: Date
  login_attempts: number
  account_locked: boolean
  password_reset_required: boolean
  two_factor_enabled: boolean
  
  // Preferences
  notification_preferences: Record<string, any>
  language: string
  timezone: string
  theme: string
  
  // Tracking
  created_by: string
  created_at: Date
  updated_at: Date
  last_activity?: Date
  
  // Relations
  user_profile?: any
  client_company?: ClientCompany
}

export interface ClientCompany {
  id: string
  company_name: string
  company_type: ClientCompanyType
  contact_person?: string
  primary_email?: string
  primary_phone?: string
  address?: string
  billing_address?: string
  tax_id?: string
  is_active: boolean
  
  // Portal Branding
  logo_url?: string
  brand_colors?: Record<string, any>
  custom_domain?: string
  
  created_at: Date
  updated_at: Date
}

export interface ClientProjectAccess {
  id: string
  client_user_id: string
  project_id: string
  access_level: ClientProjectAccessLevel
  
  // Access Control
  can_view_financials: boolean
  can_approve_documents: boolean
  can_view_schedules: boolean
  can_access_reports: boolean
  
  // Restrictions
  restricted_areas: string[]
  access_start_date?: Date
  access_end_date?: Date
  
  // Tracking
  granted_by: string
  granted_at: Date
  last_accessed?: Date
  
  // Relations
  client_user?: ClientUser
  project?: any
}

export interface ClientPermission {
  id: string
  client_user_id: string
  permission_type: ClientPermissionType
  resource_type: string
  resource_id?: string
  project_specific: boolean
  
  // Permission Details
  allowed_actions: string[]
  conditions: Record<string, any>
  
  // Validity
  granted_by: string
  granted_at: Date
  expires_at?: Date
  is_active: boolean
}

export interface ClientDocumentAccess {
  id: string
  client_user_id: string
  document_id: string
  access_type: ClientDocumentAccessType
  
  // Access Control
  can_download: boolean
  can_comment: boolean
  can_approve: boolean
  watermarked: boolean
  
  // Tracking
  first_accessed?: Date
  last_accessed?: Date
  view_count: number
  download_count: number
  
  granted_by: string
  granted_at: Date
  
  // Relations
  client_user?: ClientUser
  document?: any
}

export interface ClientDocumentApproval {
  id: string
  client_user_id: string
  document_id: string
  approval_decision: ClientApprovalDecision
  
  // Approval Details
  approval_date: Date
  approval_comments?: string
  approval_conditions: string[]
  digital_signature?: Record<string, any>
  
  // Document Version Tracking
  document_version: number
  revision_letter?: string
  
  // Status
  is_final: boolean
  superseded_by?: string
  
  // Tracking
  ip_address?: string
  user_agent?: string
  session_id?: string
  
  // Relations
  client_user?: ClientUser
  document?: any
}

export interface ClientDocumentComment {
  id: string
  client_user_id: string
  document_id: string
  
  // Comment Content
  comment_text: string
  comment_type: ClientCommentType
  priority: ClientPriority
  
  // Document Positioning (for markups)
  page_number?: number
  x_coordinate?: number
  y_coordinate?: number
  markup_data?: Record<string, any>
  
  // Status and Threading
  status: ClientCommentStatus
  parent_comment_id?: string
  
  // Tracking
  created_at: Date
  updated_at: Date
  resolved_at?: Date
  resolved_by?: string
  
  // Relations
  client_user?: ClientUser
  document?: any
  parent_comment?: ClientDocumentComment
  replies?: ClientDocumentComment[]
}

export interface ClientNotification {
  id: string
  client_user_id: string
  project_id?: string
  
  // Notification Content
  title: string
  message: string
  notification_type: ClientNotificationType
  priority: ClientPriority
  
  // Delivery
  delivery_method: ClientDeliveryMethod[]
  email_sent: boolean
  sms_sent: boolean
  
  // Status
  is_read: boolean
  read_at?: Date
  dismissed: boolean
  dismissed_at?: Date
  
  // Tracking
  created_at: Date
  scheduled_for: Date
  sent_at?: Date
  
  // Relations
  client_user?: ClientUser
  project?: any
}

export interface ClientActivityLog {
  id: string
  client_user_id: string
  project_id?: string
  
  // Activity Details
  activity_type: ClientActivityType
  resource_type?: string
  resource_id?: string
  action_taken: string
  
  // Context
  description?: string
  metadata: Record<string, any>
  
  // Session Information
  ip_address?: string
  user_agent?: string
  session_id?: string
  
  // Tracking
  created_at: Date
  
  // Relations
  client_user?: ClientUser
  project?: any
}

export interface ClientCommunicationThread {
  id: string
  project_id: string
  client_user_id: string
  
  // Thread Details
  subject: string
  thread_type: ClientThreadType
  priority: ClientPriority
  status: ClientThreadStatus
  
  // Participants
  internal_participants: string[]
  client_participants: string[]
  
  // Settings
  auto_close_after_days?: number
  requires_response: boolean
  response_deadline?: Date
  
  // Tracking
  created_at: Date
  updated_at: Date
  last_message_at: Date
  closed_at?: Date
  closed_by?: string
  
  // Relations
  project?: any
  client_user?: ClientUser
  messages?: ClientMessage[]
}

export interface ClientMessage {
  id: string
  thread_id: string
  sender_id: string
  
  // Message Content
  message_body: string
  message_type: ClientMessageType
  
  // Attachments
  attachments: any[]
  
  // Status
  is_read: boolean
  read_at?: Date
  
  // Tracking
  created_at: Date
  updated_at: Date
  deleted_at?: Date
  
  // Relations
  thread?: ClientCommunicationThread
  sender?: any
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ClientApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  error?: string
  details?: string[]
}

export interface ClientListResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    has_more: boolean
  }
}

export interface ClientDashboardData {
  projects: Array<{
    id: string
    name: string
    status: string
    progress: number
    next_milestone?: {
      name: string
      date: Date
    }
  }>
  pending_approvals: number
  recent_activities: ClientActivityLog[]
  notifications: {
    unread_count: number
    recent: ClientNotification[]
  }
  messages: {
    unread_count: number
    recent_threads: ClientCommunicationThread[]
  }
}

export interface ClientProjectDetails {
  id: string
  name: string
  description?: string
  status: string
  progress: number
  start_date?: Date
  end_date?: Date
  
  // Client-specific data
  access_level: ClientProjectAccessLevel
  can_view_financials: boolean
  can_approve_documents: boolean
  can_view_schedules: boolean
  can_access_reports: boolean
  
  // Progress data
  milestones: Array<{
    id: string
    name: string
    date: Date
    status: string
    description?: string
  }>
  
  // Team contacts
  team: Array<{
    id: string
    name: string
    role: string
    email?: string
    phone?: string
  }>
  
  // Recent documents
  recent_documents: Array<{
    id: string
    name: string
    type: string
    uploaded_at: Date
    status: string
    requires_approval: boolean
  }>
}

// ============================================================================
// Authentication Types
// ============================================================================

export interface ClientLoginCredentials {
  email: string
  password: string
  company_code?: string
}

export interface ClientAuthSession {
  client_user: ClientUser
  access_token: string
  refresh_token: string
  expires_at: Date
  session_id: string
}

export interface ClientPasswordReset {
  email: string
  company_code?: string
}

export interface ClientPasswordChange {
  current_password: string
  new_password: string
  confirm_password: string
}

// ============================================================================
// Filter and Query Types
// ============================================================================

export interface ClientDocumentFilters {
  project_id?: string
  document_type?: string[]
  status?: string[]
  requires_approval?: boolean
  date_start?: string
  date_end?: string
  search?: string
  page?: number
  limit?: number
  sort_field?: 'created_at' | 'name' | 'type' | 'status'
  sort_direction?: 'asc' | 'desc'
}

export interface ClientNotificationFilters {
  notification_type?: ClientNotificationType[]
  priority?: ClientPriority[]
  is_read?: boolean
  date_start?: string
  date_end?: string
  page?: number
  limit?: number
  sort_field?: 'created_at' | 'priority'
  sort_direction?: 'asc' | 'desc'
}

export interface ClientActivityFilters {
  activity_type?: ClientActivityType[]
  project_id?: string
  date_start?: string
  date_end?: string
  page?: number
  limit?: number
  sort_field?: 'created_at' | 'activity_type'
  sort_direction?: 'asc' | 'desc'
}

export interface ClientThreadFilters {
  thread_type?: ClientThreadType[]
  status?: ClientThreadStatus[]
  priority?: ClientPriority[]
  project_id?: string
  date_start?: string
  date_end?: string
  page?: number
  limit?: number
  sort_field?: 'created_at' | 'last_message_at' | 'priority'
  sort_direction?: 'asc' | 'desc'
}

// ============================================================================
// Statistics and Reports
// ============================================================================

export interface ClientDashboardStatistics {
  total_projects: number
  active_projects: number
  pending_approvals: number
  unread_notifications: number
  unread_messages: number
  recent_activities_count: number
}

export interface ClientProjectStatistics {
  documents: {
    total: number
    pending_approval: number
    approved: number
    rejected: number
  }
  communications: {
    total_threads: number
    open_threads: number
    unread_messages: number
  }
  activities: {
    total_this_month: number
    last_login: Date
    most_active_day: string
  }
}

// ============================================================================
// Error Types
// ============================================================================

export interface ClientPortalError {
  code: string
  message: string
  details?: string
  field?: string
}

export interface ClientValidationError {
  field: string
  message: string
  code: string
}

// ============================================================================
// Utility Types
// ============================================================================

export type ClientUserRole = 'client'

export interface ClientAuthenticatedRequest {
  client_user: ClientUser
  session_id: string
  ip_address?: string
  user_agent?: string
}

export interface ClientRateLimitInfo {
  requests_remaining: number
  reset_time: Date
  limit: number
  window_ms: number
}