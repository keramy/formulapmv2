import { withAPI, getRequestData, createSuccessResponse, createErrorResponse } from '@/lib/enhanced-auth-middleware';
import { NextRequest } from 'next/server';
import { parseQueryParams } from '@/lib/enhanced-query-builder';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function GETOriginal(req: NextRequest) {
  const { user, profile } = getRequestData(req);
  
  try {
    const params = parseQueryParams(req);
    
    // Build comprehensive activity logs query
    let query = supabase.from('activity_logs').select(`
      id,
      entity_type,
      action,
      entity_id,
      user_id,
      details,
      created_at,
      user:user_profiles(id, first_name, last_name, email, role),
      project:projects(id, name, status),
      client:clients(id, company_name)
    `);
    
    // Role-based filtering for activity logs
    if (profile.role === 'client') {
      // Clients see only activities from their projects
      const clientProjects = await supabase
        .from('projects')
        .select('id')
        .eq('client_id', profile.id);
      
      if (clientProjects.data) {
        const projectIds = clientProjects.data.map(p => p.id);
        // Filter activities related to client's projects
        query = query.or(`entity_type.eq.project.and.entity_id.in.(${projectIds.join(',')}),entity_type.eq.task.and.details->>project_id.in.(${projectIds.join(',')}),entity_type.eq.scope.and.details->>project_id.in.(${projectIds.join(',')}))`);
      }
    } else if (profile.role === 'project_manager') {
      // Project managers see activities from managed projects
      const managedProjects = await supabase
        .from('projects')
        .select('id')
        .eq('project_manager_id', user.id);
      
      if (managedProjects.data) {
        const projectIds = managedProjects.data.map(p => p.id);
        query = query.or(`entity_type.eq.project.and.entity_id.in.(${projectIds.join(',')}),details->>project_id.in.(${projectIds.join(',')})`);
      }
    } else if (['technical_lead', 'purchase_manager'].includes(profile.role)) {
      // Technical leads and purchase managers see activities from assigned projects
      const assignedProjects = await supabase
        .from('project_assignments')
        .select('project_id')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      if (assignedProjects.data) {
        const projectIds = assignedProjects.data.map(p => p.project_id);
        query = query.or(`user_id.eq.${user.id},entity_type.eq.project.and.entity_id.in.(${projectIds.join(',')}),details->>project_id.in.(${projectIds.join(',')}))`);
      } else {
        query = query.eq('user_id', user.id);
      }
    }
    // Admin and management see all activities
    
    // Apply filters
    if ((params as any).entity_type) {
      query = query.eq('entity_type', (params as any).entity_type);
    }
    
    if ((params as any).entity_id) {
      query = query.eq('entity_id', (params as any).entity_id);
    }
    
    if (params.user_id) {
      query = query.eq('user_id', params.user_id);
    }
    
    if (params.action) {
      query = query.eq('action', params.action);
    }
    
    if (params.project_id) {
      query = query.or(`entity_type.eq.project.and.entity_id.eq.${params.project_id},details->>project_id.eq.${params.project_id}`);
    }
    
    if (params.date_from) {
      query = query.gte('created_at', params.date_from);
    }
    
    if (params.date_to) {
      query = query.lte('created_at', params.date_to);
    }
    
    if (params.search) {
      query = query.or(`action.ilike.%${params.search}%,entity_type.ilike.%${params.search}%,details->>title.ilike.%${params.search}%`);
    }
    
    // Apply sorting - most recent first by default
    if (params.sort_field) {
      query = query.order(params.sort_field, { ascending: params.sort_direction === 'asc' });
    } else {
      query = query.order('created_at', { ascending: false });
    }
    
    // Apply pagination
    const limit = params.limit || 50; // Default to 50 activity logs
    if (limit) {
      const offset = (params.page - 1) * limit;
      query = query.range(offset, offset + limit - 1);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Transform and enrich activity logs
    const transformedLogs = data?.map(log => ({
      id: log.id,
      entity_type: log.entity_type,
      action: log.action,
      entity_id: log.entity_id,
      user: log.user,
      details: log.details,
      formatted_message: formatActivityMessage(log),
      created_at: log.created_at,
      time_ago: getTimeAgo(log.created_at),
      icon: getActivityIcon(log.entity_type, log.action),
      color: getActivityColor(log.action)
    })) || [];
    
    return createSuccessResponse(transformedLogs);
  } catch (error) {
    console.error('Activity logs API fetch error:', error);
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
    
    if (!body.entity_type || !body.action || !body.entity_id) {
      return createErrorResponse('entity_type, action, and entity_id are required', 400);
    }
    
    // Prepare activity log data
    const logData = {
      entity_type: body.entity_type,
      action: body.action,
      entity_id: body.entity_id,
      user_id: user.id,
      details: body.details || {},
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('activity_logs')
      .insert(logData)
      .select(`
        id,
        entity_type,
        action,
        entity_id,
        user_id,
        details,
        created_at,
        user:user_profiles(id, first_name, last_name, email)
      `)
      .single();
    
    if (error) throw error;
    
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Activity log creation error:', error);
    throw error;
  }
}

// Helper function to format activity messages
function formatActivityMessage(log: any): string {
  const userName = log.user ? `${log.user.first_name} ${log.user.last_name}` : 'Unknown User';
  const entityName = log.details?.title || log.details?.name || `${log.entity_type} ${log.entity_id}`;
  
  const actionMessages: Record<string, string> = {
    created: `${userName} created ${log.entity_type} "${entityName}"`,
    updated: `${userName} updated ${log.entity_type} "${entityName}"`,
    deleted: `${userName} deleted ${log.entity_type} "${entityName}"`,
    completed: `${userName} completed ${log.entity_type} "${entityName}"`,
    assigned: `${userName} assigned ${log.entity_type} "${entityName}"`,
    unassigned: `${userName} unassigned ${log.entity_type} "${entityName}"`,
    approved: `${userName} approved ${log.entity_type} "${entityName}"`,
    rejected: `${userName} rejected ${log.entity_type} "${entityName}"`,
    commented: `${userName} commented on ${log.entity_type} "${entityName}"`,
    uploaded: `${userName} uploaded file to ${log.entity_type} "${entityName}"`,
    status_changed: `${userName} changed status of ${log.entity_type} "${entityName}" to ${log.details?.new_status || 'unknown'}`
  };
  
  return actionMessages[log.action] || `${userName} performed ${log.action} on ${log.entity_type} "${entityName}"`;
}

// Helper function to get time ago string
function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  if (diffMins < 10080) return `${Math.floor(diffMins / 1440)}d ago`;
  return time.toLocaleDateString();
}

// Helper function to get activity icon
function getActivityIcon(entityType: string, action: string): string {
  const icons: Record<string, string> = {
    'project-created': '🏗️',
    'project-updated': '📝',
    'project-completed': '✅',
    'task-created': '📋',
    'task-updated': '✏️',
    'task-completed': '✅',
    'task-assigned': '👤',
    'scope-created': '📊',
    'scope-updated': '📈',
    'client-created': '🏢',
    'client-updated': '📞',
    'file-uploaded': '📎',
    'comment-created': '💬',
    'approval-approved': '✅',
    'approval-rejected': '❌'
  };
  
  const key = `${entityType}-${action}`;
  return icons[key] || '📌';
}

// Helper function to get activity color
function getActivityColor(action: string): string {
  const colors: Record<string, string> = {
    created: 'green',
    updated: 'blue',
    deleted: 'red',
    completed: 'green',
    assigned: 'purple',
    approved: 'green',
    rejected: 'red',
    commented: 'gray',
    uploaded: 'orange'
  };
  
  return colors[action] || 'gray';
}

// Enhanced API exports with middleware
export const GET = withAPI(GETOriginal);
export const POST = withAPI(POSTOriginal);