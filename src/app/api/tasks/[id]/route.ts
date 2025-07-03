/**
 * Formula PM 2.0 Task Management API Routes
 * Individual task operations (GET, PUT, DELETE)
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAuth } from '@/lib/middleware'
import { hasPermission } from '@/lib/permissions'
import { TaskUpdateData } from '@/types/tasks'
import { MentionParser } from '@/lib/mentions'

// ============================================================================
// GET /api/tasks/[id] - Get individual task with details
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth(request)
    if (auth.error || !auth.user || !auth.profile) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const taskId = params.id

    // Check permissions
    if (!hasPermission(auth.profile.role, 'tasks.view')) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 })
    }

    // Fetch task with full details
    const { data: task, error } = await supabase
      .from('tasks')
      .select(`
        *,
        creator:user_profiles!created_by(id, first_name, last_name, role, email),
        assignees:user_profiles!inner(id, first_name, last_name, role),
        parent_task:tasks!parent_task_id(id, title, status),
        subtasks:tasks!parent_task_id(id, title, status, priority, assigned_to),
        project:projects!project_id(id, name, status),
        comments:task_comments(
          *,
          user_profiles!user_id(id, first_name, last_name, role),
          replies:task_comments!parent_comment_id(
            *,
            user_profiles!user_id(id, first_name, last_name, role)
          ),
          reactions:comment_reactions(*, user_profiles!user_id(first_name, last_name))
        ),
        attachments:task_attachments(*, user_profiles!uploaded_by(first_name, last_name)),
        activities:task_activities(
          *,
          user_profiles!user_id(first_name, last_name),
          mentioned_user:user_profiles!mentioned_user_id(first_name, last_name)
        )
      `)
      .eq('id', taskId)
      .single()

    if (error || !task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 })
    }

    // Check user access to this specific task
    if (!hasPermission(auth.profile.role, 'tasks.manage_all')) {
      const hasAccess = 
        task.created_by === auth.profile.id ||
        task.assigned_to.includes(auth.profile.id) ||
        (hasPermission(auth.user.role, 'tasks.view.project') && 
         await checkProjectAccess(auth.profile.id, task.project_id))

      if (!hasAccess) {
        return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
      }
    }

    return NextResponse.json({
      success: true,
      data: { task }
    })

  } catch (error) {
    console.error('Task fetch error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// PUT /api/tasks/[id] - Update task
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth(request)
    if (auth.error || !auth.user || !auth.profile) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const taskId = params.id
    const updates: TaskUpdateData = await request.json()

    // Get existing task for permission checks
    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (fetchError || !existingTask) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 })
    }

    // Check permissions for updating
    const canUpdate = hasPermission(auth.profile.role, 'tasks.update') &&
      (hasPermission(auth.profile.role, 'tasks.manage_all') ||
       existingTask.created_by === auth.profile.id ||
       existingTask.assigned_to.includes(auth.profile.id))

    if (!canUpdate) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions to update task' }, { status: 403 })
    }

    // Handle @mention parsing if description is being updated
    let mentionUpdates = {}
    if (updates.description !== undefined) {
      const parseResult = await MentionParser.parseMentions(updates.description || '', existingTask.project_id)
      mentionUpdates = {
        mentioned_projects: parseResult.extractedReferences.projects,
        mentioned_scope_items: parseResult.extractedReferences.scope_items,
        mentioned_documents: parseResult.extractedReferences.documents,
        mentioned_users: parseResult.extractedReferences.users,
        mentioned_tasks: parseResult.extractedReferences.tasks
      }
    }

    // Validate dependency updates to prevent circular references
    if (updates.depends_on) {
      // Check for circular dependencies using database function
      const { data: hasCircular } = await supabase
        .rpc('check_task_circular_dependency', {
          task_uuid: taskId,
          new_depends_on: updates.depends_on
        })

      if (hasCircular) {
        return NextResponse.json({ 
          success: false, 
          error: 'Dependency update would create circular reference' 
        }, { status: 400 })
      }
    }

    // Prepare update data
    const updateData = {
      ...updates,
      ...mentionUpdates,
      updated_at: new Date().toISOString()
    }

    // Update task
    const { data: updatedTask, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select(`
        *,
        creator:user_profiles!created_by(id, first_name, last_name, role),
        assignees:user_profiles!inner(id, first_name, last_name, role)
      `)
      .single()

    if (error) {
      console.error('Error updating task:', error)
      return NextResponse.json({ success: false, error: 'Failed to update task' }, { status: 500 })
    }

    // Log specific updates in activity
    const activityDetails: any = {}
    
    if (updates.status && updates.status !== existingTask.status) {
      activityDetails.status_change = { from: existingTask.status, to: updates.status }
    }
    
    if (updates.assigned_to && JSON.stringify(updates.assigned_to) !== JSON.stringify(existingTask.assigned_to)) {
      activityDetails.assignment_change = { from: existingTask.assigned_to, to: updates.assigned_to }
    }

    if (Object.keys(activityDetails).length > 0) {
      await supabase
        .from('task_activities')
        .insert({
          task_id: taskId,
          user_id: auth.profile.id,
          activity_type: 'updated',
          details: activityDetails
        })
    }

    // Send notifications for new mentions
    if (mentionUpdates && 'mentioned_users' in mentionUpdates) {
      const newMentions = (mentionUpdates as any).mentioned_users.filter(
        (userId: string) => !existingTask.mentioned_users.includes(userId)
      )
      
      for (const userId of newMentions) {
        await supabase
          .from('task_activities')
          .insert({
            task_id: taskId,
            user_id: auth.profile.id,
            activity_type: 'mentioned',
            mentioned_user_id: userId,
            details: { context: 'task_update' }
          })
      }
    }

    return NextResponse.json({
      success: true,
      data: { task: updatedTask }
    })

  } catch (error) {
    console.error('Task update error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// DELETE /api/tasks/[id] - Delete task
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth(request)
    if (auth.error || !auth.user || !auth.profile) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const taskId = params.id

    // Get existing task for permission checks
    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (fetchError || !existingTask) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 })
    }

    // Check permissions for deletion
    const canDelete = hasPermission(auth.profile.role, 'tasks.delete') &&
      (hasPermission(auth.profile.role, 'tasks.manage_all') ||
       existingTask.created_by === auth.profile.id)

    if (!canDelete) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions to delete task' }, { status: 403 })
    }

    // Check if task has subtasks (prevent deletion if it does)
    const { count: subtaskCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('parent_task_id', taskId)

    if (subtaskCount && subtaskCount > 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot delete task with subtasks. Delete or reassign subtasks first.' 
      }, { status: 400 })
    }

    // Check if other tasks depend on this one
    const { count: dependentCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .contains('depends_on', [taskId])

    if (dependentCount && dependentCount > 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot delete task that other tasks depend on. Remove dependencies first.' 
      }, { status: 400 })
    }

    // Delete task (cascade will handle comments, attachments, activities)
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (deleteError) {
      console.error('Error deleting task:', deleteError)
      return NextResponse.json({ success: false, error: 'Failed to delete task' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Task deleted successfully' }
    })

  } catch (error) {
    console.error('Task deletion error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function checkProjectAccess(userId: string, projectId: string): Promise<boolean> {
  const { data: assignment } = await supabase
    .from('project_assignments')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()

  return !!assignment
}