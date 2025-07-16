// ============================================================================
// V3 Shop Drawings API - Ready for Client Route
// ============================================================================
// Built with optimization patterns: withAuth, createSuccessResponse, createErrorResponse
// Following V3 schema: shop_drawing_submissions workflow
// ============================================================================

import { NextRequest } from 'next/server'
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'
import { createServerClient } from '@/lib/supabase'
import { z } from 'zod'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const readyForClientSchema = z.object({
  comments: z.string().optional()
})

// ============================================================================
// POST /api/shop-drawings/submissions/[submissionId]/ready-for-client
// ============================================================================

export const POST = withAuth(async (request: NextRequest, context: { params: Promise<{ submissionId: string }> }, { user, profile }) => {
  try {
    const params = await context.params
    const submissionId = params.submissionId

    const supabase = createServerClient()
    const body = await request.json()

    // Validate request body
    const validation = readyForClientSchema.safeParse(body)
    if (!validation.success) {
      return createErrorResponse('Invalid request data', 400, {
        details: validation.error.issues
      })
    }

    const { comments } = validation.data

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

    // Check if submission is ready for client review
    if (submission.status !== 'ready_for_client_review') {
      return createErrorResponse('Submission must be approved internally before client review', 400)
    }

    // Update submission status to pending client review
    const { data: updatedSubmission, error: updateError } = await supabase
      .from('shop_drawing_submissions')
      .update({
        status: 'pending_client_review'
      })
      .eq('id', submissionId)
      .select(`
        *,
        shop_drawing:shop_drawings!shop_drawing_id (
          id,
          project_id,
          title
        ),
        submitted_by:user_profiles!submitted_by (
          id,
          full_name,
          email
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating submission status:', updateError)
      return createErrorResponse('Failed to update submission status', 500)
    }

    // Create a review record for the internal approval
    const { data: review, error: reviewError } = await supabase
      .from('shop_drawing_reviews')
      .insert({
        submission_id: submissionId,
        reviewer_id: user.id,
        review_type: 'internal',
        action: 'approved',
        comments: comments || 'Approved for client review'
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
      console.error('Error creating review record:', reviewError)
      return createErrorResponse('Status updated but failed to create review record', 500)
    }

    return createSuccessResponse({
      data: {
        submission: updatedSubmission,
        review
      },
      message: 'Submission sent to client for review'
    })

  } catch (error) {
    console.error('Ready for client POST error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}, {
  permission: 'shop_drawings.approve'
})