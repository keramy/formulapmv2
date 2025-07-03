/**
 * Purchase Department Workflow Validation Schemas
 * Following Formula PM's validation patterns using Zod
 */

import { z } from 'zod'

// Enum schemas
export const urgencyLevelSchema = z.enum(['low', 'normal', 'high', 'emergency'])
export const requestStatusSchema = z.enum(['draft', 'pending_approval', 'approved', 'rejected', 'cancelled'])
export const poStatusSchema = z.enum(['draft', 'sent', 'confirmed', 'delivered', 'completed', 'cancelled'])
export const approvalStatusSchema = z.enum(['pending', 'approved', 'rejected', 'delegated'])
export const deliveryStatusSchema = z.enum(['pending', 'partial', 'completed', 'damaged', 'rejected'])

// Purchase Request Validation
export const purchaseRequestCreateSchema = z.object({
  project_id: z.string().uuid('Invalid project ID format'),
  item_description: z.string()
    .min(1, 'Item description is required')
    .max(500, 'Item description must be less than 500 characters'),
  quantity: z.number()
    .positive('Quantity must be positive')
    .max(999999, 'Quantity must be less than 999,999'),
  unit_of_measure: z.string()
    .min(1, 'Unit of measure is required')
    .max(20, 'Unit of measure must be less than 20 characters'),
  estimated_cost: z.number()
    .positive('Estimated cost must be positive')
    .max(9999999.99, 'Estimated cost must be less than 9,999,999.99')
    .optional(),
  required_date: z.string()
    .refine(
      (date) => {
        const reqDate = new Date(date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return reqDate >= today
      },
      'Required date must be today or in the future'
    ),
  urgency_level: urgencyLevelSchema.default('normal'),
  justification: z.string()
    .max(1000, 'Justification must be less than 1000 characters')
    .optional()
})

export const purchaseRequestUpdateSchema = z.object({
  item_description: z.string()
    .min(1, 'Item description is required')
    .max(500, 'Item description must be less than 500 characters')
    .optional(),
  quantity: z.number()
    .positive('Quantity must be positive')
    .max(999999, 'Quantity must be less than 999,999')
    .optional(),
  unit_of_measure: z.string()
    .min(1, 'Unit of measure is required')
    .max(20, 'Unit of measure must be less than 20 characters')
    .optional(),
  estimated_cost: z.number()
    .positive('Estimated cost must be positive')
    .max(9999999.99, 'Estimated cost must be less than 9,999,999.99')
    .optional(),
  required_date: z.string()
    .refine(
      (date) => {
        const reqDate = new Date(date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return reqDate >= today
      },
      'Required date must be today or in the future'
    )
    .optional(),
  urgency_level: urgencyLevelSchema.optional(),
  justification: z.string()
    .max(1000, 'Justification must be less than 1000 characters')
    .optional(),
  status: requestStatusSchema.optional()
})

// Purchase Order Validation
export const purchaseOrderCreateSchema = z.object({
  purchase_request_id: z.string().uuid('Invalid purchase request ID format'),
  vendor_id: z.string().uuid('Invalid vendor ID format'),
  total_amount: z.number()
    .positive('Total amount must be positive')
    .max(9999999.99, 'Total amount must be less than 9,999,999.99'),
  po_date: z.string()
    .refine(
      (date) => {
        const poDate = new Date(date)
        const today = new Date()
        today.setHours(23, 59, 59, 999)
        return poDate <= today
      },
      'PO date cannot be in the future'
    ),
  expected_delivery_date: z.string()
    .refine(
      (date) => {
        const deliveryDate = new Date(date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return deliveryDate >= today
      },
      'Expected delivery date must be today or in the future'
    )
    .optional(),
  terms_conditions: z.string()
    .max(2000, 'Terms and conditions must be less than 2000 characters')
    .optional()
})

export const purchaseOrderUpdateSchema = z.object({
  vendor_id: z.string().uuid('Invalid vendor ID format').optional(),
  total_amount: z.number()
    .positive('Total amount must be positive')
    .max(9999999.99, 'Total amount must be less than 9,999,999.99')
    .optional(),
  po_date: z.string()
    .refine(
      (date) => {
        const poDate = new Date(date)
        const today = new Date()
        today.setHours(23, 59, 59, 999)
        return poDate <= today
      },
      'PO date cannot be in the future'
    )
    .optional(),
  expected_delivery_date: z.string()
    .refine(
      (date) => {
        const deliveryDate = new Date(date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return deliveryDate >= today
      },
      'Expected delivery date must be today or in the future'
    )
    .optional(),
  terms_conditions: z.string()
    .max(2000, 'Terms and conditions must be less than 2000 characters')
    .optional(),
  status: poStatusSchema.optional()
})

// Vendor Validation
export const vendorCreateSchema = z.object({
  company_name: z.string()
    .min(1, 'Company name is required')
    .max(200, 'Company name must be less than 200 characters'),
  contact_person: z.string()
    .max(100, 'Contact person name must be less than 100 characters')
    .optional(),
  email: z.string()
    .email('Invalid email format')
    .max(100, 'Email must be less than 100 characters')
    .optional(),
  phone: z.string()
    .max(20, 'Phone number must be less than 20 characters')
    .refine(
      (phone) => !phone || /^[\+]?[1-9][\d\s\-\(\)\.]{7,20}$/.test(phone),
      'Invalid phone number format'
    )
    .optional(),
  address: z.string()
    .max(500, 'Address must be less than 500 characters')
    .optional(),
  payment_terms: z.string()
    .max(50, 'Payment terms must be less than 50 characters')
    .optional()
})

export const vendorUpdateSchema = z.object({
  company_name: z.string()
    .min(1, 'Company name is required')
    .max(200, 'Company name must be less than 200 characters')
    .optional(),
  contact_person: z.string()
    .max(100, 'Contact person name must be less than 100 characters')
    .optional(),
  email: z.string()
    .email('Invalid email format')
    .max(100, 'Email must be less than 100 characters')
    .optional(),
  phone: z.string()
    .max(20, 'Phone number must be less than 20 characters')
    .refine(
      (phone) => !phone || /^[\+]?[1-9][\d\s\-\(\)\.]{7,20}$/.test(phone),
      'Invalid phone number format'
    )
    .optional(),
  address: z.string()
    .max(500, 'Address must be less than 500 characters')
    .optional(),
  payment_terms: z.string()
    .max(50, 'Payment terms must be less than 50 characters')
    .optional(),
  is_active: z.boolean().optional()
})

// Vendor Rating Validation
export const vendorRatingCreateSchema = z.object({
  vendor_id: z.string().uuid('Invalid vendor ID format'),
  project_id: z.string().uuid('Invalid project ID format'),
  quality_score: z.number()
    .int('Quality score must be a whole number')
    .min(1, 'Quality score must be between 1 and 5')
    .max(5, 'Quality score must be between 1 and 5'),
  delivery_score: z.number()
    .int('Delivery score must be a whole number')
    .min(1, 'Delivery score must be between 1 and 5')
    .max(5, 'Delivery score must be between 1 and 5'),
  communication_score: z.number()
    .int('Communication score must be a whole number')
    .min(1, 'Communication score must be between 1 and 5')
    .max(5, 'Communication score must be between 1 and 5'),
  overall_score: z.number()
    .int('Overall score must be a whole number')
    .min(1, 'Overall score must be between 1 and 5')
    .max(5, 'Overall score must be between 1 and 5'),
  comments: z.string()
    .max(500, 'Comments must be less than 500 characters')
    .optional()
})

// Approval Action Validation
export const approvalActionSchema = z.object({
  approval_status: approvalStatusSchema,
  comments: z.string()
    .max(500, 'Comments must be less than 500 characters')
    .optional()
})

// Delivery Confirmation Validation
export const deliveryConfirmationSchema = z.object({
  delivery_date: z.string()
    .refine(
      (date) => {
        const deliveryDate = new Date(date)
        const today = new Date()
        today.setHours(23, 59, 59, 999)
        return deliveryDate <= today
      },
      'Delivery date cannot be in the future'
    ),
  quantity_received: z.number()
    .nonnegative('Quantity received must be non-negative')
    .max(999999, 'Quantity received must be less than 999,999'),
  quantity_ordered: z.number()
    .positive('Quantity ordered must be positive')
    .max(999999, 'Quantity ordered must be less than 999,999'),
  condition_notes: z.string()
    .max(1000, 'Condition notes must be less than 1000 characters')
    .optional(),
  photos: z.array(z.string().url('Invalid photo URL'))
    .max(10, 'Maximum 10 photos allowed')
    .optional(),
  status: deliveryStatusSchema
})

// Query Parameter Validation
export const purchaseRequestListParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  project_id: z.string().uuid().optional(),
  status: z.array(requestStatusSchema).optional(),
  urgency_level: z.array(urgencyLevelSchema).optional(),
  requester_id: z.string().uuid().optional(),
  date_start: z.string().optional(),
  date_end: z.string().optional(),
  cost_min: z.number().nonnegative().optional(),
  cost_max: z.number().positive().optional(),
  search: z.string().max(100).optional(),
  sort_field: z.enum(['created_at', 'required_date', 'estimated_cost', 'urgency_level']).default('created_at'),
  sort_direction: z.enum(['asc', 'desc']).default('desc')
})

export const purchaseOrderListParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  vendor_id: z.string().uuid().optional(),
  status: z.array(poStatusSchema).optional(),
  date_start: z.string().optional(),
  date_end: z.string().optional(),
  amount_min: z.number().nonnegative().optional(),
  amount_max: z.number().positive().optional(),
  search: z.string().max(100).optional(),
  sort_field: z.enum(['created_at', 'po_date', 'total_amount', 'expected_delivery_date']).default('created_at'),
  sort_direction: z.enum(['asc', 'desc']).default('desc')
})

export const vendorListParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  is_active: z.boolean().optional(),
  rating_min: z.number().min(1).max(5).optional(),
  search: z.string().max(100).optional(),
  sort_field: z.enum(['created_at', 'company_name', 'average_rating']).default('company_name'),
  sort_direction: z.enum(['asc', 'desc']).default('asc')
})

// Helper function to validate input
export const validatePurchaseInput = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: z.ZodError } => {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  } else {
    return { success: false, error: result.error }
  }
}

// Helper function to validate list parameters
export const validatePurchaseListParams = <T>(schema: z.ZodSchema<T>, params: Record<string, any>): { success: true; data: T } | { success: false; error: z.ZodError } => {
  // Convert string parameters to appropriate types
  const processedParams = Object.entries(params).reduce((acc, [key, value]) => {
    if (value === null || value === undefined || value === '') {
      return acc
    }
    
    // Convert numeric parameters
    if (['page', 'limit', 'cost_min', 'cost_max', 'amount_min', 'amount_max', 'rating_min'].includes(key)) {
      const numValue = Number(value)
      if (!isNaN(numValue)) {
        acc[key] = numValue
      }
    }
    // Convert boolean parameters
    else if (['is_active'].includes(key)) {
      acc[key] = value === 'true'
    }
    // Convert array parameters
    else if (['status', 'urgency_level'].includes(key) && typeof value === 'string') {
      acc[key] = value.split(',').filter(Boolean)
    }
    // Keep string parameters as is
    else {
      acc[key] = value
    }
    
    return acc
  }, {} as Record<string, any>)
  
  return validatePurchaseInput(schema, processedParams)
}

// Email validation
export const emailNotificationSchema = z.object({
  to: z.string().email('Invalid email format'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject must be less than 200 characters'),
  template: z.string().min(1, 'Template is required'),
  data: z.record(z.any())
})

// Utility functions
export const formatValidationError = (error: z.ZodError): string => {
  return error.errors.map(err => err.message).join(', ')
}

export const formatValidationDetails = (error: z.ZodError): Array<{ field: string; message: string }> => {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }))
}