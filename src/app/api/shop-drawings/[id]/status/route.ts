import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-middleware'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-middleware'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'

const updateStatusSchema = z.object({
  status: z.enum(['pending_internal_review', 'ready_for_client_review', 'client_reviewing', 'approved', 'rejected', 'revision_requested']),
  comments: z.string().optional(),
  reviewer_id: z.string().optional()
})

export const PATCH = withAuth(async (request: NextRequest, { user, profile }, { params }) => {
  try {
    const { id } = params
    const body = await request.json()
    const validatedData = updateStatusSchema.parse(body)

    // Get current drawing
    const { data: drawing, error: drawingError } = await supabase
      .from('shop_drawings')
      .select('*')
      .eq('id', id)
      .single()

    if (drawingError || !drawing) {
      return createErrorResponse('Shop drawing not found', 404)
    }

    // Update drawing status
    const { error: updateError } = await supabase
      .from('shop_drawings')
      .update({
        status: validatedData.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      return createErrorResponse('Failed to update drawing status', 500)
    }

    // If there's a current submission, update it as well
    if (drawing.current_submission_id) {
      const submissionStatus = getSubmissionStatus(validatedData.status)
      
      const { error: submissionError } = await supabase
        .from('shop_drawing_submissions')
        .update({
          status: submissionStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', drawing.current_submission_id)

      if (submissionError) {
        console.error('Failed to update submission status:', submissionError)
      }

      // Add review record if comments provided
      if (validatedData.comments) {
        const { error: reviewError } = await supabase
          .from('shop_drawing_reviews')
          .insert({
            submission_id: drawing.current_submission_id,
            reviewer_id: validatedData.reviewer_id || user.id,
            review_type: validatedData.status.includes('client') ? 'client' : 'internal',
            status: getReviewStatus(validatedData.status),
            comments: validatedData.comments,
            reviewed_at: new Date().toISOString()
          })

        if (reviewError) {
          console.error('Failed to create review:', reviewError)
        }
      }
    }

    // Get updated drawing with relations
    const { data: updatedDrawing, error: fetchError } = await supabase
      .from('shop_drawings')
      .select(`
        *,
        project:projects(id, name),
        created_by_user:user_profiles!created_by(id, name, email),
        current_submission:shop_drawing_submissions(
          *,
          reviews:shop_drawing_reviews(
            *,
            reviewer:user_profiles!reviewer_id(id, name, email)
          )
        )
      `)
      .eq('id', id)
      .single()

    if (fetchError) {
      return createErrorResponse('Failed to fetch updated drawing', 500)
    }

    return createSuccessResponse(updatedDrawing)
  } catch (error) {
    console.error('Shop drawing status update error:', error)
    
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid request data', 400, error.errors)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}, { permission: 'shop_drawings.manage_workflow' })

function getSubmissionStatus(drawingStatus: string): string {
  switch (drawingStatus) {
    case 'pending_internal_review':
      return 'pending'
    case 'ready_for_client_review':
      return 'internal_approved'
    case 'client_reviewing':
      return 'ready_for_client'
    case 'approved':
      return 'client_approved'
    case 'rejected':
      return 'rejected'
    case 'revision_requested':
      return 'revision_requested'
    default:
      return 'pending'
  }
}

function getReviewStatus(drawingStatus: string): string {
  switch (drawingStatus) {
    case 'approved':
      return 'approved'
    case 'rejected':
      return 'rejected'
    case 'revision_requested':
      return 'revision_requested'
    default:
      return 'approved'
  }
}