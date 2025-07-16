import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-middleware'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-middleware'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { uploadShopDrawing, transactionalUpload, UPLOAD_CONFIGS } from '@/lib/file-upload'

const submitSchema = z.object({
  comments: z.string().optional(),
  file: z.instanceof(File).optional()
})

export const POST = withAuth(async (request: NextRequest, { user, profile }, { params }) => {
  try {
    const { id } = params
    const formData = await request.formData()
    
    const body = {
      comments: formData.get('comments')?.toString() || undefined,
      file: formData.get('file') as File | undefined
    }
    
    const validatedData = submitSchema.parse(body)

    // Get current drawing
    const { data: drawing, error: drawingError } = await supabase
      .from('shop_drawings')
      .select('*')
      .eq('id', id)
      .single()

    if (drawingError || !drawing) {
      return createErrorResponse('Shop drawing not found', 404)
    }

    // Check if drawing is in draft status
    if (drawing.status !== 'draft') {
      return createErrorResponse('Drawing must be in draft status to submit', 400)
    }

    // Handle file upload and database operations transactionally
    let filePath = drawing.file_path
    let fileType = drawing.file_type
    let fileSize = drawing.file_size
    let submission: any = null

    if (validatedData.file) {
      const file = validatedData.file
      
      // Use transactional upload with automatic rollback on failure
      const transactionResult = await transactionalUpload({
        file,
        uploadConfig: UPLOAD_CONFIGS.SHOP_DRAWINGS,
        databaseOperation: async (uploadResult) => {
          // Update drawing status to pending_internal_review
          const { error: updateError } = await supabase
            .from('shop_drawings')
            .update({
              status: 'pending_internal_review',
              file_path: uploadResult.file_path,
              file_type: file.type,
              file_size: file.size,
              updated_at: new Date().toISOString()
            })
            .eq('id', id)

          if (updateError) {
            throw new Error(`Failed to update drawing status: ${updateError.message}`)
          }

          // Create submission record
          const { data: submissionData, error: submissionError } = await supabase
            .from('shop_drawing_submissions')
            .insert({
              drawing_id: id,
              submitter_id: user.id,
              version: drawing.version + 1,
              status: 'pending',
              comments: validatedData.comments,
              file_path: uploadResult.file_path,
              file_type: file.type,
              file_size: file.size,
              submitted_at: new Date().toISOString()
            })
            .select()
            .single()

          if (submissionError) {
            throw new Error(`Failed to create submission: ${submissionError.message}`)
          }

          // Update drawing with current submission
          const { error: linkError } = await supabase
            .from('shop_drawings')
            .update({
              current_submission_id: submissionData.id,
              version: drawing.version + 1
            })
            .eq('id', id)

          if (linkError) {
            throw new Error(`Failed to link submission to drawing: ${linkError.message}`)
          }

          return submissionData
        },
        rollbackOperation: async (uploadResult) => {
          // Rollback database changes if upload succeeded but database operations failed
          await supabase
            .from('shop_drawings')
            .update({
              status: 'draft', // Reset to original status
              file_path: drawing.file_path, // Reset to original file path
              file_type: drawing.file_type,
              file_size: drawing.file_size,
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
        }
      })

      if (!transactionResult.success) {
        return createErrorResponse(transactionResult.error || 'Failed to upload file and update drawing', 400)
      }

      filePath = transactionResult.uploadResult?.file_path || filePath
      fileType = file.type
      fileSize = file.size
      submission = transactionResult.data
    } else {
      // No file upload, just update drawing status and create submission
      const { error: updateError } = await supabase
        .from('shop_drawings')
        .update({
          status: 'pending_internal_review',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (updateError) {
        return createErrorResponse('Failed to update drawing status', 500)
      }

      // Create submission record
      const { data: submissionData, error: submissionError } = await supabase
        .from('shop_drawing_submissions')
        .insert({
          drawing_id: id,
          submitter_id: user.id,
          version: drawing.version + 1,
          status: 'pending',
          comments: validatedData.comments,
          file_path: filePath,
          file_type: fileType,
          file_size: fileSize,
          submitted_at: new Date().toISOString()
        })
        .select()
        .single()

      if (submissionError) {
        return createErrorResponse('Failed to create submission', 500)
      }

      // Update drawing with current submission
      const { error: linkError } = await supabase
        .from('shop_drawings')
        .update({
          current_submission_id: submissionData.id,
          version: drawing.version + 1
        })
        .eq('id', id)

      if (linkError) {
        console.error('Failed to link submission to drawing:', linkError)
      }

      submission = submissionData
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
    console.error('Shop drawing submission error:', error)
    
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid request data', 400, error.errors)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}, { permission: 'shop_drawings.submit' })