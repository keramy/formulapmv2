/**
 * Client Portal Dashboard - Activities
 * Client's activity history and audit log
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { 
  withClientAuth,
  getClientUser,
  logClientActivity
} from '@/lib/middleware/client-auth'
import { 
  clientActivityListParamsSchema,
  validateClientPortalQueryParams
} from '@/lib/validation/client-portal'
import { 
  ClientApiResponse, 
  ClientListResponse,
  ClientActivityLog
} from '@/types/client-portal'

// ============================================================================
// GET /api/client-portal/dashboard/activities - Get Client's Activity History
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

    // Parse and validate query parameters
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    
    const validationResult = validateClientPortalQueryParams(clientActivityListParamsSchema, queryParams)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid query parameters',
          details: validationResult.error.errors.map(e => e.message)
        } as ClientApiResponse<null>,
        { status: 400 }
      )
    }

    const params = validationResult.data
    const supabase = createServerClient()

    // Build query for client's activities
    let query = supabase
      .from('client_activity_log')
      .select(`
        id, activity_type, resource_type, resource_id,
        action_taken, description, metadata,
        created_at, ip_address, session_id,
        project:projects(id, name, status)
      `, { count: 'exact' })
      .eq('client_user_id', clientUser.id)

    // Apply filters
    if (params.activity_type?.length) {
      query = query.in('activity_type', params.activity_type)
    }

    if (params.project_id) {
      query = query.eq('project_id', params.project_id)
    }

    if (params.date_start) {
      query = query.gte('created_at', params.date_start)
    }

    if (params.date_end) {
      query = query.lte('created_at', params.date_end)
    }

    // Apply sorting
    query = query.order(params.sort_field, { ascending: params.sort_direction === 'asc' })

    // Apply pagination
    const from = (params.page - 1) * params.limit
    const to = from + params.limit - 1
    query = query.range(from, to)

    const { data: activities, error, count } = await query

    if (error) {
      console.error('Client activities fetch error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch activities' } as ClientApiResponse<null>,
        { status: 500 }
      )
    }

    // Transform activities for client consumption
    const transformedActivities = (activities || []).map((activity: any) => ({
      id: activity.id,
      activity_type: activity.activity_type,
      resource_type: activity.resource_type,
      resource_id: activity.resource_id,
      action_taken: activity.action_taken,
      description: activity.description,
      created_at: activity.created_at,
      project: activity.project ? {
        id: activity.project.id,
        name: activity.project.name,
        status: activity.project.status
      } : null,
      // Include safe metadata (excluding sensitive info like user_agent, IP)
      metadata: activity.metadata ? {
        ...activity.metadata,
        ip_address: undefined,
        user_agent: undefined,
        session_id: undefined
      } : {}
    }))

    // Get activity statistics for additional context
    const activityStats = await getActivityStatistics(supabase, clientUser.id, params)

    // Log activities access
    await logClientActivity(clientUser.id, 'project_access', {
      action_taken: 'Activity history accessed',
      description: `Client accessed activity history with ${transformedActivities.length} activities`,
      ip_address: request.ip,
      user_agent: request.headers.get('user-agent') || undefined,
      metadata: {
        activities_accessed: true,
        activities_count: transformedActivities.length,
        page: params.page,
        limit: params.limit,
        filters_applied: {
          activity_type: params.activity_type,
          project_id: params.project_id,
          date_range: {
            start: params.date_start,
            end: params.date_end
          }
        }
      }
    })

    const response: ClientListResponse<any> = {
      items: transformedActivities,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: count || 0,
        has_more: params.page * params.limit < (count || 0)
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...response,
          statistics: activityStats
        }
      } as ClientApiResponse<ClientListResponse<any> & { statistics: any }>,
      { status: 200 }
    )

  } catch (error) {
    console.error('Client activities error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activities' } as ClientApiResponse<null>,
      { status: 500 }
    )
  }
})

// ============================================================================
// Helper Functions
// ============================================================================

async function getActivityStatistics(supabase: any, clientUserId: string, params: any) {
  const dateFilter = params.date_start || params.date_end ? {
    start: params.date_start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end: params.date_end || new Date().toISOString()
  } : null

  // Get activity counts by type
  let activityTypeQuery = supabase
    .from('client_activity_log')
    .select('activity_type', { count: 'exact' })
    .eq('client_user_id', clientUserId)

  if (dateFilter) {
    activityTypeQuery = activityTypeQuery
      .gte('created_at', dateFilter.start)
      .lte('created_at', dateFilter.end)
  }

  const { data: activityTypes } = await activityTypeQuery

  // Get daily activity counts for the last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: dailyActivities } = await supabase
    .rpc('get_client_daily_activities', {
      client_user_id: clientUserId,
      start_date: thirtyDaysAgo,
      end_date: new Date().toISOString()
    })

  // Get most active projects
  const { data: projectActivities } = await supabase
    .from('client_activity_log')
    .select(`
      project_id,
      project:projects(id, name),
      count:activity_type
    `)
    .eq('client_user_id', clientUserId)
    .not('project_id', 'is', null)
    .gte('created_at', thirtyDaysAgo)
    .limit(5)

  // Process activity type statistics
  const activityTypeStats = activityTypes?.reduce((acc: any, item: any) => {
    acc[item.activity_type] = (acc[item.activity_type] || 0) + 1
    return acc
  }, {}) || {}

  // Process project activity statistics
  const projectStats = projectActivities?.reduce((acc: any, item: any) => {
    const projectId = item.project_id
    if (!acc[projectId]) {
      acc[projectId] = {
        project: item.project,
        count: 0
      }
    }
    acc[projectId].count += 1
    return acc
  }, {}) || {}

  const topProjects = Object.values(projectStats)
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 5)

  return {
    total_activities: activityTypes?.length || 0,
    by_type: activityTypeStats,
    daily_activities: dailyActivities || [],
    top_projects: topProjects,
    date_range: dateFilter || {
      start: thirtyDaysAgo,
      end: new Date().toISOString()
    }
  }
}