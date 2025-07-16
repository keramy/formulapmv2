/**
 * File Upload Transaction Integration Tests
 * 
 * Tests transactional file uploads with database operations,
 * including commit/rollback scenarios and error recovery.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { transactionalUpload, uploadShopDrawingWithTransaction, uploadReportAttachmentWithTransaction, bulkUploadWithTransaction } from '@/lib/file-upload'
import { 
  setupMockStorage, 
  createMockFile, 
  createMockPdfFile,
  createMockImageFile,
  expectFileUploaded,
  expectFileDeleted,
  expectBucketEmpty,
  expectBucketFileCount,
  ProgressTracker,
  MockStorageState
} from '@/utils/mock-storage'
import { createTestSupabaseClient, setupBasicTestEnvironment, cleanupTestData } from '@/utils/real-supabase-utils'

// Mock the supabase module
vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: null, // Will be set by setupMockStorage
    from: vi.fn(),
    auth: {
      getSession: vi.fn()
    }
  }
}))

describe('File Upload Transactions Integration Tests', () => {
  let mockState: MockStorageState
  let cleanup: () => void
  let testEnv: any

  beforeEach(async () => {
    // Setup mock storage
    const mockSetup = setupMockStorage()
    mockState = mockSetup.mockState
    cleanup = mockSetup.cleanup
    
    // Mock the supabase.storage with our mock client
    const { supabase } = require('@/lib/supabase')
    supabase.storage = mockSetup.mockStorage
    
    // Setup test environment with real database
    testEnv = await setupBasicTestEnvironment('project_manager')
    
    // Mock database operations for transactional tests
    setupMockDatabaseOperations(testEnv.supabase)
  })

  afterEach(async () => {
    cleanup()
    if (testEnv?.cleanup) {
      await testEnv.cleanup()
    }
  })

  // ============================================================================
  // TRANSACTIONAL UPLOAD TESTS
  // ============================================================================

  describe('Transactional Upload Core Functionality', () => {
    it('should complete successful transactional upload', async () => {
      const file = createMockFile('test.txt', 'text/plain', 1024)
      const progressTracker = new ProgressTracker()
      
      const result = await transactionalUpload({
        file,
        uploadConfig: {
          bucket: 'test-bucket',
          allowedTypes: ['text/plain']
        },
        databaseOperation: async (uploadResult) => {
          // Simulate successful database operation
          return {
            id: 'test-record-123',
            file_path: uploadResult.file_path,
            created_at: new Date().toISOString()
          }
        },
        onProgress: progressTracker.getProgressCallback()
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data.id).toBe('test-record-123')
      expect(result.uploadResult).toBeDefined()
      expect(result.uploadResult!.success).toBe(true)
      expect(result.transaction_id).toBeDefined()

      // Verify file was uploaded
      expectFileUploaded(mockState, 'test-bucket', result.uploadResult!.file_path!)
      
      // Verify progress tracking
      progressTracker.expectProgressCompleted()
    })

    it('should rollback transaction on database operation failure', async () => {
      const file = createMockFile('test.txt', 'text/plain', 1024)
      
      const result = await transactionalUpload({
        file,
        uploadConfig: {
          bucket: 'test-bucket',
          allowedTypes: ['text/plain']
        },
        databaseOperation: async (uploadResult) => {
          // Simulate database operation failure
          throw new Error('Database operation failed')
        }
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Database operation failed')
      expect(result.uploadResult).toBeDefined()
      expect(result.transaction_id).toBeDefined()

      // Verify file was uploaded initially but then rolled back
      if (result.uploadResult) {
        expectFileDeleted(mockState, 'test-bucket', result.uploadResult.file_path!)
      }
    })

    it('should handle upload failure before database operation', async () => {
      mockState.setUploadFailure(true)
      const file = createMockFile('test.txt', 'text/plain', 1024)
      
      const result = await transactionalUpload({
        file,
        uploadConfig: {
          bucket: 'test-bucket',
          allowedTypes: ['text/plain']
        },
        databaseOperation: async (uploadResult) => {
          // This should not be called
          throw new Error('Database operation should not be called')
        }
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Mock upload failure')
      expect(result.uploadResult).toBeDefined()
      expect(result.uploadResult!.success).toBe(false)
      
      // Verify no file was uploaded
      expect(mockState.getTotalFileCount()).toBe(0)
    })

    it('should execute custom rollback operation on failure', async () => {
      const file = createMockFile('test.txt', 'text/plain', 1024)
      const rollbackExecuted = vi.fn()
      
      const result = await transactionalUpload({
        file,
        uploadConfig: {
          bucket: 'test-bucket',
          allowedTypes: ['text/plain']
        },
        databaseOperation: async (uploadResult) => {
          throw new Error('Database operation failed')
        },
        rollbackOperation: async (uploadResult) => {
          rollbackExecuted()
          // Custom cleanup logic
          expect(uploadResult.file_path).toBeDefined()
        }
      })

      expect(result.success).toBe(false)
      expect(rollbackExecuted).toHaveBeenCalled()
      
      // Verify file was rolled back
      if (result.uploadResult) {
        expectFileDeleted(mockState, 'test-bucket', result.uploadResult.file_path!)
      }
    })
  })

  // ============================================================================
  // SHOP DRAWING TRANSACTION TESTS
  // ============================================================================

  describe('Shop Drawing Transactional Upload', () => {
    it('should upload shop drawing with database update', async () => {
      const file = createMockPdfFile('drawing.pdf', 5120)
      const drawingId = 'test-drawing-123'
      const progressTracker = new ProgressTracker()
      
      const result = await uploadShopDrawingWithTransaction(
        file,
        drawingId,
        progressTracker.getProgressCallback()
      )

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.uploadResult).toBeDefined()
      expect(result.uploadResult!.success).toBe(true)

      // Verify file was uploaded to correct bucket
      expectFileUploaded(mockState, 'shop-drawings', result.uploadResult!.file_path!)
      
      // Verify progress tracking
      progressTracker.expectProgressCompleted()
    })

    it('should rollback shop drawing upload on database failure', async () => {
      const file = createMockPdfFile('drawing.pdf', 5120)
      const drawingId = 'non-existent-drawing'
      
      // Mock database to simulate failure
      mockDatabaseError('shop_drawings', 'update')
      
      const result = await uploadShopDrawingWithTransaction(file, drawingId)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Database update failed')
      
      // Verify file was rolled back
      if (result.uploadResult) {
        expectFileDeleted(mockState, 'shop-drawings', result.uploadResult.file_path!)
      }
    })

    it('should handle invalid file type for shop drawing', async () => {
      const file = createMockFile('invalid.txt', 'text/plain', 1024)
      const drawingId = 'test-drawing-123'
      
      const result = await uploadShopDrawingWithTransaction(file, drawingId)

      expect(result.success).toBe(false)
      expect(result.error).toContain('File type text/plain is not allowed')
      expect(mockState.getTotalFileCount()).toBe(0)
    })

    it('should handle file size limit for shop drawing', async () => {
      const file = createMockFile('large-drawing.pdf', 'application/pdf', 60 * 1024 * 1024) // 60MB
      const drawingId = 'test-drawing-123'
      
      const result = await uploadShopDrawingWithTransaction(file, drawingId)

      expect(result.success).toBe(false)
      expect(result.error).toContain('File size exceeds maximum limit')
      expect(mockState.getTotalFileCount()).toBe(0)
    })
  })

  // ============================================================================
  // REPORT ATTACHMENT TRANSACTION TESTS
  // ============================================================================

  describe('Report Attachment Transactional Upload', () => {
    it('should upload report attachment with database insert', async () => {
      const file = createMockFile('report.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 2048)
      const reportId = 'test-report-123'
      const progressTracker = new ProgressTracker()
      
      const result = await uploadReportAttachmentWithTransaction(
        file,
        reportId,
        progressTracker.getProgressCallback()
      )

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.uploadResult).toBeDefined()
      expect(result.uploadResult!.success).toBe(true)

      // Verify file was uploaded to correct bucket
      expectFileUploaded(mockState, 'reports', result.uploadResult!.file_path!)
      
      // Verify progress tracking
      progressTracker.expectProgressCompleted()
    })

    it('should rollback report attachment upload on database failure', async () => {
      const file = createMockFile('report.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 2048)
      const reportId = 'test-report-123'
      
      // Mock database to simulate failure
      mockDatabaseError('report_attachments', 'insert')
      
      const result = await uploadReportAttachmentWithTransaction(file, reportId)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Database insert failed')
      
      // Verify file was rolled back
      if (result.uploadResult) {
        expectFileDeleted(mockState, 'reports', result.uploadResult.file_path!)
      }
    })

    it('should handle invalid file type for report attachment', async () => {
      const file = createMockFile('invalid.exe', 'application/x-executable', 1024)
      const reportId = 'test-report-123'
      
      const result = await uploadReportAttachmentWithTransaction(file, reportId)

      expect(result.success).toBe(false)
      expect(result.error).toContain('File type application/x-executable is not allowed')
      expect(mockState.getTotalFileCount()).toBe(0)
    })
  })

  // ============================================================================
  // BULK UPLOAD TRANSACTION TESTS
  // ============================================================================

  describe('Bulk Upload Transactions', () => {
    it('should upload multiple files with single database operation', async () => {
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
          // Simulate bulk database operation
          return {
            processed: uploadResults.length,
            results: uploadResults.map((upload, index) => ({
              id: `record-${index}`,
              file_path: upload.file_path
            }))
          }
        },
        progressTracker.getProgressCallback()
      )

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data.processed).toBe(3)
      expect(result.data.results.length).toBe(3)

      // Verify all files were uploaded
      expectBucketFileCount(mockState, 'test-bucket', 3)
      
      // Verify progress tracking
      progressTracker.expectProgressCompleted()
    })

    it('should rollback all files on database operation failure', async () => {
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
      // Setup scenario where second file upload fails
      const files = [
        createMockFile('file1.txt', 'text/plain', 1024),
        createMockFile('file2.txt', 'text/plain', 1024)
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

    it('should handle empty file array', async () => {
      const result = await bulkUploadWithTransaction(
        [],
        {
          bucket: 'test-bucket',
          allowedTypes: ['text/plain']
        },
        async (uploadResults) => {
          return { processed: 0, results: [] }
        }
      )

      expect(result.success).toBe(true)
      expect(result.data.processed).toBe(0)
      expect(result.data.results).toEqual([])
    })
  })

  // ============================================================================
  // COMPLEX TRANSACTION SCENARIOS
  // ============================================================================

  describe('Complex Transaction Scenarios', () => {
    it('should handle concurrent transactional uploads', async () => {
      const files = Array.from({ length: 5 }, (_, i) => 
        createMockFile(`concurrent-${i}.txt`, 'text/plain', 1024)
      )
      
      const promises = files.map(file => 
        transactionalUpload({
          file,
          uploadConfig: {
            bucket: 'test-bucket',
            allowedTypes: ['text/plain']
          },
          databaseOperation: async (uploadResult) => {
            // Simulate some processing time
            await new Promise(resolve => setTimeout(resolve, 100))
            return { id: `record-${uploadResult.file_path}` }
          }
        })
      )

      const results = await Promise.all(promises)
      
      expect(results.every(r => r.success)).toBe(true)
      expectBucketFileCount(mockState, 'test-bucket', 5)
    })

    it('should handle transaction timeout scenarios', async () => {
      const file = createMockFile('timeout-test.txt', 'text/plain', 1024)
      
      const result = await transactionalUpload({
        file,
        uploadConfig: {
          bucket: 'test-bucket',
          allowedTypes: ['text/plain']
        },
        databaseOperation: async (uploadResult) => {
          // Simulate long-running database operation
          await new Promise(resolve => setTimeout(resolve, 10000))
          return { id: 'timeout-record' }
        }
      })

      // Should eventually complete or timeout gracefully
      expect(result.success).toBeDefined()
      expect(result.error).toBeDefined()
    })

    it('should maintain transaction integrity under stress', async () => {
      const files = Array.from({ length: 10 }, (_, i) => 
        createMockFile(`stress-${i}.txt`, 'text/plain', 1024)
      )
      
      // Some uploads will fail, some will succeed
      let successCount = 0
      
      const promises = files.map((file, index) => 
        transactionalUpload({
          file,
          uploadConfig: {
            bucket: 'test-bucket',
            allowedTypes: ['text/plain']
          },
          databaseOperation: async (uploadResult) => {
            // Randomly fail some operations
            if (Math.random() < 0.3) {
              throw new Error(`Random failure for file ${index}`)
            }
            successCount++
            return { id: `record-${index}` }
          }
        })
      )

      const results = await Promise.allSettled(promises)
      const successes = results.filter(r => r.status === 'fulfilled' && r.value.success).length
      const failures = results.filter(r => r.status === 'fulfilled' && !r.value.success).length

      expect(successes).toBe(successCount)
      expect(failures).toBe(files.length - successCount)
      
      // Verify only successful uploads remain in storage
      expectBucketFileCount(mockState, 'test-bucket', successCount)
    })
  })

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  function setupMockDatabaseOperations(supabase: any) {
    // Mock shop_drawings table operations
    supabase.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'shop_drawings') {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'test-drawing-123',
                    file_path: 'test-path',
                    updated_at: new Date().toISOString()
                  },
                  error: null
                })
              })
            })
          })
        }
      }
      
      if (table === 'report_attachments') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'test-attachment-123',
                  file_path: 'test-path',
                  created_at: new Date().toISOString()
                },
                error: null
              })
            })
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: null
            })
          })
        }
      }
      
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        })
      }
    })
  }

  function mockDatabaseError(table: string, operation: string) {
    const { supabase } = require('@/lib/supabase')
    
    if (table === 'shop_drawings' && operation === 'update') {
      supabase.from.mockImplementation((tableName: string) => {
        if (tableName === 'shop_drawings') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Database update failed' }
                  })
                })
              })
            })
          }
        }
        return supabase.from(tableName)
      })
    }
    
    if (table === 'report_attachments' && operation === 'insert') {
      supabase.from.mockImplementation((tableName: string) => {
        if (tableName === 'report_attachments') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Database insert failed' }
                })
              })
            })
          }
        }
        return supabase.from(tableName)
      })
    }
  }
})