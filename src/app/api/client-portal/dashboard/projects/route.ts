/**
 * Client Portal Dashboard - Projects List
 * Client's accessible projects with filtering
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { 
  withClientAuth,
  getClientUser,
  logClientActivity
} from '@/lib/middleware/client-auth'
import { 
  clientProjectListParamsSchema,
  validateClientPortalQueryParams
} from '@/lib/validation/client-portal'
import { 
  ClientApiResponse, 
  ClientListResponse
} from '@/types/client-portal'

// ============================================================================
// GET /api/client-portal/dashboard/projects - Get Client's Projects
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
    
    const validationResult = validateClientPortalQueryParams(clientProjectListParamsSchema, queryParams)
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

    // Build query for client's accessible projects
    let query = supabase
      .from('client_project_access')
      .select(`
        project:projects(
          id, name, description, status, progress,
          start_date, end_date, created_at, updated_at,
          project_milestones(
            id, name, target_date, status, description,
            completion_date
          ),
          project_assignments(
            id,
            user:user_profiles(
              id, first_name, last_name, email, role
            )
          )
        ),
        access_level, can_view_financials, can_approve_documents,
        can_view_schedules, can_access_reports,
        granted_at, last_accessed
      `, { count: 'exact' })
      .eq('client_user_id', clientUser.id)
      .or('access_end_date.is.null,access_end_date.gte.now()')

    // Apply filters
    if (params.status?.length) {
      query = query.in('project.status', params.status)
    }

    if (params.search) {
      query = query.or(`project.name.ilike.%${params.search}%,project.description.ilike.%${params.search}%`)
    }

    // Apply sorting
    query = query.order(`project.${params.sort_field}`, { ascending: params.sort_direction === 'asc' })

    // Apply pagination
    const from = (params.page - 1) * params.limit
    const to = from + params.limit - 1
    query = query.range(from, to)

    const { data: projectAccess, error, count } = await query

    if (error) {
      console.error('Client projects fetch error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch projects' } as ClientApiResponse<null>,
        { status: 500 }
      )
    }

    // Transform data for client consumption
    const projects = (projectAccess || []).map((access: any) => {
      const project = access.project
      
      // Calculate project statistics
      const totalMilestones = project.project_milestones?.length || 0
      const completedMilestones = project.project_milestones?.filter((m: any) => m.status === 'completed').length || 0
      const upcomingMilestones = project.project_milestones?.filter((m: any) => 
        new Date(m.target_date) > new Date() && m.status !== 'completed'
      )?.sort((a: any, b: any) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime()) || []

      // Get team members (only show relevant team members)
      const teamMembers = project.project_assignments?.map((assignment: any) => ({
        id: assignment.user.id,
        name: `${assignment.user.first_name} ${assignment.user.last_name}`,
        email: assignment.user.email,
        role: assignment.user.role
      })) || []

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        progress: project.progress || 0,
        start_date: project.start_date,
        end_date: project.end_date,
        created_at: project.created_at,
        updated_at: project.updated_at,
        
        // Client-specific access information
        access_level: access.access_level,
        permissions: {
          can_view_financials: access.can_view_financials,
          can_approve_documents: access.can_approve_documents,
          can_view_schedules: access.can_view_schedules,
          can_access_reports: access.can_access_reports
        },
        granted_at: access.granted_at,
        last_accessed: access.last_accessed,
        
        // Project statistics
        milestones: {
          total: totalMilestones,
          completed: completedMilestones,
          completion_rate: totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0,
          next_milestone: upcomingMilestones[0] ? {
            id: upcomingMilestones[0].id,
            name: upcomingMilestones[0].name,
            target_date: upcomingMilestones[0].target_date,
            description: upcomingMilestones[0].description
          } : null
        },
        
        // Team information (limited to what client should see)
        team: teamMembers
      }
    })

    // Log projects access
    await logClientActivity(clientUser.id, 'project_access', {
      action_taken: 'Projects list accessed',
      description: `Client accessed projects list with ${projects.length} projects`,
      ip_address: request.ip,
      user_agent: request.headers.get('user-agent') || undefined,
      metadata: {
        projects_accessed: true,
        projects_count: projects.length,
        page: params.page,
        limit: params.limit,
        filters_applied: {
          status: params.status,
          search: params.search
        }
      }
    })

    const response: ClientListResponse<any> = {
      items: projects,
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
        data: response
      } as ClientApiResponse<ClientListResponse<any>>,
      { status: 200 }
    )

  } catch (error) {
    console.error('Client projects list error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projects list' } as ClientApiResponse<null>,
      { status: 500 }
    )
  }
})