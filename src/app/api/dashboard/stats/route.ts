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
    
    // Get dashboard statistics based on user role
    const stats = {
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
      stats.projects.total = projectStats.length;
      stats.projects.active = projectStats.filter(p => p.status === 'active').length;
      stats.projects.completed = projectStats.filter(p => p.status === 'completed').length;
      stats.projects.planning = projectStats.filter(p => p.status === 'planning').length;
    }

    // Get scope item statistics
    const { data: scopeStats, error: scopeError } = await supabase
      .from('scope_items')
      .select('status')
      .not('status', 'is', null);
    
    if (scopeError) throw scopeError;
    
    if (scopeStats) {
      stats.scope_items.total = scopeStats.length;
      stats.scope_items.pending = scopeStats.filter(s => s.status === 'pending').length;
      stats.scope_items.in_progress = scopeStats.filter(s => s.status === 'in_progress').length;
      stats.scope_items.completed = scopeStats.filter(s => s.status === 'completed').length;
    }

    // Get supplier statistics
    const { data: supplierStats, error: supplierError } = await supabase
      .from('suppliers')
      .select('is_approved')
      .not('is_approved', 'is', null);
    
    if (supplierError) throw supplierError;
    
    if (supplierStats) {
      stats.suppliers.total = supplierStats.length;
      stats.suppliers.approved = supplierStats.filter(s => s.is_approved === true).length;
      stats.suppliers.pending = supplierStats.filter(s => s.is_approved === false).length;
    }

    return createSuccessResponse(stats);
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
}

// Enhanced API exports with middleware
export const GET = withAPI(GETOriginal);
