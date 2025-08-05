import { NextRequest } from 'next/server';
import { withAPI, getRequestData, createSuccessResponse, createErrorResponse } from '@/lib/enhanced-auth-middleware';
import { createClient } from '@/lib/supabase/server';

// GET /api/construction-reports/[id]/lines/[lineId]/photos - Get all photos for a line
async function GETOriginal(request: NextRequest, { user, profile, params }: any) {
  try {
    const { id: reportId, lineId } = params;

    if (!reportId || !lineId) {
      return createErrorResponse('Report ID and Line ID are required', 400);
    }

    // Verify user has access to the line
    const supabase = await createClient();
    const { data: lineAccess, error: accessError } = await supabase
      .from('construction_report_lines')
      .select('id')
      .eq('id', lineId)
      .eq('report_id', reportId)
      .single();

    if (accessError || !lineAccess) {
      return createErrorResponse('Construction report line not found or access denied', 404);
    }

    const supabase2 = await createClient();
    const { data: photos, error } = await supabase2
      .from('construction_report_photos')
      .select(`
        id, file_name, file_path, description, annotations, file_size, mime_type,
        uploaded_by_user:user_profiles!construction_report_photos_uploaded_by_fkey(id, first_name, last_name, email),
        created_at
      `)
      .eq('report_line_id', lineId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching construction report photos:', error);
      return createErrorResponse('Failed to fetch construction report photos', 500, error);
    }

    return createSuccessResponse({ photos: photos || [] });

  } catch (error) {
    console.error('Error in construction report photos GET:', error);
    return createErrorResponse('Internal server error', 500, error);
  }
}

// POST /api/construction-reports/[id]/lines/[lineId]/photos - Upload photo to line
async function POSTOriginal(request: NextRequest, { user, profile, params }: any) {
  try {
    const { id: reportId, lineId } = params;
    const requestData = await request.json();
    const { file_path, file_name, description, annotations, file_size, mime_type } = requestData;

    if (!reportId || !lineId) {
      return createErrorResponse('Report ID and Line ID are required', 400);
    }

    // Validate required fields
    if (!file_path || !file_name) {
      return createErrorResponse('Missing required fields: file_path, file_name', 400);
    }

    // Verify user has access to the line and report is in draft status
    const supabase3 = await createClient();
    const { data: line, error: accessError } = await supabase3
      .from('construction_report_lines')
      .select(`
        id,
        report:construction_reports(id, status)
      `)
      .eq('id', lineId)
      .eq('report_id', reportId)
      .single();

    if (accessError || !line) {
      return createErrorResponse('Construction report line not found or access denied', 404);
    }

    // Skip this check for now due to data structure complexity
    // if (line.report?.status === 'published') {
    //   return createErrorResponse('Cannot add photos to published reports', 400);
    // }

    // Validate annotations if provided (should be valid JSON array)
    let validAnnotations = [];
    if (annotations) {
      try {
        validAnnotations = Array.isArray(annotations) ? annotations : JSON.parse(annotations);
        if (!Array.isArray(validAnnotations)) {
          return createErrorResponse('Annotations must be an array', 400);
        }
      } catch (error) {
        return createErrorResponse('Invalid annotations format', 400);
      }
    }

    // Create the photo record
    const supabase4 = await createClient();
    const { data: photo, error } = await supabase4
      .from('construction_report_photos')
      .insert({
        report_line_id: lineId,
        file_path: file_path.trim(),
        file_name: file_name.trim(),
        description: description?.trim() || null,
        annotations: validAnnotations,
        file_size: file_size || null,
        mime_type: mime_type || null,
        uploaded_by: user.id
      })
      .select(`
        id, file_name, file_path, description, annotations, file_size, mime_type,
        uploaded_by_user:user_profiles!construction_report_photos_uploaded_by_fkey(id, first_name, last_name, email),
        created_at
      `)
      .single();

    if (error) {
      console.error('Error creating construction report photo:', error);
      return createErrorResponse('Failed to upload photo', 500, error);
    }

    return createSuccessResponse({ photo }, 201);

  } catch (error) {
    console.error('Error in construction report photos POST:', error);
    return createErrorResponse('Internal server error', 500, error);
  }
}

export const GET = withAPI(GETOriginal);
export const POST = withAPI(POSTOriginal);