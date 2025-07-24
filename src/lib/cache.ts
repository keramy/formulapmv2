// Simple in-memory cache for Document Approval Workflow
// // Implemented Replace with Redis in production

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data as T
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  // Get cache statistics
  getStats(): { size: number, keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// Create singleton instance
export const cache = new MemoryCache()

// Cache key generators for document workflow
export const CacheKeys = {
  pendingApprovals: (userId: string, projectId?: string) => 
    `pending_approvals:${userId}${projectId ? `:${projectId}` : ''}`,
  
  workflowDetails: (workflowId: string) => 
    `workflow_details:${workflowId}`,
  
  userApprovalStats: (userId: string) => 
    `approval_stats:${userId}`,
  
  documentWorkflows: (documentId: string) => 
    `document_workflows:${documentId}`,
  
  userPermissions: (userId: string) => 
    `user_permissions:${userId}`,
  
  workflowTemplates: (documentType?: string) => 
    `workflow_templates${documentType ? `:${documentType}` : ''}`,
  
  projectDocuments: (projectId: string) => 
    `project_documents:${projectId}`
}

// Cache invalidation helpers
export const InvalidateCache = {
  // Invalidate all approval-related cache for a user
  userApprovals: (userId: string) => {
    const patterns = [
      CacheKeys.pendingApprovals(userId),
      CacheKeys.userApprovalStats(userId),
      CacheKeys.userPermissions(userId)
    ]
    
    patterns.forEach(pattern => cache.delete(pattern))
    
    // Also check for project-specific entries
    const stats = cache.getStats()
    stats.keys.forEach(key => {
      if (key.includes(`pending_approvals:${userId}:`)) {
        cache.delete(key)
      }
    })
  },
  
  // Invalidate workflow-related cache
  workflow: (workflowId: string, documentId?: string) => {
    cache.delete(CacheKeys.workflowDetails(workflowId))
    if (documentId) {
      cache.delete(CacheKeys.documentWorkflows(documentId))
    }
  },
  
  // Invalidate project-related cache
  project: (projectId: string) => {
    cache.delete(CacheKeys.projectDocuments(projectId))
    
    // Invalidate all user pending approvals for this project
    const stats = cache.getStats()
    stats.keys.forEach(key => {
      if (key.includes(`pending_approvals:`) && key.endsWith(`:${projectId}`)) {
        cache.delete(key)
      }
    })
  },
  
  // Invalidate document-related cache
  document: (documentId: string) => {
    cache.delete(CacheKeys.documentWorkflows(documentId))
  }
}

// Auto-cleanup every 10 minutes
if (typeof window === 'undefined') { // Server-side only
  setInterval(() => {
    cache.cleanup()
  }, 10 * 60 * 1000)
}

export default cache