import { NextRequest } from 'next/server';
import { withAPI, getRequestData, createSuccessResponse, createErrorResponse } from '@/lib/enhanced-auth-middleware';
import { createClient } from '@/lib/supabase/server';

// POST /api/construction-reports/[id]/publish - Publish construction report
async function POSTOriginal(request: NextRequest, { user, profile, params }: any) {
  try {
    const reportId = params.id;
    const requestData = await request.json();
    const { visibility = 'internal', generate_pdf = true } = requestData;

    if (!reportId) {
      return createErrorResponse('Report ID is required', 400);
    }

    // Validate visibility
    if (!['internal', 'client'].includes(visibility)) {
      return createErrorResponse('Invalid visibility. Must be internal or client', 400);
    }

    // Get report details and verify it exists and is in draft status
    const supabase = await createClient();
    const { data: report, error: fetchError } = await supabase
      .from('construction_reports')
      .select(`
        id, name, description, status, visibility,
        project:projects(id, name),
        created_by_user:user_profiles!construction_reports_created_by_fkey(id, first_name, last_name, email),
        report_lines:construction_report_lines(
          id, line_number, title, description,
          photos:construction_report_photos(id, file_name, file_path, description, annotations)
        )
      `)
      .eq('id', reportId)
      .order('line_number', { referencedTable: 'construction_report_lines', ascending: true })
      .single();

    if (fetchError || !report) {
      return createErrorResponse('Construction report not found or access denied', 404);
    }

    if (report.status === 'published') {
      return createErrorResponse('Report is already published', 400);
    }

    // Validate report has content
    if (!report.report_lines || report.report_lines.length === 0) {
      return createErrorResponse('Cannot publish empty report. Add at least one line with content.', 400);
    }

    // Check if report has at least one photo
    const hasPhotos = report.report_lines.some(line => 
      line.photos && line.photos.length > 0
    );

    if (!hasPhotos) {
      return createErrorResponse('Cannot publish report without photos. Add at least one photo to any line.', 400);
    }

    // Prepare update data
    const updateData: any = {
      status: 'published',
      visibility,
      published_at: new Date().toISOString()
    };

    // TODO: In a real implementation, you would generate the PDF here
    // For now, we'll just set a placeholder path
    if (generate_pdf) {
      updateData.pdf_path = `/reports/construction-report-${reportId}-${Date.now()}.pdf`;
    }

    // Update the report to published status
    const supabase2 = await createClient();
    const { data: publishedReport, error: updateError } = await supabase
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

    if (updateError) {
      console.error('Error publishing construction report:', updateError);
      return createErrorResponse('Failed to publish construction report', 500, updateError);
    }

    // Log the activity
    const supabase3 = await createClient();
    const { data, error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        entity_type: 'construction_report',
        entity_id: reportId,
        action: 'published',
        details: {
          report_name: report.name,
          visibility,
          lines_count: report.report_lines.length,
          photos_count: report.report_lines.reduce((total, line) => 
            total + (line.photos?.length || 0), 0
          )
        }
      });

    return createSuccessResponse({ 
      report: publishedReport,
      message: `Construction report published successfully as ${visibility}`,
      pdf_generation: generate_pdf ? 'enabled' : 'disabled'
    });

  } catch (error) {
    console.error('Error in construction report publish:', error);
    return createErrorResponse('Internal server error', 500, error);
  }
}

export const POST = withAPI(POSTOriginal);