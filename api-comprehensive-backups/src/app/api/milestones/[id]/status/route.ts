/**
 * Formula PM 2.0 Milestone Status API Route
 * V3 Phase 1 Implementation
 * 
 * Handles milestone status updates with validation and business logic
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'
import { 
  validateMilestoneStatusUpdate,
  validateMilestonePermissions,
  calculateMilestoneStatus
} from '@/lib/validation/milestones'

// ============================================================================
// PUT /api/milestones/[id]/status - Update milestone status
// ============================================================================

export const PUT = withAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }, { user, profile }) => {
  if (!user || !profile) {
    return createErrorResponse('Authentication required', 401)
  }

  // Permission check
  if (!validateMilestonePermissions(profile.role, 'change_status')) {
    return createErrorResponse('Insufficient permissions to change milestone status' , 403)
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
      .select('id, project_id, status, target_date, actual_date, name')
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
    
    // Validate status update data
    const validationResult = validateMilestoneStatusUpdate(body)
    if (!validationResult.success) {
      return createErrorResponse('Invalid status update data',
          details: validationResult.error.issues 
        , 400)
    }

    const statusData = validationResult.data

    // Prepare update data
    let updateData: any = {
      status: statusData.status
    }

    // Set actual_date for completed/cancelled status
    if (statusData.status === 'completed' || statusData.status === 'cancelled') {
      updateData.actual_date = statusData.actual_date || new Date().toISOString().split('T')[0]
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
      message: `Milestone status updated to ${statusData.status}`,
      data: {
        milestone: enhancedMilestone
      }
    })

  } catch (error) {
    console.error('Milestone status update API error:', error)
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