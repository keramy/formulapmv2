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
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      search: searchParams.get('search'),
      status: searchParams.get('status'),
      project_id: searchParams.get('project_id'),
      sort_field: searchParams.get('sort_field'),
      sort_direction: searchParams.get('sort_direction') || 'desc'
    };
    
    // Add your specific query logic here
    const { data, error } = await supabase
      .from('your_table')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    return createSuccessResponse(data);
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
}

async function POSTOriginal(req: NextRequest) {
  const user = (req as any).user;
  const profile = (req as any).profile;
  
  try {
    const body = await req.json();
    
    // Add validation here
    if (!body || Object.keys(body).length === 0) {
      return createErrorResponse('Request body is required', 400);
    }
    
    const { data, error } = await supabase
      .from('your_table')
      .insert({
        ...body,
        created_by: user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return createSuccessResponse(data);
  } catch (error) {
    console.error('API create error:', error);
    throw error;
  }
}

// Enhanced API exports with middleware
export const GET = withAPI(GETOriginal);
export const POST = withAPI(POSTOriginal);
