import { withAPI, getRequestData, createSuccessResponse, createErrorResponse } from '@/lib/enhanced-auth-middleware';
import { NextRequest } from 'next/server';

import { buildPaginatedQuery, parseQueryParams, getScopeItemsOptimized, getProjectsOptimized, getTasksOptimized, getDashboardStatsOptimized } from '@/lib/enhanced-query-builder';

import { performanceMonitor } from '@/lib/performance-monitor';
import { getCachedResponse } from '@/lib/cache-middleware';

import { createClient } from '@supabase/supabase-js';


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function GETOriginal(req: NextRequest, { user, profile }: any) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Create cache key based on user role (stats are role-independent but user-scoped for RLS)
    const cacheKey = `dashboard-stats:${user.id}:${profile.role}`;
    
    const stats = await getCachedResponse(cacheKey, '/api/dashboard/stats', async () => {
      // Get dashboard statistics based on user role
      const statsData = {
        projects: { total: 0, active: 0, completed: 0, planning: 0 },
        scope_items: { total: 0, pending: 0, in_progress: 0, completed: 0 },
        suppliers: { total: 0, approved: 0, pending: 0 },
        recent_activity: []
      };

      // Get project statistics
      const { data: projectStats, error: projectError } = await supabase
        .from('projects')
        .select('status')
        .not('status', 'is', null);
      
      if (projectError) throw projectError;
      
      if (projectStats) {
        statsData.projects.total = projectStats.length;
        statsData.projects.active = projectStats.filter(p => p.status === 'active').length;
        statsData.projects.completed = projectStats.filter(p => p.status === 'completed').length;
        statsData.projects.planning = projectStats.filter(p => p.status === 'planning').length;
      }

      // Get scope item statistics
      const { data: scopeStats, error: scopeError } = await supabase
        .from('scope_items')
        .select('status')
        .not('status', 'is', null);
      
      if (scopeError) throw scopeError;
      
      if (scopeStats) {
        statsData.scope_items.total = scopeStats.length;
        statsData.scope_items.pending = scopeStats.filter(s => s.status === 'pending').length;
        statsData.scope_items.in_progress = scopeStats.filter(s => s.status === 'in_progress').length;
        statsData.scope_items.completed = scopeStats.filter(s => s.status === 'completed').length;
      }

      // Get supplier statistics
      const { data: supplierStats, error: supplierError } = await supabase
        .from('suppliers')
        .select('is_approved')
        .not('is_approved', 'is', null);
      
      if (supplierError) throw supplierError;
      
      if (supplierStats) {
        statsData.suppliers.total = supplierStats.length;
        statsData.suppliers.approved = supplierStats.filter(s => s.is_approved === true).length;
        statsData.suppliers.pending = supplierStats.filter(s => s.is_approved === false).length;
      }

      return statsData;
    });

    return createSuccessResponse(stats);
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
}

// Enhanced API exports with middleware
export const GET = withAPI(GETOriginal);
