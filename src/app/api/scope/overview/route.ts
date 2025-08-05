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
  const user = (req as any).user;
  const profile = (req as any).profile;
  
  console.log('Scope overview API called, user:', user?.id, 'profile:', profile?.id);
  
  try {
    // Test database connection first
    console.log('Testing database connection...');
    const testResult = await supabase.from('projects').select('count', { count: 'exact', head: true });
    console.log('Database connection test result:', testResult);
    
    if (testResult.error) {
      console.error('Database connection failed:', testResult.error);
      throw new Error(`Database connection failed: ${testResult.error.message}`);
    }
    
    // Get scope items overview with stats
    console.log('Fetching scope items and projects...');
    const [scopeItemsResult, projectsResult] = await Promise.all([
      supabase
        .from('scope_items')
        .select('id, category, status, total_price, actual_cost, project_id, created_at, assigned_to'),
      supabase
        .from('projects')
        .select('id, name')
    ]);
    
    console.log('Query results - scope items:', scopeItemsResult.data?.length, 'projects:', projectsResult.data?.length);

    if (scopeItemsResult.error) throw scopeItemsResult.error;
    if (projectsResult.error) throw projectsResult.error;

    const scopeItems = scopeItemsResult.data || [];
    const projects = projectsResult.data || [];

    // Calculate category stats
    const categories = {
      construction: { count: 0, completion: 0, projects: 0 },
      millwork: { count: 0, completion: 0, projects: 0 },
      electrical: { count: 0, completion: 0, projects: 0 },
      mechanical: { count: 0, completion: 0, projects: 0 }
    };

    const categoryProjects = new Set();
    
    scopeItems.forEach(item => {
      const category = item.category || 'construction';
      if (categories[category as keyof typeof categories]) {
        categories[category as keyof typeof categories].count++;
        if (item.status === 'completed') {
          categories[category as keyof typeof categories].completion += 1;
        }
        categoryProjects.add(`${category}-${item.project_id}`);
      }
    });

    // Calculate completion percentages
    Object.keys(categories).forEach(key => {
      const category = categories[key as keyof typeof categories];
      if (category.count > 0) {
        category.completion = Math.round((category.completion / category.count) * 100);
      }
      // Count unique projects for this category
      category.projects = Array.from(categoryProjects)
        .filter(proj => (proj as string).startsWith(key)).length;
    });

    const overview = {
      total_items: scopeItems.length,
      total_projects: projects.length,
      categories,
      pending_approvals: scopeItems.filter(item => item.status === 'pending').length,
      overdue_items: 0, // Would need due_date field to calculate
      user_assignments: scopeItems.filter(item => item.assigned_to === user.id).length,
      recent_activity: [] // Would need activity log to populate
    };
    
    return createSuccessResponse({ overview });
  } catch (error) {
    console.error('API fetch error:', error);
    return createErrorResponse('Failed to fetch scope overview', 500);
  }
}

// Enhanced API exports with middleware
export const GET = withAPI(GETOriginal);
