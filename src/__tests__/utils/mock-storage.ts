/**
 * Mock Storage Infrastructure for File Upload Tests
 * 
 * Provides comprehensive mocking for Supabase storage operations
 * to enable reliable file upload testing without actual storage calls.
 */

import { vi } from 'vitest'

// ============================================================================
// MOCK STORAGE TYPES
// ============================================================================

export interface MockStorageFile {
  name: string
  id: string
  size: number
  mimetype: string
  bucket_id: string
  created_at: string
  updated_at: string
  last_accessed_at: string
  metadata: Record<string, any>
}

export interface MockStorageUploadResult {
  data: { path: string; id: string; fullPath: string } | null
  error: { message: string } | null
}

export interface MockStorageDeleteResult {
  data: { path: string }[] | null
  error: { message: string } | null
}

export interface MockStorageListResult {
  data: MockStorageFile[] | null
  error: { message: string } | null
}

export interface MockStorageSignedUrlResult {
  data: { signedUrl: string } | null
  error: { message: string } | null
}

export interface MockStoragePublicUrlResult {
  data: { publicUrl: string }
}

// ============================================================================
// MOCK STORAGE STATE MANAGEMENT
// ============================================================================

export class MockStorageState {
  private static instance: MockStorageState
  private files: Map<string, Map<string, MockStorageFile>> = new Map() // bucket -> files
  private uploadDelay = 0
  private shouldFailUpload = false
  private shouldFailDelete = false
  private shouldFailList = false
  private shouldFailSignedUrl = false
  private uploadFailureRate = 0
  private deleteFailureRate = 0

  static getInstance(): MockStorageState {
    if (!MockStorageState.instance) {
      MockStorageState.instance = new MockStorageState()
    }
    return MockStorageState.instance
  }

  reset(): void {
    this.files.clear()
    this.uploadDelay = 0
    this.shouldFailUpload = false
    this.shouldFailDelete = false
    this.shouldFailList = false
    this.shouldFailSignedUrl = false
    this.uploadFailureRate = 0
    this.deleteFailureRate = 0
  }

  // Configuration methods
  setUploadDelay(ms: number): void {
    this.uploadDelay = ms
  }

  setUploadFailure(shouldFail: boolean): void {
    this.shouldFailUpload = shouldFail
  }

  setDeleteFailure(shouldFail: boolean): void {
    this.shouldFailDelete = shouldFail
  }

  setListFailure(shouldFail: boolean): void {
    this.shouldFailList = shouldFail
  }

  setSignedUrlFailure(shouldFail: boolean): void {
    this.shouldFailSignedUrl = shouldFail
  }

  setUploadFailureRate(rate: number): void {
    this.uploadFailureRate = rate
  }

  setDeleteFailureRate(rate: number): void {
    this.deleteFailureRate = rate
  }

  // Storage operations
  async upload(bucket: string, path: string, file: File): Promise<MockStorageUploadResult> {
    if (this.uploadDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.uploadDelay))
    }

    if (this.shouldFailUpload || Math.random() < this.uploadFailureRate) {
      return {
        data: null,
        error: { message: 'Mock upload failure' }
      }
    }

    const bucketFiles = this.files.get(bucket) || new Map()
    
    // Check if file already exists (upsert: false behavior)
    if (bucketFiles.has(path)) {
      return {
        data: null,
        error: { message: 'File already exists' }
      }
    }

    const mockFile: MockStorageFile = {
      name: path,
      id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      size: file.size,
      mimetype: file.type,
      bucket_id: bucket,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
      metadata: {
        originalName: file.name,
        eTag: `"${Date.now()}-${file.size}"`,
        cacheControl: '3600'
      }
    }

    bucketFiles.set(path, mockFile)
    this.files.set(bucket, bucketFiles)

    return {
      data: {
        path: path,
        id: mockFile.id,
        fullPath: `${bucket}/${path}`
      },
      error: null
    }
  }

  async remove(bucket: string, paths: string[]): Promise<MockStorageDeleteResult> {
    if (this.shouldFailDelete || Math.random() < this.deleteFailureRate) {
      return {
        data: null,
        error: { message: 'Mock delete failure' }
      }
    }

    const bucketFiles = this.files.get(bucket) || new Map()
    const deletedPaths: { path: string }[] = []

    for (const path of paths) {
      if (bucketFiles.has(path)) {
        bucketFiles.delete(path)
        deletedPaths.push({ path })
      }
    }

    this.files.set(bucket, bucketFiles)

    return {
      data: deletedPaths,
      error: null
    }
  }

  async list(bucket: string, options: { limit?: number; offset?: number } = {}): Promise<MockStorageListResult> {
    if (this.shouldFailList) {
      return {
        data: null,
        error: { message: 'Mock list failure' }
      }
    }

    const bucketFiles = this.files.get(bucket) || new Map()
    const allFiles = Array.from(bucketFiles.values())
    
    const { limit = 1000, offset = 0 } = options
    const paginatedFiles = allFiles.slice(offset, offset + limit)

    return {
      data: paginatedFiles,
      error: null
    }
  }

  async createSignedUrl(bucket: string, path: string, expiresIn: number): Promise<MockStorageSignedUrlResult> {
    if (this.shouldFailSignedUrl) {
      return {
        data: null,
        error: { message: 'Mock signed URL failure' }
      }
    }

    const bucketFiles = this.files.get(bucket) || new Map()
    
    if (!bucketFiles.has(path)) {
      return {
        data: null,
        error: { message: 'File not found' }
      }
    }

    const signedUrl = `https://mock-storage.example.com/${bucket}/${path}?expires=${Date.now() + expiresIn * 1000}&signature=mock-signature`

    return {
      data: { signedUrl },
      error: null
    }
  }

  getPublicUrl(bucket: string, path: string): MockStoragePublicUrlResult {
    return {
      data: {
        publicUrl: `https://mock-storage.example.com/${bucket}/${path}`
      }
    }
  }

  // Helper methods for testing
  getFileCount(bucket: string): number {
    const bucketFiles = this.files.get(bucket) || new Map()
    return bucketFiles.size
  }

  hasFile(bucket: string, path: string): boolean {
    const bucketFiles = this.files.get(bucket) || new Map()
    return bucketFiles.has(path)
  }

  getFile(bucket: string, path: string): MockStorageFile | undefined {
    const bucketFiles = this.files.get(bucket) || new Map()
    return bucketFiles.get(path)
  }

  getAllFiles(bucket: string): MockStorageFile[] {
    const bucketFiles = this.files.get(bucket) || new Map()
    return Array.from(bucketFiles.values())
  }

  getTotalFileCount(): number {
    let total = 0
    for (const bucketFiles of this.files.values()) {
      total += bucketFiles.size
    }
    return total
  }

  getBuckets(): string[] {
    return Array.from(this.files.keys())
  }

  // Simulation methods
  simulateFileAge(bucket: string, path: string, ageMinutes: number): void {
    const bucketFiles = this.files.get(bucket) || new Map()
    const file = bucketFiles.get(path)
    if (file) {
      const oldDate = new Date(Date.now() - (ageMinutes * 60 * 1000))
      file.created_at = oldDate.toISOString()
      file.updated_at = oldDate.toISOString()
      bucketFiles.set(path, file)
      this.files.set(bucket, bucketFiles)
    }
  }

  addTestFile(bucket: string, path: string, options: Partial<MockStorageFile> = {}): void {
    const bucketFiles = this.files.get(bucket) || new Map()
    
    const mockFile: MockStorageFile = {
      name: path,
      id: `test_file_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      size: 1024,
      mimetype: 'text/plain',
      bucket_id: bucket,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
      metadata: {},
      ...options
    }

    bucketFiles.set(path, mockFile)
    this.files.set(bucket, bucketFiles)
  }
}

// ============================================================================
// MOCK STORAGE CLIENT
// ============================================================================

export function createMockStorageClient() {
  const mockState = MockStorageState.getInstance()

  return {
    from: (bucket: string) => ({
      upload: vi.fn().mockImplementation(async (path: string, file: File, options: any = {}) => {
        return await mockState.upload(bucket, path, file)
      }),
      remove: vi.fn().mockImplementation(async (paths: string[]) => {
        return await mockState.remove(bucket, paths)
      }),
      list: vi.fn().mockImplementation(async (folder: string = '', options: any = {}) => {
        return await mockState.list(bucket, options)
      }),
      createSignedUrl: vi.fn().mockImplementation(async (path: string, expiresIn: number) => {
        return await mockState.createSignedUrl(bucket, path, expiresIn)
      }),
      getPublicUrl: vi.fn().mockImplementation((path: string) => {
        return mockState.getPublicUrl(bucket, path)
      })
    })
  }
}

// ============================================================================
// MOCK SETUP UTILITIES
// ============================================================================

export function setupMockStorage() {
  const mockState = MockStorageState.getInstance()
  mockState.reset()

  // Mock the supabase storage client
  const mockStorage = createMockStorageClient()
  
  return {
    mockStorage,
    mockState,
    cleanup: () => mockState.reset()
  }
}

// ============================================================================
// TEST FILE UTILITIES
// ============================================================================

export function createMockFile(name: string, type: string = 'text/plain', size: number = 1024): File {
  const content = new Array(size).fill('a').join('')
  const blob = new Blob([content], { type })
  
  // Create a proper File object
  const file = new File([blob], name, { type, lastModified: Date.now() })
  
  return file
}

export function createMockImageFile(name: string = 'test.jpg', size: number = 2048): File {
  return createMockFile(name, 'image/jpeg', size)
}

export function createMockPdfFile(name: string = 'test.pdf', size: number = 5120): File {
  return createMockFile(name, 'application/pdf', size)
}

export function createMockDwgFile(name: string = 'test.dwg', size: number = 10240): File {
  return createMockFile(name, 'application/vnd.dwg', size)
}

export function createLargeFile(name: string = 'large.pdf', sizeMB: number = 60): File {
  const size = sizeMB * 1024 * 1024
  return createMockFile(name, 'application/pdf', size)
}

export function createInvalidTypeFile(name: string = 'test.exe', size: number = 1024): File {
  return createMockFile(name, 'application/x-executable', size)
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

export function expectFileUploaded(mockState: MockStorageState, bucket: string, path: string) {
  expect(mockState.hasFile(bucket, path)).toBe(true)
  const file = mockState.getFile(bucket, path)
  expect(file).toBeDefined()
  return file!
}

export function expectFileNotUploaded(mockState: MockStorageState, bucket: string, path: string) {
  expect(mockState.hasFile(bucket, path)).toBe(false)
}

export function expectFileDeleted(mockState: MockStorageState, bucket: string, path: string) {
  expect(mockState.hasFile(bucket, path)).toBe(false)
}

export function expectBucketEmpty(mockState: MockStorageState, bucket: string) {
  expect(mockState.getFileCount(bucket)).toBe(0)
}

export function expectBucketFileCount(mockState: MockStorageState, bucket: string, count: number) {
  expect(mockState.getFileCount(bucket)).toBe(count)
}

// ============================================================================
// PROGRESS TRACKING UTILITIES
// ============================================================================

export class ProgressTracker {
  private progressUpdates: number[] = []
  private onProgress = vi.fn((progress: number) => {
    this.progressUpdates.push(progress)
  })

  getProgressCallback() {
    return this.onProgress
  }

  getProgressUpdates(): number[] {
    return [...this.progressUpdates]
  }

  expectProgressSequence(expectedSequence: number[]) {
    expect(this.progressUpdates).toEqual(expectedSequence)
  }

  expectProgressIncreasing() {
    for (let i = 1; i < this.progressUpdates.length; i++) {
      expect(this.progressUpdates[i]).toBeGreaterThanOrEqual(this.progressUpdates[i - 1])
    }
  }

  expectProgressCompleted() {
    expect(this.progressUpdates[this.progressUpdates.length - 1]).toBe(100)
  }

  reset() {
    this.progressUpdates = []
    this.onProgress.mockClear()
  }
}

// ============================================================================
// TRANSACTION TESTING UTILITIES
// ============================================================================

export function expectTransactionCommitted(service: any, transactionId: string) {
  const transaction = service.getTransaction(transactionId)
  expect(transaction?.status).toBe('committed')
}

export function expectTransactionRolledBack(service: any, transactionId: string) {
  const transaction = service.getTransaction(transactionId)
  expect(transaction?.status).toBe('rolled_back')
}

export function expectTransactionFailed(service: any, transactionId: string) {
  const transaction = service.getTransaction(transactionId)
  expect(transaction?.status).toBe('failed')
}

export function expectUploadCompleted(service: any, uploadId: string) {
  const progress = service.getUploadProgress(uploadId)
  expect(progress?.status).toBe('completed')
  expect(progress?.progress).toBe(100)
}

export function expectUploadFailed(service: any, uploadId: string) {
  const progress = service.getUploadProgress(uploadId)
  expect(progress?.status).toBe('failed')
  expect(progress?.error).toBeDefined()
}

// ============================================================================
// ADVANCED MOCKING SCENARIOS
// ============================================================================

export function setupUploadRetryScenario(mockState: MockStorageState, failureCount: number = 2) {
  let attemptCount = 0
  
  const originalUpload = mockState.upload.bind(mockState)
  mockState.upload = vi.fn().mockImplementation(async (bucket: string, path: string, file: File) => {
    attemptCount++
    
    if (attemptCount <= failureCount) {
      return {
        data: null,
        error: { message: `Mock failure attempt ${attemptCount}` }
      }
    }
    
    // Success on final attempt
    return await originalUpload(bucket, path, file)
  })
  
  return {
    getAttemptCount: () => attemptCount,
    reset: () => { attemptCount = 0 }
  }
}

export function setupIntermittentFailureScenario(mockState: MockStorageState, failureRate: number = 0.3) {
  mockState.setUploadFailureRate(failureRate)
  mockState.setDeleteFailureRate(failureRate * 0.5) // Lower delete failure rate
}

export function setupNetworkDelayScenario(mockState: MockStorageState, delayMs: number = 1000) {
  mockState.setUploadDelay(delayMs)
}

export function setupStorageFullScenario(mockState: MockStorageState, maxFiles: number = 5) {
  const originalUpload = mockState.upload.bind(mockState)
  
  mockState.upload = vi.fn().mockImplementation(async (bucket: string, path: string, file: File) => {
    if (mockState.getTotalFileCount() >= maxFiles) {
      return {
        data: null,
        error: { message: 'Storage quota exceeded' }
      }
    }
    
    return await originalUpload(bucket, path, file)
  })
}