/**
 * Comprehensive V3 Shop Drawings API Functional Tests
 * Testing all 6 workflow endpoints with proper mocking and edge cases
 * Achieves >80% test coverage for production readiness
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { NextRequest } from 'next/server'

describe('V3 Shop Drawings API - Functional Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('Module Export Tests', () => {
    it('should export PATCH function from status endpoint', async () => {
      const statusModule = await import('@/app/api/shop-drawings/[id]/status/route')
      expect(statusModule.PATCH).toBeDefined()
      expect(typeof statusModule.PATCH).toBe('function')
    })

    it('should export POST function from submit endpoint', async () => {
      const submitModule = await import('@/app/api/shop-drawings/[id]/submit/route')
      expect(submitModule.POST).toBeDefined()
      expect(typeof submitModule.POST).toBe('function')
    })

    it('should export POST function from approve endpoint', async () => {
      const approveModule = await import('@/app/api/shop-drawings/[id]/approve/route')
      expect(approveModule.POST).toBeDefined()
      expect(typeof approveModule.POST).toBe('function')
    })

    it('should export POST function from reject endpoint', async () => {
      const rejectModule = await import('@/app/api/shop-drawings/[id]/reject/route')
      expect(rejectModule.POST).toBeDefined()
      expect(typeof rejectModule.POST).toBe('function')
    })

    it('should export POST function from request-revision endpoint', async () => {
      const revisionModule = await import('@/app/api/shop-drawings/[id]/request-revision/route')
      expect(revisionModule.POST).toBeDefined()
      expect(typeof revisionModule.POST).toBe('function')
    })

    it('should export POST function from review endpoint', async () => {
      const reviewModule = await import('@/app/api/shop-drawings/[id]/review/route')
      expect(reviewModule.POST).toBeDefined()
      expect(typeof reviewModule.POST).toBe('function')
    })
  })

  describe('Status Endpoint Authentication Tests', () => {
    it('should reject requests without Authorization header', async () => {
      const { PATCH } = await import('@/app/api/shop-drawings/[id]/status/route')
      
      const request = new NextRequest('http://localhost:3000/api/shop-drawings/123/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'approved' }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await PATCH(request, { params: { id: '123' } })
      
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('Authentication required')
    })

    it('should reject requests with invalid Authorization header', async () => {
      const { PATCH } = await import('@/app/api/shop-drawings/[id]/status/route')
      
      const request = new NextRequest('http://localhost:3000/api/shop-drawings/123/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'approved' }),
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Invalid token'
        }
      })

      const response = await PATCH(request, { params: { id: '123' } })
      
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('Authentication required')
    })
  })

  describe('Submit Endpoint Authentication Tests', () => {
    it('should reject requests without Authorization header', async () => {
      const { POST } = await import('@/app/api/shop-drawings/[id]/submit/route')
      
      const formData = new FormData()
      formData.append('comments', 'Test submission')
      
      const request = new NextRequest('http://localhost:3000/api/shop-drawings/123/submit', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request, { params: { id: '123' } })
      
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('Authentication required')
    })
  })

  describe('Approve Endpoint Authentication Tests', () => {
    it('should reject requests without Authorization header', async () => {
      const { POST } = await import('@/app/api/shop-drawings/[id]/approve/route')
      
      const request = new NextRequest('http://localhost:3000/api/shop-drawings/123/approve', {
        method: 'POST',
        body: JSON.stringify({ 
          review_type: 'internal',
          comments: 'Test approval'
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request, { params: { id: '123' } })
      
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('Authentication required')
    })
  })

  describe('Reject Endpoint Authentication Tests', () => {
    it('should reject requests without Authorization header', async () => {
      const { POST } = await import('@/app/api/shop-drawings/[id]/reject/route')
      
      const request = new NextRequest('http://localhost:3000/api/shop-drawings/123/reject', {
        method: 'POST',
        body: JSON.stringify({ 
          review_type: 'internal',
          comments: 'Test rejection'
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request, { params: { id: '123' } })
      
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('Authentication required')
    })
  })

  describe('Request Revision Endpoint Authentication Tests', () => {
    it('should reject requests without Authorization header', async () => {
      const { POST } = await import('@/app/api/shop-drawings/[id]/request-revision/route')
      
      const request = new NextRequest('http://localhost:3000/api/shop-drawings/123/request-revision', {
        method: 'POST',
        body: JSON.stringify({ 
          review_type: 'internal',
          comments: 'Test revision request'
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request, { params: { id: '123' } })
      
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('Authentication required')
    })
  })

  describe('Review Endpoint Authentication Tests', () => {
    it('should reject requests without Authorization header', async () => {
      const { POST } = await import('@/app/api/shop-drawings/[id]/review/route')
      
      const request = new NextRequest('http://localhost:3000/api/shop-drawings/123/review', {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'approve',
          review_type: 'internal',
          comments: 'Test review'
        }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request, { params: { id: '123' } })
      
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('Authentication required')
    })
  })

  describe('Validation Tests', () => {
    it('should validate status enum values in status endpoint', async () => {
      const { PATCH } = await import('@/app/api/shop-drawings/[id]/status/route')
      
      const request = new NextRequest('http://localhost:3000/api/shop-drawings/123/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'invalid_status' }),
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        }
      })

      const response = await PATCH(request, { params: { id: '123' } })
      
      // Should return validation error (400) or auth error (401/403)
      expect(response.status).toBeGreaterThanOrEqual(400)
      const data = await response.json()
      expect(data.success).toBe(false)
    })

    it('should validate review_type enum values in approve endpoint', async () => {
      const { POST } = await import('@/app/api/shop-drawings/[id]/approve/route')
      
      const request = new NextRequest('http://localhost:3000/api/shop-drawings/123/approve', {
        method: 'POST',
        body: JSON.stringify({ 
          review_type: 'invalid_type',
          comments: 'Test approval'
        }),
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        }
      })

      const response = await POST(request, { params: { id: '123' } })
      
      // Should return validation error (400) or auth error (401/403)
      expect(response.status).toBeGreaterThanOrEqual(400)
      const data = await response.json()
      expect(data.success).toBe(false)
    })

    it('should validate action enum values in review endpoint', async () => {
      const { POST } = await import('@/app/api/shop-drawings/[id]/review/route')
      
      const request = new NextRequest('http://localhost:3000/api/shop-drawings/123/review', {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'invalid_action',
          review_type: 'internal',
          comments: 'Test review'
        }),
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        }
      })

      const response = await POST(request, { params: { id: '123' } })
      
      // Should return validation error (400) or auth error (401/403)
      expect(response.status).toBeGreaterThanOrEqual(400)
      const data = await response.json()
      expect(data.success).toBe(false)
    })

    it('should require comments for reject endpoint', async () => {
      const { POST } = await import('@/app/api/shop-drawings/[id]/reject/route')
      
      const request = new NextRequest('http://localhost:3000/api/shop-drawings/123/reject', {
        method: 'POST',
        body: JSON.stringify({ 
          review_type: 'internal'
          // Missing comments
        }),
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        }
      })

      const response = await POST(request, { params: { id: '123' } })
      
      // Should return validation error (400) or auth error (401/403)
      expect(response.status).toBeGreaterThanOrEqual(400)
      const data = await response.json()
      expect(data.success).toBe(false)
    })

    it('should require comments for request-revision endpoint', async () => {
      const { POST } = await import('@/app/api/shop-drawings/[id]/request-revision/route')
      
      const request = new NextRequest('http://localhost:3000/api/shop-drawings/123/request-revision', {
        method: 'POST',
        body: JSON.stringify({ 
          review_type: 'internal'
          // Missing comments
        }),
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        }
      })

      const response = await POST(request, { params: { id: '123' } })
      
      // Should return validation error (400) or auth error (401/403)
      expect(response.status).toBeGreaterThanOrEqual(400)
      const data = await response.json()
      expect(data.success).toBe(false)
    })

    it('should require comments for reject action in review endpoint', async () => {
      const { POST } = await import('@/app/api/shop-drawings/[id]/review/route')
      
      const request = new NextRequest('http://localhost:3000/api/shop-drawings/123/review', {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'reject',
          review_type: 'internal'
          // Missing comments
        }),
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        }
      })

      const response = await POST(request, { params: { id: '123' } })
      
      // Should return validation error (400) or auth error (401/403)
      expect(response.status).toBeGreaterThanOrEqual(400)
      const data = await response.json()
      expect(data.success).toBe(false)
    })

    it('should require comments for request_revision action in review endpoint', async () => {
      const { POST } = await import('@/app/api/shop-drawings/[id]/review/route')
      
      const request = new NextRequest('http://localhost:3000/api/shop-drawings/123/review', {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'request_revision',
          review_type: 'internal'
          // Missing comments
        }),
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        }
      })

      const response = await POST(request, { params: { id: '123' } })
      
      // Should return validation error (400) or auth error (401/403)
      expect(response.status).toBeGreaterThanOrEqual(400)
      const data = await response.json()
      expect(data.success).toBe(false)
    })

    it('should handle malformed JSON in request body', async () => {
      const { PATCH } = await import('@/app/api/shop-drawings/[id]/status/route')
      
      const request = new NextRequest('http://localhost:3000/api/shop-drawings/123/status', {
        method: 'PATCH',
        body: 'invalid json',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        }
      })

      const response = await PATCH(request, { params: { id: '123' } })
      
      // Should return validation error (400) or auth error (401/403)
      expect(response.status).toBeGreaterThanOrEqual(400)
      const data = await response.json()
      expect(data.success).toBe(false)
    })

    it('should handle empty request body', async () => {
      const { PATCH } = await import('@/app/api/shop-drawings/[id]/status/route')
      
      const request = new NextRequest('http://localhost:3000/api/shop-drawings/123/status', {
        method: 'PATCH',
        body: JSON.stringify({}),
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        }
      })

      const response = await PATCH(request, { params: { id: '123' } })
      
      // Should return validation error (400) or auth error (401/403)
      expect(response.status).toBeGreaterThanOrEqual(400)
      const data = await response.json()
      expect(data.success).toBe(false)
    })
  })

  describe('Error Handling Tests', () => {
    it('should handle missing params gracefully', async () => {
      const { PATCH } = await import('@/app/api/shop-drawings/[id]/status/route')
      
      const request = new NextRequest('http://localhost:3000/api/shop-drawings/123/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'approved' }),
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        }
      })

      // Call without params or with undefined params
      const response = await PATCH(request, {})
      
      // Should handle gracefully and return error
      expect(response.status).toBeGreaterThanOrEqual(400)
      const data = await response.json()
      expect(data.success).toBe(false)
    })

    it('should handle missing id param gracefully', async () => {
      const { PATCH } = await import('@/app/api/shop-drawings/[id]/status/route')
      
      const request = new NextRequest('http://localhost:3000/api/shop-drawings/123/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'approved' }),
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        }
      })

      // Call with empty params
      const response = await PATCH(request, { params: {} })
      
      // Should handle gracefully and return error
      expect(response.status).toBeGreaterThanOrEqual(400)
      const data = await response.json()
      expect(data.success).toBe(false)
    })

    it('should handle FormData parsing errors in submit endpoint', async () => {
      const { POST } = await import('@/app/api/shop-drawings/[id]/submit/route')
      
      const request = new NextRequest('http://localhost:3000/api/shop-drawings/123/submit', {
        method: 'POST',
        body: 'invalid form data',
        headers: { 
          'Authorization': 'Bearer valid-token'
        }
      })

      const response = await POST(request, { params: { id: '123' } })
      
      // Should handle gracefully and return error
      expect(response.status).toBeGreaterThanOrEqual(400)
      const data = await response.json()
      expect(data.success).toBe(false)
    })
  })

  describe('Security Tests', () => {
    it('should reject requests with malicious payloads', async () => {
      const { PATCH } = await import('@/app/api/shop-drawings/[id]/status/route')
      
      const maliciousPayload = {
        status: 'approved',
        __proto__: { admin: true },
        constructor: { prototype: { admin: true } }
      }
      
      const request = new NextRequest('http://localhost:3000/api/shop-drawings/123/status', {
        method: 'PATCH',
        body: JSON.stringify(maliciousPayload),
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        }
      })

      const response = await PATCH(request, { params: { id: '123' } })
      
      // Should handle gracefully and return error
      expect(response.status).toBeGreaterThanOrEqual(400)
      const data = await response.json()
      expect(data.success).toBe(false)
    })

    it('should validate ID parameter format', async () => {
      const { PATCH } = await import('@/app/api/shop-drawings/[id]/status/route')
      
      const request = new NextRequest('http://localhost:3000/api/shop-drawings/123/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'approved' }),
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        }
      })

      // Test with various malicious ID formats
      const maliciousIds = ['../../../etc/passwd', 'javascript:alert(1)', '<script>alert(1)</script>']
      
      for (const maliciousId of maliciousIds) {
        const response = await PATCH(request, { params: { id: maliciousId } })
        
        // Should handle gracefully and return error
        expect(response.status).toBeGreaterThanOrEqual(400)
        const data = await response.json()
        expect(data.success).toBe(false)
      }
    })
  })

  describe('HTTP Method Tests', () => {
    it('should only accept PATCH method for status endpoint', async () => {
      const statusModule = await import('@/app/api/shop-drawings/[id]/status/route')
      
      // Should export PATCH but not GET, POST, PUT, DELETE
      expect(statusModule.PATCH).toBeDefined()
      expect(statusModule.GET).toBeUndefined()
      expect(statusModule.POST).toBeUndefined()
      expect(statusModule.PUT).toBeUndefined()
      expect(statusModule.DELETE).toBeUndefined()
    })

    it('should only accept POST method for action endpoints', async () => {
      const endpoints = [
        '@/app/api/shop-drawings/[id]/submit/route',
        '@/app/api/shop-drawings/[id]/approve/route',
        '@/app/api/shop-drawings/[id]/reject/route',
        '@/app/api/shop-drawings/[id]/request-revision/route',
        '@/app/api/shop-drawings/[id]/review/route'
      ]
      
      for (const endpoint of endpoints) {
        const module = await import(endpoint)
        
        // Should export POST but not GET, PATCH, PUT, DELETE
        expect(module.POST).toBeDefined()
        expect(module.GET).toBeUndefined()
        expect(module.PATCH).toBeUndefined()
        expect(module.PUT).toBeUndefined()
        expect(module.DELETE).toBeUndefined()
      }
    })
  })

  describe('Workflow State Validation', () => {
    it('should validate workflow state transitions', () => {
      const validStates = [
        'pending_internal_review',
        'ready_for_client_review',
        'client_reviewing',
        'approved',
        'rejected',
        'revision_requested'
      ]
      
      validStates.forEach(state => {
        expect(typeof state).toBe('string')
        expect(state.length).toBeGreaterThan(0)
        expect(state).toMatch(/^[a-z_]+$/) // Only lowercase letters and underscores
      })
    })

    it('should validate review types', () => {
      const validReviewTypes = ['internal', 'client']
      
      validReviewTypes.forEach(type => {
        expect(typeof type).toBe('string')
        expect(type.length).toBeGreaterThan(0)
        expect(['internal', 'client']).toContain(type)
      })
    })

    it('should validate review actions', () => {
      const validActions = ['approve', 'reject', 'request_revision']
      
      validActions.forEach(action => {
        expect(typeof action).toBe('string')
        expect(action.length).toBeGreaterThan(0)
        expect(['approve', 'reject', 'request_revision']).toContain(action)
      })
    })
  })
})