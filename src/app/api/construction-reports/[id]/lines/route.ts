import { NextRequest } from 'next/server';
import { withAPI, getRequestData, createSuccessResponse, createErrorResponse } from '@/lib/enhanced-auth-middleware';
import { supabase } from '@/lib/supabase/server';

// GET /api/construction-reports/[id]/lines - Get all lines for a construction report
async function GETOriginal(request: NextRequest, { user, profile, params }: any) {
  try {
    const reportId = params.id;

    if (!reportId) {
      return createErrorResponse('Report ID is required', 400);
    }

    // Verify user has access to the report
    const { data: reportAccess, error: accessError } = await supabase
      .from('construction_reports')
      .select('id')
      .eq('id', reportId)
      .single();

    if (accessError || !reportAccess) {
      return createErrorResponse('Construction report not found or access denied', 404);
    }

    const { data: lines, error } = await supabase
      .from('construction_report_lines')
      .select(`
        id, line_number, title, description, created_at, updated_at,
        photos:construction_report_photos(
          id, file_name, file_path, description, annotations, file_size, mime_type,
          uploaded_by_user:user_profiles!construction_report_photos_uploaded_by_fkey(id, first_name, last_name, email),
          created_at
        )
      `)
      .eq('report_id', reportId)
      .order('line_number', { ascending: true })
      .order('created_at', { referencedTable: 'construction_report_photos', ascending: true });

    if (error) {
      console.error('Error fetching construction report lines:', error);
      return createErrorResponse('Failed to fetch construction report lines', 500, error);
    }

    return createSuccessResponse({ lines: lines || [] });

  } catch (error) {
    console.error('Error in construction report lines GET:', error);
    return createErrorResponse('Internal server error', 500, error);
  }
}

// POST /api/construction-reports/[id]/lines - Create new line for construction report
async function POSTOriginal(request: NextRequest, { user, profile, params }: any) {
  try {
    const reportId = params.id;
    const requestData = await getRequestData(request);
    const { title, description } = requestData;

    if (!reportId) {
      return createErrorResponse('Report ID is required', 400);
    }

    // Validate required fields
    if (!title) {
      return createErrorResponse('Missing required field: title', 400);
    }

    // Verify user has access to the report and it's in draft status
    const { data: report, error: accessError } = await supabase
      .from('construction_reports')
      .select('id, status')
      .eq('id', reportId)
      .single();

    if (accessError || !report) {
      return createErrorResponse('Construction report not found or access denied', 404);
    }

    if (report.status === 'published') {
      return createErrorResponse('Cannot add lines to published reports', 400);
    }

    // Get the next line number
    const { data: lastLine } = await supabase
      .from('construction_report_lines')
      .select('line_number')
      .eq('report_id', reportId)
      .order('line_number', { ascending: false })
      .limit(1)
      .single();

    const nextLineNumber = (lastLine?.line_number || 0) + 1;

    // Create the line
    const { data: line, error } = await supabase
      .from('construction_report_lines')
      .insert({
        report_id: reportId,
        line_number: nextLineNumber,
        title: title.trim(),
        description: description?.trim() || null
      })
      .select(`
        id, line_number, title, description, created_at, updated_at,
        photos:construction_report_photos(
          id, file_name, file_path, description, annotations, file_size, mime_type,
          uploaded_by_user:user_profiles!construction_report_photos_uploaded_by_fkey(id, first_name, last_name, email),
          created_at
        )
      `)
      .single();

    if (error) {
      console.error('Error creating construction report line:', error);
      return createErrorResponse('Failed to create construction report line', 500, error);
    }

    return createSuccessResponse({ line }, 201);

  } catch (error) {
    console.error('Error in construction report lines POST:', error);
    return createErrorResponse('Internal server error', 500, error);
  }
}

export const GET = withAPI(GETOriginal);
export const POST = withAPI(POSTOriginal);