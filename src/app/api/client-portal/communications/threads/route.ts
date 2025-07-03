/**
 * Client Portal Communications - Communication Threads
 * Client communication thread management
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { 
  withClientAuth,
  getClientUser,
  logClientActivity
} from '@/lib/middleware/client-auth'
import { 
  clientThreadListParamsSchema,
  clientThreadCreateSchema,
  validateClientPortalQueryParams,
  validateClientPortalInput
} from '@/lib/validation/client-portal'
import { 
  ClientApiResponse, 
  ClientListResponse
} from '@/types/client-portal'

// ============================================================================
// GET /api/client-portal/communications/threads - Get Communication Threads
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
    
    const validationResult = validateClientPortalQueryParams(clientThreadListParamsSchema, queryParams)
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

    // Build query for client's communication threads
    let query = supabase
      .from('client_communication_threads')
      .select(`
        id, subject, thread_type, priority, status,
        internal_participants, client_participants,
        auto_close_after_days, requires_response, response_deadline,
        created_at, updated_at, last_message_at, closed_at,
        project:projects(id, name, status),
        closed_by:user_profiles(first_name, last_name, role),
        messages:client_messages(
          id, message_body, message_type, is_read, created_at,
          sender:user_profiles(first_name, last_name, role)
        )
      `, { count: 'exact' })
      .eq('client_user_id', clientUser.id)

    // Apply filters
    if (params.thread_type?.length) {
      query = query.in('thread_type', params.thread_type)
    }

    if (params.status?.length) {
      query = query.in('status', params.status)
    }

    if (params.priority?.length) {
      query = query.in('priority', params.priority)
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

    const { data: threads, error, count } = await query

    if (error) {
      console.error('Client threads fetch error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch communication threads' } as ClientApiResponse<null>,
        { status: 500 }
      )
    }

    // Transform threads for client consumption
    const transformedThreads = (threads || []).map((thread: any) => {
      const unreadMessages = thread.messages?.filter((m: any) => !m.is_read).length || 0
      const lastMessage = thread.messages?.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]

      return {
        id: thread.id,
        subject: thread.subject,
        thread_type: thread.thread_type,
        priority: thread.priority,
        status: thread.status,
        requires_response: thread.requires_response,
        response_deadline: thread.response_deadline,
        auto_close_after_days: thread.auto_close_after_days,
        created_at: thread.created_at,
        updated_at: thread.updated_at,
        last_message_at: thread.last_message_at,
        closed_at: thread.closed_at,
        
        // Project information
        project: thread.project ? {
          id: thread.project.id,
          name: thread.project.name,
          status: thread.project.status
        } : null,
        
        // Participant counts (don't expose actual participant IDs for security)
        participants: {
          internal_count: thread.internal_participants?.length || 0,
          client_count: thread.client_participants?.length || 0
        },
        
        // Message summary
        messages_summary: {
          total_count: thread.messages?.length || 0,
          unread_count: unreadMessages,
          last_message: lastMessage ? {
            preview: lastMessage.message_body.substring(0, 100) + (lastMessage.message_body.length > 100 ? '...' : ''),
            created_at: lastMessage.created_at,
            sender: lastMessage.sender ? 
              `${lastMessage.sender.first_name} ${lastMessage.sender.last_name}` : 
              'System'
          } : null
        },
        
        // Status indicators
        is_overdue: thread.requires_response && 
                   thread.response_deadline && 
                   new Date(thread.response_deadline) < new Date() && 
                   thread.status === 'pending_response',
        
        closed_by: thread.closed_by ? 
          `${thread.closed_by.first_name} ${thread.closed_by.last_name} (${thread.closed_by.role})` : 
          null
      }
    })

    // Get thread statistics
    const threadStats = await getThreadStatistics(supabase, clientUser.id, params)

    // Log threads access
    await logClientActivity(clientUser.id, 'message_send', {
      action_taken: 'Communication threads accessed',
      description: `Client accessed communication threads with ${transformedThreads.length} threads`,
      ip_address: request.ip,
      user_agent: request.headers.get('user-agent') || undefined,
      metadata: {
        threads_accessed: true,
        threads_count: transformedThreads.length,
        unread_threads: threadStats.unread_threads,
        page: params.page,
        limit: params.limit,
        filters_applied: {
          thread_type: params.thread_type,
          status: params.status,
          priority: params.priority,
          project_id: params.project_id
        }
      }
    })

    const response: ClientListResponse<any> = {
      items: transformedThreads,
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
          statistics: threadStats
        }
      } as ClientApiResponse<ClientListResponse<any> & { statistics: any }>,
      { status: 200 }
    )

  } catch (error) {
    console.error('Client threads error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch communication threads' } as ClientApiResponse<null>,
      { status: 500 }
    )
  }
})

// ============================================================================
// POST /api/client-portal/communications/threads - Create New Thread
// ============================================================================

export const POST = withClientAuth(async (request: NextRequest) => {
  try {
    const clientUser = getClientUser(request)
    if (!clientUser) {
      return NextResponse.json(
        { success: false, error: 'Client user not found in request' } as ClientApiResponse<null>,
        { status: 401 }
      )
    }

    const body = await request.json()
    const validationResult = validateClientPortalInput(clientThreadCreateSchema, body)

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid thread data',
          details: validationResult.error.errors.map(e => e.message)
        } as ClientApiResponse<null>,
        { status: 400 }
      )
    }

    const threadData = validationResult.data
    const supabase = createServerClient()

    // Verify client has access to the project
    const { data: projectAccess, error: accessError } = await supabase
      .from('client_project_access')
      .select('id')
      .eq('client_user_id', clientUser.id)
      .eq('project_id', threadData.project_id)
      .single()

    if (accessError || !projectAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this project' } as ClientApiResponse<null>,
        { status: 403 }
      )
    }

    // Create communication thread
    const { data: newThread, error: createError } = await supabase
      .from('client_communication_threads')
      .insert({
        ...threadData,
        client_user_id: clientUser.id,
        status: 'open'
      })
      .select(`
        id, subject, thread_type, priority, status,
        requires_response, response_deadline,
        created_at, updated_at, last_message_at,
        project:projects(id, name, status)
      `)
      .single()

    if (createError) {
      console.error('Thread creation error:', createError)
      return NextResponse.json(
        { success: false, error: 'Failed to create communication thread' } as ClientApiResponse<null>,
        { status: 500 }
      )
    }

    // Log thread creation
    await logClientActivity(clientUser.id, 'message_send', {
      action_taken: 'Communication thread created',
      description: `Client created new communication thread: ${newThread.subject}`,
      resource_type: 'communication_thread',
      resource_id: newThread.id,
      project_id: threadData.project_id,
      ip_address: request.ip,
      user_agent: request.headers.get('user-agent') || undefined,
      metadata: {
        thread_created: true,
        thread_subject: newThread.subject,
        thread_type: newThread.thread_type,
        priority: newThread.priority
      }
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Communication thread created successfully',
        data: { thread: newThread }
      } as ClientApiResponse<{ thread: any }>,
      { status: 201 }
    )

  } catch (error) {
    console.error('Thread creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create communication thread' } as ClientApiResponse<null>,
      { status: 500 }
    )
  }
})

// ============================================================================
// Helper Functions
// ============================================================================

async function getThreadStatistics(supabase: any, clientUserId: string, params: any) {
  // Get thread counts by status
  const { data: threadsByStatus } = await supabase
    .from('client_communication_threads')
    .select('status')
    .eq('client_user_id', clientUserId)

  // Get unread threads count
  const { count: unreadThreads } = await supabase
    .rpc('count_unread_client_threads', { client_user_id: clientUserId })

  // Get threads requiring response
  const { count: responseRequired } = await supabase
    .from('client_communication_threads')
    .select('id', { count: 'exact' })
    .eq('client_user_id', clientUserId)
    .eq('requires_response', true)
    .eq('status', 'pending_response')

  // Get recent activity (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { count: recentActivity } = await supabase
    .from('client_communication_threads')
    .select('id', { count: 'exact' })
    .eq('client_user_id', clientUserId)
    .gte('last_message_at', sevenDaysAgo)

  // Process statistics
  const byStatus = threadsByStatus?.reduce((acc: any, item: any) => {
    acc[item.status] = (acc[item.status] || 0) + 1
    return acc
  }, {}) || {}

  return {
    total_threads: threadsByStatus?.length || 0,
    unread_threads: unreadThreads || 0,
    response_required: responseRequired || 0,
    recent_activity: recentActivity || 0,
    by_status: byStatus
  }
}