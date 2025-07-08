import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/scope/route'

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
          order: jest.fn(() => ({
            limit: jest.fn(),
          })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
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

describe('/api/scope', () => {
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

  describe('GET /api/scope', () => {
    it('should return scope items with project filtering', async () => {
      const { createServerClient } = require('@/lib/supabase')
      const mockSupabase = createServerClient()
      
      const mockScopeItems = [
        {
          id: '1',
          name: 'Foundation Work',
          project_id: 'project-123',
          quantity: 100,
          unit: 'sqft',
          unit_price: 15.50,
          total_price: 1550.00
        },
        {
          id: '2',
          name: 'Electrical Installation',
          project_id: 'project-123',
          quantity: 50,
          unit: 'outlets',
          unit_price: 25.00,
          total_price: 1250.00
        }
      ]
      
      mockSupabase.from().select().eq().order().limit.mockResolvedValue({
        data: mockScopeItems,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/scope?project_id=project-123&limit=10', {
        method: 'GET',
        headers: {
          authorization: 'Bearer valid-token'
        }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockScopeItems)
      expect(data.statistics).toBeDefined()
      expect(data.statistics.total_items).toBe(2)
      expect(data.statistics.total_value).toBe(2800.00)
    })

    it('should handle search filtering', async () => {
      const { createServerClient } = require('@/lib/supabase')
      const mockSupabase = createServerClient()
      
      const mockSearchResults = [
        {
          id: '1',
          name: 'Foundation Work',
          project_id: 'project-123',
          quantity: 100,
          unit: 'sqft',
          unit_price: 15.50,
          total_price: 1550.00
        }
      ]
      
      // Mock the search query chain
      const mockSelectChain = {
        ilike: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn().mockResolvedValue({
                data: mockSearchResults,
                error: null
              })
            }))
          }))
        }))
      }
      
      mockSupabase.from().select.mockReturnValue(mockSelectChain)

      const request = new NextRequest('http://localhost:3000/api/scope?search=foundation&project_id=project-123', {
        method: 'GET',
        headers: {
          authorization: 'Bearer valid-token'
        }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockSearchResults)
      expect(mockSelectChain.ilike).toHaveBeenCalledWith('name', '%foundation%')
    })

    it('should require proper permissions', async () => {
      const { hasPermission } = require('@/lib/permissions')
      hasPermission.mockReturnValue(false)

      const request = new NextRequest('http://localhost:3000/api/scope', {
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

  describe('POST /api/scope', () => {
    it('should create new scope item', async () => {
      const { createServerClient } = require('@/lib/supabase')
      const mockSupabase = createServerClient()
      
      const newScopeItem = {
        id: 'new-scope-123',
        name: 'Plumbing Installation',
        project_id: 'project-123',
        quantity: 30,
        unit: 'fixtures',
        unit_price: 120.00,
        total_price: 3600.00
      }
      
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: newScopeItem,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/scope', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Plumbing Installation',
          project_id: 'project-123',
          quantity: 30,
          unit: 'fixtures',
          unit_price: 120.00
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
      expect(data.data).toEqual(newScopeItem)
    })

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/scope', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Incomplete Item'
          // Missing required fields
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

    it('should calculate total price automatically', async () => {
      const { createServerClient } = require('@/lib/supabase')
      const mockSupabase = createServerClient()
      
      const calculatedScopeItem = {
        id: 'calculated-scope-123',
        name: 'Calculated Item',
        project_id: 'project-123',
        quantity: 10,
        unit: 'units',
        unit_price: 25.50,
        total_price: 255.00 // 10 * 25.50
      }
      
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: calculatedScopeItem,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/scope', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Calculated Item',
          project_id: 'project-123',
          quantity: 10,
          unit: 'units',
          unit_price: 25.50
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
      expect(data.data.total_price).toBe(255.00)
    })
  })

  describe('Statistics calculation', () => {
    it('should calculate financial statistics correctly', async () => {
      const { createServerClient } = require('@/lib/supabase')
      const mockSupabase = createServerClient()
      
      const mockScopeItems = [
        { quantity: 100, unit_price: 15.50, total_price: 1550.00 },
        { quantity: 50, unit_price: 25.00, total_price: 1250.00 },
        { quantity: 20, unit_price: 75.00, total_price: 1500.00 }
      ]
      
      mockSupabase.from().select().eq().order().limit.mockResolvedValue({
        data: mockScopeItems,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/scope?project_id=project-123', {
        method: 'GET',
        headers: {
          authorization: 'Bearer valid-token'
        }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(data.statistics.total_items).toBe(3)
      expect(data.statistics.total_value).toBe(4300.00)
      expect(data.statistics.average_unit_price).toBeCloseTo(38.50, 2)
      expect(data.statistics.total_quantity).toBe(170)
    })
  })
})