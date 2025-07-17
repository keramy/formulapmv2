/**
 * Formula PM 2.0 Tasks API - Main Route
 * V3 Phase 1 Implementation
 * 
 * Handles task listing, creation, and bulk operations with role-based access control
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'
import { 
  validateTaskFormData,
  validateTaskListParams,
  validateTaskPermissions,
  validateTaskAccess,
  calculateTaskStatus
} from '@/lib/validation/tasks'
import { Task, TaskFilters, TaskStatistics } from '@/types/tasks'
import { getCachedResponse, generateCacheKey, invalidateCache } from '@/lib/cache-middleware'

// ============================================================================
// GET /api/tasks - List tasks with filtering and pagination
// ============================================================================

export const GET = withAuth(async (request: NextRequest, { user, profile }) => {
,
      { status: 401 }
    )
  }

  // Permission check
  if (!hasPermission(profile.role, 'projects.read.all') && 
      !hasPermission(profile.role, 'projects.read.assigned') &&
      !hasPermission(profile.role, 'projects.read.own')) {
    return createErrorResponse('Insufficient permissions to view tasks' , 403)
  }

  try {
    const url = new URL(request.url)
    const queryParams = {
      page: parseInt(url.searchParams.get('page') || '1'),
      limit: parseInt(url.searchParams.get('limit') || '20'),
      include_assignee: url.searchParams.get('include_assignee') === 'true',
      include_assigner: url.searchParams.get('include_assigner') === 'true',
      include_scope_item: url.searchParams.get('include_scope_item') === 'true',
      include_project: url.searchParams.get('include_project') === 'true',
      project_id: url.searchParams.get('project_id') || undefined,
      filters: {
        status: url.searchParams.get('status')?.split(',') as any || undefined,
        priority: url.searchParams.get('priority')?.split(',') as any || undefined,
        assignee: url.searchParams.get('assignee') || undefined,
        search: url.searchParams.get('search') || undefined,
        due_date_start: url.searchParams.get('due_date_start') || undefined,
        due_date_end: url.searchParams.get('due_date_end') || undefined,
        scope_item_id: url.searchParams.get('scope_item_id') || undefined,
        tags: url.searchParams.get('tags')?.split(',') || undefined,
        overdue_only: url.searchParams.get('overdue_only') === 'true',
        assigned_to_me: url.searchParams.get('assigned_to_me') === 'true',
        assigned_by_me: url.searchParams.get('assigned_by_me') === 'true',
        completed_only: url.searchParams.get('completed_only') === 'true',
        created_by: url.searchParams.get('created_by') || undefined
      },
      sort: url.searchParams.get('sort_field') ? {
        field: url.searchParams.get('sort_field') as any,
        direction: (url.searchParams.get('sort_direction') || 'asc') as 'asc' | 'desc'
      } : undefined
    }

    // Validate parameters
    const validationResult = validateTaskListParams(queryParams)
    if (!validationResult.success) {
      return createErrorResponse('Invalid parameters',
          details: validationResult.error.issues 
        , 400)
    }

    const supabase = createServerClient()

    // Build base query
    let query = supabase
      // Optimized tasks query with user permissions
    const tasksQuery = supabase
      .from('tasks')
      .select(`
        id,
        title,
        description,
        status,
        priority,
        due_date,
        assigned_to,
        project_id,
        created_at,
        projects!inner(
          id,
          name,
          status
        ),
        user_profiles!tasks_assigned_to_fkey(
          id,
          first_name,
          last_name
        )
      `)
      .eq('projects.status', 'active')
      .order('due_date', { ascending: true, nullsLast: true })
      .limit(100),' : ''}
        ${queryParams.include_assigner ? 'assigner:user_profiles!assigned_by(id, first_name, last_name, email, avatar_url),' : ''}
        ${queryParams.include_scope_item ? 'scope_item:scope_items!scope_item_id(id, item_no, title, description),' : ''}
        ${queryParams.include_project ? 'project:projects!project_id(id, name, status),' : ''}
        project_id
      `, { count: 'exact' })

    // Apply role-based filtering for project access
    if (!hasPermission(profile.role, 'projects.read.all')) {
      // Get accessible projects for this user
      const accessibleProjects = await getAccessibleProjects(supabase, user)
      if (accessibleProjects.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            tasks: [],
            statistics: getEmptyStatistics()
          },
          pagination: {
            page: 1,
            limit: queryParams.limit,
            total: 0,
            has_more: false
          }
        })
      }
      query = query.in('project_id', accessibleProjects)
    }

    // Apply project filter if specified
    if (queryParams.project_id) {
      // Verify user has access to this project
      const hasProjectAccess = await verifyProjectAccess(supabase, user, queryParams.project_id)
      if (!hasProjectAccess) {
        return createErrorResponse('Access denied to this project' , 403)
      }
      query = query.eq('project_id', queryParams.project_id)
    }

    // Apply filters
    const filters = queryParams.filters
    if (filters) {
      if (filters.status?.length) {
        query = query.in('status', filters.status)
      }

      if (filters.priority?.length) {
        query = query.in('priority', filters.priority)
      }

      if (filters.assignee) {
        query = query.eq('assigned_to', filters.assignee)
      }

      if (filters.search) {
        // Sanitize search input to prevent SQL injection
        const sanitizedSearch = filters.search.replace(/[%_\\]/g, '\\$&').substring(0, 100)
        query = query.or(`title.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%`)
      }

      if (filters.due_date_start) {
        query = query.gte('due_date', filters.due_date_start)
      }

      if (filters.due_date_end) {
        query = query.lte('due_date', filters.due_date_end)
      }

      if (filters.scope_item_id) {
        query = query.eq('scope_item_id', filters.scope_item_id)
      }

      if (filters.tags?.length) {
        query = query.overlaps('tags', filters.tags)
      }

      if (filters.created_by) {
        query = query.eq('assigned_by', filters.created_by)
      }

      // Handle exclusive filters
      if (filters.overdue_only) {
        const today = new Date().toISOString().split('T')[0]
        query = query
          .lt('due_date', today)
          .not('status', 'in', ['completed', 'cancelled'])
      }

      if (filters.assigned_to_me) {
        query = query.eq('assigned_to', user.id)
      }

      if (filters.assigned_by_me) {
        query = query.eq('assigned_by', user.id)
      }

      if (filters.completed_only) {
        query = query.eq('status', 'completed')
      }
    }

    // Apply sorting
    if (queryParams.sort) {
      query = query.order(queryParams.sort.field, { ascending: queryParams.sort.direction === 'asc' })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    // Apply pagination
    const from = (queryParams.page - 1) * queryParams.limit
    const to = from + queryParams.limit - 1
    query = query.range(from, to)

    const { data: tasks, error: fetchError, count } = await query

    if (fetchError) {
      console.error('Tasks fetch error:', fetchError)
      return createErrorResponse('Failed to fetch tasks' , 500)
    }

    // Calculate additional fields for tasks
    const enhancedTasks = tasks?.map(task => {
      const currentStatus = calculateTaskStatus((task as any).status, (task as any).due_date)
      const isOverdue = (task as any).due_date && new Date((task as any).due_date) < new Date() && !['completed', 'cancelled'].includes((task as any).status)
      const daysUntilDue = (task as any).due_date ? calculateDaysUntilDue((task as any).due_date) : null
      
      return {
        ...(task as any),
        // Update computed status if different from stored status
        computed_status: currentStatus,
        is_overdue: isOverdue,
        days_until_due: daysUntilDue,
        assignee: queryParams.include_assignee ? (task as any).assignee : undefined,
        assigner: queryParams.include_assigner ? (task as any).assigner : undefined,
        scope_item: queryParams.include_scope_item ? (task as any).scope_item : undefined,
        project: queryParams.include_project ? (task as any).project : undefined
      }
    }) || []

    // Calculate statistics
    const statistics = await calculateTaskStatistics(
      supabase,
      queryParams.project_id,
      queryParams.filters,
      user.id
    )

    return NextResponse.json({
      success: true,
      data: {
        tasks: enhancedTasks,
        statistics
      },
      pagination: {
        page: queryParams.page,
        limit: queryParams.limit,
        total: count || 0,
        has_more: queryParams.page * queryParams.limit < (count || 0)
      }
    })

  } catch (error) {
    console.error('Tasks API error:', error)
    return createErrorResponse('Internal server error' , 500)
  }
}

// ============================================================================
// POST /api/tasks - Create new task
// ============================================================================

export const POST = withAuth(async (request: NextRequest, { user, profile }) => {
,
      { status: 401 }
    )
  }

  // Permission check
  if (!validateTaskPermissions(profile.role, 'create')) {
    return createErrorResponse('Insufficient permissions to create tasks' , 403)
  }

  try {
    const body = await request.json()
    
    // Validate task data
    const validationResult = validateTaskFormData(body)
    if (!validationResult.success) {
      return createErrorResponse('Invalid task data',
          details: validationResult.error.issues 
        , 400)
    }

    const taskData = validationResult.data
    const supabase = createServerClient()

    // Verify user has access to the project
    const hasProjectAccess = await verifyProjectAccess(supabase, user, taskData.project_id)
    if (!hasProjectAccess) {
      return createErrorResponse('Access denied to this project' , 403)
    }

    // Check if project exists
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, status')
      .eq('id', taskData.project_id)
      .single()

    if (projectError || !project) {
      return createErrorResponse('Project not found' , 404)
    }

    // Verify scope item exists if provided
    if (taskData.scope_item_id) {
      const { data: scopeItem, error: scopeError } = await supabase
        .from('scope_items')
        .select('id')
        .eq('id', taskData.scope_item_id)
        .eq('project_id', taskData.project_id)
        .single()

      if (scopeError || !scopeItem) {
        return createErrorResponse('Scope item not found in this project' , 404)
      }
    }

    // Verify assignee exists and has access to project if provided
    if (taskData.assigned_to) {
      const { data: assignee, error: assigneeError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', taskData.assigned_to)
        .single()

      if (assigneeError || !assignee) {
        return createErrorResponse('Assignee not found' , 404)
      }

      // Check if assignee has access to the project
      const hasAssigneeAccess = await verifyProjectAccess(supabase, { id: taskData.assigned_to }, taskData.project_id)
      if (!hasAssigneeAccess) {
        return createErrorResponse('Assignee does not have access to this project' , 400)
      }
    }

    // Calculate automatic status based on due date
    const calculatedStatus = calculateTaskStatus(taskData.status, taskData.due_date)
    
    // Prepare task data
    const insertData = {
      project_id: taskData.project_id,
      scope_item_id: taskData.scope_item_id || null,
      title: taskData.title,
      description: taskData.description || null,
      status: calculatedStatus,
      priority: taskData.priority,
      assigned_to: taskData.assigned_to || null,
      assigned_by: user.id,
      due_date: taskData.due_date || null,
      estimated_hours: taskData.estimated_hours || null,
      tags: taskData.tags || []
    }

    const { data: task, error: insertError } = await supabase
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

    if (insertError) {
      console.error('Task creation error:', insertError)
      return createErrorResponse('Failed to create task' , 500)
    }

    // Add computed fields
    const enhancedTask = {
      ...task,
      computed_status: calculatedStatus,
      is_overdue: task.due_date && new Date(task.due_date) < new Date() && !['completed', 'cancelled'].includes(task.status),
      days_until_due: task.due_date ? calculateDaysUntilDue(task.due_date) : null
    }

    return NextResponse.json({
      success: true,
      message: 'Task created successfully',
      data: {
        task: enhancedTask
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Task creation API error:', error)
    return createErrorResponse('Internal server error' , 500)
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getAccessibleProjects(supabase: any, user: any): Promise<string[]> {
  if (hasPermission(user.role, 'projects.read.all')) {
    const { data: allProjects } = await supabase
      .from('projects')
      .select('id')
    return allProjects?.map((p: any) => p.id) || []
  }

  if (hasPermission(user.role, 'projects.read.assigned')) {
    const { data: assignedProjects } = await supabase
      .from('project_assignments')
      .select('project_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
    return assignedProjects?.map((p: any) => p.project_id) || []
  }

  if (hasPermission(user.role, 'projects.read.own') && user.role === 'client') {
    const { data: clientProjects } = await supabase
      .from('projects')
      .select('id')
      .eq('client_id', user.profile?.id)
    return clientProjects?.map((p: any) => p.id) || []
  }

  return []
}

async function verifyProjectAccess(supabase: any, user: any, projectId: string): Promise<boolean> {
  const accessibleProjects = await getAccessibleProjects(supabase, user)
  return accessibleProjects.includes(projectId)
}

function calculateDaysUntilDue(dueDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  
  const diffTime = due.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

async function calculateTaskStatistics(
  supabase: any,
  projectId?: string,
  filters?: TaskFilters,
  userId?: string
): Promise<TaskStatistics> {
  let query = supabase.from('tasks').select('*')
  
  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  // Apply filters if provided
  if (filters) {
    if (filters.status?.length) {
      query = query.in('status', filters.status)
    }
    if (filters.priority?.length) {
      query = query.in('priority', filters.priority)
    }
    if (filters.assignee) {
      query = query.eq('assigned_to', filters.assignee)
    }
    if (filters.due_date_start) {
      query = query.gte('due_date', filters.due_date_start)
    }
    if (filters.due_date_end) {
      query = query.lte('due_date', filters.due_date_end)
    }
    if (filters.scope_item_id) {
      query = query.eq('scope_item_id', filters.scope_item_id)
    }
    if (filters.created_by) {
      query = query.eq('assigned_by', filters.created_by)
    }
  }

  const { data: tasks } = await query

  if (!tasks) {
    return getEmptyStatistics()
  }

  const today = new Date().toISOString().split('T')[0]
  const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  
  const stats: TaskStatistics = {
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
    stats.byStatus[task.status as keyof typeof stats.byStatus]++

    // Count by priority
    stats.byPriority[task.priority as keyof typeof stats.byPriority]++

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
}

function getEmptyStatistics(): TaskStatistics {
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