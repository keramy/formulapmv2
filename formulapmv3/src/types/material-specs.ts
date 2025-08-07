/**
 * Formula PM 2.0 Material Specifications Types
 * V3 Phase 1 Implementation
 * 
 * Type definitions for material specifications with approval workflow
 * following the exact patterns from tasks and milestones
 */

import { User } from '@/types/auth'
import { Project } from '@/types/projects'
import { ScopeItem } from '@/types/scope'

// ============================================================================
// ENUMS
// ============================================================================

export type MaterialStatus = 
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'revision_required'
  | 'discontinued'
  | 'substitution_required'

export type MaterialPriority = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'

// ============================================================================
// CORE INTERFACES
// ============================================================================

export interface MaterialSpec {
  id: string
  project_id: string
  supplier_id?: string
  name: string
  description?: string
  category: string
  subcategory?: string
  brand?: string
  model?: string
  specifications: Record<string, any>
  unit_of_measure: string
  estimated_cost?: number
  actual_cost?: number
  quantity_required: number
  quantity_available: number
  minimum_stock_level: number
  status: MaterialStatus
  priority: MaterialPriority
  approval_notes?: string
  approved_by?: string
  approved_at?: string
  rejected_by?: string
  rejected_at?: string
  rejection_reason?: string
  substitution_notes?: string
  lead_time_days: number
  delivery_date?: string
  created_by?: string
  created_at: string
  updated_at: string
  
  // Populated relations
  project?: Project
  supplier?: {
    id: string
    name: string
    email?: string
    phone?: string
    contact_person?: string
  }
  creator?: User
  approver?: User
  rejector?: User
  scope_items?: ScopeItem[]
  
  // Computed fields
  is_overdue?: boolean
  days_until_delivery?: number
  cost_variance?: number
  availability_status?: 'sufficient' | 'low' | 'out_of_stock'
  approval_required?: boolean
}

export interface ScopeMaterialLink {
  id: string
  scope_item_id: string
  material_spec_id: string
  quantity_needed: number
  notes?: string
  created_at: string
  updated_at: string
  
  // Populated relations
  scope_item?: ScopeItem
  material_spec?: MaterialSpec
}

// ============================================================================
// FORM DATA INTERFACES
// ============================================================================

export interface MaterialSpecFormData {
  name: string
  description?: string
  category: string
  subcategory?: string
  brand?: string
  model?: string
  specifications?: Record<string, any>
  unit_of_measure: string
  estimated_cost?: number
  quantity_required: number
  minimum_stock_level?: number
  status?: MaterialStatus
  priority?: MaterialPriority
  supplier_id?: string
  lead_time_days?: number
  delivery_date?: string
  project_id: string
  scope_item_ids?: string[]
}

export interface MaterialSpecUpdate {
  name?: string
  description?: string
  category?: string
  subcategory?: string
  brand?: string
  model?: string
  specifications?: Record<string, any>
  unit_of_measure?: string
  estimated_cost?: number
  actual_cost?: number
  quantity_required?: number
  quantity_available?: number
  minimum_stock_level?: number
  status?: MaterialStatus
  priority?: MaterialPriority
  supplier_id?: string
  lead_time_days?: number
  delivery_date?: string
  substitution_notes?: string
}

export interface MaterialApprovalData {
  approval_notes?: string
  approved_by?: string
}

export interface MaterialRejectionData {
  rejection_reason: string
  rejected_by?: string
}

export interface MaterialRevisionData {
  revision_reason: string
  revision_notes?: string
}

export interface ScopeLinkData {
  scope_item_id: string
  quantity_needed: number
  notes?: string
}

// ============================================================================
// FILTERS AND SEARCH
// ============================================================================

export interface MaterialSpecFilters {
  status?: MaterialStatus[]
  priority?: MaterialPriority[]
  category?: string[]
  supplier_id?: string
  search?: string
  created_by?: string
  approved_by?: string
  delivery_date_start?: string
  delivery_date_end?: string
  cost_range?: {
    min?: number
    max?: number
  }
  quantity_range?: {
    min?: number
    max?: number
  }
  overdue_only?: boolean
  approval_required_only?: boolean
  low_stock_only?: boolean
  has_supplier?: boolean
  has_delivery_date?: boolean
  scope_item_id?: string
}

export interface MaterialSpecSort {
  field: 'name' | 'category' | 'status' | 'priority' | 'estimated_cost' | 'delivery_date' | 'created_at' | 'updated_at'
  direction: 'asc' | 'desc'
}

export interface MaterialSpecListParams {
  page: number
  limit: number
  filters?: MaterialSpecFilters
  sort?: MaterialSpecSort
  include_project?: boolean
  include_supplier?: boolean
  include_creator?: boolean
  include_approver?: boolean
  include_scope_items?: boolean
  project_id?: string
}

// ============================================================================
// STATISTICS
// ============================================================================

export interface MaterialSpecStatistics {
  total: number
  byStatus: {
    pending_approval: number
    approved: number
    rejected: number
    revision_required: number
    discontinued: number
    substitution_required: number
  }
  byPriority: {
    low: number
    medium: number
    high: number
    critical: number
  }
  byCategory: Record<string, number>
  totalEstimatedCost: number
  totalActualCost: number
  costVariance: number
  overdue: number
  approvalRequired: number
  lowStock: number
  outOfStock: number
  deliveryThisWeek: number
  deliveryThisMonth: number
  averageLeadTime: number
  supplierCount: number
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

export interface MaterialSpecBulkUpdate {
  material_spec_ids: string[]
  updates: {
    status?: MaterialStatus
    priority?: MaterialPriority
    category?: string
    supplier_id?: string
    delivery_date?: string
    lead_time_days?: number
  }
  notify_stakeholders?: boolean
}

export interface MaterialSpecBulkApproval {
  material_spec_ids: string[]
  approval_notes?: string
  notify_stakeholders?: boolean
}

export interface MaterialSpecBulkRejection {
  material_spec_ids: string[]
  rejection_reason: string
  notify_stakeholders?: boolean
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface MaterialSpecResponse {
  success: boolean
  message?: string
  data?: {
    material_spec: MaterialSpec
    statistics?: MaterialSpecStatistics
  }
  error?: string
  details?: any
}

export interface MaterialSpecListResponse {
  success: boolean
  data?: {
    material_specs: MaterialSpec[]
    statistics?: MaterialSpecStatistics
    project?: Project
  }
  pagination?: {
    page: number
    limit: number
    total: number
    has_more: boolean
  }
  error?: string
  details?: any
}

export interface MaterialSpecStatisticsResponse {
  success: boolean
  data?: {
    statistics: MaterialSpecStatistics
    trends?: {
      approval_rate_7_days: number
      approval_rate_30_days: number
      cost_trend: 'increasing' | 'decreasing' | 'stable'
      delivery_performance: number
    }
  }
  error?: string
}

export interface ScopeMaterialLinkResponse {
  success: boolean
  message?: string
  data?: {
    link: ScopeMaterialLink
    material_spec?: MaterialSpec
    scope_item?: ScopeItem
  }
  error?: string
  details?: any
}

export interface MaterialSpecBulkResponse {
  success: boolean
  message?: string
  data?: {
    updated_count: number
    failed_count: number
    updated_ids: string[]
    failed_ids: string[]
    errors?: Array<{
      id: string
      error: string
    }>
  }
  error?: string
}

// ============================================================================
// WORKFLOW TYPES
// ============================================================================

export interface MaterialApprovalWorkflow {
  material_spec_id: string
  current_status: MaterialStatus
  next_status: MaterialStatus
  required_approvers: string[]
  completed_approvers: string[]
  workflow_notes?: string
  workflow_started_at: string
  workflow_completed_at?: string
}

export interface MaterialSpecHistory {
  id: string
  material_spec_id: string
  action: 'created' | 'updated' | 'approved' | 'rejected' | 'revision_requested' | 'linked' | 'unlinked'
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  user_id: string
  user_name: string
  notes?: string
  created_at: string
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface MaterialSpecValidationResult {
  valid: boolean
  errors: Array<{
    field: string
    message: string
    code: string
  }>
  warnings: Array<{
    field: string
    message: string
    code: string
  }>
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type MaterialSpecExportFormat = 'csv' | 'xlsx' | 'pdf'

export interface MaterialSpecExportOptions {
  format: MaterialSpecExportFormat
  include_fields: string[]
  filters?: MaterialSpecFilters
  project_id?: string
  include_scope_items?: boolean
  include_supplier_details?: boolean
}