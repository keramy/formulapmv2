/**
 * File Upload Bulk Operations Tests
 * 
 * Tests bulk upload operations with transaction validation,
 * parallel processing, and error handling scenarios.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { FileUploadService, bulkUploadWithTransaction } from '@/lib/file-upload'
import { 
  setupMockStorage, 
  createMockFile, 
  createMockPdfFile,
  createMockImageFile,
  createMockDwgFile,
  createLargeFile,
  createInvalidTypeFile,
  expectFileUploaded,
  expectFileDeleted,
  expectBucketEmpty,
  expectBucketFileCount,
  expectTransactionCommitted,
  expectTransactionRolledBack,
  expectUploadCompleted,
  expectUploadFailed,
  ProgressTracker,
  setupUploadRetryScenario,
  setupIntermittentFailureScenario,
  setupNetworkDelayScenario,
  setupStorageFullScenario,
  MockStorageState
} from '@/utils/mock-storage'

// Mock the supabase module
vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: null, // Will be set by setupMockStorage
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })
    })
  }
}))

describe('File Upload Bulk Operations Tests', () => {
  let fileUploadService: FileUploadService
  let mockState: MockStorageState
  let cleanup: () => void

  beforeEach(() => {
    // Reset singleton instance
    ;(FileUploadService as any).instance = null
    
    // Setup mock storage
    const mockSetup = setupMockStorage()
    mockState = mockSetup.mockState
    cleanup = mockSetup.cleanup
    
    // Mock the supabase.storage with our mock client
    const { supabase } = require('@/lib/supabase')
    supabase.storage = mockSetup.mockStorage
    
    fileUploadService = FileUploadService.getInstance()
  })

  afterEach(() => {
    cleanup()
  })

  // ============================================================================
  // BULK UPLOAD BASIC FUNCTIONALITY
  // ============================================================================

  describe('Bulk Upload Basic Functionality', () => {
    it('should upload multiple files sequentially', async () => {
      const files = [
        createMockFile('file1.txt', 'text/plain', 1024),
        createMockFile('file2.txt', 'text/plain', 1024),
        createMockFile('file3.txt', 'text/plain', 1024)
      ]
      const progressTracker = new ProgressTracker()
      
      const result = await bulkUploadWithTransaction(
        files,
        {
          bucket: 'test-bucket',
          allowedTypes: ['text/plain']
        },
        async (uploadResults) => {
          // Simple database operation that processes all uploads
          return {
            processed: uploadResults.length,
            files: uploadResults.map(upload => upload.file_path),
            timestamp: new Date().toISOString()
          }
        },
        progressTracker.getProgressCallback()
      )

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data.processed).toBe(3)
      expect(result.data.files).toHaveLength(3)
      expect(result.transaction_id).toBeDefined()

      // Verify all files were uploaded
      expectBucketFileCount(mockState, 'test-bucket', 3)
      
      // Verify progress tracking
      const progressUpdates = progressTracker.getProgressUpdates()
      expect(progressUpdates).toContain(100)
      progressTracker.expectProgressIncreasing()
    })

    it('should handle empty file array', async () => {
      const result = await bulkUploadWithTransaction(
        [],
        {
          bucket: 'test-bucket',
          allowedTypes: ['text/plain']
        },
        async (uploadResults) => {
          return { processed: 0, files: [] }
        }
      )

      expect(result.success).toBe(true)
      expect(result.data.processed).toBe(0)
      expect(result.data.files).toHaveLength(0)
      expectBucketEmpty(mockState, 'test-bucket')
    })

    it('should handle single file in bulk operation', async () => {
      const files = [createMockFile('single.txt', 'text/plain', 1024)]
      
      const result = await bulkUploadWithTransaction(
        files,
        {
          bucket: 'test-bucket',
          allowedTypes: ['text/plain']
        },
        async (uploadResults) => {
          return { processed: 1, file: uploadResults[0].file_path }
        }
      )

      expect(result.success).toBe(true)
      expect(result.data.processed).toBe(1)
      expectBucketFileCount(mockState, 'test-bucket', 1)
    })

    it('should upload files to different folders', async () => {
      const files = [
        createMockFile('file1.txt', 'text/plain', 1024),
        createMockFile('file2.txt', 'text/plain', 1024)
      ]
      
      const result = await bulkUploadWithTransaction(
        files,
        {
          bucket: 'test-bucket',
          folder: 'bulk-uploads',
          allowedTypes: ['text/plain']
        },
        async (uploadResults) => {
          return { processed: uploadResults.length }
        }
      )

      expect(result.success).toBe(true)
      
      // Verify files were uploaded to correct folder
      const uploadedFiles = mockState.getAllFiles('test-bucket')
      expect(uploadedFiles.every(file => file.name.startsWith('bulk-uploads/'))).toBe(true)
    })

    it('should handle mixed file types in bulk upload', async () => {
      const files = [
        createMockPdfFile('document.pdf', 5120),
        createMockImageFile('image.jpg', 2048),
        createMockDwgFile('drawing.dwg', 10240)
      ]
      
      const result = await bulkUploadWithTransaction(
        files,
        {
          bucket: 'test-bucket',
          allowedTypes: ['application/pdf', 'image/jpeg', 'application/vnd.dwg']
        },
        async (uploadResults) => {
          return {
            processed: uploadResults.length,
            types: uploadResults.map(upload => upload.file_path?.split('.').pop())
          }
        }
      )

      expect(result.success).toBe(true)
      expect(result.data.processed).toBe(3)
      expect(result.data.types).toContain('pdf')
      expect(result.data.types).toContain('jpg')
      expect(result.data.types).toContain('dwg')
      expectBucketFileCount(mockState, 'test-bucket', 3)
    })
  })

  // ============================================================================
  // BULK UPLOAD TRANSACTION MANAGEMENT
  // ============================================================================

  describe('Bulk Upload Transaction Management', () => {
    it('should commit all transactions on successful database operation', async () => {
      const files = [
        createMockFile('file1.txt', 'text/plain', 1024),
        createMockFile('file2.txt', 'text/plain', 1024)
      ]
      
      const result = await bulkUploadWithTransaction(
        files,
        {
          bucket: 'test-bucket',
          allowedTypes: ['text/plain']
        },
        async (uploadResults) => {
          // Simulate successful database operation
          return {
            processed: uploadResults.length,
            records: uploadResults.map((upload, index) => ({
              id: `record-${index}`,
              file_path: upload.file_path
            }))
          }
        }
      )

      expect(result.success).toBe(true)
      expect(result.data.processed).toBe(2)
      expect(result.data.records).toHaveLength(2)
      expectBucketFileCount(mockState, 'test-bucket', 2)
    })

    it('should rollback all transactions on database operation failure', async () => {
      const files = [
        createMockFile('file1.txt', 'text/plain', 1024),
        createMockFile('file2.txt', 'text/plain', 1024),
        createMockFile('file3.txt', 'text/plain', 1024)
      ]
      
      const result = await bulkUploadWithTransaction(
        files,
        {
          bucket: 'test-bucket',
          allowedTypes: ['text/plain']
        },
        async (uploadResults) => {
          // Simulate database operation failure
          throw new Error('Bulk database operation failed')
        }
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Bulk database operation failed')
      
      // Verify all files were rolled back
      expectBucketEmpty(mockState, 'test-bucket')
    })

    it('should handle partial upload failures in bulk operation', async () => {
      const files = [
        createMockFile('file1.txt', 'text/plain', 1024),
        createMockFile('file2.txt', 'text/plain', 1024),
        createMockFile('file3.txt', 'text/plain', 1024)
      ]
      
      // Mock upload failure for second file
      let uploadCount = 0
      const originalUpload = mockState.upload.bind(mockState)
      mockState.upload = vi.fn().mockImplementation(async (bucket: string, path: string, file: File) => {
        uploadCount++
        if (uploadCount === 2) {
          return {
            data: null,
            error: { message: 'Second file upload failed' }
          }
        }
        return await originalUpload(bucket, path, file)
      })
      
      const result = await bulkUploadWithTransaction(
        files,
        {
          bucket: 'test-bucket',
          allowedTypes: ['text/plain']
        },
        async (uploadResults) => {
          // This should not be called due to upload failure
          throw new Error('Database operation should not be called')
        }
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Second file upload failed')
      
      // Verify no files remain (successful uploads are rolled back)
      expectBucketEmpty(mockState, 'test-bucket')
    })

    it('should handle transaction rollback with cleanup', async () => {
      const files = [
        createMockFile('file1.txt', 'text/plain', 1024),
        createMockFile('file2.txt', 'text/plain', 1024)
      ]
      
      // First ensure files upload successfully
      const uploadPromises = files.map(file => 
        fileUploadService.uploadFile(file, {
          bucket: 'test-bucket',
          allowedTypes: ['text/plain']
        })
      )
      
      const uploadResults = await Promise.all(uploadPromises)
      expect(uploadResults.every(r => r.success)).toBe(true)
      expectBucketFileCount(mockState, 'test-bucket', 2)
      
      // Now test bulk rollback
      const result = await bulkUploadWithTransaction(
        files,
        {
          bucket: 'test-bucket',
          allowedTypes: ['text/plain']
        },
        async (uploadResults) => {
          throw new Error('Forced rollback test')
        }
      )

      expect(result.success).toBe(false)
      
      // Original files should remain, but bulk upload files should be cleaned up
      expectBucketFileCount(mockState, 'test-bucket', 2)
    })
  })

  // ============================================================================
  // BULK UPLOAD ERROR HANDLING
  // ============================================================================

  describe('Bulk Upload Error Handling', () => {
    it('should handle file size validation errors', async () => {
      const files = [
        createMockFile('small.txt', 'text/plain', 1024),
        createLargeFile('large.pdf', 60), // 60MB - too large
        createMockFile('normal.txt', 'text/plain', 1024)
      ]
      
      const result = await bulkUploadWithTransaction(
        files,
        {
          bucket: 'test-bucket',
          maxSize: 50 * 1024 * 1024, // 50MB limit
          allowedTypes: ['text/plain', 'application/pdf']
        },
        async (uploadResults) => {
          return { processed: uploadResults.length }
        }
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('File size exceeds maximum limit')
      expectBucketEmpty(mockState, 'test-bucket')
    })

    it('should handle file type validation errors', async () => {
      const files = [
        createMockFile('valid.txt', 'text/plain', 1024),
        createInvalidTypeFile('invalid.exe', 1024),
        createMockFile('also-valid.txt', 'text/plain', 1024)
      ]
      
      const result = await bulkUploadWithTransaction(
        files,
        {
          bucket: 'test-bucket',
          allowedTypes: ['text/plain']
        },
        async (uploadResults) => {
          return { processed: uploadResults.length }
        }
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('File type application/x-executable is not allowed')
      expectBucketEmpty(mockState, 'test-bucket')
    })

    it('should handle storage quota exceeded scenarios', async () => {
      setupStorageFullScenario(mockState, 2) // Max 2 files
      
      const files = [
        createMockFile('file1.txt', 'text/plain', 1024),
        createMockFile('file2.txt', 'text/plain', 1024),
        createMockFile('file3.txt', 'text/plain', 1024)
      ]
      
      const result = await bulkUploadWithTransaction(
        files,
        {
          bucket: 'test-bucket',
          allowedTypes: ['text/plain']
        },
        async (uploadResults) => {
          return { processed: uploadResults.length }
        }
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Storage quota exceeded')
      expectBucketEmpty(mockState, 'test-bucket')
    })

    it('should handle network failure scenarios', async () => {
      setupNetworkDelayScenario(mockState, 2000) // 2 second delay
      const files = [
        createMockFile('file1.txt', 'text/plain', 1024),
        createMockFile('file2.txt', 'text/plain', 1024)
      ]
      
      const startTime = Date.now()
      const result = await bulkUploadWithTransaction(
        files,
        {
          bucket: 'test-bucket',
          allowedTypes: ['text/plain']
        },
        async (uploadResults) => {
          return { processed: uploadResults.length }
        }
      )
      const endTime = Date.now()

      expect(result.success).toBe(true)
      expect(endTime - startTime).toBeGreaterThan(4000) // Should take at least 4 seconds (2 files * 2 seconds)
      expectBucketFileCount(mockState, 'test-bucket', 2)
    })
  })

  // ============================================================================
  // BULK UPLOAD PROGRESS TRACKING
  // ============================================================================

  describe('Bulk Upload Progress Tracking', () => {
    it('should track progress during bulk upload', async () => {
      const files = [
        createMockFile('file1.txt', 'text/plain', 1024),
        createMockFile('file2.txt', 'text/plain', 1024),
        createMockFile('file3.txt', 'text/plain', 1024)
      ]
      const progressTracker = new ProgressTracker()
      
      const result = await bulkUploadWithTransaction(
        files,
        {
          bucket: 'test-bucket',
          allowedTypes: ['text/plain']
        },
        async (uploadResults) => {
          return { processed: uploadResults.length }
        },
        progressTracker.getProgressCallback()
      )

      expect(result.success).toBe(true)
      
      const progressUpdates = progressTracker.getProgressUpdates()
      expect(progressUpdates.length).toBeGreaterThan(0)
      
      // Should have progress updates for file uploads (up to 60%), database operation (70%), and completion (100%)
      expect(progressUpdates).toContain(70) // Database operation
      expect(progressUpdates).toContain(90) // Pre-completion
      expect(progressUpdates).toContain(100) // Final completion
      
      progressTracker.expectProgressIncreasing()
    })

    it('should handle progress tracking with slow uploads', async () => {
      setupNetworkDelayScenario(mockState, 1000) // 1 second delay per file
      
      const files = [
        createMockFile('file1.txt', 'text/plain', 1024),
        createMockFile('file2.txt', 'text/plain', 1024)
      ]
      const progressTracker = new ProgressTracker()
      
      const result = await bulkUploadWithTransaction(
        files,
        {
          bucket: 'test-bucket',
          allowedTypes: ['text/plain']
        },
        async (uploadResults) => {
          return { processed: uploadResults.length }
        },
        progressTracker.getProgressCallback()
      )

      expect(result.success).toBe(true)
      
      const progressUpdates = progressTracker.getProgressUpdates()
      expect(progressUpdates.length).toBeGreaterThan(2)
      
      // Should have incremental progress updates during upload phase
      const uploadProgress = progressUpdates.filter(p => p <= 60)
      expect(uploadProgress.length).toBeGreaterThan(0)
      
      progressTracker.expectProgressIncreasing()
    })

    it('should not update progress after failure', async () => {
      const files = [
        createMockFile('file1.txt', 'text/plain', 1024),
        createMockFile('file2.txt', 'text/plain', 1024)
      ]
      const progressTracker = new ProgressTracker()
      
      // Force upload failure
      mockState.setUploadFailure(true)
      
      const result = await bulkUploadWithTransaction(
        files,
        {
          bucket: 'test-bucket',
          allowedTypes: ['text/plain']
        },
        async (uploadResults) => {
          return { processed: uploadResults.length }
        },
        progressTracker.getProgressCallback()
      )

      expect(result.success).toBe(false)
      
      const progressUpdates = progressTracker.getProgressUpdates()
      
      // Should not reach 100% progress on failure
      expect(progressUpdates).not.toContain(100)
      
      // Should have some initial progress
      expect(progressUpdates.length).toBeGreaterThan(0)
    })
  })

  // ============================================================================
  // BULK UPLOAD PERFORMANCE TESTS
  // ============================================================================

  describe('Bulk Upload Performance', () => {
    it('should handle large number of files efficiently', async () => {
      const files = Array.from({ length: 50 }, (_, i) => 
        createMockFile(`file-${i}.txt`, 'text/plain', 1024)
      )
      
      const startTime = Date.now()
      const result = await bulkUploadWithTransaction(
        files,
        {
          bucket: 'test-bucket',
          allowedTypes: ['text/plain']
        },
        async (uploadResults) => {
          return { processed: uploadResults.length }
        }
      )
      const endTime = Date.now()

      expect(result.success).toBe(true)
      expect(result.data.processed).toBe(50)
      expectBucketFileCount(mockState, 'test-bucket', 50)
      
      // Should complete within reasonable time (less than 5 seconds for mock)
      expect(endTime - startTime).toBeLessThan(5000)
    })

    it('should handle concurrent bulk uploads', async () => {
      const bulkUploads = Array.from({ length: 3 }, (_, batchIndex) => {
        const files = Array.from({ length: 5 }, (_, fileIndex) => 
          createMockFile(`batch-${batchIndex}-file-${fileIndex}.txt`, 'text/plain', 1024)
        )
        
        return bulkUploadWithTransaction(
          files,
          {
            bucket: 'test-bucket',
            allowedTypes: ['text/plain']
          },
          async (uploadResults) => {
            return { 
              batch: batchIndex, 
              processed: uploadResults.length,
              files: uploadResults.map(r => r.file_path)
            }
          }
        )
      })

      const results = await Promise.all(bulkUploads)
      
      expect(results.every(r => r.success)).toBe(true)
      expect(results.every(r => r.data.processed === 5)).toBe(true)
      expectBucketFileCount(mockState, 'test-bucket', 15) // 3 batches * 5 files each
    })

    it('should maintain performance with retry scenarios', async () => {
      setupUploadRetryScenario(mockState, 1) // Fail once, then succeed
      
      const files = Array.from({ length: 10 }, (_, i) => 
        createMockFile(`retry-file-${i}.txt`, 'text/plain', 1024)
      )
      
      const startTime = Date.now()
      const result = await bulkUploadWithTransaction(
        files,
        {
          bucket: 'test-bucket',
          allowedTypes: ['text/plain'],
          retryAttempts: 3
        },
        async (uploadResults) => {
          return { processed: uploadResults.length }
        }
      )
      const endTime = Date.now()

      expect(result.success).toBe(true)
      expect(result.data.processed).toBe(10)
      expectBucketFileCount(mockState, 'test-bucket', 10)
      
      // Should complete with retries but still within reasonable time
      expect(endTime - startTime).toBeGreaterThan(1000) // Should take longer due to retries
      expect(endTime - startTime).toBeLessThan(10000) // But not too long
    })
  })

  // ============================================================================
  // BULK UPLOAD EDGE CASES
  // ============================================================================

  describe('Bulk Upload Edge Cases', () => {
    it('should handle duplicate file names', async () => {
      const files = [
        createMockFile('duplicate.txt', 'text/plain', 1024),
        createMockFile('duplicate.txt', 'text/plain', 2048),
        createMockFile('duplicate.txt', 'text/plain', 512)
      ]
      
      const result = await bulkUploadWithTransaction(
        files,
        {
          bucket: 'test-bucket',
          allowedTypes: ['text/plain']
        },
        async (uploadResults) => {
          return { 
            processed: uploadResults.length,
            paths: uploadResults.map(r => r.file_path)
          }
        }
      )

      expect(result.success).toBe(true)
      expect(result.data.processed).toBe(3)
      expect(result.data.paths).toHaveLength(3)
      
      // All file paths should be unique due to timestamp/random naming
      const uniquePaths = new Set(result.data.paths)
      expect(uniquePaths.size).toBe(3)
      
      expectBucketFileCount(mockState, 'test-bucket', 3)
    })

    it('should handle very large files in bulk', async () => {
      const files = [
        createMockFile('large1.pdf', 'application/pdf', 25 * 1024 * 1024), // 25MB
        createMockFile('large2.pdf', 'application/pdf', 30 * 1024 * 1024), // 30MB
        createMockFile('large3.pdf', 'application/pdf', 20 * 1024 * 1024)  // 20MB
      ]
      
      const result = await bulkUploadWithTransaction(
        files,
        {
          bucket: 'test-bucket',
          maxSize: 50 * 1024 * 1024, // 50MB limit
          allowedTypes: ['application/pdf']
        },
        async (uploadResults) => {
          return { 
            processed: uploadResults.length,
            totalSize: uploadResults.reduce((sum, r) => sum + files[0].size, 0)
          }
        }
      )

      expect(result.success).toBe(true)
      expect(result.data.processed).toBe(3)
      expectBucketFileCount(mockState, 'test-bucket', 3)
    })

    it('should handle mixed success/failure scenarios gracefully', async () => {
      const files = [
        createMockFile('valid1.txt', 'text/plain', 1024),
        createMockFile('valid2.txt', 'text/plain', 1024),
        createMockFile('valid3.txt', 'text/plain', 1024)
      ]
      
      // Setup intermittent failures
      setupIntermittentFailureScenario(mockState, 0.4) // 40% failure rate
      
      const result = await bulkUploadWithTransaction(
        files,
        {
          bucket: 'test-bucket',
          allowedTypes: ['text/plain'],
          retryAttempts: 5
        },
        async (uploadResults) => {
          return { processed: uploadResults.length }
        }
      )

      // Should either succeed completely or fail completely (no partial success)
      if (result.success) {
        expect(result.data.processed).toBe(3)
        expectBucketFileCount(mockState, 'test-bucket', 3)
      } else {
        expectBucketEmpty(mockState, 'test-bucket')
      }
    })
  })
})