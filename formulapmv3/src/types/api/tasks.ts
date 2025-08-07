// Auto-generated types for tasks

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  project_id: string
  created_by: string
  assigned_to?: string
  due_date?: string
  estimated_hours?: number
  actual_hours?: number
  progress_percentage?: number
  tags?: string[]
  created_at: string
  updated_at: string
  
  // Relations
  project?: {
    id: string
    name: string
    code: string
  }
  created_by_user?: {
    id: string
    full_name: string
    email: string
  }
  assigned_to_user?: {
    id: string
    full_name: string
    email: string
  }
}

export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'done' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface CreateTaskData {
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  project_id: string
  assigned_to?: string
  due_date?: string
  estimated_hours?: number
  tags?: string[]
}

export interface UpdateTaskData {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  assigned_to?: string
  due_date?: string
  estimated_hours?: number
  actual_hours?: number
  progress_percentage?: number
  tags?: string[]
}

export interface TaskFilters {
  project_id?: string
  status?: TaskStatus
  priority?: TaskPriority
  assigned_to?: string
  created_by?: string
  search?: string
  date_from?: string
  date_to?: string
}

export interface TaskResponse {
  success: boolean
  data: Task
  error?: string
}

export interface TaskListResponse {
  success: boolean
  data: Task[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  error?: string
}

export interface TaskComment {
  id: string
  task_id: string
  user_id: string
  comment: string
  created_at: string
  updated_at: string
  user?: {
    id: string
    full_name: string
    email: string
  }
}

export interface CreateTaskCommentData {
  comment: string
}