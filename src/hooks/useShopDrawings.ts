import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { useAdvancedApiQuery } from './useAdvancedApiQuery'

export interface ShopDrawing {
  id: string
  title: string
  description?: string
  project_id: string
  created_by: string
  created_at: string
  updated_at: string
  file_path?: string
  file_size?: number
  file_type?: string
  status: 'draft' | 'pending_internal_review' | 'ready_for_client_review' | 'client_reviewing' | 'approved' | 'rejected' | 'revision_requested'
  current_submission_id?: string
  project?: {
    id: string
    name: string
  }
  created_by_user?: {
    id: string
    name: string
    email: string
  }
  current_submission?: {
    id: string
    status: string
    submitted_at: string
    submitted_by: string
    reviews: ShopDrawingReview[]
  }
}

export interface ShopDrawingSubmission {
  id: string
  shop_drawing_id: string
  status: 'pending' | 'internal_approved' | 'ready_for_client' | 'client_approved' | 'rejected' | 'revision_requested'
  submitted_at: string
  submitted_by: string
  file_path?: string
  version_number: number
  notes?: string
  reviews: ShopDrawingReview[]
}

export interface ShopDrawingReview {
  id: string
  submission_id: string
  reviewer_id: string
  review_type: 'internal' | 'client'
  status: 'approved' | 'rejected' | 'revision_requested'
  comments?: string
  reviewed_at: string
  reviewer?: {
    id: string
    name: string
    email: string
  }
}

export interface ShopDrawingFilters {
  projectId?: string
  status?: string
  createdBy?: string
  search?: string
  dateFrom?: string
  dateTo?: string
}

export interface ShopDrawingCreateData {
  title: string
  description?: string
  project_id: string
  file?: File
}

export interface ShopDrawingUpdateData {
  title?: string
  description?: string
  status?: string
}

export interface ShopDrawingSubmissionData {
  notes?: string
  file?: File
}

export interface ShopDrawingReviewData {
  status: 'approved' | 'rejected' | 'revision_requested'
  comments?: string
}

export function useShopDrawings(filters?: ShopDrawingFilters) {
  const { getAccessToken } = useAuth()
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false
  })

  // Use advanced API query for shop drawings
  const {
    data: response,
    loading,
    error,
    refetch,
    mutate
  } = useAdvancedApiQuery<{ data: ShopDrawing[]; pagination?: any }>({
    endpoint: '/api/shop-drawings',
    params: {
      page: pagination.page,
      limit: pagination.limit,
      ...(filters?.projectId && { projectId: filters.projectId }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.createdBy && { createdBy: filters.createdBy }),
      ...(filters?.search && { search: filters.search }),
      ...(filters?.dateFrom && { dateFrom: filters.dateFrom }),
      ...(filters?.dateTo && { dateTo: filters.dateTo })
    },
    cacheKey: `shop-drawings-${JSON.stringify(filters)}-${pagination.page}`,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    keepPreviousData: true,
    onSuccess: (data) => {
      if (data.pagination) {
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          hasMore: data.pagination.hasMore
        }))
      }
    }
  })

  const data = response?.data || []

  const fetchShopDrawings = useCallback(async (page = 1, reset = false) => {
    setPagination(prev => ({ ...prev, page }))
    return refetch()
  }, [refetch])

  const createShopDrawing = useCallback(async (data: ShopDrawingCreateData) => {
    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No authentication token')
      }

      const formData = new FormData()
      formData.append('title', data.title)
      formData.append('project_id', data.project_id)
      if (data.description) {
        formData.append('description', data.description)
      }
      if (data.file) {
        formData.append('file', data.file)
      }

      const response = await fetch('/api/shop-drawings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to create shop drawing')
      }

      // Add to local state for immediate UI update
      setData(prevData => [result.data, ...prevData])
      return result.data
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create shop drawing')
    }
  }, [getAccessToken])

  const updateShopDrawing = useCallback(async (id: string, updateData: ShopDrawingUpdateData) => {
    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No authentication token')
      }

      // Optimistic update
      setData(prevData => 
        prevData.map(item => 
          item.id === id ? { ...item, ...updateData } : item
        )
      )

      const response = await fetch(`/api/shop-drawings/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        // Revert optimistic update on error
        fetchShopDrawings(1, true)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        fetchShopDrawings(1, true)
        throw new Error(result.error || 'Failed to update shop drawing')
      }

      return result.data
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update shop drawing')
    }
  }, [getAccessToken, fetchShopDrawings])

  const deleteShopDrawing = useCallback(async (id: string) => {
    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No authentication token')
      }

      // Optimistic update
      setData(prevData => prevData.filter(item => item.id !== id))

      const response = await fetch(`/api/shop-drawings/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        // Revert optimistic update on error
        fetchShopDrawings(1, true)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        fetchShopDrawings(1, true)
        throw new Error(result.error || 'Failed to delete shop drawing')
      }

      return true
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete shop drawing')
    }
  }, [getAccessToken, fetchShopDrawings])

  const submitForReview = useCallback(async (id: string, submissionData: ShopDrawingSubmissionData) => {
    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No authentication token')
      }

      const formData = new FormData()
      if (submissionData.notes) {
        formData.append('notes', submissionData.notes)
      }
      if (submissionData.file) {
        formData.append('file', submissionData.file)
      }

      const response = await fetch(`/api/shop-drawings/${id}/submissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to submit for review')
      }

      // Update local state
      setData(prevData => 
        prevData.map(item => 
          item.id === id ? { ...item, status: 'pending_internal_review' } : item
        )
      )

      return result.data
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to submit for review')
    }
  }, [getAccessToken])

  const submitReview = useCallback(async (submissionId: string, reviewData: ShopDrawingReviewData) => {
    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No authentication token')
      }

      const response = await fetch(`/api/shop-drawings/submissions/${submissionId}/reviews`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reviewData)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to submit review')
      }

      // Refresh data to get updated status
      fetchShopDrawings(1, true)
      return result.data
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to submit review')
    }
  }, [getAccessToken, fetchShopDrawings])

  const markReadyForClient = useCallback(async (submissionId: string) => {
    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No authentication token')
      }

      const response = await fetch(`/api/shop-drawings/submissions/${submissionId}/ready-for-client`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to mark ready for client')
      }

      // Refresh data to get updated status
      fetchShopDrawings(1, true)
      return result.data
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to mark ready for client')
    }
  }, [getAccessToken, fetchShopDrawings])

  const loadMore = useCallback(() => {
    if (!loading && pagination.hasMore) {
      fetchShopDrawings(pagination.page + 1, false)
    }
  }, [loading, pagination.hasMore, pagination.page, fetchShopDrawings])

  const refresh = useCallback(() => {
    fetchShopDrawings(1, true)
  }, [fetchShopDrawings])

  // Initial load
  useEffect(() => {
    fetchShopDrawings(1, true)
  }, [filters])

  return {
    data,
    loading,
    error,
    pagination,
    createShopDrawing,
    updateShopDrawing,
    deleteShopDrawing,
    submitForReview,
    submitReview,
    markReadyForClient,
    loadMore,
    refresh,
    refetch,
    mutate
  }
}

export function useShopDrawing(id: string) {
  // Use advanced API query for single shop drawing
  const {
    data: response,
    loading,
    error,
    refetch,
    mutate
  } = useAdvancedApiQuery<{ data: ShopDrawing }>({
    endpoint: `/api/shop-drawings/${id}`,
    enabled: !!id,
    cacheKey: `shop-drawing-${id}`,
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    dependencies: [id]
  })

  const data = response?.data || null

  return {
    data,
    loading,
    error,
    refresh: refetch,
    refetch,
    mutate
  }
}