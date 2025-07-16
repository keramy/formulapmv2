// ============================================================================
// V3 Shop Drawings API - Main Routes
// ============================================================================
// Built with optimization patterns: withAuth, createSuccessResponse, createErrorResponse
// Following V3 schema: shop_drawings, shop_drawing_submissions, shop_drawing_reviews
// ============================================================================

import { NextRequest } from 'next/server'
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'
import { createServerClient } from '@/lib/supabase'
import { z } from 'zod'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createShopDrawingSchema = z.object({
  project_id: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(255),
  discipline: z.string().min(1, 'Discipline is required').max(100),
  file_data: z.object({
    file_name: z.string().min(1, 'File name is required'),
    file_url: z.string().url('Valid file URL is required'),
    file_size: z.number().min(1, 'File size must be greater than 0')
  })
})

// ============================================================================
// GET /api/shop-drawings - List all shop drawings with filtering
// ============================================================================

export const GET = withAuth(async (request: NextRequest, { user, profile }) => {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const projectId = searchParams.get('project_id')
    const discipline = searchParams.get('discipline')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('shop_drawings')
      .select(`
        *,
        current_submission:shop_drawing_submissions!current_submission_id (
          id,
          version_number,
          file_url,
          file_name,
          file_size,
          status,
          submitted_at,
          internal_review_completed_at,
          client_review_completed_at,
          submitted_by:user_profiles!submitted_by (
            id,
            full_name,
            email
          )
        ),
        created_by:user_profiles!created_by (
          id,
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (projectId) {
      query = query.eq('project_id', projectId)
    }
    if (discipline) {
      query = query.eq('discipline', discipline)
    }
    if (status) {
      query = query.eq('current_submission.status', status)
    }

    // Execute query with pagination
    const { data: shopDrawings, error, count } = await query
      .range(offset, offset + limit - 1)
      .limit(limit)

    if (error) {
      console.error('Error fetching shop drawings:', error)
      return createErrorResponse('Failed to fetch shop drawings', 500)
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('shop_drawings')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId || '')

    return createSuccessResponse({
      data: shopDrawings,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Shop drawings GET error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}, {
  permission: 'shop_drawings.read'
})

// ============================================================================
// POST /api/shop-drawings - Create new shop drawing with initial submission
// ============================================================================

export const POST = withAuth(async (request: NextRequest, { user, profile }) => {
  try {
    const supabase = createServerClient()
    const body = await request.json()

    // Validate request body
    const validation = createShopDrawingSchema.safeParse(body)
    if (!validation.success) {
      return createErrorResponse('Invalid request data', 400, {
        details: validation.error.issues
      })
    }

    const { project_id, title, discipline, file_data } = validation.data

    // Verify user has access to the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', project_id)
      .single()

    if (projectError || !project) {
      return createErrorResponse('Project not found or access denied', 404)
    }

    // Start transaction - create shop drawing first
    const { data: shopDrawing, error: shopDrawingError } = await supabase
      .from('shop_drawings')
      .insert({
        project_id,
        title,
        discipline,
        created_by: user.id
      })
      .select()
      .single()

    if (shopDrawingError) {
      console.error('Error creating shop drawing:', shopDrawingError)
      return createErrorResponse('Failed to create shop drawing', 500)
    }

    // Create initial submission
    const { data: submission, error: submissionError } = await supabase
      .from('shop_drawing_submissions')
      .insert({
        shop_drawing_id: shopDrawing.id,
        version_number: 1,
        file_url: file_data.file_url,
        file_name: file_data.file_name,
        file_size: file_data.file_size,
        status: 'pending_internal_review',
        submitted_by: user.id
      })
      .select()
      .single()

    if (submissionError) {
      console.error('Error creating submission:', submissionError)
      return createErrorResponse('Failed to create submission', 500)
    }

    // Get the complete shop drawing with submission data
    const { data: completeShopDrawing, error: fetchError } = await supabase
      .from('shop_drawings')
      .select(`
        *,
        current_submission:shop_drawing_submissions!current_submission_id (
          id,
          version_number,
          file_url,
          file_name,
          file_size,
          status,
          submitted_at,
          submitted_by:user_profiles!submitted_by (
            id,
            full_name,
            email
          )
        ),
        created_by:user_profiles!created_by (
          id,
          full_name,
          email
        )
      `)
      .eq('id', shopDrawing.id)
      .single()

    if (fetchError) {
      console.error('Error fetching complete shop drawing:', fetchError)
      return createErrorResponse('Shop drawing created but failed to fetch details', 500)
    }

    return createSuccessResponse({
      data: completeShopDrawing,
      message: 'Shop drawing created successfully'
    })

  } catch (error) {
    console.error('Shop drawings POST error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}, {
  permission: 'shop_drawings.create'
})