/**
 * Formula PM 2.0 Task Types
 * V3 Phase 1 Implementation
 * 
 * Type definitions for task management system
 */

export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'completed' | 'cancelled' | 'blocked'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Task {
  id: string
  project_id: string
  scope_item_id?: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  assigned_to?: string
  assigned_by?: string
  due_date?: string
  completed_at?: string
  estimated_hours?: number
  actual_hours?: number
  dependencies?: string[]
  tags?: string[]
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
  
  // Relations
  assignee?: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }
  assigner?: {
    id: string
    full_name: string
    email: string
  }
  scope_item?: {
    id: string
    item_no: number
    title: string
    description: string
  }
}

export interface TaskFormData {
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  assigned_to?: string
  due_date?: string
  estimated_hours?: number
  scope_item_id?: string
  tags?: string[]
}

export interface TaskComment {
  id: string
  task_id: string
  user_id: string
  comment: string
  attachments?: any[]
  created_at: string
  updated_at: string
  
  // Relations
  user?: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }
}

export interface TaskFilters {
  status?: TaskStatus[]
  priority?: TaskPriority[]
  assignee?: string
  search?: string
  due_date_start?: string
  due_date_end?: string
  scope_item_id?: string
  tags?: string[]
  overdue_only?: boolean
  assigned_to_me?: boolean
  assigned_by_me?: boolean
  completed_only?: boolean
  created_by?: string
}

export interface TaskSortOptions {
  field: 'created_at' | 'due_date' | 'priority' | 'status' | 'title'
  direction: 'asc' | 'desc'
}

// Permission types for tasks
export interface TaskPermissions {
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canAssign: boolean
  canChangeStatus: boolean
  canComment: boolean
  canViewAll: boolean
}

// Task statistics for project dashboard
export interface TaskStatistics {
  total: number
  byStatus: Record<TaskStatus, number>
  byPriority: Record<TaskPriority, number>
  overdue: number
  dueThisWeek: number
  completed: number
  assignedToMe: number
}