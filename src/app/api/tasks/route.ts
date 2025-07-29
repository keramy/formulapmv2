import { withAPI, getRequestData, createSuccessResponse, createErrorResponse } from '@/lib/enhanced-auth-middleware';
import { NextRequest } from 'next/server';

import { buildPaginatedQuery, parseQueryParams, getScopeItemsOptimized, getProjectsOptimized, getTasksOptimized, getDashboardStatsOptimized } from '@/lib/enhanced-query-builder';

import { performanceMonitor } from '@/lib/performance-monitor';

import { createClient } from '@supabase/supabase-js';


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function GETOriginal(req: NextRequest) {
  const { user, profile } = getRequestData(req);
  
  try {
    const params = parseQueryParams(req);
    
    // Build comprehensive tasks query with relations
    let query = supabase.from('tasks').select(`
      id,
      title,
      description,
      status,
      priority,
      due_date,
      estimated_hours,
      actual_hours,
      progress_percentage,
      tags,
      created_at,
      updated_at,
      assigned_to,
      created_by,
      project_id,
      scope_item_id,
      depends_on_task_id,
      project:projects(id, name, status, client_id),
      scope_item:scope_items(id, item_name, category),
      assignee:user_profiles!tasks_assigned_to_fkey(id, first_name, last_name, email, role),
      creator:user_profiles!tasks_created_by_fkey(id, first_name, last_name, email),
      dependent_task:tasks!tasks_depends_on_task_id_fkey(id, title, status),
      subtasks:tasks!tasks_depends_on_task_id_fkey(id, title, status, progress_percentage),
      comments:task_comments(id, comment, created_at, created_by, user:user_profiles(first_name, last_name))
    `);
    
    // Role-based filtering
    if (profile.role === 'client') {
      // Clients see tasks from their projects only
      const clientProjects = await supabase
        .from('projects')
        .select('id')
        .eq('client_id', profile.id);
      
      if (clientProjects.data) {
        const projectIds = clientProjects.data.map(p => p.id);
        query = query.in('project_id', projectIds);
      }
    } else if (profile.role === 'project_manager') {
      // Project managers see tasks from managed projects
      query = query.in('project_id',
        supabase.from('projects').select('id').eq('project_manager_id', user.id)
      );
    } else if (['technical_lead', 'purchase_manager'].includes(profile.role)) {
      // Technical leads and purchase managers see assigned tasks + project assignments
      query = query.or(`assigned_to.eq.${user.id},created_by.eq.${user.id},project_id.in.(${
        supabase.from('project_assignments')
          .select('project_id')
          .eq('user_id', user.id)
          .eq('is_active', true)
      })`);
    }
    // Admin and management see all tasks
    
    // Apply filters
    if (params.project_id) {
      query = query.eq('project_id', params.project_id);
    }
    
    if (params.assigned_to) {
      query = query.eq('assigned_to', params.assigned_to);
    }
    
    if (params.status) {
      query = query.eq('status', params.status);
    }
    
    if (params.priority) {
      query = query.eq('priority', params.priority);
    }
    
    if (params.overdue === 'true') {
      query = query.lt('due_date', new Date().toISOString());
    }
    
    if (params.search) {
      query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%,tags.ilike.%${params.search}%`);
    }
    
    // Apply sorting
    if (params.sort_field) {
      query = query.order(params.sort_field, { ascending: params.sort_direction === 'asc' });
    } else {
      query = query.order('priority', { ascending: false })
                   .order('due_date', { ascending: true })
                   .order('created_at', { ascending: false });
    }
    
    // Apply pagination
    if (params.limit) {
      const offset = (params.page - 1) * params.limit;
      query = query.range(offset, offset + params.limit - 1);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Transform and enrich data
    const transformedTasks = data?.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date,
      estimated_hours: task.estimated_hours,
      actual_hours: task.actual_hours,
      progress_percentage: task.progress_percentage || 0,
      tags: task.tags || [],
      project: task.project,
      scope_item: task.scope_item,
      assignee: task.assignee,
      creator: task.creator,
      dependent_task: task.dependent_task,
      subtasks_count: task.subtasks?.length || 0,
      comments_count: task.comments?.length || 0,
      is_overdue: task.due_date ? new Date(task.due_date) < new Date() : false,
      days_until_due: task.due_date ? Math.ceil((new Date(task.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null,
      completion_status: getTaskCompletionStatus(task),
      created_at: task.created_at,
      updated_at: task.updated_at
    })) || [];
    
    return createSuccessResponse(transformedTasks);
  } catch (error) {
    console.error('Tasks API fetch error:', error);
    throw error;
  }
}

async function POSTOriginal(req: NextRequest) {
  const { user, profile } = getRequestData(req);
  
  try {
    const body = await req.json();
    
    // Validation
    if (!body || Object.keys(body).length === 0) {
      return createErrorResponse('Request body is required', 400);
    }
    
    if (!body.title || !body.project_id) {
      return createErrorResponse('Title and project ID are required', 400);
    }
    
    // Verify project access
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', body.project_id)
      .single();
    
    if (projectError || !project) {
      return createErrorResponse('Project not found or access denied', 404);
    }
    
    // Prepare task data
    const taskData = {
      title: body.title,
      description: body.description || '',
      status: body.status || 'todo',
      priority: body.priority || 'medium',
      due_date: body.due_date || null,
      estimated_hours: body.estimated_hours || 0,
      actual_hours: 0,
      progress_percentage: body.progress_percentage || 0,
      tags: body.tags || [],
      project_id: body.project_id,
      scope_item_id: body.scope_item_id || null,
      assigned_to: body.assigned_to || null,
      depends_on_task_id: body.depends_on_task_id || null,
      created_by: user.id,
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('tasks')
      .insert(taskData)
      .select(`
        id,
        title,
        description,
        status,
        priority,
        due_date,
        estimated_hours,
        actual_hours,
        progress_percentage,
        tags,
        created_at,
        updated_at,
        assigned_to,
        project_id,
        scope_item_id,
        project:projects(id, name, status),
        assignee:user_profiles!tasks_assigned_to_fkey(id, first_name, last_name, email)
      `)
      .single();
    
    if (error) throw error;
    
    // Create activity log
    await createActivityLog('task', 'created', data.id, user.id, {
      task_title: data.title,
      project_name: data.project?.name
    });
    
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Task creation error:', error);
    throw error;
  }
}

// Helper function to determine task completion status
function getTaskCompletionStatus(task: any) {
  if (task.status === 'completed') return 'completed';
  if (task.status === 'cancelled') return 'cancelled';
  if (task.due_date && new Date(task.due_date) < new Date()) return 'overdue';
  if (task.status === 'in_progress') return 'in_progress';
  return 'pending';
}

// Helper function to create activity logs
async function createActivityLog(entityType: string, action: string, entityId: string, userId: string, details: any) {
  try {
    await supabase.from('activity_logs').insert({
      entity_type: entityType,
      action: action,
      entity_id: entityId,
      user_id: userId,
      details: details,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.warn('Failed to create activity log:', error);
  }
}

// Enhanced API exports with middleware
export const GET = withAPI(GETOriginal);
export const POST = withAPI(POSTOriginal);
