/**
 * Formula PM 2.0 Tasks API - Individual Task Route
 * V3 Phase 1 Implementation
 * 
 * Handles individual task operations: GET, PUT, DELETE
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'
import { 
  validateTaskUpdate,
  validateTaskStatusUpdate,
  validateTaskPermissions,
  validateTaskAccess,
  calculateTaskStatus
} from '@/lib/validation/tasks'

// ============================================================================
// GET /api/tasks/[id] - Get individual task
// ============================================================================

export const GET = withAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }, { user, profile }) => {
,
      { status: 401 }
    )
  }

  // Permission check
  if (!hasPermission(profile.role, 'projects.read.all') && 
      !hasPermission(profile.role, 'projects.read.assigned') &&
      !hasPermission(profile.role, 'projects.read.own')) {
    return createErrorResponse('Insufficient permissions to view tasks' , 403)
  }

  try {
    const params = await context.params
    const taskId = params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(taskId)) {
      return createErrorResponse('Invalid task ID format' , 400)
    }

    const supabase = createServerClient()

    // Get task with related data
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:user_profiles!assigned_to(id, first_name, last_name, email, avatar_url),
        assigner:user_profiles!assigned_by(id, first_name, last_name, email, avatar_url),
        scope_item:scope_items!scope_item_id(id, item_no, title, description),
        project:projects!project_id(id, name, status, client_id)
      `)
      .eq('id', taskId)
      .single()

    if (fetchError || !task) {
      return createErrorResponse('Task not found' , 404)
    }

    // Check if user has access to this task's project
    const hasProjectAccess = await verifyProjectAccess(supabase, user, task.project_id)
    if (!hasProjectAccess) {
      return createErrorResponse('Access denied to this task' , 403)
    }

    // Calculate additional fields
    const currentStatus = calculateTaskStatus(task.status, task.due_date)
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !['completed', 'cancelled'].includes(task.status)
    const daysUntilDue = task.due_date ? calculateDaysUntilDue(task.due_date) : null

    const enhancedTask = {
      ...task,
      computed_status: currentStatus,
      is_overdue: isOverdue,
      days_until_due: daysUntilDue,
      assignee: task.assignee,
      assigner: task.assigner,
      scope_item: task.scope_item,
      project: task.project
    }

    return NextResponse.json({
      success: true,
      data: {
        task: enhancedTask
      }
    })

  } catch (error) {
    console.error('Task detail API error:', error)
    return createErrorResponse('Internal server error' , 500)
  }
}

// ============================================================================
// PUT /api/tasks/[id] - Update task
// ============================================================================

export const PUT = withAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }, { user, profile }) => {
,
      { status: 401 }
    )
  }

  // Permission check
  if (!validateTaskPermissions(profile.role, 'update')) {
    return createErrorResponse('Insufficient permissions to update tasks' , 403)
  }

  try {
    const params = await context.params
    const taskId = params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(taskId)) {
      return createErrorResponse('Invalid task ID format' , 400)
    }

    const supabase = createServerClient()

    // Check if task exists and user has access
    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select('id, project_id, status, due_date, assigned_to, assigned_by')
      .eq('id', taskId)
      .single()

    if (fetchError || !existingTask) {
      return createErrorResponse('Task not found' , 404)
    }

    // Check if user has access to this task's project
    const hasProjectAccess = await verifyProjectAccess(supabase, user, existingTask.project_id)
    if (!hasProjectAccess) {
      return createErrorResponse('Access denied to this task' , 403)
    }

    // Additional access check for non-management users
    if (!hasPermission(profile.role, 'projects.read.all')) {
      // Users can only update tasks they created or are assigned to
      if (existingTask.assigned_to !== user.id && existingTask.assigned_by !== user.id) {
        return createErrorResponse('Access denied to this task' , 403)
      }
    }

    const body = await request.json()
    
    // Check if this is a status update
    if (body.status && body.status !== existingTask.status) {
      // Validate status update
      const statusValidation = validateTaskStatusUpdate(body)
      if (!statusValidation.success) {
        return createErrorResponse('Invalid status update data',
            details: statusValidation.error.issues 
          , 400)
      }

      // Check permissions for status changes
      if (!validateTaskPermissions(profile.role, 'change_status')) {
        return createErrorResponse('Insufficient permissions to change task status' , 403)
      }

      // Handle status-specific updates
      const statusData = statusValidation.data
      let updateData: any = {
        status: statusData.status
      }

      if (statusData.status === 'completed') {
        updateData.completed_at = new Date().toISOString()
        updateData.actual_hours = statusData.actual_hours
      } else if (statusData.status === 'cancelled') {
        updateData.completed_at = new Date().toISOString()
        updateData.actual_hours = statusData.actual_hours || null
      } else {
        updateData.completed_at = null
        updateData.actual_hours = null
      }

      // Update task
      const { data: updatedTask, error: updateError } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .select(`
          *,
          assignee:user_profiles!assigned_to(id, first_name, last_name, email, avatar_url),
          assigner:user_profiles!assigned_by(id, first_name, last_name, email, avatar_url),
          scope_item:scope_items!scope_item_id(id, item_no, title, description),
          project:projects!project_id(id, name, status)
        `)
        .single()

      if (updateError) {
        console.error('Task status update error:', updateError)
        return createErrorResponse('Failed to update task status' , 500)
      }

      // Calculate additional fields
      const currentStatus = calculateTaskStatus(updatedTask.status, updatedTask.due_date)
      const isOverdue = updatedTask.due_date && new Date(updatedTask.due_date) < new Date() && !['completed', 'cancelled'].includes(updatedTask.status)
      const daysUntilDue = updatedTask.due_date ? calculateDaysUntilDue(updatedTask.due_date) : null

      const enhancedTask = {
        ...updatedTask,
        computed_status: currentStatus,
        is_overdue: isOverdue,
        days_until_due: daysUntilDue
      }

      return NextResponse.json({
        success: true,
        message: 'Task status updated successfully',
        data: {
          task: enhancedTask
        }
      })
    } else {
      // Regular update validation
      const validationResult = validateTaskUpdate(body)
      if (!validationResult.success) {
        return createErrorResponse('Invalid update data',
            details: validationResult.error.issues 
          , 400)
      }

      const updateData = validationResult.data

      // Verify assignee exists and has access to project if provided
      if (updateData.assigned_to) {
        const { data: assignee, error: assigneeError } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', updateData.assigned_to)
          .single()

        if (assigneeError || !assignee) {
          return createErrorResponse('Assignee not found' , 404)
        }

        // Check if assignee has access to the project
        const hasAssigneeAccess = await verifyProjectAccess(supabase, { id: updateData.assigned_to }, existingTask.project_id)
        if (!hasAssigneeAccess) {
          return createErrorResponse('Assignee does not have access to this project' , 400)
        }
      }

      // Verify scope item exists if provided
      if (updateData.scope_item_id) {
        const { data: scopeItem, error: scopeError } = await supabase
          .from('scope_items')
          .select('id')
          .eq('id', updateData.scope_item_id)
          .eq('project_id', existingTask.project_id)
          .single()

        if (scopeError || !scopeItem) {
          return createErrorResponse('Scope item not found in this project' , 404)
        }
      }

      // Recalculate status if due date changed
      if (updateData.due_date && updateData.due_date !== existingTask.due_date) {
        const newStatus = calculateTaskStatus(existingTask.status, updateData.due_date)
        if (newStatus !== existingTask.status && !['completed', 'cancelled'].includes(existingTask.status)) {
          updateData.status = newStatus
        }
      }

      // Update task
      const { data: updatedTask, error: updateError } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .select(`
          *,
          assignee:user_profiles!assigned_to(id, first_name, last_name, email, avatar_url),
          assigner:user_profiles!assigned_by(id, first_name, last_name, email, avatar_url),
          scope_item:scope_items!scope_item_id(id, item_no, title, description),
          project:projects!project_id(id, name, status)
        `)
        .single()

      if (updateError) {
        console.error('Task update error:', updateError)
        return createErrorResponse('Failed to update task' , 500)
      }

      // Calculate additional fields
      const currentStatus = calculateTaskStatus(updatedTask.status, updatedTask.due_date)
      const isOverdue = updatedTask.due_date && new Date(updatedTask.due_date) < new Date() && !['completed', 'cancelled'].includes(updatedTask.status)
      const daysUntilDue = updatedTask.due_date ? calculateDaysUntilDue(updatedTask.due_date) : null

      const enhancedTask = {
        ...updatedTask,
        computed_status: currentStatus,
        is_overdue: isOverdue,
        days_until_due: daysUntilDue
      }

      return NextResponse.json({
        success: true,
        message: 'Task updated successfully',
        data: {
          task: enhancedTask
        }
      })
    }

  } catch (error) {
    console.error('Task update API error:', error)
    return createErrorResponse('Internal server error' , 500)
  }
}

// ============================================================================
// DELETE /api/tasks/[id] - Delete task
// ============================================================================

export const DELETE = withAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }, { user, profile }) => {
,
      { status: 401 }
    )
  }

  // Permission check
  if (!validateTaskPermissions(profile.role, 'delete')) {
    return createErrorResponse('Insufficient permissions to delete tasks' , 403)
  }

  try {
    const params = await context.params
    const taskId = params.id

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(taskId)) {
      return createErrorResponse('Invalid task ID format' , 400)
    }

    const supabase = createServerClient()

    // Check if task exists and user has access
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('id, project_id, title, status, assigned_to, assigned_by')
      .eq('id', taskId)
      .single()

    if (fetchError || !task) {
      return createErrorResponse('Task not found' , 404)
    }

    // Check if user has access to this task's project
    const hasProjectAccess = await verifyProjectAccess(supabase, user, task.project_id)
    if (!hasProjectAccess) {
      return createErrorResponse('Access denied to this task' , 403)
    }

    // Additional access check for non-management users
    if (!hasPermission(profile.role, 'projects.read.all')) {
      // Users can only delete tasks they created
      if (task.assigned_by !== user.id) {
        return createErrorResponse('Access denied to this task' , 403)
      }
    }

    // Prevent deletion of completed tasks (business rule)
    if (task.status === 'completed') {
      return createErrorResponse('Cannot delete completed tasks. Consider cancelling instead.' 
        , 400)
    }

    // Delete task (this will also delete related comments due to CASCADE)
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (deleteError) {
      console.error('Task deletion error:', deleteError)
      return createErrorResponse('Failed to delete task' , 500)
    }

    return createSuccessResponse({ message: 'Task deleted successfully'
     })

  } catch (error) {
    console.error('Task deletion API error:', error)
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

function calculateDaysUntilDue(dueDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  
  const diffTime = due.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}