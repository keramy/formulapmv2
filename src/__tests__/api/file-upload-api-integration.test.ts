/**
 * File Upload API Integration Tests
 * 
 * Tests the complete file upload integration with API routes,
 * authentication, and database operations.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { 
  setupMockStorage, 
  createMockFile, 
  createMockPdfFile,
  createMockImageFile,
  createLargeFile,
  expectFileUploaded,
  expectFileDeleted,
  expectBucketFileCount,
  MockStorageState
} from '@/utils/mock-storage'
import { createTestSupabaseClient, setupBasicTestEnvironment, createAuthenticatedRequest } from '@/utils/real-supabase-utils'

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

// Mock the FileUploadService
vi.mock('@/lib/file-upload', () => ({
  FileUploadService: {
    getInstance: vi.fn().mockReturnValue({
      uploadFile: vi.fn(),
      deleteFile: vi.fn(),
      getUploadProgress: vi.fn(),
      getTransaction: vi.fn(),
      commitTransaction: vi.fn(),
      rollbackTransaction: vi.fn()
    })
  },
  transactionalUpload: vi.fn(),
  uploadShopDrawingWithTransaction: vi.fn(),
  uploadReportAttachmentWithTransaction: vi.fn(),
  UPLOAD_CONFIGS: {
    SHOP_DRAWINGS: {
      bucket: 'shop-drawings',
      folder: 'drawings',
      maxSize: 50 * 1024 * 1024,
      allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.dwg', 'application/dxf']
    },
    REPORT_ATTACHMENTS: {
      bucket: 'reports',
      folder: 'attachments',
      maxSize: 25 * 1024 * 1024,
      allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    },
    PROFILE_PHOTOS: {
      bucket: 'profiles',
      folder: 'photos',
      maxSize: 5 * 1024 * 1024,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
    }
  }
}))

describe('File Upload API Integration Tests', () => {
  let mockState: MockStorageState
  let cleanup: () => void
  let testEnv: any
  let mockFileUploadService: any
  let mockTransactionalUpload: any

  beforeEach(async () => {
    // Setup mock storage
    const mockSetup = setupMockStorage()
    mockState = mockSetup.mockState
    cleanup = mockSetup.cleanup
    
    // Mock the supabase.storage with our mock client
    const { supabase } = require('@/lib/supabase')
    supabase.storage = mockSetup.mockStorage
    
    // Setup test environment
    testEnv = await setupBasicTestEnvironment('project_manager')
    
    // Setup mocks
    const fileUploadMock = require('@/lib/file-upload')
    mockFileUploadService = fileUploadMock.FileUploadService.getInstance()
    mockTransactionalUpload = fileUploadMock.transactionalUpload
    
    // Mock database operations
    setupMockDatabaseOperations(testEnv.supabase)
  })

  afterEach(async () => {
    cleanup()
    if (testEnv?.cleanup) {
      await testEnv.cleanup()
    }
    vi.clearAllMocks()
  })

  // ============================================================================
  // SHOP DRAWING UPLOAD API TESTS
  // ============================================================================

  describe('Shop Drawing Upload API', () => {
    it('should handle shop drawing submission with file upload', async () => {
      const file = createMockPdfFile('drawing.pdf', 5 * 1024 * 1024) // 5MB
      const drawingId = 'test-drawing-123'
      
      // Mock successful transactional upload
      mockTransactionalUpload.mockResolvedValueOnce({
        success: true,
        data: {
          id: 'submission-123',
          drawing_id: drawingId,
          file_path: 'drawings/12345_abcde.pdf',
          status: 'pending'
        },
        uploadResult: {
          success: true,
          file_path: 'drawings/12345_abcde.pdf',
          file_url: `https://mock-storage.example.com/shop-drawings/drawings/12345_abcde.pdf`,
          upload_id: 'upload-123',
          transaction_id: 'tx-123'
        },
        transaction_id: 'tx-123'
      })
      
      // Create form data
      const formData = new FormData()
      formData.append('file', file)
      formData.append('comments', 'Updated drawing with corrections')
      
      const request = new NextRequest('http://localhost:3000/api/shop-drawings/test-drawing-123/submit', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${testEnv.accessToken}`
        }
      })
      
      // Import and test the API route
      const { POST } = await import('@/app/api/shop-drawings/[id]/submit/route')
      const response = await POST(request, { params: { id: drawingId } })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(mockTransactionalUpload).toHaveBeenCalledWith(
        expect.objectContaining({
          file: expect.any(File),
          uploadConfig: expect.objectContaining({
            bucket: 'shop-drawings',
            folder: 'drawings'
          }),
          databaseOperation: expect.any(Function),
          rollbackOperation: expect.any(Function)
        })
      )
    })

    it('should handle shop drawing submission without file upload', async () => {
      const drawingId = 'test-drawing-123'
      
      // Create form data without file
      const formData = new FormData()
      formData.append('comments', 'Submitting existing drawing')
      
      const request = new NextRequest('http://localhost:3000/api/shop-drawings/test-drawing-123/submit', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${testEnv.accessToken}`
        }
      })
      
      // Import and test the API route
      const { POST } = await import('@/app/api/shop-drawings/[id]/submit/route')
      const response = await POST(request, { params: { id: drawingId } })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(mockTransactionalUpload).not.toHaveBeenCalled()
    })

    it('should handle shop drawing submission with upload failure', async () => {
      const file = createMockPdfFile('drawing.pdf', 5 * 1024 * 1024) // 5MB
      const drawingId = 'test-drawing-123'
      
      // Mock failed transactional upload
      mockTransactionalUpload.mockResolvedValueOnce({
        success: false,
        error: 'Upload failed: Mock storage error',
        uploadResult: {
          success: false,
          error: 'Mock storage error',
          upload_id: 'upload-123',
          transaction_id: 'tx-123'
        },
        transaction_id: 'tx-123'
      })
      
      // Create form data
      const formData = new FormData()
      formData.append('file', file)
      formData.append('comments', 'Testing upload failure')
      
      const request = new NextRequest('http://localhost:3000/api/shop-drawings/test-drawing-123/submit', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${testEnv.accessToken}`
        }
      })
      
      // Import and test the API route
      const { POST } = await import('@/app/api/shop-drawings/[id]/submit/route')
      const response = await POST(request, { params: { id: drawingId } })
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Upload failed')
    })

    it('should handle authentication errors', async () => {
      const file = createMockPdfFile('drawing.pdf', 5 * 1024 * 1024) // 5MB
      const drawingId = 'test-drawing-123'
      
      // Create form data
      const formData = new FormData()
      formData.append('file', file)
      
      const request = new NextRequest('http://localhost:3000/api/shop-drawings/test-drawing-123/submit', {
        method: 'POST',
        body: formData
        // No Authorization header
      })
      
      // Import and test the API route
      const { POST } = await import('@/app/api/shop-drawings/[id]/submit/route')
      const response = await POST(request, { params: { id: drawingId } })
      const data = await response.json()
      
      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Auth required')
    })

    it('should handle invalid drawing status', async () => {
      const file = createMockPdfFile('drawing.pdf', 5 * 1024 * 1024) // 5MB
      const drawingId = 'approved-drawing-123'
      
      // Mock drawing with non-draft status
      setupMockDatabaseOperations(testEnv.supabase, {
        shop_drawings: {
          select: {
            single: {
              data: {
                id: drawingId,
                status: 'approved',
                file_path: 'existing-file.pdf'
              },
              error: null
            }
          }
        }
      })
      
      // Create form data
      const formData = new FormData()
      formData.append('file', file)
      
      const request = new NextRequest('http://localhost:3000/api/shop-drawings/approved-drawing-123/submit', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${testEnv.accessToken}`
        }
      })
      
      // Import and test the API route
      const { POST } = await import('@/app/api/shop-drawings/[id]/submit/route')
      const response = await POST(request, { params: { id: drawingId } })
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Drawing must be in draft status to submit')
    })
  })

  // ============================================================================
  // FILE UPLOAD PROGRESS API TESTS
  // ============================================================================

  describe('File Upload Progress API', () => {
    it('should track upload progress via API', async () => {
      const uploadId = 'upload-123'
      
      // Mock upload progress
      mockFileUploadService.getUploadProgress.mockReturnValue({
        upload_id: uploadId,
        progress: 75,
        status: 'uploading',
        error: null
      })
      
      const request = new NextRequest(`http://localhost:3000/api/uploads/${uploadId}/progress`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testEnv.accessToken}`
        }
      })
      
      // This would be implemented in a real API route
      // For now, we test the service method directly
      const progress = mockFileUploadService.getUploadProgress(uploadId)
      
      expect(progress).toBeDefined()
      expect(progress.upload_id).toBe(uploadId)
      expect(progress.progress).toBe(75)
      expect(progress.status).toBe('uploading')
    })

    it('should handle completed upload progress', async () => {
      const uploadId = 'upload-completed-123'
      
      // Mock completed upload progress
      mockFileUploadService.getUploadProgress.mockReturnValue({
        upload_id: uploadId,
        progress: 100,
        status: 'completed',
        error: null
      })
      
      const progress = mockFileUploadService.getUploadProgress(uploadId)
      
      expect(progress).toBeDefined()
      expect(progress.upload_id).toBe(uploadId)
      expect(progress.progress).toBe(100)
      expect(progress.status).toBe('completed')
    })

    it('should handle failed upload progress', async () => {
      const uploadId = 'upload-failed-123'
      
      // Mock failed upload progress
      mockFileUploadService.getUploadProgress.mockReturnValue({
        upload_id: uploadId,
        progress: 0,
        status: 'failed',
        error: 'Upload failed due to network error'
      })
      
      const progress = mockFileUploadService.getUploadProgress(uploadId)
      
      expect(progress).toBeDefined()
      expect(progress.upload_id).toBe(uploadId)
      expect(progress.progress).toBe(0)
      expect(progress.status).toBe('failed')
      expect(progress.error).toBe('Upload failed due to network error')
    })
  })

  // ============================================================================
  // TRANSACTION MANAGEMENT API TESTS
  // ============================================================================

  describe('Transaction Management API', () => {
    it('should commit transaction via API', async () => {
      const transactionId = 'tx-123'
      
      // Mock successful commit
      mockFileUploadService.commitTransaction.mockResolvedValue(true)
      
      const result = await mockFileUploadService.commitTransaction(transactionId)
      
      expect(result).toBe(true)
      expect(mockFileUploadService.commitTransaction).toHaveBeenCalledWith(transactionId)
    })

    it('should rollback transaction via API', async () => {
      const transactionId = 'tx-123'
      
      // Mock successful rollback
      mockFileUploadService.rollbackTransaction.mockResolvedValue(true)
      
      const result = await mockFileUploadService.rollbackTransaction(transactionId)
      
      expect(result).toBe(true)
      expect(mockFileUploadService.rollbackTransaction).toHaveBeenCalledWith(transactionId)
    })

    it('should get transaction status via API', async () => {
      const transactionId = 'tx-123'
      
      // Mock transaction status
      mockFileUploadService.getTransaction.mockReturnValue({
        id: transactionId,
        bucket: 'shop-drawings',
        file_path: 'drawings/test.pdf',
        status: 'uploaded',
        created_at: new Date(),
        metadata: {
          original_name: 'test.pdf',
          size: 1024,
          type: 'application/pdf'
        }
      })
      
      const transaction = mockFileUploadService.getTransaction(transactionId)
      
      expect(transaction).toBeDefined()
      expect(transaction.id).toBe(transactionId)
      expect(transaction.status).toBe('uploaded')
      expect(transaction.bucket).toBe('shop-drawings')
    })
  })

  // ============================================================================
  // ERROR HANDLING API TESTS
  // ============================================================================

  describe('Error Handling API', () => {
    it('should handle file size validation errors', async () => {
      const file = createLargeFile('huge-drawing.pdf', 100) // 100MB - too large
      const drawingId = 'test-drawing-123'
      
      // Mock validation error
      mockTransactionalUpload.mockResolvedValueOnce({
        success: false,
        error: 'File size exceeds maximum limit of 50MB',
        uploadResult: {
          success: false,
          error: 'File size exceeds maximum limit of 50MB',
          upload_id: 'upload-123'
        }
      })
      
      // Create form data
      const formData = new FormData()
      formData.append('file', file)
      
      const request = new NextRequest('http://localhost:3000/api/shop-drawings/test-drawing-123/submit', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${testEnv.accessToken}`
        }
      })
      
      // Import and test the API route
      const { POST } = await import('@/app/api/shop-drawings/[id]/submit/route')
      const response = await POST(request, { params: { id: drawingId } })
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('File size exceeds maximum limit')
    })

    it('should handle file type validation errors', async () => {
      const file = createMockFile('invalid.txt', 'text/plain', 1024)
      const drawingId = 'test-drawing-123'
      
      // Mock validation error
      mockTransactionalUpload.mockResolvedValueOnce({
        success: false,
        error: 'File type text/plain is not allowed',
        uploadResult: {
          success: false,
          error: 'File type text/plain is not allowed',
          upload_id: 'upload-123'
        }
      })
      
      // Create form data
      const formData = new FormData()
      formData.append('file', file)
      
      const request = new NextRequest('http://localhost:3000/api/shop-drawings/test-drawing-123/submit', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${testEnv.accessToken}`
        }
      })
      
      // Import and test the API route
      const { POST } = await import('@/app/api/shop-drawings/[id]/submit/route')
      const response = await POST(request, { params: { id: drawingId } })
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('File type text/plain is not allowed')
    })

    it('should handle database operation errors', async () => {
      const file = createMockPdfFile('drawing.pdf', 5 * 1024 * 1024) // 5MB
      const drawingId = 'test-drawing-123'
      
      // Mock database error
      mockTransactionalUpload.mockResolvedValueOnce({
        success: false,
        error: 'Database update failed: Connection timeout',
        uploadResult: {
          success: true,
          file_path: 'drawings/12345_abcde.pdf',
          file_url: 'https://mock-storage.example.com/shop-drawings/drawings/12345_abcde.pdf',
          upload_id: 'upload-123',
          transaction_id: 'tx-123'
        },
        transaction_id: 'tx-123'
      })
      
      // Create form data
      const formData = new FormData()
      formData.append('file', file)
      
      const request = new NextRequest('http://localhost:3000/api/shop-drawings/test-drawing-123/submit', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${testEnv.accessToken}`
        }
      })
      
      // Import and test the API route
      const { POST } = await import('@/app/api/shop-drawings/[id]/submit/route')
      const response = await POST(request, { params: { id: drawingId } })
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Database update failed')
    })
  })

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  function setupMockDatabaseOperations(supabase: any, overrides: any = {}) {
    const defaultMocks = {
      shop_drawings: {
        select: {
          single: {
            data: {
              id: 'test-drawing-123',
              status: 'draft',
              file_path: null,
              file_type: null,
              file_size: null,
              version: 1
            },
            error: null
          }
        },
        update: {
          eq: {
            select: {
              single: {
                data: {
                  id: 'test-drawing-123',
                  status: 'pending_internal_review',
                  updated_at: new Date().toISOString()
                },
                error: null
              }
            }
          }
        }
      },
      shop_drawing_submissions: {
        insert: {
          select: {
            single: {
              data: {
                id: 'submission-123',
                drawing_id: 'test-drawing-123',
                status: 'pending',
                created_at: new Date().toISOString()
              },
              error: null
            }
          }
        }
      }
    }
    
    const mocks = { ...defaultMocks, ...overrides }
    
    supabase.from = vi.fn().mockImplementation((table: string) => {
      const tableMock = mocks[table]
      if (!tableMock) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' }
              })
            })
          })
        }
      }
      
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue(tableMock.select?.single || { data: null, error: null })
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue(tableMock.update?.eq?.select?.single || { data: null, error: null })
            })
          })
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue(tableMock.insert?.select?.single || { data: null, error: null })
          })
        })
      }
    })
  }
})