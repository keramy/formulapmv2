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
    
    // Get dashboard tasks for the user based on their role
    let query = supabase.from('tasks').select(`
      id,
      title,
      description,
      status,
      priority,
      due_date,
      created_at,
      updated_at,
      assigned_to,
      project_id,
      project:projects(id, name, status),
      assignee:user_profiles!tasks_assigned_to_fkey(id, first_name, last_name, email)
    `);
    
    // Role-based filtering
    if (profile.role === 'client') {
      // Clients can only see tasks from their projects
      query = query.in('project_id', 
        supabase.from('projects').select('id').eq('client_id', profile.id)
      );
    } else if (profile.role === 'project_manager') {
      // Project managers see tasks from their managed projects
      query = query.in('project_id',
        supabase.from('projects').select('id').eq('project_manager_id', user.id)
      );
    } else if (['technical_lead', 'purchase_manager'].includes(profile.role)) {
      // Technical leads and purchase managers see assigned tasks
      query = query.or(`assigned_to.eq.${user.id},project_id.in.(${
        supabase.from('project_assignments')
          .select('project_id')
          .eq('user_id', user.id)
          .eq('is_active', true)
      })`);
    }
    // Admin and management see all tasks
    
    // Apply status filter if provided
    if (params.status) {
      query = query.eq('status', params.status);
    }
    
    // Apply priority filter if provided  
    if (params.priority) {
      query = query.eq('priority', params.priority);
    }
    
    // Apply search filter if provided
    if (params.search) {
      query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`);
    }
    
    // Apply sorting
    if (params.sort_field) {
      query = query.order(params.sort_field, { ascending: params.sort_direction === 'asc' });
    } else {
      // Default: urgent tasks first, then by due date
      query = query.order('priority', { ascending: false })
                   .order('due_date', { ascending: true })
                   .order('created_at', { ascending: false });
    }
    
    // Apply pagination - limit to recent tasks for dashboard
    const limit = params.limit || 10; // Dashboard shows max 10 tasks
    if (limit) {
      const offset = (params.page - 1) * limit;
      query = query.range(offset, offset + limit - 1);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Transform data for dashboard display
    const transformedTasks = data?.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date,
      project_name: task.project?.name || 'Unknown Project',
      project_id: task.project_id,
      assignee_name: task.assignee ? `${task.assignee.first_name} ${task.assignee.last_name}` : 'Unassigned',
      is_overdue: task.due_date ? new Date(task.due_date) < new Date() : false,
      days_until_due: task.due_date ? Math.ceil((new Date(task.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null,
      created_at: task.created_at,
      updated_at: task.updated_at
    })) || [];
    
    return createSuccessResponse(transformedTasks);
  } catch (error) {
    console.error('Dashboard tasks API fetch error:', error);
    throw error;
  }
}

// Enhanced API exports with middleware
export const GET = withAPI(GETOriginal);
