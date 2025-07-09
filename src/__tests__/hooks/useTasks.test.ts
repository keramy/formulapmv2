/**
 * Formula PM 2.0 useTasks Hook Tests
 * V3 Phase 1 Implementation
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useTasks } from '@/hooks/useTasks'
import { useAuth } from '@/hooks/useAuth'
import { TaskFormData } from '@/types/tasks'

// Mock the dependencies
jest.mock('@/hooks/useAuth')
jest.mock('@/lib/permissions')

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

// Mock fetch
global.fetch = jest.fn()

describe('useTasks Hook', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com'
  }

  const mockProfile = {
    id: 'profile-1',
    role: 'project_manager',
    first_name: 'Test',
    last_name: 'User',
    email: 'test@example.com'
  }

  const mockTasksResponse = {
    success: true,
    data: {
      tasks: [
        {
          id: 'task-1',
          project_id: 'project-1',
          title: 'Test Task',
          description: 'Test task description',
          status: 'pending',
          priority: 'medium',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ],
      statistics: {
        total: 1,
        byStatus: {
          pending: 1,
          in_progress: 0,
          review: 0,
          completed: 0,
          cancelled: 0,
          blocked: 0
        },
        byPriority: {
          low: 0,
          medium: 1,
          high: 0,
          urgent: 0
        },
        overdue: 0,
        dueThisWeek: 0,
        completed: 0,
        assignedToMe: 0
      }
    }
  }

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      profile: mockProfile,
      loading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
      resetPassword: jest.fn(),
      refreshAuth: jest.fn()
    })

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'mock-token'),
        setItem: jest.fn(),
        removeItem: jest.fn()
      },
      writable: true
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('fetchTasks', () => {
    it('should fetch tasks successfully', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasksResponse
      } as Response)

      const { result } = renderHook(() => useTasks('project-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.tasks).toHaveLength(1)
      expect(result.current.tasks[0].title).toBe('Test Task')
      expect(result.current.statistics).toBeDefined()
      expect(result.current.error).toBeNull()
    })

    it('should handle fetch error', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, error: 'Failed to fetch tasks' })
      } as Response)

      const { result } = renderHook(() => useTasks('project-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.tasks).toHaveLength(0)
      expect(result.current.error).toBe('Failed to fetch tasks')
    })
  })

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      
      // Mock the initial fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasksResponse
      } as Response)

      // Mock the create task response
      const newTask = {
        id: 'task-2',
        project_id: 'project-1',
        title: 'New Task',
        description: 'New task description',
        status: 'pending',
        priority: 'high',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            task: newTask,
            statistics: mockTasksResponse.data.statistics
          }
        })
      } as Response)

      const { result } = renderHook(() => useTasks('project-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const taskData: TaskFormData = {
        title: 'New Task',
        description: 'New task description',
        status: 'pending',
        priority: 'high'
      }

      const createdTask = await result.current.createTask(taskData)

      expect(createdTask).toBeDefined()
      expect(createdTask?.title).toBe('New Task')
      expect(result.current.tasks).toHaveLength(2)
    })
  })

  describe('updateTask', () => {
    it('should update a task successfully', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      
      // Mock the initial fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasksResponse
      } as Response)

      // Mock the update task response
      const updatedTask = {
        ...mockTasksResponse.data.tasks[0],
        title: 'Updated Task'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            task: updatedTask
          }
        })
      } as Response)

      const { result } = renderHook(() => useTasks('project-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const updatedTaskData = await result.current.updateTask('task-1', {
        title: 'Updated Task'
      })

      expect(updatedTaskData).toBeDefined()
      expect(updatedTaskData?.title).toBe('Updated Task')
      expect(result.current.tasks[0].title).toBe('Updated Task')
    })
  })

  describe('deleteTask', () => {
    it('should delete a task successfully', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      
      // Mock the initial fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasksResponse
      } as Response)

      // Mock the delete task response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true
        })
      } as Response)

      const { result } = renderHook(() => useTasks('project-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const success = await result.current.deleteTask('task-1')

      expect(success).toBe(true)
      expect(result.current.tasks).toHaveLength(0)
    })
  })

  describe('updateTaskStatus', () => {
    it('should update task status successfully', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>
      
      // Mock the initial fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasksResponse
      } as Response)

      // Mock the status update response
      const updatedTask = {
        ...mockTasksResponse.data.tasks[0],
        status: 'completed'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            task: updatedTask
          }
        })
      } as Response)

      const { result } = renderHook(() => useTasks('project-1'))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const success = await result.current.updateTaskStatus('task-1', 'completed')

      expect(success).toBe(true)
      expect(result.current.tasks[0].status).toBe('completed')
    })
  })

  describe('permissions', () => {
    it('should calculate permissions correctly', () => {
      const { result } = renderHook(() => useTasks('project-1'))

      expect(result.current.permissions).toBeDefined()
      expect(result.current.permissions.canCreate).toBe(true)
      expect(result.current.permissions.canEdit).toBe(true)
      expect(result.current.permissions.canDelete).toBe(true)
      expect(result.current.permissions.canAssign).toBe(true)
      expect(result.current.permissions.canChangeStatus).toBe(true)
      expect(result.current.permissions.canComment).toBe(true)
      expect(result.current.permissions.canViewAll).toBe(true)
    })
  })
})