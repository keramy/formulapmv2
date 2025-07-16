// ============================================================================
// V3 Shop Drawings API - Individual Drawing Routes
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

const updateShopDrawingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255).optional(),
  discipline: z.string().min(1, 'Discipline is required').max(100).optional()
})

const newSubmissionSchema = z.object({
  file_data: z.object({
    file_name: z.string().min(1, 'File name is required'),
    file_url: z.string().url('Valid file URL is required'),
    file_size: z.number().min(1, 'File size must be greater than 0')
  })
})

// ============================================================================
// GET /api/shop-drawings/[id] - Get individual shop drawing with submissions
// ============================================================================

export const GET = withAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }, { user, profile }) => {
  try {
    const params = await context.params
    const shopDrawingId = params.id

    const supabase = createServerClient()

    // Get shop drawing with all submissions and reviews
    const { data: shopDrawing, error } = await supabase
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
        submissions:shop_drawing_submissions (
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
          ),
          reviews:shop_drawing_reviews (
            id,
            reviewer_id,
            review_type,
            action,
            comments,
            reviewed_at,
            reviewer:user_profiles!reviewer_id (
              id,
              full_name,
              email,
              role
            )
          )
        ),
        created_by:user_profiles!created_by (
          id,
          full_name,
          email
        )
      `)
      .eq('id', shopDrawingId)
      .single()

    if (error) {
      console.error('Error fetching shop drawing:', error)
      return createErrorResponse('Shop drawing not found', 404)
    }

    return createSuccessResponse({
      data: shopDrawing
    })

  } catch (error) {
    console.error('Shop drawing GET error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}, {
  permission: 'shop_drawings.read'
})

// ============================================================================
// PUT /api/shop-drawings/[id] - Update shop drawing details
// ============================================================================

export const PUT = withAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }, { user, profile }) => {
  try {
    const params = await context.params
    const shopDrawingId = params.id

    const supabase = createServerClient()
    const body = await request.json()

    // Validate request body
    const validation = updateShopDrawingSchema.safeParse(body)
    if (!validation.success) {
      return createErrorResponse('Invalid request data', 400, {
        details: validation.error.issues
      })
    }

    const updateData = validation.data

    // Check if shop drawing exists and user has access
    const { data: existingDrawing, error: fetchError } = await supabase
      .from('shop_drawings')
      .select('id, project_id')
      .eq('id', shopDrawingId)
      .single()

    if (fetchError || !existingDrawing) {
      return createErrorResponse('Shop drawing not found or access denied', 404)
    }

    // Update shop drawing
    const { data: updatedDrawing, error: updateError } = await supabase
      .from('shop_drawings')
      .update(updateData)
      .eq('id', shopDrawingId)
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
      .single()

    if (updateError) {
      console.error('Error updating shop drawing:', updateError)
      return createErrorResponse('Failed to update shop drawing', 500)
    }

    return createSuccessResponse({
      data: updatedDrawing,
      message: 'Shop drawing updated successfully'
    })

  } catch (error) {
    console.error('Shop drawing PUT error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}, {
  permission: 'shop_drawings.update'
})

// ============================================================================
// DELETE /api/shop-drawings/[id] - Delete shop drawing
// ============================================================================

export const DELETE = withAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }, { user, profile }) => {
  try {
    const params = await context.params
    const shopDrawingId = params.id

    const supabase = createServerClient()

    // Check if shop drawing exists and user has access
    const { data: existingDrawing, error: fetchError } = await supabase
      .from('shop_drawings')
      .select('id, project_id, title')
      .eq('id', shopDrawingId)
      .single()

    if (fetchError || !existingDrawing) {
      return createErrorResponse('Shop drawing not found or access denied', 404)
    }

    // Delete shop drawing (CASCADE will handle submissions and reviews)
    const { error: deleteError } = await supabase
      .from('shop_drawings')
      .delete()
      .eq('id', shopDrawingId)

    if (deleteError) {
      console.error('Error deleting shop drawing:', deleteError)
      return createErrorResponse('Failed to delete shop drawing', 500)
    }

    return createSuccessResponse({
      message: `Shop drawing "${existingDrawing.title}" deleted successfully`
    })

  } catch (error) {
    console.error('Shop drawing DELETE error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}, {
  permission: 'shop_drawings.delete'
})