/**
 * Query Optimization Utilities
 * Selective field loading and query optimization helpers
 */

import type { UserRole } from '@/types/auth'

// ============================================================================
// FIELD SELECTION UTILITIES
// ============================================================================

export interface QueryOptions {
  userRole: UserRole
  requestType: 'list' | 'detail' | 'dashboard' | 'export'
  includeRelations?: boolean
  includeCosts?: boolean
  includeAssignments?: boolean
}

// Project field selection based on user role and request type
export function getProjectFields(options: QueryOptions): string {
  const baseFields = [
    'id',
    'name',
    'description',
    'status',
    'start_date',
    'end_date',
    'location',
    'project_type',
    'priority',
    'created_at',
    'updated_at'
  ]

  const managementFields = [
    'budget',
    'actual_cost',
    'profit_margin'
  ]

  const relationFields = [
    'client:clients(id, company_name, contact_person)',
    'project_manager:user_profiles!project_manager_id(id, first_name, last_name, email)'
  ]

  const detailFields = [
    'notes',
    'requirements',
    'deliverables'
  ]

  let fields = [...baseFields]

  // Add cost fields based on role
  if (hasCostAccess(options.userRole)) {
    fields.push(...managementFields)
  }

  // Add detail fields for detail requests
  if (options.requestType === 'detail' || options.requestType === 'export') {
    fields.push(...detailFields)
  }

  // Add relations if requested
  if (options.includeRelations) {
    fields.push(...relationFields)
  }

  // Add assignments for dashboard
  if (options.requestType === 'dashboard' || options.includeAssignments) {
    fields.push('assignments:project_assignments(*, user:user_profiles(id, first_name, last_name, role))')
  }

  return fields.join(', ')
}

// Task field selection
export function getTaskFields(options: QueryOptions): string {
  const baseFields = [
    'id',
    'title',
    'description',
    'status',
    'priority',
    'due_date',
    'created_at',
    'updated_at'
  ]

  const relationFields = [
    'assignee:user_profiles!assigned_to(id, first_name, last_name)',
    'creator:user_profiles!created_by(id, first_name, last_name)',
    'project:projects(id, name)',
    'scope_item:scope_items(id, description)'
  ]

  const detailFields = [
    'estimated_hours',
    'actual_hours',
    'completion_percentage',
    'notes'
  ]

  let fields = [...baseFields]

  if (options.requestType === 'detail') {
    fields.push(...detailFields)
  }

  if (options.includeRelations) {
    fields.push(...relationFields)
  }

  return fields.join(', ')
}

// Scope item field selection
export function getScopeFields(options: QueryOptions): string {
  const baseFields = [
    'id',
    'description',
    'category',
    'status',
    'quantity',
    'unit',
    'created_at',
    'updated_at'
  ]

  const costFields = [
    'unit_price',
    'total_price',
    'actual_cost'
  ]

  const timelineFields = [
    'timeline_start',
    'timeline_end',
    'dependencies'
  ]

  const relationFields = [
    'project:projects(id, name)',
    'creator:user_profiles!created_by(id, first_name, last_name)'
  ]

  const assignmentFields = [
    'assigned_to',
    'assignments:scope_assignments(*, user:user_profiles(id, first_name, last_name, role))'
  ]

  let fields = [...baseFields]

  // Add cost fields based on role
  if (hasCostAccess(options.userRole)) {
    fields.push(...costFields)
  }

  // Add timeline for detail/dashboard views
  if (options.requestType === 'detail' || options.requestType === 'dashboard') {
    fields.push(...timelineFields)
  }

  // Add relations if requested
  if (options.includeRelations) {
    fields.push(...relationFields)
  }

  // Add assignments if requested
  if (options.includeAssignments) {
    fields.push(...assignmentFields)
  }

  return fields.join(', ')
}

// Milestone field selection
export function getMilestoneFields(options: QueryOptions): string {
  const baseFields = [
    'id',
    'title',
    'description',
    'status',
    'target_date',
    'actual_date',
    'created_at',
    'updated_at'
  ]

  const relationFields = [
    'project:projects(id, name)',
    'creator:user_profiles!created_by(id, first_name, last_name)'
  ]

  const detailFields = [
    'notes',
    'deliverables',
    'success_criteria'
  ]

  let fields = [...baseFields]

  if (options.requestType === 'detail') {
    fields.push(...detailFields)
  }

  if (options.includeRelations) {
    fields.push(...relationFields)
  }

  return fields.join(', ')
}

// ============================================================================
// ROLE-BASED ACCESS HELPERS
// ============================================================================

export function hasCostAccess(role: UserRole): boolean {
  const costRoles: UserRole[] = [
    'company_owner',
    'general_manager',
    'project_manager',
    'finance_team',
    'purchase_department'
  ]
  return costRoles.includes(role)
}

export function hasManagementAccess(role: UserRole): boolean {
  const managementRoles: UserRole[] = [
    'company_owner',
    'general_manager',
    'project_manager'
  ]
  return managementRoles.includes(role)
}

export function hasFieldAccess(role: UserRole): boolean {
  const fieldRoles: UserRole[] = [
    'company_owner',
    'general_manager',
    'project_manager',
    'site_supervisor',
    'field_worker',
    'technical_office'
  ]
  return fieldRoles.includes(role)
}

// ============================================================================
// QUERY BUILDERS
// ============================================================================

export class QueryBuilder {
  private supabase: any
  private table: string
  private selectedFields: string[] = []
  private filters: Record<string, any> = {}
  private orderBy: { column: string; ascending: boolean }[] = []
  private limitValue?: number
  private offsetValue?: number

  constructor(supabase: any, table: string) {
    this.supabase = supabase
    this.table = table
  }

  select(fields: string | string[]): this {
    if (typeof fields === 'string') {
      this.selectedFields = [fields]
    } else {
      this.selectedFields = fields
    }
    return this
  }

  filter(column: string, operator: string, value: any): this {
    this.filters[`${column}.${operator}`] = value
    return this
  }

  eq(column: string, value: any): this {
    return this.filter(column, 'eq', value)
  }

  in(column: string, values: any[]): this {
    return this.filter(column, 'in', values)
  }

  order(column: string, ascending: boolean = true): this {
    this.orderBy.push({ column, ascending })
    return this
  }

  limit(count: number): this {
    this.limitValue = count
    return this
  }

  offset(count: number): this {
    this.offsetValue = count
    return this
  }

  async execute() {
    let query = this.supabase.from(this.table)

    // Apply field selection
    if (this.selectedFields.length > 0) {
      query = query.select(this.selectedFields.join(', '))
    } else {
      query = query.select('*')
    }

    // Apply filters
    Object.entries(this.filters).forEach(([key, value]) => {
      const [column, operator] = key.split('.')
      query = query[operator](column, value)
    })

    // Apply ordering
    this.orderBy.forEach(({ column, ascending }) => {
      query = query.order(column, { ascending })
    })

    // Apply pagination
    if (this.limitValue) {
      query = query.limit(this.limitValue)
    }
    if (this.offsetValue) {
      query = query.range(this.offsetValue, (this.offsetValue + (this.limitValue || 1000)) - 1)
    }

    return query
  }
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

export class QueryPerformanceMonitor {
  private static instance: QueryPerformanceMonitor
  private metrics: Map<string, { count: number; totalTime: number; avgTime: number }> = new Map()

  static getInstance(): QueryPerformanceMonitor {
    if (!QueryPerformanceMonitor.instance) {
      QueryPerformanceMonitor.instance = new QueryPerformanceMonitor()
    }
    return QueryPerformanceMonitor.instance
  }

  trackQuery(queryKey: string, duration: number) {
    const existing = this.metrics.get(queryKey) || { count: 0, totalTime: 0, avgTime: 0 }
    const updated = {
      count: existing.count + 1,
      totalTime: existing.totalTime + duration,
      avgTime: (existing.totalTime + duration) / (existing.count + 1)
    }
    this.metrics.set(queryKey, updated)

    // Log slow queries
    if (duration > 1000) {
      console.warn(`Slow query detected: ${queryKey} took ${duration}ms`)
    }
  }

  getMetrics() {
    return Object.fromEntries(this.metrics)
  }

  getSlowQueries(threshold: number = 500) {
    return Object.fromEntries(
      Array.from(this.metrics.entries()).filter(([_, metrics]) => metrics.avgTime > threshold)
    )
  }
}

export const queryMonitor = QueryPerformanceMonitor.getInstance()
