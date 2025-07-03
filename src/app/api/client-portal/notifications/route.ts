/**
 * Client Portal Notifications - Main Notifications Management
 * Client notification system with preferences and bulk operations
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
  clientBulkOperationSchema,
  validateClientPortalQueryParams,
  validateClientPortalInput
} from '@/lib/validation/client-portal'
import { 
  ClientApiResponse, 
  ClientListResponse
} from '@/types/client-portal'

// ============================================================================
// GET /api/client-portal/notifications - Get Client's Notifications
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
      delivery_methods: notification.delivery_method,
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
      } : null,
      // Time-based properties
      is_recent: new Date(notification.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000),
      age_hours: Math.floor((Date.now() - new Date(notification.created_at).getTime()) / (1000 * 60 * 60))
    }))

    // Get notification statistics
    const notificationStats = await getNotificationStatistics(supabase, clientUser.id)

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
// PUT /api/client-portal/notifications - Bulk Operations on Notifications
// ============================================================================

export const PUT = withClientAuth(async (request: NextRequest) => {
  try {
    const clientUser = getClientUser(request)
    if (!clientUser) {
      return NextResponse.json(
        { success: false, error: 'Client user not found in request' } as ClientApiResponse<null>,
        { status: 401 }
      )
    }

    const body = await request.json()
    const validationResult = validateClientPortalInput(clientBulkOperationSchema, body)

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid bulk operation data',
          details: validationResult.error.errors.map(e => e.message)
        } as ClientApiResponse<null>,
        { status: 400 }
      )
    }

    const { operation, item_ids } = validationResult.data
    const supabase = createServerClient()

    // Verify all notifications belong to this client
    const { data: ownedNotifications, error: verifyError } = await supabase
      .from('client_notifications')
      .select('id')
      .eq('client_user_id', clientUser.id)
      .in('id', item_ids)

    if (verifyError) {
      console.error('Notification ownership verification error:', verifyError)
      return NextResponse.json(
        { success: false, error: 'Failed to verify notification ownership' } as ClientApiResponse<null>,
        { status: 500 }
      )
    }

    const ownedIds = ownedNotifications?.map(n => n.id) || []
    const unauthorizedIds = item_ids.filter(id => !ownedIds.includes(id))

    if (unauthorizedIds.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Access denied to some notifications',
          details: [`Unauthorized access to ${unauthorizedIds.length} notifications`]
        } as ClientApiResponse<null>,
        { status: 403 }
      )
    }

    // Perform bulk operation
    let updateData: any = {}
    let operationDescription = ''

    switch (operation) {
      case 'mark_read':
        updateData = { 
          is_read: true, 
          read_at: new Date().toISOString() 
        }
        operationDescription = 'marked as read'
        break
      case 'mark_unread':
        updateData = { 
          is_read: false, 
          read_at: null 
        }
        operationDescription = 'marked as unread'
        break
      case 'delete':
        // For notifications, we'll use soft delete (dismissed)
        updateData = { 
          dismissed: true, 
          dismissed_at: new Date().toISOString() 
        }
        operationDescription = 'dismissed'
        break
      case 'archive':
        updateData = { 
          dismissed: true, 
          dismissed_at: new Date().toISOString() 
        }
        operationDescription = 'archived'
        break
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid operation' } as ClientApiResponse<null>,
          { status: 400 }
        )
    }

    // Execute bulk update
    const { error: updateError } = await supabase
      .from('client_notifications')
      .update(updateData)
      .eq('client_user_id', clientUser.id)
      .in('id', ownedIds)

    if (updateError) {
      console.error('Bulk notification update error:', updateError)
      return NextResponse.json(
        { success: false, error: `Failed to ${operationDescription} notifications` } as ClientApiResponse<null>,
        { status: 500 }
      )
    }

    // Log bulk operation
    await logClientActivity(clientUser.id, 'project_access', {
      action_taken: `Bulk notification operation: ${operation}`,
      description: `Client ${operationDescription} ${ownedIds.length} notifications`,
      ip_address: request.ip,
      user_agent: request.headers.get('user-agent') || undefined,
      metadata: {
        bulk_operation: true,
        operation: operation,
        affected_count: ownedIds.length,
        notification_ids: ownedIds
      }
    })

    return NextResponse.json(
      {
        success: true,
        message: `Successfully ${operationDescription} ${ownedIds.length} notifications`,
        data: {
          operation: operation,
          affected_count: ownedIds.length
        }
      } as ClientApiResponse<{ operation: string; affected_count: number }>,
      { status: 200 }
    )

  } catch (error) {
    console.error('Bulk notification operation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to perform bulk operation' } as ClientApiResponse<null>,
      { status: 500 }
    )
  }
})

// ============================================================================
// Helper Functions
// ============================================================================

async function getNotificationStatistics(supabase: any, clientUserId: string) {
  const [
    unreadCount,
    totalCount,
    recentCount,
    byTypeData,
    byPriorityData
  ] = await Promise.all([
    // Unread notifications
    supabase
      .from('client_notifications')
      .select('id', { count: 'exact' })
      .eq('client_user_id', clientUserId)
      .eq('is_read', false)
      .eq('dismissed', false),
    
    // Total notifications
    supabase
      .from('client_notifications')
      .select('id', { count: 'exact' })
      .eq('client_user_id', clientUserId)
      .eq('dismissed', false),
    
    // Recent notifications (last 7 days)
    supabase
      .from('client_notifications')
      .select('id', { count: 'exact' })
      .eq('client_user_id', clientUserId)
      .eq('dismissed', false)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    
    // By type
    supabase
      .from('client_notifications')
      .select('notification_type')
      .eq('client_user_id', clientUserId)
      .eq('dismissed', false),
    
    // By priority
    supabase
      .from('client_notifications')
      .select('priority')
      .eq('client_user_id', clientUserId)
      .eq('dismissed', false)
  ])

  // Process statistics
  const byType = byTypeData.data?.reduce((acc: any, item: any) => {
    acc[item.notification_type] = (acc[item.notification_type] || 0) + 1
    return acc
  }, {}) || {}

  const byPriority = byPriorityData.data?.reduce((acc: any, item: any) => {
    acc[item.priority] = (acc[item.priority] || 0) + 1
    return acc
  }, {}) || {}

  return {
    unread_count: unreadCount.count || 0,
    total_count: totalCount.count || 0,
    recent_count: recentCount.count || 0,
    by_type: byType,
    by_priority: byPriority
  }
}