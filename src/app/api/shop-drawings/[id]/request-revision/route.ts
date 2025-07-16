import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-middleware'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-middleware'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'

const requestRevisionSchema = z.object({
  comments: z.string().min(1, 'Comments are required for revision request'),
  review_type: z.enum(['internal', 'client']).default('internal')
})

export const POST = withAuth(async (request: NextRequest, { user, profile }, { params }) => {
  try {
    const { id } = params
    const body = await request.json()
    const validatedData = requestRevisionSchema.parse(body)

    // Get current drawing with submission
    const { data: drawing, error: drawingError } = await supabase
      .from('shop_drawings')
      .select(`
        *,
        current_submission:shop_drawing_submissions(*)
      `)
      .eq('id', id)
      .single()

    if (drawingError || !drawing) {
      return createErrorResponse('Shop drawing not found', 404)
    }

    if (!drawing.current_submission) {
      return createErrorResponse('No active submission found', 400)
    }

    // Validate current status allows revision request
    const allowedStatuses = ['pending_internal_review', 'client_reviewing']
    if (!allowedStatuses.includes(drawing.status)) {
      return createErrorResponse('Cannot request revision in current status', 400)
    }

    // Update drawing status to revision_requested
    const { error: updateError } = await supabase
      .from('shop_drawings')
      .update({
        status: 'revision_requested',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      return createErrorResponse('Failed to update drawing status', 500)
    }

    // Update submission status
    const { error: submissionError } = await supabase
      .from('shop_drawing_submissions')
      .update({
        status: 'revision_requested',
        updated_at: new Date().toISOString()
      })
      .eq('id', drawing.current_submission.id)

    if (submissionError) {
      console.error('Failed to update submission status:', submissionError)
    }

    // Create review record
    const { error: reviewError } = await supabase
      .from('shop_drawing_reviews')
      .insert({
        submission_id: drawing.current_submission.id,
        reviewer_id: user.id,
        review_type: validatedData.review_type,
        status: 'revision_requested',
        comments: validatedData.comments,
        reviewed_at: new Date().toISOString()
      })

    if (reviewError) {
      console.error('Failed to create review:', reviewError)
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
          submitter:user_profiles!submitter_id(id, name, email),
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
    console.error('Shop drawing revision request error:', error)
    
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid request data', 400, error.errors)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}, { permission: 'shop_drawings.request_revision' })