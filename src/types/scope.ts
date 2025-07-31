/**
 * Formula PM 2.0 Scope Management Types
 * Wave 2B Business Logic Implementation
 * 
 * Comprehensive type definitions for scope management system with 4-category support,
 * Excel integration, dependency tracking, and role-based cost visibility
 */

import { UserRole } from './auth'

// ============================================================================
// CORE SCOPE TYPES
// ============================================================================

export type ScopeCategory = 'construction' | 'millwork' | 'electrical' | 'mechanical'

export type ScopeStatus = 
  | 'not_started'
  | 'planning' 
  | 'materials_ordered'
  | 'in_progress'
  | 'quality_check'
  | 'client_review' 
  | 'completed'
  | 'blocked'
  | 'on_hold'
  | 'cancelled'

export type RiskLevel = 'low' | 'medium' | 'high'

export type DependencyType = 'blocks' | 'requires' | 'enables'

// ============================================================================
// MAIN SCOPE ITEM INTERFACE
// ============================================================================

export interface ScopeItem {
  id: string
  project_id: string
  category: ScopeCategory
  
  // Core Required Fields (Business Requirements)
  item_no: number // Auto-generated sequential number per project
  item_code?: string // Client-provided code (Excel importable, nullable)
  item_name: string // Display name separate from description (NEW FIELD)
  description: string // Detailed item description (required)
  specification: string // Technical specifications (NEW FIELD)
  location: string // Physical location in project (NEW FIELD)
  quantity: number // Numeric quantity with unit validation
  unit_price: number // Base unit pricing
  total_price: number // Auto-calculated (quantity × unit_price)
  update_notes?: string // Update comments/notes (NEW FIELD)
  
  // Material Spec Integration Fields
  scope_item?: string // Reference to scope item name/title
  quantity_needed?: number // Quantity needed for material specs
  notes?: string // Additional notes for material integration
  
  // Cost Tracking (Technical Office + Purchasing Access Only)
  initial_cost?: number // Original estimated cost
  actual_cost?: number // Real incurred cost
  cost_variance?: number // Auto-calculated difference (actual_cost - initial_cost)
  
  // Legacy/Additional Fields (backward compatibility)
  title: string // Auto-populated from description
  specifications: string
  drawing_reference?: string
  unit_of_measure: string
  markup_percentage: number
  final_price: number // total_price with markup
  
  // Timeline & Progress
  timeline_start?: string
  timeline_end?: string
  duration_days?: number
  actual_start?: string
  actual_end?: string
  progress_percentage: number
  status: ScopeStatus
  
  // Assignments & Dependencies
  assigned_to: string[] // user IDs
  supplier_id?: string
  dependencies: string[] // other scope item IDs
  blocks: string[] // scope items this item blocks
  
  // Approval & Quality
  requires_client_approval: boolean
  client_approved: boolean
  client_approved_date?: string
  quality_check_required: boolean
  quality_check_passed: boolean
  
  // Technical Details
  priority: number // 1-10 scale
  risk_level: RiskLevel
  installation_method?: string
  special_requirements: string[]
  material_list: MaterialRequirement[]
  
  // Tracking
  created_by: string
  created_at: string
  updated_at: string
  last_updated_by: string
  
  // Excel Import Metadata
  excel_row_number?: number
  import_batch_id?: string
  validation_errors: string[]
}

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

export interface MaterialRequirement {
  id: string
  scope_item_id: string
  material_name: string
  specification: string
  quantity: number
  unit: string
  supplier_id?: string
  cost_per_unit?: number
  total_cost?: number
  delivery_date?: string
  status: 'pending' | 'ordered' | 'delivered' | 'installed'
}

export interface ScopeDependency {
  id: string
  scope_item_id: string
  depends_on_id: string
  dependency_type: DependencyType
  description?: string
  created_at: string
}

export interface ExcelImportBatch {
  id: string
  project_id: string
  filename: string
  imported_by: string
  import_date: string
  total_rows: number
  successful_imports: number
  failed_imports: number
  validation_errors: ExcelValidationError[]
}

export interface ExcelValidationError {
  row_number: number
  column: string
  error_message: string
  error_type: 'required' | 'invalid_format' | 'duplicate' | 'reference_error'
  suggested_fix?: string
}

// ============================================================================
// FORM AND INPUT TYPES
// ============================================================================

export interface ScopeItemFormData {
  category: ScopeCategory
  item_code?: string
  item_name: string // Display name (NEW FIELD - required)
  description: string
  specification: string // Technical specifications (NEW FIELD - required)
  location: string // Physical location (NEW FIELD - required)
  title?: string
  specifications?: string // Keep for backward compatibility
  quantity: number
  unit_of_measure: string
  unit_price: number
  markup_percentage?: number
  initial_cost?: number
  actual_cost?: number
  timeline_start?: string
  timeline_end?: string
  duration_days?: number
  priority?: number
  risk_level?: RiskLevel
  installation_method?: string
  special_requirements?: string[]
  requires_client_approval?: boolean
  quality_check_required?: boolean
  assigned_to?: string[]
  supplier_id?: string
  dependencies?: string[]
  update_notes?: string // Update comments (NEW FIELD)
}

export interface ScopeItemUpdateData extends Partial<ScopeItemFormData> {
  status?: ScopeStatus
  progress_percentage?: number
  actual_start?: string
  actual_end?: string
  client_approved?: boolean
  quality_check_passed?: boolean
}

export interface BulkScopeUpdate {
  item_ids: string[]
  updates: Partial<ScopeItemUpdateData>
  update_type: 'status' | 'assignment' | 'timeline' | 'pricing' | 'custom'
}

// ============================================================================
// QUERY AND FILTER TYPES
// ============================================================================

export interface ScopeFilters {
  category?: ScopeCategory | 'all'
  status?: ScopeStatus[]
  assigned_to?: string[]
  supplier_id?: string
  priority_min?: number
  priority_max?: number
  risk_level?: RiskLevel[]
  progress_min?: number
  progress_max?: number
  has_dependencies?: boolean
  requires_approval?: boolean
  overdue_only?: boolean
  date_range?: {
    field: 'timeline_start' | 'timeline_end' | 'created_at' | 'updated_at'
    start?: string
    end?: string
  }
  search_term?: string
  // New filtering fields
  location?: string // Filter by location (NEW FIELD)
  item_name?: string // Filter by item name (NEW FIELD)
  specification?: string // Filter by specification (NEW FIELD)
  item_no?: number // Filter by item number (NEW FIELD)
}

export interface ScopeListParams {
  project_id?: string
  filters?: ScopeFilters
  sort?: {
    field: keyof ScopeItem
    direction: 'asc' | 'desc'
  }
  page?: number
  limit?: number
  include_dependencies?: boolean
  include_materials?: boolean
  include_assignments?: boolean
}

// ============================================================================
// STATISTICS AND METRICS
// ============================================================================

export interface ScopeStatistics {
  total_items: number
  by_category: Record<ScopeCategory, {
    total: number
    completed: number
    in_progress: number
    blocked: number
    completion_percentage: number
  }>
  by_status: Record<ScopeStatus, number>
  by_priority: Record<string, number>
  timeline: {
    on_schedule: number
    behind_schedule: number
    ahead_schedule: number
    overdue: number
  }
  financial: {
    total_budget?: number
    actual_cost?: number
    cost_variance?: number
    items_over_budget?: number
  }
  quality: {
    items_requiring_approval: number
    items_pending_quality_check: number
    items_approved: number
  }
}

export interface ScopeProgressReport {
  project_id: string
  generated_at: string
  generated_by: string
  overall_completion: number
  category_progress: Record<ScopeCategory, {
    total_items: number
    completed_items: number
    completion_percentage: number
    timeline_status: 'on_track' | 'at_risk' | 'delayed'
    budget_status: 'under' | 'on_target' | 'over'
  }>
  critical_items: ScopeItem[]
  blocked_items: ScopeItem[]
  upcoming_deadlines: Array<{
    item: ScopeItem
    days_until_deadline: number
  }>
}

// ============================================================================
// EXCEL INTEGRATION TYPES
// ============================================================================

export interface ExcelImportMapping {
  column_index: number
  field_name: keyof ScopeItemFormData
  data_type: 'string' | 'number' | 'date' | 'boolean' | 'array'
  required: boolean
  validation_rules?: {
    min_value?: number
    max_value?: number
    allowed_values?: string[]
    regex_pattern?: string
    max_length?: number // For new text fields
  }
}

export interface ExcelImportConfig {
  has_header_row: boolean
  start_row: number
  column_mappings: ExcelImportMapping[]
  default_values: Partial<ScopeItemFormData>
  validation_mode: 'strict' | 'lenient'
  skip_duplicates: boolean
  duplicate_check_fields: (keyof ScopeItemFormData)[]
}

export interface ExcelExportConfig {
  include_columns: (keyof ScopeItem)[]
  include_financial_data: boolean
  include_private_notes: boolean
  format_dates: boolean
  include_formulas: boolean
  group_by_category: boolean
  include_summary_sheet: boolean
  // New export options for new fields
  include_specifications: boolean
  include_locations: boolean
  include_update_notes: boolean
}

// ============================================================================
// PERMISSION AND ACCESS TYPES
// ============================================================================

export interface ScopePermissions {
  can_view: boolean
  can_create: boolean
  can_edit: boolean
  can_delete: boolean
  can_view_costs: boolean
  can_edit_costs: boolean
  can_view_pricing: boolean
  can_assign_suppliers: boolean
  can_approve_quality: boolean
  can_bulk_edit: boolean
  can_import_excel: boolean
  can_export_excel: boolean
  can_manage_dependencies: boolean
}

export interface UserScopeAccess {
  user_id: string
  user_role: UserRole
  permissions: ScopePermissions
  accessible_categories: ScopeCategory[]
  accessible_projects: string[]
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ScopeApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  validation_errors?: Record<string, string[]>
  pagination?: {
    page: number
    limit: number
    total: number
    has_more: boolean
  }
}

export interface ScopeListResponse {
  items: ScopeItem[]
  statistics: ScopeStatistics
  filters_applied: ScopeFilters
  sort_applied?: {
    field: keyof ScopeItem
    direction: 'asc' | 'desc'
  }
}

export interface ScopeCreateResponse {
  item: ScopeItem
  warnings?: string[]
}

export interface ScopeUpdateResponse {
  item: ScopeItem
  updated_fields: (keyof ScopeItem)[]
  warnings?: string[]
}

export interface ScopeBulkUpdateResponse {
  updated_items: ScopeItem[]
  failed_updates: Array<{
    item_id: string
    error: string
  }>
  summary: {
    total_requested: number
    successful_updates: number
    failed_updates: number
  }
}

export interface ExcelImportResponse {
  import_batch: ExcelImportBatch
  created_items: ScopeItem[]
  validation_summary: {
    total_rows: number
    successful_imports: number
    failed_imports: number
    warnings: string[]
  }
}

// ============================================================================
// UTILITY TYPES AND HELPERS
// ============================================================================

export type ScopeItemSummary = Pick<ScopeItem, 
  'id' | 'item_no' | 'item_name' | 'category' | 'title' | 'status' | 'progress_percentage' | 'assigned_to' | 'location'
>

export type ScopeItemWithAssignments = ScopeItem & {
  assignments?: Array<{
    user_id: string
    user_name: string
    user_role: UserRole
    assigned_at: string
  }>
}

export type ScopeItemWithDependencies = ScopeItem & {
  dependency_items?: ScopeItemSummary[]
  blocked_items?: ScopeItemSummary[]
}

// Utility function types
export type ScopeValidator = (item: Partial<ScopeItem>) => {
  valid: boolean
  errors: Record<string, string>
  warnings: string[]
}

export type ScopeCalculator = {
  calculateTotalPrice: (quantity: number, unitPrice: number) => number
  calculateFinalPrice: (totalPrice: number, markupPercentage: number) => number
  calculateCostVariance: (initialCost?: number, actualCost?: number) => number | undefined
  calculateDurationDays: (startDate?: string, endDate?: string) => number | undefined
  calculateProgressPercentage: (status: ScopeStatus, customProgress?: number) => number
}

// ============================================================================
// CONSTANTS AND ENUMS
// ============================================================================

export const SCOPE_CATEGORIES: Record<ScopeCategory, {
  label: string
  description: string
  color: string
  icon: string
}> = {
  construction: {
    label: 'Construction',
    description: 'Structural and general construction items',
    color: 'blue',
    icon: 'Construction'
  },
  millwork: {
    label: 'Millwork', 
    description: 'Custom woodwork and cabinetry',
    color: 'amber',
    icon: 'Hammer'
  },
  electrical: {
    label: 'Electrical',
    description: 'Electrical systems and installations', 
    color: 'yellow',
    icon: 'Zap'
  },
  mechanical: {
    label: 'Mechanical',
    description: 'HVAC and mechanical systems',
    color: 'green',
    icon: 'Wrench'
  }
}

export const SCOPE_STATUSES: Record<ScopeStatus, {
  label: string
  description: string
  color: string
  progress_weight: number
}> = {
  not_started: {
    label: 'Not Started',
    description: 'Item has not been started',
    color: 'gray',
    progress_weight: 0
  },
  planning: {
    label: 'Planning',
    description: 'Item is in planning phase', 
    color: 'blue',
    progress_weight: 10
  },
  materials_ordered: {
    label: 'Materials Ordered',
    description: 'Materials have been ordered',
    color: 'yellow',
    progress_weight: 25
  },
  in_progress: {
    label: 'In Progress',
    description: 'Work is actively being performed',
    color: 'green',
    progress_weight: 50
  },
  quality_check: {
    label: 'Quality Check',
    description: 'Item is undergoing quality inspection',
    color: 'purple',
    progress_weight: 75
  },
  client_review: {
    label: 'Client Review',
    description: 'Item is under client review',
    color: 'orange',
    progress_weight: 85
  },
  completed: {
    label: 'Completed',
    description: 'Item is fully completed',
    color: 'emerald',
    progress_weight: 100
  },
  blocked: {
    label: 'Blocked',
    description: 'Item is blocked by dependencies',
    color: 'red',
    progress_weight: 0
  },
  on_hold: {
    label: 'On Hold',
    description: 'Item is temporarily on hold',
    color: 'amber',
    progress_weight: 0
  },
  cancelled: {
    label: 'Cancelled',
    description: 'Item has been cancelled',
    color: 'gray',
    progress_weight: 0
  }
}

export const DEFAULT_SCOPE_ITEM: Partial<ScopeItem> = {
  quantity: 1,
  unit_price: 0,
  markup_percentage: 0,
  progress_percentage: 0,
  status: 'not_started',
  priority: 1,
  risk_level: 'medium',
  assigned_to: [],
  dependencies: [],
  blocks: [],
  special_requirements: [],
  material_list: [],
  requires_client_approval: false,
  client_approved: false,
  quality_check_required: true,
  quality_check_passed: false,
  validation_errors: []
}