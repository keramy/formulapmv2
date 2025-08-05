import { NextRequest } from 'next/server';
import { withAPI, getRequestData, createSuccessResponse, createErrorResponse } from '@/lib/enhanced-auth-middleware';
import { createClient } from '@/lib/supabase/server';

// GET /api/construction-reports/[id] - Get specific construction report with all details
async function GETOriginal(request: NextRequest, { user, profile, params }: any) {
  try {
    const reportId = params.id;

    if (!reportId) {
      return createErrorResponse('Report ID is required', 400);
    }

    const supabase = await createClient();
    const { data: report, error } = await supabase
      .from('construction_reports')
      .select(`
        id, name, description, status, visibility, pdf_path, published_at,
        created_at, updated_at,
        project:projects(id, name, status, project_manager_id),
        created_by_user:user_profiles!construction_reports_created_by_fkey(id, first_name, last_name, email),
        report_lines:construction_report_lines(
          id, line_number, title, description, created_at, updated_at,
          photos:construction_report_photos(
            id, file_name, file_path, description, annotations, file_size, mime_type,
            uploaded_by_user:user_profiles!construction_report_photos_uploaded_by_fkey(id, first_name, last_name, email),
            created_at
          )
        )
      `)
      .eq('id', reportId)
      .order('line_number', { referencedTable: 'construction_report_lines', ascending: true })
      .order('created_at', { referencedTable: 'construction_report_lines.construction_report_photos', ascending: true })
      .single();

    if (error) {
      console.error('Error fetching construction report:', error);
      if (error.code === 'PGRST116') {
        return createErrorResponse('Construction report not found', 404);
      }
      return createErrorResponse('Failed to fetch construction report', 500, error);
    }

    return createSuccessResponse({ report });

  } catch (error) {
    console.error('Error in construction report GET:', error);
    return createErrorResponse('Internal server error', 500, error);
  }
}

// PUT /api/construction-reports/[id] - Update construction report
async function PUTOriginal(request: NextRequest, { user, profile, params }: any) {
  try {
    const reportId = params.id;
    const requestData = await request.json();
    const { name, description, visibility, status } = requestData;

    if (!reportId) {
      return createErrorResponse('Report ID is required', 400);
    }

    // Validate status if provided
    if (status && !['draft', 'published'].includes(status)) {
      return createErrorResponse('Invalid status. Must be draft or published', 400);
    }

    // Validate visibility if provided
    if (visibility && !['internal', 'client'].includes(visibility)) {
      return createErrorResponse('Invalid visibility. Must be internal or client', 400);
    }

    // Check if report exists and user has access
    const supabase2 = await createClient();
    const { data: existingReport, error: fetchError } = await supabase2
      .from('construction_reports')
      .select('id, status, created_by')
      .eq('id', reportId)
      .single();

    if (fetchError || !existingReport) {
      return createErrorResponse('Construction report not found or access denied', 404);
    }

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (visibility !== undefined) updateData.visibility = visibility;
    if (status !== undefined) {
      updateData.status = status;
      // Set published_at when status changes to published
      if (status === 'published' && existingReport.status === 'draft') {
        updateData.published_at = new Date().toISOString();
      }
    }

    if (Object.keys(updateData).length === 0) {
      return createErrorResponse('No valid fields to update', 400);
    }

    // Update the report
    const supabase3 = await createClient();
    const { data: report, error } = await supabase3
      .from('construction_reports')
      .update(updateData)
      .eq('id', reportId)
      .select(`
        id, name, description, status, visibility, pdf_path, published_at,
        created_at, updated_at,
        project:projects(id, name, status),
        created_by_user:user_profiles!construction_reports_created_by_fkey(id, first_name, last_name, email)
      `)
      .single();

    if (error) {
      console.error('Error updating construction report:', error);
      return createErrorResponse('Failed to update construction report', 500, error);
    }

    return createSuccessResponse({ report });

  } catch (error) {
    console.error('Error in construction report PUT:', error);
    return createErrorResponse('Internal server error', 500, error);
  }
}

// DELETE /api/construction-reports/[id] - Delete construction report
async function DELETEOriginal(request: NextRequest, { user, profile, params }: any) {
  try {
    const reportId = params.id;

    if (!reportId) {
      return createErrorResponse('Report ID is required', 400);
    }

    // Check if report exists and user has access
    const supabase4 = await createClient();
    const { data: existingReport, error: fetchError } = await supabase4
      .from('construction_reports')
      .select('id, status')
      .eq('id', reportId)
      .single();

    if (fetchError || !existingReport) {
      return createErrorResponse('Construction report not found or access denied', 404);
    }

    // Only allow deletion of draft reports
    if (existingReport.status === 'published') {
      return createErrorResponse('Cannot delete published reports', 400);
    }

    // Delete the report (cascade will handle related data)
    const supabase5 = await createClient();
    const { error } = await supabase5
      .from('construction_reports')
      .delete()
      .eq('id', reportId);

    if (error) {
      console.error('Error deleting construction report:', error);
      return createErrorResponse('Failed to delete construction report', 500, error);
    }

    return createSuccessResponse({ message: 'Construction report deleted successfully' });

  } catch (error) {
    console.error('Error in construction report DELETE:', error);
    return createErrorResponse('Internal server error', 500, error);
  }
}

export const GET = withAPI(GETOriginal);
export const PUT = withAPI(PUTOriginal);
export const DELETE = withAPI(DELETEOriginal);