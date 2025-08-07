/**
 * Query Builder Utilities
 * Optimized database queries with pagination and caching
 */
import { createClient } from '@/lib/supabase/server'
import { getCachedResponse } from './cache-middleware-robust'

// Cache key generator function
export function generateCacheKey(endpoint: string, userId: string, params?: Record<string, any>): string {
  const paramString = params ? JSON.stringify(params) : '';
  return `${endpoint}:${userId}:${Buffer.from(paramString).toString('base64')}`;
}

export interface QueryParams {
  page?: number
  limit?: number
  search?: string
  sort_field?: string
  sort_direction?: 'asc' | 'desc'
  filters?: Record<string, any>
}

export interface PaginationResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export function parseQueryParams(request: Request): QueryParams {
  const url = new URL(request.url)
  const params = url.searchParams
  
  return {
    page: parseInt(params.get('page') || '1'),
    limit: Math.min(parseInt(params.get('limit') || '10'), 100), // Max 100 items
    search: params.get('search') || undefined,
    sort_field: params.get('sort_field') || 'created_at',
    sort_direction: (params.get('sort_direction') as 'asc' | 'desc') || 'desc',
    filters: Object.fromEntries(
      Array.from(params.entries()).filter(([key]) => 
        !['page', 'limit', 'search', 'sort_field', 'sort_direction'].includes(key)
      )
    )
  }
}

export async function buildPaginatedQuery<T>(
  tableName: string,
  params: QueryParams,
  selectColumns: string = '*',
  additionalFilters?: (query: any) => any,
  userId?: string
): Promise<PaginationResult<T>> {
  const { 
    page = 1, 
    limit = 10, 
    search, 
    sort_field = 'created_at', 
    sort_direction = 'desc' as 'desc', 
    filters 
  } = params
  
  // Generate cache key
  const cacheKey = generateCacheKey(
    `paginated:${tableName}`, 
    userId || 'anonymous', 
    { page, limit, search, sort_field, sort_direction, filters, selectColumns }
  )
  
  // Try to get from cache first
  const cachedResult = await getCachedResponse(
    cacheKey,
    `/api/${tableName}`,
    async () => {
      const supabase = await createClient()
      
      // Calculate offset
      const offset = (page - 1) * limit
      
      // Build base query
      let query = supabase
        .from(tableName)
        .select(selectColumns, { count: 'exact' })
      
      // Apply search
      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
      }
      
      // Apply filters
      Object.entries(filters || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value)
        }
      })
      
      // Apply additional filters
      if (additionalFilters) {
        query = additionalFilters(query)
      }
      
      // Apply sorting
      query = query.order(sort_field, { ascending: sort_direction === 'asc' })
      
      // Apply pagination
      query = query.range(offset, offset + limit - 1)
      
      const { data, error, count } = await query
      
      if (error) {
        throw new Error(`Database query failed: ${error.message}`)
      }
      
      const total = count || 0
      const totalPages = Math.ceil(total / limit)
      
      return {
        data: data || [],
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    }
  )
  
  return cachedResult
}

export async function batchOperation<T>(
  tableName: string,
  operation: 'insert' | 'update' | 'delete',
  data: T[],
  batchSize: number = 100
): Promise<void> {
  const supabase = await createClient()
  const batches = []
  
  for (let i = 0; i < data.length; i += batchSize) {
    batches.push(data.slice(i, i + batchSize))
  }
  
  for (const batch of batches) {
    let query
    
    switch (operation) {
      case 'insert':
        query = supabase.from(tableName).insert(batch)
        break
      case 'update':
        // For updates, assume batch has id field
        query = supabase.from(tableName).upsert(batch)
        break
      case 'delete':
        // For deletes, assume batch is array of ids
        query = supabase.from(tableName).delete().in('id', batch as any)
        break
    }
    
    const { error } = await query
    if (error) {
      throw new Error(`Batch ${operation} failed: ${error.message}`)
    }
  }
}

// Optimized query for scope items (our biggest bottleneck)
export async function getScopeItemsOptimized(
  projectId: string,
  params: QueryParams,
  userId: string
): Promise<PaginationResult<any>> {
  return buildPaginatedQuery(
    'scope_items',
    params,
    `
      id,
      project_id,
      category,
      item_no,
      item_code,
      description,
      quantity,
      unit_price,
      total_price,
      status,
      progress_percentage,
      timeline_start,
      timeline_end,
      assigned_to,
      created_at,
      updated_at
    `,
    (query) => {
      return query.eq('project_id', projectId)
    },
    userId
  )
}

// Optimized query for projects with user filtering
export async function getProjectsOptimized(
  params: QueryParams,
  userId: string,
  userRole: string
): Promise<PaginationResult<any>> {
  return buildPaginatedQuery(
    'projects',
    params,
    `
      id,
      name,
      description,
      status,
      budget,
      actual_cost,
      start_date,
      end_date,
      created_at,
      updated_at,
      project_manager_id,
      client_id,
      user_profiles!project_manager_id(first_name, last_name),
      clients!client_id(company_name)
    `,
    (query) => {
      // Apply role-based filtering
      if (!['management', 'technical_lead', 'admin'].includes(userRole)) {
        // Non-admin users only see their assigned projects
        return query.or(`project_manager_id.eq.${userId},created_by.eq.${userId}`)
      }
      return query
    },
    userId
  )
}

// Optimized query for tasks with assignment filtering
export async function getTasksOptimized(
  params: QueryParams,
  userId: string,
  userRole: string
): Promise<PaginationResult<any>> {
  return buildPaginatedQuery(
    'tasks',
    params,
    `
      id,
      title,
      description,
      status,
      priority,
      due_date,
      assigned_to,
      project_id,
      created_at,
      updated_at,
      projects!project_id(name),
      user_profiles!assigned_to(first_name, last_name)
    `,
    (query) => {
      // Apply role-based filtering
      if (!['management', 'technical_lead', 'admin'].includes(userRole)) {
        return query.eq('assigned_to', userId)
      }
      return query
    },
    userId
  )
}

