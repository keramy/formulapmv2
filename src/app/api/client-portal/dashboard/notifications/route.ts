/**
 * Client Portal Dashboard - Notifications
 * Client notifications management
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { 
  withClientAuth,
  getClientUser,
  logClientActivity
} from '@/lib/middleware/client-auth'
import { 
  clientNotificationListParamsSchema,
  validateClientPortalQueryParams
} from '@/lib/validation/client-portal'
import { 
  ClientApiResponse, 
  ClientListResponse,
  ClientNotification
} from '@/types/client-portal'

// ============================================================================
// GET /api/client-portal/dashboard/notifications - Get Client's Notifications
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
    
    const validationResult = validateClientPortalQueryParams(clientNotificationListParamsSchema, queryParams)
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

    // Build query for client's notifications
    let query = supabase
      .from('client_notifications')
      .select(`
        id, title, message, notification_type, priority,
        delivery_method, email_sent, sms_sent,
        is_read, read_at, dismissed, dismissed_at,
        created_at, scheduled_for, sent_at,
        project:projects(id, name, status)
      `, { count: 'exact' })
      .eq('client_user_id', clientUser.id)

    // Apply filters
    if (params.notification_type?.length) {
      query = query.in('notification_type', params.notification_type)
    }

    if (params.priority?.length) {
      query = query.in('priority', params.priority)
    }

    if (params.is_read !== undefined) {
      query = query.eq('is_read', params.is_read)
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

    const { data: notifications, error, count } = await query

    if (error) {
      console.error('Client notifications fetch error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch notifications' } as ClientApiResponse<null>,
        { status: 500 }
      )
    }

    // Transform notifications for client consumption
    const transformedNotifications = (notifications || []).map((notification: any) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      notification_type: notification.notification_type,
      priority: notification.priority,
      delivery_method: notification.delivery_method,
      delivery_status: {
        email_sent: notification.email_sent,
        sms_sent: notification.sms_sent
      },
      is_read: notification.is_read,
      read_at: notification.read_at,
      dismissed: notification.dismissed,
      dismissed_at: notification.dismissed_at,
      created_at: notification.created_at,
      scheduled_for: notification.scheduled_for,
      sent_at: notification.sent_at,
      project: notification.project ? {
        id: notification.project.id,
        name: notification.project.name,
        status: notification.project.status
      } : null
    }))

    // Get notification statistics
    const notificationStats = await getNotificationStatistics(supabase, clientUser.id, params)

    // Log notifications access
    await logClientActivity(clientUser.id, 'project_access', {
      action_taken: 'Notifications accessed',
      description: `Client accessed notifications with ${transformedNotifications.length} items`,
      ip_address: request.ip,
      user_agent: request.headers.get('user-agent') || undefined,
      metadata: {
        notifications_accessed: true,
        notifications_count: transformedNotifications.length,
        unread_count: notificationStats.unread_count,
        page: params.page,
        limit: params.limit,
        filters_applied: {
          notification_type: params.notification_type,
          priority: params.priority,
          is_read: params.is_read
        }
      }
    })

    const response: ClientListResponse<any> = {
      items: transformedNotifications,
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
          statistics: notificationStats
        }
      } as ClientApiResponse<ClientListResponse<any> & { statistics: any }>,
      { status: 200 }
    )

  } catch (error) {
    console.error('Client notifications error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' } as ClientApiResponse<null>,
      { status: 500 }
    )
  }
})

// ============================================================================
// Helper Functions
// ============================================================================

async function getNotificationStatistics(supabase: any, clientUserId: string, params: any) {
  // Get unread count
  const { count: unreadCount } = await supabase
    .from('client_notifications')
    .select('id', { count: 'exact' })
    .eq('client_user_id', clientUserId)
    .eq('is_read', false)

  // Get counts by type
  const { data: typeStats } = await supabase
    .from('client_notifications')
    .select('notification_type')
    .eq('client_user_id', clientUserId)

  // Get counts by priority
  const { data: priorityStats } = await supabase
    .from('client_notifications')
    .select('priority')
    .eq('client_user_id', clientUserId)

  // Get recent activity (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { count: recentCount } = await supabase
    .from('client_notifications')
    .select('id', { count: 'exact' })
    .eq('client_user_id', clientUserId)
    .gte('created_at', sevenDaysAgo)

  // Process statistics
  const byType = typeStats?.reduce((acc: any, item: any) => {
    acc[item.notification_type] = (acc[item.notification_type] || 0) + 1
    return acc
  }, {}) || {}

  const byPriority = priorityStats?.reduce((acc: any, item: any) => {
    acc[item.priority] = (acc[item.priority] || 0) + 1
    return acc
  }, {}) || {}

  return {
    unread_count: unreadCount || 0,
    total_count: typeStats?.length || 0,
    recent_count: recentCount || 0,
    by_type: byType,
    by_priority: byPriority
  }
}