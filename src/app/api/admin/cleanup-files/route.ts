import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-middleware'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-middleware'
import { FileUploadService } from '@/lib/file-upload'
import { z } from 'zod'

const cleanupSchema = z.object({
  bucket: z.string().optional(),
  older_than_minutes: z.number().min(1).max(1440).optional().default(60), // 1 minute to 24 hours
  dry_run: z.boolean().optional().default(false)
})

export const POST = withAuth(async (request: NextRequest, { user, profile }) => {
  try {
    const body = await request.json()
    const validatedData = cleanupSchema.parse(body)
    
    const fileUploadService = FileUploadService.getInstance()
    const results: Record<string, any> = {}
    
    // Default buckets to clean
    const bucketsToClean = validatedData.bucket 
      ? [validatedData.bucket]
      : ['shop-drawings', 'reports', 'profiles']
    
    for (const bucket of bucketsToClean) {
      try {
        if (validatedData.dry_run) {
          // Only find orphaned files, don't delete
          const orphanedFiles = await fileUploadService.findOrphanedFiles(
            bucket, 
            validatedData.older_than_minutes
          )
          
          results[bucket] = {
            success: true,
            orphaned_files: orphanedFiles,
            total_found: orphanedFiles.length,
            dry_run: true
          }
        } else {
          // Perform actual cleanup
          const cleanupResult = await fileUploadService.cleanupOrphanedFiles(
            bucket,
            validatedData.older_than_minutes
          )
          
          results[bucket] = {
            success: cleanupResult.success,
            cleaned_files: cleanupResult.cleaned_files,
            failed_cleanups: cleanupResult.failed_cleanups,
            total_processed: cleanupResult.total_processed,
            dry_run: false
          }
        }
      } catch (error) {
        results[bucket] = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          dry_run: validatedData.dry_run
        }
      }
    }
    
    return createSuccessResponse({
      cleanup_results: results,
      timestamp: new Date().toISOString(),
      performed_by: profile.email
    })
    
  } catch (error) {
    console.error('File cleanup error:', error)
    
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid request data', 400, error.errors)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}, { permission: 'admin.manage_files' })

export const GET = withAuth(async (request: NextRequest, { user, profile }) => {
  try {
    const { searchParams } = new URL(request.url)
    const bucket = searchParams.get('bucket') || undefined
    const olderThanMinutes = parseInt(searchParams.get('older_than_minutes') || '60')
    
    const fileUploadService = FileUploadService.getInstance()
    const results: Record<string, any> = {}
    
    // Default buckets to check
    const bucketsToCheck = bucket 
      ? [bucket]
      : ['shop-drawings', 'reports', 'profiles']
    
    for (const bucketName of bucketsToCheck) {
      try {
        const orphanedFiles = await fileUploadService.findOrphanedFiles(
          bucketName, 
          olderThanMinutes
        )
        
        results[bucketName] = {
          orphaned_files: orphanedFiles,
          total_found: orphanedFiles.length
        }
      } catch (error) {
        results[bucketName] = {
          error: error instanceof Error ? error.message : 'Unknown error',
          total_found: 0
        }
      }
    }
    
    return createSuccessResponse({
      orphaned_files_report: results,
      timestamp: new Date().toISOString(),
      checked_by: profile.email
    })
    
  } catch (error) {
    console.error('File orphan check error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}, { permission: 'admin.manage_files' })