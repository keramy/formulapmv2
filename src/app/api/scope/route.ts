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

async function GETOriginal(req: NextRequest) {
  const user = (req as any).user;
  const profile = (req as any).profile;
  
  try {
    const { searchParams } = new URL(req.url);
    const params = {
      project_id: searchParams.get('project_id'),
      search: searchParams.get('search'),
      status: searchParams.get('status'),
      sort_field: searchParams.get('sort_field'),
      sort_direction: searchParams.get('sort_direction') || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20')
    };
    
    // Build query for scope items based on user role and filters
    const query = supabase.from('scope_items').select(`
      *,
      project:projects(id, name, client_id),
      assigned_user:user_profiles!scope_items_assigned_to_fkey(id, first_name, last_name, email)
    `);
    
    // Apply role-based filtering
    // RLS policies will handle access control, but we can optimize queries
    if (params.project_id) {
      query.eq('project_id', params.project_id);
    }
    
    // Apply search filter if provided
    if (params.search) {
      query.or(`item_name.ilike.%${params.search}%,description.ilike.%${params.search}%`);
    }
    
    // Apply status filter if provided
    if (params.status) {
      query.eq('status', params.status);
    }
    
    // Apply sorting
    if (params.sort_field) {
      query.order(params.sort_field, { ascending: params.sort_direction === 'asc' });
    } else {
      query.order('created_at', { ascending: false });
    }
    
    // Apply pagination
    if (params.limit) {
      const offset = (params.page - 1) * params.limit;
      query.range(offset, offset + params.limit - 1);
    }
    
    // Create cache key based on user, role, and query parameters
    const cacheKey = `scope:${user.id}:${profile.role}:${JSON.stringify(params)}`;
    
    const data = await getCachedResponse(cacheKey, '/api/scope', async () => {
      const { data, error } = await query;
      if (error) throw error;
      return data;
    });
    
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
    
    // Validate required fields for scope item
    if (!body.item_name || !body.project_id) {
      return createErrorResponse('Item name and project ID are required', 400);
    }
    
    const { data, error } = await supabase
      .from('scope_items')
      .insert({
        item_name: body.item_name,
        description: body.description || '',
        category: body.category || 'general',
        status: body.status || 'pending',
        project_id: body.project_id,
        assigned_to: body.assigned_to,
        priority: body.priority || 'medium',
        estimated_hours: body.estimated_hours || 0,
        actual_hours: body.actual_hours || 0,
        budget_amount: body.budget_amount || 0,
        actual_cost: body.actual_cost || 0,
        start_date: body.start_date,
        end_date: body.end_date,
        notes: body.notes || '',
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
export const POST = withAPI(POSTOriginal, {
  roles: ['management', 'project_manager', 'technical_lead', 'purchase_manager', 'subcontractor']
});
