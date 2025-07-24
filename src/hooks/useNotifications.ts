/**
 * useNotifications Hook - Real API integration with Supabase
 * Uses consistent patterns from existing hooks
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'

interface Notification {
  id: string
  type: 'info' | 'warning' | 'success' | 'error'
  category: 'project' | 'task' | 'client' | 'system' | 'approval'
  title: string
  message: string
  timestamp: string
  read: boolean
  actionUrl?: string
  actionText?: string
  priority: 'low' | 'medium' | 'high'
  from?: {
    name: string
    role: string
  }
}

interface NotificationsResponse {
  success: boolean
  data: Notification[]
  pagination?: {
    page: number
    limit: number
    total: number
    has_more: boolean
  }
  error?: string
}

interface UseNotificationsOptions {
  page?: number
  limit?: number
  category?: string
  read?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { user, getAccessToken } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<NotificationsResponse['pagination']>()
  const [currentPage, setCurrentPage] = useState(1)

  const {
    page = 1,
    limit = 20,
    category,
    read,
    autoRefresh = false,
    refreshInterval = 30000 // 30 seconds
  } = options

  // Update current page when page option changes
  useEffect(() => {
    setCurrentPage(page)
  }, [page])

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setLoading(false)
      setError('User not authenticated')
      return
    }

    try {
      setError(null)
      const token = await getAccessToken()
      
      if (!token) {
        throw new Error('Authentication token not available')
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      })

      if (category && category !== 'all') {
        params.append('category', category)
      }

      if (read !== undefined) {
        params.append('read', read.toString())
      }

      const response = await fetch(`/api/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`)
      }

      const result: NotificationsResponse = await response.json()

      if (result.success && result.data) {
        setNotifications(Array.isArray(result.data) ? result.data : [])
        setPagination(result.pagination)
      } else {
        throw new Error(result.error || 'Failed to fetch notifications - invalid response format')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred while fetching notifications'
      console.error('Error fetching notifications:', errorMessage)
      setError(errorMessage)
      setNotifications([]) // Clear notifications on error
    } finally {
      setLoading(false)
    }
  }, [user, getAccessToken, currentPage, limit, category, read])

  // Mark notification as read/unread
  const markAsRead = useCallback(async (notificationId: string, isRead: boolean = true) => {
    if (!user) return

    try {
      const token = await getAccessToken()
      
      if (!token) {
        throw new Error('Authentication token not available')
      }

      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ read: isRead }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update notification')
      }

      // Update local state
      setNotifications(prev => prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: isRead }
          : notification
      ))

    } catch (err) {
      console.error('Error updating notification:', err)
      throw err
    }
  }, [user, getAccessToken])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return

    try {
      // Update all unread notifications
      const unreadNotifications = notifications.filter(n => !n.read)
      
      for (const notification of unreadNotifications) {
        await markAsRead(notification.id, true)
      }

    } catch (err) {
      console.error('Error marking all notifications as read:', err)
      throw err
    }
  }, [notifications, markAsRead, user])

  // Refresh notifications
  const refresh = useCallback(() => {
    setLoading(true)
    fetchNotifications()
  }, [fetchNotifications])

  // Pagination functions
  const goToPage = useCallback((newPage: number) => {
    if (pagination && newPage >= 1 && newPage <= Math.ceil(pagination.total / pagination.limit) && newPage !== currentPage) {
      setCurrentPage(newPage)
      setLoading(true)
    }
  }, [pagination, currentPage])

  const nextPage = useCallback(() => {
    if (pagination?.has_more) {
      goToPage(currentPage + 1)
    }
  }, [pagination, currentPage, goToPage])

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1)
    }
  }, [currentPage, goToPage])

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || !user) return

    const intervalId = setInterval(() => {
      fetchNotifications()
    }, refreshInterval)

    return () => clearInterval(intervalId)
  }, [autoRefresh, refreshInterval, fetchNotifications, user])

  return {
    notifications,
    loading,
    error,
    pagination,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refresh,
    refetch: fetchNotifications,
    // Pagination functions
    goToPage,
    nextPage,
    prevPage
  }
}