/**
 * Client Portal Hook
 * Custom hook for client portal data management
 * Following Formula PM patterns for external client access
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  ClientDashboardData, 
  ClientProjectDetails, 
  ClientDocumentAccess,
  ClientNotification,
  ClientCommunicationThread,
  ClientMessage,
  ClientActivityLog,
  ClientDocumentApproval,
  ClientDocumentComment,
  ClientDocumentFilters,
  ClientNotificationFilters,
  ClientActivityFilters,
  ClientThreadFilters,
  ClientApiResponse,
  ClientListResponse
} from '@/types/client-portal'

// ============================================================================
// Main Client Portal Hook
// ============================================================================

interface UseClientPortalProps {
  projectId?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export const useClientPortal = ({
  projectId,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}: UseClientPortalProps = {}) => {
  const [dashboardData, setDashboardData] = useState<ClientDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch('/api/client-portal/dashboard', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Dashboard fetch failed: ${response.statusText}`)
      }

      const result: ClientApiResponse<ClientDashboardData> = await response.json()
      
      if (result.success && result.data) {
        setDashboardData(result.data)
        setLastRefresh(new Date())
      } else {
        throw new Error(result.error || 'Failed to fetch dashboard data')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Client portal dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-refresh effect
  useEffect(() => {
    fetchDashboardData()

    if (autoRefresh) {
      const interval = setInterval(fetchDashboardData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchDashboardData, autoRefresh, refreshInterval])

  return {
    dashboardData,
    loading,
    error,
    lastRefresh,
    refresh: fetchDashboardData
  }
}

// ============================================================================
// Client Authentication Hook
// ============================================================================

interface ClientUser {
  id: string
  email: string
  company_name: string
  access_level: string
  theme: string
  language: string
  timezone: string
}

export const useClientAuth = () => {
  const [user, setUser] = useState<ClientUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Login function
  const login = useCallback(async (email: string, password: string, companyCode?: string) => {
    try {
      setError(null)
      setLoading(true)

      const response = await fetch('/api/client-portal/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          company_code: companyCode
        })
      })

      if (!response.ok) {
        throw new Error(`Login failed: ${response.statusText}`)
      }

      const result: ClientApiResponse<{ user: ClientUser }> = await response.json()
      
      if (result.success && result.data) {
        setUser(result.data.user)
        return { success: true }
      } else {
        throw new Error(result.error || 'Login failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  // Logout function
  const logout = useCallback(async () => {
    try {
      await fetch('/api/client-portal/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } finally {
      setUser(null)
    }
  }, [])

  // Password reset
  const resetPassword = useCallback(async (email: string, companyCode?: string) => {
    try {
      setError(null)

      const response = await fetch('/api/client-portal/auth/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          company_code: companyCode
        })
      })

      if (!response.ok) {
        throw new Error(`Password reset failed: ${response.statusText}`)
      }

      const result: ClientApiResponse<null> = await response.json()
      
      if (result.success) {
        return { success: true }
      } else {
        throw new Error(result.error || 'Password reset failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Password reset failed'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [])

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/client-portal/auth/profile', {
        credentials: 'include'
      })

      if (response.ok) {
        const result: ClientApiResponse<{ user: ClientUser }> = await response.json()
        if (result.success && result.data) {
          setUser(result.data.user)
        }
      }
    } catch (err) {
      console.error('Auth check failed:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Check auth on mount
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return {
    user,
    loading,
    error,
    login,
    logout,
    resetPassword,
    checkAuth,
    isAuthenticated: !!user
  }
}

// ============================================================================
// Client Projects Hook
// ============================================================================

export const useClientProjects = () => {
  const [projects, setProjects] = useState<ClientProjectDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/client-portal/dashboard/projects', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Projects fetch failed: ${response.statusText}`)
      }

      const result: ClientApiResponse<ClientProjectDetails[]> = await response.json()
      
      if (result.success && result.data) {
        setProjects(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch projects')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch projects'
      setError(errorMessage)
      console.error('Client projects error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const getProject = useCallback(async (projectId: string): Promise<ClientProjectDetails | null> => {
    try {
      const response = await fetch(`/api/client-portal/projects/${projectId}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Project fetch failed: ${response.statusText}`)
      }

      const result: ClientApiResponse<ClientProjectDetails> = await response.json()
      
      if (result.success && result.data) {
        return result.data
      } else {
        throw new Error(result.error || 'Failed to fetch project')
      }
    } catch (err) {
      console.error('Client project error:', err)
      return null
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return {
    projects,
    loading,
    error,
    fetchProjects,
    getProject
  }
}

// ============================================================================
// Client Documents Hook
// ============================================================================

export const useClientDocuments = (projectId?: string) => {
  const [documents, setDocuments] = useState<ClientDocumentAccess[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  const fetchDocuments = useCallback(async (filters: ClientDocumentFilters = {}) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      
      if (projectId) params.set('project_id', projectId)
      if (filters.document_type?.length) params.set('document_type', filters.document_type.join(','))
      if (filters.status?.length) params.set('status', filters.status.join(','))
      if (filters.requires_approval !== undefined) params.set('requires_approval', filters.requires_approval.toString())
      if (filters.search) params.set('search', filters.search)
      if (filters.page) params.set('page', filters.page.toString())
      if (filters.limit) params.set('limit', filters.limit.toString())
      if (filters.sort_field) params.set('sort_field', filters.sort_field)
      if (filters.sort_direction) params.set('sort_direction', filters.sort_direction)

      const response = await fetch(`/api/client-portal/documents?${params.toString()}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Documents fetch failed: ${response.statusText}`)
      }

      const result: ClientApiResponse<ClientListResponse<ClientDocumentAccess>> = await response.json()
      
      if (result.success && result.data) {
        setDocuments(result.data.items)
        setTotalCount(result.data.pagination.total)
      } else {
        throw new Error(result.error || 'Failed to fetch documents')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch documents'
      setError(errorMessage)
      console.error('Client documents error:', err)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const downloadDocument = useCallback(async (documentId: string) => {
    try {
      const response = await fetch(`/api/client-portal/documents/${documentId}/download`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Document download failed: ${response.statusText}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `document-${documentId}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Download failed'
      console.error('Document download error:', err)
      return { success: false, error: errorMessage }
    }
  }, [])

  const approveDocument = useCallback(async (documentId: string, approval: Omit<ClientDocumentApproval, 'id' | 'client_user_id'>) => {
    try {
      const response = await fetch(`/api/client-portal/documents/${documentId}/approve`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(approval)
      })

      if (!response.ok) {
        throw new Error(`Document approval failed: ${response.statusText}`)
      }

      const result: ClientApiResponse<null> = await response.json()
      
      if (result.success) {
        // Refresh documents list
        await fetchDocuments()
        return { success: true }
      } else {
        throw new Error(result.error || 'Approval failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Approval failed'
      console.error('Document approval error:', err)
      return { success: false, error: errorMessage }
    }
  }, [fetchDocuments])

  const addComment = useCallback(async (documentId: string, comment: Omit<ClientDocumentComment, 'id' | 'client_user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch(`/api/client-portal/documents/${documentId}/comment`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(comment)
      })

      if (!response.ok) {
        throw new Error(`Comment failed: ${response.statusText}`)
      }

      const result: ClientApiResponse<ClientDocumentComment> = await response.json()
      
      if (result.success) {
        return { success: true, data: result.data }
      } else {
        throw new Error(result.error || 'Comment failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Comment failed'
      console.error('Document comment error:', err)
      return { success: false, error: errorMessage }
    }
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  return {
    documents,
    loading,
    error,
    totalCount,
    fetchDocuments,
    downloadDocument,
    approveDocument,
    addComment
  }
}

// ============================================================================
// Client Notifications Hook
// ============================================================================

export const useClientNotifications = () => {
  const [notifications, setNotifications] = useState<ClientNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = useCallback(async (filters: ClientNotificationFilters = {}) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      
      if (filters.notification_type?.length) params.set('notification_type', filters.notification_type.join(','))
      if (filters.priority?.length) params.set('priority', filters.priority.join(','))
      if (filters.is_read !== undefined) params.set('is_read', filters.is_read.toString())
      if (filters.page) params.set('page', filters.page.toString())
      if (filters.limit) params.set('limit', filters.limit.toString())
      if (filters.sort_field) params.set('sort_field', filters.sort_field)
      if (filters.sort_direction) params.set('sort_direction', filters.sort_direction)

      const response = await fetch(`/api/client-portal/notifications?${params.toString()}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Notifications fetch failed: ${response.statusText}`)
      }

      const result: ClientApiResponse<ClientListResponse<ClientNotification>> = await response.json()
      
      if (result.success && result.data) {
        setNotifications(result.data.items)
        setUnreadCount(result.data.items.filter(n => !n.is_read).length)
      } else {
        throw new Error(result.error || 'Failed to fetch notifications')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notifications'
      setError(errorMessage)
      console.error('Client notifications error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/client-portal/notifications/${notificationId}/read`, {
        method: 'PUT',
        credentials: 'include'
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, is_read: true, read_at: new Date() }
              : n
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Mark notification as read error:', err)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
      
      if (unreadIds.length === 0) return

      const response = await fetch('/api/client-portal/notifications/bulk/read', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ item_ids: unreadIds })
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, is_read: true, read_at: new Date() }))
        )
        setUnreadCount(0)
      }
    } catch (err) {
      console.error('Mark all notifications as read error:', err)
    }
  }, [notifications])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  }
}

// ============================================================================
// Client Communications Hook
// ============================================================================

export const useClientCommunications = (projectId?: string) => {
  const [threads, setThreads] = useState<ClientCommunicationThread[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchThreads = useCallback(async (filters: ClientThreadFilters = {}) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      
      if (projectId) params.set('project_id', projectId)
      if (filters.thread_type?.length) params.set('thread_type', filters.thread_type.join(','))
      if (filters.status?.length) params.set('status', filters.status.join(','))
      if (filters.priority?.length) params.set('priority', filters.priority.join(','))
      if (filters.page) params.set('page', filters.page.toString())
      if (filters.limit) params.set('limit', filters.limit.toString())
      if (filters.sort_field) params.set('sort_field', filters.sort_field)
      if (filters.sort_direction) params.set('sort_direction', filters.sort_direction)

      const response = await fetch(`/api/client-portal/communications/threads?${params.toString()}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Threads fetch failed: ${response.statusText}`)
      }

      const result: ClientApiResponse<ClientListResponse<ClientCommunicationThread>> = await response.json()
      
      if (result.success && result.data) {
        setThreads(result.data.items)
      } else {
        throw new Error(result.error || 'Failed to fetch threads')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch threads'
      setError(errorMessage)
      console.error('Client threads error:', err)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const createThread = useCallback(async (threadData: {
    project_id: string
    subject: string
    thread_type?: string
    priority?: string
    message_body: string
  }) => {
    try {
      const response = await fetch('/api/client-portal/communications/threads', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(threadData)
      })

      if (!response.ok) {
        throw new Error(`Thread creation failed: ${response.statusText}`)
      }

      const result: ClientApiResponse<ClientCommunicationThread> = await response.json()
      
      if (result.success && result.data) {
        setThreads(prev => [result.data, ...prev])
        return { success: true, data: result.data }
      } else {
        throw new Error(result.error || 'Failed to create thread')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create thread'
      console.error('Create thread error:', err)
      return { success: false, error: errorMessage }
    }
  }, [])

  const sendMessage = useCallback(async (threadId: string, messageBody: string, attachments: any[] = []) => {
    try {
      const response = await fetch(`/api/client-portal/communications/threads/${threadId}/messages`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message_body: messageBody,
          attachments
        })
      })

      if (!response.ok) {
        throw new Error(`Send message failed: ${response.statusText}`)
      }

      const result: ClientApiResponse<ClientMessage> = await response.json()
      
      if (result.success) {
        // Update thread's last message time
        setThreads(prev => 
          prev.map(thread => 
            thread.id === threadId 
              ? { ...thread, last_message_at: new Date() }
              : thread
          )
        )
        return { success: true, data: result.data }
      } else {
        throw new Error(result.error || 'Failed to send message')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message'
      console.error('Send message error:', err)
      return { success: false, error: errorMessage }
    }
  }, [])

  const markThreadAsRead = useCallback(async (threadId: string) => {
    try {
      await fetch(`/api/client-portal/communications/threads/${threadId}/read`, {
        method: 'PUT',
        credentials: 'include'
      })
    } catch (err) {
      console.error('Mark thread as read error:', err)
    }
  }, [])

  useEffect(() => {
    fetchThreads()
  }, [fetchThreads])

  return {
    threads,
    loading,
    error,
    fetchThreads,
    createThread,
    sendMessage,
    markThreadAsRead
  }
}

// ============================================================================
// Client Activities Hook
// ============================================================================

export const useClientActivities = (projectId?: string) => {
  const [activities, setActivities] = useState<ClientActivityLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchActivities = useCallback(async (filters: ClientActivityFilters = {}) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      
      if (projectId) params.set('project_id', projectId)
      if (filters.activity_type?.length) params.set('activity_type', filters.activity_type.join(','))
      if (filters.page) params.set('page', filters.page.toString())
      if (filters.limit) params.set('limit', filters.limit.toString())
      if (filters.sort_field) params.set('sort_field', filters.sort_field)
      if (filters.sort_direction) params.set('sort_direction', filters.sort_direction)

      const response = await fetch(`/api/client-portal/dashboard/activities?${params.toString()}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Activities fetch failed: ${response.statusText}`)
      }

      const result: ClientApiResponse<ClientListResponse<ClientActivityLog>> = await response.json()
      
      if (result.success && result.data) {
        setActivities(result.data.items)
      } else {
        throw new Error(result.error || 'Failed to fetch activities')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch activities'
      setError(errorMessage)
      console.error('Client activities error:', err)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  return {
    activities,
    loading,
    error,
    fetchActivities
  }
}