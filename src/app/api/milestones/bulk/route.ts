/**
 * Formula PM 2.0 Milestone Bulk Operations API
 * V3 Phase 1 Implementation
 * 
 * Handles bulk operations for milestones: bulk update, bulk delete, bulk status change
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'
import { 
  validateMilestoneBulkUpdate,
  validateMilestonePermissions,
  calculateMilestoneStatus
} from '@/lib/validation/milestones'

// ============================================================================
// POST /api/milestones/bulk - Bulk update milestones
// ============================================================================

export const POST = withAuth(async (request: NextRequest, { user, profile }) => {
,
      { status: 401 }
    )
  }

  // Permission check
  if (!validateMilestonePermissions(profile.role, 'update')) {
    return createErrorResponse('Insufficient permissions to update milestones' , 403)
  }

  try {
    const body = await request.json()
    
    // Validate bulk update data
    const validationResult = validateMilestoneBulkUpdate(body)
    if (!validationResult.success) {
      return createErrorResponse('Invalid bulk update data',
          details: validationResult.error.issues 
        , 400)
    }

    const { milestone_ids, updates, notify_team } = validationResult.data
    const supabase = createServerClient()

    // Verify all milestones exist and user has access
    const { data: milestones, error: fetchError } = await supabase
      .from('project_milestones')
      .select('id, project_id, name, status, target_date, actual_date')
      .in('id', milestone_ids)

    if (fetchError) {
      console.error('Milestone bulk fetch error:', fetchError)
      return createErrorResponse('Failed to fetch milestones' , 500)
    }

    if (!milestones || milestones.length !== milestone_ids.length) {
      return createErrorResponse('One or more milestones not found' , 404)
    }

    // Check access to all projects
    const accessibleProjects = await getAccessibleProjects(supabase, user, profile.role as any)
    const unauthorizedMilestones = milestones.filter(m => 
      !accessibleProjects.includes(m.project_id)
    )

    if (unauthorizedMilestones.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Access denied to one or more milestones',
          details: unauthorizedMilestones.map(m => ({ id: m.id, name: m.name }))
        },
        { status: 403 }
      )
    }

    // Check for status change permissions
    if (updates.status && !validateMilestonePermissions(profile.role, 'change_status')) {
      return createErrorResponse('Insufficient permissions to change milestone status' , 403)
    }

    // Prepare update data
    const updateData: any = {}
    
    if (updates.status) {
      updateData.status = updates.status
    }
    
    if (updates.target_date) {
      updateData.target_date = updates.target_date
    }
    
    if (updates.actual_date) {
      updateData.actual_date = updates.actual_date
    }

    // Handle status-specific logic
    if (updates.status === 'completed' || updates.status === 'cancelled') {
      if (!updates.actual_date) {
        updateData.actual_date = new Date().toISOString().split('T')[0]
      }
    } else if (updates.status === 'upcoming' || updates.status === 'in_progress') {
      updateData.actual_date = null
    }

    // Perform bulk update
    const { data: updatedMilestones, error: updateError } = await supabase
      .from('project_milestones')
      .update(updateData)
      .in('id', milestone_ids)
      .select(`
        *,
        creator:user_profiles!created_by(id, first_name, last_name, email, avatar_url),
        project:projects!project_id(id, name, status)
      `)

    if (updateError) {
      console.error('Milestone bulk update error:', updateError)
      return createErrorResponse('Failed to update milestones' , 500)
    }

    // Enhance milestones with computed fields
    const enhancedMilestones = updatedMilestones?.map(milestone => {
      const currentStatus = calculateMilestoneStatus(milestone.target_date, milestone.actual_date)
      return {
        ...milestone,
        is_overdue: currentStatus === 'overdue',
        days_until_due: calculateDaysUntilDue(milestone.target_date)
      }
    }) || []

    // Log bulk operation for audit trail
    await logBulkOperation(
      supabase,
      user.id,
      'milestone_bulk_update',
      milestone_ids,
      updateData
    )

    // Send notifications if requested
    if (notify_team) {
      await sendBulkUpdateNotifications(
        supabase,
        enhancedMilestones,
        updates,
        user.id
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${enhancedMilestones.length} milestones`,
      data: {
        updated_milestones: enhancedMilestones,
        updated_count: enhancedMilestones.length
      }
    })

  } catch (error) {
    console.error('Milestone bulk update API error:', error)
    return createErrorResponse('Internal server error' , 500)
  }
}

// ============================================================================
// DELETE /api/milestones/bulk - Bulk delete milestones
// ============================================================================

export const DELETE = withAuth(async (request: NextRequest, { user, profile }) => {
,
      { status: 401 }
    )
  }

  // Permission check
  if (!validateMilestonePermissions(profile.role, 'delete')) {
    return createErrorResponse('Insufficient permissions to delete milestones' , 403)
  }

  try {
    const body = await request.json()
    
    if (!body.milestone_ids || !Array.isArray(body.milestone_ids) || body.milestone_ids.length === 0) {
      return createErrorResponse('milestone_ids array is required' , 400)
    }

    const milestone_ids = body.milestone_ids
    const supabase = createServerClient()

    // Verify all milestones exist and user has access
    const { data: milestones, error: fetchError } = await supabase
      .from('project_milestones')
      .select('id, project_id, name, status')
      .in('id', milestone_ids)

    if (fetchError) {
      console.error('Milestone bulk fetch error:', fetchError)
      return createErrorResponse('Failed to fetch milestones' , 500)
    }

    if (!milestones || milestones.length !== milestone_ids.length) {
      return createErrorResponse('One or more milestones not found' , 404)
    }

    // Check access to all projects
    const accessibleProjects = await getAccessibleProjects(supabase, user, profile.role as any)
    const unauthorizedMilestones = milestones.filter(m => 
      !accessibleProjects.includes(m.project_id)
    )

    if (unauthorizedMilestones.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Access denied to one or more milestones',
          details: unauthorizedMilestones.map(m => ({ id: m.id, name: m.name }))
        },
        { status: 403 }
      )
    }

    // Check for completed milestones (business rule)
    const completedMilestones = milestones.filter(m => m.status === 'completed')
    if (completedMilestones.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete completed milestones',
          details: completedMilestones.map(m => ({ id: m.id, name: m.name }))
        },
        { status: 400 }
      )
    }

    // Perform bulk delete
    const { error: deleteError } = await supabase
      .from('project_milestones')
      .delete()
      .in('id', milestone_ids)

    if (deleteError) {
      console.error('Milestone bulk delete error:', deleteError)
      return createErrorResponse('Failed to delete milestones' , 500)
    }

    // Log bulk operation for audit trail
    await logBulkOperation(
      supabase,
      user.id,
      'milestone_bulk_delete',
      milestone_ids,
      { deleted_milestones: milestones.map(m => ({ id: m.id, name: m.name })) }
    )

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${milestones.length} milestones`,
      data: {
        deleted_count: milestones.length
      }
    })

  } catch (error) {
    console.error('Milestone bulk delete API error:', error)
    return createErrorResponse('Internal server error' , 500)
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getAccessibleProjects(supabase: any, user: any, userRole: string): Promise<string[]> {
  if (hasPermission(userRole as any, 'projects.read.all')) {
    const { data: allProjects } = await supabase
      .from('projects')
      .select('id')
    return allProjects?.map((p: any) => p.id) || []
  }

  if (hasPermission(userRole as any, 'projects.read.assigned')) {
    const { data: assignedProjects } = await supabase
      .from('project_assignments')
      .select('project_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
    return assignedProjects?.map((p: any) => p.project_id) || []
  }

  if (hasPermission(userRole as any, 'projects.read.own') && user.role === 'client') {
    const { data: clientProjects } = await supabase
      .from('projects')
      .select('id')
      .eq('client_id', user.profile?.id)
    return clientProjects?.map((p: any) => p.id) || []
  }

  return []
}

function calculateDaysUntilDue(targetDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const target = new Date(targetDate)
  target.setHours(0, 0, 0, 0)
  
  const diffTime = target.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

async function logBulkOperation(
  supabase: any,
  userId: string,
  operation: string,
  milestoneIds: string[],
  data: any
) {
  try {
    await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action: operation,
        resource_type: 'milestone',
        resource_ids: milestoneIds,
        details: {
          operation,
          affected_count: milestoneIds.length,
          data
        }
      })
  } catch (error) {
    console.error('Audit logging error:', error)
    // Don't fail the main operation for logging issues
  }
}

async function sendBulkUpdateNotifications(
  supabase: any,
  milestones: any[],
  updates: any,
  userId: string
) {
  try {
    // Get unique project IDs
    const projectIds = Array.from(new Set(milestones.map(m => m.project_id)))
    
    // Get team members for each project
    const { data: teamMembers } = await supabase
      .from('project_assignments')
      .select('user_id, project_id')
      .in('project_id', projectIds)
      .eq('is_active', true)

    if (teamMembers) {
      const notifications = teamMembers
        .filter((member: any) => member.user_id !== userId) // Don't notify the person who made the change
        .map((member: any) => ({
          user_id: member.user_id,
          type: 'milestone_bulk_update',
          title: 'Milestones Updated',
          message: `${milestones.length} milestones were updated in your project`,
          data: {
            milestone_count: milestones.length,
            project_id: member.project_id,
            updates
          }
        }))

      if (notifications.length > 0) {
        await supabase
          .from('notifications')
          .insert(notifications)
      }
    }
  } catch (error) {
    console.error('Notification sending error:', error)
    // Don't fail the main operation for notification issues
  }
}