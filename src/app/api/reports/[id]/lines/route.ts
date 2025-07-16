// ============================================================================
// V3 Reports API - Report Lines Routes
// ============================================================================
// Built with optimization patterns: withAuth, createSuccessResponse, createErrorResponse
// Following V3 schema: report_lines with photo support
// ============================================================================

import { NextRequest } from 'next/server'
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'
import { createServerClient } from '@/lib/supabase'
import { z } from 'zod'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createReportLineSchema = z.object({
  title: z.string().min(1, 'Line title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Description is required').max(5000, 'Description too long'),
  line_number: z.number().int().min(1, 'Line number must be positive').optional()
})

// ============================================================================
// POST /api/reports/[id]/lines - Add new line to report
// ============================================================================

export const POST = withAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }, { user, profile }) => {
  try {
    const params = await context.params
    const reportId = params.id

    const supabase = createServerClient()
    const body = await request.json()

    // Validate request body
    const validation = createReportLineSchema.safeParse(body)
    if (!validation.success) {
      return createErrorResponse('Invalid request data', 400, {
        details: validation.error.issues
      })
    }

    const { title, description, line_number } = validation.data

    // Verify report exists and user has access
    const { data: report, error: reportError } = await supabase
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

    if (reportError || !report) {
      return createErrorResponse('Report not found or access denied', 404)
    }

    // Check if report is published (prevent editing published reports)
    if (report.status === 'published') {
      return createErrorResponse('Cannot edit published reports', 403)
    }

    // Auto-generate line number if not provided
    let finalLineNumber = line_number
    if (!finalLineNumber) {
      const { data: maxLineData } = await supabase
        .from('report_lines')
        .select('line_number')
        .eq('report_id', reportId)
        .order('line_number', { ascending: false })
        .limit(1)
        .single()

      finalLineNumber = maxLineData ? maxLineData.line_number + 1 : 1
    }

    // Create the report line
    const { data: reportLine, error: createError } = await supabase
      .from('report_lines')
      .insert({
        report_id: reportId,
        title,
        description,
        line_number: finalLineNumber
      })
      .select(`
        id,
        report_id,
        line_number,
        title,
        description,
        created_at,
        updated_at
      `)
      .single()

    if (createError) {
      console.error('Error creating report line:', createError)
      return createErrorResponse('Failed to create report line', 500)
    }

    return createSuccessResponse({
      data: reportLine,
      message: 'Report line created successfully'
    })

  } catch (error) {
    console.error('Report line POST error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}, {
  permission: 'reports.update'
})

// ============================================================================
// GET /api/reports/[id]/lines - Get all lines for a report
// ============================================================================

export const GET = withAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }, { user, profile }) => {
  try {
    const params = await context.params
    const reportId = params.id

    const supabase = createServerClient()

    // Verify report exists and user has access
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('id')
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      return createErrorResponse('Report not found or access denied', 404)
    }

    // Fetch all report lines with photos
    const { data: reportLines, error: fetchError } = await supabase
      .from('report_lines')
      .select(`
        id,
        report_id,
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
      `)
      .eq('report_id', reportId)
      .order('line_number', { ascending: true })

    if (fetchError) {
      console.error('Error fetching report lines:', fetchError)
      return createErrorResponse('Failed to fetch report lines', 500)
    }

    return createSuccessResponse({
      data: reportLines || []
    })

  } catch (error) {
    console.error('Report lines GET error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}, {
  permission: 'reports.read'
})