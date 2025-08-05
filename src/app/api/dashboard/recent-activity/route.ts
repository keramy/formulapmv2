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
  
  try {
    const { searchParams } = new URL(req.url);
    const params = {
      limit: parseInt(searchParams.get('limit') || '10'),
      page: parseInt(searchParams.get('page') || '1')
    };
    
    // Get recent activity logs
    const { data, error } = await supabase
      .from('activity_logs')
      .select(`
        id,
        entity_type,
        action,
        entity_id,
        details,
        created_at,
        user:user_profiles(first_name, last_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(params.limit);
    
    if (error) throw error;
    
    return createSuccessResponse(data);
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
}

// Enhanced API exports with middleware
export const GET = withAPI(GETOriginal);
