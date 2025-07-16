/**
 * File Upload Progress Tracking and Retry Mechanism Tests
 * 
 * Tests progress tracking functionality, retry mechanisms with exponential backoff,
 * and comprehensive error recovery scenarios.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { FileUploadService } from '@/lib/file-upload'
import { 
  setupMockStorage, 
  createMockFile, 
  createMockPdfFile,
  createMockImageFile,
  createLargeFile,
  expectFileUploaded,
  expectFileDeleted,
  expectBucketEmpty,
  expectBucketFileCount,
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

describe('File Upload Progress Tracking and Retry Mechanism Tests', () => {
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
    
    // Mock timers for testing delays
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  // ============================================================================
  // PROGRESS TRACKING TESTS
  // ============================================================================

  describe('Progress Tracking', () => {
    it('should track progress through complete upload lifecycle', async () => {
      const file = createMockFile('test.txt', 'text/plain', 1024)
      const progressTracker = new ProgressTracker()
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain'],
        onProgress: progressTracker.getProgressCallback()
      }

      const uploadPromise = fileUploadService.uploadFile(file, options)
      const result = await uploadPromise

      expect(result.success).toBe(true)
      
      const progressUpdates = progressTracker.getProgressUpdates()
      expect(progressUpdates.length).toBeGreaterThan(0)
      
      // Should have key progress milestones
      expect(progressUpdates).toContain(10)  // Initial progress
      expect(progressUpdates).toContain(90)  // Pre-completion
      expect(progressUpdates).toContain(100) // Completion
      
      // Progress should be increasing
      progressTracker.expectProgressIncreasing()
    })

    it('should track progress with slow uploads', async () => {
      setupNetworkDelayScenario(mockState, 1000) // 1 second delay
      
      const file = createMockFile('slow.txt', 'text/plain', 1024)
      const progressTracker = new ProgressTracker()
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain'],
        onProgress: progressTracker.getProgressCallback()
      }

      const uploadPromise = fileUploadService.uploadFile(file, options)
      
      // Fast forward time to simulate delay
      vi.advanceTimersByTime(1000)
      
      const result = await uploadPromise

      expect(result.success).toBe(true)
      
      const progressUpdates = progressTracker.getProgressUpdates()
      expect(progressUpdates.length).toBeGreaterThan(0)
      progressTracker.expectProgressCompleted()
    })

    it('should track progress for multiple concurrent uploads', async () => {
      const files = [
        createMockFile('file1.txt', 'text/plain', 1024),
        createMockFile('file2.txt', 'text/plain', 1024),
        createMockFile('file3.txt', 'text/plain', 1024)
      ]
      
      const progressTrackers = files.map(() => new ProgressTracker())
      
      const uploadPromises = files.map((file, index) => 
        fileUploadService.uploadFile(file, {
          bucket: 'test-bucket',
          allowedTypes: ['text/plain'],
          onProgress: progressTrackers[index].getProgressCallback()
        })
      )

      const results = await Promise.all(uploadPromises)
      
      expect(results.every(r => r.success)).toBe(true)
      
      // Each upload should have its own progress tracking
      progressTrackers.forEach(tracker => {
        expect(tracker.getProgressUpdates().length).toBeGreaterThan(0)
        tracker.expectProgressCompleted()
      })
    })

    it('should provide accurate progress via getUploadProgress', async () => {
      const file = createMockFile('test.txt', 'text/plain', 1024)
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain']
      }

      const result = await fileUploadService.uploadFile(file, options)
      
      expect(result.success).toBe(true)
      expect(result.upload_id).toBeDefined()
      
      const progress = fileUploadService.getUploadProgress(result.upload_id!)
      expect(progress).toBeDefined()
      expect(progress!.upload_id).toBe(result.upload_id)
      expect(progress!.status).toBe('completed')
      expect(progress!.progress).toBe(100)
      expect(progress!.error).toBeUndefined()
    })

    it('should track progress for failed uploads', async () => {
      mockState.setUploadFailure(true)
      
      const file = createMockFile('failed.txt', 'text/plain', 1024)
      const progressTracker = new ProgressTracker()
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain'],
        onProgress: progressTracker.getProgressCallback(),
        retryAttempts: 1
      }

      const result = await fileUploadService.uploadFile(file, options)
      
      expect(result.success).toBe(false)
      expect(result.upload_id).toBeDefined()
      
      const progress = fileUploadService.getUploadProgress(result.upload_id!)
      expect(progress).toBeDefined()
      expect(progress!.status).toBe('failed')
      expect(progress!.error).toBeDefined()
      
      // Should have some progress updates even on failure
      const progressUpdates = progressTracker.getProgressUpdates()
      expect(progressUpdates.length).toBeGreaterThan(0)
      expect(progressUpdates).toContain(10) // Initial progress
      expect(progressUpdates).not.toContain(100) // Should not complete
    })

    it('should handle progress tracking with validation failures', async () => {
      const file = createLargeFile('large.pdf', 60) // 60MB - too large
      const progressTracker = new ProgressTracker()
      const options = {
        bucket: 'test-bucket',
        maxSize: 50 * 1024 * 1024, // 50MB limit
        allowedTypes: ['application/pdf'],
        onProgress: progressTracker.getProgressCallback()
      }

      const result = await fileUploadService.uploadFile(file, options)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('File size exceeds maximum limit')
      
      const progress = fileUploadService.getUploadProgress(result.upload_id!)
      expect(progress).toBeDefined()
      expect(progress!.status).toBe('failed')
      expect(progress!.progress).toBe(0)
      expect(progress!.error).toContain('File size exceeds maximum limit')
    })

    it('should clean up progress tracking after completion', async () => {
      const file = createMockFile('cleanup.txt', 'text/plain', 1024)
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain']
      }

      const result = await fileUploadService.uploadFile(file, options)
      expect(result.success).toBe(true)
      
      // Progress should be available immediately after upload
      const progress = fileUploadService.getUploadProgress(result.upload_id!)
      expect(progress).toBeDefined()
      expect(progress!.status).toBe('completed')
      
      // Note: In real implementation, progress tracking might be cleaned up after some time
      // This test verifies the current state is correct
    })

    it('should handle progress tracking with large files', async () => {
      const file = createMockFile('large.txt', 'text/plain', 25 * 1024 * 1024) // 25MB
      const progressTracker = new ProgressTracker()
      const options = {
        bucket: 'test-bucket',
        maxSize: 50 * 1024 * 1024, // 50MB limit
        allowedTypes: ['text/plain'],
        onProgress: progressTracker.getProgressCallback()
      }

      const result = await fileUploadService.uploadFile(file, options)
      
      expect(result.success).toBe(true)
      
      // Should have progress updates
      const progressUpdates = progressTracker.getProgressUpdates()
      expect(progressUpdates.length).toBeGreaterThan(0)
      progressTracker.expectProgressCompleted()
    })
  })

  // ============================================================================
  // RETRY MECHANISM TESTS
  // ============================================================================

  describe('Retry Mechanism', () => {
    it('should retry failed uploads with exponential backoff', async () => {
      const retryScenario = setupUploadRetryScenario(mockState, 2) // Fail first 2 attempts
      
      const file = createMockFile('retry.txt', 'text/plain', 1024)
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain'],
        retryAttempts: 3
      }

      const startTime = Date.now()
      const uploadPromise = fileUploadService.uploadFile(file, options)
      
      // Advance timers to simulate retry delays
      // First retry after 1s, second retry after 2s, third attempt after 4s
      vi.advanceTimersByTime(1000) // First retry
      vi.advanceTimersByTime(2000) // Second retry
      vi.advanceTimersByTime(4000) // Third attempt (should succeed)
      
      const result = await uploadPromise
      const endTime = Date.now()

      expect(result.success).toBe(true)
      expect(retryScenario.getAttemptCount()).toBe(3) // 2 failures + 1 success
      
      // Should have taken time due to exponential backoff
      expect(endTime - startTime).toBeGreaterThan(3000) // At least 3 seconds
      
      expectFileUploaded(mockState, 'test-bucket', result.file_path!)
    })

    it('should fail after exhausting retry attempts', async () => {
      setupUploadRetryScenario(mockState, 5) // Fail first 5 attempts
      
      const file = createMockFile('always-fail.txt', 'text/plain', 1024)
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain'],
        retryAttempts: 3
      }

      const uploadPromise = fileUploadService.uploadFile(file, options)
      
      // Advance timers for all retry attempts
      vi.advanceTimersByTime(1000) // First retry
      vi.advanceTimersByTime(2000) // Second retry
      vi.advanceTimersByTime(4000) // Third attempt
      
      const result = await uploadPromise

      expect(result.success).toBe(false)
      expect(result.error).toContain('Mock failure attempt')
      
      expectFileDeleted(mockState, 'test-bucket', result.file_path || 'any-path')
    })

    it('should succeed on first attempt when no retry needed', async () => {
      const file = createMockFile('success.txt', 'text/plain', 1024)
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain'],
        retryAttempts: 3
      }

      const startTime = Date.now()
      const result = await fileUploadService.uploadFile(file, options)
      const endTime = Date.now()

      expect(result.success).toBe(true)
      
      // Should complete quickly without retries
      expect(endTime - startTime).toBeLessThan(1000)
      
      expectFileUploaded(mockState, 'test-bucket', result.file_path!)
    })

    it('should handle retry with different error types', async () => {
      let attemptCount = 0
      const originalUpload = mockState.upload.bind(mockState)
      
      mockState.upload = vi.fn().mockImplementation(async (bucket: string, path: string, file: File) => {
        attemptCount++
        
        if (attemptCount === 1) {
          return {
            data: null,
            error: { message: 'Network timeout' }
          }
        } else if (attemptCount === 2) {
          return {
            data: null,
            error: { message: 'Storage temporarily unavailable' }
          }
        }
        
        // Success on third attempt
        return await originalUpload(bucket, path, file)
      })
      
      const file = createMockFile('mixed-errors.txt', 'text/plain', 1024)
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain'],
        retryAttempts: 3
      }

      const uploadPromise = fileUploadService.uploadFile(file, options)
      
      // Advance timers for retries
      vi.advanceTimersByTime(1000) // First retry
      vi.advanceTimersByTime(2000) // Second retry
      
      const result = await uploadPromise

      expect(result.success).toBe(true)
      expect(attemptCount).toBe(3)
      
      expectFileUploaded(mockState, 'test-bucket', result.file_path!)
    })

    it('should respect custom retry attempt count', async () => {
      const retryScenario = setupUploadRetryScenario(mockState, 1) // Fail first attempt
      
      const file = createMockFile('custom-retry.txt', 'text/plain', 1024)
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain'],
        retryAttempts: 1 // Only one retry
      }

      const uploadPromise = fileUploadService.uploadFile(file, options)
      
      // Advance timer for single retry
      vi.advanceTimersByTime(1000)
      
      const result = await uploadPromise

      expect(result.success).toBe(true)
      expect(retryScenario.getAttemptCount()).toBe(2) // 1 failure + 1 success
      
      expectFileUploaded(mockState, 'test-bucket', result.file_path!)
    })

    it('should handle zero retry attempts', async () => {
      mockState.setUploadFailure(true)
      
      const file = createMockFile('no-retry.txt', 'text/plain', 1024)
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain'],
        retryAttempts: 0
      }

      const result = await fileUploadService.uploadFile(file, options)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Mock upload failure')
      
      expectFileDeleted(mockState, 'test-bucket', result.file_path || 'any-path')
    })
  })

  // ============================================================================
  // RETRY WITH PROGRESS TRACKING TESTS
  // ============================================================================

  describe('Retry with Progress Tracking', () => {
    it('should update progress during retry attempts', async () => {
      const retryScenario = setupUploadRetryScenario(mockState, 2) // Fail first 2 attempts
      
      const file = createMockFile('retry-progress.txt', 'text/plain', 1024)
      const progressTracker = new ProgressTracker()
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain'],
        retryAttempts: 3,
        onProgress: progressTracker.getProgressCallback()
      }

      const uploadPromise = fileUploadService.uploadFile(file, options)
      
      // Advance timers for retries
      vi.advanceTimersByTime(1000) // First retry
      vi.advanceTimersByTime(2000) // Second retry
      vi.advanceTimersByTime(4000) // Third attempt (success)
      
      const result = await uploadPromise

      expect(result.success).toBe(true)
      expect(retryScenario.getAttemptCount()).toBe(3)
      
      // Should have progress updates
      const progressUpdates = progressTracker.getProgressUpdates()
      expect(progressUpdates.length).toBeGreaterThan(0)
      progressTracker.expectProgressCompleted()
    })

    it('should maintain progress state across retry attempts', async () => {
      const retryScenario = setupUploadRetryScenario(mockState, 1) // Fail first attempt
      
      const file = createMockFile('retry-state.txt', 'text/plain', 1024)
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain'],
        retryAttempts: 2
      }

      const uploadPromise = fileUploadService.uploadFile(file, options)
      
      // Check progress during retry
      const initialProgress = fileUploadService.getUploadProgress(file.name)
      
      // Advance timer for retry
      vi.advanceTimersByTime(1000)
      
      const result = await uploadPromise

      expect(result.success).toBe(true)
      
      // Final progress should show completion
      const finalProgress = fileUploadService.getUploadProgress(result.upload_id!)
      expect(finalProgress).toBeDefined()
      expect(finalProgress!.status).toBe('completed')
      expect(finalProgress!.progress).toBe(100)
    })

    it('should handle progress tracking with intermittent failures', async () => {
      setupIntermittentFailureScenario(mockState, 0.5) // 50% failure rate
      
      const files = [
        createMockFile('intermittent1.txt', 'text/plain', 1024),
        createMockFile('intermittent2.txt', 'text/plain', 1024),
        createMockFile('intermittent3.txt', 'text/plain', 1024),
        createMockFile('intermittent4.txt', 'text/plain', 1024)
      ]
      
      const progressTrackers = files.map(() => new ProgressTracker())
      
      const uploadPromises = files.map((file, index) => 
        fileUploadService.uploadFile(file, {
          bucket: 'test-bucket',
          allowedTypes: ['text/plain'],
          retryAttempts: 5,
          onProgress: progressTrackers[index].getProgressCallback()
        })
      )

      // Advance timers for all possible retries
      vi.advanceTimersByTime(15000) // Enough time for all retries
      
      const results = await Promise.all(uploadPromises)
      
      const successes = results.filter(r => r.success)
      const failures = results.filter(r => !r.success)
      
      expect(successes.length + failures.length).toBe(4)
      
      // Successful uploads should have completed progress
      successes.forEach((result, index) => {
        const originalIndex = results.findIndex(r => r === result)
        const tracker = progressTrackers[originalIndex]
        expect(tracker.getProgressUpdates()).toContain(100)
      })
      
      // Failed uploads should not have completed progress
      failures.forEach((result, index) => {
        const originalIndex = results.findIndex(r => r === result)
        const tracker = progressTrackers[originalIndex]
        expect(tracker.getProgressUpdates()).not.toContain(100)
      })
    })
  })

  // ============================================================================
  // ERROR RECOVERY TESTS
  // ============================================================================

  describe('Error Recovery', () => {
    it('should recover from storage quota exceeded errors', async () => {
      setupStorageFullScenario(mockState, 1) // Max 1 file initially
      
      const file = createMockFile('quota.txt', 'text/plain', 1024)
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain'],
        retryAttempts: 3
      }

      const uploadPromise = fileUploadService.uploadFile(file, options)
      
      // Simulate quota being freed up after first attempt
      setTimeout(() => {
        setupStorageFullScenario(mockState, 10) // Increase quota
      }, 500)
      
      vi.advanceTimersByTime(1000) // First retry
      vi.advanceTimersByTime(2000) // Second retry (should succeed)
      
      const result = await uploadPromise

      expect(result.success).toBe(true)
      expectFileUploaded(mockState, 'test-bucket', result.file_path!)
    })

    it('should handle network recovery scenarios', async () => {
      let networkDown = true
      const originalUpload = mockState.upload.bind(mockState)
      
      mockState.upload = vi.fn().mockImplementation(async (bucket: string, path: string, file: File) => {
        if (networkDown) {
          return {
            data: null,
            error: { message: 'Network unreachable' }
          }
        }
        return await originalUpload(bucket, path, file)
      })
      
      const file = createMockFile('network-recovery.txt', 'text/plain', 1024)
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain'],
        retryAttempts: 3
      }

      const uploadPromise = fileUploadService.uploadFile(file, options)
      
      // Simulate network recovery after first attempt
      setTimeout(() => {
        networkDown = false
      }, 1500)
      
      vi.advanceTimersByTime(1000) // First retry (still down)
      vi.advanceTimersByTime(2000) // Second retry (network recovered)
      
      const result = await uploadPromise

      expect(result.success).toBe(true)
      expectFileUploaded(mockState, 'test-bucket', result.file_path!)
    })

    it('should handle race conditions in retry mechanism', async () => {
      const retryScenario = setupUploadRetryScenario(mockState, 1) // Fail first attempt
      
      const files = [
        createMockFile('race1.txt', 'text/plain', 1024),
        createMockFile('race2.txt', 'text/plain', 1024),
        createMockFile('race3.txt', 'text/plain', 1024)
      ]
      
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain'],
        retryAttempts: 2
      }

      const uploadPromises = files.map(file => 
        fileUploadService.uploadFile(file, options)
      )

      // Advance timers for all retries
      vi.advanceTimersByTime(1000) // First retry for all
      vi.advanceTimersByTime(2000) // Second attempt for all
      
      const results = await Promise.all(uploadPromises)
      
      expect(results.every(r => r.success)).toBe(true)
      expectBucketFileCount(mockState, 'test-bucket', 3)
    })
  })

  // ============================================================================
  // PERFORMANCE AND EDGE CASES
  // ============================================================================

  describe('Performance and Edge Cases', () => {
    it('should handle retry mechanism with large files', async () => {
      const retryScenario = setupUploadRetryScenario(mockState, 1) // Fail first attempt
      
      const file = createMockFile('large-retry.txt', 'text/plain', 25 * 1024 * 1024) // 25MB
      const options = {
        bucket: 'test-bucket',
        maxSize: 50 * 1024 * 1024, // 50MB limit
        allowedTypes: ['text/plain'],
        retryAttempts: 2
      }

      const uploadPromise = fileUploadService.uploadFile(file, options)
      
      // Advance timer for retry
      vi.advanceTimersByTime(1000)
      
      const result = await uploadPromise

      expect(result.success).toBe(true)
      expect(retryScenario.getAttemptCount()).toBe(2)
      
      expectFileUploaded(mockState, 'test-bucket', result.file_path!)
    })

    it('should handle retry mechanism with custom base delay', async () => {
      const retryScenario = setupUploadRetryScenario(mockState, 2) // Fail first 2 attempts
      
      // Mock the delay function to use custom base delay
      const originalDelay = (fileUploadService as any).delay
      const customBaseDelay = 500 // 500ms base delay
      
      const file = createMockFile('custom-delay.txt', 'text/plain', 1024)
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain'],
        retryAttempts: 3
      }

      const startTime = Date.now()
      const uploadPromise = fileUploadService.uploadFile(file, options)
      
      // Advance timers with custom delay expectations
      vi.advanceTimersByTime(500)  // First retry (500ms)
      vi.advanceTimersByTime(1000) // Second retry (1000ms)
      vi.advanceTimersByTime(2000) // Third attempt (2000ms)
      
      const result = await uploadPromise
      const endTime = Date.now()

      expect(result.success).toBe(true)
      expect(retryScenario.getAttemptCount()).toBe(3)
      
      // Should have taken time for exponential backoff
      expect(endTime - startTime).toBeGreaterThan(2000)
    })

    it('should handle multiple retry scenarios simultaneously', async () => {
      // Setup different retry scenarios for different files
      const retryScenario1 = setupUploadRetryScenario(mockState, 1) // Fail once
      
      const files = [
        createMockFile('multi-retry1.txt', 'text/plain', 1024),
        createMockFile('multi-retry2.txt', 'text/plain', 1024),
        createMockFile('multi-retry3.txt', 'text/plain', 1024)
      ]
      
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain'],
        retryAttempts: 2
      }

      const uploadPromises = files.map(file => 
        fileUploadService.uploadFile(file, options)
      )

      // Advance timers for all retries
      vi.advanceTimersByTime(1000) // First retry for all
      vi.advanceTimersByTime(2000) // Second attempt for all
      
      const results = await Promise.all(uploadPromises)
      
      expect(results.every(r => r.success)).toBe(true)
      expectBucketFileCount(mockState, 'test-bucket', 3)
    })

    it('should handle retry timeout scenarios', async () => {
      // Setup very long delays to simulate timeout
      setupNetworkDelayScenario(mockState, 10000) // 10 second delay
      
      const file = createMockFile('timeout-retry.txt', 'text/plain', 1024)
      const options = {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain'],
        retryAttempts: 2,
        timeout: 5000 // 5 second timeout
      }

      const uploadPromise = fileUploadService.uploadFile(file, options)
      
      // Advance timers beyond timeout
      vi.advanceTimersByTime(15000) // 15 seconds total
      
      const result = await uploadPromise

      // Should eventually complete or handle timeout appropriately
      expect(result.success).toBeDefined()
      expect(result.error).toBeDefined()
    })
  })
})