import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware';
import { createServerClient } from '@/lib/supabase';
import { getCachedResponse, generateCacheKey, invalidateCache } from '@/lib/cache-middleware'

export const GET = withAuth(async (request: NextRequest, { user, profile }) => {
  try {

    // Optimized dashboard stats with aggregated queries
    const [projectStats, taskStats, scopeStats] = await Promise.all([
      supabase
        .from('projects')
        .select('status')
        .eq('status', 'active'),
      
      supabase
        .from('tasks')
        .select('status, priority')
        .in('status', ['pending', 'in_progress', 'completed']),
        
      supabase
        .from('scope_items')
        .select('category, status')
        .eq('status', 'active')
    ])
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'review');

    if (approvalError) {
      console.error('Error fetching approvals:', approvalError);
      // Don't fail the entire request for approvals error
    }

    const stats = {
      activeProjects: activeCount,
      totalBudget,
      actualSpent,
      pendingApprovals: approvalCount || 0,
      atRiskProjects: atRiskCount
    };

    return createSuccessResponse(stats);
  } catch (error) {
    console.error('Dashboard stats API error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}, {
  permission: 'dashboard.read'
})