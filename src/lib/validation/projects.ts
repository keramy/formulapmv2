/**
 * Formula PM 2.0 Project Validation Schemas
 * Wave 2 Business Logic Implementation
 * 
 * Comprehensive validation schemas for project management operations
 * using Zod for type-safe validation.
 */

import { z } from 'zod'
import { ProjectStatus } from '@/types/database'

// ============================================================================
// BASE VALIDATION SCHEMAS
// ============================================================================

export const projectStatusSchema = z.enum(['planning', 'bidding', 'active', 'on_hold', 'completed', 'cancelled'])

export const projectPrioritySchema = z.number().min(1).max(5).default(1)

export const accessLevelSchema = z.enum(['full', 'limited', 'read_only'])

export const projectTypeSchema = z.enum([
  'commercial',
  'residential', 
  'industrial',
  'renovation',
  'tenant_improvement',
  'infrastructure'
]).optional()

// ============================================================================
// TEAM ASSIGNMENT VALIDATION
// ============================================================================

export const projectTeamAssignmentSchema = z.object({
  user_id: z.string().uuid('Invalid user ID format'),
  role: z.string().min(1, 'Role is required'),
  responsibilities: z.array(z.string()).default([]),
  access_level: accessLevelSchema.default('limited')
})

export const projectAssignmentPayloadSchema = z.object({
  assignments: z.array(projectTeamAssignmentSchema),
  replace_existing: z.boolean().default(false),
  notify_assigned_users: z.boolean().default(true)
})

// ============================================================================
// PROJECT FORM VALIDATION
// ============================================================================

export const projectFormDataSchema = z.object({
  // Basic Information - Required
  name: z.string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be less than 100 characters')
    .trim(),
  
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  
  project_type: projectTypeSchema,
  
  priority: projectPrioritySchema,
  
  location: z.string()
    .max(200, 'Location must be less than 200 characters')
    .optional(),
  
  // Client & Assignment
  client_id: z.string().uuid('Invalid client ID format').optional(),
  
  project_manager_id: z.string().uuid('Invalid project manager ID format').optional(),
  
  // Timeline & Budget
  start_date: z.string()
    .datetime('Invalid start date format')
    .optional(),
  
  end_date: z.string()
    .datetime('Invalid end date format')
    .optional(),
  
  budget: z.number()
    .nonnegative('Budget must be non-negative')
    .max(999999999.99, 'Budget exceeds maximum allowed value')
    .optional(),
  
  // Team Assignments
  team_assignments: z.array(projectTeamAssignmentSchema).default([]),
  
  // Workflow Settings
  approval_workflow_enabled: z.boolean().default(true),
  client_portal_enabled: z.boolean().default(true),
  mobile_reporting_enabled: z.boolean().default(true),
  
  // Template
  template_id: z.string().uuid('Invalid template ID format').optional(),
  
  // Metadata
  metadata: z.record(z.any()).default({})
})
.superRefine((data, ctx) => {
  // Validate date logic
  if (data.start_date && data.end_date) {
    const startDate = new Date(data.start_date)
    const endDate = new Date(data.end_date)
    
    if (startDate >= endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be after start date',
        path: ['end_date']
      })
    }
  }
  
  // Validate future start date
  if (data.start_date) {
    const startDate = new Date(data.start_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (startDate < today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Start date cannot be in the past',
        path: ['start_date']
      })
    }
  }
  
  // Validate team assignments
  if (data.team_assignments.length > 0) {
    const userIds = data.team_assignments.map(a => a.user_id)
    const uniqueUserIds = new Set(userIds)
    
    if (userIds.length !== uniqueUserIds.size) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Duplicate user assignments are not allowed',
        path: ['team_assignments']
      })
    }
  }
})

// ============================================================================
// PROJECT UPDATE VALIDATION
// ============================================================================

export const updateProjectSchema = z.object({
  name: z.string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be less than 100 characters')
    .trim()
    .optional(),
  
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  
  project_type: projectTypeSchema,
  
  priority: projectPrioritySchema.optional(),
  
  location: z.string()
    .max(200, 'Location must be less than 200 characters')
    .optional(),
  
  client_id: z.string().uuid('Invalid client ID format').optional(),
  
  project_manager_id: z.string().uuid('Invalid project manager ID format').optional(),
  
  status: projectStatusSchema.optional(),
  
  start_date: z.string()
    .datetime('Invalid start date format')
    .optional(),
  
  end_date: z.string()
    .datetime('Invalid end date format')
    .optional(),
  
  budget: z.number()
    .nonnegative('Budget must be non-negative')
    .max(999999999.99, 'Budget exceeds maximum allowed value')
    .optional(),
  
  actual_cost: z.number()
    .nonnegative('Actual cost must be non-negative')
    .max(999999999.99, 'Actual cost exceeds maximum allowed value')
    .optional(),
  
  metadata: z.record(z.any()).optional()
})
.superRefine((data, ctx) => {
  // Validate date logic if both are provided
  if (data.start_date && data.end_date) {
    const startDate = new Date(data.start_date)
    const endDate = new Date(data.end_date)
    
    if (startDate >= endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be after start date',
        path: ['end_date']
      })
    }
  }
  
  // Validate budget vs actual cost
  if (data.budget !== undefined && data.actual_cost !== undefined) {
    if (data.actual_cost > data.budget * 1.5) { // Allow 50% overage
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Actual cost significantly exceeds budget - approval may be required',
        path: ['actual_cost']
      })
    }
  }
})

// ============================================================================
// PROJECT STATUS UPDATE VALIDATION
// ============================================================================

export const projectStatusUpdateSchema = z.object({
  status: projectStatusSchema,
  reason: z.string()
    .max(500, 'Reason must be less than 500 characters')
    .optional(),
  notify_team: z.boolean().default(true),
  update_scope_items: z.boolean().default(false)
})
.superRefine((data, ctx) => {
  // Require reason for certain status changes
  const reasonRequiredStatuses: ProjectStatus[] = ['on_hold', 'cancelled']
  
  if (reasonRequiredStatuses.includes(data.status) && !data.reason?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Reason is required when changing status to ${data.status}`,
      path: ['reason']
    })
  }
})

// ============================================================================
// PROJECT BUDGET UPDATE VALIDATION
// ============================================================================

export const projectBudgetUpdateSchema = z.object({
  budget: z.number()
    .nonnegative('Budget must be non-negative')
    .max(999999999.99, 'Budget exceeds maximum allowed value')
    .optional(),
  
  actual_cost: z.number()
    .nonnegative('Actual cost must be non-negative')
    .max(999999999.99, 'Actual cost exceeds maximum allowed value')
    .optional(),
  
  reason: z.string()
    .max(500, 'Reason must be less than 500 characters')
    .optional(),
  
  approval_required: z.boolean().default(false)
})
.superRefine((data, ctx) => {
  // At least one field must be provided
  if (data.budget === undefined && data.actual_cost === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Either budget or actual cost must be provided',
      path: ['budget']
    })
  }
  
  // Require reason for significant budget changes
  if (data.budget !== undefined && data.approval_required && !data.reason?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Reason is required for budget changes requiring approval',
      path: ['reason']
    })
  }
})

// ============================================================================
// PROJECT FILTERS VALIDATION
// ============================================================================

export const projectFiltersSchema = z.object({
  status: z.array(projectStatusSchema).optional(),
  client_id: z.string().uuid('Invalid client ID format').optional(),
  project_manager_id: z.string().uuid('Invalid project manager ID format').optional(),
  project_type: projectTypeSchema,
  priority_min: z.number().min(1).max(5).optional(),
  priority_max: z.number().min(1).max(5).optional(),
  start_date_from: z.string().datetime('Invalid date format').optional(),
  start_date_to: z.string().datetime('Invalid date format').optional(),
  end_date_from: z.string().datetime('Invalid date format').optional(),
  end_date_to: z.string().datetime('Invalid date format').optional(),
  budget_min: z.number().nonnegative('Minimum budget must be non-negative').optional(),
  budget_max: z.number().nonnegative('Maximum budget must be non-negative').optional(),
  search: z.string().max(100, 'Search query too long').optional(),
  assigned_user_id: z.string().uuid('Invalid user ID format').optional(),
  has_pending_approvals: z.boolean().optional(),
  created_by: z.string().uuid('Invalid user ID format').optional()
})
.superRefine((data, ctx) => {
  // Validate priority range
  if (data.priority_min !== undefined && data.priority_max !== undefined) {
    if (data.priority_min > data.priority_max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Minimum priority cannot be greater than maximum priority',
        path: ['priority_min']
      })
    }
  }
  
  // Validate budget range
  if (data.budget_min !== undefined && data.budget_max !== undefined) {
    if (data.budget_min > data.budget_max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Minimum budget cannot be greater than maximum budget',
        path: ['budget_min']
      })
    }
  }
  
  // Validate date ranges
  if (data.start_date_from && data.start_date_to) {
    if (new Date(data.start_date_from) > new Date(data.start_date_to)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Start date from cannot be after start date to',
        path: ['start_date_from']
      })
    }
  }
  
  if (data.end_date_from && data.end_date_to) {
    if (new Date(data.end_date_from) > new Date(data.end_date_to)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date from cannot be after end date to',
        path: ['end_date_from']
      })
    }
  }
})

// ============================================================================
// PAGINATION & SORTING VALIDATION
// ============================================================================

export const projectSortSchema = z.object({
  field: z.enum(['name', 'status', 'priority', 'start_date', 'end_date', 'budget', 'progress', 'created_at']),
  direction: z.enum(['asc', 'desc']).default('asc')
})

export const projectListParamsSchema = z.object({
  page: z.number().min(1, 'Page must be at least 1').default(1),
  limit: z.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  filters: projectFiltersSchema.optional(),
  sort: projectSortSchema.optional(),
  include_details: z.boolean().default(false)
})

// ============================================================================
// PROJECT TEMPLATE VALIDATION
// ============================================================================

export const projectTemplateSchema = z.object({
  name: z.string()
    .min(1, 'Template name is required')
    .max(100, 'Template name must be less than 100 characters'),
  
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  
  project_type: projectTypeSchema.default('commercial'),
  
  default_scope_categories: z.array(z.string()).default([]),
  
  default_team_roles: z.array(z.string()).default([]),
  
  default_workflows: z.array(z.string()).default([]),
  
  template_data: z.record(z.any()).default({}),
  
  is_active: z.boolean().default(true)
})

// ============================================================================
// VALIDATION UTILITY FUNCTIONS
// ============================================================================

export const validateProjectFormData = (data: unknown) => {
  return projectFormDataSchema.safeParse(data)
}

export const validateProjectUpdate = (data: unknown) => {
  return updateProjectSchema.safeParse(data)
}

export const validateProjectFilters = (data: unknown) => {
  return projectFiltersSchema.safeParse(data)
}

export const validateProjectListParams = (data: unknown) => {
  return projectListParamsSchema.safeParse(data)
}

export const validateProjectStatusUpdate = (data: unknown) => {
  return projectStatusUpdateSchema.safeParse(data)
}

export const validateProjectBudgetUpdate = (data: unknown) => {
  return projectBudgetUpdateSchema.safeParse(data)
}

export const validateProjectTemplate = (data: unknown) => {
  return projectTemplateSchema.safeParse(data)
}

export const validateProjectAssignments = (data: unknown) => {
  return projectAssignmentPayloadSchema.safeParse(data)
}

// ============================================================================
// CUSTOM VALIDATION HELPERS
// ============================================================================

export const validateProjectPermissions = (userRole: string, action: string): boolean => {
  const rolePermissions: Record<string, string[]> = {
    'company_owner': ['create', 'read', 'update', 'delete', 'manage_team', 'view_budget', 'edit_budget'],
    'general_manager': ['create', 'read', 'update', 'delete', 'manage_team', 'view_budget', 'edit_budget'],
    'deputy_general_manager': ['create', 'read', 'update', 'manage_team', 'view_budget', 'edit_budget'],
    'technical_director': ['read', 'update', 'view_budget'],
    'admin': ['create', 'read', 'update', 'delete', 'manage_team'],
    'project_manager': ['create', 'read', 'update', 'manage_team'],
    'architect': ['read', 'update'],
    'technical_engineer': ['read', 'update'],
    'purchase_director': ['read', 'view_budget'],
    'purchase_specialist': ['read'],
    'field_worker': ['read'],
    'client': ['read'],
    'subcontractor': ['read']
  }
  
  return rolePermissions[userRole]?.includes(action) || false
}

export const validateProjectAccess = (userRole: string, projectId: string, assignedProjects: string[]): boolean => {
  // Management roles can access all projects
  if (['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin'].includes(userRole)) {
    return true
  }
  
  // Other roles need to be assigned to the project
  return assignedProjects.includes(projectId)
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ProjectFormData = z.infer<typeof projectFormDataSchema>
export type UpdateProjectData = z.infer<typeof updateProjectSchema>
export type ProjectFilters = z.infer<typeof projectFiltersSchema>
export type ProjectListParams = z.infer<typeof projectListParamsSchema>
export type ProjectStatusUpdate = z.infer<typeof projectStatusUpdateSchema>
export type ProjectBudgetUpdate = z.infer<typeof projectBudgetUpdateSchema>
export type ProjectTemplate = z.infer<typeof projectTemplateSchema>
export type ProjectAssignmentPayload = z.infer<typeof projectAssignmentPayloadSchema>
export type ProjectTeamAssignment = z.infer<typeof projectTeamAssignmentSchema>