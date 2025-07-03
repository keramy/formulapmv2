/**
 * Formula PM 2.0 Task Management Types
 * Standalone task system with @mention intelligence
 */

import { UserProfile } from './auth'

// ============================================================================
// CORE TASK TYPES
// ============================================================================

export type TaskStatus = 
  | 'todo'
  | 'in_progress' 
  | 'review'
  | 'blocked'
  | 'done'
  | 'cancelled'

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export type ReactionType = 'like' | 'love' | 'thumbs_up' | 'thumbs_down' | 'celebrate' | 'confused'

// ============================================================================
// MAIN TASK INTERFACE
// ============================================================================

export interface Task {
  id: string
  project_id: string
  parent_task_id?: string
  
  // Core Task Fields
  title: string
  description?: string // Rich text with @mention support
  status: TaskStatus
  priority: TaskPriority
  
  // Assignment & Timeline
  assigned_to: string[] // User IDs
  created_by: string
  due_date?: string
  estimated_hours?: number
  actual_hours: number
  
  // @Mention References (Smart Linking)
  mentioned_projects: string[] // Project IDs referenced with @project
  mentioned_scope_items: string[] // Scope item IDs referenced with @scope
  mentioned_documents: string[] // Document IDs referenced with @document/@shopdrawing
  mentioned_users: string[] // User IDs referenced with @user
  mentioned_tasks: string[] // Task IDs referenced with @task
  
  // Task Dependencies
  depends_on: string[] // Task IDs this task depends on
  blocks: string[] // Task IDs this task blocks
  
  // Collaboration & Tracking
  comments_count: number
  attachments_count: number
  tags: string[]
  
  // Metadata
  created_at: string
  updated_at: string
  completed_at?: string
  last_activity_at: string
  
  // Populated relations (when included)
  creator?: UserProfile
  assignees?: UserProfile[]
  subtasks?: Task[]
  parent_task?: Task
  comments?: TaskComment[]
  attachments?: TaskAttachment[]
  activities?: TaskActivity[]
}

// ============================================================================
// TASK COMMENT SYSTEM
// ============================================================================

export interface TaskComment {
  id: string
  task_id: string
  user_id: string
  parent_comment_id?: string
  
  content: string // Rich text with @mention support
  mentioned_users: string[] // Users mentioned in this comment
  mentioned_projects: string[]
  mentioned_scope_items: string[]
  mentioned_documents: string[]
  mentioned_tasks: string[]
  
  is_edited: boolean
  edit_count: number
  reactions_count: number
  replies_count: number
  
  created_at: string
  updated_at: string
  
  // Populated relations
  user?: UserProfile
  replies?: TaskComment[]
  reactions?: CommentReaction[]
  attachments?: CommentAttachment[]
}

export interface CommentReaction {
  id: string
  comment_id: string
  user_id: string
  reaction_type: ReactionType
  created_at: string
  
  // Populated relations
  user?: UserProfile
}

// ============================================================================
// ATTACHMENTS
// ============================================================================

export interface TaskAttachment {
  id: string
  task_id: string
  filename: string
  file_url: string
  file_size?: number
  mime_type?: string
  uploaded_by: string
  uploaded_at: string
  
  // Populated relations
  uploader?: UserProfile
}

export interface CommentAttachment {
  id: string
  comment_id: string
  filename: string
  file_url: string
  file_size?: number
  mime_type?: string
  uploaded_by: string
  uploaded_at: string
  
  // Populated relations
  uploader?: UserProfile
}

// ============================================================================
// ACTIVITY AND NOTIFICATIONS
// ============================================================================

export interface TaskActivity {
  id: string
  task_id: string
  user_id: string
  activity_type: 'created' | 'updated' | 'commented' | 'assigned' | 'completed' | 'mentioned' | 'status_changed' | 'assignment_changed'
  details: Record<string, any>
  mentioned_user_id?: string
  created_at: string
  
  // Populated relations
  user?: UserProfile
  mentioned_user?: UserProfile
}

export interface MentionReference {
  id: string
  source_type: 'task' | 'comment'
  source_id: string
  target_type: 'project' | 'scope' | 'document' | 'user' | 'task'
  target_id: string
  mentioned_by: string
  context?: string // Surrounding text for preview
  created_at: string
  
  // Populated relations
  mentioned_by_user?: UserProfile
}

// ============================================================================
// @MENTION INTELLIGENCE TYPES
// ============================================================================

export interface MentionMatch {
  type: 'project' | 'scope' | 'document' | 'user' | 'task'
  id: string
  title: string
  startIndex: number
  endIndex: number
  url: string
}

export interface MentionSuggestion {
  type: 'project' | 'scope' | 'document' | 'user' | 'task'
  id: string
  title: string
  subtitle?: string
  avatar?: string
  url: string
  icon: string
  priority?: number // For sorting suggestions
}

export interface MentionParseResult {
  originalText: string
  processedText: string
  mentions: MentionMatch[]
  extractedReferences: {
    projects: string[]
    scope_items: string[]
    documents: string[]
    users: string[]
    tasks: string[]
  }
}

// ============================================================================
// FORM AND API TYPES
// ============================================================================

export interface TaskFormData {
  title: string
  description?: string
  priority: TaskPriority
  assigned_to?: string[]
  due_date?: string
  estimated_hours?: number
  tags?: string[]
  parent_task_id?: string
  depends_on?: string[]
}

export interface TaskUpdateData {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  assigned_to?: string[]
  due_date?: string
  estimated_hours?: number
  actual_hours?: number
  tags?: string[]
  depends_on?: string[]
  blocks?: string[]
}

export interface CommentFormData {
  content: string
  parent_comment_id?: string
  attachments?: File[]
}

export interface CommentUpdateData {
  content: string
}

// ============================================================================
// FILTERING AND PAGINATION
// ============================================================================

export interface TaskFilters {
  status?: TaskStatus[]
  priority?: TaskPriority[]
  assigned_to?: string[]
  created_by?: string[]
  due_date_from?: string
  due_date_to?: string
  has_overdue?: boolean
  has_dependencies?: boolean
  tags?: string[]
  search?: string
  mentioned_user?: string
  mentioned_project?: string
}

export interface TaskListParams {
  page?: number
  limit?: number
  include_details?: boolean
  include_subtasks?: boolean
  include_comments?: boolean
  include_activities?: boolean
  filters?: TaskFilters
  sort?: {
    field: 'created_at' | 'updated_at' | 'due_date' | 'priority' | 'title' | 'status'
    direction: 'asc' | 'desc'
  }
}

export interface TaskListResponse {
  tasks: Task[]
  total_count: number
  page: number
  limit: number
  has_more: boolean
  filters_applied: TaskFilters
}

// ============================================================================
// DASHBOARD AND METRICS
// ============================================================================

export interface TaskMetrics {
  total_tasks: number
  by_status: Record<TaskStatus, number>
  by_priority: Record<TaskPriority, number>
  overdue_tasks: number
  completed_this_week: number
  assigned_to_me: number
  created_by_me: number
  average_completion_time: number // in hours
  productivity_score: number
}

export interface ProjectTaskSummary {
  project_id: string
  project_name: string
  total_tasks: number
  completed_tasks: number
  overdue_tasks: number
  completion_percentage: number
  last_activity: string
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

export interface BulkTaskOperation {
  task_ids: string[]
  operation: 'update_status' | 'assign_users' | 'update_priority' | 'add_tags' | 'delete'
  data: Record<string, any>
}

export interface BulkOperationResult {
  success_count: number
  error_count: number
  errors: Array<{
    task_id: string
    error: string
  }>
}

// ============================================================================
// REAL-TIME EVENTS
// ============================================================================

export interface TaskRealtimeEvent {
  type: 'task_updated' | 'task_created' | 'task_deleted' | 'comment_added' | 'comment_updated' | 'comment_deleted' | 'reaction_added' | 'reaction_removed'
  task_id: string
  user_id: string
  data: Record<string, any>
  timestamp: string
}

export interface CommentRealtimeEvent {
  type: 'comment_added' | 'comment_updated' | 'comment_deleted' | 'reaction_added' | 'reaction_removed'
  comment_id: string
  task_id: string
  user_id: string
  data: Record<string, any>
  timestamp: string
}

// ============================================================================
// DEPENDENCY MANAGEMENT
// ============================================================================

export interface TaskDependency {
  id: string
  task_id: string
  depends_on_id: string
  dependency_type: 'blocks' | 'requires'
  created_at: string
  
  // Populated relations
  task?: Task
  depends_on_task?: Task
}

export interface DependencyValidationResult {
  is_valid: boolean
  circular_dependencies: string[]
  invalid_references: string[]
  warnings: string[]
}

// ============================================================================
// TASK TEMPLATES
// ============================================================================

export interface TaskTemplate {
  id: string
  name: string
  description?: string
  category: string
  default_priority: TaskPriority
  default_estimated_hours?: number
  default_assignees: string[]
  default_tags: string[]
  subtask_templates: Omit<TaskTemplate, 'subtask_templates'>[]
  created_by: string
  created_at: string
  is_public: boolean
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface TaskHierarchyNode {
  id: string
  title: string
  level: number
  path: string[]
  children: TaskHierarchyNode[]
}

export interface TaskAccessLevel {
  can_view: boolean
  can_edit: boolean
  can_delete: boolean
  can_comment: boolean
  can_assign: boolean
  can_change_status: boolean
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface TaskError {
  code: string
  message: string
  field?: string
  details?: Record<string, any>
}

export interface TaskValidationError extends TaskError {
  field: string
  validation_type: 'required' | 'format' | 'range' | 'dependency' | 'permission'
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export type {
  Task,
  TaskComment,
  CommentReaction,
  TaskAttachment,
  CommentAttachment,
  TaskActivity,
  MentionReference,
  MentionMatch,
  MentionSuggestion,
  MentionParseResult,
  TaskFormData,
  TaskUpdateData,
  CommentFormData,
  CommentUpdateData,
  TaskFilters,
  TaskListParams,
  TaskListResponse,
  TaskMetrics,
  ProjectTaskSummary,
  BulkTaskOperation,
  BulkOperationResult,
  TaskRealtimeEvent,
  CommentRealtimeEvent,
  TaskDependency,
  DependencyValidationResult,
  TaskTemplate,
  TaskHierarchyNode,
  TaskAccessLevel,
  TaskError,
  TaskValidationError
}