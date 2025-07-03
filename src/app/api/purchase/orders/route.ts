/**
 * Formula PM 2.0 Purchase Orders API - Main Route
 * Purchase Department Workflow Implementation
 * 
 * Handles purchase order listing and creation with role-based access control
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, getAuthenticatedUser } from '@/lib/middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'
import { 
  purchaseOrderCreateSchema,
  purchaseOrderListParamsSchema,
  validatePurchaseInput,
  validatePurchaseListParams 
} from '@/lib/validation/purchase'
import { 
  PurchaseOrder, 
  PurchaseApiResponse, 
  PurchaseListResponse 
} from '@/types/purchase'

// ============================================================================
// GET /api/purchase/orders - List purchase orders with filtering and pagination
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
        { success: false, error: 'Insufficient permissions to view purchase orders' },
        { status: 403 }
      )
    }

    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    
    // Validate parameters
    const validationResult = validatePurchaseListParams(purchaseOrderListParamsSchema, queryParams)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid parameters',
          details: validationResult.error.errors.map(e => e.message)
        },
        { status: 400 }
      )
    }

    const params = validationResult.data
    const supabase = createServerClient()

    // Build query with relations
    let query = supabase
      .from('purchase_orders')
      .select(`
        *,
        purchase_request:purchase_requests(
          id, request_number, item_description, quantity, unit_of_measure,
          project:projects(id, name, status)
        ),
        vendor:vendors(id, company_name, contact_person, email, phone),
        creator:user_profiles!created_by(id, first_name, last_name, role),
        delivery_confirmations(id, delivery_date, status, quantity_received)
      `, { count: 'exact' })

    // Apply role-based filtering
    if (!hasPermission(user.role, 'procurement.view_all')) {
      // Non-admin users can only see orders for their accessible projects
      const { data: accessibleRequestIds } = await supabase
        .from('purchase_requests')
        .select('id')
        .in('project_id', await getAccessibleProjects(supabase, user))
      
      const requestIds = accessibleRequestIds?.map(r => r.id) || []
      if (requestIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            orders: []
          },
          pagination: {
            page: 1,
            limit: params.limit,
            total: 0,
            has_more: false
          }
        } as PurchaseApiResponse<PurchaseListResponse<PurchaseOrder>>)
      }
      query = query.in('purchase_request_id', requestIds)
    }

    // Apply filters
    if (params.vendor_id) {
      query = query.eq('vendor_id', params.vendor_id)
    }

    if (params.status?.length) {
      query = query.in('status', params.status)
    }

    if (params.date_start) {
      query = query.gte('po_date', params.date_start)
    }

    if (params.date_end) {
      query = query.lte('po_date', params.date_end)
    }

    if (params.amount_min !== undefined) {
      query = query.gte('total_amount', params.amount_min)
    }

    if (params.amount_max !== undefined) {
      query = query.lte('total_amount', params.amount_max)
    }

    if (params.search) {
      query = query.or(`po_number.ilike.%${params.search}%,terms_conditions.ilike.%${params.search}%`)
    }

    // Apply sorting
    query = query.order(params.sort_field, { ascending: params.sort_direction === 'asc' })

    // Apply pagination
    const from = (params.page - 1) * params.limit
    const to = from + params.limit - 1
    query = query.range(from, to)

    const { data: orders, error, count } = await query

    if (error) {
      console.error('Purchase orders fetch error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch purchase orders' },
        { status: 500 }
      )
    }

    const response: PurchaseApiResponse<PurchaseListResponse<PurchaseOrder>> = {
      success: true,
      data: {
        orders: orders || []
      },
      pagination: {
        page: params.page,
        limit: params.limit,
        total: count || 0,
        has_more: params.page * params.limit < (count || 0)
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Purchase orders API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// ============================================================================
// POST /api/purchase/orders - Create new purchase order
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

    // Check create permission (only purchase department and above)
    if (!hasPermission(user.role, 'procurement.create') || 
        !['purchase_director', 'purchase_specialist', 'general_manager', 'admin'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to create purchase orders' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validate order data
    const validationResult = validatePurchaseInput(purchaseOrderCreateSchema, body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid order data',
          details: validationResult.error.errors.map(e => e.message)
        },
        { status: 400 }
      )
    }

    const orderData = validationResult.data
    const supabase = createServerClient()

    // Verify purchase request exists and is approved
    const { data: purchaseRequest, error: requestError } = await supabase
      .from('purchase_requests')
      .select('id, status, project_id, item_description, quantity, estimated_cost')
      .eq('id', orderData.purchase_request_id)
      .single()

    if (requestError || !purchaseRequest) {
      return NextResponse.json(
        { success: false, error: 'Purchase request not found' },
        { status: 404 }
      )
    }

    if (purchaseRequest.status !== 'approved') {
      return NextResponse.json(
        { success: false, error: 'Purchase request must be approved before creating order' },
        { status: 400 }
      )
    }

    // Verify vendor exists and is active
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, company_name, is_active, email')
      .eq('id', orderData.vendor_id)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      )
    }

    if (!vendor.is_active) {
      return NextResponse.json(
        { success: false, error: 'Cannot create order with inactive vendor' },
        { status: 400 }
      )
    }

    // Check for existing orders for this request
    const { data: existingOrders } = await supabase
      .from('purchase_orders')
      .select('id')
      .eq('purchase_request_id', orderData.purchase_request_id)
      .not('status', 'eq', 'cancelled')

    if (existingOrders && existingOrders.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Purchase order already exists for this request' },
        { status: 400 }
      )
    }

    // Generate PO number
    const poNumber = await generatePONumber(supabase, purchaseRequest.project_id)

    // Create purchase order
    const purchaseOrderData = {
      ...orderData,
      po_number: poNumber,
      created_by: user.id,
      status: 'draft' as const
    }

    const { data: purchaseOrder, error: insertError } = await supabase
      .from('purchase_orders')
      .insert(purchaseOrderData)
      .select(`
        *,
        purchase_request:purchase_requests(
          id, request_number, item_description, quantity, unit_of_measure,
          project:projects(id, name, status)
        ),
        vendor:vendors(id, company_name, contact_person, email, phone),
        creator:user_profiles!created_by(id, first_name, last_name, role)
      `)
      .single()

    if (insertError) {
      console.error('Purchase order creation error:', insertError)
      return NextResponse.json(
        { success: false, error: 'Failed to create purchase order' },
        { status: 500 }
      )
    }

    // Send email notification to vendor if email exists
    if (vendor.email && purchaseOrder.status === 'sent') {
      await sendPOEmailToVendor(purchaseOrder, vendor)
    }

    const response: PurchaseApiResponse<{ order: PurchaseOrder }> = {
      success: true,
      message: 'Purchase order created successfully',
      data: {
        order: purchaseOrder
      }
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Purchase order creation API error:', error)
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

async function generatePONumber(supabase: any, projectId: string): Promise<string> {
  const { data: project } = await supabase
    .from('projects')
    .select('name')
    .eq('id', projectId)
    .single()

  const projectCode = project?.name?.substring(0, 3).toUpperCase() || 'PRJ'
  const year = new Date().getFullYear().toString().slice(-2)
  
  // Get next sequence number
  const { data: lastOrder } = await supabase
    .from('purchase_orders')
    .select('po_number')
    .like('po_number', `PO-${projectCode}-${year}-%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let sequence = 1
  if (lastOrder?.po_number) {
    const lastSequence = parseInt(lastOrder.po_number.split('-')[3] || '0')
    sequence = lastSequence + 1
  }

  return `PO-${projectCode}-${year}-${sequence.toString().padStart(4, '0')}`
}

async function sendPOEmailToVendor(purchaseOrder: any, vendor: any): Promise<void> {
  try {
    // This would integrate with your email service
    // For now, we'll just log the action
    console.log('Sending PO email to vendor:', {
      vendor_email: vendor.email,
      po_number: purchaseOrder.po_number,
      total_amount: purchaseOrder.total_amount
    })

    // TODO: Implement actual email sending logic
    // await emailService.sendPONotification({
    //   to: vendor.email,
    //   po_number: purchaseOrder.po_number,
    //   vendor_name: vendor.company_name,
    //   total_amount: purchaseOrder.total_amount,
    //   items: purchaseOrder.purchase_request.item_description,
    //   delivery_date: purchaseOrder.expected_delivery_date
    // })
  } catch (error) {
    console.error('Failed to send PO email:', error)
    // Don't fail the order creation if email fails
  }
}