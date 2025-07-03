/**
 * Formula PM 2.0 Projects API - Main Route
 * Wave 2 Business Logic Implementation
 * 
 * Handles project listing and creation with role-based access control
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, getAuthenticatedUser } from '@/lib/middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'
import { 
  validateProjectFormData, 
  validateProjectListParams,
  validateProjectPermissions 
} from '@/lib/validation/projects'
import { ProjectWithDetails, ProjectListResponse } from '@/types/projects'

// ============================================================================
// GET /api/projects - List projects with filtering and pagination
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
        { success: false, error: 'Insufficient permissions to view projects' },
        { status: 403 }
      )
    }

    const url = new URL(request.url)
    const queryParams = {
      page: parseInt(url.searchParams.get('page') || '1'),
      limit: parseInt(url.searchParams.get('limit') || '20'),
      include_details: url.searchParams.get('include_details') === 'true',
      // Filters
      status: url.searchParams.get('status')?.split(','),
      client_id: url.searchParams.get('client_id'),
      project_manager_id: url.searchParams.get('project_manager_id'),
      project_type: url.searchParams.get('project_type'),
      search: url.searchParams.get('search'),
      assigned_user_id: url.searchParams.get('assigned_user_id'),
      // Sorting
      sort_field: url.searchParams.get('sort_field') || 'created_at',
      sort_direction: url.searchParams.get('sort_direction') || 'desc'
    }

    // Validate parameters
    const validationResult = validateProjectListParams(queryParams)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid parameters',
          details: validationResult.error.issues 
        },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Build query based on user permissions
    let query = supabase
      .from('projects')
      .select(`
        *,
        client:clients(*),
        project_manager:user_profiles!project_manager_id(*),
        assignments:project_assignments(
          *,
          user:user_profiles(*)
        )
      `, { count: 'exact' })

    // Apply role-based filtering
    if (hasPermission(user.role, 'projects.read.all')) {
      // Management can see all projects - no additional filtering
    } else if (hasPermission(user.role, 'projects.read.assigned')) {
      // Project roles can see assigned projects
      const { data: assignedProjectIds } = await supabase
        .from('project_assignments')
        .select('project_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
      
      const projectIds = assignedProjectIds?.map(p => p.project_id) || []
      query = query.in('id', projectIds)
    } else if (hasPermission(user.role, 'projects.read.own')) {
      // External roles can see their own projects
      if (user.role === 'client') {
        const { data: clientInfo } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', user.id)
          
        const clientIds = clientInfo?.map(c => c.id) || []
        if (clientIds.length > 0) {
          query = query.in('client_id', clientIds)
        } else {
          query = query.eq('id', 'no-projects') // Return empty
        }
      } else {
        // Subcontractors see assigned projects
        const { data: subcontractorProjectIds } = await supabase
          .from('project_assignments')
          .select('project_id')
          .eq('user_id', user.id)
          .eq('is_active', true)
        
        const subcontractorProjectIdsList = subcontractorProjectIds?.map(p => p.project_id) || []
        query = query.in('id', subcontractorProjectIdsList)
      }
    }

    // Apply filters
    if (queryParams.status?.length) {
      query = query.in('status', queryParams.status)
    }

    if (queryParams.client_id) {
      query = query.eq('client_id', queryParams.client_id)
    }

    if (queryParams.project_manager_id) {
      query = query.eq('project_manager_id', queryParams.project_manager_id)
    }

    if (queryParams.project_type) {
      query = query.eq('project_type', queryParams.project_type)
    }

    if (queryParams.search) {
      query = query.or(`name.ilike.%${queryParams.search}%,description.ilike.%${queryParams.search}%,location.ilike.%${queryParams.search}%`)
    }

    // Apply sorting
    query = query.order(queryParams.sort_field, { ascending: queryParams.sort_direction === 'asc' })

    // Apply pagination
    const from = (queryParams.page - 1) * queryParams.limit
    const to = from + queryParams.limit - 1
    query = query.range(from, to)

    const { data: projects, error, count } = await query

    if (error) {
      console.error('Projects fetch error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch projects' },
        { status: 500 }
      )
    }

    // Enhance projects with additional data if requested
    let enhancedProjects = projects as ProjectWithDetails[]
    
    if (queryParams.include_details && projects) {
      enhancedProjects = await Promise.all(
        projects.map(async (project) => {
          // Get scope items count and completion
          const { data: scopeStats } = await supabase
            .from('scope_items')
            .select('status')
            .eq('project_id', project.id)

          const scopeItemsCount = scopeStats?.length || 0
          const scopeItemsCompleted = scopeStats?.filter(item => item.status === 'completed').length || 0

          // Get documents count
          const { count: documentsCount } = await supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id)

          // Calculate progress
          const progressPercentage = scopeItemsCount > 0 ? Math.round((scopeItemsCompleted / scopeItemsCount) * 100) : 0

          // Calculate days remaining
          let daysRemaining = 0
          if (project.end_date) {
            const endDate = new Date(project.end_date)
            const today = new Date()
            daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          }

          return {
            ...project,
            scope_items_count: scopeItemsCount,
            scope_items_completed: scopeItemsCompleted,
            documents_count: documentsCount || 0,
            team_size: project.assignments?.length || 0,
            progress_percentage: progressPercentage,
            days_remaining: daysRemaining,
            budget_used_percentage: project.budget && project.actual_cost ? 
              Math.round((project.actual_cost / project.budget) * 100) : 0
          }
        })
      )
    }

    const totalPages = Math.ceil((count || 0) / queryParams.limit)

    const response: ProjectListResponse = {
      success: true,
      data: {
        projects: enhancedProjects,
        total_count: count || 0,
        page: queryParams.page,
        limit: queryParams.limit,
        has_more: queryParams.page < totalPages
      },
      metadata: {
        total_count: count || 0,
        page: queryParams.page,
        limit: queryParams.limit,
        has_more: queryParams.page < totalPages
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Projects API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// ============================================================================
// POST /api/projects - Create new project
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

    // Check create permission
    if (!hasPermission(user.role, 'projects.create')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to create projects' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validate project data
    const validationResult = validateProjectFormData(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid project data',
          details: validationResult.error.issues 
        },
        { status: 400 }
      )
    }

    const projectData = validationResult.data
    const supabase = createServerClient()

    // Start transaction for project creation
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: projectData.name,
        description: projectData.description,
        project_type: projectData.project_type,
        priority: projectData.priority,
        location: projectData.location,
        client_id: projectData.client_id,
        project_manager_id: projectData.project_manager_id,
        status: 'planning',
        start_date: projectData.start_date,
        end_date: projectData.end_date,
        budget: projectData.budget,
        actual_cost: 0,
        metadata: {
          ...projectData.metadata,
          approval_workflow_enabled: projectData.approval_workflow_enabled,
          client_portal_enabled: projectData.client_portal_enabled,
          mobile_reporting_enabled: projectData.mobile_reporting_enabled,
          created_by: user.id
        }
      })
      .select()
      .single()

    if (projectError) {
      console.error('Project creation error:', projectError)
      return NextResponse.json(
        { success: false, error: 'Failed to create project' },
        { status: 500 }
      )
    }

    // Create team assignments
    if (projectData.team_assignments?.length > 0) {
      const assignments = projectData.team_assignments.map(assignment => ({
        project_id: project.id,
        user_id: assignment.user_id,
        role: assignment.role,
        responsibilities: assignment.responsibilities,
        assigned_by: user.id,
        is_active: true
      }))

      const { error: assignmentError } = await supabase
        .from('project_assignments')
        .insert(assignments)

      if (assignmentError) {
        console.error('Project assignments error:', assignmentError)
        // Don't fail the whole operation, but log the error
      }
    }

    // Initialize default scope items if template provided
    if (projectData.template_id) {
      await initializeProjectFromTemplate(supabase, project.id, projectData.template_id)
    } else {
      await createDefaultScopeItems(supabase, project.id, projectData.project_type || 'commercial')
    }

    // Create project document folders in storage
    await initializeProjectStorage(supabase, project.id)

    // Get the complete project data with relations
    const { data: completeProject } = await supabase
      .from('projects')
      .select(`
        *,
        client:clients(*),
        project_manager:user_profiles!project_manager_id(*),
        assignments:project_assignments(
          *,
          user:user_profiles(*)
        )
      `)
      .eq('id', project.id)
      .single()

    return NextResponse.json({
      success: true,
      message: 'Project created successfully',
      data: {
        project: completeProject
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Project creation API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function initializeProjectFromTemplate(supabase: any, projectId: string, templateId: string) {
  try {
    const { data: template } = await supabase
      .from('project_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (!template) return

    // Create scope items from template
    if (template.default_scope_categories?.length > 0) {
      const scopeItems = template.default_scope_categories.map((category: string, index: number) => ({
        project_id: projectId,
        category,
        description: `Default ${category} scope item`,
        quantity: 1,
        unit_price: 0,
        status: 'not_started',
        progress_percentage: 0,
        priority: index + 1
      }))

      await supabase
        .from('scope_items')
        .insert(scopeItems)
    }
  } catch (error) {
    console.error('Template initialization error:', error)
  }
}

async function createDefaultScopeItems(supabase: any, projectId: string, projectType: string) {
  try {
    const defaultCategories = getDefaultCategoriesForType(projectType)
    
    const scopeItems = defaultCategories.map((category, index) => ({
      project_id: projectId,
      category,
      description: `${category} work for ${projectType} project`,
      quantity: 1,
      unit_price: 0,
      status: 'not_started',
      progress_percentage: 0,
      priority: index + 1
    }))

    await supabase
      .from('scope_items')
      .insert(scopeItems)
  } catch (error) {
    console.error('Default scope items creation error:', error)
  }
}

function getDefaultCategoriesForType(projectType: string): string[] {
  const categoryMap: Record<string, string[]> = {
    'commercial': ['construction', 'electrical', 'mechanical', 'millwork'],
    'residential': ['construction', 'electrical', 'mechanical'],
    'industrial': ['construction', 'electrical', 'mechanical'],
    'renovation': ['construction', 'electrical', 'millwork'],
    'tenant_improvement': ['construction', 'electrical', 'mechanical', 'millwork'],
    'infrastructure': ['construction', 'electrical', 'mechanical']
  }

  return categoryMap[projectType] || ['construction']
}

async function initializeProjectStorage(supabase: any, projectId: string) {
  try {
    const folders = [
      'contracts',
      'shop_drawings',
      'material_specs', 
      'reports',
      'photos',
      'permits',
      'correspondence'
    ]

    // Create folder structure in Supabase Storage
    for (const folder of folders) {
      await supabase.storage
        .from('project-documents')
        .upload(`${projectId}/${folder}/.keep`, new Blob(['']))
        .catch(() => {
          // Ignore errors - folders might already exist
        })
    }
  } catch (error) {
    console.error('Project storage initialization error:', error)
  }
}