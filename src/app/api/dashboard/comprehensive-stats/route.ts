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
    console.log('🔍 [Dashboard Stats] Loading stats for user:', user.id, 'role:', profile.role);
    
    // Get real dashboard statistics
    const stats = await getDashboardStats(user.id, profile.role);
    
    console.log('✅ [Dashboard Stats] Successfully calculated stats:', stats);
    return createSuccessResponse(stats);
  } catch (error) {
    console.error('❌ [Dashboard Stats] Error occurred:', error);
    
    // Return a more detailed error response
    return createErrorResponse(
      `Dashboard stats calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500,
      { 
        userId: user.id, 
        userRole: profile.role,
        errorDetails: error instanceof Error ? error.stack : String(error)
      }
    );
  }
}

async function getDashboardStats(userId: string, userRole: string) {
  try {
    // Get projects count based on role - ONLY ACTIVE PROJECTS
    let projectsQuery = supabase
      .from('projects')
      .select('id, status, budget_amount')
      .eq('is_active', true); // Only count active (non-deleted) projects

    // Apply role-based filtering
    if (userRole === 'client') {
      // Clients see only their projects
      projectsQuery = projectsQuery.eq('client_id', userId);
    } else if (userRole === 'project_manager') {
      // Project managers see managed projects
      projectsQuery = projectsQuery.eq('project_manager_id', userId);
    } else if (['technical_lead', 'purchase_manager'].includes(userRole)) {
      // Other roles see assigned projects
      const { data: assignments } = await supabase
        .from('project_assignments')
        .select('project_id')
        .eq('user_id', userId)
        .eq('is_active', true);
      
      if (assignments && assignments.length > 0) {
        const projectIds = assignments.map(a => a.project_id);
        projectsQuery = projectsQuery.in('id', projectIds);
      } else {
        // No assignments, return empty stats
        projectsQuery = projectsQuery.eq('id', 'none');
      }
    }
    // Admin and management see all projects (no additional filtering)

    const { data: projects, error: projectsError } = await projectsQuery;
    if (projectsError) {
      console.error('❌ [Dashboard Stats] Projects query error:', projectsError);
      throw projectsError;
    }
    
    console.log('📊 [Dashboard Stats] Found projects:', projects?.length || 0);

    const totalProjects = projects?.length || 0;
    const activeProjects = projects?.filter(p => p.status === 'active').length || 0;
    const totalBudget = projects?.reduce((sum, p) => sum + (p.budget_amount || 0), 0) || 0;

    // Get scope items statistics
    let scopeQuery = supabase
      .from('scope_items')
      .select('id, status, project_id');

    if (projects && projects.length > 0) {
      const projectIds = projects.map(p => p.id);
      scopeQuery = scopeQuery.in('project_id', projectIds);
    } else {
      scopeQuery = scopeQuery.eq('id', 'none');
    }

    const { data: scopeItems, error: scopeError } = await scopeQuery;
    if (scopeError) {
      console.error('❌ [Dashboard Stats] Scope items query error:', scopeError);
      throw scopeError;
    }
    
    console.log('📋 [Dashboard Stats] Found scope items:', scopeItems?.length || 0);

    const totalScopeItems = scopeItems?.length || 0;
    const completedScopeItems = scopeItems?.filter(s => s.status === 'completed').length || 0;
    const overdueScopeItems = scopeItems?.filter(s => s.status === 'overdue').length || 0;

    // Get team members count (visible based on role)
    let teamMembersCount = 0;
    if (['admin', 'management'].includes(userRole)) {
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('is_active', true);
      
      if (!usersError && users) {
        teamMembersCount = users.length;
      }
    }

    // Set permissions based on role
    const permissions = {
      canViewProjects: true, // All authenticated users can view projects
      canViewUsers: ['admin', 'management'].includes(userRole),
      canViewFinancials: ['admin', 'management', 'purchase_manager'].includes(userRole)
    };

    return {
      totalProjects,
      activeProjects,
      totalScopeItems,
      completedScopeItems,
      overdueScopeItems,
      teamMembers: teamMembersCount,
      budget: totalBudget,
      totalPortfolioValue: totalBudget,
      activeProjectValue: projects?.filter(p => p.status === 'active').reduce((sum, p) => sum + (p.budget_amount || 0), 0) || 0,
      revenueGenerated: 0, // Will be calculated from actual costs later
      taskCompletion: totalScopeItems > 0 ? Math.round((completedScopeItems / totalScopeItems) * 100) : 0,
      overallProgress: 0, // Will be calculated from project progress
      permissions
    };

  } catch (error) {
    console.error('Error calculating dashboard stats:', error);
    throw error;
  }
}

// Enhanced API exports with middleware
export const GET = withAPI(GETOriginal);
