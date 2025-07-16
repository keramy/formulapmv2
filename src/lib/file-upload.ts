import { supabase } from './supabase'

export interface FileUploadResult {
  success: boolean
  file_path?: string
  file_url?: string
  error?: string
  upload_id?: string
  transaction_id?: string
}

export interface FileUploadOptions {
  bucket: string
  folder?: string
  maxSize?: number // in bytes
  allowedTypes?: string[]
  onProgress?: (progress: number) => void
  retryAttempts?: number
  timeout?: number
}

export interface UploadTransaction {
  id: string
  bucket: string
  file_path: string
  status: 'pending' | 'uploaded' | 'committed' | 'failed' | 'rolled_back'
  created_at: Date
  metadata?: Record<string, any>
}

export interface UploadProgress {
  upload_id: string
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'failed'
  error?: string
}

export interface CleanupResult {
  success: boolean
  cleaned_files: string[]
  failed_cleanups: string[]
  total_processed: number
}

export class FileUploadService {
  private static instance: FileUploadService
  private activeTransactions: Map<string, UploadTransaction> = new Map()
  private uploadProgress: Map<string, UploadProgress> = new Map()
  private cleanupScheduled: boolean = false
  
  static getInstance(): FileUploadService {
    if (!FileUploadService.instance) {
      FileUploadService.instance = new FileUploadService()
    }
    return FileUploadService.instance
  }

  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
  }

  private generateUploadId(): string {
    return `up_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        
        if (attempt === maxAttempts) {
          throw lastError
        }
        
        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1)
        await this.delay(delay)
      }
    }
    
    throw lastError!
  }

  async uploadFile(
    file: File,
    options: FileUploadOptions
  ): Promise<FileUploadResult> {
    const uploadId = this.generateUploadId()
    const transactionId = this.generateTransactionId()
    
    try {
      // Initialize progress tracking
      this.uploadProgress.set(uploadId, {
        upload_id: uploadId,
        progress: 0,
        status: 'uploading'
      })

      // Validate file size
      if (options.maxSize && file.size > options.maxSize) {
        this.uploadProgress.set(uploadId, {
          upload_id: uploadId,
          progress: 0,
          status: 'failed',
          error: `File size exceeds maximum limit of ${Math.round(options.maxSize / 1024 / 1024)}MB`
        })
        return {
          success: false,
          error: `File size exceeds maximum limit of ${Math.round(options.maxSize / 1024 / 1024)}MB`,
          upload_id: uploadId
        }
      }

      // Validate file type
      if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
        const error = `File type ${file.type} is not allowed. Allowed types: ${options.allowedTypes.join(', ')}`
        this.uploadProgress.set(uploadId, {
          upload_id: uploadId,
          progress: 0,
          status: 'failed',
          error
        })
        return {
          success: false,
          error,
          upload_id: uploadId
        }
      }

      // Generate unique filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const fileExtension = file.name.split('.').pop()
      const fileName = `${timestamp}_${randomString}.${fileExtension}`
      
      const filePath = options.folder 
        ? `${options.folder}/${fileName}`
        : fileName

      // Create transaction record
      const transaction: UploadTransaction = {
        id: transactionId,
        bucket: options.bucket,
        file_path: filePath,
        status: 'pending',
        created_at: new Date(),
        metadata: {
          original_name: file.name,
          size: file.size,
          type: file.type,
          upload_id: uploadId
        }
      }
      this.activeTransactions.set(transactionId, transaction)

      // Update progress
      options.onProgress?.(10)
      this.uploadProgress.set(uploadId, {
        upload_id: uploadId,
        progress: 10,
        status: 'uploading'
      })

      // Upload to Supabase storage with retry logic
      const uploadResult = await this.retryOperation(
        async () => {
          const { data, error } = await supabase.storage
            .from(options.bucket)
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            })
          
          if (error) {
            throw new Error(`Upload failed: ${error.message}`)
          }
          
          return data
        },
        options.retryAttempts || 3
      )

      // Update transaction status
      transaction.status = 'uploaded'
      this.activeTransactions.set(transactionId, transaction)

      // Update progress
      options.onProgress?.(90)
      this.uploadProgress.set(uploadId, {
        upload_id: uploadId,
        progress: 90,
        status: 'processing'
      })

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(options.bucket)
        .getPublicUrl(filePath)

      // Mark as completed
      options.onProgress?.(100)
      this.uploadProgress.set(uploadId, {
        upload_id: uploadId,
        progress: 100,
        status: 'completed'
      })

      return {
        success: true,
        file_path: filePath,
        file_url: publicUrl,
        upload_id: uploadId,
        transaction_id: transactionId
      }
    } catch (error) {
      console.error('File upload error:', error)
      
      // Update progress with error
      this.uploadProgress.set(uploadId, {
        upload_id: uploadId,
        progress: 0,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      })

      // Mark transaction as failed
      const transaction = this.activeTransactions.get(transactionId)
      if (transaction) {
        transaction.status = 'failed'
        this.activeTransactions.set(transactionId, transaction)
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        upload_id: uploadId,
        transaction_id: transactionId
      }
    }
  }

  async deleteFile(bucket: string, filePath: string): Promise<boolean> {
    try {
      const result = await this.retryOperation(
        async () => {
          const { error } = await supabase.storage
            .from(bucket)
            .remove([filePath])

          if (error) {
            throw new Error(`Deletion failed: ${error.message}`)
          }

          return true
        },
        3
      )

      return result
    } catch (error) {
      console.error('File deletion error:', error)
      return false
    }
  }

  async deleteMultipleFiles(bucket: string, filePaths: string[]): Promise<{ success: boolean; failed: string[] }> {
    const failed: string[] = []
    
    for (const filePath of filePaths) {
      const success = await this.deleteFile(bucket, filePath)
      if (!success) {
        failed.push(filePath)
      }
    }
    
    return {
      success: failed.length === 0,
      failed
    }
  }

  async getSignedUrl(bucket: string, filePath: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const result = await this.retryOperation(
        async () => {
          const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(filePath, expiresIn)

          if (error) {
            throw new Error(`Signed URL creation failed: ${error.message}`)
          }

          return data.signedUrl
        },
        3
      )

      return result
    } catch (error) {
      console.error('Signed URL error:', error)
      return null
    }
  }

  // Transaction management methods
  async commitTransaction(transactionId: string): Promise<boolean> {
    const transaction = this.activeTransactions.get(transactionId)
    if (!transaction) {
      console.error('Transaction not found:', transactionId)
      return false
    }

    if (transaction.status !== 'uploaded') {
      console.error('Transaction not in uploaded state:', transactionId)
      return false
    }

    try {
      transaction.status = 'committed'
      this.activeTransactions.set(transactionId, transaction)
      
      // Remove from active transactions after a delay (cleanup)
      setTimeout(() => {
        this.activeTransactions.delete(transactionId)
      }, 300000) // 5 minutes

      return true
    } catch (error) {
      console.error('Transaction commit error:', error)
      return false
    }
  }

  async rollbackTransaction(transactionId: string): Promise<boolean> {
    const transaction = this.activeTransactions.get(transactionId)
    if (!transaction) {
      console.error('Transaction not found:', transactionId)
      return false
    }

    try {
      // Delete the uploaded file
      if (transaction.status === 'uploaded' || transaction.status === 'committed') {
        await this.deleteFile(transaction.bucket, transaction.file_path)
      }

      transaction.status = 'rolled_back'
      this.activeTransactions.set(transactionId, transaction)
      
      // Remove from active transactions
      setTimeout(() => {
        this.activeTransactions.delete(transactionId)
      }, 60000) // 1 minute

      return true
    } catch (error) {
      console.error('Transaction rollback error:', error)
      return false
    }
  }

  getUploadProgress(uploadId: string): UploadProgress | undefined {
    return this.uploadProgress.get(uploadId)
  }

  getTransaction(transactionId: string): UploadTransaction | undefined {
    return this.activeTransactions.get(transactionId)
  }

  // Cleanup methods
  async findOrphanedFiles(bucket: string, olderThanMinutes: number = 60): Promise<string[]> {
    try {
      const { data: files, error } = await supabase.storage
        .from(bucket)
        .list('', {
          limit: 1000,
          offset: 0
        })

      if (error) {
        console.error('Error listing files:', error)
        return []
      }

      const cutoffTime = new Date(Date.now() - (olderThanMinutes * 60 * 1000))
      const orphanedFiles: string[] = []

      for (const file of files || []) {
        if (file.created_at && new Date(file.created_at) < cutoffTime) {
          // Check if file is referenced in any active transaction
          const isActive = Array.from(this.activeTransactions.values())
            .some(tx => tx.file_path === file.name && tx.status !== 'rolled_back')
          
          if (!isActive) {
            // Additional check: verify file is not referenced in database
            const isReferenced = await this.checkFileReferenceInDatabase(bucket, file.name)
            if (!isReferenced) {
              orphanedFiles.push(file.name)
            }
          }
        }
      }

      return orphanedFiles
    } catch (error) {
      console.error('Error finding orphaned files:', error)
      return []
    }
  }

  private async checkFileReferenceInDatabase(bucket: string, filePath: string): Promise<boolean> {
    try {
      // Check different tables based on bucket
      let query: any
      
      switch (bucket) {
        case 'shop-drawings':
          query = supabase
            .from('shop_drawings')
            .select('id')
            .eq('file_path', filePath)
            .limit(1)
          break
        case 'reports':
          query = supabase
            .from('report_attachments')
            .select('id')
            .eq('file_path', filePath)
            .limit(1)
          break
        case 'profiles':
          query = supabase
            .from('user_profiles')
            .select('id')
            .eq('avatar_url', filePath)
            .limit(1)
          break
        default:
          return false
      }

      const { data, error } = await query
      
      if (error) {
        console.error('Database reference check error:', error)
        return true // Assume referenced if check fails
      }

      return data && data.length > 0
    } catch (error) {
      console.error('Database reference check error:', error)
      return true // Assume referenced if check fails
    }
  }

  async cleanupOrphanedFiles(bucket: string, olderThanMinutes: number = 60): Promise<CleanupResult> {
    const orphanedFiles = await this.findOrphanedFiles(bucket, olderThanMinutes)
    
    if (orphanedFiles.length === 0) {
      return {
        success: true,
        cleaned_files: [],
        failed_cleanups: [],
        total_processed: 0
      }
    }

    const { success, failed } = await this.deleteMultipleFiles(bucket, orphanedFiles)
    
    return {
      success,
      cleaned_files: orphanedFiles.filter(f => !failed.includes(f)),
      failed_cleanups: failed,
      total_processed: orphanedFiles.length
    }
  }

  async scheduleCleanup(intervalMinutes: number = 60): Promise<void> {
    if (this.cleanupScheduled) {
      return
    }

    this.cleanupScheduled = true
    
    const cleanup = async () => {
      try {
        const buckets = ['shop-drawings', 'reports', 'profiles']
        
        for (const bucket of buckets) {
          const result = await this.cleanupOrphanedFiles(bucket, 60)
          if (result.cleaned_files.length > 0) {
            console.log(`Cleaned up ${result.cleaned_files.length} orphaned files from ${bucket}:`, result.cleaned_files)
          }
        }
      } catch (error) {
        console.error('Scheduled cleanup error:', error)
      }
    }

    // Run cleanup immediately
    await cleanup()
    
    // Schedule recurring cleanup
    setInterval(cleanup, intervalMinutes * 60 * 1000)
  }
}

// Predefined upload configurations
export const UPLOAD_CONFIGS = {
  SHOP_DRAWINGS: {
    bucket: 'shop-drawings',
    folder: 'drawings',
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.dwg', 'application/dxf']
  },
  REPORT_ATTACHMENTS: {
    bucket: 'reports',
    folder: 'attachments',
    maxSize: 25 * 1024 * 1024, // 25MB
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
  },
  PROFILE_PHOTOS: {
    bucket: 'profiles',
    folder: 'photos',
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
  }
} as const

// Helper functions for common use cases
export const uploadShopDrawing = (file: File) => {
  return FileUploadService.getInstance().uploadFile(file, UPLOAD_CONFIGS.SHOP_DRAWINGS)
}

export const uploadReportAttachment = (file: File) => {
  return FileUploadService.getInstance().uploadFile(file, UPLOAD_CONFIGS.REPORT_ATTACHMENTS)
}

export const uploadProfilePhoto = (file: File) => {
  return FileUploadService.getInstance().uploadFile(file, UPLOAD_CONFIGS.PROFILE_PHOTOS)
}

// Advanced transactional upload helpers
export interface TransactionalUploadOptions<T> {
  file: File
  uploadConfig: FileUploadOptions
  databaseOperation: (uploadResult: FileUploadResult) => Promise<T>
  rollbackOperation?: (uploadResult: FileUploadResult) => Promise<void>
  onProgress?: (progress: number) => void
}

export interface TransactionalUploadResult<T> {
  success: boolean
  data?: T
  uploadResult?: FileUploadResult
  error?: string
  transaction_id?: string
}

export async function transactionalUpload<T>(
  options: TransactionalUploadOptions<T>
): Promise<TransactionalUploadResult<T>> {
  const fileUploadService = FileUploadService.getInstance()
  let uploadResult: FileUploadResult | null = null
  let transactionId: string | null = null

  try {
    // Step 1: Upload file
    options.onProgress?.(10)
    uploadResult = await fileUploadService.uploadFile(options.file, options.uploadConfig)
    
    if (!uploadResult.success) {
      return {
        success: false,
        error: uploadResult.error,
        uploadResult
      }
    }

    transactionId = uploadResult.transaction_id || null

    // Step 2: Execute database operation
    options.onProgress?.(50)
    const databaseResult = await options.databaseOperation(uploadResult)
    
    // Step 3: Commit transaction
    options.onProgress?.(90)
    if (transactionId) {
      const commitSuccess = await fileUploadService.commitTransaction(transactionId)
      if (!commitSuccess) {
        console.warn('Failed to commit transaction, but database operation succeeded')
      }
    }

    options.onProgress?.(100)
    return {
      success: true,
      data: databaseResult,
      uploadResult,
      transaction_id: transactionId || undefined
    }

  } catch (error) {
    console.error('Transactional upload error:', error)
    
    // Rollback on error
    if (transactionId) {
      await fileUploadService.rollbackTransaction(transactionId)
    }
    
    // Execute custom rollback if provided
    if (options.rollbackOperation && uploadResult) {
      try {
        await options.rollbackOperation(uploadResult)
      } catch (rollbackError) {
        console.error('Rollback operation failed:', rollbackError)
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      uploadResult,
      transaction_id: transactionId || undefined
    }
  }
}

// Specialized transactional upload functions
export async function uploadShopDrawingWithTransaction(
  file: File,
  drawingId: string,
  onProgress?: (progress: number) => void
): Promise<TransactionalUploadResult<any>> {
  return transactionalUpload({
    file,
    uploadConfig: UPLOAD_CONFIGS.SHOP_DRAWINGS,
    databaseOperation: async (uploadResult) => {
      // Update shop_drawings table
      const { data, error } = await supabase
        .from('shop_drawings')
        .update({
          file_path: uploadResult.file_path,
          file_type: file.type,
          file_size: file.size,
          updated_at: new Date().toISOString()
        })
        .eq('id', drawingId)
        .select()
        .single()

      if (error) {
        throw new Error(`Database update failed: ${error.message}`)
      }

      return data
    },
    rollbackOperation: async (uploadResult) => {
      // Rollback database changes if needed
      await supabase
        .from('shop_drawings')
        .update({
          file_path: null,
          file_type: null,
          file_size: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', drawingId)
    },
    onProgress
  })
}

export async function uploadReportAttachmentWithTransaction(
  file: File,
  reportId: string,
  onProgress?: (progress: number) => void
): Promise<TransactionalUploadResult<any>> {
  return transactionalUpload({
    file,
    uploadConfig: UPLOAD_CONFIGS.REPORT_ATTACHMENTS,
    databaseOperation: async (uploadResult) => {
      // Insert into report_attachments table
      const { data, error } = await supabase
        .from('report_attachments')
        .insert({
          report_id: reportId,
          file_path: uploadResult.file_path,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          uploaded_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Database insert failed: ${error.message}`)
      }

      return data
    },
    rollbackOperation: async (uploadResult) => {
      // Remove the inserted record
      await supabase
        .from('report_attachments')
        .delete()
        .eq('file_path', uploadResult.file_path)
    },
    onProgress
  })
}

// Bulk operations with transaction support
export async function bulkUploadWithTransaction<T>(
  files: File[],
  uploadConfig: FileUploadOptions,
  databaseOperation: (uploadResults: FileUploadResult[]) => Promise<T>,
  onProgress?: (progress: number) => void
): Promise<TransactionalUploadResult<T>> {
  const fileUploadService = FileUploadService.getInstance()
  const uploadResults: FileUploadResult[] = []
  const transactionIds: string[] = []

  try {
    // Step 1: Upload all files
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const progress = (i / files.length) * 60 // 60% for uploads
      onProgress?.(progress)
      
      const uploadResult = await fileUploadService.uploadFile(file, uploadConfig)
      uploadResults.push(uploadResult)
      
      if (!uploadResult.success) {
        throw new Error(`Upload failed for file ${file.name}: ${uploadResult.error}`)
      }
      
      if (uploadResult.transaction_id) {
        transactionIds.push(uploadResult.transaction_id)
      }
    }

    // Step 2: Execute database operation
    onProgress?.(70)
    const databaseResult = await databaseOperation(uploadResults)
    
    // Step 3: Commit all transactions
    onProgress?.(90)
    for (const transactionId of transactionIds) {
      await fileUploadService.commitTransaction(transactionId)
    }

    onProgress?.(100)
    return {
      success: true,
      data: databaseResult,
      uploadResult: uploadResults[0], // Return first result for compatibility
      transaction_id: transactionIds[0] || undefined
    }

  } catch (error) {
    console.error('Bulk transactional upload error:', error)
    
    // Rollback all transactions
    for (const transactionId of transactionIds) {
      await fileUploadService.rollbackTransaction(transactionId)
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      uploadResult: uploadResults[0] || undefined,
      transaction_id: transactionIds[0] || undefined
    }
  }
}