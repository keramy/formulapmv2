/**
 * Formula PM 2.0 Material Specifications Validation Schemas
 * V3 Phase 1 Implementation
 * 
 * Comprehensive validation schemas for material specification operations
 * using Zod for type-safe validation. Follows task validation patterns exactly.
 */

import { z } from 'zod'
import { MaterialStatus, MaterialPriority } from '@/types/material-specs'

// ============================================================================
// BASE VALIDATION SCHEMAS
// ============================================================================

export const materialStatusSchema = z.enum([
  'pending_approval',
  'approved',
  'rejected',
  'revision_required',
  'discontinued',
  'substitution_required'
])

export const materialPrioritySchema = z.enum(['low', 'medium', 'high', 'critical'])

// ============================================================================
// MATERIAL SPEC FORM VALIDATION
// ============================================================================

export const materialSpecFormDataSchema = z.object({
  // Basic Information - Required
  name: z.string()
    .min(1, 'Material name is required')
    .max(200, 'Material name must be less than 200 characters')
    .trim(),
  
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  
  // Classification
  category: z.string()
    .min(1, 'Category is required')
    .max(100, 'Category must be less than 100 characters')
    .trim(),
  
  subcategory: z.string()
    .max(100, 'Subcategory must be less than 100 characters')
    .optional(),
  
  brand: z.string()
    .max(100, 'Brand must be less than 100 characters')
    .optional(),
  
  model: z.string()
    .max(100, 'Model must be less than 100 characters')
    .optional(),
  
  // Technical specifications as JSON
  specifications: z.record(z.any()).optional(),
  
  // Measurements and quantities
  unit_of_measure: z.string()
    .min(1, 'Unit of measure is required')
    .max(50, 'Unit of measure must be less than 50 characters')
    .trim(),
  
  estimated_cost: z.number()
    .min(0, 'Estimated cost cannot be negative')
    .max(999999999.99, 'Estimated cost is too large')
    .optional(),
  
  quantity_required: z.number()
    .int('Quantity required must be a whole number')
    .min(1, 'Quantity required must be at least 1')
    .max(999999999, 'Quantity required is too large')
    .default(1),
  
  minimum_stock_level: z.number()
    .int('Minimum stock level must be a whole number')
    .min(0, 'Minimum stock level cannot be negative')
    .max(999999999, 'Minimum stock level is too large')
    .default(0),
  
  // Status and Priority
  status: materialStatusSchema.default('pending_approval'),
  priority: materialPrioritySchema.default('medium'),
  
  // Relations
  supplier_id: z.string().uuid('Invalid supplier ID format').optional(),
  project_id: z.string().uuid('Invalid project ID format'),
  
  // Timeline
  lead_time_days: z.number()
    .int('Lead time must be a whole number')
    .min(0, 'Lead time cannot be negative')
    .max(3650, 'Lead time cannot exceed 10 years')
    .default(0),
  
  delivery_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Delivery date must be in YYYY-MM-DD format')
    .optional(),
  
  // Scope item linking
  scope_item_ids: z.array(z.string().uuid('Invalid scope item ID format')).optional()
})
.superRefine((data, ctx) => {
  // Validate delivery date is not in the past for new materials
  if (data.delivery_date && data.status === 'pending_approval') {
    const deliveryDate = new Date(data.delivery_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (deliveryDate < today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Delivery date cannot be in the past for new materials',
        path: ['delivery_date']
      })
    }
  }
  
  // Validate status logic for new materials
  if (data.status === 'approved' || data.status === 'rejected') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Use the approval/rejection endpoints to change status',
      path: ['status']
    })
  }
  
  // Validate quantity requirements
  if (data.minimum_stock_level > data.quantity_required) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Minimum stock level cannot exceed quantity required',
      path: ['minimum_stock_level']
    })
  }
})

// ============================================================================
// MATERIAL SPEC UPDATE VALIDATION
// ============================================================================

export const materialSpecUpdateSchema = z.object({
  name: z.string()
    .min(1, 'Material name is required')
    .max(200, 'Material name must be less than 200 characters')
    .trim()
    .optional(),
  
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  
  category: z.string()
    .min(1, 'Category is required')
    .max(100, 'Category must be less than 100 characters')
    .trim()
    .optional(),
  
  subcategory: z.string()
    .max(100, 'Subcategory must be less than 100 characters')
    .optional(),
  
  brand: z.string()
    .max(100, 'Brand must be less than 100 characters')
    .optional(),
  
  model: z.string()
    .max(100, 'Model must be less than 100 characters')
    .optional(),
  
  specifications: z.record(z.any()).optional(),
  
  unit_of_measure: z.string()
    .min(1, 'Unit of measure is required')
    .max(50, 'Unit of measure must be less than 50 characters')
    .trim()
    .optional(),
  
  estimated_cost: z.number()
    .min(0, 'Estimated cost cannot be negative')
    .max(999999999.99, 'Estimated cost is too large')
    .optional(),
  
  actual_cost: z.number()
    .min(0, 'Actual cost cannot be negative')
    .max(999999999.99, 'Actual cost is too large')
    .optional(),
  
  quantity_required: z.number()
    .int('Quantity required must be a whole number')
    .min(1, 'Quantity required must be at least 1')
    .max(999999999, 'Quantity required is too large')
    .optional(),
  
  quantity_available: z.number()
    .int('Quantity available must be a whole number')
    .min(0, 'Quantity available cannot be negative')
    .max(999999999, 'Quantity available is too large')
    .optional(),
  
  minimum_stock_level: z.number()
    .int('Minimum stock level must be a whole number')
    .min(0, 'Minimum stock level cannot be negative')
    .max(999999999, 'Minimum stock level is too large')
    .optional(),
  
  status: materialStatusSchema.optional(),
  priority: materialPrioritySchema.optional(),
  
  supplier_id: z.string().uuid('Invalid supplier ID format').optional(),
  
  lead_time_days: z.number()
    .int('Lead time must be a whole number')
    .min(0, 'Lead time cannot be negative')
    .max(3650, 'Lead time cannot exceed 10 years')
    .optional(),
  
  delivery_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Delivery date must be in YYYY-MM-DD format')
    .optional(),
  
  substitution_notes: z.string()
    .max(1000, 'Substitution notes must be less than 1000 characters')
    .optional()
})
.superRefine((data, ctx) => {
  // Validate delivery date if provided
  if (data.delivery_date) {
    const deliveryDate = new Date(data.delivery_date)
    
    // Allow past dates for updates (historical data)
    if (deliveryDate < new Date('2020-01-01')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Delivery date cannot be before 2020',
        path: ['delivery_date']
      })
    }
  }
  
  // Validate actual cost only allowed for approved materials
  if (data.actual_cost && data.status && !['approved', 'discontinued'].includes(data.status)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Actual cost can only be set for approved or discontinued materials',
      path: ['actual_cost']
    })
  }
  
  // Validate quantity constraints
  if (data.minimum_stock_level && data.quantity_required && data.minimum_stock_level > data.quantity_required) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Minimum stock level cannot exceed quantity required',
      path: ['minimum_stock_level']
    })
  }
})

// ============================================================================
// MATERIAL APPROVAL VALIDATION
// ============================================================================

export const materialApprovalSchema = z.object({
  approval_notes: z.string()
    .max(1000, 'Approval notes must be less than 1000 characters')
    .optional()
})

export const materialRejectionSchema = z.object({
  rejection_reason: z.string()
    .min(1, 'Rejection reason is required')
    .max(1000, 'Rejection reason must be less than 1000 characters')
    .trim()
})

export const materialRevisionSchema = z.object({
  revision_reason: z.string()
    .min(1, 'Revision reason is required')
    .max(1000, 'Revision reason must be less than 1000 characters')
    .trim(),
  revision_notes: z.string()
    .max(1000, 'Revision notes must be less than 1000 characters')
    .optional()
})

// ============================================================================
// SCOPE LINKING VALIDATION
// ============================================================================

export const scopeLinkSchema = z.object({
  scope_item_id: z.string().uuid('Invalid scope item ID format'),
  quantity_needed: z.number()
    .int('Quantity needed must be a whole number')
    .min(1, 'Quantity needed must be at least 1')
    .max(999999999, 'Quantity needed is too large'),
  notes: z.string()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
})

export const scopeUnlinkSchema = z.object({
  scope_item_id: z.string().uuid('Invalid scope item ID format')
})

// ============================================================================
// MATERIAL FILTERS VALIDATION
// ============================================================================

export const materialSpecFiltersSchema = z.object({
  status: z.array(materialStatusSchema).optional(),
  priority: z.array(materialPrioritySchema).optional(),
  category: z.array(z.string().max(100, 'Category must be less than 100 characters')).optional(),
  supplier_id: z.string().uuid('Invalid supplier ID format').optional(),
  search: z.string().max(100, 'Search query too long').optional(),
  created_by: z.string().uuid('Invalid user ID format').optional(),
  approved_by: z.string().uuid('Invalid user ID format').optional(),
  delivery_date_start: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
    .optional(),
  delivery_date_end: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .optional(),
  cost_range: z.object({
    min: z.number().min(0, 'Minimum cost cannot be negative').optional(),
    max: z.number().min(0, 'Maximum cost cannot be negative').optional()
  }).optional(),
  quantity_range: z.object({
    min: z.number().int().min(0, 'Minimum quantity cannot be negative').optional(),
    max: z.number().int().min(0, 'Maximum quantity cannot be negative').optional()
  }).optional(),
  overdue_only: z.boolean().optional(),
  approval_required_only: z.boolean().optional(),
  low_stock_only: z.boolean().optional(),
  has_supplier: z.boolean().optional(),
  has_delivery_date: z.boolean().optional(),
  scope_item_id: z.string().uuid('Invalid scope item ID format').optional()
})
.superRefine((data, ctx) => {
  // Validate date range
  if (data.delivery_date_start && data.delivery_date_end) {
    if (new Date(data.delivery_date_start) > new Date(data.delivery_date_end)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Start date cannot be after end date',
        path: ['delivery_date_start']
      })
    }
  }
  
  // Validate cost range
  if (data.cost_range?.min && data.cost_range?.max) {
    if (data.cost_range.min > data.cost_range.max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Minimum cost cannot be greater than maximum cost',
        path: ['cost_range', 'min']
      })
    }
  }
  
  // Validate quantity range
  if (data.quantity_range?.min && data.quantity_range?.max) {
    if (data.quantity_range.min > data.quantity_range.max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Minimum quantity cannot be greater than maximum quantity',
        path: ['quantity_range', 'min']
      })
    }
  }
})

// ============================================================================
// PAGINATION & SORTING VALIDATION
// ============================================================================

export const materialSpecSortSchema = z.object({
  field: z.enum(['name', 'category', 'status', 'priority', 'estimated_cost', 'delivery_date', 'created_at', 'updated_at']),
  direction: z.enum(['asc', 'desc']).default('asc')
})

export const materialSpecListParamsSchema = z.object({
  page: z.number().min(1, 'Page must be at least 1').default(1),
  limit: z.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  filters: materialSpecFiltersSchema.optional(),
  sort: materialSpecSortSchema.optional(),
  include_project: z.boolean().default(false),
  include_supplier: z.boolean().default(false),
  include_creator: z.boolean().default(false),
  include_approver: z.boolean().default(false),
  include_scope_items: z.boolean().default(false),
  project_id: z.string().uuid('Invalid project ID format').optional()
})

// ============================================================================
// BULK OPERATIONS VALIDATION
// ============================================================================

export const materialSpecBulkUpdateSchema = z.object({
  material_spec_ids: z.array(z.string().uuid('Invalid material spec ID format')).min(1, 'At least one material spec ID is required'),
  updates: z.object({
    status: materialStatusSchema.optional(),
    priority: materialPrioritySchema.optional(),
    category: z.string().max(100, 'Category must be less than 100 characters').optional(),
    supplier_id: z.string().uuid('Invalid supplier ID format').optional(),
    delivery_date: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Delivery date must be in YYYY-MM-DD format')
      .optional(),
    lead_time_days: z.number()
      .int('Lead time must be a whole number')
      .min(0, 'Lead time cannot be negative')
      .max(3650, 'Lead time cannot exceed 10 years')
      .optional()
  }),
  notify_stakeholders: z.boolean().default(false)
})
.superRefine((data, ctx) => {
  // At least one update field must be provided
  if (!data.updates.status && !data.updates.priority && !data.updates.category && 
      !data.updates.supplier_id && !data.updates.delivery_date && !data.updates.lead_time_days) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one update field must be provided',
      path: ['updates']
    })
  }
})

export const materialSpecBulkApprovalSchema = z.object({
  material_spec_ids: z.array(z.string().uuid('Invalid material spec ID format')).min(1, 'At least one material spec ID is required'),
  approval_notes: z.string()
    .max(1000, 'Approval notes must be less than 1000 characters')
    .optional(),
  notify_stakeholders: z.boolean().default(false)
})

export const materialSpecBulkRejectionSchema = z.object({
  material_spec_ids: z.array(z.string().uuid('Invalid material spec ID format')).min(1, 'At least one material spec ID is required'),
  rejection_reason: z.string()
    .min(1, 'Rejection reason is required')
    .max(1000, 'Rejection reason must be less than 1000 characters')
    .trim(),
  notify_stakeholders: z.boolean().default(false)
})

// ============================================================================
// STATISTICS VALIDATION
// ============================================================================

export const materialSpecStatisticsParamsSchema = z.object({
  project_id: z.string().uuid('Invalid project ID format').optional(),
  date_range: z.object({
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
    end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
  }).optional(),
  include_costs: z.boolean().default(true),
  include_delivery_performance: z.boolean().default(true),
  group_by: z.enum(['project', 'status', 'priority', 'category', 'supplier', 'week', 'month']).default('status')
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

export const validateMaterialSpecFormData = (data: unknown) => {
  return materialSpecFormDataSchema.safeParse(data)
}

export const validateMaterialSpecUpdate = (data: unknown) => {
  return materialSpecUpdateSchema.safeParse(data)
}

export const validateMaterialApproval = (data: unknown) => {
  return materialApprovalSchema.safeParse(data)
}

export const validateMaterialRejection = (data: unknown) => {
  return materialRejectionSchema.safeParse(data)
}

export const validateMaterialRevision = (data: unknown) => {
  return materialRevisionSchema.safeParse(data)
}

export const validateScopeLink = (data: unknown) => {
  return scopeLinkSchema.safeParse(data)
}

export const validateScopeUnlink = (data: unknown) => {
  return scopeUnlinkSchema.safeParse(data)
}

export const validateMaterialSpecFilters = (data: unknown) => {
  return materialSpecFiltersSchema.safeParse(data)
}

export const validateMaterialSpecListParams = (data: unknown) => {
  return materialSpecListParamsSchema.safeParse(data)
}

export const validateMaterialSpecBulkUpdate = (data: unknown) => {
  return materialSpecBulkUpdateSchema.safeParse(data)
}

export const validateMaterialSpecBulkApproval = (data: unknown) => {
  return materialSpecBulkApprovalSchema.safeParse(data)
}

export const validateMaterialSpecBulkRejection = (data: unknown) => {
  return materialSpecBulkRejectionSchema.safeParse(data)
}

export const validateMaterialSpecStatisticsParams = (data: unknown) => {
  return materialSpecStatisticsParamsSchema.safeParse(data)
}

// ============================================================================
// CUSTOM VALIDATION HELPERS
// ============================================================================

export const validateMaterialSpecPermissions = (userRole: string, action: string): boolean => {
  const rolePermissions: Record<string, string[]> = {
    'company_owner': ['create', 'read', 'update', 'delete', 'approve', 'reject', 'link', 'unlink', 'view_all'],
    'general_manager': ['create', 'read', 'update', 'delete', 'approve', 'reject', 'link', 'unlink', 'view_all'],
    'deputy_general_manager': ['create', 'read', 'update', 'approve', 'reject', 'link', 'unlink', 'view_all'],
    'technical_director': ['read', 'update', 'approve', 'reject', 'link', 'unlink', 'view_all'],
    'admin': ['create', 'read', 'update', 'delete', 'approve', 'reject', 'link', 'unlink', 'view_all'],
    'project_manager': ['create', 'read', 'update', 'approve', 'link', 'unlink'],
    'architect': ['create', 'read', 'update', 'link', 'unlink'],
    'technical_engineer': ['create', 'read', 'update', 'link', 'unlink'],
    'purchase_director': ['read', 'approve', 'reject'],
    'purchase_specialist': ['read', 'update'],
    'field_worker': ['read'],
    'client': ['read'],
  }
  
  return rolePermissions[userRole]?.includes(action) || false
}

export const validateMaterialSpecAccess = (userRole: string, projectId: string, assignedProjects: string[]): boolean => {
  // Management roles can access all project materials
  if (['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin'].includes(userRole)) {
    return true
  }
  
  // Other roles need to be assigned to the project
  return assignedProjects.includes(projectId)
}

export const calculateMaterialAvailabilityStatus = (quantityRequired: number, quantityAvailable: number, minimumStock: number): 'sufficient' | 'low' | 'out_of_stock' => {
  if (quantityAvailable === 0) {
    return 'out_of_stock'
  }
  
  if (quantityAvailable < minimumStock || quantityAvailable < quantityRequired) {
    return 'low'
  }
  
  return 'sufficient'
}

export const calculateMaterialCostVariance = (estimatedCost?: number, actualCost?: number): number => {
  if (!estimatedCost || !actualCost) {
    return 0
  }
  
  return ((actualCost - estimatedCost) / estimatedCost) * 100
}

export const calculateDaysUntilDelivery = (deliveryDate: string): number => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const delivery = new Date(deliveryDate)
  delivery.setHours(0, 0, 0, 0)
  
  const diffTime = delivery.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export const validateMaterialStatusTransition = (currentStatus: MaterialStatus, newStatus: MaterialStatus): boolean => {
  const allowedTransitions: Record<MaterialStatus, MaterialStatus[]> = {
    'pending_approval': ['approved', 'rejected', 'revision_required'],
    'approved': ['discontinued', 'substitution_required'],
    'rejected': ['pending_approval', 'revision_required'],
    'revision_required': ['pending_approval', 'rejected'],
    'discontinued': ['substitution_required'],
    'substitution_required': ['pending_approval']
  }
  
  return allowedTransitions[currentStatus]?.includes(newStatus) || false
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type MaterialSpecFormData = z.infer<typeof materialSpecFormDataSchema>
export type MaterialSpecUpdate = z.infer<typeof materialSpecUpdateSchema>
export type MaterialApproval = z.infer<typeof materialApprovalSchema>
export type MaterialRejection = z.infer<typeof materialRejectionSchema>
export type MaterialRevision = z.infer<typeof materialRevisionSchema>
export type ScopeLink = z.infer<typeof scopeLinkSchema>
export type ScopeUnlink = z.infer<typeof scopeUnlinkSchema>
export type MaterialSpecFilters = z.infer<typeof materialSpecFiltersSchema>
export type MaterialSpecListParams = z.infer<typeof materialSpecListParamsSchema>
export type MaterialSpecBulkUpdate = z.infer<typeof materialSpecBulkUpdateSchema>
export type MaterialSpecBulkApproval = z.infer<typeof materialSpecBulkApprovalSchema>
export type MaterialSpecBulkRejection = z.infer<typeof materialSpecBulkRejectionSchema>
export type MaterialSpecStatisticsParams = z.infer<typeof materialSpecStatisticsParamsSchema>