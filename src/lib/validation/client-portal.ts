/**
 * Client Portal Validation Schemas
 * Comprehensive Zod validation for external client portal operations
 * Following Formula PM's validation patterns
 */

import { z } from 'zod'
import {
  ClientAccessLevel,
  ClientCompanyType,
  ClientProjectAccessLevel,
  ClientPermissionType,
  ClientDocumentAccessType,
  ClientApprovalDecision,
  ClientCommentType,
  ClientCommentStatus,
  ClientPriority,
  ClientNotificationType,
  ClientDeliveryMethod,
  ClientActivityType,
  ClientThreadType,
  ClientThreadStatus,
  ClientMessageType
} from '@/types/client-portal'

// ============================================================================
// Enum Schemas
// ============================================================================

export const clientAccessLevelSchema = z.enum(['view_only', 'reviewer', 'approver', 'project_owner'])
export const clientCompanyTypeSchema = z.enum(['individual', 'corporation', 'partnership', 'government', 'non_profit'])
export const clientProjectAccessLevelSchema = z.enum(['viewer', 'reviewer', 'approver', 'stakeholder'])
export const clientPermissionTypeSchema = z.enum(['document_access', 'project_access', 'communication', 'reporting', 'financial'])
export const clientDocumentAccessTypeSchema = z.enum(['view', 'download', 'comment', 'approve'])
export const clientApprovalDecisionSchema = z.enum(['approved', 'approved_with_conditions', 'rejected', 'requires_revision'])
export const clientCommentTypeSchema = z.enum(['general', 'revision_request', 'question', 'approval_condition', 'concern'])
export const clientCommentStatusSchema = z.enum(['open', 'addressed', 'resolved', 'closed'])
export const clientPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent'])
export const clientNotificationTypeSchema = z.enum([
  'document_submitted', 'approval_required', 'approval_received', 'project_milestone',
  'schedule_change', 'budget_update', 'quality_issue', 'delivery_notification',
  'message_received', 'system_announcement'
])
export const clientDeliveryMethodSchema = z.enum(['in_app', 'email', 'sms', 'push'])
export const clientActivityTypeSchema = z.enum([
  'login', 'logout', 'document_view', 'document_download', 'document_approve',
  'comment_add', 'message_send', 'project_access', 'profile_update'
])
export const clientThreadTypeSchema = z.enum(['general', 'technical', 'commercial', 'quality', 'schedule', 'support'])
export const clientThreadStatusSchema = z.enum(['open', 'pending_response', 'resolved', 'closed'])
export const clientMessageTypeSchema = z.enum(['text', 'file', 'image', 'system'])

// ============================================================================
// Authentication Validation
// ============================================================================

export const clientLoginSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .max(100, 'Email must be less than 100 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters'),
  company_code: z.string()
    .max(20, 'Company code must be less than 20 characters')
    .optional()
})

export const clientPasswordResetSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .max(100, 'Email must be less than 100 characters'),
  company_code: z.string()
    .max(20, 'Company code must be less than 20 characters')
    .optional()
})

export const clientPasswordChangeSchema = z.object({
  current_password: z.string()
    .min(1, 'Current password is required'),
  new_password: z.string()
    .min(8, 'New password must be at least 8 characters')
    .max(100, 'New password must be less than 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirm_password: z.string()
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Password confirmation does not match',
  path: ['confirm_password']
})

// ============================================================================
// Client User Management
// ============================================================================

export const clientUserCreateSchema = z.object({
  user_profile_id: z.string().uuid('Invalid user profile ID format'),
  client_company_id: z.string().uuid('Invalid client company ID format'),
  access_level: clientAccessLevelSchema.default('view_only'),
  portal_access_enabled: z.boolean().default(true),
  two_factor_enabled: z.boolean().default(false),
  notification_preferences: z.record(z.any()).default({}),
  language: z.string().max(10).default('en'),
  timezone: z.string().max(50).default('UTC'),
  theme: z.string().max(20).default('light')
})

export const clientUserUpdateSchema = z.object({
  access_level: clientAccessLevelSchema.optional(),
  portal_access_enabled: z.boolean().optional(),
  two_factor_enabled: z.boolean().optional(),
  notification_preferences: z.record(z.any()).optional(),
  language: z.string().max(10).optional(),
  timezone: z.string().max(50).optional(),
  theme: z.string().max(20).optional(),
  password_reset_required: z.boolean().optional()
})

// ============================================================================
// Client Company Management
// ============================================================================

export const clientCompanyCreateSchema = z.object({
  company_name: z.string()
    .min(1, 'Company name is required')
    .max(200, 'Company name must be less than 200 characters'),
  company_type: clientCompanyTypeSchema,
  contact_person: z.string()
    .max(100, 'Contact person name must be less than 100 characters')
    .optional(),
  primary_email: z.string()
    .email('Invalid email format')
    .max(100, 'Email must be less than 100 characters')
    .optional(),
  primary_phone: z.string()
    .max(20, 'Phone number must be less than 20 characters')
    .refine(
      (phone) => !phone || /^[\+]?[1-9][\d\s\-\(\)\.]{7,20}$/.test(phone),
      'Invalid phone number format'
    )
    .optional(),
  address: z.string()
    .max(500, 'Address must be less than 500 characters')
    .optional(),
  billing_address: z.string()
    .max(500, 'Billing address must be less than 500 characters')
    .optional(),
  tax_id: z.string()
    .max(50, 'Tax ID must be less than 50 characters')
    .optional(),
  logo_url: z.string()
    .url('Invalid logo URL format')
    .optional(),
  brand_colors: z.record(z.string()).optional(),
  custom_domain: z.string()
    .max(100, 'Custom domain must be less than 100 characters')
    .optional()
})

export const clientCompanyUpdateSchema = clientCompanyCreateSchema.partial().extend({
  is_active: z.boolean().optional()
})

// ============================================================================
// Project Access Management
// ============================================================================

export const clientProjectAccessCreateSchema = z.object({
  client_user_id: z.string().uuid('Invalid client user ID format'),
  project_id: z.string().uuid('Invalid project ID format'),
  access_level: clientProjectAccessLevelSchema.default('viewer'),
  can_view_financials: z.boolean().default(false),
  can_approve_documents: z.boolean().default(false),
  can_view_schedules: z.boolean().default(true),
  can_access_reports: z.boolean().default(true),
  restricted_areas: z.array(z.string()).default([]),
  access_start_date: z.string()
    .refine((date) => !isNaN(Date.parse(date)), 'Invalid start date format')
    .optional(),
  access_end_date: z.string()
    .refine((date) => !isNaN(Date.parse(date)), 'Invalid end date format')
    .optional()
}).refine((data) => {
  if (data.access_start_date && data.access_end_date) {
    return new Date(data.access_start_date) <= new Date(data.access_end_date)
  }
  return true
}, {
  message: 'Access end date must be after start date',
  path: ['access_end_date']
})

export const clientProjectAccessUpdateSchema = clientProjectAccessCreateSchema.omit({
  client_user_id: true,
  project_id: true
}).partial()

// ============================================================================
// Document Management
// ============================================================================

export const clientDocumentAccessCreateSchema = z.object({
  client_user_id: z.string().uuid('Invalid client user ID format'),
  document_id: z.string().uuid('Invalid document ID format'),
  access_type: clientDocumentAccessTypeSchema.default('view'),
  can_download: z.boolean().default(true),
  can_comment: z.boolean().default(true),
  can_approve: z.boolean().default(false),
  watermarked: z.boolean().default(false)
})

export const clientDocumentApprovalSchema = z.object({
  document_id: z.string().uuid('Invalid document ID format'),
  approval_decision: clientApprovalDecisionSchema,
  approval_comments: z.string()
    .max(1000, 'Approval comments must be less than 1000 characters')
    .optional(),
  approval_conditions: z.array(z.string().max(200))
    .max(10, 'Maximum 10 approval conditions allowed')
    .default([]),
  digital_signature: z.record(z.any()).optional(),
  document_version: z.number().int().positive('Document version must be positive'),
  revision_letter: z.string().max(5).optional()
})

export const clientDocumentCommentSchema = z.object({
  document_id: z.string().uuid('Invalid document ID format'),
  comment_text: z.string()
    .min(1, 'Comment text is required')
    .max(2000, 'Comment text must be less than 2000 characters'),
  comment_type: clientCommentTypeSchema.default('general'),
  priority: clientPrioritySchema.default('medium'),
  page_number: z.number().int().positive().optional(),
  x_coordinate: z.number().optional(),
  y_coordinate: z.number().optional(),
  markup_data: z.record(z.any()).optional(),
  parent_comment_id: z.string().uuid('Invalid parent comment ID format').optional()
})

export const clientDocumentCommentUpdateSchema = z.object({
  comment_text: z.string()
    .min(1, 'Comment text is required')
    .max(2000, 'Comment text must be less than 2000 characters')
    .optional(),
  comment_type: clientCommentTypeSchema.optional(),
  priority: clientPrioritySchema.optional(),
  status: clientCommentStatusSchema.optional(),
  markup_data: z.record(z.any()).optional()
})

// ============================================================================
// Communication Management
// ============================================================================

export const clientThreadCreateSchema = z.object({
  project_id: z.string().uuid('Invalid project ID format'),
  subject: z.string()
    .min(1, 'Subject is required')
    .max(300, 'Subject must be less than 300 characters'),
  thread_type: clientThreadTypeSchema.default('general'),
  priority: clientPrioritySchema.default('medium'),
  internal_participants: z.array(z.string().uuid()).default([]),
  client_participants: z.array(z.string().uuid()).default([]),
  auto_close_after_days: z.number().int().positive().max(365).optional(),
  requires_response: z.boolean().default(false),
  response_deadline: z.string()
    .refine((date) => !isNaN(Date.parse(date)), 'Invalid response deadline format')
    .optional()
})

export const clientThreadUpdateSchema = z.object({
  subject: z.string()
    .min(1, 'Subject is required')
    .max(300, 'Subject must be less than 300 characters')
    .optional(),
  thread_type: clientThreadTypeSchema.optional(),
  priority: clientPrioritySchema.optional(),
  status: clientThreadStatusSchema.optional(),
  internal_participants: z.array(z.string().uuid()).optional(),
  client_participants: z.array(z.string().uuid()).optional(),
  auto_close_after_days: z.number().int().positive().max(365).optional(),
  requires_response: z.boolean().optional(),
  response_deadline: z.string()
    .refine((date) => !isNaN(Date.parse(date)), 'Invalid response deadline format')
    .optional()
})

export const clientMessageCreateSchema = z.object({
  thread_id: z.string().uuid('Invalid thread ID format'),
  message_body: z.string()
    .min(1, 'Message body is required')
    .max(5000, 'Message body must be less than 5000 characters'),
  message_type: clientMessageTypeSchema.default('text'),
  attachments: z.array(z.object({
    name: z.string().max(255),
    url: z.string().url(),
    type: z.string().max(50),
    size: z.number().positive()
  })).max(10, 'Maximum 10 attachments allowed').default([])
})

// ============================================================================
// Notification Management
// ============================================================================

export const clientNotificationCreateSchema = z.object({
  client_user_id: z.string().uuid('Invalid client user ID format'),
  project_id: z.string().uuid('Invalid project ID format').optional(),
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  message: z.string()
    .min(1, 'Message is required')
    .max(1000, 'Message must be less than 1000 characters'),
  notification_type: clientNotificationTypeSchema,
  priority: clientPrioritySchema.default('medium'),
  delivery_method: z.array(clientDeliveryMethodSchema).default(['in_app']),
  scheduled_for: z.string()
    .refine((date) => !isNaN(Date.parse(date)), 'Invalid scheduled date format')
    .optional()
})

export const clientNotificationPreferencesSchema = z.object({
  email_notifications: z.boolean().default(true),
  sms_notifications: z.boolean().default(false),
  push_notifications: z.boolean().default(true),
  notification_types: z.record(
    clientNotificationTypeSchema,
    z.object({
      enabled: z.boolean(),
      delivery_methods: z.array(clientDeliveryMethodSchema)
    })
  ).default({}),
  quiet_hours: z.object({
    enabled: z.boolean().default(false),
    start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    timezone: z.string().optional()
  }).optional()
})

// ============================================================================
// Activity Logging
// ============================================================================

export const clientActivityLogCreateSchema = z.object({
  client_user_id: z.string().uuid('Invalid client user ID format'),
  project_id: z.string().uuid('Invalid project ID format').optional(),
  activity_type: clientActivityTypeSchema,
  resource_type: z.string().max(50).optional(),
  resource_id: z.string().uuid().optional(),
  action_taken: z.string()
    .min(1, 'Action taken is required')
    .max(100, 'Action taken must be less than 100 characters'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  metadata: z.record(z.any()).default({}),
  ip_address: z.string().ip().optional(),
  user_agent: z.string().max(500).optional(),
  session_id: z.string().max(100).optional()
})

// ============================================================================
// Query Parameter Validation
// ============================================================================

export const clientDocumentListParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  project_id: z.string().uuid().optional(),
  document_type: z.array(z.string()).optional(),
  status: z.array(z.string()).optional(),
  requires_approval: z.boolean().optional(),
  date_start: z.string().optional(),
  date_end: z.string().optional(),
  search: z.string().max(100).optional(),
  sort_field: z.enum(['created_at', 'name', 'type', 'status']).default('created_at'),
  sort_direction: z.enum(['asc', 'desc']).default('desc')
})

export const clientNotificationListParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  notification_type: z.array(clientNotificationTypeSchema).optional(),
  priority: z.array(clientPrioritySchema).optional(),
  is_read: z.boolean().optional(),
  date_start: z.string().optional(),
  date_end: z.string().optional(),
  sort_field: z.enum(['created_at', 'priority']).default('created_at'),
  sort_direction: z.enum(['asc', 'desc']).default('desc')
})

export const clientActivityListParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  activity_type: z.array(clientActivityTypeSchema).optional(),
  project_id: z.string().uuid().optional(),
  date_start: z.string().optional(),
  date_end: z.string().optional(),
  sort_field: z.enum(['created_at', 'activity_type']).default('created_at'),
  sort_direction: z.enum(['asc', 'desc']).default('desc')
})

export const clientThreadListParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  thread_type: z.array(clientThreadTypeSchema).optional(),
  status: z.array(clientThreadStatusSchema).optional(),
  priority: z.array(clientPrioritySchema).optional(),
  project_id: z.string().uuid().optional(),
  date_start: z.string().optional(),
  date_end: z.string().optional(),
  sort_field: z.enum(['created_at', 'last_message_at', 'priority']).default('last_message_at'),
  sort_direction: z.enum(['asc', 'desc']).default('desc')
})

export const clientProjectListParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  status: z.array(z.string()).optional(),
  search: z.string().max(100).optional(),
  sort_field: z.enum(['created_at', 'name', 'status']).default('name'),
  sort_direction: z.enum(['asc', 'desc']).default('asc')
})

// ============================================================================
// Validation Helper Functions
// ============================================================================

export const validateClientPortalInput = <T>(
  schema: z.ZodSchema<T>, 
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } => {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  } else {
    return { success: false, error: result.error }
  }
}

export const validateClientPortalQueryParams = <T>(
  schema: z.ZodSchema<T>, 
  params: Record<string, any>
): { success: true; data: T } | { success: false; error: z.ZodError } => {
  // Convert string parameters to appropriate types
  const processedParams = Object.entries(params).reduce((acc, [key, value]) => {
    if (value === null || value === undefined || value === '') {
      return acc
    }
    
    // Convert numeric parameters
    if (['page', 'limit'].includes(key)) {
      const numValue = Number(value)
      if (!isNaN(numValue)) {
        acc[key] = numValue
      }
    }
    // Convert boolean parameters
    else if (['requires_approval', 'is_read'].includes(key)) {
      acc[key] = value === 'true'
    }
    // Convert array parameters
    else if (['document_type', 'status', 'notification_type', 'priority', 'activity_type', 'thread_type'].includes(key) && typeof value === 'string') {
      acc[key] = value.split(',').filter(Boolean)
    }
    // Keep string parameters as is
    else {
      acc[key] = value
    }
    
    return acc
  }, {} as Record<string, any>)
  
  return validateClientPortalInput(schema, processedParams)
}

// ============================================================================
// Security Validation
// ============================================================================

export const clientSessionValidationSchema = z.object({
  session_id: z.string().min(1, 'Session ID is required'),
  client_user_id: z.string().uuid('Invalid client user ID format'),
  ip_address: z.string().ip().optional(),
  user_agent: z.string().max(500).optional(),
  expires_at: z.date().refine(date => date > new Date(), 'Session has expired')
})

export const clientRateLimitSchema = z.object({
  identifier: z.string().min(1, 'Rate limit identifier is required'),
  max_requests: z.number().int().positive().default(100),
  window_ms: z.number().int().positive().default(15 * 60 * 1000) // 15 minutes
})

// ============================================================================
// Error Formatting
// ============================================================================

export const formatClientPortalValidationError = (error: z.ZodError): string => {
  return error.errors.map(err => err.message).join(', ')
}

export const formatClientPortalValidationDetails = (error: z.ZodError): Array<{ field: string; message: string }> => {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }))
}

// ============================================================================
// File Upload Validation
// ============================================================================

export const clientFileUploadSchema = z.object({
  file_name: z.string()
    .min(1, 'File name is required')
    .max(255, 'File name must be less than 255 characters')
    .refine(
      (name) => !/[<>:"/\\|?*]/.test(name),
      'File name contains invalid characters'
    ),
  file_type: z.string()
    .min(1, 'File type is required')
    .max(50, 'File type must be less than 50 characters'),
  file_size: z.number()
    .positive('File size must be positive')
    .max(50 * 1024 * 1024, 'File size must be less than 50MB'), // 50MB limit
  content_type: z.string()
    .min(1, 'Content type is required')
    .refine(
      (type) => [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
        'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'text/csv'
      ].includes(type),
      'Unsupported file type'
    )
})

export const clientBulkOperationSchema = z.object({
  operation: z.enum(['mark_read', 'mark_unread', 'delete', 'archive']),
  item_ids: z.array(z.string().uuid())
    .min(1, 'At least one item must be selected')
    .max(100, 'Maximum 100 items can be processed at once')
})