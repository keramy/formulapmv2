/**
 * FileUploadService Unit Tests
 * 
 * Comprehensive tests for the enhanced FileUploadService with transaction support,
 * progress tracking, retry mechanisms, and cleanup functionality.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { FileUploadService } from '@/lib/file-upload'
import { 
  setupMockStorage, 
  createMockFile, 
  createMockImageFile, 
  createMockPdfFile,
  createLargeFile,
  createInvalidTypeFile,
  expectFileUploaded,
  expectFileNotUploaded,
  expectFileDeleted,
  expectBucketEmpty,
  expectBucketFileCount,
  expectTransactionCommitted,
  expectTransactionRolledBack,
  expectTransactionFailed,
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
    from: vi.fn()
  }
}))

// Mock database operations for cleanup tests
vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: null,
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            data: [],
            error: null
          })
        })
      })
    })
  }
}))

describe('FileUploadService', () => {
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
  // BASIC UPLOAD FUNCTIONALITY
  // ============================================================================

  describe('Basic Upload Functionality', () => {
    it('should upload a file successfully', async () => {
      const file = createMockFile('test.txt', 'text/plain', 1024)
      const options = {
        bucket: 'test-bucket',
        folder: 'uploads',
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['text/plain']
      }

      const result = await fileUploadService.uploadFile(file, options)

      expect(result.success).toBe(true)
      expect(result.file_path).toBeDefined()
      expect(result.file_url).toBeDefined()
      expect(result.upload_id).toBeDefined()
      expect(result.transaction_id).toBeDefined()
      expect(result.error).toBeUndefined()

      // Verify file was uploaded to storage
      const uploadedFiles = mockState.getAllFiles('test-bucket')
      expect(uploadedFiles.length).toBe(1)
      expect(uploadedFiles[0].name).toMatch(/uploads\/\d+_[a-z0-9]+\.txt/)
    })

    it('should generate unique file names', async () => {
      const file1 = createMockFile('test.txt', 'text/plain', 1024)
      const file2 = createMockFile('test.txt', 'text/plain', 1024)
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain']
      }

      const result1 = await fileUploadService.uploadFile(file1, options)
      const result2 = await fileUploadService.uploadFile(file2, options)

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result1.file_path).not.toBe(result2.file_path)
      expect(mockState.getFileCount('test-bucket')).toBe(2)
    })

    it('should handle file upload without folder', async () => {
      const file = createMockFile('test.txt', 'text/plain', 1024)
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain']
      }

      const result = await fileUploadService.uploadFile(file, options)

      expect(result.success).toBe(true)
      expect(result.file_path).not.toContain('/')
      expect(mockState.hasFile('test-bucket', result.file_path!)).toBe(true)
    })

    it('should return public URL for uploaded file', async () => {
      const file = createMockFile('test.txt', 'text/plain', 1024)
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain']
      }

      const result = await fileUploadService.uploadFile(file, options)

      expect(result.success).toBe(true)
      expect(result.file_url).toBe(`https://mock-storage.example.com/test-bucket/${result.file_path}`)
    })
  })

  // ============================================================================
  // FILE VALIDATION TESTS
  // ============================================================================

  describe('File Validation', () => {
    it('should reject files exceeding size limit', async () => {
      const file = createLargeFile('large.pdf', 60) // 60MB
      const options = {
        bucket: 'test-bucket',
        maxSize: 50 * 1024 * 1024, // 50MB limit
        allowedTypes: ['application/pdf']
      }

      const result = await fileUploadService.uploadFile(file, options)

      expect(result.success).toBe(false)
      expect(result.error).toContain('File size exceeds maximum limit of 50MB')
      expect(result.upload_id).toBeDefined()
      expect(mockState.getFileCount('test-bucket')).toBe(0)
    })

    it('should reject files with invalid types', async () => {
      const file = createInvalidTypeFile('malware.exe', 1024)
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['image/jpeg', 'image/png', 'application/pdf']
      }

      const result = await fileUploadService.uploadFile(file, options)

      expect(result.success).toBe(false)
      expect(result.error).toContain('File type application/x-executable is not allowed')
      expect(result.error).toContain('Allowed types: image/jpeg, image/png, application/pdf')
      expect(mockState.getFileCount('test-bucket')).toBe(0)
    })

    it('should accept valid file types', async () => {
      const pdfFile = createMockPdfFile('document.pdf', 5120)
      const jpegFile = createMockImageFile('image.jpg', 2048)
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['application/pdf', 'image/jpeg']
      }

      const pdfResult = await fileUploadService.uploadFile(pdfFile, options)
      const jpegResult = await fileUploadService.uploadFile(jpegFile, options)

      expect(pdfResult.success).toBe(true)
      expect(jpegResult.success).toBe(true)
      expect(mockState.getFileCount('test-bucket')).toBe(2)
    })

    it('should handle files at exact size limit', async () => {
      const file = createMockFile('exact.txt', 'text/plain', 1024) // Exactly 1KB
      const options = {
        bucket: 'test-bucket',
        maxSize: 1024, // 1KB limit
        allowedTypes: ['text/plain']
      }

      const result = await fileUploadService.uploadFile(file, options)

      expect(result.success).toBe(true)
      expect(mockState.getFileCount('test-bucket')).toBe(1)
    })
  })

  // ============================================================================
  // PROGRESS TRACKING TESTS
  // ============================================================================

  describe('Progress Tracking', () => {
    it('should track upload progress', async () => {
      const file = createMockFile('test.txt', 'text/plain', 1024)
      const progressTracker = new ProgressTracker()
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain'],
        onProgress: progressTracker.getProgressCallback()
      }

      const result = await fileUploadService.uploadFile(file, options)

      expect(result.success).toBe(true)
      const progressUpdates = progressTracker.getProgressUpdates()
      expect(progressUpdates.length).toBeGreaterThan(0)
      expect(progressUpdates).toContain(10) // Initial progress
      expect(progressUpdates).toContain(90) // Pre-completion progress
      expect(progressUpdates).toContain(100) // Final progress
      progressTracker.expectProgressIncreasing()
    })

    it('should provide upload progress via getUploadProgress', async () => {
      const file = createMockFile('test.txt', 'text/plain', 1024)
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain']
      }

      const result = await fileUploadService.uploadFile(file, options)

      expect(result.success).toBe(true)
      const progress = fileUploadService.getUploadProgress(result.upload_id!)
      expect(progress).toBeDefined()
      expect(progress!.status).toBe('completed')
      expect(progress!.progress).toBe(100)
      expect(progress!.upload_id).toBe(result.upload_id)
    })

    it('should track progress for failed uploads', async () => {
      mockState.setUploadFailure(true)
      const file = createMockFile('test.txt', 'text/plain', 1024)
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain']
      }

      const result = await fileUploadService.uploadFile(file, options)

      expect(result.success).toBe(false)
      const progress = fileUploadService.getUploadProgress(result.upload_id!)
      expect(progress).toBeDefined()
      expect(progress!.status).toBe('failed')
      expect(progress!.error).toBeDefined()
    })
  })

  // ============================================================================
  // TRANSACTION MANAGEMENT TESTS
  // ============================================================================

  describe('Transaction Management', () => {
    it('should create transaction for successful upload', async () => {
      const file = createMockFile('test.txt', 'text/plain', 1024)
      const options = {
        bucket: 'test-bucket',
        folder: 'uploads',
        allowedTypes: ['text/plain']
      }

      const result = await fileUploadService.uploadFile(file, options)

      expect(result.success).toBe(true)
      expect(result.transaction_id).toBeDefined()
      
      const transaction = fileUploadService.getTransaction(result.transaction_id!)
      expect(transaction).toBeDefined()
      expect(transaction!.status).toBe('uploaded')
      expect(transaction!.bucket).toBe('test-bucket')
      expect(transaction!.file_path).toBe(result.file_path)
    })

    it('should commit transaction successfully', async () => {
      const file = createMockFile('test.txt', 'text/plain', 1024)
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain']
      }

      const result = await fileUploadService.uploadFile(file, options)
      const commitResult = await fileUploadService.commitTransaction(result.transaction_id!)

      expect(commitResult).toBe(true)
      expectTransactionCommitted(fileUploadService, result.transaction_id!)
    })

    it('should rollback transaction and delete file', async () => {
      const file = createMockFile('test.txt', 'text/plain', 1024)
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain']
      }

      const result = await fileUploadService.uploadFile(file, options)
      expect(mockState.hasFile('test-bucket', result.file_path!)).toBe(true)

      const rollbackResult = await fileUploadService.rollbackTransaction(result.transaction_id!)

      expect(rollbackResult).toBe(true)
      expectTransactionRolledBack(fileUploadService, result.transaction_id!)
      expectFileDeleted(mockState, 'test-bucket', result.file_path!)
    })

    it('should handle commit on non-existent transaction', async () => {
      const commitResult = await fileUploadService.commitTransaction('non-existent-tx')
      expect(commitResult).toBe(false)
    })

    it('should handle rollback on non-existent transaction', async () => {
      const rollbackResult = await fileUploadService.rollbackTransaction('non-existent-tx')
      expect(rollbackResult).toBe(false)
    })

    it('should not commit transaction not in uploaded state', async () => {
      const file = createMockFile('test.txt', 'text/plain', 1024)
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain']
      }

      const result = await fileUploadService.uploadFile(file, options)
      
      // Manually change status to something other than 'uploaded'
      const transaction = fileUploadService.getTransaction(result.transaction_id!)
      transaction!.status = 'failed'
      ;(fileUploadService as any).activeTransactions.set(result.transaction_id!, transaction)

      const commitResult = await fileUploadService.commitTransaction(result.transaction_id!)
      expect(commitResult).toBe(false)
    })
  })

  // ============================================================================
  // RETRY MECHANISM TESTS
  // ============================================================================

  describe('Retry Mechanism', () => {
    it('should retry failed uploads and eventually succeed', async () => {
      const retryScenario = setupUploadRetryScenario(mockState, 2) // Fail first 2 attempts
      const file = createMockFile('test.txt', 'text/plain', 1024)
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain'],
        retryAttempts: 3
      }

      const result = await fileUploadService.uploadFile(file, options)

      expect(result.success).toBe(true)
      expect(retryScenario.getAttemptCount()).toBe(3) // 2 failures + 1 success
      expectFileUploaded(mockState, 'test-bucket', result.file_path!)
    })

    it('should fail after exhausting retry attempts', async () => {
      setupUploadRetryScenario(mockState, 5) // Fail first 5 attempts
      const file = createMockFile('test.txt', 'text/plain', 1024)
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain'],
        retryAttempts: 3
      }

      const result = await fileUploadService.uploadFile(file, options)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Mock failure attempt')
      expectFileNotUploaded(mockState, 'test-bucket', result.file_path || 'any-path')
    })

    it('should use exponential backoff between retries', async () => {
      const startTime = Date.now()
      setupUploadRetryScenario(mockState, 2)
      const file = createMockFile('test.txt', 'text/plain', 1024)
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain'],
        retryAttempts: 3
      }

      await fileUploadService.uploadFile(file, options)
      const endTime = Date.now()

      // Should have some delay due to exponential backoff
      // Base delay: 1000ms, first retry: 2000ms, second retry: 4000ms
      expect(endTime - startTime).toBeGreaterThan(3000) // At least 3 seconds
    })
  })

  // ============================================================================
  // FILE DELETION TESTS
  // ============================================================================

  describe('File Deletion', () => {
    it('should delete single file successfully', async () => {
      // Upload a file first
      const file = createMockFile('test.txt', 'text/plain', 1024)
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain']
      }

      const uploadResult = await fileUploadService.uploadFile(file, options)
      expect(uploadResult.success).toBe(true)

      const deleteResult = await fileUploadService.deleteFile('test-bucket', uploadResult.file_path!)
      expect(deleteResult).toBe(true)
      expectFileDeleted(mockState, 'test-bucket', uploadResult.file_path!)
    })

    it('should handle delete failure gracefully', async () => {
      mockState.setDeleteFailure(true)
      const deleteResult = await fileUploadService.deleteFile('test-bucket', 'non-existent-file.txt')
      expect(deleteResult).toBe(false)
    })

    it('should delete multiple files', async () => {
      // Upload multiple files
      const files = [
        createMockFile('test1.txt', 'text/plain', 1024),
        createMockFile('test2.txt', 'text/plain', 1024),
        createMockFile('test3.txt', 'text/plain', 1024)
      ]
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain']
      }

      const uploadResults = await Promise.all(
        files.map(file => fileUploadService.uploadFile(file, options))
      )
      
      expect(uploadResults.every(r => r.success)).toBe(true)
      expect(mockState.getFileCount('test-bucket')).toBe(3)

      const filePaths = uploadResults.map(r => r.file_path!)
      const deleteResult = await fileUploadService.deleteMultipleFiles('test-bucket', filePaths)

      expect(deleteResult.success).toBe(true)
      expect(deleteResult.failed).toEqual([])
      expectBucketEmpty(mockState, 'test-bucket')
    })

    it('should handle partial deletion failures', async () => {
      // Upload files
      const files = [
        createMockFile('test1.txt', 'text/plain', 1024),
        createMockFile('test2.txt', 'text/plain', 1024)
      ]
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain']
      }

      const uploadResults = await Promise.all(
        files.map(file => fileUploadService.uploadFile(file, options))
      )

      // Setup partial failure
      mockState.setDeleteFailureRate(0.5) // 50% failure rate
      
      const filePaths = uploadResults.map(r => r.file_path!)
      const deleteResult = await fileUploadService.deleteMultipleFiles('test-bucket', filePaths)

      expect(deleteResult.success).toBe(false)
      expect(deleteResult.failed.length).toBeGreaterThan(0)
      expect(deleteResult.failed.length).toBeLessThan(filePaths.length)
    })
  })

  // ============================================================================
  // SIGNED URL TESTS
  // ============================================================================

  describe('Signed URL Generation', () => {
    it('should generate signed URL for existing file', async () => {
      // Upload a file first
      const file = createMockFile('test.txt', 'text/plain', 1024)
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain']
      }

      const uploadResult = await fileUploadService.uploadFile(file, options)
      expect(uploadResult.success).toBe(true)

      const signedUrl = await fileUploadService.getSignedUrl('test-bucket', uploadResult.file_path!, 3600)
      
      expect(signedUrl).toBeDefined()
      expect(signedUrl).toContain('https://mock-storage.example.com')
      expect(signedUrl).toContain(uploadResult.file_path!)
      expect(signedUrl).toContain('expires=')
      expect(signedUrl).toContain('signature=')
    })

    it('should return null for non-existent file', async () => {
      const signedUrl = await fileUploadService.getSignedUrl('test-bucket', 'non-existent.txt', 3600)
      expect(signedUrl).toBeNull()
    })

    it('should handle signed URL generation failure', async () => {
      mockState.setSignedUrlFailure(true)
      const signedUrl = await fileUploadService.getSignedUrl('test-bucket', 'any-file.txt', 3600)
      expect(signedUrl).toBeNull()
    })

    it('should use custom expiration time', async () => {
      const file = createMockFile('test.txt', 'text/plain', 1024)
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain']
      }

      const uploadResult = await fileUploadService.uploadFile(file, options)
      const customExpiry = 7200 // 2 hours
      const signedUrl = await fileUploadService.getSignedUrl('test-bucket', uploadResult.file_path!, customExpiry)
      
      expect(signedUrl).toBeDefined()
      expect(signedUrl).toContain('expires=')
      
      // Extract expiration time from URL
      const expiresMatch = signedUrl!.match(/expires=(\d+)/)
      expect(expiresMatch).toBeDefined()
      const expiresTime = parseInt(expiresMatch![1])
      const expectedExpiry = Date.now() + (customExpiry * 1000)
      expect(expiresTime).toBeCloseTo(expectedExpiry, -3) // Within 1 second
    })
  })

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle storage upload errors gracefully', async () => {
      mockState.setUploadFailure(true)
      const file = createMockFile('test.txt', 'text/plain', 1024)
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain'],
        retryAttempts: 1
      }

      const result = await fileUploadService.uploadFile(file, options)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.upload_id).toBeDefined()
      expect(result.transaction_id).toBeDefined()
      expectUploadFailed(fileUploadService, result.upload_id!)
      expectTransactionFailed(fileUploadService, result.transaction_id!)
    })

    it('should handle network timeout scenarios', async () => {
      setupNetworkDelayScenario(mockState, 5000) // 5 second delay
      const file = createMockFile('test.txt', 'text/plain', 1024)
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain'],
        timeout: 3000 // 3 second timeout
      }

      const startTime = Date.now()
      const result = await fileUploadService.uploadFile(file, options)
      const endTime = Date.now()

      expect(endTime - startTime).toBeGreaterThan(5000) // Should take at least 5 seconds
      expect(result.success).toBe(true) // Should eventually succeed
    })

    it('should handle storage quota exceeded scenarios', async () => {
      setupStorageFullScenario(mockState, 2) // Max 2 files
      const file = createMockFile('test.txt', 'text/plain', 1024)
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain']
      }

      // Upload 2 files successfully
      const result1 = await fileUploadService.uploadFile(file, options)
      const result2 = await fileUploadService.uploadFile(file, options)
      
      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)

      // Third upload should fail
      const result3 = await fileUploadService.uploadFile(file, options)
      expect(result3.success).toBe(false)
      expect(result3.error).toContain('Storage quota exceeded')
    })

    it('should handle intermittent failure scenarios', async () => {
      setupIntermittentFailureScenario(mockState, 0.3) // 30% failure rate
      const file = createMockFile('test.txt', 'text/plain', 1024)
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain'],
        retryAttempts: 5
      }

      const results = await Promise.allSettled(
        Array.from({ length: 20 }, () => fileUploadService.uploadFile(file, options))
      )

      const successes = results.filter(r => r.status === 'fulfilled' && r.value.success).length
      const failures = results.filter(r => r.status === 'fulfilled' && !r.value.success).length

      expect(successes).toBeGreaterThan(0)
      expect(failures).toBeGreaterThan(0)
      expect(successes + failures).toBe(20)
    })
  })

  // ============================================================================
  // SINGLETON PATTERN TESTS
  // ============================================================================

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = FileUploadService.getInstance()
      const instance2 = FileUploadService.getInstance()
      expect(instance1).toBe(instance2)
    })

    it('should maintain state across getInstance calls', async () => {
      const instance1 = FileUploadService.getInstance()
      const file = createMockFile('test.txt', 'text/plain', 1024)
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain']
      }

      const result = await instance1.uploadFile(file, options)
      expect(result.success).toBe(true)

      const instance2 = FileUploadService.getInstance()
      const progress = instance2.getUploadProgress(result.upload_id!)
      expect(progress).toBeDefined()
      expect(progress!.status).toBe('completed')
    })
  })
})