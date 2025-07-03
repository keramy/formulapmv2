/**
 * Formula PM 2.0 Project Metrics API
 * Wave 2 Business Logic Implementation
 * 
 * Provides project analytics and metrics for dashboard displays
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, getAuthenticatedUser } from '@/lib/middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'
import { ProjectMetrics, ProjectMetricsResponse } from '@/types/projects'

// ============================================================================
// GET /api/projects/metrics - Get project metrics and analytics
// ============================================================================

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check read permission
    if (!hasPermission(user.role, 'projects.read.all') && 
        !hasPermission(user.role, 'projects.read.assigned') &&
        !hasPermission(user.role, 'projects.read.own')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to view project metrics' },
        { status: 403 }
      )
    }

    const url = new URL(request.url)
    const includeFinancials = url.searchParams.get('include_financials') === 'true' && 
                             hasPermission(user.role, 'financials.view')

    const supabase = createServerClient()

    // Get projects data based on user permissions
    let projects: any[] = []
    
    if (hasPermission(user.role, 'projects.read.all')) {
      // Management can see all projects
      const { data, error } = await supabase
        .from('projects')
        .select('*')
      
      if (error) {
        console.error('Projects metrics fetch error:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch project metrics' },
          { status: 500 }
        )
      }
      projects = data || []
    } else if (hasPermission(user.role, 'projects.read.assigned')) {
      // Project roles can see assigned projects
      const { data: assignedProjectIds } = await supabase
        .from('project_assignments')
        .select('project_id')
        .eq('user_id', user.id)
        .eq('is_active', true)

      const projectIds = assignedProjectIds?.map(p => p.project_id) || []
      
      if (projectIds.length > 0) {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .in('id', projectIds)
        
        if (error) {
          console.error('Projects metrics fetch error:', error)
          return NextResponse.json(
            { success: false, error: 'Failed to fetch project metrics' },
            { status: 500 }
          )
        }
        projects = data || []
      }
    } else if (hasPermission(user.role, 'projects.read.own')) {
      // External roles can see their own projects
      if (user.role === 'client') {
        const { data: clientInfo } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (clientInfo) {
          const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('client_id', clientInfo.id)
          
          if (error) {
            console.error('Projects metrics fetch error:', error)
            return NextResponse.json(
              { success: false, error: 'Failed to fetch project metrics' },
              { status: 500 }
            )
          }
          projects = data || []
        }
      } else {
        // Subcontractors see assigned projects
        const { data: assignedProjectIds } = await supabase
          .from('project_assignments')
          .select('project_id')
          .eq('user_id', user.id)
          .eq('is_active', true)

        const projectIds = assignedProjectIds?.map(p => p.project_id) || []
        
        if (projectIds.length > 0) {
          const { data, error } = await supabase
            .from('projects')
            .select('*')
            .in('id', projectIds)
          
          if (error) {
            console.error('Projects metrics fetch error:', error)
            return NextResponse.json(
              { success: false, error: 'Failed to fetch project metrics' },
              { status: 500 }
            )
          }
          projects = data || []
        }
      }
    }

    const allProjects = projects

    // Calculate basic metrics
    const totalProjects = allProjects.length
    const activeProjects = allProjects.filter((p: any) => p.status === 'active').length
    const completedProjects = allProjects.filter((p: any) => p.status === 'completed').length
    const projectsOnHold = allProjects.filter((p: any) => p.status === 'on_hold').length
    const planningProjects = allProjects.filter((p: any) => p.status === 'planning').length
    const cancelledProjects = allProjects.filter((p: any) => p.status === 'cancelled').length

    // Financial metrics (if permitted)
    let totalBudget = 0
    let totalActualCost = 0
    let budgetVariance = 0

    if (includeFinancials) {
      totalBudget = allProjects.reduce((sum: number, p: any) => sum + (p.budget || 0), 0)
      totalActualCost = allProjects.reduce((sum: number, p: any) => sum + (p.actual_cost || 0), 0)
      budgetVariance = totalActualCost - totalBudget
    }

    // Get scope items statistics for progress calculation
    const projectIds = allProjects.map((p: any) => p.id)
    let averageCompletionPercentage = 0

    if (projectIds.length > 0) {
      const { data: scopeItems } = await supabase
        .from('scope_items')
        .select('project_id, progress_percentage, status')
        .in('project_id', projectIds)

      if (scopeItems && scopeItems.length > 0) {
        // Calculate average completion percentage across all projects
        const projectProgress = projectIds.map((projectId: string) => {
          const projectScopeItems = scopeItems.filter((si: any) => si.project_id === projectId)
          if (projectScopeItems.length === 0) return 0

          const totalProgress = projectScopeItems.reduce((sum: number, si: any) => sum + (si.progress_percentage || 0), 0)
          return totalProgress / projectScopeItems.length
        })

        averageCompletionPercentage = Math.round(
          projectProgress.reduce((sum: number, progress: number) => sum + progress, 0) / projectProgress.length
        )
      }
    }

    const metrics: ProjectMetrics = {
      total_projects: totalProjects,
      active_projects: activeProjects,
      completed_projects: completedProjects,
      projects_on_hold: projectsOnHold,
      planning_projects: planningProjects,
      cancelled_projects: cancelledProjects,
      total_budget: includeFinancials ? totalBudget : 0,
      total_actual_cost: includeFinancials ? totalActualCost : 0,
      budget_variance: includeFinancials ? budgetVariance : 0,
      average_completion_percentage: averageCompletionPercentage
    }

    // Get detailed statistics for each project (for charts/graphs)
    const projectStatistics = await Promise.all(
      allProjects.slice(0, 10).map(async (project: any) => { // Limit to top 10 for performance
        const [scopeStats, documentsCount] = await Promise.all([
          supabase
            .from('scope_items')
            .select('status, progress_percentage')
            .eq('project_id', project.id),
          
          supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id)
        ])

        const scopeItems = scopeStats.data || []
        const totalScopeItems = scopeItems.length
        const completedScopeItems = scopeItems.filter(si => si.status === 'completed').length
        const inProgressScopeItems = scopeItems.filter(si => si.status === 'in_progress').length
        const blockedScopeItems = scopeItems.filter(si => si.status === 'blocked').length

        // Calculate budget utilization
        let budgetUtilization = 0
        if (includeFinancials && project.budget && project.actual_cost) {
          budgetUtilization = Math.round((project.actual_cost / project.budget) * 100)
        }

        // Calculate timeline progress
        let timelineProgress = 0
        if (project.start_date && project.end_date) {
          const startDate = new Date(project.start_date)
          const endDate = new Date(project.end_date)
          const today = new Date()
          
          if (today >= startDate) {
            const totalDuration = endDate.getTime() - startDate.getTime()
            const elapsedDuration = Math.min(today.getTime() - startDate.getTime(), totalDuration)
            timelineProgress = Math.round((elapsedDuration / totalDuration) * 100)
          }
        }

        return {
          project_id: project.id,
          total_scope_items: totalScopeItems,
          completed_scope_items: completedScopeItems,
          in_progress_scope_items: inProgressScopeItems,
          blocked_scope_items: blockedScopeItems,
          total_documents: documentsCount.count || 0,
          pending_approvals: 0, // Would need approval system
          team_members: 0, // Would need to count assignments
          budget_utilization: budgetUtilization,
          timeline_progress: timelineProgress,
          risk_factors: [] // Would need risk assessment system
        }
      })
    )

    const response: ProjectMetricsResponse = {
      success: true,
      data: {
        metrics,
        statistics: projectStatistics
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Project metrics API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// ============================================================================
// GET /api/projects/metrics/dashboard - Get dashboard-specific metrics
// ============================================================================

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check dashboard view permission
    if (!hasPermission(user.role, 'dashboard.view')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to view dashboard metrics' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      date_range = '30d', 
      include_charts = false,
      include_forecasting = false 
    } = body

    const supabase = createServerClient()

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    
    switch (date_range) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(endDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(endDate.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
      default:
        startDate.setDate(endDate.getDate() - 30)
    }

    // Get projects created in the date range
    let projectsQuery = supabase
      .from('projects')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    // Apply role-based filtering
    if (!hasPermission(user.role, 'projects.read.all')) {
      if (hasPermission(user.role, 'projects.read.assigned')) {
        const { data: assignedProjectIds } = await supabase
          .from('project_assignments')
          .select('project_id')
          .eq('user_id', user.id)
          .eq('is_active', true)

        const projectIds = assignedProjectIds?.map(p => p.project_id) || []
        projectsQuery = projectsQuery.in('id', projectIds)
      }
    }

    const { data: recentProjects } = await projectsQuery

    // Get completion trends
    const completionTrends: any[] = []
    if (include_charts && recentProjects) {
      // Group by week/month based on date range
      const grouping = date_range === '7d' ? 'day' : date_range === '30d' ? 'week' : 'month'
      
      // This would be implemented with proper date grouping
      // For now, return basic trend data
    }

    // Get forecasting data
    let forecastData = null
    if (include_forecasting && hasPermission(user.role, 'financials.view')) {
      // This would implement budget forecasting, timeline predictions, etc.
      forecastData = {
        budget_forecast: {
          projected_overage: 0,
          confidence_level: 'medium',
          risk_factors: []
        },
        timeline_forecast: {
          projected_delays: 0,
          at_risk_projects: 0,
          bottlenecks: []
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        date_range: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          period: date_range
        },
        recent_projects: recentProjects?.length || 0,
        completion_trends: completionTrends,
        forecast: forecastData
      }
    })

  } catch (error) {
    console.error('Dashboard metrics API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})