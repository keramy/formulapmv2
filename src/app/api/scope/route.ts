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
    
    // Build query for scope items based on user role and filters (using safe columns)
    const query = supabase.from('scope_items').select(`
      id,
      category,
      status,
      description,
      project_id,
      created_at,
      updated_at,
      project:projects(id, name)
    `);
    
    // Apply role-based filtering
    // RLS policies will handle access control, but we can optimize queries
    if (params.project_id) {
      query.eq('project_id', params.project_id);
    }
    
    // Apply search filter if provided (using safe column)
    if (params.search) {
      query.ilike('description', `%${params.search}%`);
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
    
    const result = await getCachedResponse(cacheKey, '/api/scope', async () => {
      const { data, error, count } = await query;
      if (error) throw error;
      return { items: data || [], total: count || 0 };
    });
    
    // Return properly formatted response for useScope hook
    return createSuccessResponse({
      items: result.items,
      statistics: {
        total: result.total,
        completed: result.items.filter(item => item.status === 'completed').length,
        pending: result.items.filter(item => item.status === 'pending').length,
        in_progress: result.items.filter(item => item.status === 'in_progress').length
      }
    }, {
      total: result.total,
      page: params.page,
      limit: params.limit,
      has_more: result.total > (params.page * params.limit)
    });
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
    if (!body.project_id) {
      return createErrorResponse('Project ID is required', 400);
    }
    
    if (!body.item_name && !body.description) {
      return createErrorResponse('Either item name or description is required', 400);
    }
    
    console.log('🧪 [API] Attempting to create scope item with body:', body);
    
    // Add required fields including description
    const minimalData = {
      project_id: body.project_id,
      code: body.item_name || `SCOPE-${Date.now()}`, // Map item_name to required 'code' field
      description: body.description || body.item_name || 'No description provided', // Add required description
      created_by: user.id
    };
    
    console.log('🧪 [API] Attempting insert with minimal data:', minimalData);
    
    let { data, error } = await supabase
      .from('scope_items')
      .insert(minimalData)
      .select()
      .single();
    
    if (error) {
      console.error('🚨 [API] Database error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      // Return the detailed error to help debug
      return createErrorResponse(
        `Database error: ${error.message}. Code: ${error.code}. Details: ${error.details}. Hint: ${error.hint}`,
        500
      );
    }
    
    return createSuccessResponse(data);
  } catch (error) {
    console.error('API create error:', error);
    throw error;
  }
}

// Enhanced API exports with middleware
export const GET = withAPI(GETOriginal);
export const POST = withAPI(POSTOriginal, {
  roles: ['admin', 'management', 'project_manager', 'technical_lead', 'purchase_manager', 'subcontractor']
});
