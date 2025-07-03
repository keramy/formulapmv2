/**
 * Client Portal Dashboard - Main Dashboard Data
 * Comprehensive dashboard information for client portal
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { 
  withClientAuth,
  getClientUser,
  logClientActivity
} from '@/lib/middleware/client-auth'
import { 
  ClientApiResponse, 
  ClientDashboardData,
  ClientDashboardStatistics
} from '@/types/client-portal'

// ============================================================================
// GET /api/client-portal/dashboard - Get Dashboard Data
// ============================================================================

export const GET = withClientAuth(async (request: NextRequest) => {
  try {
    const clientUser = getClientUser(request)
    if (!clientUser) {
      return NextResponse.json(
        { success: false, error: 'Client user not found in request' } as ClientApiResponse<null>,
        { status: 401 }
      )
    }

    const supabase = createServerClient()

    // Get all data in parallel for better performance
    const [
      projectsResult,
      pendingApprovalsResult,
      recentActivitiesResult,
      notificationsResult,
      messagesResult,
      statisticsResult
    ] = await Promise.all([
      getClientProjects(supabase, clientUser.id),
      getPendingApprovals(supabase, clientUser.id),
      getRecentActivities(supabase, clientUser.id),
      getNotifications(supabase, clientUser.id),
      getRecentMessages(supabase, clientUser.id),
      getDashboardStatistics(supabase, clientUser.id)
    ])

    // Log dashboard access
    await logClientActivity(clientUser.id, 'project_access', {
      action_taken: 'Dashboard accessed',
      description: 'Client user accessed main dashboard',
      ip_address: request.ip,
      user_agent: request.headers.get('user-agent') || undefined,
      metadata: {
        dashboard_accessed: true,
        projects_count: projectsResult.length,
        pending_approvals: pendingApprovalsResult,
        unread_notifications: notificationsResult.unread_count
      }
    })

    const dashboardData: ClientDashboardData = {
      projects: projectsResult,
      pending_approvals: pendingApprovalsResult,
      recent_activities: recentActivitiesResult,
      notifications: notificationsResult,
      messages: messagesResult
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          dashboard: dashboardData,
          statistics: statisticsResult
        }
      } as ClientApiResponse<{
        dashboard: ClientDashboardData,
        statistics: ClientDashboardStatistics
      }>,
      { status: 200 }
    )

  } catch (error) {
    console.error('Client dashboard error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load dashboard data' } as ClientApiResponse<null>,
      { status: 500 }
    )
  }
})

// ============================================================================
// Helper Functions
// ============================================================================

async function getClientProjects(supabase: any, clientUserId: string) {
  const { data: projectAccess, error } = await supabase
    .from('client_project_access')
    .select(`
      project:projects(
        id, name, description, status, progress, 
        start_date, end_date, created_at,
        project_milestones(
          id, name, target_date, status, description
        )
      ),
      access_level, can_view_financials, can_approve_documents,
      can_view_schedules, can_access_reports
    `)
    .eq('client_user_id', clientUserId)
    .or('access_end_date.is.null,access_end_date.gte.now()')
    .eq('project.is_active', true)

  if (error) {
    console.error('Client projects fetch error:', error)
    return []
  }

  return (projectAccess || []).map((access: any) => {
    const project = access.project
    
    // Find next milestone
    const upcomingMilestones = project.project_milestones
      ?.filter((m: any) => new Date(m.target_date) > new Date() && m.status !== 'completed')
      ?.sort((a: any, b: any) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime())

    return {
      id: project.id,
      name: project.name,
      status: project.status,
      progress: project.progress || 0,
      access_level: access.access_level,
      permissions: {
        can_view_financials: access.can_view_financials,
        can_approve_documents: access.can_approve_documents,
        can_view_schedules: access.can_view_schedules,
        can_access_reports: access.can_access_reports
      },
      next_milestone: upcomingMilestones?.[0] ? {
        name: upcomingMilestones[0].name,
        date: new Date(upcomingMilestones[0].target_date)
      } : undefined
    }
  })
}

async function getPendingApprovals(supabase: any, clientUserId: string): Promise<number> {
  // Get documents that require approval from this client
  const { data: pendingDocs, error } = await supabase
    .from('client_document_access')
    .select('document_id')
    .eq('client_user_id', clientUserId)
    .eq('can_approve', true)
    .not('document_id', 'in', `(
      SELECT document_id 
      FROM client_document_approvals 
      WHERE client_user_id = '${clientUserId}' 
      AND is_final = true
    )`)

  if (error) {
    console.error('Pending approvals fetch error:', error)
    return 0
  }

  return pendingDocs?.length || 0
}

async function getRecentActivities(supabase: any, clientUserId: string) {
  const { data: activities, error } = await supabase
    .from('client_activity_log')
    .select(`
      id, activity_type, action_taken, description,
      created_at, resource_type, resource_id,
      project:projects(id, name)
    `)
    .eq('client_user_id', clientUserId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Recent activities fetch error:', error)
    return []
  }

  return activities || []
}

async function getNotifications(supabase: any, clientUserId: string) {
  const { data: notifications, error } = await supabase
    .from('client_notifications')
    .select(`
      id, title, message, notification_type, priority,
      is_read, created_at, scheduled_for,
      project:projects(id, name)
    `)
    .eq('client_user_id', clientUserId)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Notifications fetch error:', error)
    return { unread_count: 0, recent: [] }
  }

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0

  return {
    unread_count: unreadCount,
    recent: notifications || []
  }
}

async function getRecentMessages(supabase: any, clientUserId: string) {
  const { data: threads, error } = await supabase
    .from('client_communication_threads')
    .select(`
      id, subject, thread_type, priority, status,
      last_message_at, created_at,
      project:projects(id, name),
      messages:client_messages(
        id, message_body, is_read, created_at,
        sender:user_profiles(first_name, last_name)
      )
    `)
    .eq('client_user_id', clientUserId)
    .order('last_message_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Recent messages fetch error:', error)
    return { unread_count: 0, recent_threads: [] }
  }

  // Count unread messages across all threads
  let unreadCount = 0
  threads?.forEach(thread => {
    thread.messages?.forEach((message: any) => {
      if (!message.is_read) unreadCount++
    })
  })

  return {
    unread_count: unreadCount,
    recent_threads: threads || []
  }
}

async function getDashboardStatistics(supabase: any, clientUserId: string): Promise<ClientDashboardStatistics> {
  const [
    projectsCount,
    activeProjectsCount,
    pendingApprovalsCount,
    unreadNotificationsCount,
    unreadMessagesCount,
    recentActivitiesCount
  ] = await Promise.all([
    // Total projects
    supabase
      .from('client_project_access')
      .select('id', { count: 'exact' })
      .eq('client_user_id', clientUserId),
    
    // Active projects
    supabase
      .from('client_project_access')
      .select('id', { count: 'exact' })
      .eq('client_user_id', clientUserId)
      .eq('project.status', 'active'),
    
    // Pending approvals
    supabase
      .from('client_document_access')
      .select('id', { count: 'exact' })
      .eq('client_user_id', clientUserId)
      .eq('can_approve', true),
    
    // Unread notifications
    supabase
      .from('client_notifications')
      .select('id', { count: 'exact' })
      .eq('client_user_id', clientUserId)
      .eq('is_read', false),
    
    // Unread messages
    supabase
      .rpc('count_unread_client_messages', { client_user_id: clientUserId }),
    
    // Recent activities (this month)
    supabase
      .from('client_activity_log')
      .select('id', { count: 'exact' })
      .eq('client_user_id', clientUserId)
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
  ])

  return {
    total_projects: projectsCount.count || 0,
    active_projects: activeProjectsCount.count || 0,
    pending_approvals: pendingApprovalsCount.count || 0,
    unread_notifications: unreadNotificationsCount.count || 0,
    unread_messages: unreadMessagesCount.data || 0,
    recent_activities_count: recentActivitiesCount.count || 0
  }
}