/**
 * Formula PM 2.0 Milestones API - Main Route
 * V3 Phase 1 Implementation
 * 
 * Handles milestone listing, creation, and bulk operations with role-based access control
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'
import { 
  validateMilestoneFormData,
  validateMilestoneListParams,
  validateMilestonePermissions,
  validateMilestoneAccess,
  calculateMilestoneStatus
} from '@/lib/validation/milestones'
import { Milestone, MilestoneFilters, MilestoneStatistics } from '@/types/milestones'

// ============================================================================
// GET /api/milestones - List milestones with filtering and pagination
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
    return createErrorResponse('Insufficient permissions to view milestones' , 403)
  }

  try {
    const url = new URL(request.url)
    const queryParams = {
      page: parseInt(url.searchParams.get('page') || '1'),
      limit: parseInt(url.searchParams.get('limit') || '20'),
      include_creator: url.searchParams.get('include_creator') === 'true',
      include_project: url.searchParams.get('include_project') === 'true',
      project_id: url.searchParams.get('project_id') || undefined,
      filters: {
        status: url.searchParams.get('status')?.split(',') as any || undefined,
        search: url.searchParams.get('search') || undefined,
        target_date_start: url.searchParams.get('target_date_start') || undefined,
        target_date_end: url.searchParams.get('target_date_end') || undefined,
        overdue_only: url.searchParams.get('overdue_only') === 'true',
        upcoming_only: url.searchParams.get('upcoming_only') === 'true',
        completed_only: url.searchParams.get('completed_only') === 'true',
        created_by: url.searchParams.get('created_by') || undefined
      },
      sort: url.searchParams.get('sort_field') ? {
        field: url.searchParams.get('sort_field') as any,
        direction: (url.searchParams.get('sort_direction') || 'asc') as 'asc' | 'desc'
      } : undefined
    }

    // Validate parameters
    const validationResult = validateMilestoneListParams(queryParams)
    if (!validationResult.success) {
      return createErrorResponse('Invalid parameters',
          details: validationResult.error.issues 
        , 400)
    }

    const supabase = createServerClient()

    // Build base query
    let query = supabase
      .from('project_milestones')
      .select(`
        *,
        ${queryParams.include_creator ? 'creator:user_profiles!created_by(id, first_name, last_name, email, avatar_url),' : ''}
        ${queryParams.include_project ? 'project:projects!project_id(id, name, status),' : ''}
        project_id
      `, { count: 'exact' })

    // Apply role-based filtering for project access
    if (!hasPermission(profile.role, 'projects.read.all')) {
      // Get accessible projects for this user
      const accessibleProjects = await getAccessibleProjects(supabase, user)
      if (accessibleProjects.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            milestones: [],
            statistics: getEmptyStatistics()
          },
          pagination: {
            page: 1,
            limit: queryParams.limit,
            total: 0,
            has_more: false
          }
        })
      }
      query = query.in('project_id', accessibleProjects)
    }

    // Apply project filter if specified
    if (queryParams.project_id) {
      // Verify user has access to this project
      const hasProjectAccess = await verifyProjectAccess(supabase, user, queryParams.project_id)
      if (!hasProjectAccess) {
        return createErrorResponse('Access denied to this project' , 403)
      }
      query = query.eq('project_id', queryParams.project_id)
    }

    // Apply filters
    const filters = queryParams.filters
    if (filters) {
      if (filters.status?.length) {
        query = query.in('status', filters.status)
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      if (filters.target_date_start) {
        query = query.gte('target_date', filters.target_date_start)
      }

      if (filters.target_date_end) {
        query = query.lte('target_date', filters.target_date_end)
      }

      if (filters.created_by) {
        query = query.eq('created_by', filters.created_by)
      }

      // Handle exclusive filters
      if (filters.overdue_only) {
        const today = new Date().toISOString().split('T')[0]
        query = query
          .lt('target_date', today)
          .in('status', ['upcoming', 'in_progress', 'overdue'])
      }

      if (filters.upcoming_only) {
        const today = new Date().toISOString().split('T')[0]
        query = query
          .gte('target_date', today)
          .eq('status', 'upcoming')
      }

      if (filters.completed_only) {
        query = query.eq('status', 'completed')
      }
    }

    // Apply sorting
    if (queryParams.sort) {
      query = query.order(queryParams.sort.field, { ascending: queryParams.sort.direction === 'asc' })
    } else {
      query = query.order('target_date', { ascending: true })
    }

    // Apply pagination
    const from = (queryParams.page - 1) * queryParams.limit
    const to = from + queryParams.limit - 1
    query = query.range(from, to)

    const { data: milestones, error: fetchError, count } = await query

    if (fetchError) {
      console.error('Milestones fetch error:', fetchError)
      return createErrorResponse('Failed to fetch milestones' , 500)
    }

    // Update overdue status for milestones
    const enhancedMilestones = milestones?.map(milestone => {
      const currentStatus = calculateMilestoneStatus((milestone as any).target_date, (milestone as any).actual_date)
      return {
        ...(milestone as any),
        // Update computed status if different from stored status
        is_overdue: currentStatus === 'overdue',
        days_until_due: calculateDaysUntilDue((milestone as any).target_date),
        creator: queryParams.include_creator ? (milestone as any).creator : undefined,
        project: queryParams.include_project ? (milestone as any).project : undefined
      }
    }) || []

    // Calculate statistics
    const statistics = await calculateMilestoneStatistics(
      supabase,
      queryParams.project_id,
      queryParams.filters
    )

    return NextResponse.json({
      success: true,
      data: {
        milestones: enhancedMilestones,
        statistics
      },
      pagination: {
        page: queryParams.page,
        limit: queryParams.limit,
        total: count || 0,
        has_more: queryParams.page * queryParams.limit < (count || 0)
      }
    })

  } catch (error) {
    console.error('Milestones API error:', error)
    return createErrorResponse('Internal server error' , 500)
  }
}

// ============================================================================
// POST /api/milestones - Create new milestone
// ============================================================================

export const POST = withAuth(async (request: NextRequest, { user, profile }) => {
,
      { status: 401 }
    )
  }

  // Permission check
  if (!validateMilestonePermissions(profile.role, 'create')) {
    return createErrorResponse('Insufficient permissions to create milestones' , 403)
  }

  try {
    const body = await request.json()
    
    // Validate milestone data
    const validationResult = validateMilestoneFormData(body)
    if (!validationResult.success) {
      return createErrorResponse('Invalid milestone data',
          details: validationResult.error.issues 
        , 400)
    }

    const milestoneData = validationResult.data
    const supabase = createServerClient()

    // Verify user has access to the project
    const hasProjectAccess = await verifyProjectAccess(supabase, user, milestoneData.project_id)
    if (!hasProjectAccess) {
      return createErrorResponse('Access denied to this project' , 403)
    }

    // Check if project exists
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, status')
      .eq('id', milestoneData.project_id)
      .single()

    if (projectError || !project) {
      return createErrorResponse('Project not found' , 404)
    }

    // Calculate automatic status based on target date
    const calculatedStatus = calculateMilestoneStatus(milestoneData.target_date)
    
    // Prepare milestone data
    const insertData = {
      project_id: milestoneData.project_id,
      name: milestoneData.name,
      description: milestoneData.description || null,
      target_date: milestoneData.target_date,
      status: calculatedStatus,
      created_by: user.id
    }

    const { data: milestone, error: insertError } = await supabase
      .from('project_milestones')
      .insert(insertData)
      .select(`
        *,
        creator:user_profiles!created_by(id, first_name, last_name, email, avatar_url),
        project:projects!project_id(id, name, status)
      `)
      .single()

    if (insertError) {
      console.error('Milestone creation error:', insertError)
      return createErrorResponse('Failed to create milestone' , 500)
    }

    // Add computed fields
    const enhancedMilestone = {
      ...milestone,
      is_overdue: calculatedStatus === 'overdue',
      days_until_due: calculateDaysUntilDue(milestone.target_date)
    }

    return NextResponse.json({
      success: true,
      message: 'Milestone created successfully',
      data: {
        milestone: enhancedMilestone
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Milestone creation API error:', error)
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

function calculateDaysUntilDue(targetDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const target = new Date(targetDate)
  target.setHours(0, 0, 0, 0)
  
  const diffTime = target.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

async function calculateMilestoneStatistics(
  supabase: any,
  projectId?: string,
  filters?: MilestoneFilters
): Promise<MilestoneStatistics> {
  let query = supabase.from('project_milestones').select('*')
  
  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  // Apply filters if provided
  if (filters) {
    if (filters.status?.length) {
      query = query.in('status', filters.status)
    }
    if (filters.target_date_start) {
      query = query.gte('target_date', filters.target_date_start)
    }
    if (filters.target_date_end) {
      query = query.lte('target_date', filters.target_date_end)
    }
    if (filters.created_by) {
      query = query.eq('created_by', filters.created_by)
    }
  }

  const { data: milestones } = await query

  if (!milestones) {
    return getEmptyStatistics()
  }

  const today = new Date().toISOString().split('T')[0]
  
  const stats: MilestoneStatistics = {
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
    completionRate: 0
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
  })

  // Calculate completion rate
  if (stats.total > 0) {
    stats.completionRate = Math.round((stats.completed / stats.total) * 100)
  }

  return stats
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