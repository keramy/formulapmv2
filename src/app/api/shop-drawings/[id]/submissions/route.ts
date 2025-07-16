// ============================================================================
// V3 Shop Drawings API - Submission Routes
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

const newSubmissionSchema = z.object({
  file_data: z.object({
    file_name: z.string().min(1, 'File name is required'),
    file_url: z.string().url('Valid file URL is required'),
    file_size: z.number().min(1, 'File size must be greater than 0')
  })
})

// ============================================================================
// POST /api/shop-drawings/[id]/submissions - Create new submission (version)
// ============================================================================

export const POST = withAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }, { user, profile }) => {
  try {
    const params = await context.params
    const shopDrawingId = params.id

    const supabase = createServerClient()
    const body = await request.json()

    // Validate request body
    const validation = newSubmissionSchema.safeParse(body)
    if (!validation.success) {
      return createErrorResponse('Invalid request data', 400, {
        details: validation.error.issues
      })
    }

    const { file_data } = validation.data

    // Verify shop drawing exists and user has access
    const { data: shopDrawing, error: fetchError } = await supabase
      .from('shop_drawings')
      .select('id, project_id, title')
      .eq('id', shopDrawingId)
      .single()

    if (fetchError || !shopDrawing) {
      return createErrorResponse('Shop drawing not found or access denied', 404)
    }

    // Get the highest version number for this shop drawing
    const { data: lastSubmission, error: versionError } = await supabase
      .from('shop_drawing_submissions')
      .select('version_number')
      .eq('shop_drawing_id', shopDrawingId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    const nextVersionNumber = lastSubmission ? lastSubmission.version_number + 1 : 1

    // Create new submission
    const { data: submission, error: submissionError } = await supabase
      .from('shop_drawing_submissions')
      .insert({
        shop_drawing_id: shopDrawingId,
        version_number: nextVersionNumber,
        file_url: file_data.file_url,
        file_name: file_data.file_name,
        file_size: file_data.file_size,
        status: 'pending_internal_review',
        submitted_by: user.id
      })
      .select(`
        *,
        submitted_by:user_profiles!submitted_by (
          id,
          full_name,
          email
        )
      `)
      .single()

    if (submissionError) {
      console.error('Error creating submission:', submissionError)
      return createErrorResponse('Failed to create submission', 500)
    }

    return createSuccessResponse({
      data: submission,
      message: `Version ${nextVersionNumber} submitted successfully`
    })

  } catch (error) {
    console.error('Submission POST error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}, {
  permission: 'shop_drawings.create'
})