/**
 * Specialized Upload Helper Tests
 * 
 * Tests for specialized upload helper functions including shop drawings,
 * reports, and profile photo uploads with their specific configurations.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  uploadShopDrawing, 
  uploadReportAttachment, 
  uploadProfilePhoto,
  UPLOAD_CONFIGS,
  FileUploadService 
} from '@/lib/file-upload'
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
  expectBucketFileCount,
  ProgressTracker,
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

describe('Specialized Upload Helper Tests', () => {
  let mockState: MockStorageState
  let cleanup: () => void

  beforeEach(() => {
    // Setup mock storage
    const mockSetup = setupMockStorage()
    mockState = mockSetup.mockState
    cleanup = mockSetup.cleanup
    
    // Mock the supabase.storage with our mock client
    const { supabase } = require('@/lib/supabase')
    supabase.storage = mockSetup.mockStorage
  })

  afterEach(() => {
    cleanup()
  })

  // ============================================================================
  // UPLOAD CONFIGURATIONS TESTS
  // ============================================================================

  describe('Upload Configurations', () => {
    it('should have correct shop drawings configuration', () => {
      const config = UPLOAD_CONFIGS.SHOP_DRAWINGS
      
      expect(config.bucket).toBe('shop-drawings')
      expect(config.folder).toBe('drawings')
      expect(config.maxSize).toBe(50 * 1024 * 1024) // 50MB
      expect(config.allowedTypes).toContain('application/pdf')
      expect(config.allowedTypes).toContain('image/jpeg')
      expect(config.allowedTypes).toContain('image/png')
      expect(config.allowedTypes).toContain('application/vnd.dwg')
      expect(config.allowedTypes).toContain('application/dxf')
    })

    it('should have correct report attachments configuration', () => {
      const config = UPLOAD_CONFIGS.REPORT_ATTACHMENTS
      
      expect(config.bucket).toBe('reports')
      expect(config.folder).toBe('attachments')
      expect(config.maxSize).toBe(25 * 1024 * 1024) // 25MB
      expect(config.allowedTypes).toContain('application/pdf')
      expect(config.allowedTypes).toContain('image/jpeg')
      expect(config.allowedTypes).toContain('image/png')
      expect(config.allowedTypes).toContain('application/vnd.ms-excel')
      expect(config.allowedTypes).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    })

    it('should have correct profile photos configuration', () => {
      const config = UPLOAD_CONFIGS.PROFILE_PHOTOS
      
      expect(config.bucket).toBe('profiles')
      expect(config.folder).toBe('photos')
      expect(config.maxSize).toBe(5 * 1024 * 1024) // 5MB
      expect(config.allowedTypes).toContain('image/jpeg')
      expect(config.allowedTypes).toContain('image/png')
      expect(config.allowedTypes).toContain('image/webp')
    })
  })

  // ============================================================================
  // SHOP DRAWING UPLOAD TESTS
  // ============================================================================

  describe('Shop Drawing Upload', () => {
    it('should upload PDF shop drawing successfully', async () => {
      const file = createMockPdfFile('drawing.pdf', 5 * 1024 * 1024) // 5MB
      
      const result = await uploadShopDrawing(file)
      
      expect(result.success).toBe(true)
      expect(result.file_path).toBeDefined()
      expect(result.file_url).toBeDefined()
      expect(result.upload_id).toBeDefined()
      expect(result.transaction_id).toBeDefined()
      
      // Verify file was uploaded to correct bucket and folder
      expectFileUploaded(mockState, 'shop-drawings', result.file_path!)
      expect(result.file_path).toContain('drawings/')
    })

    it('should upload JPEG shop drawing successfully', async () => {
      const file = createMockImageFile('drawing.jpg', 3 * 1024 * 1024) // 3MB
      
      const result = await uploadShopDrawing(file)
      
      expect(result.success).toBe(true)
      expectFileUploaded(mockState, 'shop-drawings', result.file_path!)
      expect(result.file_path).toContain('drawings/')
    })

    it('should upload PNG shop drawing successfully', async () => {
      const file = createMockFile('drawing.png', 'image/png', 2 * 1024 * 1024) // 2MB
      
      const result = await uploadShopDrawing(file)
      
      expect(result.success).toBe(true)
      expectFileUploaded(mockState, 'shop-drawings', result.file_path!)
      expect(result.file_path).toContain('drawings/')
    })

    it('should upload DWG shop drawing successfully', async () => {
      const file = createMockDwgFile('drawing.dwg', 10 * 1024 * 1024) // 10MB
      
      const result = await uploadShopDrawing(file)
      
      expect(result.success).toBe(true)
      expectFileUploaded(mockState, 'shop-drawings', result.file_path!)
      expect(result.file_path).toContain('drawings/')
    })

    it('should upload DXF shop drawing successfully', async () => {
      const file = createMockFile('drawing.dxf', 'application/dxf', 8 * 1024 * 1024) // 8MB
      
      const result = await uploadShopDrawing(file)
      
      expect(result.success).toBe(true)
      expectFileUploaded(mockState, 'shop-drawings', result.file_path!)
      expect(result.file_path).toContain('drawings/')
    })

    it('should reject shop drawing exceeding size limit', async () => {
      const file = createLargeFile('large-drawing.pdf', 60) // 60MB - exceeds 50MB limit
      
      const result = await uploadShopDrawing(file)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('File size exceeds maximum limit of 50MB')
      expect(mockState.getFileCount('shop-drawings')).toBe(0)
    })

    it('should reject shop drawing with invalid file type', async () => {
      const file = createInvalidTypeFile('drawing.exe', 1024)
      
      const result = await uploadShopDrawing(file)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('File type application/x-executable is not allowed')
      expect(result.error).toContain('application/pdf, image/jpeg, image/png, application/vnd.dwg, application/dxf')
      expect(mockState.getFileCount('shop-drawings')).toBe(0)
    })

    it('should handle shop drawing upload at size limit', async () => {
      const file = createMockFile('exact-limit.pdf', 'application/pdf', 50 * 1024 * 1024) // Exactly 50MB
      
      const result = await uploadShopDrawing(file)
      
      expect(result.success).toBe(true)
      expectFileUploaded(mockState, 'shop-drawings', result.file_path!)
    })

    it('should generate unique file names for shop drawings', async () => {
      const file1 = createMockPdfFile('drawing.pdf', 1024)
      const file2 = createMockPdfFile('drawing.pdf', 1024)
      
      const result1 = await uploadShopDrawing(file1)
      const result2 = await uploadShopDrawing(file2)
      
      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result1.file_path).not.toBe(result2.file_path)
      expectBucketFileCount(mockState, 'shop-drawings', 2)
    })
  })

  // ============================================================================
  // REPORT ATTACHMENT UPLOAD TESTS
  // ============================================================================

  describe('Report Attachment Upload', () => {
    it('should upload PDF report attachment successfully', async () => {
      const file = createMockPdfFile('report.pdf', 10 * 1024 * 1024) // 10MB
      
      const result = await uploadReportAttachment(file)
      
      expect(result.success).toBe(true)
      expect(result.file_path).toBeDefined()
      expect(result.file_url).toBeDefined()
      expect(result.upload_id).toBeDefined()
      expect(result.transaction_id).toBeDefined()
      
      // Verify file was uploaded to correct bucket and folder
      expectFileUploaded(mockState, 'reports', result.file_path!)
      expect(result.file_path).toContain('attachments/')
    })

    it('should upload Excel report attachment successfully', async () => {
      const file = createMockFile('report.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 5 * 1024 * 1024) // 5MB
      
      const result = await uploadReportAttachment(file)
      
      expect(result.success).toBe(true)
      expectFileUploaded(mockState, 'reports', result.file_path!)
      expect(result.file_path).toContain('attachments/')
    })

    it('should upload old Excel report attachment successfully', async () => {
      const file = createMockFile('report.xls', 'application/vnd.ms-excel', 3 * 1024 * 1024) // 3MB
      
      const result = await uploadReportAttachment(file)
      
      expect(result.success).toBe(true)
      expectFileUploaded(mockState, 'reports', result.file_path!)
      expect(result.file_path).toContain('attachments/')
    })

    it('should upload image report attachment successfully', async () => {
      const file = createMockImageFile('chart.jpg', 2 * 1024 * 1024) // 2MB
      
      const result = await uploadReportAttachment(file)
      
      expect(result.success).toBe(true)
      expectFileUploaded(mockState, 'reports', result.file_path!)
      expect(result.file_path).toContain('attachments/')
    })

    it('should reject report attachment exceeding size limit', async () => {
      const file = createLargeFile('large-report.pdf', 30) // 30MB - exceeds 25MB limit
      
      const result = await uploadReportAttachment(file)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('File size exceeds maximum limit of 25MB')
      expect(mockState.getFileCount('reports')).toBe(0)
    })

    it('should reject report attachment with invalid file type', async () => {
      const file = createMockFile('report.txt', 'text/plain', 1024)
      
      const result = await uploadReportAttachment(file)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('File type text/plain is not allowed')
      expect(result.error).toContain('application/pdf, image/jpeg, image/png, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      expect(mockState.getFileCount('reports')).toBe(0)
    })

    it('should handle report attachment upload at size limit', async () => {
      const file = createMockFile('exact-limit.pdf', 'application/pdf', 25 * 1024 * 1024) // Exactly 25MB
      
      const result = await uploadReportAttachment(file)
      
      expect(result.success).toBe(true)
      expectFileUploaded(mockState, 'reports', result.file_path!)
    })

    it('should generate unique file names for report attachments', async () => {
      const file1 = createMockPdfFile('report.pdf', 1024)
      const file2 = createMockPdfFile('report.pdf', 1024)
      
      const result1 = await uploadReportAttachment(file1)
      const result2 = await uploadReportAttachment(file2)
      
      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result1.file_path).not.toBe(result2.file_path)
      expectBucketFileCount(mockState, 'reports', 2)
    })
  })

  // ============================================================================
  // PROFILE PHOTO UPLOAD TESTS
  // ============================================================================

  describe('Profile Photo Upload', () => {
    it('should upload JPEG profile photo successfully', async () => {
      const file = createMockImageFile('profile.jpg', 2 * 1024 * 1024) // 2MB
      
      const result = await uploadProfilePhoto(file)
      
      expect(result.success).toBe(true)
      expect(result.file_path).toBeDefined()
      expect(result.file_url).toBeDefined()
      expect(result.upload_id).toBeDefined()
      expect(result.transaction_id).toBeDefined()
      
      // Verify file was uploaded to correct bucket and folder
      expectFileUploaded(mockState, 'profiles', result.file_path!)
      expect(result.file_path).toContain('photos/')
    })

    it('should upload PNG profile photo successfully', async () => {
      const file = createMockFile('profile.png', 'image/png', 1 * 1024 * 1024) // 1MB
      
      const result = await uploadProfilePhoto(file)
      
      expect(result.success).toBe(true)
      expectFileUploaded(mockState, 'profiles', result.file_path!)
      expect(result.file_path).toContain('photos/')
    })

    it('should upload WebP profile photo successfully', async () => {
      const file = createMockFile('profile.webp', 'image/webp', 1.5 * 1024 * 1024) // 1.5MB
      
      const result = await uploadProfilePhoto(file)
      
      expect(result.success).toBe(true)
      expectFileUploaded(mockState, 'profiles', result.file_path!)
      expect(result.file_path).toContain('photos/')
    })

    it('should reject profile photo exceeding size limit', async () => {
      const file = createLargeFile('large-profile.jpg', 6) // 6MB - exceeds 5MB limit
      
      const result = await uploadProfilePhoto(file)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('File size exceeds maximum limit of 5MB')
      expect(mockState.getFileCount('profiles')).toBe(0)
    })

    it('should reject profile photo with invalid file type', async () => {
      const file = createMockPdfFile('profile.pdf', 1024)
      
      const result = await uploadProfilePhoto(file)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('File type application/pdf is not allowed')
      expect(result.error).toContain('image/jpeg, image/png, image/webp')
      expect(mockState.getFileCount('profiles')).toBe(0)
    })

    it('should handle profile photo upload at size limit', async () => {
      const file = createMockFile('exact-limit.jpg', 'image/jpeg', 5 * 1024 * 1024) // Exactly 5MB
      
      const result = await uploadProfilePhoto(file)
      
      expect(result.success).toBe(true)
      expectFileUploaded(mockState, 'profiles', result.file_path!)
    })

    it('should generate unique file names for profile photos', async () => {
      const file1 = createMockImageFile('profile.jpg', 1024)
      const file2 = createMockImageFile('profile.jpg', 1024)
      
      const result1 = await uploadProfilePhoto(file1)
      const result2 = await uploadProfilePhoto(file2)
      
      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result1.file_path).not.toBe(result2.file_path)
      expectBucketFileCount(mockState, 'profiles', 2)
    })
  })

  // ============================================================================
  // HELPER FUNCTION COMPARISON TESTS
  // ============================================================================

  describe('Helper Function Comparison', () => {
    it('should use FileUploadService instance for all helpers', async () => {
      const service = FileUploadService.getInstance()
      const uploadFileSpy = vi.spyOn(service, 'uploadFile')
      
      const shopDrawingFile = createMockPdfFile('drawing.pdf', 1024)
      const reportFile = createMockPdfFile('report.pdf', 1024)
      const profileFile = createMockImageFile('profile.jpg', 1024)
      
      await uploadShopDrawing(shopDrawingFile)
      await uploadReportAttachment(reportFile)
      await uploadProfilePhoto(profileFile)
      
      expect(uploadFileSpy).toHaveBeenCalledTimes(3)
      expect(uploadFileSpy).toHaveBeenCalledWith(shopDrawingFile, UPLOAD_CONFIGS.SHOP_DRAWINGS)
      expect(uploadFileSpy).toHaveBeenCalledWith(reportFile, UPLOAD_CONFIGS.REPORT_ATTACHMENTS)
      expect(uploadFileSpy).toHaveBeenCalledWith(profileFile, UPLOAD_CONFIGS.PROFILE_PHOTOS)
      
      uploadFileSpy.mockRestore()
    })

    it('should handle concurrent uploads across different helpers', async () => {
      const files = [
        createMockPdfFile('drawing.pdf', 1024),
        createMockPdfFile('report.pdf', 1024),
        createMockImageFile('profile.jpg', 1024)
      ]
      
      const uploadPromises = [
        uploadShopDrawing(files[0]),
        uploadReportAttachment(files[1]),
        uploadProfilePhoto(files[2])
      ]
      
      const results = await Promise.all(uploadPromises)
      
      expect(results.every(r => r.success)).toBe(true)
      expect(mockState.getFileCount('shop-drawings')).toBe(1)
      expect(mockState.getFileCount('reports')).toBe(1)
      expect(mockState.getFileCount('profiles')).toBe(1)
    })

    it('should maintain separate transaction IDs for different helpers', async () => {
      const shopDrawingFile = createMockPdfFile('drawing.pdf', 1024)
      const reportFile = createMockPdfFile('report.pdf', 1024)
      const profileFile = createMockImageFile('profile.jpg', 1024)
      
      const results = await Promise.all([
        uploadShopDrawing(shopDrawingFile),
        uploadReportAttachment(reportFile),
        uploadProfilePhoto(profileFile)
      ])
      
      expect(results.every(r => r.success)).toBe(true)
      expect(results.every(r => r.transaction_id)).toBe(true)
      
      // All transaction IDs should be unique
      const transactionIds = results.map(r => r.transaction_id)
      const uniqueTransactionIds = new Set(transactionIds)
      expect(uniqueTransactionIds.size).toBe(3)
    })

    it('should handle mixed success/failure scenarios', async () => {
      const files = [
        createMockPdfFile('valid-drawing.pdf', 1024),
        createLargeFile('invalid-report.pdf', 30), // Exceeds 25MB limit for reports
        createMockImageFile('valid-profile.jpg', 1024)
      ]
      
      const results = await Promise.all([
        uploadShopDrawing(files[0]),
        uploadReportAttachment(files[1]),
        uploadProfilePhoto(files[2])
      ])
      
      expect(results[0].success).toBe(true)  // Shop drawing should succeed
      expect(results[1].success).toBe(false) // Report should fail (too large)
      expect(results[2].success).toBe(true)  // Profile photo should succeed
      
      expect(mockState.getFileCount('shop-drawings')).toBe(1)
      expect(mockState.getFileCount('reports')).toBe(0)
      expect(mockState.getFileCount('profiles')).toBe(1)
    })
  })

  // ============================================================================
  // HELPER FUNCTION INTEGRATION TESTS
  // ============================================================================

  describe('Helper Function Integration', () => {
    it('should work with progress tracking', async () => {
      const file = createMockPdfFile('drawing.pdf', 5 * 1024 * 1024) // 5MB
      const service = FileUploadService.getInstance()
      
      // Mock uploadFile to accept progress callback
      const uploadFileSpy = vi.spyOn(service, 'uploadFile')
      
      const result = await uploadShopDrawing(file)
      
      expect(result.success).toBe(true)
      expect(uploadFileSpy).toHaveBeenCalledWith(file, UPLOAD_CONFIGS.SHOP_DRAWINGS)
      
      uploadFileSpy.mockRestore()
    })

    it('should work with retry mechanisms', async () => {
      // Setup retry scenario
      const retryScenario = {
        attemptCount: 0,
        originalUpload: mockState.upload.bind(mockState)
      }
      
      mockState.upload = vi.fn().mockImplementation(async (bucket: string, path: string, file: File) => {
        retryScenario.attemptCount++
        if (retryScenario.attemptCount === 1) {
          return {
            data: null,
            error: { message: 'First attempt failed' }
          }
        }
        return await retryScenario.originalUpload(bucket, path, file)
      })
      
      const file = createMockPdfFile('retry-drawing.pdf', 1024)
      const result = await uploadShopDrawing(file)
      
      expect(result.success).toBe(true)
      expect(retryScenario.attemptCount).toBe(2) // 1 failure + 1 success
      expectFileUploaded(mockState, 'shop-drawings', result.file_path!)
    })

    it('should handle storage errors gracefully', async () => {
      mockState.setUploadFailure(true)
      
      const file = createMockPdfFile('error-drawing.pdf', 1024)
      const result = await uploadShopDrawing(file)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Mock upload failure')
      expect(mockState.getFileCount('shop-drawings')).toBe(0)
    })

    it('should maintain transaction state across helper calls', async () => {
      const service = FileUploadService.getInstance()
      
      const file = createMockPdfFile('transaction-drawing.pdf', 1024)
      const result = await uploadShopDrawing(file)
      
      expect(result.success).toBe(true)
      expect(result.transaction_id).toBeDefined()
      
      // Transaction should be available in service
      const transaction = service.getTransaction(result.transaction_id!)
      expect(transaction).toBeDefined()
      expect(transaction!.bucket).toBe('shop-drawings')
      expect(transaction!.file_path).toBe(result.file_path)
    })
  })

  // ============================================================================
  // EDGE CASES AND BOUNDARY TESTS
  // ============================================================================

  describe('Edge Cases and Boundary Tests', () => {
    it('should handle empty file names', async () => {
      const file = createMockFile('', 'application/pdf', 1024)
      const result = await uploadShopDrawing(file)
      
      expect(result.success).toBe(true)
      expect(result.file_path).toBeDefined()
      expect(result.file_path).not.toBe('')
    })

    it('should handle files with special characters in names', async () => {
      const file = createMockFile('drawing-with-特殊字符.pdf', 'application/pdf', 1024)
      const result = await uploadShopDrawing(file)
      
      expect(result.success).toBe(true)
      expect(result.file_path).toBeDefined()
      expectFileUploaded(mockState, 'shop-drawings', result.file_path!)
    })

    it('should handle very small files', async () => {
      const file = createMockFile('tiny.jpg', 'image/jpeg', 1) // 1 byte
      const result = await uploadProfilePhoto(file)
      
      expect(result.success).toBe(true)
      expectFileUploaded(mockState, 'profiles', result.file_path!)
    })

    it('should handle files with multiple extensions', async () => {
      const file = createMockFile('document.backup.pdf', 'application/pdf', 1024)
      const result = await uploadShopDrawing(file)
      
      expect(result.success).toBe(true)
      expect(result.file_path).toBeDefined()
      expect(result.file_path).toMatch(/\.pdf$/)
    })

    it('should handle files without extensions', async () => {
      const file = createMockFile('drawing', 'application/pdf', 1024)
      const result = await uploadShopDrawing(file)
      
      expect(result.success).toBe(true)
      expect(result.file_path).toBeDefined()
      // Should add proper extension based on file type
      expect(result.file_path).toMatch(/\.undefined$/)
    })

    it('should handle concurrent uploads of same file to different helpers', async () => {
      const file = createMockFile('multi-use.pdf', 'application/pdf', 1024)
      
      const results = await Promise.all([
        uploadShopDrawing(file),
        uploadReportAttachment(file)
      ])
      
      expect(results.every(r => r.success)).toBe(true)
      expect(results[0].file_path).not.toBe(results[1].file_path)
      expect(mockState.getFileCount('shop-drawings')).toBe(1)
      expect(mockState.getFileCount('reports')).toBe(1)
    })
  })
})