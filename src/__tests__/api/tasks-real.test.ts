/**
 * Tasks API Tests - Real Supabase Implementation
 * 
 * Uses real Supabase database instead of complex mocks for reliable testing
 */

import { GET, POST } from '@/app/api/tasks/route'
import { GET as GET_TASK, PUT as PUT_TASK, DELETE as DELETE_TASK } from '@/app/api/tasks/[id]/route'
import { GET as GET_PROJECT_TASKS } from '@/app/api/projects/[id]/tasks/route'
import {
  setupBasicTestEnvironment,
  createAuthenticatedRequest,
  createUnauthenticatedRequest,
  createMockContext,
  expectValidApiResponse,
  expectApiError,
  TEST_USERS
} from '../utils/real-supabase-utils'

describe('Tasks API - Real Supabase', () => {
  let testEnv: Awaited<ReturnType<typeof setupBasicTestEnvironment>>

  beforeEach(async () => {
    testEnv = await setupBasicTestEnvironment('project_manager')
  })

  afterEach(async () => {
    await testEnv.cleanup()
  })

  describe('GET /api/tasks', () => {
    it('should return tasks for authenticated user', async () => {
      // Create a test task first
      await testEnv.supabase.from('tasks').insert({
        title: 'Test Task',
        description: 'Test task description',
        status: 'pending',
        priority: 'medium',
        project_id: testEnv.project.id,
        assigned_to: testEnv.user.id,
        assigned_by: testEnv.user.id
      })

      const request = createAuthenticatedRequest(
        'http://localhost/api/tasks',
        testEnv.accessToken
      )
      
      const response = await GET(request)
      const data = await response.json()

      expectValidApiResponse(response, data)
      expect(data.data.tasks).toBeDefined()
      expect(data.data.tasks.length).toBeGreaterThan(0)
      expect(data.data.statistics).toBeDefined()
    })

    it('should return 401 for unauthenticated requests', async () => {
      const request = createUnauthenticatedRequest('http://localhost/api/tasks')
      const response = await GET(request)
      const data = await response.json()

      expectApiError(response, data, 401)
    })
  })

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const newTask = {
        title: 'New Test Task',
        description: 'Task description',
        priority: 'high',
        project_id: testEnv.project.id,
        due_date: '2024-12-31'
      }

      const request = createAuthenticatedRequest(
        'http://localhost/api/tasks',
        testEnv.accessToken,
        { method: 'POST', body: newTask }
      )

      const response = await POST(request)
      const data = await response.json()

      expectValidApiResponse(response, data)
      expect(data.data.task.title).toBe('New Test Task')
      expect(data.data.task.assigned_by).toBe(testEnv.user.id)
    })

    it('should validate required fields', async () => {
      const invalidTask = {
        description: 'Missing title',
        project_id: testEnv.project.id
      }

      const request = createAuthenticatedRequest(
        'http://localhost/api/tasks',
        testEnv.accessToken,
        { method: 'POST', body: invalidTask }
      )

      const response = await POST(request)
      const data = await response.json()

      expectApiError(response, data, 400)
      expect(data.error).toContain('title')
    })
  })

  describe('GET /api/projects/[id]/tasks', () => {
    it('should return tasks for a specific project', async () => {
      // Create test tasks
      await testEnv.supabase.from('tasks').insert([
        {
          title: 'Project Task 1',
          description: 'First task',
          status: 'pending',
          priority: 'medium',
          project_id: testEnv.project.id,
          assigned_to: testEnv.user.id,
          assigned_by: testEnv.user.id
        },
        {
          title: 'Project Task 2', 
          description: 'Second task',
          status: 'in_progress',
          priority: 'high',
          project_id: testEnv.project.id,
          assigned_to: testEnv.user.id,
          assigned_by: testEnv.user.id
        }
      ])

      const request = createAuthenticatedRequest(
        `http://localhost/api/projects/${testEnv.project.id}/tasks`,
        testEnv.accessToken
      )
      
      const response = await GET_PROJECT_TASKS(
        request, 
        { params: Promise.resolve({ id: testEnv.project.id }) }
      )
      const data = await response.json()

      expectValidApiResponse(response, data)
      expect(data.data.tasks.length).toBe(2)
      expect(data.data.project).toBeDefined()
      expect(data.data.project.id).toBe(testEnv.project.id)
    })

    it('should return 403 for unauthorized project access', async () => {
      // Create a different user without access to the project
      const restrictedEnv = await setupBasicTestEnvironment('purchase_manager')
      
      try {
        const request = createAuthenticatedRequest(
          `http://localhost/api/projects/${testEnv.project.id}/tasks`,
          restrictedEnv.accessToken
        )
        
        const response = await GET_PROJECT_TASKS(
          request,
          { params: Promise.resolve({ id: testEnv.project.id }) }
        )
        const data = await response.json()

        expectApiError(response, data, 403)
      } finally {
        await restrictedEnv.cleanup()
      }
    })
  })

  describe('GET /api/tasks/[id]', () => {
    it('should return task details', async () => {
      // Create a test task
      const { data: task } = await testEnv.supabase
        .from('tasks')
        .insert({
          title: 'Detailed Task',
          description: 'Task with details',
          status: 'pending',
          priority: 'medium',
          project_id: testEnv.project.id,
          assigned_to: testEnv.user.id,
          assigned_by: testEnv.user.id
        })
        .select()
        .single()

      const request = createAuthenticatedRequest(
        `http://localhost/api/tasks/${task.id}`,
        testEnv.accessToken
      )
      
      const response = await GET_TASK(
        request,
        { params: Promise.resolve({ id: task.id }) }
      )
      const data = await response.json()

      expectValidApiResponse(response, data)
      expect(data.data.task.id).toBe(task.id)
      expect(data.data.task.title).toBe('Detailed Task')
    })

    it('should return 404 for non-existent task', async () => {
      const fakeId = '99999999-9999-4999-8999-999999999999'
      
      const request = createAuthenticatedRequest(
        `http://localhost/api/tasks/${fakeId}`,
        testEnv.accessToken
      )
      
      const response = await GET_TASK(
        request,
        { params: Promise.resolve({ id: fakeId }) }
      )
      const data = await response.json()

      expectApiError(response, data, 404)
    })
  })

  describe('PUT /api/tasks/[id]', () => {
    it('should update a task', async () => {
      // Create a test task
      const { data: task } = await testEnv.supabase
        .from('tasks')
        .insert({
          title: 'Original Task',
          description: 'Original description',
          status: 'pending',
          priority: 'medium',
          project_id: testEnv.project.id,
          assigned_to: testEnv.user.id,
          assigned_by: testEnv.user.id
        })
        .select()
        .single()

      const updates = {
        title: 'Updated Task',
        status: 'in_progress',
        priority: 'high'
      }

      const request = createAuthenticatedRequest(
        `http://localhost/api/tasks/${task.id}`,
        testEnv.accessToken,
        { method: 'PUT', body: updates }
      )
      
      const response = await PUT_TASK(
        request,
        { params: Promise.resolve({ id: task.id }) }
      )
      const data = await response.json()

      expectValidApiResponse(response, data)
      expect(data.data.task.title).toBe('Updated Task')
      expect(data.data.task.status).toBe('in_progress')
      expect(data.data.task.priority).toBe('high')
    })
  })

  describe('DELETE /api/tasks/[id]', () => {
    it('should delete a task', async () => {
      // Create a test task
      const { data: task } = await testEnv.supabase
        .from('tasks')
        .insert({
          title: 'Task to Delete',
          description: 'Will be deleted',
          status: 'pending',
          priority: 'medium',
          project_id: testEnv.project.id,
          assigned_to: testEnv.user.id,
          assigned_by: testEnv.user.id
        })
        .select()
        .single()

      const request = createAuthenticatedRequest(
        `http://localhost/api/tasks/${task.id}`,
        testEnv.accessToken,
        { method: 'DELETE' }
      )
      
      const response = await DELETE_TASK(
        request,
        { params: Promise.resolve({ id: task.id }) }
      )
      const data = await response.json()

      expectValidApiResponse(response, data)
      
      // Verify task was deleted
      const { data: deletedTask } = await testEnv.supabase
        .from('tasks')
        .select()
        .eq('id', task.id)
        .single()
      
      expect(deletedTask).toBeNull()
    })
  })
})