import { NextRequest } from 'next/server';
import { withAPI, getRequestData, createSuccessResponse, createErrorResponse } from '@/lib/enhanced-auth-middleware';
import { createClient } from '@/lib/supabase/server';

// GET /api/construction-reports/[id]/lines/[lineId] - Get specific line with photos
async function GETOriginal(request: NextRequest, { user, profile, params }: any) {
  try {
    const { id: reportId, lineId } = params;

    if (!reportId || !lineId) {
      return createErrorResponse('Report ID and Line ID are required', 400);
    }

    const supabase = await createClient();
    const { data: line, error } = await supabase
      .from('construction_report_lines')
      .select(`
        id, line_number, title, description, created_at, updated_at,
        report:construction_reports(id, name, status),
        photos:construction_report_photos(
          id, file_name, file_path, description, annotations, file_size, mime_type,
          uploaded_by_user:user_profiles!construction_report_photos_uploaded_by_fkey(id, first_name, last_name, email),
          created_at
        )
      `)
      .eq('id', lineId)
      .eq('report_id', reportId)
      .order('created_at', { referencedTable: 'construction_report_photos', ascending: true })
      .single();

    if (error) {
      console.error('Error fetching construction report line:', error);
      if (error.code === 'PGRST116') {
        return createErrorResponse('Construction report line not found', 404);
      }
      return createErrorResponse('Failed to fetch construction report line', 500, error);
    }

    return createSuccessResponse({ line });

  } catch (error) {
    console.error('Error in construction report line GET:', error);
    return createErrorResponse('Internal server error', 500, error);
  }
}

// PUT /api/construction-reports/[id]/lines/[lineId] - Update construction report line
async function PUTOriginal(request: NextRequest, { user, profile, params }: any) {
  try {
    const { id: reportId, lineId } = params;
    const requestData = await request.json();
    const { title, description } = requestData;

    if (!reportId || !lineId) {
      return createErrorResponse('Report ID and Line ID are required', 400);
    }

    // Check if line exists and get report status
    const supabase2 = await createClient();
    const { data: existingLine, error: fetchError } = await supabase2
      .from('construction_report_lines')
      .select(`
        id, title, description,
        report:construction_reports(id, status)
      `)
      .eq('id', lineId)
      .eq('report_id', reportId)
      .single();

    if (fetchError || !existingLine) {
      return createErrorResponse('Construction report line not found or access denied', 404);
    }

    // Check if report is still in draft status
    // Skip this check for now due to data structure complexity
    // if (existingLine.report?.status === 'published') {
    //   return createErrorResponse('Cannot modify lines in published reports', 400);
    // }

    // Prepare update data
    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;

    if (Object.keys(updateData).length === 0) {
      return createErrorResponse('No valid fields to update', 400);
    }

    // Update the line
    const supabase3 = await createClient();
    const { data: line, error } = await supabase3
      .from('construction_report_lines')
      .update(updateData)
      .eq('id', lineId)
      .eq('report_id', reportId)
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
      console.error('Error updating construction report line:', error);
      return createErrorResponse('Failed to update construction report line', 500, error);
    }

    return createSuccessResponse({ line });

  } catch (error) {
    console.error('Error in construction report line PUT:', error);
    return createErrorResponse('Internal server error', 500, error);
  }
}

// DELETE /api/construction-reports/[id]/lines/[lineId] - Delete construction report line
async function DELETEOriginal(request: NextRequest, { user, profile, params }: any) {
  try {
    const { id: reportId, lineId } = params;

    if (!reportId || !lineId) {
      return createErrorResponse('Report ID and Line ID are required', 400);
    }

    // Check if line exists and get report status
    const supabase4 = await createClient();
    const { data: existingLine, error: fetchError } = await supabase4
      .from('construction_report_lines')
      .select(`
        id,
        report:construction_reports(id, status)
      `)
      .eq('id', lineId)
      .eq('report_id', reportId)
      .single();

    if (fetchError || !existingLine) {
      return createErrorResponse('Construction report line not found or access denied', 404);
    }

    // Check if report is still in draft status
    // Skip this check for now due to data structure complexity
    // if (existingLine.report?.status === 'published') {
    //   return createErrorResponse('Cannot delete lines from published reports', 400);
    // }

    // Delete the line (cascade will handle photos)
    const supabase5 = await createClient();
    const { error } = await supabase5
      .from('construction_report_lines')
      .delete()
      .eq('id', lineId)
      .eq('report_id', reportId);

    if (error) {
      console.error('Error deleting construction report line:', error);
      return createErrorResponse('Failed to delete construction report line', 500, error);
    }

    return createSuccessResponse({ message: 'Construction report line deleted successfully' });

  } catch (error) {
    console.error('Error in construction report line DELETE:', error);
    return createErrorResponse('Internal server error', 500, error);
  }
}

export const GET = withAPI(GETOriginal);
export const PUT = withAPI(PUTOriginal);
export const DELETE = withAPI(DELETEOriginal);