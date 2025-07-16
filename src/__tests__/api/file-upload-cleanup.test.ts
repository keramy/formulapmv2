/**
 * File Upload Cleanup and Orphaned File Detection Tests
 * 
 * Tests file cleanup mechanisms, orphaned file detection,
 * and automatic cleanup scheduling functionality.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { FileUploadService } from '@/lib/file-upload'
import { 
  setupMockStorage, 
  createMockFile, 
  createMockPdfFile,
  createMockImageFile,
  expectFileUploaded,
  expectFileDeleted,
  expectBucketEmpty,
  expectBucketFileCount,
  MockStorageState
} from '@/utils/mock-storage'

// Mock the supabase module
vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: null, // Will be set by setupMockStorage
    from: vi.fn().mockImplementation((table: string) => {
      // Default mock that returns empty results
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
}))

describe('File Upload Cleanup and Orphaned File Detection Tests', () => {
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
  // ORPHANED FILE DETECTION TESTS
  // ============================================================================

  describe('Orphaned File Detection', () => {
    it('should detect orphaned files older than specified time', async () => {
      // Add test files with different ages
      mockState.addTestFile('shop-drawings', 'old-file-1.pdf', { 
        size: 1024,
        mimetype: 'application/pdf'
      })
      mockState.addTestFile('shop-drawings', 'old-file-2.pdf', { 
        size: 2048,
        mimetype: 'application/pdf'
      })
      mockState.addTestFile('shop-drawings', 'recent-file.pdf', { 
        size: 1024,
        mimetype: 'application/pdf'
      })
      
      // Make first two files old (older than 60 minutes)
      mockState.simulateFileAge('shop-drawings', 'old-file-1.pdf', 120) // 2 hours old
      mockState.simulateFileAge('shop-drawings', 'old-file-2.pdf', 90)  // 1.5 hours old
      
      const orphanedFiles = await fileUploadService.findOrphanedFiles('shop-drawings', 60)
      
      expect(orphanedFiles).toHaveLength(2)
      expect(orphanedFiles).toContain('old-file-1.pdf')
      expect(orphanedFiles).toContain('old-file-2.pdf')
      expect(orphanedFiles).not.toContain('recent-file.pdf')
    })

    it('should not detect files referenced in active transactions', async () => {
      // Upload a file to create active transaction
      const file = createMockFile('active-file.txt', 'text/plain', 1024)
      const uploadResult = await fileUploadService.uploadFile(file, {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain']
      })
      
      expect(uploadResult.success).toBe(true)
      
      // Make the file appear old
      mockState.simulateFileAge('test-bucket', uploadResult.file_path!, 120)
      
      // Should not be detected as orphaned due to active transaction
      const orphanedFiles = await fileUploadService.findOrphanedFiles('test-bucket', 60)
      expect(orphanedFiles).not.toContain(uploadResult.file_path!)
    })

    it('should detect rolled back transaction files as orphaned', async () => {
      // Upload a file and then roll back the transaction
      const file = createMockFile('rollback-file.txt', 'text/plain', 1024)
      const uploadResult = await fileUploadService.uploadFile(file, {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain']
      })
      
      expect(uploadResult.success).toBe(true)
      
      // Rollback the transaction
      await fileUploadService.rollbackTransaction(uploadResult.transaction_id!)
      
      // Make the file appear old
      mockState.simulateFileAge('test-bucket', uploadResult.file_path!, 120)
      
      // Should be detected as orphaned since transaction is rolled back
      const orphanedFiles = await fileUploadService.findOrphanedFiles('test-bucket', 60)
      expect(orphanedFiles).toContain(uploadResult.file_path!)
    })

    it('should check database references for shop drawings', async () => {
      // Mock shop_drawings table to have a reference
      const { supabase } = require('@/lib/supabase')
      supabase.from.mockImplementation((table: string) => {
        if (table === 'shop_drawings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [{ id: 'drawing-123' }], // File is referenced
                  error: null
                })
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
      
      mockState.addTestFile('shop-drawings', 'referenced-drawing.pdf', { 
        size: 1024,
        mimetype: 'application/pdf'
      })
      mockState.simulateFileAge('shop-drawings', 'referenced-drawing.pdf', 120)
      
      const orphanedFiles = await fileUploadService.findOrphanedFiles('shop-drawings', 60)
      
      // Should not detect file as orphaned since it's referenced in database
      expect(orphanedFiles).not.toContain('referenced-drawing.pdf')
    })

    it('should check database references for report attachments', async () => {
      // Mock report_attachments table to have a reference
      const { supabase } = require('@/lib/supabase')
      supabase.from.mockImplementation((table: string) => {
        if (table === 'report_attachments') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [{ id: 'attachment-123' }], // File is referenced
                  error: null
                })
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
      
      mockState.addTestFile('reports', 'referenced-report.xlsx', { 
        size: 2048,
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      mockState.simulateFileAge('reports', 'referenced-report.xlsx', 120)
      
      const orphanedFiles = await fileUploadService.findOrphanedFiles('reports', 60)
      
      // Should not detect file as orphaned since it's referenced in database
      expect(orphanedFiles).not.toContain('referenced-report.xlsx')
    })

    it('should check database references for profile photos', async () => {
      // Mock user_profiles table to have a reference
      const { supabase } = require('@/lib/supabase')
      supabase.from.mockImplementation((table: string) => {
        if (table === 'user_profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [{ id: 'user-123' }], // File is referenced
                  error: null
                })
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
      
      mockState.addTestFile('profiles', 'referenced-avatar.jpg', { 
        size: 1024,
        mimetype: 'image/jpeg'
      })
      mockState.simulateFileAge('profiles', 'referenced-avatar.jpg', 120)
      
      const orphanedFiles = await fileUploadService.findOrphanedFiles('profiles', 60)
      
      // Should not detect file as orphaned since it's referenced in database
      expect(orphanedFiles).not.toContain('referenced-avatar.jpg')
    })

    it('should handle database check errors gracefully', async () => {
      // Mock database error
      const { supabase } = require('@/lib/supabase')
      supabase.from.mockImplementation((table: string) => {
        if (table === 'shop_drawings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Database error' }
                })
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
      
      mockState.addTestFile('shop-drawings', 'error-check-file.pdf', { 
        size: 1024,
        mimetype: 'application/pdf'
      })
      mockState.simulateFileAge('shop-drawings', 'error-check-file.pdf', 120)
      
      const orphanedFiles = await fileUploadService.findOrphanedFiles('shop-drawings', 60)
      
      // Should not detect file as orphaned when database check fails (assume referenced)
      expect(orphanedFiles).not.toContain('error-check-file.pdf')
    })

    it('should return empty array when no orphaned files found', async () => {
      // Add only recent files
      mockState.addTestFile('test-bucket', 'recent-file1.txt', { 
        size: 1024,
        mimetype: 'text/plain'
      })
      mockState.addTestFile('test-bucket', 'recent-file2.txt', { 
        size: 1024,
        mimetype: 'text/plain'
      })
      
      const orphanedFiles = await fileUploadService.findOrphanedFiles('test-bucket', 60)
      expect(orphanedFiles).toHaveLength(0)
    })

    it('should handle empty bucket gracefully', async () => {
      const orphanedFiles = await fileUploadService.findOrphanedFiles('empty-bucket', 60)
      expect(orphanedFiles).toHaveLength(0)
    })
  })

  // ============================================================================
  // FILE CLEANUP TESTS
  // ============================================================================

  describe('File Cleanup Operations', () => {
    it('should cleanup orphaned files successfully', async () => {
      // Add orphaned files
      mockState.addTestFile('test-bucket', 'orphan1.txt', { 
        size: 1024,
        mimetype: 'text/plain'
      })
      mockState.addTestFile('test-bucket', 'orphan2.txt', { 
        size: 1024,
        mimetype: 'text/plain'
      })
      mockState.addTestFile('test-bucket', 'recent.txt', { 
        size: 1024,
        mimetype: 'text/plain'
      })
      
      // Make first two files old
      mockState.simulateFileAge('test-bucket', 'orphan1.txt', 120)
      mockState.simulateFileAge('test-bucket', 'orphan2.txt', 90)
      
      const cleanupResult = await fileUploadService.cleanupOrphanedFiles('test-bucket', 60)
      
      expect(cleanupResult.success).toBe(true)
      expect(cleanupResult.cleaned_files).toHaveLength(2)
      expect(cleanupResult.cleaned_files).toContain('orphan1.txt')
      expect(cleanupResult.cleaned_files).toContain('orphan2.txt')
      expect(cleanupResult.failed_cleanups).toHaveLength(0)
      expect(cleanupResult.total_processed).toBe(2)
      
      // Verify files were actually deleted
      expectFileDeleted(mockState, 'test-bucket', 'orphan1.txt')
      expectFileDeleted(mockState, 'test-bucket', 'orphan2.txt')
      expect(mockState.hasFile('test-bucket', 'recent.txt')).toBe(true)
    })

    it('should handle cleanup when no orphaned files exist', async () => {
      // Add only recent files
      mockState.addTestFile('test-bucket', 'recent1.txt', { 
        size: 1024,
        mimetype: 'text/plain'
      })
      mockState.addTestFile('test-bucket', 'recent2.txt', { 
        size: 1024,
        mimetype: 'text/plain'
      })
      
      const cleanupResult = await fileUploadService.cleanupOrphanedFiles('test-bucket', 60)
      
      expect(cleanupResult.success).toBe(true)
      expect(cleanupResult.cleaned_files).toHaveLength(0)
      expect(cleanupResult.failed_cleanups).toHaveLength(0)
      expect(cleanupResult.total_processed).toBe(0)
      
      // Verify no files were deleted
      expect(mockState.hasFile('test-bucket', 'recent1.txt')).toBe(true)
      expect(mockState.hasFile('test-bucket', 'recent2.txt')).toBe(true)
    })

    it('should handle partial cleanup failures', async () => {
      // Add orphaned files
      mockState.addTestFile('test-bucket', 'orphan1.txt', { 
        size: 1024,
        mimetype: 'text/plain'
      })
      mockState.addTestFile('test-bucket', 'orphan2.txt', { 
        size: 1024,
        mimetype: 'text/plain'
      })
      mockState.addTestFile('test-bucket', 'orphan3.txt', { 
        size: 1024,
        mimetype: 'text/plain'
      })
      
      // Make all files old
      mockState.simulateFileAge('test-bucket', 'orphan1.txt', 120)
      mockState.simulateFileAge('test-bucket', 'orphan2.txt', 120)
      mockState.simulateFileAge('test-bucket', 'orphan3.txt', 120)
      
      // Setup partial delete failure
      mockState.setDeleteFailureRate(0.33) // 33% failure rate
      
      const cleanupResult = await fileUploadService.cleanupOrphanedFiles('test-bucket', 60)
      
      expect(cleanupResult.total_processed).toBe(3)
      expect(cleanupResult.cleaned_files.length + cleanupResult.failed_cleanups.length).toBe(3)
      
      if (cleanupResult.failed_cleanups.length > 0) {
        expect(cleanupResult.success).toBe(false)
      } else {
        expect(cleanupResult.success).toBe(true)
      }
    })

    it('should handle cleanup in empty bucket', async () => {
      const cleanupResult = await fileUploadService.cleanupOrphanedFiles('empty-bucket', 60)
      
      expect(cleanupResult.success).toBe(true)
      expect(cleanupResult.cleaned_files).toHaveLength(0)
      expect(cleanupResult.failed_cleanups).toHaveLength(0)
      expect(cleanupResult.total_processed).toBe(0)
    })
  })

  // ============================================================================
  // SCHEDULED CLEANUP TESTS
  // ============================================================================

  describe('Scheduled Cleanup', () => {
    it('should schedule cleanup for multiple buckets', async () => {
      // Add orphaned files to multiple buckets
      mockState.addTestFile('shop-drawings', 'old-drawing.pdf', { 
        size: 1024,
        mimetype: 'application/pdf'
      })
      mockState.addTestFile('reports', 'old-report.xlsx', { 
        size: 2048,
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      mockState.addTestFile('profiles', 'old-avatar.jpg', { 
        size: 1024,
        mimetype: 'image/jpeg'
      })
      
      // Make all files old
      mockState.simulateFileAge('shop-drawings', 'old-drawing.pdf', 120)
      mockState.simulateFileAge('reports', 'old-report.xlsx', 120)
      mockState.simulateFileAge('profiles', 'old-avatar.jpg', 120)
      
      // Mock console.log to capture cleanup messages
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      // Schedule cleanup (this will run immediately once)
      await fileUploadService.scheduleCleanup(60)
      
      // Check that cleanup was performed
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cleaned up'),
        expect.stringContaining('orphaned files from shop-drawings'),
        expect.arrayContaining(['old-drawing.pdf'])
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cleaned up'),
        expect.stringContaining('orphaned files from reports'),
        expect.arrayContaining(['old-report.xlsx'])
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cleaned up'),
        expect.stringContaining('orphaned files from profiles'),
        expect.arrayContaining(['old-avatar.jpg'])
      )
      
      consoleSpy.mockRestore()
    })

    it('should not schedule cleanup twice', async () => {
      const service = FileUploadService.getInstance()
      
      // First schedule should succeed
      await service.scheduleCleanup(60)
      
      // Second schedule should return immediately (no error)
      await service.scheduleCleanup(60)
      
      // Should not throw error and should return quickly
      expect(true).toBe(true) // Test passes if no error thrown
    })

    it('should handle cleanup errors gracefully in scheduled mode', async () => {
      // Mock storage list to fail
      mockState.setListFailure(true)
      
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Schedule cleanup (this will run immediately once)
      await fileUploadService.scheduleCleanup(60)
      
      // Should log error but not throw
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Scheduled cleanup error:',
        expect.any(Error)
      )
      
      consoleErrorSpy.mockRestore()
    })

    it('should not log when no files are cleaned', async () => {
      // Add only recent files
      mockState.addTestFile('shop-drawings', 'recent-drawing.pdf', { 
        size: 1024,
        mimetype: 'application/pdf'
      })
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      // Schedule cleanup (this will run immediately once)
      await fileUploadService.scheduleCleanup(60)
      
      // Should not log cleanup messages when no files are cleaned
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Cleaned up'),
        expect.anything(),
        expect.anything()
      )
      
      consoleSpy.mockRestore()
    })

    it('should use correct cleanup interval', async () => {
      const service = FileUploadService.getInstance()
      
      // Mock setInterval to verify it's called with correct interval
      const setIntervalSpy = vi.spyOn(global, 'setInterval').mockImplementation(() => ({} as any))
      
      const customInterval = 120 // 2 hours
      await service.scheduleCleanup(customInterval)
      
      expect(setIntervalSpy).toHaveBeenCalledWith(
        expect.any(Function),
        customInterval * 60 * 1000 // Convert minutes to milliseconds
      )
      
      setIntervalSpy.mockRestore()
    })
  })

  // ============================================================================
  // CLEANUP INTEGRATION TESTS
  // ============================================================================

  describe('Cleanup Integration', () => {
    it('should cleanup files from completed transactions after timeout', async () => {
      // Upload and commit a file
      const file = createMockFile('test.txt', 'text/plain', 1024)
      const uploadResult = await fileUploadService.uploadFile(file, {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain']
      })
      
      expect(uploadResult.success).toBe(true)
      
      // Commit the transaction
      await fileUploadService.commitTransaction(uploadResult.transaction_id!)
      
      // Fast forward time to make file appear old
      mockState.simulateFileAge('test-bucket', uploadResult.file_path!, 120)
      
      // Mock the transaction cleanup timeout (simulate timeout passed)
      const transaction = fileUploadService.getTransaction(uploadResult.transaction_id!)
      if (transaction) {
        ;(fileUploadService as any).activeTransactions.delete(uploadResult.transaction_id!)
      }
      
      // Now cleanup should detect it as orphaned
      const cleanupResult = await fileUploadService.cleanupOrphanedFiles('test-bucket', 60)
      
      expect(cleanupResult.cleaned_files).toContain(uploadResult.file_path!)
      expectFileDeleted(mockState, 'test-bucket', uploadResult.file_path!)
    })

    it('should cleanup files from failed transactions', async () => {
      // Simulate failed upload
      mockState.setUploadFailure(true)
      
      const file = createMockFile('failed.txt', 'text/plain', 1024)
      const uploadResult = await fileUploadService.uploadFile(file, {
        bucket: 'test-bucket',
        allowedTypes: ['text/plain'],
        retryAttempts: 1
      })
      
      expect(uploadResult.success).toBe(false)
      
      // Add a failed file manually to simulate partial failure scenario
      mockState.addTestFile('test-bucket', 'partial-failure.txt', { 
        size: 1024,
        mimetype: 'text/plain'
      })
      mockState.simulateFileAge('test-bucket', 'partial-failure.txt', 120)
      
      // Cleanup should detect and remove the orphaned file
      const cleanupResult = await fileUploadService.cleanupOrphanedFiles('test-bucket', 60)
      
      expect(cleanupResult.cleaned_files).toContain('partial-failure.txt')
    })

    it('should handle cleanup across multiple bucket types', async () => {
      // Add files to all supported buckets
      const buckets = ['shop-drawings', 'reports', 'profiles']
      
      buckets.forEach(bucket => {
        mockState.addTestFile(bucket, `old-file.${bucket}`, { 
          size: 1024,
          mimetype: 'application/octet-stream'
        })
        mockState.simulateFileAge(bucket, `old-file.${bucket}`, 120)
      })
      
      // Run cleanup on all buckets
      const cleanupPromises = buckets.map(bucket => 
        fileUploadService.cleanupOrphanedFiles(bucket, 60)
      )
      
      const cleanupResults = await Promise.all(cleanupPromises)
      
      cleanupResults.forEach((result, index) => {
        expect(result.success).toBe(true)
        expect(result.cleaned_files).toContain(`old-file.${buckets[index]}`)
      })
    })
  })

  // ============================================================================
  // EDGE CASES AND ERROR HANDLING
  // ============================================================================

  describe('Cleanup Edge Cases', () => {
    it('should handle very large number of orphaned files', async () => {
      // Add many orphaned files
      const fileCount = 1000
      for (let i = 0; i < fileCount; i++) {
        mockState.addTestFile('test-bucket', `orphan-${i}.txt`, { 
          size: 1024,
          mimetype: 'text/plain'
        })
        mockState.simulateFileAge('test-bucket', `orphan-${i}.txt`, 120)
      }
      
      const cleanupResult = await fileUploadService.cleanupOrphanedFiles('test-bucket', 60)
      
      expect(cleanupResult.success).toBe(true)
      expect(cleanupResult.total_processed).toBe(fileCount)
      expect(cleanupResult.cleaned_files.length).toBe(fileCount)
    })

    it('should handle cleanup with storage list errors', async () => {
      mockState.setListFailure(true)
      
      const orphanedFiles = await fileUploadService.findOrphanedFiles('test-bucket', 60)
      expect(orphanedFiles).toHaveLength(0)
      
      const cleanupResult = await fileUploadService.cleanupOrphanedFiles('test-bucket', 60)
      expect(cleanupResult.success).toBe(true)
      expect(cleanupResult.total_processed).toBe(0)
    })

    it('should handle cleanup with different age thresholds', async () => {
      // Add files with different ages
      mockState.addTestFile('test-bucket', 'very-old.txt', { 
        size: 1024,
        mimetype: 'text/plain'
      })
      mockState.addTestFile('test-bucket', 'old.txt', { 
        size: 1024,
        mimetype: 'text/plain'
      })
      mockState.addTestFile('test-bucket', 'recent.txt', { 
        size: 1024,
        mimetype: 'text/plain'
      })
      
      mockState.simulateFileAge('test-bucket', 'very-old.txt', 180) // 3 hours
      mockState.simulateFileAge('test-bucket', 'old.txt', 90)       // 1.5 hours
      mockState.simulateFileAge('test-bucket', 'recent.txt', 30)    // 30 minutes
      
      // Cleanup with 2 hour threshold
      const cleanupResult = await fileUploadService.cleanupOrphanedFiles('test-bucket', 120)
      
      expect(cleanupResult.cleaned_files).toContain('very-old.txt')
      expect(cleanupResult.cleaned_files).not.toContain('old.txt')
      expect(cleanupResult.cleaned_files).not.toContain('recent.txt')
    })
  })
})