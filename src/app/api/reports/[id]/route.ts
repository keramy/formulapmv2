// ============================================================================
// V3 Reports API - Individual Report Routes
// ============================================================================
// Built with optimization patterns: withAuth, createSuccessResponse, createErrorResponse
// Following V3 schema: reports with full line and photo data
// ============================================================================

import { NextRequest } from 'next/server'
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'
import { createServerClient } from '@/lib/supabase'
import { FileUploadService } from '@/lib/file-upload'
import { z } from 'zod'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const updateReportSchema = z.object({
  name: z.string().min(1, 'Report name is required').max(200, 'Report name too long').optional(),
  type: z.enum(['daily', 'weekly', 'monthly', 'safety', 'financial', 'progress', 'quality', 'inspection', 'custom']).optional(),
  summary: z.string().max(1000, 'Summary too long').optional(),
  report_period: z.string().max(100, 'Report period too long').optional(),
  status: z.enum(['draft', 'pending_review', 'published']).optional()
})

// ============================================================================
// GET /api/reports/[id] - Get report with all lines and photos
// ============================================================================

export const GET = withAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }, { user, profile }) => {
  try {
    const params = await context.params
    const reportId = params.id

    const supabase = createServerClient()

    // Fetch report with all related data
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select(`
        id,
        name,
        type,
        status,
        generated_by,
        generated_at,
        published_at,
        pdf_url,
        summary,
        report_period,
        created_at,
        updated_at,
        project:projects!project_id (
          id,
          name,
          project_manager_id
        ),
        generated_by_profile:user_profiles!generated_by (
          id,
          full_name,
          email,
          role
        ),
        report_lines!report_lines_report_id_fkey (
          id,
          line_number,
          title,
          description,
          created_at,
          updated_at,
          report_line_photos!report_line_photos_report_line_id_fkey (
            id,
            photo_url,
            caption,
            uploaded_at
          )
        ),
        report_shares!report_shares_report_id_fkey (
          id,
          shared_with_user_id,
          shared_with_client_id,
          shared_at,
          shared_with_user:user_profiles!shared_with_user_id (
            id,
            full_name,
            email
          )
        )
      `)
      .eq('id', reportId)
      .single()

    if (fetchError || !report) {
      return createErrorResponse('Report not found or access denied', 404)
    }

    // Sort report lines by line_number
    if (report.report_lines) {
      report.report_lines.sort((a: any, b: any) => a.line_number - b.line_number)
    }

    return createSuccessResponse({
      data: report
    })

  } catch (error) {
    console.error('Report GET error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}, {
  permission: 'reports.read'
})

// ============================================================================
// PUT /api/reports/[id] - Update report
// ============================================================================

export const PUT = withAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }, { user, profile }) => {
  try {
    const params = await context.params
    const reportId = params.id

    const supabase = createServerClient()
    const body = await request.json()

    // Validate request body
    const validation = updateReportSchema.safeParse(body)
    if (!validation.success) {
      return createErrorResponse('Invalid request data', 400, {
        details: validation.error.issues
      })
    }

    const updateData = validation.data

    // Verify report exists and user has access
    const { data: existingReport, error: fetchError } = await supabase
      .from('reports')
      .select(`
        id,
        status,
        generated_by,
        project:projects!project_id (
          id,
          project_manager_id
        )
      `)
      .eq('id', reportId)
      .single()

    if (fetchError || !existingReport) {
      return createErrorResponse('Report not found or access denied', 404)
    }

    // Check if report is published (prevent editing published reports except by admins)
    if (existingReport.status === 'published' && 
        !['company_owner', 'general_manager', 'admin'].includes(profile.role)) {
      return createErrorResponse('Cannot edit published reports', 403)
    }

    // Update the report
    const { data: updatedReport, error: updateError } = await supabase
      .from('reports')
      .update(updateData)
      .eq('id', reportId)
      .select(`
        id,
        name,
        type,
        status,
        generated_by,
        generated_at,
        published_at,
        pdf_url,
        summary,
        report_period,
        updated_at,
        project:projects!project_id (
          id,
          name
        ),
        generated_by_profile:user_profiles!generated_by (
          id,
          full_name,
          email
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating report:', updateError)
      return createErrorResponse('Failed to update report', 500)
    }

    return createSuccessResponse({
      data: updatedReport,
      message: 'Report updated successfully'
    })

  } catch (error) {
    console.error('Report PUT error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}, {
  permission: 'reports.update'
})

// ============================================================================
// DELETE /api/reports/[id] - Delete report
// ============================================================================

export const DELETE = withAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }, { user, profile }) => {
  try {
    const params = await context.params
    const reportId = params.id

    const supabase = createServerClient()

    // Verify report exists and user has access
    const { data: existingReport, error: fetchError } = await supabase
      .from('reports')
      .select(`
        id,
        name,
        status,
        generated_by,
        pdf_url,
        project:projects!project_id (
          id,
          project_manager_id
        )
      `)
      .eq('id', reportId)
      .single()

    if (fetchError || !existingReport) {
      return createErrorResponse('Report not found or access denied', 404)
    }

    // Check if report is published (prevent deleting published reports except by admins)
    if (existingReport.status === 'published' && 
        !['company_owner', 'general_manager', 'technical_director', 'admin'].includes(profile.role)) {
      return createErrorResponse('Cannot delete published reports', 403)
    }

    // Collect all files to be deleted
    const filesToDelete: string[] = []
    
    // Get all report line photos
    const { data: reportLines, error: linesError } = await supabase
      .from('report_lines')
      .select(`
        id,
        report_line_photos!report_line_photos_report_line_id_fkey (
          photo_url
        )
      `)
      .eq('report_id', reportId)

    if (linesError) {
      console.error('Error fetching report lines for cleanup:', linesError)
    } else if (reportLines) {
      // Extract photo URLs from report lines
      reportLines.forEach((line: any) => {
        if (line.report_line_photos) {
          line.report_line_photos.forEach((photo: any) => {
            if (photo.photo_url) {
              // Extract file path from URL
              const urlParts = photo.photo_url.split('/')
              const fileName = urlParts[urlParts.length - 1]
              filesToDelete.push(fileName)
            }
          })
        }
      })
    }

    // Add PDF file if exists
    if (existingReport.pdf_url) {
      const urlParts = existingReport.pdf_url.split('/')
      const fileName = urlParts[urlParts.length - 1]
      filesToDelete.push(fileName)
    }

    // Delete the report (cascade will handle related data)
    const { error: deleteError } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId)

    if (deleteError) {
      console.error('Error deleting report:', deleteError)
      return createErrorResponse('Failed to delete report', 500)
    }

    // Clean up associated files in storage
    if (filesToDelete.length > 0) {
      const fileUploadService = FileUploadService.getInstance()
      
      // Delete from reports bucket
      const { success: reportFilesDeleted, failed: reportFilesFailed } = await fileUploadService.deleteMultipleFiles(
        'reports',
        filesToDelete
      )
      
      if (reportFilesFailed.length > 0) {
        console.warn('Failed to delete some report files:', reportFilesFailed)
      }
    }

    return createSuccessResponse({
      message: 'Report deleted successfully',
      files_cleaned: filesToDelete.length
    })

  } catch (error) {
    console.error('Report DELETE error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}, {
  permission: 'reports.delete'
})