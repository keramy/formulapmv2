import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/projects/route'

// Mock authentication middleware
jest.mock('@/lib/middleware', () => ({
  verifyAuth: jest.fn(),
}))

// Mock permissions
jest.mock('@/lib/permissions', () => ({
  hasPermission: jest.fn(),
}))

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  createServerClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
        order: jest.fn(() => ({
          limit: jest.fn(),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(),
      })),
    })),
  })),
}))

const mockAuthProfile = {
  id: 'profile-123',
  user_id: 'user-123',
  role: 'project_manager',
  email: 'test@example.com'
}

const mockUser = {
  id: 'user-123',
  email: 'test@example.com'
}

describe('/api/projects', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    const { verifyAuth } = require('@/lib/middleware')
    const { hasPermission } = require('@/lib/permissions')
    
    verifyAuth.mockResolvedValue({
      user: mockUser,
      profile: mockAuthProfile,
      error: null
    })
    
    hasPermission.mockReturnValue(true)
  })

  describe('GET /api/projects', () => {
    it('should return projects for authenticated user', async () => {
      const { createServerClient } = require('@/lib/supabase')
      const mockSupabase = createServerClient()
      
      const mockProjects = [
        { id: '1', name: 'Project 1', status: 'active' },
        { id: '2', name: 'Project 2', status: 'planning' }
      ]
      
      mockSupabase.from().select().order().limit.mockResolvedValue({
        data: mockProjects,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'GET',
        headers: {
          authorization: 'Bearer valid-token'
        }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockProjects)
    })

    it('should reject unauthenticated requests', async () => {
      const { verifyAuth } = require('@/lib/middleware')
      verifyAuth.mockResolvedValue({
        user: null,
        profile: null,
        error: 'Authentication required'
      })

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'GET'
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication required')
    })

    it('should reject requests without proper permissions', async () => {
      const { hasPermission } = require('@/lib/permissions')
      hasPermission.mockReturnValue(false)

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'GET',
        headers: {
          authorization: 'Bearer valid-token'
        }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Insufficient permissions')
    })
  })

  describe('POST /api/projects', () => {
    it('should create a new project', async () => {
      const { createServerClient } = require('@/lib/supabase')
      const mockSupabase = createServerClient()
      
      const newProject = {
        id: 'new-project-123',
        name: 'New Project',
        status: 'planning',
        description: 'Test project'
      }
      
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: newProject,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Project',
          description: 'Test project'
        }),
        headers: {
          'Content-Type': 'application/json',
          authorization: 'Bearer valid-token'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(newProject)
    })

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          description: 'Missing name field'
        }),
        headers: {
          'Content-Type': 'application/json',
          authorization: 'Bearer valid-token'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBeDefined()
    })
  })

  describe('Database error handling', () => {
    it('should handle database errors gracefully', async () => {
      const { createServerClient } = require('@/lib/supabase')
      const mockSupabase = createServerClient()
      
      mockSupabase.from().select().order().limit.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      })

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'GET',
        headers: {
          authorization: 'Bearer valid-token'
        }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Database operation failed')
    })
  })
})