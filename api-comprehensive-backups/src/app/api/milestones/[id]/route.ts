/**
 * Formula PM 2.0 Milestones API - Individual Milestone Route
 * V3 Phase 1 Implementation
 * 
 * Handles individual milestone operations: GET, PUT, DELETE
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'
import { 
  validateMilestoneUpdate,
  validateMilestoneStatusUpdate,
  validateMilestonePermissions,
  validateMilestoneAccess,
  calculateMilestoneStatus
} from '@/lib/validation/milestones'

// ============================================================================
// GET /api/milestones/[id] - Get individual milestone
// ============================================================================

export const GET = withAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }, { user, profile }) => {
  if (!user || !profile) {
    return createErrorResponse('Authentication required', 401)
  }

  // Permission check
  if (!hasPermission(profile.role, 'projects.read.all') && 
      !hasPermission(profile.role, 'projects.read.assigned') &&
      !hasPermission(profile.role, 'projects.read.own')) {
    return createErrorResponse('Insufficient permissions to view milestones' , 403)
  }

  try {
    const params = await context.params
    const milestoneId = params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(milestoneId)) {
      return createErrorResponse('Invalid milestone ID format' , 400)
    }

    const supabase = createServerClient()

    // Get milestone with related data
    const { data: milestone, error: fetchError } = await supabase
      .from('project_milestones')
      .select(`
        *,
        creator:user_profiles!created_by(id, first_name, last_name, email, avatar_url),
        project:projects!project_id(id, name, status, client_id)
      `)
      .eq('id', milestoneId)
      .single()

    if (fetchError || !milestone) {
      return createErrorResponse('Milestone not found' , 404)
    }

    // Check if user has access to this milestone's project
    const hasProjectAccess = await verifyProjectAccess(supabase, user, milestone.project_id)
    if (!hasProjectAccess) {
      return createErrorResponse('Access denied to this milestone' , 403)
    }

    // Calculate additional fields
    const currentStatus = calculateMilestoneStatus(milestone.target_date, milestone.actual_date)
    const daysUntilDue = calculateDaysUntilDue(milestone.target_date)

    const enhancedMilestone = {
      ...milestone,
      is_overdue: currentStatus === 'overdue',
      days_until_due: daysUntilDue,
      creator: milestone.creator,
      project: milestone.project
    }

    return NextResponse.json({
      success: true,
      data: {
        milestone: enhancedMilestone
      }
    })

  } catch (error) {
    console.error('Milestone detail API error:', error)
    return createErrorResponse('Internal server error' , 500)
  }
}

// ============================================================================
// PUT /api/milestones/[id] - Update milestone
// ============================================================================

export const PUT = withAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }, { user, profile }) => {
,
      { status: 401 }
    )
  }

  // Permission check
  if (!validateMilestonePermissions(profile.role, 'update')) {
    return createErrorResponse('Insufficient permissions to update milestones' , 403)
  }

  try {
    const params = await context.params
    const milestoneId = params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(milestoneId)) {
      return createErrorResponse('Invalid milestone ID format' , 400)
    }

    const supabase = createServerClient()

    // Check if milestone exists and user has access
    const { data: existingMilestone, error: fetchError } = await supabase
      .from('project_milestones')
      .select('id, project_id, status, target_date, actual_date')
      .eq('id', milestoneId)
      .single()

    if (fetchError || !existingMilestone) {
      return createErrorResponse('Milestone not found' , 404)
    }

    // Check if user has access to this milestone's project
    const hasProjectAccess = await verifyProjectAccess(supabase, user, existingMilestone.project_id)
    if (!hasProjectAccess) {
      return createErrorResponse('Access denied to this milestone' , 403)
    }

    const body = await request.json()
    
    // Check if this is a status update
    if (body.status && body.status !== existingMilestone.status) {
      // Validate status update
      const statusValidation = validateMilestoneStatusUpdate(body)
      if (!statusValidation.success) {
        return createErrorResponse('Invalid status update data',
            details: statusValidation.error.issues 
          , 400)
      }

      // Check permissions for status changes
      if (!validateMilestonePermissions(profile.role, 'change_status')) {
        return createErrorResponse('Insufficient permissions to change milestone status' , 403)
      }

      // Handle status-specific updates
      const statusData = statusValidation.data
      let updateData: any = {
        status: statusData.status
      }

      if (statusData.status === 'completed' || statusData.status === 'cancelled') {
        updateData.actual_date = statusData.actual_date
      } else {
        updateData.actual_date = null
      }

      // Update milestone
      const { data: updatedMilestone, error: updateError } = await supabase
        .from('project_milestones')
        .update(updateData)
        .eq('id', milestoneId)
        .select(`
          *,
          creator:user_profiles!created_by(id, first_name, last_name, email, avatar_url),
          project:projects!project_id(id, name, status)
        `)
        .single()

      if (updateError) {
        console.error('Milestone status update error:', updateError)
        return createErrorResponse('Failed to update milestone status' , 500)
      }

      // Calculate additional fields
      const currentStatus = calculateMilestoneStatus(updatedMilestone.target_date, updatedMilestone.actual_date)
      const daysUntilDue = calculateDaysUntilDue(updatedMilestone.target_date)

      const enhancedMilestone = {
        ...updatedMilestone,
        is_overdue: currentStatus === 'overdue',
        days_until_due: daysUntilDue
      }

      return NextResponse.json({
        success: true,
        message: 'Milestone status updated successfully',
        data: {
          milestone: enhancedMilestone
        }
      })
    } else {
      // Regular update validation
      const validationResult = validateMilestoneUpdate(body)
      if (!validationResult.success) {
        return createErrorResponse('Invalid update data',
            details: validationResult.error.issues 
          , 400)
      }

      const updateData = validationResult.data

      // Recalculate status if target date changed
      if (updateData.target_date && updateData.target_date !== existingMilestone.target_date) {
        const newStatus = calculateMilestoneStatus(updateData.target_date, existingMilestone.actual_date)
        if (newStatus !== existingMilestone.status && ['upcoming', 'in_progress', 'overdue'].includes(newStatus)) {
          updateData.status = newStatus
        }
      }

      // Update milestone
      const { data: updatedMilestone, error: updateError } = await supabase
        .from('project_milestones')
        .update(updateData)
        .eq('id', milestoneId)
        .select(`
          *,
          creator:user_profiles!created_by(id, first_name, last_name, email, avatar_url),
          project:projects!project_id(id, name, status)
        `)
        .single()

      if (updateError) {
        console.error('Milestone update error:', updateError)
        return createErrorResponse('Failed to update milestone' , 500)
      }

      // Calculate additional fields
      const currentStatus = calculateMilestoneStatus(updatedMilestone.target_date, updatedMilestone.actual_date)
      const daysUntilDue = calculateDaysUntilDue(updatedMilestone.target_date)

      const enhancedMilestone = {
        ...updatedMilestone,
        is_overdue: currentStatus === 'overdue',
        days_until_due: daysUntilDue
      }

      return NextResponse.json({
        success: true,
        message: 'Milestone updated successfully',
        data: {
          milestone: enhancedMilestone
        }
      })
    }

  } catch (error) {
    console.error('Milestone update API error:', error)
    return createErrorResponse('Internal server error' , 500)
  }
}

// ============================================================================
// DELETE /api/milestones/[id] - Delete milestone
// ============================================================================

export const DELETE = withAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }, { user, profile }) => {
,
      { status: 401 }
    )
  }

  // Permission check
  if (!validateMilestonePermissions(profile.role, 'delete')) {
    return createErrorResponse('Insufficient permissions to delete milestones' , 403)
  }

  try {
    const params = await context.params
    const milestoneId = params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(milestoneId)) {
      return createErrorResponse('Invalid milestone ID format' , 400)
    }

    const supabase = createServerClient()

    // Check if milestone exists and user has access
    const { data: milestone, error: fetchError } = await supabase
      .from('project_milestones')
      .select('id, project_id, name, status')
      .eq('id', milestoneId)
      .single()

    if (fetchError || !milestone) {
      return createErrorResponse('Milestone not found' , 404)
    }

    // Check if user has access to this milestone's project
    const hasProjectAccess = await verifyProjectAccess(supabase, user, milestone.project_id)
    if (!hasProjectAccess) {
      return createErrorResponse('Access denied to this milestone' , 403)
    }

    // Prevent deletion of completed milestones (business rule)
    if (milestone.status === 'completed') {
      return createErrorResponse('Cannot delete completed milestones. Consider cancelling instead.' 
        , 400)
    }

    // Delete milestone
    const { error: deleteError } = await supabase
      .from('project_milestones')
      .delete()
      .eq('id', milestoneId)

    if (deleteError) {
      console.error('Milestone deletion error:', deleteError)
      return createErrorResponse('Failed to delete milestone' , 500)
    }

    return createSuccessResponse({ message: 'Milestone deleted successfully'
     })

  } catch (error) {
    console.error('Milestone deletion API error:', error)
    return createErrorResponse('Internal server error' , 500)
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function verifyProjectAccess(supabase: any, user: any, projectId: string): Promise<boolean> {
  try {
    // Management roles can access all projects
    if (['management', 'management', 'management', 'technical_lead', 'admin'].includes(user.role)) {
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
    if (user.role === 'client') {
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

function calculateDaysUntilDue(targetDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const target = new Date(targetDate)
  target.setHours(0, 0, 0, 0)
  
  const diffTime = target.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}