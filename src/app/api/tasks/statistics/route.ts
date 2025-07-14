/**
 * Formula PM 2.0 Task Statistics API
 * V3 Phase 1 Implementation
 * 
 * Provides comprehensive task statistics for dashboard integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'
import { 
  validateTaskStatisticsParams,
  validateTaskPermissions
} from '@/lib/validation/tasks'
import { TaskStatistics } from '@/types/tasks'

// ============================================================================
// GET /api/tasks/statistics - Get task statistics
// ============================================================================

export const GET = withAuth(async (request: NextRequest, { user, profile }) => {
,
      { status: 401 }
    )
  }

  // Permission check
  if (!validateTaskPermissions(profile.role, 'read')) {
    return createErrorResponse('Insufficient permissions to view task statistics' , 403)
  }

  try {
    const url = new URL(request.url)
    const queryParams = {
      project_id: url.searchParams.get('project_id') || undefined,
      date_range: url.searchParams.get('date_range_start') && url.searchParams.get('date_range_end') ? {
        start: url.searchParams.get('date_range_start')!,
        end: url.searchParams.get('date_range_end')!
      } : undefined,
      include_overdue: url.searchParams.get('include_overdue') !== 'false',
      include_assigned_to_me: url.searchParams.get('include_assigned_to_me') !== 'false',
      group_by: (url.searchParams.get('group_by') || 'status') as 'project' | 'status' | 'priority' | 'assignee' | 'week' | 'month'
    }

    // Validate parameters
    const validationResult = validateTaskStatisticsParams(queryParams)
    if (!validationResult.success) {
      return createErrorResponse('Invalid parameters',
          details: validationResult.error.issues 
        , 400)
    }

    const supabase = createServerClient()

    // Check project access if project_id is specified
    if (queryParams.project_id) {
      const hasProjectAccess = await verifyProjectAccess(supabase, user, queryParams.project_id)
      if (!hasProjectAccess) {
        return createErrorResponse('Access denied to this project' , 403)
      }
    }

    // Get accessible projects for the user
    const accessibleProjects = await getAccessibleProjects(supabase, user)

    // Build base query
    let query = supabase.from('tasks').select('*')

    // Apply project filtering
    if (queryParams.project_id) {
      query = query.eq('project_id', queryParams.project_id)
    } else if (!hasPermission(profile.role, 'projects.read.all')) {
      // Filter by accessible projects for non-admin users
      if (accessibleProjects.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            overall: getEmptyStatistics(),
            byProject: {},
            byStatus: {},
            byPriority: {},
            byAssignee: {},
            byWeek: {},
            byMonth: {}
          }
        })
      }
      query = query.in('project_id', accessibleProjects)
    }

    // Apply date range filtering
    if (queryParams.date_range) {
      query = query.gte('created_at', queryParams.date_range.start)
      query = query.lte('created_at', queryParams.date_range.end)
    }

    const { data: tasks, error: fetchError } = await query

    if (fetchError) {
      console.error('Task statistics fetch error:', fetchError)
      return createErrorResponse('Failed to fetch task statistics' , 500)
    }

    // Calculate comprehensive statistics
    const statistics = await calculateComprehensiveStatistics(
      tasks || [],
      queryParams.group_by,
      queryParams.include_overdue,
      queryParams.include_assigned_to_me,
      user.id,
      supabase
    )

    return createSuccessResponse(statistics
    )

  } catch (error) {
    console.error('Task statistics API error:', error)
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

async function calculateComprehensiveStatistics(
  tasks: any[],
  groupBy: string,
  includeOverdue: boolean,
  includeAssignedToMe: boolean,
  userId: string,
  supabase: any
): Promise<any> {
  const today = new Date().toISOString().split('T')[0]
  const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Calculate overall statistics
  const overall: TaskStatistics = {
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

  // Group statistics
  const byProject: Record<string, TaskStatistics> = {}
  const byStatus: Record<string, number> = {}
  const byPriority: Record<string, number> = {}
  const byAssignee: Record<string, TaskStatistics> = {}
  const byWeek: Record<string, TaskStatistics> = {}
  const byMonth: Record<string, TaskStatistics> = {}

  // Process each task
  tasks.forEach((task: any) => {
    // Update overall stats
    overall.byStatus[task.status as keyof typeof overall.byStatus]++
    overall.byPriority[task.priority as keyof typeof overall.byPriority]++

    if (task.status === 'completed') {
      overall.completed++
    }

    if (includeOverdue && task.due_date && task.due_date < today && !['completed', 'cancelled'].includes(task.status)) {
      overall.overdue++
    }

    if (task.due_date && task.due_date >= today && task.due_date <= weekFromNow) {
      overall.dueThisWeek++
    }

    if (includeAssignedToMe && task.assigned_to === userId) {
      overall.assignedToMe++
    }

    // Group by project
    if (groupBy === 'project') {
      if (!byProject[task.project_id]) {
        byProject[task.project_id] = getEmptyStatistics()
      }
      updateStatistics(byProject[task.project_id], task, today, weekFromNow, userId, includeOverdue, includeAssignedToMe)
    }

    // Group by status
    if (groupBy === 'status') {
      byStatus[task.status] = (byStatus[task.status] || 0) + 1
    }

    // Group by priority
    if (groupBy === 'priority') {
      byPriority[task.priority] = (byPriority[task.priority] || 0) + 1
    }

    // Group by assignee
    if (groupBy === 'assignee' && task.assigned_to) {
      if (!byAssignee[task.assigned_to]) {
        byAssignee[task.assigned_to] = getEmptyStatistics()
      }
      updateStatistics(byAssignee[task.assigned_to], task, today, weekFromNow, userId, includeOverdue, includeAssignedToMe)
    }

    // Group by week
    if (groupBy === 'week') {
      const weekKey = getWeekKey(task.created_at)
      if (!byWeek[weekKey]) {
        byWeek[weekKey] = getEmptyStatistics()
      }
      updateStatistics(byWeek[weekKey], task, today, weekFromNow, userId, includeOverdue, includeAssignedToMe)
    }

    // Group by month
    if (groupBy === 'month') {
      const monthKey = getMonthKey(task.created_at)
      if (!byMonth[monthKey]) {
        byMonth[monthKey] = getEmptyStatistics()
      }
      updateStatistics(byMonth[monthKey], task, today, weekFromNow, userId, includeOverdue, includeAssignedToMe)
    }
  })

  // Get project names for project grouping
  if (groupBy === 'project' && Object.keys(byProject).length > 0) {
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name')
      .in('id', Object.keys(byProject))

    const projectNames: Record<string, string> = {}
    projects?.forEach((project: any) => {
      projectNames[project.id] = project.name
    })

    // Add project names to statistics
    Object.keys(byProject).forEach(projectId => {
      (byProject[projectId] as any).projectName = projectNames[projectId] || 'Unknown Project'
    })
  }

  // Get assignee names for assignee grouping
  if (groupBy === 'assignee' && Object.keys(byAssignee).length > 0) {
    const { data: assignees } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name')
      .in('id', Object.keys(byAssignee))

    const assigneeNames: Record<string, string> = {}
    assignees?.forEach((assignee: any) => {
      assigneeNames[assignee.id] = `${assignee.first_name} ${assignee.last_name}`.trim()
    })

    // Add assignee names to statistics
    Object.keys(byAssignee).forEach(assigneeId => {
      (byAssignee[assigneeId] as any).assigneeName = assigneeNames[assigneeId] || 'Unknown Assignee'
    })
  }

  return {
    overall,
    byProject,
    byStatus,
    byPriority,
    byAssignee,
    byWeek,
    byMonth
  }
}

function updateStatistics(
  stats: TaskStatistics,
  task: any,
  today: string,
  weekFromNow: string,
  userId: string,
  includeOverdue: boolean,
  includeAssignedToMe: boolean
): void {
  stats.total++
  stats.byStatus[task.status as keyof typeof stats.byStatus]++
  stats.byPriority[task.priority as keyof typeof stats.byPriority]++

  if (task.status === 'completed') {
    stats.completed++
  }

  if (includeOverdue && task.due_date && task.due_date < today && !['completed', 'cancelled'].includes(task.status)) {
    stats.overdue++
  }

  if (task.due_date && task.due_date >= today && task.due_date <= weekFromNow) {
    stats.dueThisWeek++
  }

  if (includeAssignedToMe && task.assigned_to === userId) {
    stats.assignedToMe++
  }
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

function getWeekKey(dateString: string): string {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const week = getWeekNumber(date)
  return `${year}-W${week.toString().padStart(2, '0')}`
}

function getMonthKey(dateString: string): string {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  return `${year}-${month.toString().padStart(2, '0')}`
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}