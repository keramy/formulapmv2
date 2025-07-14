/**
 * Formula PM 2.0 Milestone Statistics API
 * V3 Phase 1 Implementation
 * 
 * Provides milestone statistics for dashboard integration and analytics
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'
import { 
  validateMilestoneStatisticsParams,
  validateMilestonePermissions,
  calculateMilestoneStatus
} from '@/lib/validation/milestones'
import { MilestoneStatistics } from '@/types/milestones'

// ============================================================================
// GET /api/milestones/statistics - Get milestone statistics
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
    return createErrorResponse('Insufficient permissions to view milestone statistics' , 403)
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
      include_upcoming: url.searchParams.get('include_upcoming') !== 'false',
      group_by: (url.searchParams.get('group_by') || 'status') as 'project' | 'status' | 'month' | 'quarter'
    }

    // Validate parameters
    const validationResult = validateMilestoneStatisticsParams(queryParams)
    if (!validationResult.success) {
      return createErrorResponse('Invalid parameters',
          details: validationResult.error.issues 
        , 400)
    }

    const supabase = createServerClient()

    // Get accessible projects for this user
    const accessibleProjects = await getAccessibleProjects(supabase, user, profile.role as any)

    // Build base query
    let query = supabase
      .from('project_milestones')
      .select(`
        *,
        project:projects!project_id(id, name, status, client_id)
      `)

    // Apply project access restrictions
    if (!hasPermission(profile.role, 'projects.read.all')) {
      if (accessibleProjects.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            statistics: getEmptyStatistics(),
            breakdown: {},
            trends: []
          }
        })
      }
      query = query.in('project_id', accessibleProjects)
    }

    // Apply project filter if specified
    if (queryParams.project_id) {
      // Verify user has access to this project
      if (!accessibleProjects.includes(queryParams.project_id)) {
        return createErrorResponse('Access denied to this project' , 403)
      }
      query = query.eq('project_id', queryParams.project_id)
    }

    // Apply date range filter
    if (queryParams.date_range) {
      query = query
        .gte('target_date', queryParams.date_range.start)
        .lte('target_date', queryParams.date_range.end)
    }

    const { data: milestones, error: fetchError } = await query

    if (fetchError) {
      console.error('Milestone statistics fetch error:', fetchError)
      return createErrorResponse('Failed to fetch milestone statistics' , 500)
    }

    if (!milestones || milestones.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          statistics: getEmptyStatistics(),
          breakdown: {},
          trends: []
        }
      })
    }

    // Calculate comprehensive statistics
    const statistics = calculateComprehensiveStatistics(milestones, queryParams)

    // Calculate breakdown by group_by parameter
    const breakdown = calculateBreakdown(milestones, queryParams.group_by)

    // Calculate trends (last 6 months)
    const trends = calculateTrends(milestones)

    // Calculate upcoming deadlines (next 30 days)
    const upcomingDeadlines = calculateUpcomingDeadlines(milestones)

    // Calculate overdue analysis
    const overdueAnalysis = calculateOverdueAnalysis(milestones)

    // Calculate performance metrics
    const performanceMetrics = calculatePerformanceMetrics(milestones)

    return NextResponse.json({
      success: true,
      data: {
        statistics,
        breakdown,
        trends,
        upcoming_deadlines: upcomingDeadlines,
        overdue_analysis: overdueAnalysis,
        performance_metrics: performanceMetrics
      }
    })

  } catch (error) {
    console.error('Milestone statistics API error:', error)
    return createErrorResponse('Internal server error' , 500)
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getAccessibleProjects(supabase: any, user: any, userRole: string): Promise<string[]> {
  if (hasPermission(userRole as any, 'projects.read.all')) {
    const { data: allProjects } = await supabase
      .from('projects')
      .select('id')
    return allProjects?.map((p: any) => p.id) || []
  }

  if (hasPermission(userRole as any, 'projects.read.assigned')) {
    const { data: assignedProjects } = await supabase
      .from('project_assignments')
      .select('project_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
    return assignedProjects?.map((p: any) => p.project_id) || []
  }

  if (hasPermission(userRole as any, 'projects.read.own') && user.role === 'client') {
    const { data: clientProjects } = await supabase
      .from('projects')
      .select('id')
      .eq('client_id', user.profile?.id)
    return clientProjects?.map((p: any) => p.id) || []
  }

  return []
}

function calculateComprehensiveStatistics(milestones: any[], params: any): MilestoneStatistics & {
  next_30_days: number
  next_7_days: number
  this_month: number
  this_quarter: number
} {
  const today = new Date().toISOString().split('T')[0]
  const next7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const next30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  
  const thisMonth = new Date()
  const thisQuarter = Math.floor(thisMonth.getMonth() / 3) * 3
  
  const stats: MilestoneStatistics & {
    next_30_days: number
    next_7_days: number
    this_month: number
    this_quarter: number
  } = {
    total: milestones.length,
    byStatus: {
      upcoming: 0,
      in_progress: 0,
      completed: 0,
      overdue: 0,
      cancelled: 0
    },
    overdue: 0,
    upcoming: 0,
    completed: 0,
    completionRate: 0,
    next_30_days: 0,
    next_7_days: 0,
    this_month: 0,
    this_quarter: 0
  }

  milestones.forEach((milestone: any) => {
    // Count by status
    stats.byStatus[milestone.status as keyof typeof stats.byStatus]++

    // Count specific categories
    if (milestone.status === 'completed') {
      stats.completed++
    } else if (milestone.status === 'overdue' || 
               (milestone.target_date < today && !['completed', 'cancelled'].includes(milestone.status))) {
      stats.overdue++
    } else if (milestone.status === 'upcoming') {
      stats.upcoming++
    }

    // Count by time periods
    if (milestone.target_date >= today && milestone.target_date <= next7Days) {
      stats.next_7_days++
    }
    if (milestone.target_date >= today && milestone.target_date <= next30Days) {
      stats.next_30_days++
    }

    const targetDate = new Date(milestone.target_date)
    if (targetDate.getMonth() === thisMonth.getMonth() && targetDate.getFullYear() === thisMonth.getFullYear()) {
      stats.this_month++
    }
    if (Math.floor(targetDate.getMonth() / 3) === Math.floor(thisMonth.getMonth() / 3) && 
        targetDate.getFullYear() === thisMonth.getFullYear()) {
      stats.this_quarter++
    }
  })

  // Calculate completion rate
  if (stats.total > 0) {
    stats.completionRate = Math.round((stats.completed / stats.total) * 100)
  }

  return stats
}

function calculateBreakdown(milestones: any[], groupBy: string): Record<string, any> {
  const breakdown: Record<string, any> = {}

  switch (groupBy) {
    case 'project':
      milestones.forEach((milestone: any) => {
        const projectId = milestone.project_id
        const projectName = milestone.project?.name || 'Unknown Project'
        
        if (!breakdown[projectId]) {
          breakdown[projectId] = {
            id: projectId,
            name: projectName,
            total: 0,
            completed: 0,
            overdue: 0,
            upcoming: 0,
            completion_rate: 0
          }
        }
        
        breakdown[projectId].total++
        if (milestone.status === 'completed') {
          breakdown[projectId].completed++
        } else if (milestone.status === 'overdue') {
          breakdown[projectId].overdue++
        } else if (milestone.status === 'upcoming') {
          breakdown[projectId].upcoming++
        }
        
        breakdown[projectId].completion_rate = Math.round(
          (breakdown[projectId].completed / breakdown[projectId].total) * 100
        )
      })
      break

    case 'month':
      milestones.forEach((milestone: any) => {
        const targetDate = new Date(milestone.target_date)
        const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`
        
        if (!breakdown[monthKey]) {
          breakdown[monthKey] = {
            month: monthKey,
            total: 0,
            completed: 0,
            overdue: 0,
            upcoming: 0
          }
        }
        
        breakdown[monthKey].total++
        if (milestone.status === 'completed') {
          breakdown[monthKey].completed++
        } else if (milestone.status === 'overdue') {
          breakdown[monthKey].overdue++
        } else if (milestone.status === 'upcoming') {
          breakdown[monthKey].upcoming++
        }
      })
      break

    case 'quarter':
      milestones.forEach((milestone: any) => {
        const targetDate = new Date(milestone.target_date)
        const quarter = Math.floor(targetDate.getMonth() / 3) + 1
        const quarterKey = `${targetDate.getFullYear()}-Q${quarter}`
        
        if (!breakdown[quarterKey]) {
          breakdown[quarterKey] = {
            quarter: quarterKey,
            total: 0,
            completed: 0,
            overdue: 0,
            upcoming: 0
          }
        }
        
        breakdown[quarterKey].total++
        if (milestone.status === 'completed') {
          breakdown[quarterKey].completed++
        } else if (milestone.status === 'overdue') {
          breakdown[quarterKey].overdue++
        } else if (milestone.status === 'upcoming') {
          breakdown[quarterKey].upcoming++
        }
      })
      break

    default: // 'status'
      milestones.forEach((milestone: any) => {
        const status = milestone.status
        
        if (!breakdown[status]) {
          breakdown[status] = {
            status,
            count: 0,
            milestones: []
          }
        }
        
        breakdown[status].count++
        breakdown[status].milestones.push({
          id: milestone.id,
          name: milestone.name,
          target_date: milestone.target_date,
          project_name: milestone.project?.name || 'Unknown Project'
        })
      })
  }

  return breakdown
}

function calculateTrends(milestones: any[]): Array<{
  month: string
  completed: number
  created: number
  overdue: number
}> {
  const trends: Array<{
    month: string
    completed: number
    created: number
    overdue: number
  }> = []

  // Generate last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    const monthData = {
      month: monthKey,
      completed: 0,
      created: 0,
      overdue: 0
    }

    milestones.forEach((milestone: any) => {
      const targetDate = new Date(milestone.target_date)
      const createdDate = new Date(milestone.created_at)
      
      // Count completed in this month
      if (milestone.status === 'completed' && milestone.actual_date) {
        const actualDate = new Date(milestone.actual_date)
        if (actualDate.getMonth() === date.getMonth() && actualDate.getFullYear() === date.getFullYear()) {
          monthData.completed++
        }
      }
      
      // Count created in this month
      if (createdDate.getMonth() === date.getMonth() && createdDate.getFullYear() === date.getFullYear()) {
        monthData.created++
      }
      
      // Count overdue that became overdue in this month
      if (milestone.status === 'overdue' && 
          targetDate.getMonth() === date.getMonth() && 
          targetDate.getFullYear() === date.getFullYear()) {
        monthData.overdue++
      }
    })

    trends.push(monthData)
  }

  return trends
}

function calculateUpcomingDeadlines(milestones: any[]): Array<{
  id: string
  name: string
  target_date: string
  project_name: string
  days_until_due: number
  priority: 'high' | 'medium' | 'low'
}> {
  const today = new Date()
  const next30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  return milestones
    .filter(milestone => {
      const targetDate = new Date(milestone.target_date)
      return targetDate >= today && targetDate <= next30Days && 
             !['completed', 'cancelled'].includes(milestone.status)
    })
    .map(milestone => {
      const targetDate = new Date(milestone.target_date)
      const daysUntilDue = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      let priority: 'high' | 'medium' | 'low' = 'low'
      if (daysUntilDue <= 3) priority = 'high'
      else if (daysUntilDue <= 7) priority = 'medium'
      
      return {
        id: milestone.id,
        name: milestone.name,
        target_date: milestone.target_date,
        project_name: milestone.project?.name || 'Unknown Project',
        days_until_due: daysUntilDue,
        priority
      }
    })
    .sort((a, b) => a.days_until_due - b.days_until_due)
}

function calculateOverdueAnalysis(milestones: any[]): {
  total_overdue: number
  average_days_overdue: number
  by_project: Record<string, number>
  longest_overdue: {
    id: string
    name: string
    target_date: string
    days_overdue: number
    project_name: string
  } | null
} {
  const today = new Date()
  const overdueMilestones = milestones.filter(milestone => {
    const targetDate = new Date(milestone.target_date)
    return targetDate < today && !['completed', 'cancelled'].includes(milestone.status)
  })

  const byProject: Record<string, number> = {}
  let totalDaysOverdue = 0
  let longestOverdue = null
  let maxDaysOverdue = 0

  overdueMilestones.forEach(milestone => {
    const targetDate = new Date(milestone.target_date)
    const daysOverdue = Math.ceil((today.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24))
    
    totalDaysOverdue += daysOverdue
    
    // Track by project
    const projectName = milestone.project?.name || 'Unknown Project'
    byProject[projectName] = (byProject[projectName] || 0) + 1
    
    // Track longest overdue
    if (daysOverdue > maxDaysOverdue) {
      maxDaysOverdue = daysOverdue
      longestOverdue = {
        id: milestone.id,
        name: milestone.name,
        target_date: milestone.target_date,
        days_overdue: daysOverdue,
        project_name: projectName
      }
    }
  })

  return {
    total_overdue: overdueMilestones.length,
    average_days_overdue: overdueMilestones.length > 0 ? Math.round(totalDaysOverdue / overdueMilestones.length) : 0,
    by_project: byProject,
    longest_overdue: longestOverdue
  }
}

function calculatePerformanceMetrics(milestones: any[]): {
  on_time_completion_rate: number
  average_completion_time: number
  milestone_velocity: number
  quality_score: number
} {
  const completedMilestones = milestones.filter(m => m.status === 'completed')
  
  let onTimeCount = 0
  let totalCompletionDays = 0
  
  completedMilestones.forEach(milestone => {
    if (milestone.actual_date) {
      const targetDate = new Date(milestone.target_date)
      const actualDate = new Date(milestone.actual_date)
      
      // Count on-time completions
      if (actualDate <= targetDate) {
        onTimeCount++
      }
      
      // Calculate completion time
      const createdDate = new Date(milestone.created_at)
      const completionDays = Math.ceil((actualDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
      totalCompletionDays += completionDays
    }
  })

  const onTimeRate = completedMilestones.length > 0 ? Math.round((onTimeCount / completedMilestones.length) * 100) : 0
  const avgCompletionTime = completedMilestones.length > 0 ? Math.round(totalCompletionDays / completedMilestones.length) : 0
  
  // Calculate milestone velocity (milestones completed per month)
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const recentCompletions = completedMilestones.filter(m => 
    m.actual_date && new Date(m.actual_date) >= last30Days
  )
  
  // Quality score based on on-time completion and minimal overdue
  const overdueCount = milestones.filter(m => m.status === 'overdue').length
  const qualityScore = Math.max(0, 100 - (overdueCount * 10) + (onTimeRate * 0.5))

  return {
    on_time_completion_rate: onTimeRate,
    average_completion_time: avgCompletionTime,
    milestone_velocity: recentCompletions.length,
    quality_score: Math.round(qualityScore)
  }
}

function getEmptyStatistics(): MilestoneStatistics {
  return {
    total: 0,
    byStatus: {
      upcoming: 0,
      in_progress: 0,
      completed: 0,
      overdue: 0,
      cancelled: 0
    },
    overdue: 0,
    upcoming: 0,
    completed: 0,
    completionRate: 0
  }
}