import { withAPI, getRequestData, createSuccessResponse, createErrorResponse } from '@/lib/enhanced-auth-middleware';
import { NextRequest } from 'next/server';

import { buildPaginatedQuery, parseQueryParams, getScopeItemsOptimized, getProjectsOptimized, getTasksOptimized, getDashboardStatsOptimized } from '@/lib/enhanced-query-builder';

import { performanceMonitor } from '@/lib/performance-monitor';

import { createClient } from '@supabase/supabase-js';


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function GETOriginal(req: NextRequest, { user, profile }: any) {
  try {
    // Parse query parameters from the request
    const params = parseQueryParams(req);
    const { searchParams } = new URL(req.url);
    
    // Build base query for projects - using simple select to avoid FK issues
    const query = supabase.from('projects').select(`
      id,
      name,
      code,
      description,
      status,
      client_id,
      project_manager_id,
      start_date,
      end_date,
      budget_amount,
      location,
      created_at,
      updated_at,
      created_by,
      is_active
    `)
    .eq('is_active', true); // Only return active (non-deleted) projects
    
    // ROLE-BASED ACCESS CONTROL: Apply filtering based on user role
    // Admin and Management roles can see ALL projects
    if (!['admin', 'management'].includes(profile.role)) {
      // Other roles (PM, technical_lead, etc.) only see projects they're assigned to
      const assignedProjectsQuery = supabase
        .from('project_assignments')
        .select('project_id')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      const { data: assignments } = await assignedProjectsQuery;
      const projectIds = assignments?.map(a => a.project_id) || [];
      
      if (projectIds.length === 0) {
        // User has no project assignments, return empty result
        return createSuccessResponse({
          projects: [],
          total_count: 0,
          page: params.page || 1,
          limit: params.limit || 20,
          has_more: false
        });
      }
      
      // Filter to only assigned projects
      query.in('id', projectIds);
    }
    
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
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    console.log('📊 [GET /api/projects] Query result:', {
      projectCount: data?.length || 0,
      userRole: profile.role,
      activeOnly: true // Added is_active = true filter
    });
    
    // Return in the expected format for frontend
    return createSuccessResponse({
      projects: data || [],
      total_count: count || data?.length || 0,
      page: params.page || 1,
      limit: params.limit || 20,
      has_more: params.limit ? (data?.length || 0) >= params.limit : false
    });
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
    if (!body.name || !body.client_id || !body.start_date) {
      return createErrorResponse('Project name, client ID, and start date are required', 400);
    }
    
    // Generate project code from name
    const projectCode = body.name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 8) + '-' + Date.now().toString().slice(-4);
    
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: body.name,
        code: projectCode,
        description: body.description || null,
        status: body.status || 'planning',
        client_id: body.client_id || null,
        project_manager_id: body.project_manager_id || user.id,
        start_date: body.start_date,
        end_date: body.end_date || null,
        budget_amount: body.budget ? parseFloat(body.budget) : null,
        location: body.location || null,
        created_by: user.id
      })
      .select(`
        *,
        client:clients(id, name, contact_person),
        project_manager:user_profiles!projects_project_manager_id_fkey(id, full_name, email)
      `)
      .single();
    
    if (error) throw error;
    
    return createSuccessResponse({
      project: data
    });
  } catch (error) {
    console.error('API create error:', error);
    throw error;
  }
}

// Enhanced API exports with middleware
export const GET = withAPI(GETOriginal);
export const POST = withAPI(POSTOriginal);
