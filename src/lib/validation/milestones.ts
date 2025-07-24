/**
 * Formula PM 2.0 Milestone Validation Schemas
 * V3 Phase 1 Implementation
 * 
 * Comprehensive validation schemas for milestone management operations
 * using Zod for type-safe validation.
 */

import { z } from 'zod'
import { MilestoneStatus } from '@/types/milestones'

// ============================================================================
// BASE VALIDATION SCHEMAS
// ============================================================================

export const milestoneStatusSchema = z.enum(['upcoming', 'in_progress', 'completed', 'overdue', 'cancelled'])

// ============================================================================
// MILESTONE FORM VALIDATION
// ============================================================================

export const milestoneFormDataSchema = z.object({
  // Basic Information - Required
  name: z.string()
    .min(1, 'Milestone name is required')
    .max(100, 'Milestone name must be less than 100 characters')
    .trim(),
  
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  
  // Timeline - Required
  target_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Target date must be in YYYY-MM-DD format'),
  
  // Status - defaults to upcoming
  status: milestoneStatusSchema.default('upcoming'),
  
  // Project ID - required for creation
  project_id: z.string().uuid('Invalid project ID format')
})
.superRefine((data, ctx) => {
  // Validate future target date for new milestones
  if (data.status === 'upcoming' || data.status === 'in_progress') {
    const targetDate = new Date(data.target_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (targetDate < today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Target date cannot be in the past for upcoming milestones',
        path: ['target_date']
      })
    }
  }
  
  // Validate status logic
  if (data.status === 'completed' || data.status === 'cancelled') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Use the status update endpoint to mark milestones as completed or cancelled',
      path: ['status']
    })
  }
})

// ============================================================================
// MILESTONE UPDATE VALIDATION
// ============================================================================

export const milestoneUpdateSchema = z.object({
  name: z.string()
    .min(1, 'Milestone name is required')
    .max(100, 'Milestone name must be less than 100 characters')
    .trim()
    .optional(),
  
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  
  target_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Target date must be in YYYY-MM-DD format')
    .optional(),
  
  status: milestoneStatusSchema.optional()
})
.superRefine((data, ctx) => {
  // Validate target date if provided
  if (data.target_date) {
    const targetDate = new Date(data.target_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Allow past dates for updates (user might be updating historical data)
    if (targetDate < new Date('2020-01-01')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Target date cannot be before 2020',
        path: ['target_date']
      })
    }
  }
})

// ============================================================================
// MILESTONE STATUS UPDATE VALIDATION
// ============================================================================

export const milestoneStatusUpdateSchema = z.object({
  status: milestoneStatusSchema,
  actual_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Actual date must be in YYYY-MM-DD format')
    .optional(),
  notes: z.string()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
})
.superRefine((data, ctx) => {
  // Require actual date for completed/cancelled status
  if ((data.status === 'completed' || data.status === 'cancelled') && !data.actual_date) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Actual date is required when marking milestone as completed or cancelled',
      path: ['actual_date']
    })
  }
  
  // Validate actual date is not in the future
  if (data.actual_date) {
    const actualDate = new Date(data.actual_date)
    const today = new Date()
    today.setHours(23, 59, 59, 999) // End of today
    
    if (actualDate > today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Actual date cannot be in the future',
        path: ['actual_date']
      })
    }
  }
})

// ============================================================================
// MILESTONE FILTERS VALIDATION
// ============================================================================

export const milestoneFiltersSchema = z.object({
  status: z.array(milestoneStatusSchema).optional(),
  search: z.string().max(100, 'Search query too long').optional(),
  target_date_start: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
    .optional(),
  target_date_end: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .optional(),
  overdue_only: z.boolean().optional(),
  upcoming_only: z.boolean().optional(),
  completed_only: z.boolean().optional(),
  created_by: z.string().uuid('Invalid user ID format').optional()
})
.superRefine((data, ctx) => {
  // Validate date range
  if (data.target_date_start && data.target_date_end) {
    if (new Date(data.target_date_start) > new Date(data.target_date_end)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Start date cannot be after end date',
        path: ['target_date_start']
      })
    }
  }
  
  // Validate conflicting filters
  const exclusiveFilters = [data.overdue_only, data.upcoming_only, data.completed_only].filter(Boolean)
  if (exclusiveFilters.length > 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Cannot combine overdue_only, upcoming_only, and completed_only filters',
      path: ['overdue_only']
    })
  }
})

// ============================================================================
// PAGINATION & SORTING VALIDATION
// ============================================================================

export const milestoneSortSchema = z.object({
  field: z.enum(['name', 'target_date', 'status', 'created_at']),
  direction: z.enum(['asc', 'desc']).default('asc')
})

export const milestoneListParamsSchema = z.object({
  page: z.number().min(1, 'Page must be at least 1').default(1),
  limit: z.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  filters: milestoneFiltersSchema.optional(),
  sort: milestoneSortSchema.optional(),
  include_creator: z.boolean().default(false),
  include_project: z.boolean().default(false)
})

// ============================================================================
// BULK OPERATIONS VALIDATION
// ============================================================================

export const milestoneBulkUpdateSchema = z.object({
  milestone_ids: z.array(z.string().uuid('Invalid milestone ID format')).min(1, 'At least one milestone ID is required'),
  updates: z.object({
    status: milestoneStatusSchema.optional(),
    target_date: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Target date must be in YYYY-MM-DD format')
      .optional(),
    actual_date: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Actual date must be in YYYY-MM-DD format')
      .optional()
  }),
  notify_team: z.boolean().default(false)
})
.superRefine((data, ctx) => {
  // At least one update field must be provided
  if (!data.updates.status && !data.updates.target_date && !data.updates.actual_date) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one update field must be provided',
      path: ['updates']
    })
  }
  
  // Validate status/actual_date relationship
  if (data.updates.status && ['completed', 'cancelled'].includes(data.updates.status) && !data.updates.actual_date) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Actual date is required when bulk updating status to completed or cancelled',
      path: ['updates', 'actual_date']
    })
  }
})

// ============================================================================
// MILESTONE STATISTICS VALIDATION
// ============================================================================

export const milestoneStatisticsParamsSchema = z.object({
  project_id: z.string().uuid('Invalid project ID format').optional(),
  date_range: z.object({
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
    end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
  }).optional(),
  include_overdue: z.boolean().default(true),
  include_upcoming: z.boolean().default(true),
  group_by: z.enum(['project', 'status', 'month', 'quarter']).default('status')
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

export const validateMilestoneFormData = (data: unknown) => {
  return milestoneFormDataSchema.safeParse(data)
}

export const validateMilestoneUpdate = (data: unknown) => {
  return milestoneUpdateSchema.safeParse(data)
}

export const validateMilestoneStatusUpdate = (data: unknown) => {
  return milestoneStatusUpdateSchema.safeParse(data)
}

export const validateMilestoneFilters = (data: unknown) => {
  return milestoneFiltersSchema.safeParse(data)
}

export const validateMilestoneListParams = (data: unknown) => {
  return milestoneListParamsSchema.safeParse(data)
}

export const validateMilestoneBulkUpdate = (data: unknown) => {
  return milestoneBulkUpdateSchema.safeParse(data)
}

export const validateMilestoneStatisticsParams = (data: unknown) => {
  return milestoneStatisticsParamsSchema.safeParse(data)
}

// ============================================================================
// CUSTOM VALIDATION HELPERS
// ============================================================================

export const validateMilestonePermissions = (userRole: string, action: string): boolean => {
  const rolePermissions: Record<string, string[]> = {
    'management': ['create', 'read', 'update', 'delete', 'change_status', 'view_all'],
    'admin': ['create', 'read', 'update', 'delete', 'change_status', 'view_all'],
    'technical_lead': ['read', 'update', 'change_status', 'view_all'],
    'project_manager': ['create', 'read', 'update', 'change_status'],
    'purchase_manager': ['read'],
    'client': ['read'],
  }
  
  return rolePermissions[userRole]?.includes(action) || false
}

export const validateMilestoneAccess = (userRole: string, projectId: string, assignedProjects: string[]): boolean => {
  // Management roles can access all project milestones
  if (['management', 'management', 'management', 'technical_lead', 'admin'].includes(userRole)) {
    return true
  }
  
  // Other roles need to be assigned to the project
  return assignedProjects.includes(projectId)
}

export const calculateMilestoneStatus = (targetDate: string, actualDate?: string): MilestoneStatus => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const target = new Date(targetDate)
  target.setHours(0, 0, 0, 0)
  
  // If actual date is set, milestone is completed or cancelled
  if (actualDate) {
    return 'completed' // This would be determined by the actual status field
  }
  
  // Check if overdue
  if (target < today) {
    return 'overdue'
  }
  
  // Check if due soon (within 7 days)
  const daysUntilDue = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (daysUntilDue <= 7) {
    return 'in_progress'
  }
  
  return 'upcoming'
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type MilestoneFormData = z.infer<typeof milestoneFormDataSchema>
export type MilestoneUpdate = z.infer<typeof milestoneUpdateSchema>
export type MilestoneStatusUpdate = z.infer<typeof milestoneStatusUpdateSchema>
export type MilestoneFilters = z.infer<typeof milestoneFiltersSchema>
export type MilestoneListParams = z.infer<typeof milestoneListParamsSchema>
export type MilestoneBulkUpdate = z.infer<typeof milestoneBulkUpdateSchema>
export type MilestoneStatisticsParams = z.infer<typeof milestoneStatisticsParamsSchema>