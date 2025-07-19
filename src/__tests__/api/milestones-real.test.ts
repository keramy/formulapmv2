/**
 * Milestones API Tests - Real Supabase Implementation
 * 
 * Uses real Supabase database instead of complex mocks for reliable testing
 */

import { GET, POST } from '@/app/api/milestones/route'
import { GET as GET_MILESTONE, PUT as PUT_MILESTONE, DELETE as DELETE_MILESTONE } from '@/app/api/milestones/[id]/route'
import { GET as GET_PROJECT_MILESTONES } from '@/app/api/projects/[id]/milestones/route'
import {
  setupBasicTestEnvironment,
  createAuthenticatedRequest,
  createUnauthenticatedRequest,
  createMockContext,
  expectValidApiResponse,
  expectApiError,
  TEST_USERS
} from '../utils/real-supabase-utils'

describe('Milestones API - Real Supabase', () => {
  let testEnv: Awaited<ReturnType<typeof setupBasicTestEnvironment>>

  beforeEach(async () => {
    testEnv = await setupBasicTestEnvironment('project_manager')
  })

  afterEach(async () => {
    await testEnv.cleanup()
  })

  describe('GET /api/milestones', () => {
    it('should return milestones for authenticated user', async () => {
      // Create a test milestone first
      await testEnv.supabase.from('project_milestones').insert({
        name: 'Test Milestone',
        description: 'Test milestone description',
        target_date: '2024-12-31',
        status: 'upcoming',
        project_id: testEnv.project.id,
        created_by: testEnv.user.id
      })

      const request = createAuthenticatedRequest(
        'http://localhost/api/milestones',
        testEnv.accessToken
      )
      
      const response = await GET(request)
      const data = await response.json()

      expectValidApiResponse(response, data)
      expect(data.data.milestones).toBeDefined()
      expect(data.data.milestones.length).toBeGreaterThan(0)
    })

    it('should return 401 for unauthenticated requests', async () => {
      const request = createUnauthenticatedRequest('http://localhost/api/milestones')
      const response = await GET(request)
      const data = await response.json()

      expectApiError(response, data, 401)
    })
  })

  describe('POST /api/milestones', () => {
    it('should create a new milestone', async () => {
      const newMilestone = {
        name: 'New Test Milestone',
        description: 'Milestone description',
        target_date: '2024-12-31',
        project_id: testEnv.project.id
      }

      const request = createAuthenticatedRequest(
        'http://localhost/api/milestones',
        testEnv.accessToken,
        { method: 'POST', body: newMilestone }
      )

      const response = await POST(request)
      const data = await response.json()

      expectValidApiResponse(response, data)
      expect(data.data.milestone.name).toBe('New Test Milestone')
      expect(data.data.milestone.created_by).toBe(testEnv.user.id)
      expect(data.data.milestone.status).toBe('upcoming')
    })

    it('should validate required fields', async () => {
      const invalidMilestone = {
        description: 'Missing name',
        project_id: testEnv.project.id
      }

      const request = createAuthenticatedRequest(
        'http://localhost/api/milestones',
        testEnv.accessToken,
        { method: 'POST', body: invalidMilestone }
      )

      const response = await POST(request)
      const data = await response.json()

      expectApiError(response, data, 400)
      expect(data.error).toContain('name')
    })

    it('should validate target date format', async () => {
      const invalidMilestone = {
        name: 'Test Milestone',
        target_date: 'invalid-date',
        project_id: testEnv.project.id
      }

      const request = createAuthenticatedRequest(
        'http://localhost/api/milestones',
        testEnv.accessToken,
        { method: 'POST', body: invalidMilestone }
      )

      const response = await POST(request)
      const data = await response.json()

      expectApiError(response, data, 400)
    })
  })

  describe('GET /api/projects/[id]/milestones', () => {
    it('should return milestones for a specific project', async () => {
      // Create test milestones
      await testEnv.supabase.from('project_milestones').insert([
        {
          name: 'Project Milestone 1',
          description: 'First milestone',
          target_date: '2024-06-30',
          status: 'upcoming',
          project_id: testEnv.project.id,
          created_by: testEnv.user.id
        },
        {
          name: 'Project Milestone 2', 
          description: 'Second milestone',
          target_date: '2024-12-31',
          status: 'upcoming',
          project_id: testEnv.project.id,
          created_by: testEnv.user.id
        }
      ])

      const request = createAuthenticatedRequest(
        `http://localhost/api/projects/${testEnv.project.id}/milestones`,
        testEnv.accessToken
      )
      
      const response = await GET_PROJECT_MILESTONES(
        request, 
        { params: Promise.resolve({ id: testEnv.project.id }) }
      )
      const data = await response.json()

      expectValidApiResponse(response, data)
      expect(data.data.milestones.length).toBe(2)
      expect(data.data.project).toBeDefined()
      expect(data.data.project.id).toBe(testEnv.project.id)
    })

    it('should return 403 for unauthorized project access', async () => {
      // Create a different user without access to the project
      const restrictedEnv = await setupBasicTestEnvironment('purchase_manager')
      
      try {
        const request = createAuthenticatedRequest(
          `http://localhost/api/projects/${testEnv.project.id}/milestones`,
          restrictedEnv.accessToken
        )
        
        const response = await GET_PROJECT_MILESTONES(
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

  describe('GET /api/milestones/[id]', () => {
    it('should return milestone details', async () => {
      // Create a test milestone
      const { data: milestone } = await testEnv.supabase
        .from('project_milestones')
        .insert({
          name: 'Detailed Milestone',
          description: 'Milestone with details',
          target_date: '2024-12-31',
          status: 'upcoming',
          project_id: testEnv.project.id,
          created_by: testEnv.user.id
        })
        .select()
        .single()

      const request = createAuthenticatedRequest(
        `http://localhost/api/milestones/${milestone.id}`,
        testEnv.accessToken
      )
      
      const response = await GET_MILESTONE(
        request,
        { params: Promise.resolve({ id: milestone.id }) }
      )
      const data = await response.json()

      expectValidApiResponse(response, data)
      expect(data.data.milestone.id).toBe(milestone.id)
      expect(data.data.milestone.name).toBe('Detailed Milestone')
    })

    it('should return 404 for non-existent milestone', async () => {
      const fakeId = '99999999-9999-4999-8999-999999999999'
      
      const request = createAuthenticatedRequest(
        `http://localhost/api/milestones/${fakeId}`,
        testEnv.accessToken
      )
      
      const response = await GET_MILESTONE(
        request,
        { params: Promise.resolve({ id: fakeId }) }
      )
      const data = await response.json()

      expectApiError(response, data, 404)
    })
  })

  describe('PUT /api/milestones/[id]', () => {
    it('should update a milestone', async () => {
      // Create a test milestone
      const { data: milestone } = await testEnv.supabase
        .from('project_milestones')
        .insert({
          name: 'Original Milestone',
          description: 'Original description',
          target_date: '2024-12-31',
          status: 'upcoming',
          project_id: testEnv.project.id,
          created_by: testEnv.user.id
        })
        .select()
        .single()

      const updates = {
        name: 'Updated Milestone',
        description: 'Updated description',
        target_date: '2024-11-30'
      }

      const request = createAuthenticatedRequest(
        `http://localhost/api/milestones/${milestone.id}`,
        testEnv.accessToken,
        { method: 'PUT', body: updates }
      )
      
      const response = await PUT_MILESTONE(
        request,
        { params: Promise.resolve({ id: milestone.id }) }
      )
      const data = await response.json()

      expectValidApiResponse(response, data)
      expect(data.data.milestone.name).toBe('Updated Milestone')
      expect(data.data.milestone.description).toBe('Updated description')
      expect(data.data.milestone.target_date).toBe('2024-11-30')
    })
  })

  describe('DELETE /api/milestones/[id]', () => {
    it('should delete a milestone', async () => {
      // Create a test milestone
      const { data: milestone } = await testEnv.supabase
        .from('project_milestones')
        .insert({
          name: 'Milestone to Delete',
          description: 'Will be deleted',
          target_date: '2024-12-31',
          status: 'upcoming',
          project_id: testEnv.project.id,
          created_by: testEnv.user.id
        })
        .select()
        .single()

      const request = createAuthenticatedRequest(
        `http://localhost/api/milestones/${milestone.id}`,
        testEnv.accessToken,
        { method: 'DELETE' }
      )
      
      const response = await DELETE_MILESTONE(
        request,
        { params: Promise.resolve({ id: milestone.id }) }
      )
      const data = await response.json()

      expectValidApiResponse(response, data)
      
      // Verify milestone was deleted
      const { data: deletedMilestone } = await testEnv.supabase
        .from('project_milestones')
        .select()
        .eq('id', milestone.id)
        .single()
      
      expect(deletedMilestone).toBeNull()
    })

    it('should prevent deletion of completed milestones', async () => {
      // Create a completed milestone
      const { data: milestone } = await testEnv.supabase
        .from('project_milestones')
        .insert({
          name: 'Completed Milestone',
          description: 'Already completed',
          target_date: '2024-01-31',
          status: 'completed',
          actual_date: '2024-01-31',
          project_id: testEnv.project.id,
          created_by: testEnv.user.id
        })
        .select()
        .single()

      const request = createAuthenticatedRequest(
        `http://localhost/api/milestones/${milestone.id}`,
        testEnv.accessToken,
        { method: 'DELETE' }
      )
      
      const response = await DELETE_MILESTONE(
        request,
        { params: Promise.resolve({ id: milestone.id }) }
      )
      const data = await response.json()

      expectApiError(response, data, 400)
      expect(data.error).toContain('completed')
    })
  })
})