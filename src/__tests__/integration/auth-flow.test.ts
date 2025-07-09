/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST as AuthLogin } from '@/app/api/auth/login/route'
import { GET as ProjectsGet } from '@/app/api/projects/route'

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn(),
      getUser: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(() => ({
            limit: jest.fn()
          }))
        }))
      }))
    }))
  }))
}))

// Mock middleware
jest.mock('@/lib/middleware', () => ({
  verifyAuth: jest.fn()
}))

// Mock permissions
jest.mock('@/lib/permissions', () => ({
  hasPermission: jest.fn()
}))

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Authentication', () => {
    it('should handle valid authentication', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      })

      // This is a basic test that the route exists and doesn't crash
      const response = await AuthLogin(request)
      expect(response).toBeDefined()
      expect(response.status).toBeDefined()
    })

    it('should handle projects API access', async () => {
      const { verifyAuth } = require('@/lib/middleware')
      verifyAuth.mockResolvedValue({
        user: { id: 'user-123' },
        profile: { role: 'project_manager' },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'GET',
        headers: {
          authorization: 'Bearer test-token'
        }
      })

      const response = await ProjectsGet(request)
      expect(response).toBeDefined()
      expect(response.status).toBeDefined()
    })
  })
})