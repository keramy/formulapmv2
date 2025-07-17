/**
 * SECURE VERSION - Formula PM 2.0 Projects API - Main Route
 * Implements comprehensive security fixes for SQL injection and other vulnerabilities
 */

import { NextRequest, NextResponse } from 'next/server'
import { withSecureAuth, createSecureSuccessResponse, createSecureErrorResponse } from '@/lib/security/secure-api-middleware'
import { createSecureQuery } from '@/lib/security/query-builder'
import { createServerClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'
import { validateProjectFormData, validateProjectListParams, validateProjectPermissions } from '@/lib/validation/projects'
import { z } from 'zod'

// Secure query parameters schema
const projectListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  include_details: z.coerce.boolean().default(false),
  status: z.string().optional().transform(val => val ? val.split(',').filter(s => ['planning', 'active', 'on_hold', 'completed', 'cancelled'].includes(s)) : undefined),
  client_id: z.string().uuid().optional(),
  project_manager_id: z.string().uuid().optional(),
  project_type: z.enum(['commercial', 'residential', 'industrial', 'renovation', 'tenant_improvement', 'infrastructure']).optional(),
  search: z.string().max(100).regex(/^[a-zA-Z0-9\s\-_.,()]+$/).optional(),
  assigned_user_id: z.string().uuid().optional(),
  sort_field: z.enum(['name', 'created_at', 'updated_at', 'start_date', 'end_date', 'budget', 'status']).default('created_at'),
  sort_direction: z.enum(['asc', 'desc']).default('desc')
})

// ============================================================================
// GET /api/projects - List projects with comprehensive security
// ============================================================================

export const GET = withSecureAuth(async (request: NextRequest, { user, profile, requestId }) => {
  try {
    // Parse and validate query parameters securely
    const url = new URL(request.url)
    const rawParams = Object.fromEntries(url.searchParams.entries())
    
    const validationResult = projectListParamsSchema.safeParse(rawParams)
    if (!validationResult.success) {
      return createSecureErrorResponse(
        'Invalid query parameters',
        400,
        requestId,
        { details: validationResult.error.errors }
      )
    }

    const queryParams = validationResult.data

    // Permission check with detailed logging
    if (!hasPermission(profile.role, 'projects.read.all') && 
        !hasPermission(profile.role, 'projects.read.assigned') &&
        !hasPermission(profile.role, 'projects.read.own')) {
      console.warn(`🚨 Unauthorized project access attempt [${requestId}]:`, {
        userId: user.id,
        userRole: profile.role,
        requiredPermissions: ['projects.read.all', 'projects.read.assigned', 'projects.read.own']
      })
      return createSecureErrorResponse('Insufficient permissions to view projects', 403, requestId)
    }

    // Use admin client for management roles to bypass RLS issues
    let supabase
    if (['management', 'admin'].includes(profile.role)) {
      const { supabaseAdmin } = await import('@/lib/supabase')
      supabase = supabaseAdmin
    } else {
      supabase = createServerClient()
    }

    // Create secure query builder
    const secureQuery = createSecureQuery('projects')

    // Build select fields securely
    const selectFields = [
      '*',
      'client:user_profiles!client_id(id, first_name, last_name, email, company)',
      'project_manager:user_profiles!project_manager_id(id, first_name, last_name, email, avatar_url)'
    ]

    // Apply role-based filtering securely
    if (!['management', 'admin', 'management', 'management', 'technical_lead'].includes(profile.role)) {
      if (profile.role === 'client') {
        // Clients can only see their own projects
        secureQuery.addUUIDFilter('client_id', user.id)
      } else {
        // Other roles can see projects they're assigned to
        const accessibleProjects = await getAccessibleProjectsSecurely(user, profile, supabase, requestId)
        if (accessibleProjects.length === 0) {
          return createSecureSuccessResponse({
            projects: [],
            total_count: 0,
            page: queryParams.page,
            limit: queryParams.limit,
            has_more: false
          }, requestId)
        }
        secureQuery.addArrayFilter('id', accessibleProjects)
      }
    }

    // Apply filters securely
    if (queryParams.status?.length) {
      secureQuery.addArrayFilter('status', queryParams.status)
    }

    if (queryParams.client_id) {
      secureQuery.addUUIDFilter('client_id', queryParams.client_id)
    }

    if (queryParams.project_manager_id) {
      secureQuery.addUUIDFilter('project_manager_id', queryParams.project_manager_id)
    }

    if (queryParams.project_type) {
      secureQuery.addFilter('project_type', 'eq', queryParams.project_type)
    }

    if (queryParams.search) {
      // Use secure search filter that prevents SQL injection
      secureQuery.addSearchFilter(queryParams.search, ['name', 'description', 'location'])
    }

    if (queryParams.assigned_user_id) {
      // This requires a join or subquery, handled specially
      const assignedProjects = await getProjectsByAssignedUser(queryParams.assigned_user_id, supabase, requestId)
      if (assignedProjects.length === 0) {
        return createSecureSuccessResponse({
          projects: [],
          total_count: 0,
          page: queryParams.page,
          limit: queryParams.limit,
          has_more: false
        }, requestId)
      }
      secureQuery.addArrayFilter('id', assignedProjects)
    }

    // Apply sorting securely
    secureQuery.addSort(queryParams.sort_field, queryParams.sort_direction === 'asc')

    // Execute secure database operation
    let query = supabase
      .from('projects')
      .select(selectFields.join(', '), { count: 'exact' })

    // Apply secure query filters
    query = secureQuery.applyToQuery(query)

    // Apply pagination
    const from = (queryParams.page - 1) * queryParams.limit
    const to = from + queryParams.limit - 1
    query = query.range(from, to)

    const { data: projects, error, count } = await query

    if (error) {
      console.error(`❌ Projects fetch error [${requestId}]:`, error)
      return createSecureErrorResponse('Failed to fetch projects', 500, requestId)
    }

    // If detailed information is requested, fetch additional data
    let enhancedProjects = projects || []
    if (queryParams.include_details && projects?.length > 0) {
      enhancedProjects = await enhanceProjectsWithDetails(projects, supabase, requestId)
    }

    const totalPages = Math.ceil((count || 0) / queryParams.limit)

    return createSecureSuccessResponse({
      projects: enhancedProjects,
      total_count: count || 0,
      page: queryParams.page,
      limit: queryParams.limit,
      has_more: queryParams.page < totalPages
    }, requestId)

  } catch (error) {
    console.error(`❌ Secure projects API error [${requestId}]:`, error)
    return createSecureErrorResponse('Internal server error', 500, requestId)
  }
})

// ============================================================================
// POST /api/projects - Create new project with comprehensive security
// ============================================================================

export const POST = withSecureAuth(async (request: NextRequest, { user, profile, requestId }) => {
  try {
    // Permission check
    if (!hasPermission(profile.role, 'projects.create')) {
      return createSecureErrorResponse('Insufficient permissions to create projects', 403, requestId)
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = validateProjectFormData(body)
    
    if (!validationResult.success) {
      return createSecureErrorResponse(
        'Invalid project data', 
        400, 
        requestId, 
        { details: validationResult.error.errors }
      )
    }

    const projectData = validationResult.data
    const supabase = createServerClient()

    // Verify client exists and is actually a client
    if (projectData.client_id) {
      const { data: client, error: clientError } = await supabase
        .from('user_profiles')
        .select('id, role')
        .eq('id', projectData.client_id)
        .single()

      if (clientError || !client) {
        return createSecureErrorResponse('Client not found', 404, requestId)
      }

      if (client.role !== 'client') {
        return createSecureErrorResponse('Selected user is not a client', 400, requestId)
      }
    }

    // Verify project manager if provided
    if (projectData.project_manager_id) {
      const { data: manager, error: managerError } = await supabase
        .from('user_profiles')
        .select('id, role')
        .eq('id', projectData.project_manager_id)
        .single()

      if (managerError || !manager) {
        return createSecureErrorResponse('Project manager not found', 404, requestId)
      }

      const validManagerRoles = ['project_manager', 'management', 'management', 'technical_lead']
      if (!validManagerRoles.includes(manager.role)) {
        return createSecureErrorResponse('Selected user cannot be assigned as project manager', 400, requestId)
      }
    }

    // Prepare project data with secure defaults
    const insertData = {
      name: projectData.name,
      description: projectData.description || null,
      project_type: projectData.project_type || 'commercial',
      priority: projectData.priority || 1,
      location: projectData.location || null,
      client_id: projectData.client_id || null,
      project_manager_id: projectData.project_manager_id || null,
      start_date: projectData.start_date || null,
      end_date: projectData.end_date || null,
      budget: projectData.budget || null,
      status: 'planning',
      metadata: {
        ...projectData.metadata,
        approval_workflow_enabled: projectData.approval_workflow_enabled || false,
        client_portal_enabled: projectData.client_portal_enabled || false,
        mobile_reporting_enabled: projectData.mobile_reporting_enabled || false,
        created_by: user.id
      },
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Create project securely
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert(insertData)
      .select(`
        *,
        client:user_profiles!client_id(id, first_name, last_name, email, company),
        project_manager:user_profiles!project_manager_id(id, first_name, last_name, email, avatar_url)
      `)
      .single()

    if (projectError) {
      console.error(`❌ Project creation failed [${requestId}]:`, projectError)
      return createSecureErrorResponse('Failed to create project', 500, requestId)
    }

    // Handle team assignments if provided
    if (projectData.team_assignments && projectData.team_assignments.length > 0) {
      const validAssignments = []
      
      for (const assignment of projectData.team_assignments) {
        // Verify user exists
        const { data: assignedUser, error: userError } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', assignment.user_id)
          .single()

        if (userError || !assignedUser) {
          console.warn(`⚠️ Team assignment skipped - User not found [${requestId}]:`, assignment.user_id)
          continue
        }

        validAssignments.push({
          project_id: project.id,
          user_id: assignment.user_id,
          role: assignment.role,
          responsibilities: assignment.responsibilities || [],
          assigned_by: user.id,
          is_active: true,
          created_at: new Date().toISOString()
        })
      }

      if (validAssignments.length > 0) {
        const { error: assignmentError } = await supabase
          .from('project_assignments')
          .insert(validAssignments)

        if (assignmentError) {
          console.error(`❌ Project assignments error [${requestId}]:`, assignmentError)
          // Don't fail the whole operation, but log the error
        }
      }
    }

    // Initialize default scope items if template provided
    if (projectData.template_id) {
      await initializeProjectFromTemplate(supabase, project.id, projectData.template_id, requestId)
    } else {
      await createDefaultScopeItems(supabase, project.id, projectData.project_type || 'commercial', requestId)
    }

    console.log(`✅ Project created successfully [${requestId}]:`, {
      projectId: project.id,
      createdBy: user.id
    })

    return createSecureSuccessResponse({
      message: 'Project created successfully',
      project
    }, requestId)

  } catch (error) {
    console.error(`❌ Project creation error [${requestId}]:`, error)
    return createSecureErrorResponse('Internal server error', 500, requestId)
  }
})

// ============================================================================
// SECURE HELPER FUNCTIONS
// ============================================================================

async function getAccessibleProjectsSecurely(
  user: any, 
  profile: any, 
  supabase: any,
  requestId: string
): Promise<string[]> {
  try {
    if (['management', 'management', 'management', 'admin'].includes(profile.role)) {
      // These roles can access all projects
      const { data: projects } = await supabase.from('projects').select('id')
      return projects?.map((p: any) => p.id) || []
    }

    if (profile.role === 'client') {
      // Clients can only see their own projects
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('client_id', user.id)
      return projects?.map((p: any) => p.id) || []
    }

    // Other roles can see projects they're assigned to
    const { data: assignments } = await supabase
      .from('project_assignments')
      .select('project_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
    
    return assignments?.map((p: any) => p.project_id) || []
  } catch (error) {
    console.error(`❌ Error getting accessible projects [${requestId}]:`, error)
    return []
  }
}

async function getProjectsByAssignedUser(userId: string, supabase: any, requestId: string): Promise<string[]> {
  try {
    const { data: assignments } = await supabase
      .from('project_assignments')
      .select('project_id')
      .eq('user_id', userId)
      .eq('is_active', true)
    
    return assignments?.map((p: any) => p.project_id) || []
  } catch (error) {
    console.error(`❌ Error getting projects by assigned user [${requestId}]:`, error)
    return []
  }
}

async function enhanceProjectsWithDetails(projects: any[], supabase: any, requestId: string): Promise<any[]> {
  try {
    const projectIds = projects.map(p => p.id)
    
    // Get task counts
    const { data: tasks } = await supabase
      .from('tasks')
      .select('project_id, status')
      .in('project_id', projectIds)
    
    // Get team members
    const { data: teamMembers } = await supabase
      .from('project_assignments')
      .select(`
        project_id, 
        user_id, 
        role, 
        user:user_profiles!user_id(id, first_name, last_name, email, avatar_url)
      `)
      .in('project_id', projectIds)
      .eq('is_active', true)
    
    // Process task counts by project
    const taskCounts: Record<string, Record<string, number>> = {}
    tasks?.forEach((task: any) => {
      if (!taskCounts[task.project_id]) {
        taskCounts[task.project_id] = {
          total: 0,
          pending: 0,
          in_progress: 0,
          completed: 0
        }
      }
      
      taskCounts[task.project_id].total++
      
      if (task.status === 'pending') {
        taskCounts[task.project_id].pending++
      } else if (task.status === 'in_progress' || task.status === 'review') {
        taskCounts[task.project_id].in_progress++
      } else if (task.status === 'completed') {
        taskCounts[task.project_id].completed++
      }
    })
    
    // Process team members by project
    const teamMembersByProject: Record<string, any[]> = {}
    teamMembers?.forEach((assignment: any) => {
      if (!teamMembersByProject[assignment.project_id]) {
        teamMembersByProject[assignment.project_id] = []
      }
      
      teamMembersByProject[assignment.project_id].push({
        user_id: assignment.user_id,
        role: assignment.role,
        user: assignment.user
      })
    })
    
    // Enhance projects with additional data
    return projects.map(project => ({
      ...project,
      tasks: taskCounts[project.id] || { total: 0, pending: 0, in_progress: 0, completed: 0 },
      team: teamMembersByProject[project.id] || [],
      progress: calculateProjectProgress(taskCounts[project.id])
    }))
  } catch (error) {
    console.error(`❌ Error enhancing projects with details [${requestId}]:`, error)
    return projects
  }
}

function calculateProjectProgress(taskCounts?: Record<string, number>): number {
  if (!taskCounts || taskCounts.total === 0) {
    return 0
  }
  
  return Math.round((taskCounts.completed / taskCounts.total) * 100)
}

async function initializeProjectFromTemplate(supabase: any, projectId: string, templateId: string, requestId: string) {
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
    console.error(`❌ Template initialization error [${requestId}]:`, error)
  }
}

async function createDefaultScopeItems(supabase: any, projectId: string, projectType: string, requestId: string) {
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
    console.error(`❌ Default scope items creation error [${requestId}]:`, error)
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