// ============================================================================
// V3 Shop Drawings API - Review Routes
// ============================================================================
// Built with optimization patterns: withAuth, createSuccessResponse, createErrorResponse
// Following V3 schema: shop_drawing_reviews workflow
// ============================================================================

import { NextRequest } from 'next/server'
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'
import { createServerClient } from '@/lib/supabase'
import { z } from 'zod'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createReviewSchema = z.object({
  action: z.enum(['approved', 'approved_with_comments', 'rejected', 'commented']),
  comments: z.string().optional(),
  review_type: z.enum(['internal', 'client']).optional() // Will be determined based on user role
})

const readyForClientSchema = z.object({
  comments: z.string().optional()
})

// ============================================================================
// POST /api/shop-drawings/submissions/[submissionId]/reviews - Create review
// ============================================================================

export const POST = withAuth(async (request: NextRequest, context: { params: Promise<{ submissionId: string }> }, { user, profile }) => {
  try {
    const params = await context.params
    const submissionId = params.submissionId

    const supabase = createServerClient()
    const body = await request.json()

    // Validate request body
    const validation = createReviewSchema.safeParse(body)
    if (!validation.success) {
      return createErrorResponse('Invalid request data', 400, {
        details: validation.error.issues
      })
    }

    const { action, comments } = validation.data

    // Verify submission exists and user has access
    const { data: submission, error: fetchError } = await supabase
      .from('shop_drawing_submissions')
      .select(`
        *,
        shop_drawing:shop_drawings!shop_drawing_id (
          id,
          project_id,
          title
        )
      `)
      .eq('id', submissionId)
      .single()

    if (fetchError || !submission) {
      return createErrorResponse('Submission not found or access denied', 404)
    }

    // Determine review type based on user role
    const reviewType = profile.role === 'client' ? 'client' : 'internal'

    // Validate review permissions and status
    if (reviewType === 'internal' && submission.status !== 'pending_internal_review') {
      return createErrorResponse('Internal review not allowed for this submission status', 400)
    }

    if (reviewType === 'client' && submission.status !== 'pending_client_review') {
      return createErrorResponse('Client review not allowed for this submission status', 400)
    }

    // Create review
    const { data: review, error: reviewError } = await supabase
      .from('shop_drawing_reviews')
      .insert({
        submission_id: submissionId,
        reviewer_id: user.id,
        review_type: reviewType,
        action,
        comments
      })
      .select(`
        *,
        reviewer:user_profiles!reviewer_id (
          id,
          full_name,
          email,
          role
        )
      `)
      .single()

    if (reviewError) {
      console.error('Error creating review:', reviewError)
      return createErrorResponse('Failed to create review', 500)
    }

    // Get updated submission with new status
    const { data: updatedSubmission, error: updateFetchError } = await supabase
      .from('shop_drawing_submissions')
      .select(`
        *,
        shop_drawing:shop_drawings!shop_drawing_id (
          id,
          project_id,
          title
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
      `)
      .eq('id', submissionId)
      .single()

    if (updateFetchError) {
      console.error('Error fetching updated submission:', updateFetchError)
      return createErrorResponse('Review created but failed to fetch updated submission', 500)
    }

    return createSuccessResponse({
      data: {
        review,
        submission: updatedSubmission
      },
      message: `Review submitted successfully`
    })

  } catch (error) {
    console.error('Review POST error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}, {
  permission: 'shop_drawings.review'
})