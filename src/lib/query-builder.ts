/**
 * Query Builder Utilities - OPTIMIZATION PHASE 2.1
 * Centralized query building patterns to reduce code duplication
 */

import { createServerClient } from '@/lib/supabase'

export interface QueryOptions {
  page?: number
  limit?: number
  search?: string
  sort_field?: string
  sort_direction?: 'asc' | 'desc'
  filters?: Record<string, any>
  includes?: string[]
}

export interface TableConfig {
  table: string
  searchFields?: string[]
  sortableFields?: string[]
  filterableFields?: string[]
  relationships?: Record<string, string>
}

export class QueryBuilder {
  private supabase: any
  private config: TableConfig
  private query: any

  constructor(config: TableConfig) {
    this.supabase = createServerClient()
    this.config = config
    this.query = null
  }

  // Initialize base query
  select(columns: string = '*', options?: { count?: 'exact' | 'planned' | 'estimated' }) {
    this.query = this.supabase
      .from(this.config.table)
      .select(columns, options)
    return this
  }

  // Add includes (relationships)
  withIncludes(includes: string[] = []) {
    if (includes.length === 0) return this

    const relationshipSelects = includes
      .filter(include => this.config.relationships?.[include])
      .map(include => this.config.relationships![include])
      .join(',')

    if (relationshipSelects) {
      // Rebuild query with relationships
      const baseColumns = '*'
      const fullSelect = `${baseColumns},${relationshipSelects}`
      this.query = this.supabase
        .from(this.config.table)
        .select(fullSelect, { count: 'exact' })
    }

    return this
  }

  // Add search functionality
  withSearch(searchTerm?: string) {
    if (!searchTerm || !this.config.searchFields?.length) return this

    const searchConditions = this.config.searchFields
      .map(field => `${field}.ilike.%${searchTerm}%`)
      .join(',')

    this.query = this.query.or(searchConditions)
    return this
  }

  // Add filters
  withFilters(filters: Record<string, any> = {}) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null) return
      
      // Skip non-filterable fields
      if (this.config.filterableFields && !this.config.filterableFields.includes(key)) {
        return
      }

      if (Array.isArray(value) && value.length > 0) {
        this.query = this.query.in(key, value)
      } else if (typeof value === 'string' && value.length > 0) {
        this.query = this.query.eq(key, value)
      } else if (typeof value === 'boolean') {
        this.query = this.query.eq(key, value)
      } else if (typeof value === 'number') {
        this.query = this.query.eq(key, value)
      }
    })

    return this
  }

  // Add sorting
  withSort(sortField?: string, sortDirection: 'asc' | 'desc' = 'asc') {
    if (!sortField) return this

    // Validate sortable field
    if (this.config.sortableFields && !this.config.sortableFields.includes(sortField)) {
      sortField = this.config.sortableFields[0] || 'created_at'
    }

    this.query = this.query.order(sortField, { ascending: sortDirection === 'asc' })
    return this
  }

  // Add pagination
  withPagination(page: number = 1, limit: number = 20) {
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    this.query = this.query.range(from, to)
    return this
  }

  // Add specific conditions
  where(field: string, operator: string, value: any) {
    switch (operator) {
      case 'eq':
        this.query = this.query.eq(field, value)
        break
      case 'neq':
        this.query = this.query.neq(field, value)
        break
      case 'gt':
        this.query = this.query.gt(field, value)
        break
      case 'gte':
        this.query = this.query.gte(field, value)
        break
      case 'lt':
        this.query = this.query.lt(field, value)
        break
      case 'lte':
        this.query = this.query.lte(field, value)
        break
      case 'in':
        this.query = this.query.in(field, value)
        break
      case 'like':
        this.query = this.query.like(field, value)
        break
      case 'ilike':
        this.query = this.query.ilike(field, value)
        break
      default:
        this.query = this.query.eq(field, value)
    }
    return this
  }

  // Execute query
  async execute() {
    if (!this.query) {
      throw new Error('Query not initialized. Call select() first.')
    }
    
    return await this.query
  }

  // Build complete query with all options
  static async buildAndExecute(config: TableConfig, options: QueryOptions = {}) {
    const builder = new QueryBuilder(config)
    
    const columns = options.includes?.length 
      ? `*,${options.includes.map(inc => config.relationships?.[inc]).filter(Boolean).join(',')}`
      : '*'

    return await builder
      .select(columns, { count: 'exact' })
      .withSearch(options.search)
      .withFilters(options.filters)
      .withSort(options.sort_field, options.sort_direction)
      .withPagination(options.page, options.limit)
      .execute()
  }
}

// Pre-configured table configs
export const TABLE_CONFIGS = {
  projects: {
    table: 'projects',
    searchFields: ['name', 'description', 'location'],
    sortableFields: ['name', 'status', 'start_date', 'end_date', 'created_at'],
    filterableFields: ['status', 'project_manager_id', 'client_id', 'project_type'],
    relationships: {
      manager: 'project_manager:user_profiles!project_manager_id(id, first_name, last_name, email)',
      client: 'client:user_profiles!client_id(id, first_name, last_name, email)',
      assignments: 'project_assignments(id, user_id, role, is_active)'
    }
  },
  
  scope_items: {
    table: 'scope_items',
    searchFields: ['title', 'description', 'item_code'],
    sortableFields: ['title', 'status', 'timeline_start', 'timeline_end', 'progress_percentage'],
    filterableFields: ['status', 'category', 'project_id', 'priority'],
    relationships: {
      project: 'project:projects!project_id(id, name, status)',
      supplier: 'supplier:suppliers!supplier_id(id, name, contact_person)',
      creator: 'created_by_user:user_profiles!created_by(id, first_name, last_name)'
    }
  },

  tasks: {
    table: 'tasks',
    searchFields: ['title', 'description'],
    sortableFields: ['title', 'status', 'priority', 'due_date', 'created_at'],
    filterableFields: ['status', 'priority', 'assigned_to', 'project_id', 'scope_item_id'],
    relationships: {
      assignee: 'assignee:user_profiles!assigned_to(id, first_name, last_name, email, avatar_url)',
      assigner: 'assigner:user_profiles!assigned_by(id, first_name, last_name, email)',
      project: 'project:projects!project_id(id, name, status)',
      scope_item: 'scope_item:scope_items!scope_item_id(id, item_no, title, description)'
    }
  },

  material_specs: {
    table: 'material_specs',
    searchFields: ['name', 'description', 'specification'],
    sortableFields: ['name', 'status', 'unit_price', 'delivery_date', 'created_at'],
    filterableFields: ['status', 'project_id', 'supplier_id', 'approval_status'],
    relationships: {
      project: 'project:projects!project_id(id, name, status)',
      supplier: 'supplier:suppliers!supplier_id(id, name, email, phone, contact_person)',
      creator: 'creator:user_profiles!created_by(id, first_name, last_name, email)',
      approver: 'approver:user_profiles!approved_by(id, first_name, last_name, email)'
    }
  }
}

// Convenience functions for common queries
export const queryProjects = (options: QueryOptions) => 
  QueryBuilder.buildAndExecute(TABLE_CONFIGS.projects, options)

export const queryScopeItems = (options: QueryOptions) => 
  QueryBuilder.buildAndExecute(TABLE_CONFIGS.scope_items, options)

export const queryTasks = (options: QueryOptions) => 
  QueryBuilder.buildAndExecute(TABLE_CONFIGS.tasks, options)

export const queryMaterialSpecs = (options: QueryOptions) => 
  QueryBuilder.buildAndExecute(TABLE_CONFIGS.material_specs, options)
