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
    
    // Build query for projects with related data
    const query = supabase.from('projects').select(`
      *,
      client:clients(id, company_name, contact_person),
      project_manager:user_profiles!projects_project_manager_id_fkey(id, first_name, last_name, email),
      assignments:project_assignments(
        id,
        user_id,
        role,
        is_active,
        user:user_profiles(id, first_name, last_name, email)
      )
    `);
    
    // Apply search filter if provided
    if (params.search) {
      query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`);
    }
    
    // Apply status filter if provided
    if (params.status) {
      query.eq('status', params.status);
    }
    
    // Apply client filter if provided
    if (params.client_id) {
      query.eq('client_id', params.client_id);
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
    
    return createSuccessResponse(data);
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
}

async function POSTOriginal(req: NextRequest) {
  const { user, profile } = getRequestData(req);
  
  try {
    const body = await req.json();
    
    // Add validation here
    if (!body || Object.keys(body).length === 0) {
      return createErrorResponse('Request body is required', 400);
    }
    
    // Validate required fields for project
    if (!body.name || !body.client_id) {
      return createErrorResponse('Project name and client ID are required', 400);
    }
    
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: body.name,
        description: body.description || '',
        status: body.status || 'planning',
        client_id: body.client_id,
        project_manager_id: body.project_manager_id || user.id,
        start_date: body.start_date,
        end_date: body.end_date,
        budget: body.budget || 0,
        location: body.location || '',
        notes: body.notes || '',
        created_by: user.id,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        client:clients(id, company_name, contact_person),
        project_manager:user_profiles!projects_project_manager_id_fkey(id, first_name, last_name, email)
      `)
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
