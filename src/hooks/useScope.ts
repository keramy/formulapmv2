/**
 * Formula PM 2.0 Scope Management Hooks
 * Wave 2B Business Logic Implementation
 * 
 * Custom React hooks for scope management operations with role-based access control
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from './useAuth'
import { usePermissions } from './usePermissions'
import { useAdvancedApiQuery } from './useAdvancedApiQuery'
import { authenticatedFetch, getUserFriendlyErrorMessage } from '@/lib/fetch-utils'
import { debugApiIssue } from '@/lib/api-health-check'
import { 
  ScopeItem,
  ScopeItemFormData,
  ScopeItemUpdateData,
  ScopeFilters,
  ScopeListParams,
  ScopeStatistics,
  BulkScopeUpdate,
  ScopeApiResponse,
  ScopeListResponse,
  ScopeCreateResponse,
  ScopeUpdateResponse,
  ScopeBulkUpdateResponse,
  ScopeCategory,
  ScopeStatus,
  ExcelImportBatch
} from '@/types/scope'

// ============================================================================
// MAIN SCOPE ITEMS HOOK
// ============================================================================

export const useScope = (projectId?: string) => {
  const { profile, getAccessToken } = useAuth()
  const { 
    canViewScope,
    canCreateScope,
    canEditScope,
    canViewPricing,
    checkPermission
  } = usePermissions()

  const [scopeItems, setScopeItems] = useState<ScopeItem[]>([])
  const [statistics, setStatistics] = useState<ScopeStatistics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)
  const [initialLoad, setInitialLoad] = useState(true)

  // Fetch scope items with filters - optimized to prevent infinite loops
  const fetchScopeItems = useCallback(async (params?: ScopeListParams, force = false) => {
    // Stability guards to prevent infinite re-renders
    if (!profile || !canViewScope()) {
      setLoading(false)
      return
    }

    // Prevent duplicate calls
    if (loading) return

    // Simple caching - don't refetch if data is fresh (within 2 minutes) unless forced
    const now = Date.now()
    const cacheExpiry = 2 * 60 * 1000 // 2 minutes
    if (!force && !initialLoad && scopeItems.length > 0 && (now - lastFetchTime) < cacheExpiry) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams()
      
      if (projectId) queryParams.set('project_id', projectId)
      if (params?.page) queryParams.set('page', params.page.toString())
      if (params?.limit) queryParams.set('limit', params.limit.toString())
      if (params?.include_dependencies) queryParams.set('include_dependencies', 'true')
      if (params?.include_materials) queryParams.set('include_materials', 'true')
      if (params?.include_assignments) queryParams.set('include_assignments', 'true')
      
      // Apply filters
      if (params?.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              queryParams.set(key, value.join(','))
            } else {
              queryParams.set(key, value.toString())
            }
          }
        })
      }

      // Apply sorting
      if (params?.sort) {
        queryParams.set('sort_field', params.sort.field)
        queryParams.set('sort_direction', params.sort.direction)
      }

      const response = await authenticatedFetch(`/api/scope?${queryParams.toString()}`, getAccessToken, {
        retries: 1,
        timeout: 10000
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch scope items: ${response.status} ${response.statusText}`)
      }

      const data: ScopeApiResponse<ScopeListResponse> = await response.json()
      
      if (data.success && data.data) {
        setScopeItems(data.data.items)
        setStatistics(data.data.statistics)
        setCurrentPage(data.pagination?.page || 1)
        setTotalCount(data.pagination?.total || 0)
        setHasMore(data.pagination?.has_more || false)
        setLastFetchTime(Date.now())
        setInitialLoad(false)
      } else {
        throw new Error(data.error || 'Failed to fetch scope items')
      }
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? getUserFriendlyErrorMessage(err)
        : 'Failed to fetch scope items'
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [profile?.id, projectId]) // Simplified dependencies

  // Create new scope item
  const createScopeItem = useCallback(async (itemData: ScopeItemFormData) => {
    if (!profile || !canCreateScope()) {
      throw new Error('Insufficient permissions to create scope items')
    }

    setLoading(true)
    setError(null)

    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const response = await fetch('/api/scope', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...itemData,
          project_id: projectId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create scope item')
      }

      const data: ScopeApiResponse<ScopeCreateResponse> = await response.json()
      
      if (data.success && data.data) {
        // Refresh scope items list
        await fetchScopeItems()
        return data.data.item
      } else {
        throw new Error(data.error || 'Failed to create scope item')
      }
    } catch (err) {
      console.error('Error creating scope item:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to create scope item'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [profile, projectId, canCreateScope, fetchScopeItems])

  // Update scope item
  const updateScopeItem = useCallback(async (itemId: string, updates: ScopeItemUpdateData) => {
    if (!profile || !canEditScope()) {
      throw new Error('Insufficient permissions to update scope items')
    }

    setLoading(true)
    setError(null)

    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const response = await fetch(`/api/scope/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update scope item')
      }

      const data: ScopeApiResponse<ScopeUpdateResponse> = await response.json()
      
      if (data.success && data.data) {
        // Update the item in the local state
        setScopeItems(prev => 
          prev.map(item => 
            item.id === itemId ? data.data!.item : item
          )
        )
        return data.data.item
      } else {
        throw new Error(data.error || 'Failed to update scope item')
      }
    } catch (err) {
      console.error('Error updating scope item:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update scope item'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [profile, canEditScope])

  // Delete scope item
  const deleteScopeItem = useCallback(async (itemId: string, forceDelete = false) => {
    if (!profile || !checkPermission('projects.delete')) {
      throw new Error('Insufficient permissions to delete scope items')
    }

    setLoading(true)
    setError(null)

    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const url = forceDelete ? `/api/scope/${itemId}?force=true` : `/api/scope/${itemId}`
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete scope item')
      }

      const data = await response.json()
      
      if (data.success) {
        // Remove from local state or mark as cancelled
        if (forceDelete) {
          setScopeItems(prev => prev.filter(item => item.id !== itemId))
        } else {
          setScopeItems(prev => 
            prev.map(item => 
              item.id === itemId ? { ...item, status: 'cancelled' as ScopeStatus } : item
            )
          )
        }
        return true
      } else {
        throw new Error(data.error || 'Failed to delete scope item')
      }
    } catch (err) {
      console.error('Error deleting scope item:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete scope item'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [profile, checkPermission])

  // Bulk update scope items
  const bulkUpdateScopeItems = useCallback(async (bulkUpdate: BulkScopeUpdate) => {
    if (!profile || !checkPermission('projects.update')) {
      throw new Error('Insufficient permissions for bulk operations')
    }

    setLoading(true)
    setError(null)

    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const response = await fetch('/api/scope/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bulkUpdate)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to perform bulk update')
      }

      const data: ScopeApiResponse<ScopeBulkUpdateResponse> = await response.json()
      
      if (data.success && data.data) {
        // Update local state with successful updates
        const updatedItemsMap = new Map(data.data.updated_items.map(item => [item.id, item]))
        
        setScopeItems(prev => 
          prev.map(item => 
            updatedItemsMap.has(item.id) ? updatedItemsMap.get(item.id)! : item
          )
        )
        
        return data.data
      } else {
        throw new Error(data.error || 'Failed to perform bulk update')
      }
    } catch (err) {
      console.error('Error performing bulk update:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to perform bulk update'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [profile, checkPermission])

  // Filter scope items by category
  const filterByCategory = useCallback((category: ScopeCategory | 'all') => {
    if (category === 'all') return scopeItems
    return scopeItems.filter(item => item.category === category)
  }, [scopeItems])

  // Filter scope items by status
  const filterByStatus = useCallback((statuses: ScopeStatus[]) => {
    return scopeItems.filter(item => statuses.includes(item.status))
  }, [scopeItems])

  // Get scope items by assignment
  const getAssignedItems = useCallback((userId?: string) => {
    const targetUserId = userId || profile?.id
    if (!targetUserId) return []
    
    return scopeItems.filter(item => 
      item.assigned_to?.includes(targetUserId)
    )
  }, [scopeItems, profile])

  // Calculate category statistics
  const categoryStats = useMemo(() => {
    const stats = {
      construction: { total: 0, completed: 0, in_progress: 0 },
      millwork: { total: 0, completed: 0, in_progress: 0 },
      electrical: { total: 0, completed: 0, in_progress: 0 },
      mechanical: { total: 0, completed: 0, in_progress: 0 }
    }

    scopeItems.forEach(item => {
      stats[item.category].total++
      if (item.status === 'completed') stats[item.category].completed++
      if (item.status === 'in_progress') stats[item.category].in_progress++
    })

    return stats
  }, [scopeItems])

  return {
    scopeItems,
    statistics,
    loading,
    error,
    totalCount,
    currentPage,
    hasMore,
    categoryStats,
    
    // Actions
    fetchScopeItems,
    createScopeItem,
    updateScopeItem,
    deleteScopeItem,
    bulkUpdateScopeItems,
    
    // Utilities
    filterByCategory,
    filterByStatus,
    getAssignedItems,
    refreshScopeItems: () => fetchScopeItems(undefined, true), // Force refresh
    
    // Permissions
    canCreate: canCreateScope(),
    canEdit: canEditScope(),
    canDelete: checkPermission('projects.delete'),
    canViewFinancials: canViewPricing(),
    canBulkEdit: checkPermission('projects.update')
  }
}

// ============================================================================
// INDIVIDUAL SCOPE ITEM HOOK
// ============================================================================

export const useScopeItem = (itemId: string) => {
  const { profile, getAccessToken } = useAuth()
  const { canViewScope } = usePermissions()
  
  const [scopeItem, setScopeItem] = useState<ScopeItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch individual scope item
  const fetchScopeItem = useCallback(async () => {
    if (!profile || !itemId || !canViewScope()) return

    setLoading(true)
    setError(null)

    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const response = await fetch(`/api/scope/${itemId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Scope item not found or access denied')
        }
        throw new Error('Failed to fetch scope item')
      }

      const data: ScopeApiResponse<ScopeItem> = await response.json()
      
      if (data.success && data.data) {
        setScopeItem(data.data)
      } else {
        throw new Error(data.error || 'Failed to fetch scope item')
      }
    } catch (err) {
      console.error('Error fetching scope item:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch scope item')
    } finally {
      setLoading(false)
    }
  }, [profile, itemId, canViewScope])

  // Load scope item on mount
  useEffect(() => {
    fetchScopeItem()
  }, [fetchScopeItem])

  return {
    scopeItem,
    loading,
    error,
    fetchScopeItem,
    refreshScopeItem: fetchScopeItem
  }
}

// ============================================================================
// SCOPE STATISTICS HOOK
// ============================================================================

export const useScopeStatistics = (projectId?: string) => {
  const { profile, getAccessToken } = useAuth()
  const { canViewScope, canViewPricing } = usePermissions()
  
  const [statistics, setStatistics] = useState<ScopeStatistics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch scope statistics
  const fetchStatistics = useCallback(async () => {
    if (!profile || !canViewScope()) return

    setLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams()
      if (projectId) queryParams.set('project_id', projectId)
      if (canViewPricing()) queryParams.set('include_financials', 'true')

      const token = await getAccessToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const response = await fetch(`/api/scope/statistics?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch scope statistics')
      }

      const data = await response.json()
      
      if (data.success) {
        setStatistics(data.data.statistics)
      } else {
        throw new Error(data.error || 'Failed to fetch scope statistics')
      }
    } catch (err) {
      console.error('Error fetching scope statistics:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch scope statistics')
    } finally {
      setLoading(false)
    }
  }, [profile, projectId, canViewScope, canViewPricing])

  // Load statistics on mount
  useEffect(() => {
    fetchStatistics()
  }, [fetchStatistics])

  return {
    statistics,
    loading,
    error,
    fetchStatistics,
    refreshStatistics: fetchStatistics,
    canViewFinancials: canViewPricing()
  }
}

// ============================================================================
// EXCEL IMPORT/EXPORT HOOK
// ============================================================================

export const useScopeExcel = (projectId: string) => {
  const { profile, getAccessToken } = useAuth()
  const { checkPermission } = usePermissions()
  
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Import scope items from Excel
  const importFromExcel = useCallback(async (file: File) => {
    if (!profile || !checkPermission('projects.update')) {
      throw new Error('Insufficient permissions to import Excel files')
    }

    setImporting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectId', projectId)

      const token = await getAccessToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const response = await fetch('/api/scope/excel/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to import Excel file')
      }

      const data = await response.json()
      
      if (data.success) {
        // Transform our new API response format to match the ExcelImportBatch type
        const importBatch: ExcelImportBatch = {
          id: `import-${Date.now()}`, // Generate a temporary ID
          project_id: projectId,
          filename: file.name,
          imported_by: profile.id,
          import_date: new Date().toISOString(),
          total_rows: data.data.imported + data.data.errors.length,
          successful_imports: data.data.imported,
          failed_imports: data.data.errors.length,
          validation_errors: data.data.errors.map((error: any) => ({
            row_number: error.row,
            column: error.field,
            error_message: error.message
          }))
        }
        return importBatch
      } else {
        throw new Error(data.error || 'Failed to import Excel file')
      }
    } catch (err) {
      console.error('Error importing Excel file:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to import Excel file'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setImporting(false)
    }
  }, [profile, projectId, checkPermission])

  // Export scope items to Excel
  const exportToExcel = useCallback(async (filters?: ScopeFilters) => {
    if (!profile || !checkPermission('projects.read.all')) {
      throw new Error('Insufficient permissions to export Excel files')
    }

    setExporting(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams()
      queryParams.set('project_id', projectId)
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              queryParams.set(key, value.join(','))
            } else {
              queryParams.set(key, value.toString())
            }
          }
        })
      }

      const token = await getAccessToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const response = await fetch(`/api/scope/excel/export?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if (!response.ok) {
        throw new Error('Failed to export Excel file')
      }

      // Download the file
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `scope-items-${projectId}-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      return true
    } catch (err) {
      console.error('Error exporting Excel file:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to export Excel file'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setExporting(false)
    }
  }, [profile, projectId, checkPermission])

  return {
    importing,
    exporting,
    error,
    importFromExcel,
    exportToExcel,
    canImport: checkPermission('projects.update'),
    canExport: checkPermission('projects.read.all')
  }
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

// Hook for scope dependencies
export const useScopeDependencies = (itemId: string) => {
  const { profile, getAccessToken } = useAuth()
  const [dependencies, setDependencies] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchDependencies = useCallback(async () => {
    if (!profile || !itemId) return

    setLoading(true)
    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const response = await fetch(`/api/scope/${itemId}/dependencies`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDependencies(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching dependencies:', error)
    } finally {
      setLoading(false)
    }
  }, [profile, itemId])

  useEffect(() => {
    fetchDependencies()
  }, [fetchDependencies])

  return { dependencies, loading, fetchDependencies }
}

// Hook for scope progress tracking - fixed to prevent circular dependencies
export const useScopeProgress = (scopeItems: ScopeItem[], statistics?: ScopeStatistics) => {
  const progressMetrics = useMemo(() => {
    if (!scopeItems || !scopeItems.length) return null

    const totalItems = scopeItems.length
    const completedItems = scopeItems.filter(item => item.status === 'completed').length
    const inProgressItems = scopeItems.filter(item => item.status === 'in_progress').length
    const blockedItems = scopeItems.filter(item => item.status === 'blocked').length
    
    const overallProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
    
    // Calculate weighted progress including partially completed items
    const weightedProgress = scopeItems.reduce((sum, item) => {
      return sum + (item.progress_percentage || 0)
    }, 0) / totalItems

    return {
      totalItems,
      completedItems,
      inProgressItems,
      blockedItems,
      overallProgress,
      weightedProgress: Math.round(weightedProgress || 0),
      statistics
    }
  }, [scopeItems, statistics])

  return progressMetrics
}

// ============================================================================
// ADVANCED OPTIMIZED SCOPE HOOKS - NEXT GENERATION PATTERNS
// ============================================================================

/**
 * Advanced scope items hook with sophisticated caching and real-time updates
 */
export const useScopeAdvanced = (projectId?: string, params?: ScopeListParams) => {
  const { canViewScope } = usePermissions()

  return useAdvancedApiQuery({
    endpoint: '/api/scope',
    params: {
      project_id: projectId,
      page: params?.page || 1,
      limit: params?.limit || 50,
      include_dependencies: params?.include_dependencies || false,
      include_materials: params?.include_materials || false,
      include_assignments: params?.include_assignments || false,
      ...params?.filters
    },
    enabled: !!projectId && canViewScope(),
    cacheKey: `scope-advanced-${projectId}-${JSON.stringify(params)}`,
    dependencies: [projectId],

    // Advanced caching
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,

    // Performance optimization
    debounceMs: 300,
    retryCount: 3,
    keepPreviousData: true,

    // Real-time updates for scope changes
    realtime: true,
    realtimeChannel: `scope-${projectId}`,

    // Data transformation
    transform: (data) => {
      if (!data?.items) return { items: [], statistics: null, pagination: data?.pagination }

      // Add computed fields to scope items
      const enhancedItems = data.items.map((item: any) => ({
        ...item,
        computed: {
          totalCost: (item.unit_price || 0) * (item.quantity || 0),
          isOverBudget: item.actual_cost > item.estimated_cost,
          progressPercentage: item.progress_percentage || 0,
          daysRemaining: item.due_date ?
            Math.ceil((new Date(item.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
        }
      }))

      return {
        items: enhancedItems,
        statistics: data.statistics,
        pagination: data.pagination
      }
    },

    // Validation
    validate: (data) => data && typeof data === 'object' && Array.isArray(data.items)
  })
}

/**
 * Advanced single scope item hook with real-time updates
 */
export const useScopeItemAdvanced = (itemId: string) => {
  const { canViewScope } = usePermissions()

  return useAdvancedApiQuery({
    endpoint: `/api/scope/${itemId}`,
    enabled: !!itemId && canViewScope(),
    cacheKey: `scope-item-advanced-${itemId}`,
    dependencies: [itemId],

    // Advanced features
    staleTime: 30 * 1000, // 30 seconds
    realtime: true,
    realtimeChannel: `scope-item-${itemId}`,
    keepPreviousData: true,

    // Performance
    retryCount: 3,
    debounceMs: 100,

    // Transform single item
    transform: (data) => {
      if (!data) return null

      return {
        ...data,
        computed: {
          totalCost: (data.unit_price || 0) * (data.quantity || 0),
          isOverBudget: data.actual_cost > data.estimated_cost,
          progressPercentage: data.progress_percentage || 0,
          daysRemaining: data.due_date ?
            Math.ceil((new Date(data.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null,
          canEdit: data.status !== 'completed' && data.status !== 'cancelled'
        }
      }
    },

    // Validation
    validate: (data) => data && typeof data === 'object' && data.id === itemId
  })
}

/**
 * Advanced scope statistics hook with auto-refresh
 */
export const useScopeStatisticsAdvanced = (projectId?: string) => {
  return useAdvancedApiQuery({
    endpoint: '/api/scope/overview',
    params: { project_id: projectId },
    enabled: !!projectId,
    cacheKey: `scope-statistics-advanced-${projectId}`,
    dependencies: [projectId],

    // Longer cache for statistics
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes

    // Auto-refresh statistics
    refetchInterval: 60 * 1000, // 1 minute

    // Transform statistics
    transform: (data) => {
      if (!data) return null

      return {
        ...data,
        computed: {
          completionRate: data.total_items > 0 ? (data.completed_items / data.total_items) * 100 : 0,
          budgetUtilization: data.total_budget > 0 ? (data.spent_budget / data.total_budget) * 100 : 0,
          averageProgress: data.total_items > 0 ? data.total_progress / data.total_items : 0,
          estimatedCompletion: data.remaining_items > 0 && data.average_completion_rate > 0 ?
            new Date(Date.now() + (data.remaining_items / data.average_completion_rate * 24 * 60 * 60 * 1000)) : null
        }
      }
    }
  })
}