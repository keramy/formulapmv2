/**
 * Formula PM 2.0 Tasks Hook
 * V3 Phase 1 Implementation
 * 
 * Hook for task data management and API integration
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Task, TaskFormData, TaskFilters, TaskStatistics, TaskPermissions } from '@/types/tasks'
import { useAuth } from './useAuth'
import { hasPermission } from '@/lib/permissions'
import { useApiQuery } from './useApiQuery'

// ============================================================================
// OPTIMIZED TASK HOOKS (New Pattern)
// ============================================================================

/**
 * Optimized task hook using useApiQuery pattern
 * This is the new recommended way to fetch tasks
 */
export const useTasksOptimized = (projectId: string, filters?: TaskFilters) => {
  const { profile, getAccessToken } = useAuth()

  // Calculate permissions
  const permissions: TaskPermissions = {
    canCreate: profile?.role ? (hasPermission(profile.role, 'projects.create') ||
               hasPermission(profile.role, 'projects.update')) : false,
    canEdit: profile?.role ? (hasPermission(profile.role, 'projects.update') ||
             hasPermission(profile.role, 'projects.create')) : false,
    canDelete: profile?.role ? hasPermission(profile.role, 'projects.delete') : false,
    canAssign: profile?.role ? (hasPermission(profile.role, 'projects.update') ||
               hasPermission(profile.role, 'projects.create')) : false,
    canChangeStatus: profile?.role ? (hasPermission(profile.role, 'projects.update') ||
                     hasPermission(profile.role, 'projects.create')) : false,
    canComment: profile?.role ? (hasPermission(profile.role, 'projects.read.all') ||
                hasPermission(profile.role, 'projects.read.assigned')) : false,
    canViewAll: profile?.role ? (hasPermission(profile.role, 'projects.read.all') ||
                hasPermission(profile.role, 'projects.read.assigned')) : false
  }

  // Use the new useApiQuery hook for data fetching
  const { data, loading, error, refetch } = useApiQuery({
    endpoint: `/api/projects/${projectId}/tasks`,
    params: {
      ...filters,
      include_assignee: true,
      include_project: true
    },
    enabled: !!projectId && !!profile,
    cacheKey: `tasks-${projectId}-${JSON.stringify(filters)}`,
    dependencies: [projectId, profile?.id]
  })

  return {
    tasks: data?.tasks || [],
    statistics: data?.statistics || null,
    loading,
    error,
    permissions,
    refetch,
    // Computed values
    totalCount: data?.pagination?.total || 0,
    hasMore: data?.pagination?.has_more || false
  }
}

/**
 * Task statistics hook
 */
export const useTaskStatistics = (projectId?: string) => {
  return useApiQuery({
    endpoint: projectId ? `/api/projects/${projectId}/tasks/statistics` : '/api/tasks/statistics',
    enabled: !!projectId,
    cacheKey: `task-statistics-${projectId || 'all'}`,
    dependencies: [projectId]
  })
}

/**
 * Single task hook
 */
export const useTask = (taskId: string) => {
  return useApiQuery({
    endpoint: `/api/tasks/${taskId}`,
    enabled: !!taskId,
    cacheKey: `task-${taskId}`,
    dependencies: [taskId],
    params: {
      include_assignee: true,
      include_project: true,
      include_comments: true
    }
  })
}

// ============================================================================
// LEGACY TASK HOOK (Keep for backward compatibility)
// ============================================================================

interface UseTasksReturn {
  tasks: Task[]
  statistics: TaskStatistics | null
  loading: boolean
  error: string | null
  permissions: TaskPermissions
  createTask: (data: TaskFormData) => Promise<Task | null>
  updateTask: (id: string, data: Partial<TaskFormData>) => Promise<Task | null>
  deleteTask: (id: string) => Promise<boolean>
  updateTaskStatus: (id: string, status: Task['status']) => Promise<boolean>
  bulkUpdateTasks: (ids: string[], updates: any) => Promise<boolean>
  refetch: () => Promise<void>
}

export function useTasks(projectId: string, filters?: TaskFilters): UseTasksReturn {
  const { user, profile, getAccessToken } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [statistics, setStatistics] = useState<TaskStatistics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate permissions based on user role
  const permissions: TaskPermissions = {
    canCreate: profile?.role ? (hasPermission(profile.role, 'projects.create') || 
               hasPermission(profile.role, 'projects.update')) : false,
    canEdit: profile?.role ? (hasPermission(profile.role, 'projects.update') || 
             hasPermission(profile.role, 'projects.create')) : false,
    canDelete: profile?.role ? hasPermission(profile.role, 'projects.delete') : false,
    canAssign: profile?.role ? (hasPermission(profile.role, 'projects.update') || 
               hasPermission(profile.role, 'projects.create')) : false,
    canChangeStatus: profile?.role ? (hasPermission(profile.role, 'projects.update') || 
                     hasPermission(profile.role, 'projects.create')) : false,
    canComment: profile?.role ? (hasPermission(profile.role, 'projects.read.all') || 
                hasPermission(profile.role, 'projects.read.assigned')) : false,
    canViewAll: profile?.role ? (hasPermission(profile.role, 'projects.read.all') || 
                hasPermission(profile.role, 'projects.read.assigned')) : false
  }

  // Fetch tasks for the project
  const fetchTasks = useCallback(async () => {
    if (!projectId || !user) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        include_assignee: 'true',
        include_assigner: 'true',
        include_scope_item: 'true',
        include_project: 'true'
      })

      // Add filters if provided
      if (filters) {
        if (filters.status?.length) {
          params.set('status', filters.status.join(','))
        }
        if (filters.priority?.length) {
          params.set('priority', filters.priority.join(','))
        }
        if (filters.assignee) {
          params.set('assignee', filters.assignee)
        }
        if (filters.search) {
          params.set('search', filters.search)
        }
        if (filters.due_date_start) {
          params.set('due_date_start', filters.due_date_start)
        }
        if (filters.due_date_end) {
          params.set('due_date_end', filters.due_date_end)
        }
        if (filters.scope_item_id) {
          params.set('scope_item_id', filters.scope_item_id)
        }
        if (filters.tags?.length) {
          params.set('tags', filters.tags.join(','))
        }
        if (filters.overdue_only) {
          params.set('overdue_only', 'true')
        }
        if (filters.assigned_to_me) {
          params.set('assigned_to_me', 'true')
        }
        if (filters.assigned_by_me) {
          params.set('assigned_by_me', 'true')
        }
        if (filters.completed_only) {
          params.set('completed_only', 'true')
        }
        if (filters.created_by) {
          params.set('created_by', filters.created_by)
        }
      }

      const token = await getAccessToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const response = await fetch(`/api/projects/${projectId}/tasks?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }

      const data = await response.json()
      
      if (data.success) {
        setTasks(data.data || [])
        setStatistics(data.pagination?.statistics || null)
      } else {
        throw new Error(data.error || 'Failed to fetch tasks')
      }
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [projectId, user, filters])

  // Create new task
  const createTask = async (data: TaskFormData): Promise<Task | null> => {
    if (!projectId || !user) return null

    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to create task')
      }

      const result = await response.json()
      
      if (result.success) {
        const newTask = result.data
        setTasks(prev => [...prev, newTask])
        // Refetch to get updated statistics
        await fetchTasks()
        return newTask
      } else {
        throw new Error(result.error || 'Failed to create task')
      }
    } catch (err) {
      console.error('Error creating task:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      return null
    }
  }

  // Update existing task
  const updateTask = async (id: string, data: Partial<TaskFormData>): Promise<Task | null> => {
    if (!user) return null

    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to update task')
      }

      const result = await response.json()
      
      if (result.success) {
        const updatedTask = result.data
        setTasks(prev => prev.map(t => t.id === id ? updatedTask : t))
        return updatedTask
      } else {
        throw new Error(result.error || 'Failed to update task')
      }
    } catch (err) {
      console.error('Error updating task:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      return null
    }
  }

  // Delete task
  const deleteTask = async (id: string): Promise<boolean> => {
    if (!user) return false

    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete task')
      }

      const result = await response.json()
      
      if (result.success) {
        setTasks(prev => prev.filter(t => t.id !== id))
        return true
      } else {
        throw new Error(result.error || 'Failed to delete task')
      }
    } catch (err) {
      console.error('Error deleting task:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      return false
    }
  }

  // Update task status
  const updateTaskStatus = async (id: string, status: Task['status']): Promise<boolean> => {
    if (!user) return false

    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        throw new Error('Failed to update task status')
      }

      const result = await response.json()
      
      if (result.success) {
        const updatedTask = result.data
        setTasks(prev => prev.map(t => t.id === id ? updatedTask : t))
        return true
      } else {
        throw new Error(result.error || 'Failed to update task status')
      }
    } catch (err) {
      console.error('Error updating task status:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      return false
    }
  }

  // Bulk update tasks
  const bulkUpdateTasks = async (ids: string[], updates: any): Promise<boolean> => {
    if (!user) return false

    try {
      // Since we don't have a bulk endpoint, we'll update tasks individually
      const updatePromises = ids.map(id => updateTask(id, updates))
      const results = await Promise.all(updatePromises)
      
      // Return true if all updates succeeded
      return results.every(result => result !== null)
    } catch (err) {
      console.error('Error bulk updating tasks:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      return false
    }
  }

  // Refetch tasks
  const refetch = useCallback(async () => {
    await fetchTasks()
  }, [fetchTasks])

  // Fetch tasks on mount and when dependencies change
  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  return {
    tasks,
    statistics,
    loading,
    error,
    permissions,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    bulkUpdateTasks,
    refetch
  }
}