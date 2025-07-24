import { z } from 'zod'
import { UserRole } from '@/types/auth'

// User Role enum for validation
const UserRoleEnum = z.enum([
  'management',
  'management',
  'management',
  'technical_lead',
  'admin',
  'project_manager',
  'project_manager',
  'project_manager',
  'purchase_manager',
  'purchase_manager',
  'project_manager',
  'client',
])

// Email validation
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(1, 'Email is required')
  .max(254, 'Email is too long')
  .transform(val => val.trim().toLowerCase())

// Password validation with strength requirements
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password is too long')
  .refine(
    (password) => /[A-Z]/.test(password),
    'Password must contain at least one uppercase letter'
  )
  .refine(
    (password) => /[a-z]/.test(password),
    'Password must contain at least one lowercase letter'
  )
  .refine(
    (password) => /\d/.test(password),
    'Password must contain at least one number'
  )

// Phone number validation (international format)
export const phoneSchema = z
  .string()
  .optional()
  .refine(
    (phone) => !phone || /^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[-\s\(\)]/g, '')),
    'Invalid phone number format'
  )

// Name validation
export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(50, 'Name is too long')
  .regex(/^[a-zA-Z\s-']+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
  .transform(val => val.trim())

// Company/Department validation
export const companyFieldSchema = z
  .string()
  .optional()
  .refine(
    (val) => !val || (val.trim().length >= 2 && val.trim().length <= 100),
    'Company/Department name must be between 2 and 100 characters'
  )
  .transform(val => val?.trim() || null)

// Login credentials validation
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
})

// Registration data validation
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  first_name: nameSchema,
  last_name: nameSchema,
  role: UserRoleEnum,
  phone: phoneSchema,
  company: companyFieldSchema,
  department: companyFieldSchema
})

// Password reset request validation
export const resetPasswordRequestSchema = z.object({
  email: emailSchema
})

// Password reset confirmation validation
export const resetPasswordConfirmSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string()
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  }
)

// Change password validation
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string()
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: 'New passwords do not match',
    path: ['confirmPassword']
  }
).refine(
  (data) => data.currentPassword !== data.newPassword,
  {
    message: 'New password must be different from current password',
    path: ['newPassword']
  }
)

// Profile update validation
export const profileUpdateSchema = z.object({
  first_name: nameSchema.optional(),
  last_name: nameSchema.optional(),
  phone: phoneSchema,
  department: companyFieldSchema
}).partial()

// User creation by admin validation
export const adminCreateUserSchema = z.object({
  email: emailSchema,
  first_name: nameSchema,
  last_name: nameSchema,
  role: UserRoleEnum,
  phone: phoneSchema,
  company: companyFieldSchema,
  department: companyFieldSchema,
  send_invitation: z.boolean().optional().default(true)
})

// User role update validation
export const updateUserRoleSchema = z.object({
  role: UserRoleEnum
})

// User status update validation
export const updateUserStatusSchema = z.object({
  is_active: z.boolean()
})

// Validation helper functions
export const validateInput = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } => {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => err.message)
      return { success: false, errors }
    }
    return { success: false, errors: ['Validation failed'] }
  }
}

// Async validation helper
export const validateInputAsync = async <T>(
  schema: z.ZodSchema<T>, 
  data: unknown
): Promise<{ success: true; data: T } | { success: false; errors: string[] }> => {
  try {
    const validatedData = await schema.parseAsync(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => err.message)
      return { success: false, errors }
    }
    return { success: false, errors: ['Validation failed'] }
  }
}

// Password strength checker
export const checkPasswordStrength = (password: string): {
  score: number
  feedback: string[]
  isStrong: boolean
} => {
  const feedback: string[] = []
  let score = 0

  // Length check
  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push('Use at least 8 characters')
  }

  if (password.length >= 12) {
    score += 1
  } else if (password.length >= 8) {
    feedback.push('Consider using 12+ characters for better security')
  }

  // Character variety checks
  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Add lowercase letters')
  }

  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Add uppercase letters')
  }

  if (/\d/.test(password)) {
    score += 1
  } else {
    feedback.push('Add numbers')
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1
  } else {
    feedback.push('Add special characters (!@#$%^&*)')
  }

  // Common patterns to avoid
  if (/(.)\1{2,}/.test(password)) {
    score -= 1
    feedback.push('Avoid repeating characters')
  }

  if (/123|abc|qwe|password|admin/i.test(password)) {
    score -= 2
    feedback.push('Avoid common patterns and dictionary words')
  }

  const isStrong = score >= 5
  
  return {
    score: Math.max(0, Math.min(6, score)),
    feedback,
    isStrong
  }
}

// Email domain validation for organizational emails
export const validateEmailDomain = (email: string, allowedDomains?: string[]): boolean => {
  if (!allowedDomains || allowedDomains.length === 0) {
    return true
  }

  const domain = email.split('@')[1]?.toLowerCase()
  return allowedDomains.some(allowedDomain => 
    domain === allowedDomain.toLowerCase()
  )
}

// Role validation helpers
export const canAssignRole = (assignerRole: UserRole, targetRole: UserRole): boolean => {
  const roleHierarchy: Record<UserRole, number> = {
    'management': 100,
    'admin': 90,
    'technical_lead': 60,
    'project_manager': 50,
    'purchase_manager': 45,
    'client': 10
  }

  // Only company owners and admins can assign admin roles
  if (['management', 'admin'].includes(targetRole)) {
    return ['management', 'admin'].includes(assignerRole)
  }

  // Higher hierarchy can assign lower roles
  return roleHierarchy[assignerRole] > roleHierarchy[targetRole]
}

export type {
  UserRole
}