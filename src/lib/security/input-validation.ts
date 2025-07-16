/**
 * Comprehensive Input Validation and Sanitization
 * Prevents injection attacks and validates all user inputs
 */

import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'

// Common validation schemas
export const CommonSchemas = {
  // Basic types
  uuid: z.string().uuid('Invalid UUID format'),
  email: z.string().email('Invalid email format').max(255),
  phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format').optional(),
  url: z.string().url('Invalid URL format').max(2048).optional(),
  
  // Text fields with length limits
  shortText: z.string().min(1).max(100).trim(),
  mediumText: z.string().min(1).max(500).trim(),
  longText: z.string().min(1).max(2000).trim(),
  description: z.string().max(5000).trim().optional(),
  
  // Numeric fields
  positiveInt: z.number().int().min(0),
  positiveFloat: z.number().min(0),
  percentage: z.number().min(0).max(100),
  currency: z.number().min(0).max(999999999.99),
  
  // Date fields
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  datetime: z.string().datetime('Invalid datetime format'),
  
  // Enum fields
  status: z.enum(['pending', 'in_progress', 'review', 'completed', 'cancelled', 'blocked', 'pending_approval', 'approved', 'rejected', 'revision_required', 'discontinued', 'substitution_required']),
  priority: z.enum(['low', 'medium', 'high', 'urgent', 'critical']),
  userRole: z.enum(['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'purchase_director', 'architect', 'technical_engineer', 'purchase_specialist', 'field_worker', 'client']),
  
  // Search and filter fields
  searchQuery: z.string().max(100).regex(/^[a-zA-Z0-9\s\-_.,()]+$/, 'Invalid search query format').optional(),
  tags: z.array(z.string().max(50).regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid tag format')).max(10).optional(),
  
  // Pagination
  page: z.number().int().min(1).max(1000).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  
  // Boolean flags
  includeFlag: z.boolean().default(false),
  
  // File upload
  fileName: z.string().max(255).regex(/^[a-zA-Z0-9\-_. ]+\.[a-zA-Z0-9]+$/, 'Invalid file name format'),
  fileSize: z.number().int().min(1).max(50 * 1024 * 1024), // 50MB max
  mimeType: z.string().regex(/^[a-zA-Z0-9]+\/[a-zA-Z0-9\-+.]+$/, 'Invalid MIME type')
}

// Project-specific validation schemas
export const ProjectSchemas = {
  create: z.object({
    name: CommonSchemas.shortText,
    description: CommonSchemas.description,
    project_type: z.enum(['commercial', 'residential', 'industrial', 'renovation', 'tenant_improvement', 'infrastructure']),
    priority: CommonSchemas.priority,
    location: CommonSchemas.mediumText.optional(),
    client_id: CommonSchemas.uuid,
    project_manager_id: CommonSchemas.uuid.optional(),
    start_date: CommonSchemas.date.optional(),
    end_date: CommonSchemas.date.optional(),
    budget: CommonSchemas.currency.optional(),
    metadata: z.record(z.any()).optional(),
    approval_workflow_enabled: z.boolean().default(false),
    client_portal_enabled: z.boolean().default(false),
    mobile_reporting_enabled: z.boolean().default(false),
    team_assignments: z.array(z.object({
      user_id: CommonSchemas.uuid,
      role: z.string().max(50),
      responsibilities: z.array(z.string().max(100)).optional()
    })).optional(),
    template_id: CommonSchemas.uuid.optional()
  }),
  
  update: z.object({
    name: CommonSchemas.shortText.optional(),
    description: CommonSchemas.description,
    project_type: z.enum(['commercial', 'residential', 'industrial', 'renovation', 'tenant_improvement', 'infrastructure']).optional(),
    priority: CommonSchemas.priority.optional(),
    location: CommonSchemas.mediumText.optional(),
    project_manager_id: CommonSchemas.uuid.optional(),
    start_date: CommonSchemas.date.optional(),
    end_date: CommonSchemas.date.optional(),
    budget: CommonSchemas.currency.optional(),
    actual_cost: CommonSchemas.currency.optional(),
    status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).optional(),
    metadata: z.record(z.any()).optional()
  }),
  
  listParams: z.object({
    page: CommonSchemas.page,
    limit: CommonSchemas.limit,
    include_details: CommonSchemas.includeFlag,
    status: z.array(z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled'])).optional(),
    client_id: CommonSchemas.uuid.optional(),
    project_manager_id: CommonSchemas.uuid.optional(),
    project_type: z.enum(['commercial', 'residential', 'industrial', 'renovation', 'tenant_improvement', 'infrastructure']).optional(),
    search: CommonSchemas.searchQuery,
    assigned_user_id: CommonSchemas.uuid.optional(),
    sort_field: z.enum(['name', 'created_at', 'updated_at', 'start_date', 'end_date', 'budget', 'status']).default('created_at'),
    sort_direction: z.enum(['asc', 'desc']).default('desc')
  })
}

// Task-specific validation schemas
export const TaskSchemas = {
  create: z.object({
    project_id: CommonSchemas.uuid,
    scope_item_id: CommonSchemas.uuid.optional(),
    title: CommonSchemas.shortText,
    description: CommonSchemas.description,
    status: CommonSchemas.status.default('pending'),
    priority: CommonSchemas.priority.default('medium'),
    assigned_to: CommonSchemas.uuid.optional(),
    due_date: CommonSchemas.date.optional(),
    estimated_hours: CommonSchemas.positiveFloat.optional(),
    tags: CommonSchemas.tags
  }),
  
  update: z.object({
    title: CommonSchemas.shortText.optional(),
    description: CommonSchemas.description,
    status: CommonSchemas.status.optional(),
    priority: CommonSchemas.priority.optional(),
    assigned_to: CommonSchemas.uuid.optional(),
    due_date: CommonSchemas.date.optional(),
    estimated_hours: CommonSchemas.positiveFloat.optional(),
    actual_hours: CommonSchemas.positiveFloat.optional(),
    tags: CommonSchemas.tags,
    progress_notes: CommonSchemas.longText.optional()
  }),
  
  listParams: z.object({
    page: CommonSchemas.page,
    limit: CommonSchemas.limit,
    include_assignee: CommonSchemas.includeFlag,
    include_assigner: CommonSchemas.includeFlag,
    include_scope_item: CommonSchemas.includeFlag,
    include_project: CommonSchemas.includeFlag,
    project_id: CommonSchemas.uuid.optional(),
    status: z.array(CommonSchemas.status).optional(),
    priority: z.array(CommonSchemas.priority).optional(),
    assignee: CommonSchemas.uuid.optional(),
    search: CommonSchemas.searchQuery,
    due_date_start: CommonSchemas.date.optional(),
    due_date_end: CommonSchemas.date.optional(),
    scope_item_id: CommonSchemas.uuid.optional(),
    tags: z.array(z.string().max(50)).optional(),
    overdue_only: z.boolean().default(false),
    assigned_to_me: z.boolean().default(false),
    assigned_by_me: z.boolean().default(false),
    completed_only: z.boolean().default(false),
    created_by: CommonSchemas.uuid.optional(),
    sort_field: z.enum(['title', 'created_at', 'updated_at', 'due_date', 'priority', 'status']).default('created_at'),
    sort_direction: z.enum(['asc', 'desc']).default('desc')
  })
}

// Material Spec validation schemas
export const MaterialSpecSchemas = {
  create: z.object({
    project_id: CommonSchemas.uuid,
    supplier_id: CommonSchemas.uuid.optional(),
    name: CommonSchemas.shortText,
    description: CommonSchemas.description,
    category: z.enum(['construction', 'electrical', 'mechanical', 'millwork', 'finishes', 'fixtures', 'equipment', 'other']),
    subcategory: CommonSchemas.shortText.optional(),
    brand: CommonSchemas.shortText.optional(),
    model: CommonSchemas.shortText.optional(),
    specifications: z.record(z.any()).optional(),
    unit_of_measure: z.enum(['each', 'linear_foot', 'square_foot', 'cubic_foot', 'pound', 'ton', 'gallon', 'liter', 'meter', 'kilogram']),
    estimated_cost: CommonSchemas.currency.optional(),
    quantity_required: CommonSchemas.positiveFloat,
    minimum_stock_level: CommonSchemas.positiveFloat.default(0),
    status: z.enum(['pending_approval', 'approved', 'rejected', 'revision_required', 'discontinued', 'substitution_required']).default('pending_approval'),
    priority: CommonSchemas.priority.default('medium'),
    lead_time_days: CommonSchemas.positiveInt.default(0),
    delivery_date: CommonSchemas.date.optional(),
    scope_item_ids: z.array(CommonSchemas.uuid).optional()
  }),
  
  update: z.object({
    supplier_id: CommonSchemas.uuid.optional(),
    name: CommonSchemas.shortText.optional(),
    description: CommonSchemas.description,
    category: z.enum(['construction', 'electrical', 'mechanical', 'millwork', 'finishes', 'fixtures', 'equipment', 'other']).optional(),
    subcategory: CommonSchemas.shortText.optional(),
    brand: CommonSchemas.shortText.optional(),
    model: CommonSchemas.shortText.optional(),
    specifications: z.record(z.any()).optional(),
    unit_of_measure: z.enum(['each', 'linear_foot', 'square_foot', 'cubic_foot', 'pound', 'ton', 'gallon', 'liter', 'meter', 'kilogram']).optional(),
    estimated_cost: CommonSchemas.currency.optional(),
    actual_cost: CommonSchemas.currency.optional(),
    quantity_required: CommonSchemas.positiveFloat.optional(),
    quantity_available: CommonSchemas.positiveFloat.optional(),
    minimum_stock_level: CommonSchemas.positiveFloat.optional(),
    status: z.enum(['pending_approval', 'approved', 'rejected', 'revision_required', 'discontinued', 'substitution_required']).optional(),
    priority: CommonSchemas.priority.optional(),
    lead_time_days: CommonSchemas.positiveInt.optional(),
    delivery_date: CommonSchemas.date.optional(),
    approved_by: CommonSchemas.uuid.optional(),
    approval_notes: CommonSchemas.longText.optional()
  }),
  
  listParams: z.object({
    page: CommonSchemas.page,
    limit: CommonSchemas.limit,
    include_project: CommonSchemas.includeFlag,
    include_supplier: CommonSchemas.includeFlag,
    include_creator: CommonSchemas.includeFlag,
    include_approver: CommonSchemas.includeFlag,
    include_scope_items: CommonSchemas.includeFlag,
    project_id: CommonSchemas.uuid.optional(),
    status: z.array(z.enum(['pending_approval', 'approved', 'rejected', 'revision_required', 'discontinued', 'substitution_required'])).optional(),
    priority: z.array(CommonSchemas.priority).optional(),
    category: z.array(z.enum(['construction', 'electrical', 'mechanical', 'millwork', 'finishes', 'fixtures', 'equipment', 'other'])).optional(),
    supplier_id: CommonSchemas.uuid.optional(),
    search: CommonSchemas.searchQuery,
    created_by: CommonSchemas.uuid.optional(),
    approved_by: CommonSchemas.uuid.optional(),
    delivery_date_start: CommonSchemas.date.optional(),
    delivery_date_end: CommonSchemas.date.optional(),
    cost_min: CommonSchemas.currency.optional(),
    cost_max: CommonSchemas.currency.optional(),
    quantity_min: CommonSchemas.positiveFloat.optional(),
    quantity_max: CommonSchemas.positiveFloat.optional(),
    overdue_only: z.boolean().default(false),
    approval_required_only: z.boolean().default(false),
    low_stock_only: z.boolean().default(false),
    has_supplier: z.boolean().default(false),
    has_delivery_date: z.boolean().default(false),
    scope_item_id: CommonSchemas.uuid.optional(),
    sort_field: z.enum(['name', 'created_at', 'updated_at', 'delivery_date', 'estimated_cost', 'priority', 'status']).default('created_at'),
    sort_direction: z.enum(['asc', 'desc']).default('desc')
  })
}

// User profile validation schemas
export const UserSchemas = {
  profileUpdate: z.object({
    first_name: CommonSchemas.shortText.optional(),
    last_name: CommonSchemas.shortText.optional(),
    phone: CommonSchemas.phone,
    department: CommonSchemas.shortText.optional()
  }),
  
  passwordChange: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    confirmPassword: z.string().min(1, 'Password confirmation is required')
  }).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  }).refine(data => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"]
  })
}

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHTML(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: []
  })
}

/**
 * Sanitize file name to prevent path traversal
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9\-_. ]/g, '') // Remove special characters
    .replace(/\.\./g, '') // Remove path traversal attempts
    .replace(/^\.+/, '') // Remove leading dots
    .substring(0, 255) // Limit length
}

/**
 * Validate and sanitize file upload
 */
export function validateFileUpload(file: {
  name: string
  size: number
  type: string
}): { isValid: boolean; error?: string; sanitizedName?: string } {
  try {
    // Validate file name
    const sanitizedName = sanitizeFileName(file.name)
    if (!sanitizedName || sanitizedName.length === 0) {
      return { isValid: false, error: 'Invalid file name' }
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      return { isValid: false, error: 'File size exceeds 50MB limit' }
    }

    // Validate MIME type (whitelist approach)
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv'
    ]

    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'File type not allowed' }
    }

    return { isValid: true, sanitizedName }
  } catch (error) {
    return { isValid: false, error: 'File validation failed' }
  }
}

/**
 * Validate API request parameters
 */
export function validateRequestParams<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error }
    }
    throw error
  }
}

/**
 * Create validation middleware for API routes
 */
export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): T => {
    const result = validateRequestParams(schema, data)
    if (!result.success) {
      throw new Error(`Validation failed: ${result.error.errors.map(e => e.message).join(', ')}`)
    }
    return result.data
  }
}

/**
 * Escape SQL special characters (additional safety layer)
 */
export function escapeSQLString(input: string): string {
  return input.replace(/'/g, "''").replace(/\\/g, '\\\\')
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Rate limiting helper
 */
export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator: (request: any) => string
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(config: RateLimitConfig, request: any): {
  allowed: boolean
  remaining: number
  resetTime: number
} {
  const key = config.keyGenerator(request)
  const now = Date.now()
  const resetTime = now + config.windowMs

  const existing = rateLimitStore.get(key)

  if (!existing || now > existing.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime
    }
  }

  if (existing.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: existing.resetTime
    }
  }

  existing.count++
  return {
    allowed: true,
    remaining: config.maxRequests - existing.count,
    resetTime: existing.resetTime
  }
}

// Clean up old rate limit entries
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000) // Clean up every 5 minutes