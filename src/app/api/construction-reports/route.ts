import { NextRequest } from 'next/server';
import { withAPI, getRequestData, createSuccessResponse, createErrorResponse } from '@/lib/enhanced-auth-middleware';
import { createClient } from '@/lib/supabase/server';

// GET /api/construction-reports - Get all construction reports for projects user has access to
async function GETOriginal(request: NextRequest, { user, profile }: any) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const status = searchParams.get('status');
    const visibility = searchParams.get('visibility');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const offset = (page - 1) * limit;

    const supabase = await createClient();
    let query = supabase.from('construction_reports').select(`
      id, name, description, status, visibility, pdf_path, published_at,
      created_at, updated_at,
      project:projects(id, name, status),
      created_by_user:user_profiles!construction_reports_created_by_fkey(id, first_name, last_name, email),
      report_lines:construction_report_lines(
        id, line_number, title, description,
        photos:construction_report_photos(id, file_name, file_path, description, annotations)
      )
    `);

    // Filter by project if specified
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    // Filter by status if specified
    if (status && ['draft', 'published'].includes(status)) {
      query = query.eq('status', status);
    }

    // Filter by visibility if specified
    if (visibility && ['internal', 'client'].includes(visibility)) {
      query = query.eq('visibility', visibility);
    }

    // Add pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: reports, error } = await query;

    if (error) {
      console.error('Error fetching construction reports:', error);
      return createErrorResponse('Failed to fetch construction reports', 500, error);
    }

    // Get total count for pagination
    let countQuery = supabase.from('construction_reports').select('*', { count: 'exact', head: true });
    
    if (projectId) {
      countQuery = countQuery.eq('project_id', projectId);
    }
    if (status) {
      countQuery = countQuery.eq('status', status);
    }
    if (visibility) {
      countQuery = countQuery.eq('visibility', visibility);
    }

    const { count } = await countQuery;
    const totalPages = Math.ceil((count || 0) / limit);

    return createSuccessResponse({
      reports: reports || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error in construction reports GET:', error);
    return createErrorResponse('Internal server error', 500, error);
  }
}

// POST /api/construction-reports - Create new construction report
async function POSTOriginal(request: NextRequest, { user, profile }: any) {
  try {
    const requestData = await request.json();
    const { project_id, name, description, visibility = 'internal' } = requestData;

    // Validate required fields
    if (!project_id || !name) {
      return createErrorResponse('Missing required fields: project_id, name', 400);
    }

    // Validate visibility
    if (!['internal', 'client'].includes(visibility)) {
      return createErrorResponse('Invalid visibility. Must be internal or client', 400);
    }

    // Verify user has access to the project
    const supabase2 = await createClient();
    const { data: projectAccess, error: accessError } = await supabase2
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .single();

    if (accessError || !projectAccess) {
      return createErrorResponse('Project not found or access denied', 404);
    }

    // Create the construction report
    const supabase3 = await createClient();
    const { data: report, error } = await supabase3
      .from('construction_reports')
      .insert({
        project_id,
        name: name.trim(),
        description: description?.trim() || null,
        visibility,
        status: 'draft',
        created_by: user.id
      })
      .select(`
        id, name, description, status, visibility, pdf_path, published_at,
        created_at, updated_at,
        project:projects(id, name, status),
        created_by_user:user_profiles!construction_reports_created_by_fkey(id, first_name, last_name, email)
      `)
      .single();

    if (error) {
      console.error('Error creating construction report:', error);
      return createErrorResponse('Failed to create construction report', 500, error);
    }

    return createSuccessResponse({ report }, 201);

  } catch (error) {
    console.error('Error in construction reports POST:', error);
    return createErrorResponse('Internal server error', 500, error);
  }
}

export const GET = withAPI(GETOriginal);
export const POST = withAPI(POSTOriginal);