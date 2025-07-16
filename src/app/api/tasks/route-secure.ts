/**
 * SECURE VERSION - Formula PM 2.0 Tasks API - Main Route
 * Demonstrates comprehensive security fixes for SQL injection and other vulnerabilities
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  withSecureAuth, 
  withSecureValidation, 
  withSecureDatabase,
  createSecureSuccessResponse, 
  createSecureErrorResponse,
  parseSecureQueryParams,
  createSecurePagination
} from '@/lib/security/secure-api-middleware'
import { createSecureQuery } from '@/lib/security/query-builder'
import { TaskSchemas, validateRequestParams } from '@/lib/security/input-validation'
import { hasPermission } from '@/lib/permissions'

// ============================================================================
// GET /api/tasks - List tasks with comprehensive security
// ============================================================================

export const GET = withSecureAuth(async (request: NextRequest, { user, profile, requestId }) => {
  try {
    // Parse and validate query parameters securely
    const rawParams = parseSecureQueryParams(request)
    const validationResult = validateRequestParams(TaskSchemas.listParams, rawParams)
    
    if (!validationResult.success) {
      return createSecureErrorResponse(
        'Invalid query parameters',
        400,
        requestId,
        { details: validationResult.error.errors }
      )
    }

    const queryParams = validationResult.data

    // Permission check with detailed logging
    if (!hasPermission(profile.role, 'projects.read.all') && 
        !hasPermission(profile.role, 'projects.read.assigned') &&
        !hasPermission(profile.role, 'projects.read.own')) {
      console.warn(`🚨 Unauthorized task access attempt [${requestId}]:`, {
        userId: user.id,
        userRole: profile.role,
        requiredPermissions: ['projects.read.all', 'projects.read.assigned', 'projects.read.own']
      })
      return createSecureErrorResponse('Insufficient permissions to view tasks', 403, requestId)
    }

    // Create secure query builder
    const secureQuery = createSecureQuery('tasks')

    // Build select fields securely
    const selectFields = ['*']
    if (queryParams.include_assignee) {
      selectFields.push('assignee:user_profiles!assigned_to(id, first_name, last_name, email, avatar_url)')
    }
    if (queryParams.include_assigner) {
      selectFields.push('assigner:user_profiles!assigned_by(id, first_name, last_name, email, avatar_url)')
    }
    if (queryParams.include_scope_item) {
      selectFields.push('scope_item:scope_items!scope_item_id(id, item_no, title, description)')
    }
    if (queryParams.include_project) {
      selectFields.push('project:projects!project_id(id, name, status)')
    }

    secureQuery.selectColumns(selectFields)

    // Apply role-based filtering securely
    if (!hasPermission(profile.role, 'projects.read.all')) {
      const accessibleProjects = await getAccessibleProjectsSecurely(user, profile, requestId)
      if (accessibleProjects.length === 0) {
        return createSecureSuccessResponse({
          tasks: [],
          statistics: getEmptyStatistics()
        }, requestId, createSecurePagination(1, queryParams.limit, 0))
      }
      secureQuery.addArrayFilter('project_id', accessibleProjects)
    }

    // Apply project filter if specified
    if (queryParams.project_id) {
      const hasProjectAccess = await verifyProjectAccessSecurely(user, profile, queryParams.project_id, requestId)
      if (!hasProjectAccess) {
        return createSecureErrorResponse('Access denied to this project', 403, requestId)
      }
      secureQuery.addUUIDFilter('project_id', queryParams.project_id)
    }

    // Apply filters securely
    if (queryParams.status?.length) {
      secureQuery.addArrayFilter('status', queryParams.status)
    }

    if (queryParams.priority?.length) {
      secureQuery.addArrayFilter('priority', queryParams.priority)
    }

    if (queryParams.assignee) {
      secureQuery.addUUIDFilter('assigned_to', queryParams.assignee)
    }

    if (queryParams.search) {
      secureQuery.addSearchFilter(queryParams.search, ['title', 'description'])
    }

    if (queryParams.due_date_start || queryParams.due_date_end) {
      secureQuery.addDateRangeFilter('due_date', queryParams.due_date_start, queryParams.due_date_end)
    }

    if (queryParams.scope_item_id) {
      secureQuery.addUUIDFilter('scope_item_id', queryParams.scope_item_id)
    }

    if (queryParams.created_by) {
      secureQuery.addUUIDFilter('assigned_by', queryParams.created_by)
    }

    // Handle exclusive filters
    if (queryParams.overdue_only) {
      const today = new Date().toISOString().split('T')[0]
      secureQuery.addFilter('due_date', 'lt', today)
      secureQuery.addFilter('status', 'neq', 'completed')
      secureQuery.addFilter('status', 'neq', 'cancelled')
    }

    if (queryParams.assigned_to_me) {
      secureQuery.addUUIDFilter('assigned_to', user.id)
    }

    if (queryParams.assigned_by_me) {
      secureQuery.addUUIDFilter('assigned_by', user.id)
    }

    if (queryParams.completed_only) {
      secureQuery.addFilter('status', 'eq', 'completed')
    }

    // Apply sorting securely
    secureQuery.addSort(queryParams.sort_field, queryParams.sort_direction === 'asc')

    // Execute secure database operation
    const dbResult = await withSecureDatabase(async (supabase) => {
      let query = supabase
        .from('tasks')
        .select(secureQuery.getSafeSelectString(), { count: 'exact' })

      // Apply secure query filters
      query = secureQuery.applyToQuery(query)

      // Apply pagination
      query = secureQuery.applyPagination(query, {
        page: queryParams.page,
        limit: queryParams.limit
      })

      return await query
    }, requestId)

    if (dbResult.error) {
      return createSecureErrorResponse(dbResult.error, 500, requestId)
    }

    const { data: tasks, count } = dbResult.data as any

    // Calculate additional fields safely
    const enhancedTasks = tasks?.map((task: any) => {
      const isOverdue = task.due_date && 
        new Date(task.due_date) < new Date() && 
        !['completed', 'cancelled'].includes(task.status)
      
      const daysUntilDue = task.due_date ? 
        calculateDaysUntilDue(task.due_date) : null
      
      return {
        ...task,
        is_overdue: isOverdue,
        days_until_due: daysUntilDue,
        // Only include relations if requested
        assignee: queryParams.include_assignee ? task.assignee : undefined,
        assigner: queryParams.include_assigner ? task.assigner : undefined,
        scope_item: queryParams.include_scope_item ? task.scope_item : undefined,
        project: queryParams.include_project ? task.project : undefined
      }
    }) || []

    // Calculate statistics securely
    const statistics = await calculateTaskStatisticsSecurely(
      queryParams.project_id,
      queryParams,
      user.id,
      requestId
    )

    return createSecureSuccessResponse({
      tasks: enhancedTasks,
      statistics
    }, requestId, createSecurePagination(queryParams.page, queryParams.limit, count || 0))

  } catch (error) {
    console.error(`❌ Secure tasks API error [${requestId}]:`, error)
    return createSecureErrorResponse('Internal server error', 500, requestId)
  }
}, {
  requireAuth: true,
  requirePermission: 'projects.read.all',
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    keyGenerator: (req) => req.headers.get('x-forwarded-for') || 'unknown'
  },
  logRequests: true,
  blockSuspiciousRequests: true
})

// ============================================================================
// POST /api/tasks - Create new task with comprehensive security
// ============================================================================

export const POST = withSecureAuth(
  withSecureValidation(TaskSchemas.create)(
    async (request: NextRequest, validatedData, { user, profile, requestId }) => {
      try {
        // Permission check
        if (!hasPermission(profile.role, 'projects.create')) {
          return createSecureErrorResponse('Insufficient permissions to create tasks', 403, requestId)
        }

        // Verify project access
        const hasProjectAccess = await verifyProjectAccessSecurely(
          user, 
          profile, 
          validatedData.project_id, 
          requestId
        )
        if (!hasProjectAccess) {
          return createSecureErrorResponse('Access denied to this project', 403, requestId)
        }

        // Verify project exists
        const projectResult = await withSecureDatabase(async (supabase) => {
          return await supabase
            .from('projects')
            .select('id, name, status')
            .eq('id', validatedData.project_id)
            .single()
        }, requestId)

        if (projectResult.error || !projectResult.data) {
          return createSecureErrorResponse('Project not found', 404, requestId)
        }

        // Verify scope item if provided
        if (validatedData.scope_item_id) {
          const scopeResult = await withSecureDatabase(async (supabase) => {
            return await supabase
              .from('scope_items')
              .select('id')
              .eq('id', validatedData.scope_item_id)
              .eq('project_id', validatedData.project_id)
              .single()
          }, requestId)

          if (scopeResult.error || !scopeResult.data) {
            return createSecureErrorResponse('Scope item not found in this project', 404, requestId)
          }
        }

        // Verify assignee if provided
        if (validatedData.assigned_to) {
          const assigneeResult = await withSecureDatabase(async (supabase) => {
            return await supabase
              .from('user_profiles')
              .select('id')
              .eq('id', validatedData.assigned_to)
              .single()
          }, requestId)

          if (assigneeResult.error || !assigneeResult.data) {
            return createSecureErrorResponse('Assignee not found', 404, requestId)
          }

          // Check if assignee has project access
          const hasAssigneeAccess = await verifyProjectAccessSecurely(
            { id: validatedData.assigned_to }, 
            profile, 
            validatedData.project_id, 
            requestId
          )
          if (!hasAssigneeAccess) {
            return createSecureErrorResponse('Assignee does not have access to this project', 400, requestId)
          }
        }

        // Prepare task data with secure defaults
        const insertData = {
          project_id: validatedData.project_id,
          scope_item_id: validatedData.scope_item_id || null,
          title: validatedData.title,
          description: validatedData.description || null,
          status: validatedData.status,
          priority: validatedData.priority,
          assigned_to: validatedData.assigned_to || null,
          assigned_by: user.id,
          due_date: validatedData.due_date || null,
          estimated_hours: validatedData.estimated_hours || null,
          tags: validatedData.tags || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        // Create task securely
        const taskResult = await withSecureDatabase(async (supabase) => {
          return await supabase
            .from('tasks')
            .insert(insertData)
            .select(`
              *,
              assignee:user_profiles!assigned_to(id, first_name, last_name, email, avatar_url),
              assigner:user_profiles!assigned_by(id, first_name, last_name, email, avatar_url),
              scope_item:scope_items!scope_item_id(id, item_no, title, description),
              project:projects!project_id(id, name, status)
            `)
            .single()
        }, requestId)

        if (taskResult.error) {
          console.error(`❌ Task creation failed [${requestId}]:`, taskResult.error)
          return createSecureErrorResponse('Failed to create task', 500, requestId)
        }

        const task = taskResult.data

        // Add computed fields
        const enhancedTask = {
          ...task,
          is_overdue: task.due_date && 
            new Date(task.due_date) < new Date() && 
            !['completed', 'cancelled'].includes(task.status),
          days_until_due: task.due_date ? calculateDaysUntilDue(task.due_date) : null
        }

        console.log(`✅ Task created successfully [${requestId}]:`, {
          taskId: task.id,
          projectId: validatedData.project_id,
          createdBy: user.id
        })

        return createSecureSuccessResponse({
          message: 'Task created successfully',
          task: enhancedTask
        }, requestId)

      } catch (error) {
        console.error(`❌ Task creation error [${requestId}]:`, error)
        return createSecureErrorResponse('Internal server error', 500, requestId)
      }
    }
  ),
  {
    requireAuth: true,
    requirePermission: 'projects.create',
    rateLimit: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30, // 30 creates per minute
      keyGenerator: (req) => req.headers.get('x-forwarded-for') || 'unknown'
    },
    logRequests: true,
    blockSuspiciousRequests: true,
    validateInput: true
  }
)

// ============================================================================
// SECURE HELPER FUNCTIONS
// ============================================================================

async function getAccessibleProjectsSecurely(
  user: any, 
  profile: any, 
  requestId: string
): Promise<string[]> {
  try {
    if (hasPermission(profile.role, 'projects.read.all')) {
      const result = await withSecureDatabase(async (supabase) => {
        return await supabase.from('projects').select('id')
      }, requestId)
      
      return result.data?.map((p: any) => p.id) || []
    }

    if (hasPermission(profile.role, 'projects.read.assigned')) {
      const result = await withSecureDatabase(async (supabase) => {
        return await supabase
          .from('project_assignments')
          .select('project_id')
          .eq('user_id', user.id)
          .eq('is_active', true)
      }, requestId)
      
      return result.data?.map((p: any) => p.project_id) || []
    }

    if (hasPermission(profile.role, 'projects.read.own') && profile.role === 'client') {
      const result = await withSecureDatabase(async (supabase) => {
        return await supabase
          .from('projects')
          .select('id')
          .eq('client_id', profile.id)
      }, requestId)
      
      return result.data?.map((p: any) => p.id) || []
    }

    return []
  } catch (error) {
    console.error(`❌ Error getting accessible projects [${requestId}]:`, error)
    return []
  }
}

async function verifyProjectAccessSecurely(
  user: any, 
  profile: any, 
  projectId: string, 
  requestId: string
): Promise<boolean> {
  try {
    const accessibleProjects = await getAccessibleProjectsSecurely(user, profile, requestId)
    return accessibleProjects.includes(projectId)
  } catch (error) {
    console.error(`❌ Error verifying project access [${requestId}]:`, error)
    return false
  }
}

function calculateDaysUntilDue(dueDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  
  const diffTime = due.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

async function calculateTaskStatisticsSecurely(
  projectId?: string,
  filters?: any,
  userId?: string,
  requestId?: string
): Promise<any> {
  try {
    const secureQuery = createSecureQuery('tasks')
    
    if (projectId) {
      secureQuery.addUUIDFilter('project_id', projectId)
    }

    // Apply filters securely
    if (filters?.status?.length) {
      secureQuery.addArrayFilter('status', filters.status)
    }
    if (filters?.priority?.length) {
      secureQuery.addArrayFilter('priority', filters.priority)
    }
    if (filters?.assignee) {
      secureQuery.addUUIDFilter('assigned_to', filters.assignee)
    }
    if (filters?.due_date_start || filters?.due_date_end) {
      secureQuery.addDateRangeFilter('due_date', filters.due_date_start, filters.due_date_end)
    }
    if (filters?.scope_item_id) {
      secureQuery.addUUIDFilter('scope_item_id', filters.scope_item_id)
    }
    if (filters?.created_by) {
      secureQuery.addUUIDFilter('assigned_by', filters.created_by)
    }

    const result = await withSecureDatabase(async (supabase) => {
      let query = supabase.from('tasks').select('*')
      query = secureQuery.applyToQuery(query)
      return await query
    }, requestId)

    if (result.error || !result.data) {
      return getEmptyStatistics()
    }

    const tasks = result.data
    const today = new Date().toISOString().split('T')[0]
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const stats = {
      total: tasks.length,
      byStatus: {
        pending: 0,
        in_progress: 0,
        review: 0,
        completed: 0,
        cancelled: 0,
        blocked: 0
      },
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0
      },
      overdue: 0,
      dueThisWeek: 0,
      completed: 0,
      assignedToMe: 0
    }

    tasks.forEach((task: any) => {
      // Count by status
      if (stats.byStatus.hasOwnProperty(task.status)) {
        stats.byStatus[task.status as keyof typeof stats.byStatus]++
      }

      // Count by priority
      if (stats.byPriority.hasOwnProperty(task.priority)) {
        stats.byPriority[task.priority as keyof typeof stats.byPriority]++
      }

      // Count specific categories
      if (task.status === 'completed') {
        stats.completed++
      }

      if (task.due_date && task.due_date < today && !['completed', 'cancelled'].includes(task.status)) {
        stats.overdue++
      }

      if (task.due_date && task.due_date >= today && task.due_date <= weekFromNow) {
        stats.dueThisWeek++
      }

      if (task.assigned_to === userId) {
        stats.assignedToMe++
      }
    })

    return stats
  } catch (error) {
    console.error(`❌ Error calculating task statistics [${requestId}]:`, error)
    return getEmptyStatistics()
  }
}

function getEmptyStatistics() {
  return {
    total: 0,
    byStatus: {
      pending: 0,
      in_progress: 0,
      review: 0,
      completed: 0,
      cancelled: 0,
      blocked: 0
    },
    byPriority: {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0
    },
    overdue: 0,
    dueThisWeek: 0,
    completed: 0,
    assignedToMe: 0
  }
}