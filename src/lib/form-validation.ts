/**
 * Form Validation Utilities - OPTIMIZATION PHASE 2.1
 * Centralized validation patterns to reduce form code duplication
 */

import { z } from 'zod'

// Common validation schemas
export const commonSchemas = {
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number'),
  url: z.string().url('Invalid URL'),
  required: z.string().min(1, 'This field is required'),
  optionalString: z.string().optional(),
  positiveNumber: z.number().positive('Must be a positive number'),
  percentage: z.number().min(0).max(100, 'Must be between 0 and 100'),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),
  uuid: z.string().uuid('Invalid ID format')
}

// Project-specific schemas
export const projectSchemas = {
  project: z.object({
    name: commonSchemas.required,
    description: commonSchemas.optionalString,
    location: commonSchemas.optionalString,
    start_date: commonSchemas.date,
    end_date: commonSchemas.date,
    budget: commonSchemas.positiveNumber.optional(),
    project_type: z.enum(['residential', 'commercial', 'industrial', 'infrastructure']),
    status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled'])
  }),

  scopeItem: z.object({
    title: commonSchemas.required,
    description: commonSchemas.required,
    category: z.enum(['construction', 'millwork', 'electrical', 'mechanical']),
    quantity: commonSchemas.positiveNumber,
    unit: commonSchemas.required,
    unit_price: commonSchemas.positiveNumber.optional(),
    timeline_start: commonSchemas.date.optional(),
    timeline_end: commonSchemas.date.optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    status: z.enum(['pending', 'in_progress', 'completed', 'on_hold', 'cancelled']).default('pending')
  }),

  task: z.object({
    title: commonSchemas.required,
    description: commonSchemas.optionalString,
    priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).default('pending'),
    due_date: commonSchemas.date.optional(),
    assigned_to: commonSchemas.uuid.optional(),
    project_id: commonSchemas.uuid,
    scope_item_id: commonSchemas.uuid.optional()
  }),

  materialSpec: z.object({
    name: commonSchemas.required,
    description: commonSchemas.required,
    specification: commonSchemas.optionalString,
    unit: commonSchemas.required,
    unit_price: commonSchemas.positiveNumber,
    minimum_quantity: commonSchemas.positiveNumber.default(1),
    supplier_id: commonSchemas.uuid.optional(),
    project_id: commonSchemas.uuid,
    delivery_date: commonSchemas.date.optional()
  }),

  userProfile: z.object({
    first_name: commonSchemas.required,
    last_name: commonSchemas.required,
    email: commonSchemas.email,
    phone: commonSchemas.phone.optional(),
    role: z.enum([
      'management', 'management', 'management',
      'technical_lead', 'admin', 'project_manager', 'project_manager',
      'project_manager', 'purchase_manager', 'purchase_manager',
      'project_manager', 'client', 'project_manager'
    ]),
    company: commonSchemas.optionalString,
    department: commonSchemas.optionalString
  }),

  // Authentication schemas
  login: z.object({
    email: z.string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address')
      .transform(val => val.trim().toLowerCase()),
    password: z.string()
      .min(1, 'Password is required')
      .min(6, 'Password must be at least 6 characters')
  }),

  register: z.object({
    email: z.string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address')
      .transform(val => val.trim().toLowerCase()),
    password: z.string()
      .min(6, 'Password must be at least 6 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    confirmPassword: z.string()
      .min(1, 'Please confirm your password'),
    firstName: z.string()
      .min(1, 'First name is required')
      .max(50, 'First name must be less than 50 characters'),
    lastName: z.string()
      .min(1, 'Last name is required')
      .max(50, 'Last name must be less than 50 characters')
  }).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  }),

  // Milestone schema
  milestone: z.object({
    name: z.string()
      .min(1, 'Name is required')
      .max(200, 'Name must be less than 200 characters'),
    description: z.string().optional(),
    target_date: z.string()
      .min(1, 'Target date is required'),
    status: z.enum(['upcoming', 'in_progress', 'completed', 'overdue', 'cancelled'])
      .default('upcoming')
  })
}

// Validation result type
export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: Record<string, string[]>
  fieldErrors?: Record<string, string>
}

// Generic validation function
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const validatedData = schema.parse(data)
    return {
      success: true,
      data: validatedData
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {}
      const errors: Record<string, string[]> = {}

      error.errors.forEach((err) => {
        const field = err.path.join('.')
        const message = err.message

        if (!errors[field]) {
          errors[field] = []
        }
        errors[field].push(message)
        
        // Also provide first error for each field
        if (!fieldErrors[field]) {
          fieldErrors[field] = message
        }
      })

      return {
        success: false,
        errors,
        fieldErrors
      }
    }

    return {
      success: false,
      errors: { general: ['Validation failed'] },
      fieldErrors: { general: 'Validation failed' }
    }
  }
}

// Field-level validation for real-time feedback
export function validateField<T>(
  schema: z.ZodSchema<T>,
  fieldName: string,
  value: any,
  allData?: Partial<T>
): string | null {
  try {
    // Check if schema is a ZodObject that has a shape property
    if (!('shape' in schema)) return null
    
    // Create a partial schema for just this field
    const fieldSchema = (schema as any).shape?.[fieldName]
    if (!fieldSchema) return null

    fieldSchema.parse(value)
    return null
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || 'Invalid value'
    }
    return 'Validation error'
  }
}

// Custom validation rules
export const customValidators = {
  // Date range validation
  dateRange: (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    return start <= end ? null : 'End date must be after start date'
  },

  // Password strength
  passwordStrength: (password: string) => {
    const hasUpper = /[A-Z]/.test(password)
    const hasLower = /[a-z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    
    if (password.length < 8) return 'Password must be at least 8 characters'
    if (!hasUpper) return 'Password must contain uppercase letter'
    if (!hasLower) return 'Password must contain lowercase letter'
    if (!hasNumber) return 'Password must contain number'
    if (!hasSpecial) return 'Password must contain special character'
    
    return null
  },

  // File validation
  fileValidation: (file: File, maxSize: number = 5 * 1024 * 1024, allowedTypes: string[] = []) => {
    if (file.size > maxSize) {
      return `File size must be less than ${maxSize / 1024 / 1024}MB`
    }
    
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return `File type must be one of: ${allowedTypes.join(', ')}`
    }
    
    return null
  },

  // Unique validation (async)
  uniqueEmail: async (email: string, excludeId?: string) => {
    try {
      const response = await fetch('/api/validate/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, excludeId })
      })
      
      const result = await response.json()
      return result.isUnique ? null : 'Email already exists'
    } catch {
      return 'Unable to validate email uniqueness'
    }
  }
}

// Form state management helper
export class FormValidator<T> {
  private schema: z.ZodSchema<T>
  private errors: Record<string, string> = {}
  private touched: Record<string, boolean> = {}

  constructor(schema: z.ZodSchema<T>) {
    this.schema = schema
  }

  validateField(name: string, value: any): string | null {
    const error = validateField(this.schema, name, value)
    
    if (error) {
      this.errors[name] = error
    } else {
      delete this.errors[name]
    }
    
    this.touched[name] = true
    return error
  }

  validateAll(data: unknown): ValidationResult<T> {
    const result = validateData(this.schema, data)
    
    if (!result.success && result.fieldErrors) {
      this.errors = result.fieldErrors
      // Mark all fields as touched
      Object.keys(result.fieldErrors).forEach(field => {
        this.touched[field] = true
      })
    } else {
      this.errors = {}
    }
    
    return result
  }

  getFieldError(name: string): string | null {
    return this.touched[name] ? this.errors[name] || null : null
  }

  hasErrors(): boolean {
    return Object.keys(this.errors).length > 0
  }

  clearErrors(): void {
    this.errors = {}
    this.touched = {}
  }

  clearFieldError(name: string): void {
    delete this.errors[name]
    delete this.touched[name]
  }
}
