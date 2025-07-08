import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { createMocks } from 'node-mocks-http'
import { NextRequest } from 'next/server'
import { POST as AuthLogin } from '@/app/api/auth/login/route'
import { GET as AuthProfile } from '@/app/api/auth/profile/route'
import { GET as ProjectsGet } from '@/app/api/projects/route'

// Mock Supabase client
const mockSupabase = {
  auth: {
    signInWithPassword: jest.fn(),
    getUser: jest.fn(),
    signOut: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
        order: jest.fn(() => ({
          limit: jest.fn(),
        })),
      })),
    })),
  })),
}

jest.mock('@/lib/supabase', () => ({
  createServerClient: jest.fn(() => mockSupabase),
}))

// Mock authentication middleware
jest.mock('@/lib/middleware', () => ({
  verifyAuth: jest.fn(),
}))

// Mock permissions
jest.mock('@/lib/permissions', () => ({
  hasPermission: jest.fn(),
}))

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Complete Authentication Flow', () => {
    it('should handle full login to protected resource flow', async () => {
      const userCredentials = {
        email: 'test@example.com',
        password: 'password123'
      }

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }

      const mockProfile = {
        id: 'profile-123',
        user_id: 'user-123',
        role: 'project_manager',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User'
      }

      // Step 1: Login
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: mockUser,
          session: { access_token: 'test-token-123' }
        },
        error: null
      })

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'user_profiles') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: mockProfile,
                  error: null
                })
              }))
            }))
          }
        }
        return mockSupabase.from()
      })

      const loginRequest = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(userCredentials),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const loginResponse = await AuthLogin(loginRequest)
      const loginData = await loginResponse.json()

      expect(loginResponse.status).toBe(200)
      expect(loginData.success).toBe(true)
      expect(loginData.user).toEqual(mockUser)
      expect(loginData.profile).toEqual(mockProfile)

      // Step 2: Verify authentication middleware works
      const { verifyAuth } = require('@/lib/middleware')
      verifyAuth.mockResolvedValue({
        user: mockUser,
        profile: mockProfile,
        error: null
      })

      // Step 3: Access protected resource
      const { hasPermission } = require('@/lib/permissions')
      hasPermission.mockReturnValue(true)

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'projects') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                order: jest.fn(() => ({
                  limit: jest.fn().mockResolvedValue({
                    data: [
                      { id: 'project-1', name: 'Test Project', status: 'active' }
                    ],
                    error: null
                  }))
                }))
              }))
            }))
          }
        }
        return mockSupabase.from()
      })

      const projectsRequest = new NextRequest('http://localhost:3000/api/projects', {
        method: 'GET',
        headers: {
          authorization: 'Bearer test-token-123'
        }
      })

      const projectsResponse = await ProjectsGet(projectsRequest)
      const projectsData = await projectsResponse.json()

      expect(projectsResponse.status).toBe(200)
      expect(projectsData.success).toBe(true)
      expect(projectsData.data).toHaveLength(1)
      expect(projectsData.data[0].name).toBe('Test Project')

      // Verify auth middleware was called
      expect(verifyAuth).toHaveBeenCalledWith(projectsRequest)
      
      // Verify permissions were checked
      expect(hasPermission).toHaveBeenCalledWith('project_manager', 'projects.read.all')
    })

    it('should handle invalid credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' }
      })

      const loginRequest = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const loginResponse = await AuthLogin(loginRequest)
      const loginData = await loginResponse.json()

      expect(loginResponse.status).toBe(401)
      expect(loginData.success).toBe(false)
      expect(loginData.error).toBeDefined()
    })

    it('should handle missing user profile', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: mockUser,
          session: { access_token: 'test-token-123' }
        },
        error: null
      })

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'user_profiles') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'No profile found' }
                })
              }))
            }))
          }
        }
        return mockSupabase.from()
      })

      const loginRequest = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const loginResponse = await AuthLogin(loginRequest)
      const loginData = await loginResponse.json()

      expect(loginResponse.status).toBe(401)
      expect(loginData.success).toBe(false)
      expect(loginData.error).toContain('profile')
    })

    it('should handle insufficient permissions', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }

      const mockProfile = {
        id: 'profile-123',
        user_id: 'user-123',
        role: 'viewer', // Limited role
        email: 'test@example.com'
      }

      const { verifyAuth } = require('@/lib/middleware')
      const { hasPermission } = require('@/lib/permissions')

      verifyAuth.mockResolvedValue({
        user: mockUser,
        profile: mockProfile,
        error: null
      })

      // Viewer doesn't have projects.read.all permission
      hasPermission.mockReturnValue(false)

      const projectsRequest = new NextRequest('http://localhost:3000/api/projects', {
        method: 'GET',
        headers: {
          authorization: 'Bearer test-token-123'
        }
      })

      const projectsResponse = await ProjectsGet(projectsRequest)
      const projectsData = await projectsResponse.json()

      expect(projectsResponse.status).toBe(403)
      expect(projectsData.success).toBe(false)
      expect(projectsData.error).toBe('Insufficient permissions')
    })
  })

  describe('Session Management', () => {
    it('should handle expired session', async () => {
      const { verifyAuth } = require('@/lib/middleware')
      verifyAuth.mockResolvedValue({
        user: null,
        profile: null,
        error: 'Session expired'
      })

      const protectedRequest = new NextRequest('http://localhost:3000/api/projects', {
        method: 'GET',
        headers: {
          authorization: 'Bearer expired-token'
        }
      })

      const response = await ProjectsGet(protectedRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Session expired')
    })

    it('should handle missing authorization header', async () => {
      const { verifyAuth } = require('@/lib/middleware')
      verifyAuth.mockResolvedValue({
        user: null,
        profile: null,
        error: 'No authorization header'
      })

      const protectedRequest = new NextRequest('http://localhost:3000/api/projects', {
        method: 'GET'
      })

      const response = await ProjectsGet(protectedRequest)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('No authorization header')
    })
  })

  describe('Role-Based Access Control', () => {
    const testCases = [
      {
        role: 'admin',
        permission: 'projects.read.all',
        expected: true
      },
      {
        role: 'project_manager',
        permission: 'projects.read.all',
        expected: true
      },
      {
        role: 'viewer',
        permission: 'projects.read.all',
        expected: false
      },
      {
        role: 'client',
        permission: 'projects.read.all',
        expected: false
      }
    ]

    testCases.forEach(({ role, permission, expected }) => {
      it(`should ${expected ? 'allow' : 'deny'} ${role} access to ${permission}`, async () => {
        const mockUser = {
          id: 'user-123',
          email: 'test@example.com'
        }

        const mockProfile = {
          id: 'profile-123',
          user_id: 'user-123',
          role: role,
          email: 'test@example.com'
        }

        const { verifyAuth } = require('@/lib/middleware')
        const { hasPermission } = require('@/lib/permissions')

        verifyAuth.mockResolvedValue({
          user: mockUser,
          profile: mockProfile,
          error: null
        })

        hasPermission.mockReturnValue(expected)

        if (expected) {
          mockSupabase.from.mockImplementation(() => ({
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                order: jest.fn(() => ({
                  limit: jest.fn().mockResolvedValue({
                    data: [],
                    error: null
                  }))
                }))
              }))
            }))
          }))
        }

        const request = new NextRequest('http://localhost:3000/api/projects', {
          method: 'GET',
          headers: {
            authorization: 'Bearer test-token-123'
          }
        })

        const response = await ProjectsGet(request)
        const data = await response.json()

        expect(response.status).toBe(expected ? 200 : 403)
        expect(data.success).toBe(expected)
        
        if (expected) {
          expect(data.data).toBeDefined()
        } else {
          expect(data.error).toBe('Insufficient permissions')
        }
      })
    })
  })
})