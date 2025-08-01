/**
 * Formula PM 2.0 Scope Validation Schemas
 * Basic validation functions for scope management
 */

import { z } from 'zod'

// Basic validation schemas
export const scopeFormDataSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  item_code: z.string().optional(),
  project_id: z.string().uuid('Invalid project ID format')
})

export const scopeListParamsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  project_id: z.string().uuid('Invalid project ID format').optional(),
  search: z.string().optional()
})

export const scopeUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  item_code: z.string().optional()
})

// Validation functions
export const validateScopeFormData = (data: unknown) => {
  return scopeFormDataSchema.safeParse(data)
}

export const validateScopeListParams = (data: unknown) => {
  return scopeListParamsSchema.safeParse(data)
}

export const validateScopeUpdate = (data: unknown) => {
  return scopeUpdateSchema.safeParse(data)
}

export const validateScopePermissions = (userRole: string, action: string): boolean => {
  const rolePermissions: Record<string, string[]> = {
    'management': ['create', 'read', 'update', 'delete'],
    'admin': ['create', 'read', 'update', 'delete'],
    'technical_lead': ['create', 'read', 'update'],
    'project_manager': ['create', 'read', 'update'],
    'purchase_manager': ['read', 'update'],
    'client': ['read']
  }
  
  return rolePermissions[userRole]?.includes(action) || false
}

export const validateScopeAccess = (data: unknown) => {
  return { success: true, data }
}

export const validateScopeBulkUpdate = (data: unknown) => {
  return { success: true, data }
}

export const validateScopeExcelImport = (data: unknown) => {
  return { success: true, data }
}