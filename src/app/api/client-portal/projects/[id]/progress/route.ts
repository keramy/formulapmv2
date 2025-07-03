/**
 * Client Portal Projects - Project Progress
 * Detailed project progress and milestone tracking for clients
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { 
  withClientAuth,
  getClientUser,
  checkClientProjectAccess,
  logClientActivity
} from '@/lib/middleware/client-auth'
import { ClientApiResponse } from '@/types/client-portal'

// ============================================================================
// GET /api/client-portal/projects/[id]/progress - Get Project Progress
// ============================================================================

export const GET = withClientAuth(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const clientUser = getClientUser(request)
    if (!clientUser) {
      return NextResponse.json(
        { success: false, error: 'Client user not found in request' } as ClientApiResponse<null>,
        { status: 401 }
      )
    }

    const projectId = params.id

    // Verify client has access to this project with schedule viewing permission
    const hasAccess = await checkClientProjectAccess(clientUser.id, projectId, ['view_schedules'])
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied to project schedule information' } as ClientApiResponse<null>,
        { status: 403 }
      )
    }

    const supabase = createServerClient()

    // Get project progress data
    const [projectData, milestonesData, progressHistory] = await Promise.all([
      getProjectBasicInfo(supabase, projectId),
      getProjectMilestones(supabase, projectId),
      getProgressHistory(supabase, projectId)
    ])

    if (!projectData) {
      return NextResponse.json(
        { success: false, error: 'Project not found' } as ClientApiResponse<null>,
        { status: 404 }
      )
    }

    // Calculate progress metrics
    const progressMetrics = calculateProgressMetrics(milestonesData)

    // Log progress access
    await logClientActivity(clientUser.id, 'project_access', {
      action_taken: 'Project progress accessed',
      description: `Client accessed progress information for project: ${projectData.name}`,
      project_id: projectId,
      ip_address: request.ip,
      user_agent: request.headers.get('user-agent') || undefined,
      metadata: {
        progress_accessed: true,
        project_name: projectData.name,
        current_progress: projectData.progress,
        milestones_count: milestonesData.length
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          project: {
            id: projectData.id,
            name: projectData.name,
            status: projectData.status,
            progress: projectData.progress,
            start_date: projectData.start_date,
            end_date: projectData.end_date
          },
          milestones: milestonesData,
          metrics: progressMetrics,
          history: progressHistory
        }
      } as ClientApiResponse<any>,
      { status: 200 }
    )

  } catch (error) {
    console.error('Project progress error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch project progress' } as ClientApiResponse<null>,
      { status: 500 }
    )
  }
})

// ============================================================================
// Helper Functions
// ============================================================================

async function getProjectBasicInfo(supabase: any, projectId: string) {
  const { data: project, error } = await supabase
    .from('projects')
    .select('id, name, status, progress, start_date, end_date')
    .eq('id', projectId)
    .single()

  if (error) {
    console.error('Project basic info fetch error:', error)
    return null
  }

  return project
}

async function getProjectMilestones(supabase: any, projectId: string) {
  const { data: milestones, error } = await supabase
    .from('project_milestones')
    .select(`
      id, name, description, milestone_type,
      target_date, completion_date, status,
      progress_percentage, deliverables,
      dependencies, created_at, updated_at
    `)
    .eq('project_id', projectId)
    .order('target_date', { ascending: true })

  if (error) {
    console.error('Project milestones fetch error:', error)
    return []
  }

  return (milestones || []).map(milestone => ({
    id: milestone.id,
    name: milestone.name,
    description: milestone.description,
    type: milestone.milestone_type,
    target_date: milestone.target_date,
    completion_date: milestone.completion_date,
    status: milestone.status,
    progress: milestone.progress_percentage || 0,
    deliverables: milestone.deliverables || [],
    dependencies: milestone.dependencies || [],
    is_overdue: milestone.status !== 'completed' && new Date(milestone.target_date) < new Date(),
    days_until_due: Math.ceil((new Date(milestone.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  }))
}

async function getProgressHistory(supabase: any, projectId: string) {
  // Get progress updates from the last 6 months
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const { data: history, error } = await supabase
    .from('project_progress_log')
    .select(`
      id, progress_percentage, milestone_id, notes,
      created_at, created_by,
      milestone:project_milestones(id, name),
      created_by_user:user_profiles(first_name, last_name, role)
    `)
    .eq('project_id', projectId)
    .gte('created_at', sixMonthsAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Progress history fetch error:', error)
    return []
  }

  return (history || []).map(entry => ({
    id: entry.id,
    progress: entry.progress_percentage,
    date: entry.created_at,
    notes: entry.notes,
    milestone: entry.milestone ? {
      id: entry.milestone.id,
      name: entry.milestone.name
    } : null,
    updated_by: entry.created_by_user ? 
      `${entry.created_by_user.first_name} ${entry.created_by_user.last_name} (${entry.created_by_user.role})` : 
      'System'
  }))
}

function calculateProgressMetrics(milestones: any[]) {
  const total = milestones.length
  const completed = milestones.filter(m => m.status === 'completed').length
  const inProgress = milestones.filter(m => m.status === 'in_progress').length
  const overdue = milestones.filter(m => m.is_overdue).length
  const upcoming = milestones.filter(m => 
    m.status === 'planned' && 
    m.days_until_due <= 30 && 
    m.days_until_due > 0
  ).length

  // Calculate overall timeline progress
  const now = new Date()
  const projectMilestones = milestones.filter(m => m.target_date)
  
  let timelineProgress = 0
  if (projectMilestones.length > 0) {
    const earliestDate = new Date(Math.min(...projectMilestones.map(m => new Date(m.target_date).getTime())))
    const latestDate = new Date(Math.max(...projectMilestones.map(m => new Date(m.target_date).getTime())))
    
    if (latestDate > earliestDate) {
      const totalDuration = latestDate.getTime() - earliestDate.getTime()
      const elapsed = now.getTime() - earliestDate.getTime()
      timelineProgress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100))
    }
  }

  // Calculate completion rate trend (last 30 days vs previous 30 days)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
  
  const recentCompletions = milestones.filter(m => 
    m.completion_date && 
    new Date(m.completion_date) >= thirtyDaysAgo
  ).length
  
  const previousCompletions = milestones.filter(m => 
    m.completion_date && 
    new Date(m.completion_date) >= sixtyDaysAgo &&
    new Date(m.completion_date) < thirtyDaysAgo
  ).length

  let completionTrend = 'stable'
  if (recentCompletions > previousCompletions) {
    completionTrend = 'improving'
  } else if (recentCompletions < previousCompletions) {
    completionTrend = 'declining'
  }

  return {
    milestones: {
      total,
      completed,
      in_progress: inProgress,
      overdue,
      upcoming,
      completion_rate: total > 0 ? (completed / total) * 100 : 0
    },
    timeline: {
      progress: timelineProgress,
      trend: completionTrend,
      recent_completions: recentCompletions
    },
    risks: {
      overdue_count: overdue,
      at_risk_count: milestones.filter(m => 
        m.status !== 'completed' && 
        m.days_until_due <= 7 && 
        m.days_until_due > 0
      ).length
    }
  }
}