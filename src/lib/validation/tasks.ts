/**
 * Formula PM 2.0 Task Validation Schemas
 * V3 Phase 1 Implementation
 * 
 * Comprehensive validation schemas for task management operations
 * using Zod for type-safe validation. Follows milestone validation patterns exactly.
 */

import { z } from 'zod'
import { TaskStatus, TaskPriority } from '@/types/tasks'

// ============================================================================
// BASE VALIDATION SCHEMAS
// ============================================================================

export const taskStatusSchema = z.enum(['pending', 'in_progress', 'review', 'completed', 'cancelled', 'blocked'])
export const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent'])

// ============================================================================
// TASK FORM VALIDATION
// ============================================================================

export const taskFormDataSchema = z.object({
  // Basic Information - Required
  title: z.string()
    .min(1, 'Task title is required')
    .max(200, 'Task title must be less than 200 characters')
    .trim(),
  
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  
  // Status and Priority
  status: taskStatusSchema.default('pending'),
  priority: taskPrioritySchema.default('medium'),
  
  // Assignment
  assigned_to: z.string().uuid('Invalid user ID format').optional(),
  
  // Timeline
  due_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format')
    .optional(),
  
  // Effort estimation
  estimated_hours: z.number()
    .min(0.1, 'Estimated hours must be at least 0.1')
    .max(1000, 'Estimated hours cannot exceed 1000')
    .optional(),
  
  // Relations
  scope_item_id: z.string().uuid('Invalid scope item ID format').optional(),
  
  // Organization
  tags: z.array(z.string().max(50, 'Tag must be less than 50 characters')).optional(),
  
  // Project ID - required for creation
  project_id: z.string().uuid('Invalid project ID format')
})
.superRefine((data, ctx) => {
  // Validate due date is not in the past for new tasks
  if (data.due_date && data.status === 'pending') {
    const dueDate = new Date(data.due_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (dueDate < today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Due date cannot be in the past for new tasks',
        path: ['due_date']
      })
    }
  }
  
  // Validate status logic for new tasks
  if (data.status === 'completed' || data.status === 'cancelled') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Use the status update endpoint to mark tasks as completed or cancelled',
      path: ['status']
    })
  }
})

// ============================================================================
// TASK UPDATE VALIDATION
// ============================================================================

export const taskUpdateSchema = z.object({
  title: z.string()
    .min(1, 'Task title is required')
    .max(200, 'Task title must be less than 200 characters')
    .trim()
    .optional(),
  
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  
  assigned_to: z.string().uuid('Invalid user ID format').optional(),
  
  due_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format')
    .optional(),
  
  estimated_hours: z.number()
    .min(0.1, 'Estimated hours must be at least 0.1')
    .max(1000, 'Estimated hours cannot exceed 1000')
    .optional(),
  
  actual_hours: z.number()
    .min(0.1, 'Actual hours must be at least 0.1')
    .max(1000, 'Actual hours cannot exceed 1000')
    .optional(),
  
  scope_item_id: z.string().uuid('Invalid scope item ID format').optional(),
  
  tags: z.array(z.string().max(50, 'Tag must be less than 50 characters')).optional()
})
.superRefine((data, ctx) => {
  // Validate due date if provided
  if (data.due_date) {
    const dueDate = new Date(data.due_date)
    
    // Allow past dates for updates (user might be updating historical data)
    if (dueDate < new Date('2020-01-01')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Due date cannot be before 2020',
        path: ['due_date']
      })
    }
  }
  
  // Validate actual hours only allowed for completed tasks
  if (data.actual_hours && data.status && !['completed', 'cancelled'].includes(data.status)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Actual hours can only be set for completed or cancelled tasks',
      path: ['actual_hours']
    })
  }
})

// ============================================================================
// TASK STATUS UPDATE VALIDATION
// ============================================================================

export const taskStatusUpdateSchema = z.object({
  status: taskStatusSchema,
  actual_hours: z.number()
    .min(0.1, 'Actual hours must be at least 0.1')
    .max(1000, 'Actual hours cannot exceed 1000')
    .optional(),
  completion_notes: z.string()
    .max(500, 'Completion notes must be less than 500 characters')
    .optional()
})
.superRefine((data, ctx) => {
  // Require actual hours for completed tasks
  if (data.status === 'completed' && !data.actual_hours) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Actual hours are required when marking task as completed',
      path: ['actual_hours']
    })
  }
})

// ============================================================================
// TASK FILTERS VALIDATION
// ============================================================================

export const taskFiltersSchema = z.object({
  status: z.array(taskStatusSchema).optional(),
  priority: z.array(taskPrioritySchema).optional(),
  assignee: z.string().uuid('Invalid user ID format').optional(),
  search: z.string().max(100, 'Search query too long').optional(),
  due_date_start: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
    .optional(),
  due_date_end: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .optional(),
  scope_item_id: z.string().uuid('Invalid scope item ID format').optional(),
  tags: z.array(z.string().max(50, 'Tag must be less than 50 characters')).optional(),
  overdue_only: z.boolean().optional(),
  assigned_to_me: z.boolean().optional(),
  assigned_by_me: z.boolean().optional(),
  completed_only: z.boolean().optional(),
  created_by: z.string().uuid('Invalid user ID format').optional()
})
.superRefine((data, ctx) => {
  // Validate date range
  if (data.due_date_start && data.due_date_end) {
    if (new Date(data.due_date_start) > new Date(data.due_date_end)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Start date cannot be after end date',
        path: ['due_date_start']
      })
    }
  }
  
  // Validate conflicting filters
  const exclusiveFilters = [data.overdue_only, data.assigned_to_me, data.assigned_by_me, data.completed_only].filter(Boolean)
  if (exclusiveFilters.length > 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Cannot combine overdue_only, assigned_to_me, assigned_by_me, and completed_only filters',
      path: ['overdue_only']
    })
  }
})

// ============================================================================
// PAGINATION & SORTING VALIDATION
// ============================================================================

export const taskSortSchema = z.object({
  field: z.enum(['title', 'due_date', 'priority', 'status', 'created_at', 'updated_at']),
  direction: z.enum(['asc', 'desc']).default('asc')
})

export const taskListParamsSchema = z.object({
  page: z.number().min(1, 'Page must be at least 1').default(1),
  limit: z.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  filters: taskFiltersSchema.optional(),
  sort: taskSortSchema.optional(),
  include_assignee: z.boolean().default(false),
  include_assigner: z.boolean().default(false),
  include_scope_item: z.boolean().default(false),
  include_project: z.boolean().default(false)
})

// ============================================================================
// TASK COMMENTS VALIDATION
// ============================================================================

export const taskCommentSchema = z.object({
  comment: z.string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment must be less than 1000 characters')
    .trim(),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.string(),
    size: z.number()
  })).optional()
})

// ============================================================================
// BULK OPERATIONS VALIDATION
// ============================================================================

export const taskBulkUpdateSchema = z.object({
  task_ids: z.array(z.string().uuid('Invalid task ID format')).min(1, 'At least one task ID is required'),
  updates: z.object({
    status: taskStatusSchema.optional(),
    priority: taskPrioritySchema.optional(),
    assigned_to: z.string().uuid('Invalid user ID format').optional(),
    due_date: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format')
      .optional(),
    tags: z.array(z.string().max(50, 'Tag must be less than 50 characters')).optional()
  }),
  notify_assignees: z.boolean().default(false)
})
.superRefine((data, ctx) => {
  // At least one update field must be provided
  if (!data.updates.status && !data.updates.priority && !data.updates.assigned_to && !data.updates.due_date && !data.updates.tags) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one update field must be provided',
      path: ['updates']
    })
  }
})

// ============================================================================
// TASK STATISTICS VALIDATION
// ============================================================================

export const taskStatisticsParamsSchema = z.object({
  project_id: z.string().uuid('Invalid project ID format').optional(),
  date_range: z.object({
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
    end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
  }).optional(),
  include_overdue: z.boolean().default(true),
  include_assigned_to_me: z.boolean().default(true),
  group_by: z.enum(['project', 'status', 'priority', 'assignee', 'week', 'month']).default('status')
})
.superRefine((data, ctx) => {
  // Validate date range
  if (data.date_range) {
    if (new Date(data.date_range.start) > new Date(data.date_range.end)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Start date cannot be after end date',
        path: ['date_range', 'start']
      })
    }
  }
})

// ============================================================================
// VALIDATION UTILITY FUNCTIONS
// ============================================================================

export const validateTaskFormData = (data: unknown) => {
  return taskFormDataSchema.safeParse(data)
}

export const validateTaskUpdate = (data: unknown) => {
  return taskUpdateSchema.safeParse(data)
}

export const validateTaskStatusUpdate = (data: unknown) => {
  return taskStatusUpdateSchema.safeParse(data)
}

export const validateTaskFilters = (data: unknown) => {
  return taskFiltersSchema.safeParse(data)
}

export const validateTaskListParams = (data: unknown) => {
  return taskListParamsSchema.safeParse(data)
}

export const validateTaskComment = (data: unknown) => {
  return taskCommentSchema.safeParse(data)
}

export const validateTaskBulkUpdate = (data: unknown) => {
  return taskBulkUpdateSchema.safeParse(data)
}

export const validateTaskStatisticsParams = (data: unknown) => {
  return taskStatisticsParamsSchema.safeParse(data)
}

// ============================================================================
// CUSTOM VALIDATION HELPERS
// ============================================================================

export const validateTaskPermissions = (userRole: string, action: string): boolean => {
  const rolePermissions: Record<string, string[]> = {
    'company_owner': ['create', 'read', 'update', 'delete', 'assign', 'change_status', 'comment', 'view_all'],
    'general_manager': ['create', 'read', 'update', 'delete', 'assign', 'change_status', 'comment', 'view_all'],
    'deputy_general_manager': ['create', 'read', 'update', 'assign', 'change_status', 'comment', 'view_all'],
    'technical_director': ['read', 'update', 'assign', 'change_status', 'comment', 'view_all'],
    'admin': ['create', 'read', 'update', 'delete', 'assign', 'change_status', 'comment', 'view_all'],
    'project_manager': ['create', 'read', 'update', 'assign', 'change_status', 'comment'],
    'architect': ['create', 'read', 'update', 'comment'],
    'technical_engineer': ['create', 'read', 'update', 'comment'],
    'purchase_director': ['read', 'comment'],
    'purchase_specialist': ['read', 'comment'],
    'field_worker': ['read', 'update', 'comment'],
    'client': ['read', 'comment'],
  }
  
  return rolePermissions[userRole]?.includes(action) || false
}

export const validateTaskAccess = (userRole: string, projectId: string, assignedProjects: string[]): boolean => {
  // Management roles can access all project tasks
  if (['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin'].includes(userRole)) {
    return true
  }
  
  // Other roles need to be assigned to the project
  return assignedProjects.includes(projectId)
}

export const calculateTaskStatus = (status: TaskStatus, dueDate?: string): TaskStatus => {
  // If task is already completed or cancelled, don't change status
  if (['completed', 'cancelled'].includes(status)) {
    return status
  }
  
  // Check if overdue
  if (dueDate) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)
    
    if (due < today && status !== 'blocked') {
      return 'blocked' // Overdue tasks are marked as blocked
    }
  }
  
  return status
}

export const calculateTaskPriorityScore = (priority: TaskPriority): number => {
  const priorityScores: Record<TaskPriority, number> = {
    'low': 1,
    'medium': 2,
    'high': 3,
    'urgent': 4
  }
  
  return priorityScores[priority] || 2
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type TaskFormData = z.infer<typeof taskFormDataSchema>
export type TaskUpdate = z.infer<typeof taskUpdateSchema>
export type TaskStatusUpdate = z.infer<typeof taskStatusUpdateSchema>
export type TaskFilters = z.infer<typeof taskFiltersSchema>
export type TaskListParams = z.infer<typeof taskListParamsSchema>
export type TaskComment = z.infer<typeof taskCommentSchema>
export type TaskBulkUpdate = z.infer<typeof taskBulkUpdateSchema>
export type TaskStatisticsParams = z.infer<typeof taskStatisticsParamsSchema>