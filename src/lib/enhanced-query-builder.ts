/**
 * Enhanced Query Builder Utilities
 * Optimized database queries with pagination, caching, and advanced filtering
 */
import { createClient } from '@supabase/supabase-js';
import { getCachedResponse, generateCacheKey } from './cache-middleware';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sort_field?: string;
  sort_direction?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Parse query parameters from request URL
 */
export function parseQueryParams(request: Request): QueryParams {
  const url = new URL(request.url);
  const params = url.searchParams;
  
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
  };
}

/**
 * Build paginated query with caching
 * Expected performance improvement: 50-70% for Scope Items endpoint
 */
export async function buildPaginatedQuery<T>(
  tableName: string,
  params: QueryParams,
  selectColumns: string = '*',
  additionalFilters?: (query: any) => any,
  userId?: string
): Promise<PaginationResult<T>> {
  const { page = 1, limit = 10, search, sort_field = 'created_at', sort_direction = 'desc', filters = {} } = params;
  
  // Generate cache key
  const cacheKey = generateCacheKey(
    `paginated:${tableName}`, 
    userId || 'anonymous', 
    { page, limit, search, sort_field, sort_direction, filters, selectColumns }
  );
  
  // Try to get from cache first
  const cachedResult = await getCachedResponse(
    cacheKey,
    `/api/${tableName}`,
    async () => {
      // Calculate offset
      const offset = (page - 1) * limit;
      
      // Build base query
      let query = supabase
        .from(tableName)
        .select(selectColumns, { count: 'exact' });
      
      // Apply search
      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else if (typeof value === 'object') {
            // Handle special operators
            if (value.gt !== undefined) query = query.gt(key, value.gt);
            if (value.gte !== undefined) query = query.gte(key, value.gte);
            if (value.lt !== undefined) query = query.lt(key, value.lt);
            if (value.lte !== undefined) query = query.lte(key, value.lte);
            if (value.like !== undefined) query = query.like(key, `%${value.like}%`);
            if (value.ilike !== undefined) query = query.ilike(key, `%${value.ilike}%`);
            if (value.is !== undefined) query = query.is(key, value.is);
          } else {
            query = query.eq(key, value);
          }
        }
      });
      
      // Apply additional filters
      if (additionalFilters) {
        query = additionalFilters(query);
      }
      
      // Apply sorting
      query = query.order(sort_field, { ascending: sort_direction === 'asc' });
      
      // Apply pagination
      query = query.range(offset, offset + limit - 1);
      
      const { data, error, count } = await query;
      
      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }
      
      const total = count || 0;
      const totalPages = Math.ceil(total / limit);
      
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
      };
    }
  );
  
  return cachedResult;
}

/**
 * Batch operations for bulk data processing
 */
export async function batchOperation<T>(
  tableName: string,
  operation: 'insert' | 'update' | 'delete',
  data: T[],
  batchSize: number = 100
): Promise<void> {
  const batches = [];
  
  for (let i = 0; i < data.length; i += batchSize) {
    batches.push(data.slice(i, i + batchSize));
  }
  
  for (const batch of batches) {
    let query;
    
    switch (operation) {
      case 'insert':
        query = supabase.from(tableName).insert(batch);
        break;
      case 'update':
        // For updates, assume batch has id field
        query = supabase.from(tableName).upsert(batch);
        break;
      case 'delete':
        // For deletes, assume batch is array of ids
        query = supabase.from(tableName).delete().in('id', batch as any);
        break;
    }
    
    const { error } = await query;
    if (error) {
      throw new Error(`Batch ${operation} failed: ${error.message}`);
    }
  }
}

/**
 * Optimized query for scope items (our biggest bottleneck)
 * Expected improvement: 3.75s → 1.2s (70% improvement)
 */
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
      updated_at,
      user_profiles!assigned_to(first_name, last_name)
    `,
    (query) => {
      return query.eq('project_id', projectId);
    },
    userId
  );
}

/**
 * Optimized query for projects with user filtering
 * Expected improvement: 1.74s → 800ms (54% improvement)
 */
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
        return query.or(`project_manager_id.eq.${userId},created_by.eq.${userId}`);
      }
      return query;
    },
    userId
  );
}

/**
 * Optimized query for tasks with assignment filtering
 * Expected improvement: 1.80s → 900ms (50% improvement)
 */
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
        return query.eq('assigned_to', userId);
      }
      return query;
    },
    userId
  );
}

/**
 * Optimized query for dashboard stats
 * Expected improvement: 1.75s → 850ms (51% improvement)
 */
export async function getDashboardStatsOptimized(
  userId: string,
  userRole: string
): Promise<any> {
  const cacheKey = generateCacheKey('dashboard:stats', userId, { role: userRole });
  
  return getCachedResponse(
    cacheKey,
    '/api/dashboard/stats',
    async () => {
      // Get project counts
      let projectQuery = supabase
        .from('projects')
        .select('id, status', { count: 'exact' });
      
      if (!['management', 'technical_lead', 'admin'].includes(userRole)) {
        projectQuery = projectQuery.or(`project_manager_id.eq.${userId},created_by.eq.${userId}`);
      }
      
      const { count: totalProjects } = await projectQuery;
      
      // Get task counts
      let taskQuery = supabase
        .from('tasks')
        .select('id, status', { count: 'exact' });
      
      if (!['management', 'technical_lead', 'admin'].includes(userRole)) {
        taskQuery = taskQuery.eq('assigned_to', userId);
      }
      
      const { count: totalTasks } = await taskQuery;
      
      // Get scope item counts
      let scopeQuery = supabase
        .from('scope_items')
        .select('id, status', { count: 'exact' });
      
      if (!['management', 'technical_lead', 'admin'].includes(userRole)) {
        scopeQuery = scopeQuery.in('project_id', 
          supabase
            .from('projects')
            .select('id')
            .or(`project_manager_id.eq.${userId},created_by.eq.${userId}`)
        );
      }
      
      const { count: totalScopeItems } = await scopeQuery;
      
      return {
        totalProjects: totalProjects || 0,
        totalTasks: totalTasks || 0,
        totalScopeItems: totalScopeItems || 0,
        generatedAt: new Date().toISOString()
      };
    }
  );
}

/**
 * Create a new query builder instance
 */
export class QueryBuilder<T> {
  private table: string;
  private selectQuery: string;
  private filters: Record<string, any>;
  private pagination: QueryParams;
  
  constructor(table: string) {
    this.table = table;
    this.selectQuery = '*';
    this.filters = {};
    this.pagination = {
      page: 1,
      limit: 20,
      sort_field: 'created_at',
      sort_direction: 'desc'
    };
  }
  
  /**
   * Set the select query
   */
  select(query: string): QueryBuilder<T> {
    this.selectQuery = query;
    return this;
  }
  
  /**
   * Set filters
   */
  filter(filters: Record<string, any>): QueryBuilder<T> {
    this.filters = { ...this.filters, ...filters };
    return this;
  }
  
  /**
   * Set pagination parameters
   */
  paginate(params: QueryParams): QueryBuilder<T> {
    this.pagination = { ...this.pagination, ...params };
    return this;
  }
  
  /**
   * Execute the query
   */
  async execute(userId?: string): Promise<PaginationResult<T>> {
    return buildPaginatedQuery<T>(
      this.table,
      { ...this.pagination, filters: this.filters },
      this.selectQuery,
      undefined,
      userId
    );
  }
}

/**
 * Create a new query builder
 */
export function createQueryBuilder<T>(table: string): QueryBuilder<T> {
  return new QueryBuilder<T>(table);
}

export { generateCacheKey };