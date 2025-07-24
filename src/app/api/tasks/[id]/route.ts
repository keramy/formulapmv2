import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-middleware';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for updating tasks
const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'review', 'completed', 'cancelled', 'blocked']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  scope_item_id: z.string().uuid().nullable().optional(),
  due_date: z.string().nullable().optional(),
  estimated_hours: z.number().nullable().optional(),
  actual_hours: z.number().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

// GET /api/tasks/[id] - Get single task
export const GET = withAuth(async (request: NextRequest, { user, profile }, { params }) => {
  try {
    const taskId = params.id;
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assigned_to_user:user_profiles!tasks_assigned_to_fkey(
          id, first_name, last_name, email
        ),
        assigned_by_user:user_profiles!tasks_assigned_by_fkey(
          id, first_name, last_name, email
        ),
        scope_item:scope_items(
          id, item_code, description
        ),
        project:projects(
          id, name, code
        )
      `)
      .eq('id', taskId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return createErrorResponse('Task not found', 404);
      }
      console.error('Error fetching task:', error);
      return createErrorResponse('Failed to fetch task', 500);
    }
    
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Error in GET /api/tasks/[id]:', error);
    return createErrorResponse('Internal server error', 500);
  }
}, { permission: 'tasks.create' });

// PUT /api/tasks/[id] - Update task
export const PUT = withAuth(async (request: NextRequest, { user, profile }, { params }) => {
  try {
    const taskId = params.id;
    const supabase = await createClient();
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateTaskSchema.safeParse(body);
    
    if (!validationResult.success) {
      return createErrorResponse('Invalid task data', 400, validationResult.error.errors);
    }
    
    // Check if task exists
    const { data: existingTask } = await supabase
      .from('tasks')
      .select('id, status')
      .eq('id', taskId)
      .single();
    
    if (!existingTask) {
      return createErrorResponse('Task not found', 404);
    }
    
    // Prepare update data
    const updateData = {
      ...validationResult.data,
      updated_at: new Date().toISOString(),
    };
    
    // If status is changing to completed, set completed_at
    if (validationResult.data.status === 'completed' && existingTask.status !== 'completed') {
      (updateData as any).completed_at = new Date().toISOString();
    }
    
    // Update the task
    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select(`
        *,
        assigned_to_user:user_profiles!tasks_assigned_to_fkey(
          id, first_name, last_name, email
        ),
        assigned_by_user:user_profiles!tasks_assigned_by_fkey(
          id, first_name, last_name, email
        ),
        scope_item:scope_items(
          id, item_code, description
        )
      `)
      .single();
    
    if (error) {
      console.error('Error updating task:', error);
      return createErrorResponse('Failed to update task', 500);
    }
    
    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: profile.id,
      action: 'task.updated',
      resource_type: 'task',
      resource_id: taskId,
      details: {
        changes: validationResult.data,
      },
    });
    
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Error in PUT /api/tasks/[id]:', error);
    return createErrorResponse('Internal server error', 500);
  }
}, { permission: 'tasks.create' });

// DELETE /api/tasks/[id] - Delete task
export const DELETE = withAuth(async (request: NextRequest, { user, profile }, { params }) => {
  try {
    const taskId = params.id;
    const supabase = await createClient();
    
    // Check if task exists
    const { data: existingTask } = await supabase
      .from('tasks')
      .select('id, title, project_id')
      .eq('id', taskId)
      .single();
    
    if (!existingTask) {
      return createErrorResponse('Task not found', 404);
    }
    
    // Delete the task
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);
    
    if (error) {
      console.error('Error deleting task:', error);
      return createErrorResponse('Failed to delete task', 500);
    }
    
    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: profile.id,
      action: 'task.deleted',
      resource_type: 'task',
      resource_id: taskId,
      details: {
        title: existingTask.title,
        project_id: existingTask.project_id,
      },
    });
    
    return createSuccessResponse({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/tasks/[id]:', error);
    return createErrorResponse('Internal server error', 500);
  }
}, { permission: 'tasks.create' });