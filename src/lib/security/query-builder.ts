/**
 * Secure Query Builder for Supabase
 * Prevents SQL injection by providing safe query construction methods
 */

import { z } from 'zod'

// Safe operators for filtering
const SAFE_OPERATORS = [
  'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in', 'cs', 'cd', 'sl', 'sr', 'nxl', 'nxr', 'adj', 'ov', 'fts', 'plfts', 'phfts', 'wfts'
] as const

type SafeOperator = typeof SAFE_OPERATORS[number]

// Safe column names (whitelist approach)
const SAFE_COLUMNS = {
  projects: ['id', 'name', 'description', 'status', 'project_type', 'priority', 'location', 'client_id', 'project_manager_id', 'start_date', 'end_date', 'budget', 'actual_cost', 'created_at', 'updated_at'],
  tasks: ['id', 'project_id', 'scope_item_id', 'title', 'description', 'status', 'priority', 'assigned_to', 'assigned_by', 'due_date', 'estimated_hours', 'tags', 'created_at', 'updated_at'],
  material_specs: ['id', 'project_id', 'supplier_id', 'name', 'description', 'category', 'subcategory', 'brand', 'model', 'unit_of_measure', 'estimated_cost', 'actual_cost', 'quantity_required', 'quantity_available', 'minimum_stock_level', 'status', 'priority', 'lead_time_days', 'delivery_date', 'created_by', 'approved_by', 'created_at', 'updated_at'],
  user_profiles: ['id', 'role', 'first_name', 'last_name', 'email', 'phone', 'company', 'department', 'is_active', 'created_at', 'updated_at'],
  scope_items: ['id', 'project_id', 'item_no', 'title', 'description', 'category', 'quantity', 'unit_price', 'status', 'progress_percentage', 'priority', 'created_at', 'updated_at']
} as const

type TableName = keyof typeof SAFE_COLUMNS
type ColumnName<T extends TableName> = typeof SAFE_COLUMNS[T][number]

// Input validation schemas
const SearchQuerySchema = z.string().max(100).regex(/^[a-zA-Z0-9\s\-_.,()]+$/, 'Invalid search query format')
const UUIDSchema = z.string().uuid('Invalid UUID format')
const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
const NumberSchema = z.number().min(0).max(1000000)
const StatusSchema = z.enum(['pending', 'in_progress', 'review', 'completed', 'cancelled', 'blocked', 'pending_approval', 'approved', 'rejected', 'revision_required', 'discontinued', 'substitution_required'])
const PrioritySchema = z.enum(['low', 'medium', 'high', 'urgent', 'critical'])

export interface SafeFilter {
  column: string
  operator: SafeOperator
  value: string | number | boolean | string[] | number[]
}

export interface SafeSort {
  column: string
  ascending: boolean
}

export interface SafePagination {
  page: number
  limit: number
}

export class SecureQueryBuilder {
  private tableName: TableName
  private filters: SafeFilter[] = []
  private sorts: SafeSort[] = []
  private selectedColumns: string[] = []
  private joinTables: string[] = []

  constructor(tableName: TableName) {
    this.tableName = tableName
  }

  /**
   * Safely add a filter to the query
   */
  addFilter(column: string, operator: SafeOperator, value: any): this {
    // Validate column name
    if (!this.isValidColumn(column)) {
      throw new Error(`Invalid column name: ${column}`)
    }

    // Validate operator
    if (!SAFE_OPERATORS.includes(operator)) {
      throw new Error(`Invalid operator: ${operator}`)
    }

    // Sanitize value based on operator
    const sanitizedValue = this.sanitizeValue(value, operator)

    this.filters.push({
      column,
      operator,
      value: sanitizedValue
    })

    return this
  }

  /**
   * Safely add search filter with text sanitization
   */
  addSearchFilter(searchTerm: string, searchColumns: string[]): this {
    // Validate search term
    const validatedSearch = SearchQuerySchema.parse(searchTerm)
    
    // Validate search columns
    const validColumns = searchColumns.filter(col => this.isValidColumn(col))
    if (validColumns.length === 0) {
      throw new Error('No valid search columns provided')
    }

    // Escape special characters for ILIKE
    const escapedSearch = validatedSearch.replace(/[%_\\]/g, '\\$&')

    // Create OR condition for multiple columns
    const searchConditions = validColumns.map(col => `${col}.ilike.%${escapedSearch}%`).join(',')
    
    this.filters.push({
      column: 'or',
      operator: 'eq' as SafeOperator,
      value: searchConditions
    })

    return this
  }

  /**
   * Safely add UUID filter
   */
  addUUIDFilter(column: string, uuid: string): this {
    const validatedUUID = UUIDSchema.parse(uuid)
    return this.addFilter(column, 'eq', validatedUUID)
  }

  /**
   * Safely add date range filter
   */
  addDateRangeFilter(column: string, startDate?: string, endDate?: string): this {
    if (!this.isValidColumn(column)) {
      throw new Error(`Invalid column name: ${column}`)
    }

    if (startDate) {
      const validatedStartDate = DateSchema.parse(startDate)
      this.addFilter(column, 'gte', validatedStartDate)
    }

    if (endDate) {
      const validatedEndDate = DateSchema.parse(endDate)
      this.addFilter(column, 'lte', validatedEndDate)
    }

    return this
  }

  /**
   * Safely add number range filter
   */
  addNumberRangeFilter(column: string, min?: number, max?: number): this {
    if (!this.isValidColumn(column)) {
      throw new Error(`Invalid column name: ${column}`)
    }

    if (min !== undefined) {
      const validatedMin = NumberSchema.parse(min)
      this.addFilter(column, 'gte', validatedMin)
    }

    if (max !== undefined) {
      const validatedMax = NumberSchema.parse(max)
      this.addFilter(column, 'lte', validatedMax)
    }

    return this
  }

  /**
   * Safely add array filter (IN operator)
   */
  addArrayFilter(column: string, values: string[]): this {
    if (!this.isValidColumn(column)) {
      throw new Error(`Invalid column name: ${column}`)
    }

    if (!Array.isArray(values) || values.length === 0) {
      throw new Error('Array filter requires non-empty array')
    }

    // Validate each value in the array
    const sanitizedValues = values.map(value => {
      if (typeof value !== 'string') {
        throw new Error('Array filter values must be strings')
      }
      return this.sanitizeValue(value, 'in')
    })

    this.addFilter(column, 'in', sanitizedValues)
    return this
  }

  /**
   * Safely add sorting
   */
  addSort(column: string, ascending: boolean = true): this {
    if (!this.isValidColumn(column)) {
      throw new Error(`Invalid column name: ${column}`)
    }

    this.sorts.push({ column, ascending })
    return this
  }

  /**
   * Safely select columns
   */
  selectColumns(columns: string[]): this {
    const validColumns = columns.filter(col => this.isValidColumn(col) || this.isValidJoin(col))
    if (validColumns.length === 0) {
      throw new Error('No valid columns provided')
    }

    this.selectedColumns = validColumns
    return this
  }

  /**
   * Apply filters to Supabase query
   */
  applyToQuery(query: any): any {
    let modifiedQuery = query

    // Apply filters
    for (const filter of this.filters) {
      if (filter.column === 'or') {
        // Special handling for OR conditions
        modifiedQuery = modifiedQuery.or(filter.value as string)
      } else {
        modifiedQuery = modifiedQuery[filter.operator](filter.column, filter.value)
      }
    }

    // Apply sorting
    for (const sort of this.sorts) {
      modifiedQuery = modifiedQuery.order(sort.column, { ascending: sort.ascending })
    }

    return modifiedQuery
  }

  /**
   * Apply pagination safely
   */
  applyPagination(query: any, pagination: SafePagination): any {
    const validatedPagination = this.validatePagination(pagination)
    const from = (validatedPagination.page - 1) * validatedPagination.limit
    const to = from + validatedPagination.limit - 1
    
    return query.range(from, to)
  }

  /**
   * Get safe select string
   */
  getSafeSelectString(): string {
    if (this.selectedColumns.length === 0) {
      return '*'
    }
    return this.selectedColumns.join(', ')
  }

  private isValidColumn(column: string): boolean {
    // Check if it's a direct column
    if (SAFE_COLUMNS[this.tableName].includes(column as any)) {
      return true
    }

    // Check if it's a joined column (table:column format)
    const joinMatch = column.match(/^(\w+):(\w+)/)
    if (joinMatch) {
      const [, joinTable, joinColumn] = joinMatch
      return this.isValidJoinColumn(joinTable, joinColumn)
    }

    return false
  }

  private isValidJoin(column: string): boolean {
    // Allow specific join patterns
    const joinPatterns = [
      /^project:projects!\w+\([^)]+\)$/,
      /^supplier:suppliers!\w+\([^)]+\)$/,
      /^creator:user_profiles!\w+\([^)]+\)$/,
      /^assignee:user_profiles!\w+\([^)]+\)$/,
      /^scope_item:scope_items!\w+\([^)]+\)$/
    ]

    return joinPatterns.some(pattern => pattern.test(column))
  }

  private isValidJoinColumn(tableName: string, columnName: string): boolean {
    const tableColumns = SAFE_COLUMNS[tableName as TableName]
    return tableColumns ? tableColumns.includes(columnName as any) : false
  }

  private sanitizeValue(value: any, operator: SafeOperator): any {
    switch (operator) {
      case 'eq':
      case 'neq':
        if (typeof value === 'string') {
          // Basic string sanitization
          return value.replace(/[<>'"\\]/g, '')
        }
        return value

      case 'like':
      case 'ilike':
        if (typeof value === 'string') {
          // Escape SQL wildcards and special characters
          return value.replace(/[%_\\]/g, '\\$&').replace(/[<>'"]/g, '')
        }
        throw new Error('LIKE operator requires string value')

      case 'in':
        if (Array.isArray(value)) {
          return value.map(v => typeof v === 'string' ? v.replace(/[<>'"\\]/g, '') : v)
        }
        throw new Error('IN operator requires array value')

      case 'gt':
      case 'gte':
      case 'lt':
      case 'lte':
        if (typeof value === 'number' || typeof value === 'string') {
          return value
        }
        throw new Error('Comparison operators require number or string value')

      default:
        return value
    }
  }

  private validatePagination(pagination: SafePagination): SafePagination {
    const page = Math.max(1, Math.min(1000, pagination.page))
    const limit = Math.max(1, Math.min(100, pagination.limit))
    
    return { page, limit }
  }
}

/**
 * Factory function to create secure query builder
 */
export function createSecureQuery(tableName: TableName): SecureQueryBuilder {
  return new SecureQueryBuilder(tableName)
}

/**
 * Validate and sanitize search parameters
 */
export function validateSearchParams(params: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {}

  // Validate common parameters
  if (params.page) {
    sanitized.page = Math.max(1, Math.min(1000, parseInt(params.page) || 1))
  }

  if (params.limit) {
    sanitized.limit = Math.max(1, Math.min(100, parseInt(params.limit) || 20))
  }

  if (params.search && typeof params.search === 'string') {
    try {
      sanitized.search = SearchQuerySchema.parse(params.search)
    } catch {
      // Invalid search term, ignore
    }
  }

  if (params.status && typeof params.status === 'string') {
    const statuses = params.status.split(',').filter(s => {
      try {
        StatusSchema.parse(s)
        return true
      } catch {
        return false
      }
    })
    if (statuses.length > 0) {
      sanitized.status = statuses
    }
  }

  if (params.priority && typeof params.priority === 'string') {
    const priorities = params.priority.split(',').filter(p => {
      try {
        PrioritySchema.parse(p)
        return true
      } catch {
        return false
      }
    })
    if (priorities.length > 0) {
      sanitized.priority = priorities
    }
  }

  // Validate UUID parameters
  const uuidParams = ['project_id', 'user_id', 'client_id', 'supplier_id', 'scope_item_id']
  for (const param of uuidParams) {
    if (params[param] && typeof params[param] === 'string') {
      try {
        sanitized[param] = UUIDSchema.parse(params[param])
      } catch {
        // Invalid UUID, ignore
      }
    }
  }

  // Validate date parameters
  const dateParams = ['start_date', 'end_date', 'due_date_start', 'due_date_end', 'delivery_date_start', 'delivery_date_end']
  for (const param of dateParams) {
    if (params[param] && typeof params[param] === 'string') {
      try {
        sanitized[param] = DateSchema.parse(params[param])
      } catch {
        // Invalid date, ignore
      }
    }
  }

  // Validate number parameters
  const numberParams = ['cost_min', 'cost_max', 'quantity_min', 'quantity_max']
  for (const param of numberParams) {
    if (params[param] !== undefined) {
      const num = parseFloat(params[param])
      if (!isNaN(num) && num >= 0 && num <= 1000000) {
        sanitized[param] = num
      }
    }
  }

  return sanitized
}