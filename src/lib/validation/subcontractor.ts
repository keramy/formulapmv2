/**
 * Subcontractor Validation Utilities
 * Simple validation functions for subcontractor forms
 */

import { z } from 'zod'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const subcontractorLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export const subcontractorReportSchema = z.object({
  project_id: z.string().uuid('Invalid project ID'),
  report_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long')
})

export const subcontractorPhotoSchema = z.object({
  file: z.instanceof(File).refine((file) => {
    return file.size <= 5 * 1024 * 1024 // 5MB
  }, 'File size must be less than 5MB')
    .refine((file) => {
      return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
    }, 'Only JPEG, PNG, and WebP files are allowed')
})

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export function validateSubcontractorLogin(data: any) {
  try {
    return {
      success: true,
      data: subcontractorLoginSchema.parse(data),
      errors: null
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.errors.reduce((acc, err) => ({
          ...acc,
          [err.path[0]]: err.message
        }), {})
      }
    }
    return {
      success: false,
      data: null,
      errors: { general: 'Validation failed' }
    }
  }
}

export function validateSubcontractorReport(data: any) {
  try {
    return {
      success: true,
      data: subcontractorReportSchema.parse(data),
      errors: null
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.errors.reduce((acc, err) => ({
          ...acc,
          [err.path[0]]: err.message
        }), {})
      }
    }
    return {
      success: false,
      data: null,
      errors: { general: 'Validation failed' }
    }
  }
}

export function validateSubcontractorPhoto(file: File) {
  try {
    return {
      success: true,
      data: subcontractorPhotoSchema.parse({ file }),
      errors: null
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.errors.map(err => err.message)
      }
    }
    return {
      success: false,
      data: null,
      errors: ['Photo validation failed']
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function sanitizeReportDescription(description: string): string {
  return description
    .trim()
    .replace(/\s+/g, ' ')
    .substring(0, 2000)
}

export function formatReportDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function isValidReportDate(dateString: string): boolean {
  const date = new Date(dateString)
  const today = new Date()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(today.getDate() - 30)
  
  return date >= thirtyDaysAgo && date <= today
}

export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || ''
}

export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp']
  return validTypes.includes(file.type)
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// ============================================================================
// FORM HELPERS
// ============================================================================

export function createFormErrorMap(errors: Record<string, string>) {
  const errorMap = new Map<string, string>()
  Object.entries(errors).forEach(([field, message]) => {
    errorMap.set(field, message)
  })
  return errorMap
}

export function hasFormErrors(errors: Record<string, string>): boolean {
  return Object.keys(errors).length > 0
}

export function getFormError(errors: Record<string, string>, field: string): string | undefined {
  return errors[field]
}

export function clearFormError(errors: Record<string, string>, field: string): Record<string, string> {
  const { [field]: _, ...rest } = errors
  return rest
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const SUBCONTRACTOR_VALIDATION_CONSTANTS = {
  MAX_PHOTO_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_PHOTOS_PER_REPORT: 10,
  MAX_DESCRIPTION_LENGTH: 2000,
  MIN_DESCRIPTION_LENGTH: 10,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_REPORT_AGE_DAYS: 30
} as const