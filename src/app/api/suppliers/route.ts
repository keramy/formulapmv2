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
    
    // Build query for suppliers based on user role
    const query = supabase.from('suppliers').select('*');
    
    // Apply role-based filtering if needed
    // All roles can see suppliers per the unified RLS policy
    
    // Apply search filter if provided
    if (params.search) {
      query.or(`name.ilike.%${params.search}%,contact_person.ilike.%${params.search}%`);
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
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return createSuccessResponse(data || []);
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
    
    // Validate required fields
    if (!body.name || !body.contact_person) {
      return createErrorResponse('Name and contact person are required', 400);
    }
    
    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        name: body.name,
        contact_person: body.contact_person,
        email: body.email,
        phone: body.phone,
        address: body.address,
        specializations: body.specializations || [],
        is_approved: body.is_approved || false,
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
