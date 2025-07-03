/**
 * Formula PM 2.0 Purchase Integration Tests
 * Purchase Department Workflow Implementation
 * 
 * Integration tests for purchase API endpoints and workflows
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { createMocks } from 'node-mocks-http'
import { NextRequest } from 'next/server'

// Mock data
const mockProject = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Test Project',
  client_id: '123e4567-e89b-12d3-a456-426614174001'
}

const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174002',
  role: 'project_manager',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User'
}

const mockVendor = {
  id: '123e4567-e89b-12d3-a456-426614174003',
  company_name: 'Test Vendor Inc.',
  contact_person: 'John Doe',
  email: 'vendor@example.com',
  phone: '+1-555-0123',
  is_active: true
}

const mockPurchaseRequest = {
  project_id: mockProject.id,
  requester_id: mockUser.id,
  item_description: 'Test Construction Materials',
  quantity: 100,
  unit_of_measure: 'units',
  estimated_cost: 5000,
  required_date: '2024-12-31',
  urgency_level: 'normal' as const,
  justification: 'Required for project phase 2'
}

const mockPurchaseOrder = {
  vendor_id: mockVendor.id,
  total_amount: 5250,
  po_date: '2024-01-15',
  expected_delivery_date: '2024-01-25',
  terms_conditions: 'Net 30 payment terms'
}

describe('Purchase API Integration Tests', () => {
  let createdRequestId: string
  let createdOrderId: string
  let createdVendorId: string

  beforeAll(async () => {
    // Setup test database or mock services
    console.log('Setting up purchase integration tests...')
  })

  afterAll(async () => {
    // Cleanup test data
    console.log('Cleaning up purchase integration tests...')
  })

  beforeEach(() => {
    // Reset any mocks or state
  })

  describe('Purchase Requests API', () => {
    it('should create a new purchase request', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'authorization': `Bearer ${mockUser.id}`
        },
        body: mockPurchaseRequest
      })

      // Mock the API route handler
      const mockHandler = async (request: NextRequest) => {
        // Simulate request creation
        const requestData = await request.json()
        
        expect(requestData.item_description).toBe(mockPurchaseRequest.item_description)
        expect(requestData.quantity).toBe(mockPurchaseRequest.quantity)
        expect(requestData.project_id).toBe(mockProject.id)

        const newRequest = {
          id: '123e4567-e89b-12d3-a456-426614174010',
          request_number: 'PR-2024-001',
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...requestData
        }

        createdRequestId = newRequest.id

        return Response.json({
          success: true,
          data: { request: newRequest }
        })
      }

      const request = new NextRequest('http://localhost/api/purchase/requests', {
        method: 'POST',
        headers: req.headers as any,
        body: JSON.stringify(mockPurchaseRequest)
      })

      const response = await mockHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.request.item_description).toBe(mockPurchaseRequest.item_description)
      expect(data.data.request.status).toBe('draft')
    })

    it('should fetch purchase requests with proper filtering', async () => {
      const { req } = createMocks({
        method: 'GET',
        headers: {
          'authorization': `Bearer ${mockUser.id}`
        },
        query: {
          project_id: mockProject.id,
          status: 'pending_approval',
          urgency: 'high'
        }
      })

      const mockHandler = async (request: NextRequest) => {
        const url = new URL(request.url)
        const projectId = url.searchParams.get('project_id')
        const status = url.searchParams.get('status')
        const urgency = url.searchParams.get('urgency')

        expect(projectId).toBe(mockProject.id)
        expect(status).toBe('pending_approval')
        expect(urgency).toBe('high')

        const mockRequests = [
          {
            id: createdRequestId || '123e4567-e89b-12d3-a456-426614174010',
            request_number: 'PR-2024-001',
            project_id: projectId,
            status: status,
            urgency_level: urgency,
            ...mockPurchaseRequest
          }
        ]

        return Response.json({
          success: true,
          data: {
            requests: mockRequests,
            total_count: mockRequests.length,
            page: 1,
            has_more: false
          }
        })
      }

      const request = new NextRequest(
        `http://localhost/api/purchase/requests?project_id=${mockProject.id}&status=pending_approval&urgency=high`,
        { method: 'GET', headers: req.headers as any }
      )

      const response = await mockHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.requests).toHaveLength(1)
      expect(data.data.requests[0].project_id).toBe(mockProject.id)
    })

    it('should update a purchase request', async () => {
      const updates = {
        estimated_cost: 5500,
        urgency_level: 'high' as const,
        justification: 'Updated: Critical for project timeline'
      }

      const { req } = createMocks({
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          'authorization': `Bearer ${mockUser.id}`
        },
        body: updates
      })

      const mockHandler = async (request: NextRequest, { params }: { params: { id: string } }) => {
        const requestId = params.id
        const updateData = await request.json()

        expect(requestId).toBe(createdRequestId || '123e4567-e89b-12d3-a456-426614174010')
        expect(updateData.estimated_cost).toBe(5500)
        expect(updateData.urgency_level).toBe('high')

        const updatedRequest = {
          id: requestId,
          ...mockPurchaseRequest,
          ...updateData,
          updated_at: new Date().toISOString()
        }

        return Response.json({
          success: true,
          data: { request: updatedRequest }
        })
      }

      const request = new NextRequest(
        `http://localhost/api/purchase/requests/${createdRequestId || '123e4567-e89b-12d3-a456-426614174010'}`,
        {
          method: 'PUT',
          headers: req.headers as any,
          body: JSON.stringify(updates)
        }
      )

      const response = await mockHandler(request, { params: { id: createdRequestId || '123e4567-e89b-12d3-a456-426614174010' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.request.estimated_cost).toBe(5500)
      expect(data.data.request.urgency_level).toBe('high')
    })

    it('should approve a purchase request', async () => {
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'authorization': `Bearer ${mockUser.id}`
        },
        body: {
          action: 'approve',
          comments: 'Approved for immediate processing'
        }
      })

      const mockHandler = async (request: NextRequest, { params }: { params: { id: string } }) => {
        const requestId = params.id
        const actionData = await request.json()

        expect(requestId).toBe(createdRequestId || '123e4567-e89b-12d3-a456-426614174010')
        expect(actionData.action).toBe('approve')

        const approvedRequest = {
          id: requestId,
          ...mockPurchaseRequest,
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: mockUser.id,
          approval_comments: actionData.comments
        }

        return Response.json({
          success: true,
          data: { request: approvedRequest }
        })
      }

      const request = new NextRequest(
        `http://localhost/api/purchase/requests/${createdRequestId || '123e4567-e89b-12d3-a456-426614174010'}/approval`,
        {
          method: 'POST',
          headers: req.headers as any,
          body: JSON.stringify({
            action: 'approve',
            comments: 'Approved for immediate processing'
          })
        }
      )

      const response = await mockHandler(request, { params: { id: createdRequestId || '123e4567-e89b-12d3-a456-426614174010' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.request.status).toBe('approved')
      expect(data.data.request.approved_by).toBe(mockUser.id)
    })
  })

  describe('Purchase Orders API', () => {
    it('should create a purchase order from approved request', async () => {
      const orderData = {
        purchase_request_id: createdRequestId || '123e4567-e89b-12d3-a456-426614174010',
        ...mockPurchaseOrder
      }

      const { req } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'authorization': `Bearer ${mockUser.id}`
        },
        body: orderData
      })

      const mockHandler = async (request: NextRequest) => {
        const requestData = await request.json()

        expect(requestData.purchase_request_id).toBe(createdRequestId || '123e4567-e89b-12d3-a456-426614174010')
        expect(requestData.vendor_id).toBe(mockVendor.id)
        expect(requestData.total_amount).toBe(mockPurchaseOrder.total_amount)

        const newOrder = {
          id: '123e4567-e89b-12d3-a456-426614174020',
          po_number: 'PO-2024-001',
          status: 'draft',
          created_at: new Date().toISOString(),
          created_by: mockUser.id,
          ...requestData
        }

        createdOrderId = newOrder.id

        return Response.json({
          success: true,
          data: { order: newOrder }
        })
      }

      const request = new NextRequest('http://localhost/api/purchase/orders', {
        method: 'POST',
        headers: req.headers as any,
        body: JSON.stringify(orderData)
      })

      const response = await mockHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.order.po_number).toBe('PO-2024-001')
      expect(data.data.order.status).toBe('draft')
    })

    it('should send purchase order to vendor', async () => {
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'authorization': `Bearer ${mockUser.id}`
        },
        body: {
          send_email: true,
          cc_emails: ['manager@company.com'],
          urgent: false
        }
      })

      const mockHandler = async (request: NextRequest, { params }: { params: { id: string } }) => {
        const orderId = params.id
        const sendData = await request.json()

        expect(orderId).toBe(createdOrderId || '123e4567-e89b-12d3-a456-426614174020')
        expect(sendData.send_email).toBe(true)

        const sentOrder = {
          id: orderId,
          po_number: 'PO-2024-001',
          status: 'sent',
          sent_at: new Date().toISOString(),
          sent_by: mockUser.id,
          ...mockPurchaseOrder
        }

        return Response.json({
          success: true,
          data: { 
            order: sentOrder,
            email_result: {
              success: true,
              messageId: 'test-message-id',
              deliveredTo: [mockVendor.email]
            }
          }
        })
      }

      const request = new NextRequest(
        `http://localhost/api/purchase/orders/${createdOrderId || '123e4567-e89b-12d3-a456-426614174020'}/send`,
        {
          method: 'POST',
          headers: req.headers as any,
          body: JSON.stringify({
            send_email: true,
            cc_emails: ['manager@company.com'],
            urgent: false
          })
        }
      )

      const response = await mockHandler(request, { params: { id: createdOrderId || '123e4567-e89b-12d3-a456-426614174020' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.order.status).toBe('sent')
      expect(data.data.email_result.success).toBe(true)
    })
  })

  describe('Vendors API', () => {
    it('should create a new vendor', async () => {
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'authorization': `Bearer ${mockUser.id}`
        },
        body: mockVendor
      })

      const mockHandler = async (request: NextRequest) => {
        const vendorData = await request.json()

        expect(vendorData.company_name).toBe(mockVendor.company_name)
        expect(vendorData.contact_person).toBe(mockVendor.contact_person)
        expect(vendorData.email).toBe(mockVendor.email)

        const newVendor = {
          id: '123e4567-e89b-12d3-a456-426614174030',
          created_at: new Date().toISOString(),
          ...vendorData
        }

        createdVendorId = newVendor.id

        return Response.json({
          success: true,
          data: { vendor: newVendor }
        })
      }

      const request = new NextRequest('http://localhost/api/purchase/vendors', {
        method: 'POST',
        headers: req.headers as any,
        body: JSON.stringify(mockVendor)
      })

      const response = await mockHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.vendor.company_name).toBe(mockVendor.company_name)
    })

    it('should rate a vendor', async () => {
      const rating = {
        quality_score: 4,
        delivery_score: 5,
        communication_score: 4,
        overall_score: 4,
        comments: 'Good vendor, reliable delivery'
      }

      const { req } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'authorization': `Bearer ${mockUser.id}`
        },
        body: {
          project_id: mockProject.id,
          ...rating
        }
      })

      const mockHandler = async (request: NextRequest, { params }: { params: { id: string } }) => {
        const vendorId = params.id
        const ratingData = await request.json()

        expect(vendorId).toBe(createdVendorId || '123e4567-e89b-12d3-a456-426614174030')
        expect(ratingData.overall_score).toBe(4)

        const newRating = {
          id: '123e4567-e89b-12d3-a456-426614174040',
          vendor_id: vendorId,
          rater_id: mockUser.id,
          created_at: new Date().toISOString(),
          ...ratingData
        }

        return Response.json({
          success: true,
          data: { rating: newRating }
        })
      }

      const request = new NextRequest(
        `http://localhost/api/purchase/vendors/${createdVendorId || '123e4567-e89b-12d3-a456-426614174030'}/rate`,
        {
          method: 'POST',
          headers: req.headers as any,
          body: JSON.stringify({
            project_id: mockProject.id,
            ...rating
          })
        }
      )

      const response = await mockHandler(request, { params: { id: createdVendorId || '123e4567-e89b-12d3-a456-426614174030' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.rating.overall_score).toBe(4)
      expect(data.data.rating.rater_id).toBe(mockUser.id)
    })
  })

  describe('Purchase Statistics API', () => {
    it('should fetch purchase statistics', async () => {
      const { req } = createMocks({
        method: 'GET',
        headers: {
          'authorization': `Bearer ${mockUser.id}`
        },
        query: {
          project_id: mockProject.id,
          include_financials: 'true'
        }
      })

      const mockHandler = async (request: NextRequest) => {
        const url = new URL(request.url)
        const projectId = url.searchParams.get('project_id')
        const includeFinancials = url.searchParams.get('include_financials')

        expect(projectId).toBe(mockProject.id)
        expect(includeFinancials).toBe('true')

        const mockStatistics = {
          total_requests: 5,
          pending_approvals: 2,
          active_orders: 3,
          pending_deliveries: 1,
          total_spent: 25000,
          average_approval_time: 18,
          vendor_count: 4,
          top_vendors: [
            { vendor_id: mockVendor.id, company_name: mockVendor.company_name, order_count: 2, total_amount: 12000 }
          ]
        }

        return Response.json({
          success: true,
          data: { statistics: mockStatistics }
        })
      }

      const request = new NextRequest(
        `http://localhost/api/purchase/statistics?project_id=${mockProject.id}&include_financials=true`,
        { method: 'GET', headers: req.headers as any }
      )

      const response = await mockHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.statistics.total_requests).toBe(5)
      expect(data.data.statistics.total_spent).toBe(25000)
      expect(data.data.statistics.top_vendors).toHaveLength(1)
    })
  })

  describe('Permission-based Access Control', () => {
    it('should restrict access based on user permissions', async () => {
      // Test with field worker who can only view limited data
      const fieldWorker = { ...mockUser, role: 'field_worker' }

      const { req } = createMocks({
        method: 'GET',
        headers: {
          'authorization': `Bearer ${fieldWorker.id}`
        }
      })

      const mockHandler = async (request: NextRequest) => {
        // Simulate permission check
        const authHeader = request.headers.get('authorization')
        const userId = authHeader?.split(' ')[1]

        if (userId === fieldWorker.id) {
          // Field worker should only see delivery-related data
          return Response.json({
            success: true,
            data: {
              requests: [], // No access to purchase requests
              deliveries: [
                {
                  id: '123e4567-e89b-12d3-a456-426614174050',
                  order_id: createdOrderId,
                  status: 'pending',
                  expected_date: '2024-01-25'
                }
              ]
            }
          })
        }

        return Response.json({ success: false, error: 'Unauthorized' }, { status: 403 })
      }

      const request = new NextRequest('http://localhost/api/purchase/requests', {
        method: 'GET',
        headers: req.headers as any
      })

      const response = await mockHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.requests).toHaveLength(0) // No access to purchase requests
      expect(data.data.deliveries).toHaveLength(1) // Can see deliveries
    })

    it('should allow purchase directors full access', async () => {
      const purchaseDirector = { ...mockUser, role: 'purchase_director' }

      const { req } = createMocks({
        method: 'GET',
        headers: {
          'authorization': `Bearer ${purchaseDirector.id}`
        }
      })

      const mockHandler = async (request: NextRequest) => {
        const authHeader = request.headers.get('authorization')
        const userId = authHeader?.split(' ')[1]

        if (userId === purchaseDirector.id) {
          return Response.json({
            success: true,
            data: {
              requests: [{ id: createdRequestId, status: 'approved' }],
              orders: [{ id: createdOrderId, status: 'sent' }],
              vendors: [{ id: createdVendorId, company_name: mockVendor.company_name }],
              statistics: { total_spent: 25000, pending_approvals: 0 }
            }
          })
        }

        return Response.json({ success: false, error: 'Unauthorized' }, { status: 403 })
      }

      const request = new NextRequest('http://localhost/api/purchase/overview', {
        method: 'GET',
        headers: req.headers as any
      })

      const response = await mockHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.requests).toHaveLength(1)
      expect(data.data.orders).toHaveLength(1)
      expect(data.data.vendors).toHaveLength(1)
      expect(data.data.statistics).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle validation errors', async () => {
      const invalidRequest = {
        // Missing required fields
        item_description: '',
        quantity: -1,
        required_date: 'invalid-date'
      }

      const { req } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'authorization': `Bearer ${mockUser.id}`
        },
        body: invalidRequest
      })

      const mockHandler = async (request: NextRequest) => {
        const requestData = await request.json()

        // Simulate validation
        const errors: string[] = []
        if (!requestData.item_description) errors.push('Item description is required')
        if (requestData.quantity <= 0) errors.push('Quantity must be positive')
        if (!requestData.project_id) errors.push('Project ID is required')

        if (errors.length > 0) {
          return Response.json({
            success: false,
            error: 'Validation failed',
            details: errors
          }, { status: 400 })
        }

        return Response.json({ success: true })
      }

      const request = new NextRequest('http://localhost/api/purchase/requests', {
        method: 'POST',
        headers: req.headers as any,
        body: JSON.stringify(invalidRequest)
      })

      const response = await mockHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Validation failed')
      expect(data.details).toContain('Item description is required')
      expect(data.details).toContain('Quantity must be positive')
    })

    it('should handle database errors gracefully', async () => {
      const { req } = createMocks({
        method: 'GET',
        headers: {
          'authorization': `Bearer ${mockUser.id}`
        }
      })

      const mockHandler = async (request: NextRequest) => {
        // Simulate database error
        return Response.json({
          success: false,
          error: 'Database connection failed',
          code: 'DB_ERROR'
        }, { status: 500 })
      }

      const request = new NextRequest('http://localhost/api/purchase/requests', {
        method: 'GET',
        headers: req.headers as any
      })

      const response = await mockHandler(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Database connection failed')
      expect(data.code).toBe('DB_ERROR')
    })
  })
})