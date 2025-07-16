import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { useAdvancedApiQuery } from './useAdvancedApiQuery'

export interface Report {
  id: string
  title: string
  description?: string
  project_id: string
  created_by: string
  created_at: string
  updated_at: string
  type: 'progress' | 'financial' | 'compliance' | 'quality' | 'custom'
  status: 'draft' | 'published' | 'archived'
  template_id?: string
  content?: Record<string, any>
  pdf_path?: string
  published_at?: string
  published_by?: string
  project?: {
    id: string
    name: string
  }
  created_by_user?: {
    id: string
    name: string
    email: string
  }
  lines?: ReportLine[]
  shares?: ReportShare[]
}

export interface ReportLine {
  id: string
  report_id: string
  line_number: number
  title: string
  content: string
  photos?: ReportLinePhoto[]
  created_at: string
  updated_at: string
}

export interface ReportLinePhoto {
  id: string
  report_line_id: string
  file_path: string
  file_size: number
  file_type: string
  caption?: string
  sort_order: number
  created_at: string
}

export interface ReportShare {
  id: string
  report_id: string
  user_id: string
  access_level: 'view' | 'comment' | 'edit'
  shared_at: string
  shared_by: string
  user?: {
    id: string
    name: string
    email: string
  }
}

export interface ReportTemplate {
  id: string
  name: string
  description?: string
  category: string
  fields: string[]
  structure: Record<string, any>
  is_default: boolean
}

export interface ReportFilters {
  projectId?: string
  type?: string
  status?: string
  createdBy?: string
  search?: string
  dateFrom?: string
  dateTo?: string
}

export interface ReportCreateData {
  title: string
  description?: string
  project_id: string
  type: 'progress' | 'financial' | 'compliance' | 'quality' | 'custom'
  template_id?: string
  content?: Record<string, any>
}

export interface ReportUpdateData {
  title?: string
  description?: string
  type?: string
  content?: Record<string, any>
}

export interface ReportLineData {
  title: string
  content: string
  photos?: File[]
}

export interface ReportPublishData {
  title?: string
  description?: string
  shares?: Array<{
    user_id: string
    access_level: 'view' | 'comment' | 'edit'
  }>
}

export function useReports(filters?: ReportFilters) {
  const { getAccessToken } = useAuth()
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false
  })

  // Use advanced API query for reports
  const {
    data: response,
    loading,
    error,
    refetch,
    mutate
  } = useAdvancedApiQuery<{ data: Report[]; pagination?: any }>({
    endpoint: '/api/reports',
    params: {
      page: pagination.page,
      limit: pagination.limit,
      ...(filters?.projectId && { projectId: filters.projectId }),
      ...(filters?.type && { type: filters.type }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.createdBy && { createdBy: filters.createdBy }),
      ...(filters?.search && { search: filters.search }),
      ...(filters?.dateFrom && { dateFrom: filters.dateFrom }),
      ...(filters?.dateTo && { dateTo: filters.dateTo })
    },
    cacheKey: `reports-${JSON.stringify(filters)}-${pagination.page}`,
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

  const fetchReports = useCallback(async (page = 1, reset = false) => {
    setPagination(prev => ({ ...prev, page }))
    return refetch()
  }, [refetch])

  const createReport = useCallback(async (reportData: ReportCreateData) => {
    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No authentication token')
      }

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to create report')
      }

      // Optimistically update the cache
      mutate(prev => {
        if (!prev) return { data: [result.data] }
        return {
          ...prev,
          data: [result.data, ...prev.data]
        }
      }, false)

      return result.data
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create report')
    }
  }, [getAccessToken, mutate])

  const updateReport = useCallback(async (id: string, updateData: ReportUpdateData) => {
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

      const response = await fetch(`/api/reports/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        // Revert optimistic update on error
        fetchReports(1, true)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        fetchReports(1, true)
        throw new Error(result.error || 'Failed to update report')
      }

      return result.data
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update report')
    }
  }, [getAccessToken, fetchReports])

  const deleteReport = useCallback(async (id: string) => {
    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No authentication token')
      }

      // Optimistic update
      setData(prevData => prevData.filter(item => item.id !== id))

      const response = await fetch(`/api/reports/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        // Revert optimistic update on error
        fetchReports(1, true)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        fetchReports(1, true)
        throw new Error(result.error || 'Failed to delete report')
      }

      return true
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete report')
    }
  }, [getAccessToken, fetchReports])

  const addReportLine = useCallback(async (reportId: string, lineData: ReportLineData) => {
    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No authentication token')
      }

      const formData = new FormData()
      formData.append('title', lineData.title)
      formData.append('content', lineData.content)
      
      if (lineData.photos) {
        lineData.photos.forEach((photo, index) => {
          formData.append(`photos`, photo)
        })
      }

      const response = await fetch(`/api/reports/${reportId}/lines`, {
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
        throw new Error(result.error || 'Failed to add report line')
      }

      // Update local state
      setData(prevData => 
        prevData.map(item => 
          item.id === reportId 
            ? { ...item, lines: [...(item.lines || []), result.data] }
            : item
        )
      )

      return result.data
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to add report line')
    }
  }, [getAccessToken])

  const publishReport = useCallback(async (id: string, publishData: ReportPublishData) => {
    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No authentication token')
      }

      const response = await fetch(`/api/reports/${id}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(publishData)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to publish report')
      }

      // Update local state
      setData(prevData => 
        prevData.map(item => 
          item.id === id 
            ? { ...item, status: 'published' as const, published_at: new Date().toISOString() }
            : item
        )
      )

      return result.data
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to publish report')
    }
  }, [getAccessToken])

  const generatePDF = useCallback(async (id: string) => {
    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No authentication token')
      }

      const response = await fetch(`/api/reports/${id}/generate-pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${id}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      return true
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to generate PDF')
    }
  }, [getAccessToken])

  const loadMore = useCallback(() => {
    if (!loading && pagination.hasMore) {
      fetchReports(pagination.page + 1, false)
    }
  }, [loading, pagination.hasMore, pagination.page, fetchReports])

  const refresh = useCallback(() => {
    fetchReports(1, true)
  }, [fetchReports])

  // Initial load
  useEffect(() => {
    fetchReports(1, true)
  }, [filters])

  return {
    data,
    loading,
    error,
    pagination,
    createReport,
    updateReport,
    deleteReport,
    addReportLine,
    publishReport,
    generatePDF,
    loadMore,
    refresh,
    refetch,
    mutate
  }
}

export function useReport(id: string) {
  // Use advanced API query for single report
  const {
    data: response,
    loading,
    error,
    refetch,
    mutate
  } = useAdvancedApiQuery<{ data: Report }>({
    endpoint: `/api/reports/${id}`,
    enabled: !!id,
    cacheKey: `report-${id}`,
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

export function useReportTemplates() {
  // Use advanced API query for report templates
  const {
    data: response,
    loading,
    error,
    refetch,
    mutate
  } = useAdvancedApiQuery<{ data: ReportTemplate[] }>({
    endpoint: '/api/reports/templates',
    cacheKey: 'report-templates',
    staleTime: 10 * 60 * 1000, // 10 minutes (templates don't change often)
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false // Templates rarely change
  })

  const data = response?.data || []

  return {
    data,
    loading,
    error,
    refresh: refetch,
    refetch,
    mutate
  }
}