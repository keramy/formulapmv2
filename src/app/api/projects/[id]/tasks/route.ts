import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';
import { parseQueryParams } from '@/lib/api-utils';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for creating tasks
const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'review', 'completed', 'cancelled', 'blocked']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assigned_to: z.string().uuid().optional(),
  scope_item_id: z.string().uuid().optional(),
  due_date: z.string().optional(),
  estimated_hours: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

// GET /api/projects/[id]/tasks - List project tasks
export const GET = withAuth(async (request: NextRequest, { user, profile }, { params }) => {
  try {
    const projectId = params.id;
    const supabase = createClient();
    
    // Parse query parameters for filtering and pagination
    const { page, limit, search, sort_field = 'created_at', sort_direction = 'desc', filters } = parseQueryParams(request);
    
    // Build query
    let query = supabase
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
        )
      `, { count: 'exact' })
      .eq('project_id', projectId);
    
    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    // Apply status filter
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    // Apply priority filter
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    
    // Apply assignee filter
    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }
    
    // Apply date range filters
    if (filters?.due_date_from) {
      query = query.gte('due_date', filters.due_date_from);
    }
    if (filters?.due_date_to) {
      query = query.lte('due_date', filters.due_date_to);
    }
    
    // Apply sorting
    query = query.order(sort_field, { ascending: sort_direction === 'asc' });
    
    // Apply pagination
    if (limit) {
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching tasks:', error);
      return createErrorResponse('Failed to fetch tasks', 500);
    }
    
    // Calculate statistics
    const statsQuery = await supabase
      .from('tasks')
      .select('status, priority')
      .eq('project_id', projectId);
    
    const statistics = {
      total: count || 0,
      by_status: {},
      by_priority: {},
    };
    
    if (statsQuery.data) {
      statsQuery.data.forEach(task => {
        statistics.by_status[task.status] = (statistics.by_status[task.status] || 0) + 1;
        statistics.by_priority[task.priority] = (statistics.by_priority[task.priority] || 0) + 1;
      });
    }
    
    return createSuccessResponse(data, {
      page,
      limit,
      total: count || 0,
      statistics,
    });
  } catch (error) {
    console.error('Error in GET /api/projects/[id]/tasks:', error);
    return createErrorResponse('Internal server error', 500);
  }
}, { permission: 'tasks.read' });

// POST /api/projects/[id]/tasks - Create new task
export const POST = withAuth(async (request: NextRequest, { user, profile }, { params }) => {
  try {
    const projectId = params.id;
    const supabase = createClient();
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = createTaskSchema.safeParse(body);
    
    if (!validationResult.success) {
      return createErrorResponse('Invalid task data', 400, validationResult.error.errors);
    }
    
    const taskData = {
      ...validationResult.data,
      project_id: projectId,
      assigned_by: profile.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // Create the task
    const { data, error } = await supabase
      .from('tasks')
      .insert(taskData)
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
      console.error('Error creating task:', error);
      return createErrorResponse('Failed to create task', 500);
    }
    
    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: profile.id,
      action: 'task.created',
      resource_type: 'task',
      resource_id: data.id,
      details: {
        project_id: projectId,
        title: data.title,
      },
    });
    
    return createSuccessResponse(data, null, 201);
  } catch (error) {
    console.error('Error in POST /api/projects/[id]/tasks:', error);
    return createErrorResponse('Internal server error', 500);
  }
}, { permission: 'tasks.create' });