// ============================================================================
// V3 Reports API - Main Routes
// ============================================================================
// Built with optimization patterns: withAuth, createSuccessResponse, createErrorResponse
// Following V3 schema: reports, report_lines, report_line_photos, report_shares
// ============================================================================

import { NextRequest } from 'next/server'
import { withAuth, createSuccessResponse, createErrorResponse, parseQueryParams } from '@/lib/api-middleware'
import { createServerClient } from '@/lib/supabase'
import { z } from 'zod'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createReportSchema = z.object({
  name: z.string().min(1, 'Report name is required').max(200, 'Report name too long'),
  type: z.enum(['daily', 'weekly', 'monthly', 'safety', 'financial', 'progress', 'quality', 'inspection', 'custom']).default('custom'),
  summary: z.string().max(1000, 'Summary too long').optional(),
  report_period: z.string().max(100, 'Report period too long').optional()
})

// ============================================================================
// GET /api/reports - List reports (with project filtering)
// ============================================================================

export const GET = withAuth(async (request: NextRequest, { user, profile }) => {
  try {
    const supabase = createServerClient()
    const { page, limit, search, sort_field, sort_direction, filters } = parseQueryParams(request)
    
    // Build query
    let query = supabase
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

    // Apply project filter if provided
    if (filters.project_id) {
      query = query.eq('project_id', filters.project_id)
    }

    // Apply search if provided
    if (search) {
      // Sanitize search input to prevent SQL injection
      const sanitizedSearch = search.replace(/[%_\\]/g, '\\const sanitizedSearch = search.replace(/[%_\\]/g, '\\$&').substring(0, 100)').substring(0, 100)
      query = query.or(`name.ilike.%${sanitizedSearch}%,summary.ilike.%${sanitizedSearch}%`)
    }

    // Apply status filter if provided
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    // Apply type filter if provided
    if (filters.type) {
      query = query.eq('type', filters.type)
    }

    // Apply sorting
    const sortField = sort_field || 'generated_at'
    const sortDirection = sort_direction || 'desc'
    query = query.order(sortField, { ascending: sortDirection === 'asc' })

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: reports, error: fetchError, count } = await query

    if (fetchError) {
      console.error('Error fetching reports:', fetchError)
      return createErrorResponse('Failed to fetch reports', 500)
    }

    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / limit)

    return createSuccessResponse({
      data: reports || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    })

  } catch (error) {
    console.error('Reports GET error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}, {
  permission: 'reports.read'
})

// ============================================================================
// POST /api/reports - Create new report
// ============================================================================

export const POST = withAuth(async (request: NextRequest, { user, profile }) => {
  try {
    const supabase = createServerClient()
    const body = await request.json()

    // Validate request body
    const validation = createReportSchema.safeParse(body)
    if (!validation.success) {
      return createErrorResponse('Invalid request data', 400, {
        details: validation.error.issues
      })
    }

    const { name, type, summary, report_period } = validation.data

    // Require project_id in the request
    if (!body.project_id) {
      return createErrorResponse('Project ID is required', 400)
    }

    // Verify user has access to the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, project_manager_id')
      .eq('id', body.project_id)
      .single()

    if (projectError || !project) {
      return createErrorResponse('Project not found or access denied', 404)
    }

    // Create the report
    const { data: report, error: createError } = await supabase
      .from('reports')
      .insert({
        project_id: body.project_id,
        name,
        type,
        summary,
        report_period,
        generated_by: user.id,
        status: 'draft'
      })
      .select(`
        id,
        name,
        type,
        status,
        generated_by,
        generated_at,
        summary,
        report_period,
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

    if (createError) {
      console.error('Error creating report:', createError)
      return createErrorResponse('Failed to create report', 500)
    }

    return createSuccessResponse({
      data: report,
      message: 'Report created successfully'
    })

  } catch (error) {
    console.error('Reports POST error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}, {
  permission: 'reports.create'
})