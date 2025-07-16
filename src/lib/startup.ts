/**
 * Application startup utilities
 * Initialize services and background tasks
 */

import { FileUploadService } from '@/lib/file-upload'

export class StartupService {
  private static initialized = false
  
  static async initialize() {
    if (this.initialized) {
      return
    }
    
    try {
      console.log('🚀 Initializing application services...')
      
      // Initialize file upload service with cleanup scheduler
      const fileUploadService = FileUploadService.getInstance()
      await fileUploadService.scheduleCleanup(60) // Clean every hour
      
      console.log('✅ File upload service initialized with cleanup scheduler')
      
      this.initialized = true
      console.log('🎉 Application services initialized successfully')
      
    } catch (error) {
      console.error('❌ Failed to initialize application services:', error)
      // Don't throw - let the application start even if background services fail
    }
  }
  
  static isInitialized(): boolean {
    return this.initialized
  }
}

// Auto-initialize in production
if (process.env.NODE_ENV === 'production') {
  StartupService.initialize()
}