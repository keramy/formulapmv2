import { useCallback, useState } from 'react'
import { useApiQuery } from '@/hooks/useApiQuery'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/use-toast'
import type { Task, CreateTaskData, UpdateTaskData } from '@/types/api/tasks'

interface UseTaskApiOptions {
  enabled?: boolean
  filters?: Record<string, any>
  sortField?: string
  sortDirection?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export function useTasksApi(options: UseTaskApiOptions = {}) {
  const { getAccessToken } = useAuth()
  const { toast } = useToast()
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch tasks list
  const {
    data: tasks,
    loading,
    error,
    refetch
  } = useApiQuery<Task[]>({
    endpoint: '/api/tasks',
    params: {
      ...options.filters,
      sort_field: options.sortField,
      sort_direction: options.sortDirection,
      page: options.page,
      limit: options.limit
    },
    cacheKey: 'tasks-list',
    enabled: options.enabled !== false,
    cacheTTL: 30000
  })

  // Create task
  const createTask = useCallback(async (data: CreateTaskData) => {
    setIsCreating(true)
    try {
      const token = await getAccessToken()
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create task')
      }

      const result = await response.json()
      toast({
        title: 'Success',
        description: 'Task created successfully'
      })
      refetch() // Refresh the list
      return result.data
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create task',
        variant: 'destructive'
      })
      throw error
    } finally {
      setIsCreating(false)
    }
  }, [getAccessToken, refetch, toast])

  // Update task
  const updateTask = useCallback(async (id: string, data: UpdateTaskData) => {
    setIsUpdating(true)
    try {
      const token = await getAccessToken()
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update task')
      }

      const result = await response.json()
      toast({
        title: 'Success',
        description: 'Task updated successfully'
      })
      refetch() // Refresh the list
      return result.data
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update task',
        variant: 'destructive'
      })
      throw error
    } finally {
      setIsUpdating(false)
    }
  }, [getAccessToken, refetch, toast])

  // Delete task
  const deleteTask = useCallback(async (id: string) => {
    setIsDeleting(true)
    try {
      const token = await getAccessToken()
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete task')
      }

      toast({
        title: 'Success',
        description: 'Task deleted successfully'
      })
      refetch() // Refresh the list
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete task',
        variant: 'destructive'
      })
      throw error
    } finally {
      setIsDeleting(false)
    }
  }, [getAccessToken, refetch, toast])

  // Get single task
  const getTask = useCallback(async (id: string) => {
    try {
      const token = await getAccessToken()
      const response = await fetch(`/api/tasks/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch task')
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch task',
        variant: 'destructive'
      })
      throw error
    }
  }, [getAccessToken])

  return {
    // Data
    tasks: tasks || [],
    loading,
    error,
    
    // Actions
    createTask,
    updateTask,
    deleteTask,
    getTask,
    refetch,
    
    // Loading states
    isCreating,
    isUpdating,
    isDeleting
  }
}