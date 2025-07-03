/**
 * Formula PM 2.0 Task Management Hooks
 * React hooks for task operations with @mention intelligence and real-time features
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from './useAuth'
import { usePermissions } from './usePermissions'
import { 
  Task, 
  TaskComment,
  TaskFormData, 
  TaskUpdateData,
  CommentFormData,
  TaskFilters, 
  TaskListParams,
  TaskMetrics,
  BulkTaskOperation,
  BulkOperationResult
} from '@/types/tasks'
import { supabase } from '@/lib/supabase'

// ============================================================================
// MAIN TASKS HOOK
// ============================================================================

export const useTasks = (projectId?: string) => {
  const { profile } = useAuth()
  const { 
    canCreateTasks, 
    canViewTasks, 
    canManageAllTasks,
    isManagement 
  } = usePermissions()

  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  // Fetch tasks with filtering and pagination
  const fetchTasks = useCallback(async (params?: TaskListParams) => {
    if (!profile || !canViewTasks()) return

    setLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams()
      
      if (params?.page) queryParams.set('page', params.page.toString())
      if (params?.limit) queryParams.set('limit', params.limit.toString())
      if (params?.include_details) queryParams.set('include_details', 'true')
      if (params?.include_subtasks) queryParams.set('include_subtasks', 'true')
      if (params?.include_comments) queryParams.set('include_comments', 'true')
      if (projectId) queryParams.set('project_id', projectId)
      
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

      const response = await fetch(`/api/tasks?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${profile.id}`,
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }

      const data = await response.json()
      
      if (data.success) {
        setTasks(data.data.tasks)
        setTotalCount(data.data.total_count)
        setCurrentPage(data.data.page)
        setHasMore(data.data.has_more)
      } else {
        throw new Error(data.error || 'Failed to fetch tasks')
      }
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks')
    } finally {
      setLoading(false)
    }
  }, [profile, canViewTasks, projectId])

  // Create new task
  const createTask = useCallback(async (taskData: TaskFormData & { project_id: string }) => {
    if (!profile || !canCreateTasks()) {
      throw new Error('Insufficient permissions to create tasks')
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${profile.id}`,
        },
        body: JSON.stringify(taskData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create task')
      }

      const data = await response.json()
      
      if (data.success) {
        // Refresh tasks list
        await fetchTasks()
        return data.data.task
      } else {
        throw new Error(data.error || 'Failed to create task')
      }
    } catch (err) {
      console.error('Error creating task:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to create task'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [profile, canCreateTasks, fetchTasks])

  // Filter tasks based on user access
  const accessibleTasks = useMemo(() => {
    if (!profile) return []
    
    return tasks.filter(task => {
      // Management can see all tasks
      if (isManagement()) return true
      
      // Check if user created the task
      if (task.created_by === profile.id) return true
      
      // Check if user is assigned to the task
      if (task.assigned_to.includes(profile.id)) return true
      
      return false
    })
  }, [tasks, profile, isManagement])

  // Optimized real-time subscriptions with progressive enhancement
  useEffect(() => {
    if (!profile || !projectId) return

    // Single consolidated channel for better performance
    const channel = supabase
      .channel(`project-tasks-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          // Progressive enhancement - only refresh if needed
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
            fetchTasks()
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [profile, projectId, fetchTasks])

  return {
    tasks: accessibleTasks,
    loading,
    error,
    totalCount,
    currentPage,
    hasMore,
    fetchTasks,
    createTask,
    refreshTasks: () => fetchTasks(),
    canCreate: canCreateTasks(),
    canManageAll: canManageAllTasks()
  }
}

// ============================================================================
// INDIVIDUAL TASK HOOK
// ============================================================================

export const useTask = (taskId: string) => {
  const { profile } = useAuth()
  const { canViewTasks } = usePermissions()
  
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch individual task with full details
  const fetchTask = useCallback(async () => {
    if (!profile || !taskId || !canViewTasks()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${profile.id}`,
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Task not found or access denied')
        }
        throw new Error('Failed to fetch task')
      }

      const data = await response.json()
      
      if (data.success) {
        setTask(data.data.task)
      } else {
        throw new Error(data.error || 'Failed to fetch task')
      }
    } catch (err) {
      console.error('Error fetching task:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch task')
    } finally {
      setLoading(false)
    }
  }, [profile, taskId, canViewTasks])

  // Update task
  const updateTask = useCallback(async (updates: TaskUpdateData) => {
    if (!profile || !taskId) {
      throw new Error('Invalid task or user')
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${profile.id}`,
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update task')
      }

      const data = await response.json()
      
      if (data.success) {
        setTask(data.data.task)
        return data.data.task
      } else {
        throw new Error(data.error || 'Failed to update task')
      }
    } catch (err) {
      console.error('Error updating task:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update task'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [profile, taskId])

  // Delete task
  const deleteTask = useCallback(async () => {
    if (!profile || !taskId) {
      throw new Error('Invalid task or user')
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${profile.id}`,
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete task')
      }

      const data = await response.json()
      
      if (data.success) {
        setTask(null)
        return true
      } else {
        throw new Error(data.error || 'Failed to delete task')
      }
    } catch (err) {
      console.error('Error deleting task:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete task'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [profile, taskId])

  // Optimized real-time subscription for individual task
  useEffect(() => {
    if (!taskId) return

    // Progressive enhancement - only subscribe if task is actively being viewed
    const channel = supabase
      .channel(`task-detail-${taskId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `id=eq.${taskId}`
        },
        (payload) => {
          // Only refresh on actual changes
          if (payload.new !== payload.old) {
            fetchTask()
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [taskId, fetchTask])

  // Load task on mount
  useEffect(() => {
    fetchTask()
  }, [fetchTask])

  return {
    task,
    loading,
    error,
    fetchTask,
    updateTask,
    deleteTask,
    canUpdate: task && (task.created_by === profile?.id || task.assigned_to.includes(profile?.id || '')),
    canDelete: task && task.created_by === profile?.id
  }
}

// ============================================================================
// TASK COMMENTS HOOK
// ============================================================================

export const useTaskComments = (taskId: string) => {
  const { profile } = useAuth()
  const [comments, setComments] = useState<TaskComment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch task comments
  const fetchComments = useCallback(async () => {
    if (!profile || !taskId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        headers: {
          'Authorization': `Bearer ${profile.id}`,
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch comments')
      }

      const data = await response.json()
      
      if (data.success) {
        setComments(data.data.comments)
      } else {
        throw new Error(data.error || 'Failed to fetch comments')
      }
    } catch (err) {
      console.error('Error fetching comments:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch comments')
    } finally {
      setLoading(false)
    }
  }, [profile, taskId])

  // Create new comment
  const createComment = useCallback(async (commentData: CommentFormData) => {
    if (!profile || !taskId) {
      throw new Error('Invalid task or user')
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${profile.id}`,
        },
        body: JSON.stringify(commentData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create comment')
      }

      const data = await response.json()
      
      if (data.success) {
        // Refresh comments list
        await fetchComments()
        return data.data.comment
      } else {
        throw new Error(data.error || 'Failed to create comment')
      }
    } catch (err) {
      console.error('Error creating comment:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to create comment'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [profile, taskId, fetchComments])

  // Simplified real-time subscription for comments
  useEffect(() => {
    if (!taskId) return

    // Consolidated subscription with task detail channel would be better
    // but keeping separate for comments-specific updates
    const channel = supabase
      .channel(`comments-${taskId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_comments',
          filter: `task_id=eq.${taskId}`
        },
        (payload) => {
          // Progressive enhancement - smarter refresh logic
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
            fetchComments()
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [taskId, fetchComments])

  // Load comments on mount
  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  return {
    comments,
    loading,
    error,
    fetchComments,
    createComment
  }
}

// ============================================================================
// TASK METRICS HOOK
// ============================================================================

export const useTaskMetrics = (projectId?: string) => {
  const { profile } = useAuth()
  const [metrics, setMetrics] = useState<TaskMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    if (!profile) return

    setLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams()
      if (projectId) queryParams.set('project_id', projectId)

      const response = await fetch(`/api/tasks/metrics?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${profile.id}`,
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch task metrics')
      }

      const data = await response.json()
      
      if (data.success) {
        setMetrics(data.data.metrics)
      } else {
        throw new Error(data.error || 'Failed to fetch task metrics')
      }
    } catch (err) {
      console.error('Error fetching metrics:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch task metrics')
    } finally {
      setLoading(false)
    }
  }, [profile, projectId])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  return {
    metrics,
    loading,
    error,
    fetchMetrics
  }
}

// ============================================================================
// BULK OPERATIONS HOOK
// ============================================================================

export const useBulkTaskOperations = () => {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const executeBulkOperation = useCallback(async (operation: BulkTaskOperation): Promise<BulkOperationResult> => {
    if (!profile) {
      throw new Error('User not authenticated')
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/tasks/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${profile.id}`,
        },
        body: JSON.stringify(operation)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to execute bulk operation')
      }

      const data = await response.json()
      
      if (data.success) {
        return data.data.result
      } else {
        throw new Error(data.error || 'Failed to execute bulk operation')
      }
    } catch (err) {
      console.error('Error executing bulk operation:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute bulk operation'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [profile])

  return {
    executeBulkOperation,
    loading,
    error
  }
}