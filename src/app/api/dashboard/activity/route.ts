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
    
    // Get recent activity for dashboard (last 24 hours by default)
    const timeLimit = params.hours ? new Date(Date.now() - params.hours * 60 * 60 * 1000).toISOString() : 
                      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    let query = supabase.from('activity_logs').select(`
      id,
      entity_type,
      action,
      entity_id,
      user_id,
      details,
      created_at,
      user:user_profiles(id, first_name, last_name, email, role)
    `).gte('created_at', timeLimit);
    
    // Role-based filtering for dashboard activity  
    if (profile.role === 'client') {
      // Clients see only activities from their projects
      const clientProjects = await supabase
        .from('projects')
        .select('id')
        .eq('client_id', profile.id);
      
      if (clientProjects.data && clientProjects.data.length > 0) {
        const projectIds = clientProjects.data.map(p => p.id);
        query = query.or(`entity_type.eq.project.and.entity_id.in.(${projectIds.join(',')}),details->>project_id.in.(${projectIds.join(',')})`);
      } else {
        // No projects, return empty activity
        return createSuccessResponse([]);
      }
    } else if (profile.role === 'project_manager') {
      // Project managers see activities from managed projects
      const managedProjects = await supabase
        .from('projects')
        .select('id')
        .eq('project_manager_id', user.id);
      
      if (managedProjects.data && managedProjects.data.length > 0) {
        const projectIds = managedProjects.data.map(p => p.id);
        query = query.or(`entity_type.eq.project.and.entity_id.in.(${projectIds.join(',')}),details->>project_id.in.(${projectIds.join(',')})`);
      } else {
        query = query.eq('user_id', user.id);
      }
    } else if (['technical_lead', 'purchase_manager'].includes(profile.role)) {
      // Show activities from assigned projects + own activities
      const assignedProjects = await supabase
        .from('project_assignments')
        .select('project_id')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      if (assignedProjects.data && assignedProjects.data.length > 0) {
        const projectIds = assignedProjects.data.map(p => p.project_id);
        query = query.or(`user_id.eq.${user.id},entity_type.eq.project.and.entity_id.in.(${projectIds.join(',')}),details->>project_id.in.(${projectIds.join(',')}))`);
      } else {
        query = query.eq('user_id', user.id);
      }
    }
    // Admin and management see all recent activities
    
    // Limit to dashboard-appropriate number of activities  
    const limit = params.limit || 15;
    query = query.order('created_at', { ascending: false }).limit(limit);
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Transform for dashboard display
    const dashboardActivity = data?.map(activity => ({
      id: activity.id,
      type: activity.entity_type,
      action: activity.action,
      user_name: activity.user ? `${activity.user.first_name} ${activity.user.last_name}` : 'Unknown User',
      user_role: activity.user?.role || 'unknown',
      message: formatDashboardMessage(activity),
      details: activity.details,
      created_at: activity.created_at,
      time_ago: getTimeAgo(activity.created_at),
      icon: getDashboardIcon(activity.entity_type, activity.action),
      color: getDashboardColor(activity.action)
    })) || [];
    
    return createSuccessResponse(dashboardActivity);
  } catch (error) {
    console.error('Dashboard activity API fetch error:', error);
    throw error;
  }
}

// Helper function to format dashboard messages (shorter than full activity logs)
function formatDashboardMessage(activity: any): string {
  const userName = activity.user ? `${activity.user.first_name} ${activity.user.last_name}` : 'Someone';
  const entityName = activity.details?.title || activity.details?.name || activity.entity_type;
  
  const shortMessages: Record<string, string> = {
    created: `${userName} created ${entityName}`,
    updated: `${userName} updated ${entityName}`,
    completed: `${userName} completed ${entityName}`,
    assigned: `${userName} assigned ${entityName}`,
    approved: `${userName} approved ${entityName}`,
    rejected: `${userName} rejected ${entityName}`,
    commented: `${userName} commented on ${entityName}`,
    uploaded: `${userName} uploaded a file`,
    status_changed: `${userName} changed status to ${activity.details?.new_status || 'unknown'}`
  };
  
  return shortMessages[activity.action] || `${userName} ${activity.action} ${entityName}`;
}

// Helper functions for dashboard display
function getTimeAgo(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
  return `${Math.floor(diffMins / 1440)}d`;
}

function getDashboardIcon(entityType: string, action: string): string {
  const icons: Record<string, string> = {
    project: '🏗️',
    task: '📋',
    scope: '📊',
    client: '🏢',
    comment: '💬',
    file: '📎'
  };
  return icons[entityType] || '📌';
}

function getDashboardColor(action: string): string {
  const colors: Record<string, string> = {
    created: 'text-green-600',
    updated: 'text-blue-600',
    completed: 'text-green-600',
    assigned: 'text-purple-600',
    approved: 'text-green-600',
    rejected: 'text-red-600',
    commented: 'text-gray-600'
  };
  return colors[action] || 'text-gray-600';
}

// Enhanced API exports with middleware
export const GET = withAPI(GETOriginal);
