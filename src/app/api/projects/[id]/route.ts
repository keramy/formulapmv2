/**
 * Formula PM 2.0 Projects API - Individual Project Route
 * Wave 2 Business Logic Implementation
 * 
 * Handles individual project operations: GET, PUT, DELETE
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'
import { 
  validateProjectUpdate,
  validateProjectAccess 
} from '@/lib/validation/projects'
import { ProjectWithDetails, ProjectDetailResponse } from '@/types/projects'

// ============================================================================
// GET /api/projects/[id] - Get individual project
// ============================================================================

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  // Authentication check
  const { user, profile, error } = await verifyAuth(request)
  
  if (error || !user || !profile) {
    return NextResponse.json(
      { success: false, error: error || 'Authentication required' },
      { status: 401 }
    )
  }

  // Permission check
  if (!hasPermission(profile.role, 'projects.read.all')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  try {
    const params = await context.params
    const projectId = params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(projectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID format' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Check if user has access to this project
    const hasAccess = await checkProjectAccess(supabase, user, projectId)
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    // Get project with all related data
    const { data: project, error } = await supabase
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
      .eq('id', projectId)
      .single()

    if (error || !project) {
      console.error('Project fetch error:', error)
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    // Get project statistics
    const [scopeStats, documentsCount, recentActivity] = await Promise.all([
      // Scope items statistics
      supabase
        .from('scope_items')
        .select('status, progress_percentage, total_price, actual_cost')
        .eq('project_id', projectId),
      
      // Documents count
      supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId),
      
      // Recent activity (if needed for dashboard)
      supabase
        .from('scope_items')
        .select(`
          id, description, status, updated_at,
          assigned_users:user_profiles(first_name, last_name)
        `)
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false })
        .limit(5)
    ])

    // Calculate enhanced project data
    const scopeItems = scopeStats.data || []
    const scopeItemsCount = scopeItems.length
    const scopeItemsCompleted = scopeItems.filter(item => item.status === 'completed').length
    const scopeItemsInProgress = scopeItems.filter(item => item.status === 'in_progress').length
    const scopeItemsBlocked = scopeItems.filter(item => item.status === 'blocked').length

    // Calculate overall progress
    const totalProgress = scopeItems.reduce((sum, item) => sum + (item.progress_percentage || 0), 0)
    const progressPercentage = scopeItemsCount > 0 ? Math.round(totalProgress / scopeItemsCount) : 0

    // Calculate budget utilization
    let budgetUsedPercentage = 0
    if (project.budget && project.actual_cost) {
      budgetUsedPercentage = Math.round((project.actual_cost / project.budget) * 100)
    }

    // Calculate days remaining
    let daysRemaining = 0
    if (project.end_date) {
      const endDate = new Date(project.end_date)
      const today = new Date()
      daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    }

    // Calculate total scope value
    const totalScopeValue = scopeItems.reduce((sum, item) => sum + (item.total_price || 0), 0)
    const actualScopeCost = scopeItems.reduce((sum, item) => sum + (item.actual_cost || 0), 0)

    const enhancedProject: ProjectWithDetails = {
      ...project,
      scope_items_count: scopeItemsCount,
      scope_items_completed: scopeItemsCompleted,
      documents_count: documentsCount.count || 0,
      team_size: project.assignments?.length || 0,
      progress_percentage: progressPercentage,
      days_remaining: daysRemaining,
      budget_used_percentage: budgetUsedPercentage,
      recent_scope_items: recentActivity.data || []
    }

    // Build dashboard data if needed
    const dashboardData = {
      project: enhancedProject,
      statistics: {
        project_id: projectId,
        total_scope_items: scopeItemsCount,
        completed_scope_items: scopeItemsCompleted,
        in_progress_scope_items: scopeItemsInProgress,
        blocked_scope_items: scopeItemsBlocked,
        total_documents: documentsCount.count || 0,
        pending_approvals: 0, // Would need approval system
        team_members: project.assignments?.length || 0,
        budget_utilization: budgetUsedPercentage,
        timeline_progress: progressPercentage,
        risk_factors: [] // Would need risk assessment
      },
      recent_activity: [],
      upcoming_milestones: [],
      team_workload: [],
      budget_breakdown: {
        total_budget: project.budget || 0,
        allocated_budget: project.budget || 0,
        spent_amount: project.actual_cost || 0,
        pending_amount: 0,
        remaining_budget: (project.budget || 0) - (project.actual_cost || 0),
        variance: (project.actual_cost || 0) - (project.budget || 0),
        categories: [],
        forecast: {
          projected_total_cost: project.actual_cost || 0,
          projected_completion_date: project.end_date || '',
          confidence_level: 'medium' as const,
          risk_factors: []
        }
      },
      timeline_status: {
        planned_start: project.start_date || '',
        actual_start: project.start_date,
        planned_end: project.end_date || '',
        projected_end: project.end_date || '',
        current_phase: project.status,
        completion_percentage: progressPercentage,
        days_ahead_behind: 0,
        critical_path_items: [],
        bottlenecks: []
      }
    }

    const response: ProjectDetailResponse = {
      success: true,
      data: {
        project: enhancedProject,
        dashboard_data: dashboardData
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Project detail API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT /api/projects/[id] - Update project
// ============================================================================

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  // Authentication check
  const { user, profile, error } = await verifyAuth(request)
  
  if (error || !user || !profile) {
    return NextResponse.json(
      { success: false, error: error || 'Authentication required' },
      { status: 401 }
    )
  }

  // Permission check
  if (!hasPermission(profile.role, 'projects.update')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  try {
    const params = await context.params
    const projectId = params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(projectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID format' },
        { status: 400 }
      )
    }

    // Check update permission
    if (!hasPermission(profile.role, 'projects.update')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to update projects' },
        { status: 403 }
      )
    }

    const supabase = createServerClient()

    // Check if user has access to this project
    const hasAccess = await checkProjectAccess(supabase, user, projectId)
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    const body = await request.json()
    
    // Validate update data
    const validationResult = validateProjectUpdate(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid update data',
          details: validationResult.error.issues 
        },
        { status: 400 }
      )
    }

    const updateData = validationResult.data

    // Check for sensitive updates that may require higher permissions
    const sensitiveFields = ['budget', 'status', 'client_id', 'project_manager_id']
    const hasSensitiveUpdates = Object.keys(updateData).some(key => sensitiveFields.includes(key))

    if (hasSensitiveUpdates) {
      // Require management permissions for sensitive updates
      const isManagement = ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin'].includes(profile.role)
      const isProjectManager = profile.role === 'project_manager'
      
      if (!isManagement && !isProjectManager) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions for this type of update' },
          { status: 403 }
        )
      }
    }

    // Perform the update
    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select(`
        *,
        client:clients(*),
        project_manager:user_profiles!project_manager_id(*),
        assignments:project_assignments(
          *,
          user:user_profiles(*)
        )
      `)
      .single()

    if (updateError) {
      console.error('Project update error:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update project' },
        { status: 500 }
      )
    }

    // Log the update for audit trail
    await logProjectActivity(supabase, projectId, 'project_updated', 'Project details updated', user.id, updateData)

    return NextResponse.json({
      success: true,
      message: 'Project updated successfully',
      data: {
        project: updatedProject
      }
    })

  } catch (error) {
    console.error('Project update API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE /api/projects/[id] - Delete project
// ============================================================================

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  // Authentication check
  const { user, profile, error } = await verifyAuth(request)
  
  if (error || !user || !profile) {
    return NextResponse.json(
      { success: false, error: error || 'Authentication required' },
      { status: 401 }
    )
  }

  // Permission check
  if (!hasPermission(profile.role, 'projects.delete')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  try {
    const params = await context.params
    const projectId = params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(projectId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID format' },
        { status: 400 }
      )
    }

    // Check delete permission - only high-level roles can delete
    if (!hasPermission(profile.role, 'projects.delete')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to delete projects' },
        { status: 403 }
      )
    }

    const supabase = createServerClient()

    // Check if project exists and user has access
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('id, name, status')
      .eq('id', projectId)
      .single()

    if (fetchError || !project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    // Prevent deletion of active projects
    if (project.status === 'active') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete active projects. Please change status to "cancelled" or "completed" first.' 
        },
        { status: 400 }
      )
    }

    // Check for dependencies (scope items, documents, etc.)
    const [scopeItemsCount, documentsCount] = await Promise.all([
      supabase
        .from('scope_items')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId),
      
      supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
    ])

    if ((scopeItemsCount.count || 0) > 0 || (documentsCount.count || 0) > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete project with existing scope items or documents. Please remove them first or archive the project instead.' 
        },
        { status: 400 }
      )
    }

    // Delete project (cascading deletes will handle assignments)
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (deleteError) {
      console.error('Project deletion error:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to delete project' },
        { status: 500 }
      )
    }

    // Clean up project storage
    try {
      await supabase.storage
        .from('project-documents')
        .remove([`${projectId}/`])
    } catch (storageError) {
      console.error('Project storage cleanup error:', storageError)
      // Don't fail the operation for storage cleanup issues
    }

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully'
    })

  } catch (error) {
    console.error('Project deletion API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function checkProjectAccess(supabase: any, user: any, projectId: string): Promise<boolean> {
  try {
    // Management roles can access all projects
    if (['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin'].includes(user.profile?.role || user.role)) {
      return true
    }

    // Check if user is assigned to this project
    const { data: assignment } = await supabase
      .from('project_assignments')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (assignment) {
      return true
    }

    // Check if user is the project manager
    const { data: project } = await supabase
      .from('projects')
      .select('project_manager_id')
      .eq('id', projectId)
      .single()

    if (project?.project_manager_id === user.id) {
      return true
    }

    // Check if user is a client assigned to this project
    if ((user.profile?.role || user.role) === 'client') {
      const { data: clientProject } = await supabase
        .from('projects')
        .select('client_id')
        .eq('id', projectId)
        .single()

      if (clientProject) {
        const { data: client } = await supabase
          .from('clients')
          .select('user_id')
          .eq('id', clientProject.client_id)
          .single()

        return client?.user_id === user.id
      }
    }

    return false
  } catch (error) {
    console.error('Access check error:', error)
    return false
  }
}

async function logProjectActivity(
  supabase: any, 
  projectId: string, 
  type: string, 
  description: string, 
  userId: string, 
  metadata?: any
) {
  try {
    await supabase
      .from('project_activities')
      .insert({
        project_id: projectId,
        type,
        description,
        performed_by: userId,
        metadata: metadata || {}
      })
  } catch (error) {
    console.error('Activity logging error:', error)
    // Don't fail the main operation for logging issues
  }
}