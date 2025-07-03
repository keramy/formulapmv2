/**
 * Formula PM 2.0 Purchase Deliveries API - Pending Deliveries
 * Purchase Department Workflow Implementation
 * 
 * Handles listing pending deliveries for field workers and project managers
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, getAuthenticatedUser } from '@/lib/middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'
import { 
  PurchaseOrder, 
  PurchaseApiResponse, 
  PurchaseListResponse 
} from '@/types/purchase'

// ============================================================================
// GET /api/purchase/deliveries/pending - Get orders pending delivery confirmation
// ============================================================================

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check view permission
    if (!hasPermission(user.role, 'procurement.view')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to view pending deliveries' },
        { status: 403 }
      )
    }

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const projectFilter = url.searchParams.get('project_id')
    const vendorFilter = url.searchParams.get('vendor_id')
    const overdueOnly = url.searchParams.get('overdue_only') === 'true'

    const supabase = createServerClient()

    // Build query for orders that need delivery confirmation
    let query = supabase
      .from('purchase_orders')
      .select(`
        *,
        purchase_request:purchase_requests(
          id, request_number, item_description, quantity, unit_of_measure,
          required_date, urgency_level,
          project:projects(id, name, status, budget),
          requester:user_profiles!requester_id(id, first_name, last_name, role, email)
        ),
        vendor:vendors(id, company_name, contact_person, email, phone),
        creator:user_profiles!created_by(id, first_name, last_name, role),
        delivery_confirmations(id, delivery_date, quantity_received, status)
      `, { count: 'exact' })
      .in('status', ['sent', 'confirmed']) // Orders that have been sent but not fully delivered

    // Apply role-based filtering
    if (!hasPermission(user.role, 'procurement.view_all')) {
      // Get accessible projects for this user
      const accessibleProjects = await getAccessibleProjects(supabase, user)
      if (accessibleProjects.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            pending_deliveries: []
          },
          pagination: {
            page: 1,
            limit,
            total: 0,
            has_more: false
          }
        } as PurchaseApiResponse<PurchaseListResponse<PurchaseOrder>>)
      }

      // Filter by accessible projects
      const { data: accessibleRequests } = await supabase
        .from('purchase_requests')
        .select('id')
        .in('project_id', accessibleProjects)

      const requestIds = accessibleRequests?.map(r => r.id) || []
      if (requestIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            pending_deliveries: []
          },
          pagination: {
            page: 1,
            limit,
            total: 0,
            has_more: false
          }
        } as PurchaseApiResponse<PurchaseListResponse<PurchaseOrder>>)
      }

      query = query.in('purchase_request_id', requestIds)
    }

    // Apply additional filters
    if (projectFilter) {
      query = query.eq('purchase_request.project_id', projectFilter)
    }

    if (vendorFilter) {
      query = query.eq('vendor_id', vendorFilter)
    }

    // Apply overdue filter
    if (overdueOnly) {
      const today = new Date().toISOString().split('T')[0]
      query = query
        .not('expected_delivery_date', 'is', null)
        .lt('expected_delivery_date', today)
    }

    // Sort by expected delivery date (most urgent first)
    query = query.order('expected_delivery_date', { ascending: true })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: orders, error, count } = await query

    if (error) {
      console.error('Pending deliveries fetch error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch pending deliveries' },
        { status: 500 }
      )
    }

    // Filter out orders that are already fully delivered and enhance with metadata
    const pendingDeliveries = orders?.filter(order => {
      const originalQuantity = order.purchase_request?.quantity || 0
      const totalReceived = order.delivery_confirmations?.reduce(
        (total: number, delivery: any) => total + delivery.quantity_received,
        0
      ) || 0
      
      return totalReceived < originalQuantity // Not fully delivered
    }).map(order => {
      const originalQuantity = order.purchase_request?.quantity || 0
      const deliveries = order.delivery_confirmations || []
      const totalReceived = deliveries.reduce(
        (total: number, delivery: any) => total + delivery.quantity_received,
        0
      )
      const remainingQuantity = originalQuantity - totalReceived

      // Calculate delivery status
      const expectedDate = order.expected_delivery_date ? new Date(order.expected_delivery_date) : null
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      let deliveryStatus = 'on_time'
      let daysOverdue = 0
      if (expectedDate) {
        expectedDate.setHours(0, 0, 0, 0)
        if (today > expectedDate) {
          deliveryStatus = 'overdue'
          daysOverdue = Math.floor((today.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24))
        } else if (today.getTime() === expectedDate.getTime()) {
          deliveryStatus = 'due_today'
        }
      }

      // Determine urgency
      const isUrgent = order.purchase_request?.urgency_level === 'emergency' || 
                      order.purchase_request?.urgency_level === 'high' ||
                      deliveryStatus === 'overdue' ||
                      deliveryStatus === 'due_today'

      return {
        ...order,
        delivery_metadata: {
          original_quantity: originalQuantity,
          total_received: totalReceived,
          remaining_quantity: remainingQuantity,
          completion_percentage: originalQuantity > 0 ? Math.round((totalReceived / originalQuantity) * 100) : 0,
          delivery_status: deliveryStatus,
          days_overdue: daysOverdue,
          is_urgent: isUrgent,
          has_partial_deliveries: deliveries.length > 0
        }
      }
    }) || []

    // Sort by urgency and overdue status
    pendingDeliveries.sort((a, b) => {
      // Emergency requests first
      if (a.purchase_request.urgency_level === 'emergency' && b.purchase_request.urgency_level !== 'emergency') return -1
      if (b.purchase_request.urgency_level === 'emergency' && a.purchase_request.urgency_level !== 'emergency') return 1
      
      // Overdue orders next
      if (a.delivery_metadata.delivery_status === 'overdue' && b.delivery_metadata.delivery_status !== 'overdue') return -1
      if (b.delivery_metadata.delivery_status === 'overdue' && a.delivery_metadata.delivery_status !== 'overdue') return 1
      
      // Due today next
      if (a.delivery_metadata.delivery_status === 'due_today' && b.delivery_metadata.delivery_status !== 'due_today') return -1
      if (b.delivery_metadata.delivery_status === 'due_today' && a.delivery_metadata.delivery_status !== 'due_today') return 1
      
      // Then by expected delivery date
      const aDate = a.expected_delivery_date ? new Date(a.expected_delivery_date) : new Date('9999-12-31')
      const bDate = b.expected_delivery_date ? new Date(b.expected_delivery_date) : new Date('9999-12-31')
      return aDate.getTime() - bDate.getTime()
    })

    const response: PurchaseApiResponse<PurchaseListResponse<PurchaseOrder>> = {
      success: true,
      data: {
        pending_deliveries: pendingDeliveries
      },
      pagination: {
        page,
        limit,
        total: pendingDeliveries.length, // Use filtered count
        has_more: false // Since we filtered after fetching, pagination is not accurate
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Pending deliveries API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getAccessibleProjects(supabase: any, user: any): Promise<string[]> {
  if (hasPermission(user.role, 'projects.read.all')) {
    const { data: allProjects } = await supabase
      .from('projects')
      .select('id')
    return allProjects?.map((p: any) => p.id) || []
  }

  if (hasPermission(user.role, 'projects.read.assigned')) {
    const { data: assignedProjects } = await supabase
      .from('project_assignments')
      .select('project_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
    return assignedProjects?.map((p: any) => p.project_id) || []
  }

  return []
}