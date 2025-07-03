/**
 * Formula PM 2.0 Delivery Confirmations API - Main Route
 * Purchase Department Workflow Implementation
 * 
 * Handles delivery confirmation listing and creation with role-based access control
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, getAuthenticatedUser } from '@/lib/middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'
import { 
  deliveryConfirmationSchema,
  validatePurchaseInput
} from '@/lib/validation/purchase'
import { 
  DeliveryConfirmation, 
  PurchaseApiResponse, 
  PurchaseListResponse 
} from '@/types/purchase'

// ============================================================================
// GET /api/purchase/deliveries - List delivery confirmations with filtering
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
        { success: false, error: 'Insufficient permissions to view delivery confirmations' },
        { status: 403 }
      )
    }

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const status = url.searchParams.get('status')
    const projectId = url.searchParams.get('project_id')
    const vendorId = url.searchParams.get('vendor_id')
    const searchTerm = url.searchParams.get('search')

    const supabase = createServerClient()

    // Build query with relations
    let query = supabase
      .from('delivery_confirmations')
      .select(`
        *,
        purchase_order:purchase_orders(
          id, po_number, total_amount, expected_delivery_date,
          purchase_request:purchase_requests(
            id, request_number, item_description, quantity, unit_of_measure,
            project:projects(id, name, status)
          ),
          vendor:vendors(id, company_name, contact_person, email, phone)
        ),
        confirmer:user_profiles!confirmed_by(id, first_name, last_name, role)
      `, { count: 'exact' })

    // Apply role-based filtering
    if (!hasPermission(user.role, 'procurement.view_all')) {
      // Non-admin users can only see deliveries for their accessible projects
      const accessibleProjects = await getAccessibleProjects(supabase, user)
      if (accessibleProjects.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            deliveries: []
          },
          pagination: {
            page: 1,
            limit,
            total: 0,
            has_more: false
          }
        } as PurchaseApiResponse<PurchaseListResponse<DeliveryConfirmation>>)
      }

      // Filter by accessible projects through purchase orders
      const { data: accessibleOrders } = await supabase
        .from('purchase_orders')
        .select('id')
        .in('purchase_request.project_id', accessibleProjects)

      const orderIds = accessibleOrders?.map(o => o.id) || []
      if (orderIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            deliveries: []
          },
          pagination: {
            page: 1,
            limit,
            total: 0,
            has_more: false
          }
        } as PurchaseApiResponse<PurchaseListResponse<DeliveryConfirmation>>)
      }

      query = query.in('purchase_order_id', orderIds)
    }

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (projectId) {
      query = query.eq('purchase_order.purchase_request.project_id', projectId)
    }

    if (vendorId) {
      query = query.eq('purchase_order.vendor_id', vendorId)
    }

    if (searchTerm) {
      query = query.or(`purchase_order.po_number.ilike.%${searchTerm}%,condition_notes.ilike.%${searchTerm}%`)
    }

    // Apply sorting - most recent first
    query = query.order('delivery_date', { ascending: false })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: deliveries, error, count } = await query

    if (error) {
      console.error('Delivery confirmations fetch error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch delivery confirmations' },
        { status: 500 }
      )
    }

    // Enhance deliveries with additional metadata
    const enhancedDeliveries = deliveries?.map(delivery => {
      const deliveryDate = new Date(delivery.delivery_date)
      const expectedDate = delivery.purchase_order?.expected_delivery_date 
        ? new Date(delivery.purchase_order.expected_delivery_date)
        : null

      let deliveryStatus = 'on_time'
      if (expectedDate) {
        if (deliveryDate > expectedDate) {
          deliveryStatus = 'late'
        } else if (deliveryDate < expectedDate) {
          deliveryStatus = 'early'
        }
      }

      const completionPercentage = delivery.quantity_ordered > 0 
        ? Math.round((delivery.quantity_received / delivery.quantity_ordered) * 100)
        : 0

      return {
        ...delivery,
        metadata: {
          delivery_status: deliveryStatus,
          completion_percentage: completionPercentage,
          is_partial: delivery.quantity_received < delivery.quantity_ordered,
          is_complete: delivery.quantity_received >= delivery.quantity_ordered,
          days_early_late: expectedDate 
            ? Math.floor((deliveryDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24))
            : 0
        }
      }
    }) || []

    const response: PurchaseApiResponse<PurchaseListResponse<DeliveryConfirmation>> = {
      success: true,
      data: {
        deliveries: enhancedDeliveries
      },
      pagination: {
        page,
        limit,
        total: count || 0,
        has_more: page * limit < (count || 0)
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Delivery confirmations API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// ============================================================================
// POST /api/purchase/deliveries - Create new delivery confirmation
// ============================================================================

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const user = getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check create permission (field workers and above can confirm deliveries)
    if (!hasPermission(user.role, 'deliveries.confirm') && 
        !['field_worker', 'site_engineer', 'project_manager', 'purchase_specialist', 'purchase_director', 'general_manager', 'admin'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to confirm deliveries' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validate delivery confirmation data
    const validationResult = validatePurchaseInput(deliveryConfirmationSchema, body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid delivery confirmation data',
          details: validationResult.error.errors.map(e => e.message)
        },
        { status: 400 }
      )
    }

    const deliveryData = validationResult.data
    const supabase = createServerClient()

    // Verify purchase order exists and user has access
    const { data: purchaseOrder, error: orderError } = await supabase
      .from('purchase_orders')
      .select(`
        id, status, po_number,
        purchase_request:purchase_requests(
          id, project_id, quantity,
          project:projects(id, name)
        ),
        vendor:vendors(id, company_name)
      `)
      .eq('id', body.purchase_order_id)
      .single()

    if (orderError || !purchaseOrder) {
      return NextResponse.json(
        { success: false, error: 'Purchase order not found' },
        { status: 404 }
      )
    }

    // Verify user has access to this project
    const hasProjectAccess = await verifyProjectAccess(
      supabase, 
      user, 
      purchaseOrder.purchase_request.project_id
    )
    if (!hasProjectAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this project' },
        { status: 403 }
      )
    }

    // Check if order is in deliverable status
    if (!['sent', 'confirmed'].includes(purchaseOrder.status)) {
      return NextResponse.json(
        { success: false, error: 'Purchase order must be sent or confirmed to record delivery' },
        { status: 400 }
      )
    }

    // Check for existing delivery confirmations
    const { data: existingDeliveries } = await supabase
      .from('delivery_confirmations')
      .select('id, quantity_received, status')
      .eq('purchase_order_id', body.purchase_order_id)

    const totalPreviouslyReceived = existingDeliveries?.reduce(
      (total, delivery) => total + delivery.quantity_received, 
      0
    ) || 0

    // Validate delivery quantity
    const originalQuantity = purchaseOrder.purchase_request.quantity
    const totalAfterThisDelivery = totalPreviouslyReceived + deliveryData.quantity_received

    if (totalAfterThisDelivery > originalQuantity) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot receive more than ordered quantity. Ordered: ${originalQuantity}, Previously received: ${totalPreviouslyReceived}, Attempting to receive: ${deliveryData.quantity_received}` 
        },
        { status: 400 }
      )
    }

    // Determine delivery status based on quantity
    let deliveryStatus = deliveryData.status
    if (deliveryData.quantity_received < deliveryData.quantity_ordered) {
      deliveryStatus = 'partial'
    } else if (deliveryData.quantity_received >= deliveryData.quantity_ordered) {
      deliveryStatus = 'completed'
    }

    // Create delivery confirmation
    const deliveryConfirmationData = {
      purchase_order_id: body.purchase_order_id,
      confirmed_by: user.id,
      delivery_date: deliveryData.delivery_date,
      quantity_received: deliveryData.quantity_received,
      quantity_ordered: deliveryData.quantity_ordered,
      condition_notes: deliveryData.condition_notes || null,
      photos: deliveryData.photos || [],
      status: deliveryStatus
    }

    const { data: deliveryConfirmation, error: insertError } = await supabase
      .from('delivery_confirmations')
      .insert(deliveryConfirmationData)
      .select(`
        *,
        purchase_order:purchase_orders(
          id, po_number, total_amount, expected_delivery_date,
          purchase_request:purchase_requests(
            id, request_number, item_description, quantity, unit_of_measure,
            project:projects(id, name, status)
          ),
          vendor:vendors(id, company_name, contact_person, email, phone)
        ),
        confirmer:user_profiles!confirmed_by(id, first_name, last_name, role)
      `)
      .single()

    if (insertError) {
      console.error('Delivery confirmation creation error:', insertError)
      return NextResponse.json(
        { success: false, error: 'Failed to create delivery confirmation' },
        { status: 500 }
      )
    }

    // Update purchase order status if fully delivered
    if (totalAfterThisDelivery >= originalQuantity) {
      await supabase
        .from('purchase_orders')
        .update({ status: 'delivered' })
        .eq('id', body.purchase_order_id)
    }

    const response: PurchaseApiResponse<{ delivery: DeliveryConfirmation }> = {
      success: true,
      message: 'Delivery confirmation created successfully',
      data: {
        delivery: deliveryConfirmation
      }
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Delivery confirmation creation API error:', error)
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

async function verifyProjectAccess(supabase: any, user: any, projectId: string): Promise<boolean> {
  const accessibleProjects = await getAccessibleProjects(supabase, user)
  return accessibleProjects.includes(projectId)
}