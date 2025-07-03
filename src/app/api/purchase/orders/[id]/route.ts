/**
 * Formula PM 2.0 Purchase Orders API - Individual Route
 * Purchase Department Workflow Implementation
 * 
 * Handles individual purchase order operations (GET, PUT)
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, getAuthenticatedUser } from '@/lib/middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'
import { 
  purchaseOrderUpdateSchema,
  validatePurchaseInput 
} from '@/lib/validation/purchase'
import { 
  PurchaseOrder, 
  PurchaseApiResponse 
} from '@/types/purchase'

// ============================================================================
// GET /api/purchase/orders/[id] - Get specific purchase order
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (req: NextRequest) => {
    try {
      const user = getAuthenticatedUser(req)
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

      const supabase = createServerClient()
      const { id } = params

      // Validate UUID format
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        return NextResponse.json(
          { success: false, error: 'Invalid order ID format' },
          { status: 400 }
        )
      }

      // Fetch purchase order with full relations
      const { data: purchaseOrder, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          purchase_request:purchase_requests(
            id, request_number, item_description, quantity, unit_of_measure, 
            estimated_cost, required_date, urgency_level, justification,
            project:projects(id, name, status, budget),
            requester:user_profiles!requester_id(id, first_name, last_name, role, email)
          ),
          vendor:vendors(
            id, company_name, contact_person, email, phone, address, payment_terms
          ),
          creator:user_profiles!created_by(id, first_name, last_name, role, email),
          delivery_confirmations(
            id, delivery_date, quantity_received, quantity_ordered, 
            condition_notes, status, created_at,
            confirmer:user_profiles!confirmed_by(id, first_name, last_name, role)
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { success: false, error: 'Purchase order not found' },
            { status: 404 }
          )
        }
        console.error('Purchase order fetch error:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch purchase order' },
          { status: 500 }
        )
      }

      // Check project access
      const hasProjectAccess = await verifyProjectAccess(
        supabase, 
        user, 
        purchaseOrder.purchase_request.project.id
      )
      if (!hasProjectAccess) {
        return NextResponse.json(
          { success: false, error: 'Access denied to this purchase order' },
          { status: 403 }
        )
      }

      const response: PurchaseApiResponse<{ order: PurchaseOrder }> = {
        success: true,
        data: {
          order: purchaseOrder
        }
      }

      return NextResponse.json(response)

    } catch (error) {
      console.error('Purchase order fetch API error:', error)
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }
  })(request)
}

// ============================================================================
// PUT /api/purchase/orders/[id] - Update purchase order
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (req: NextRequest) => {
    try {
      const user = getAuthenticatedUser(req)
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        )
      }

      // Check edit permission (only purchase department and above)
      if (!hasPermission(user.role, 'procurement.edit') || 
          !['purchase_director', 'purchase_specialist', 'general_manager', 'admin'].includes(user.role)) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions to edit purchase orders' },
          { status: 403 }
        )
      }

      const supabase = createServerClient()
      const { id } = params

      // Validate UUID format
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        return NextResponse.json(
          { success: false, error: 'Invalid order ID format' },
          { status: 400 }
        )
      }

      // Check if order exists and get current status
      const { data: existingOrder, error: fetchError } = await supabase
        .from('purchase_orders')
        .select(`
          id, status, vendor_id, total_amount, created_by,
          purchase_request:purchase_requests(project_id, status)
        `)
        .eq('id', id)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return NextResponse.json(
            { success: false, error: 'Purchase order not found' },
            { status: 404 }
          )
        }
        console.error('Purchase order fetch error:', fetchError)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch purchase order' },
          { status: 500 }
        )
      }

      // Check project access
      const hasProjectAccess = await verifyProjectAccess(
        supabase, 
        user, 
        existingOrder.purchase_request.project_id
      )
      if (!hasProjectAccess) {
        return NextResponse.json(
          { success: false, error: 'Access denied to this purchase order' },
          { status: 403 }
        )
      }

      // Check if order can be edited
      if (!canEditOrder(user, existingOrder)) {
        return NextResponse.json(
          { success: false, error: 'Cannot edit order with current status or insufficient permissions' },
          { status: 403 }
        )
      }

      const body = await req.json()
      
      // Validate update data
      const validationResult = validatePurchaseInput(purchaseOrderUpdateSchema, body)
      if (!validationResult.success) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid update data',
            details: validationResult.error.errors.map(e => e.message)
          },
          { status: 400 }
        )
      }

      const updateData = validationResult.data

      // If vendor is being changed, verify new vendor is active
      if (updateData.vendor_id && updateData.vendor_id !== existingOrder.vendor_id) {
        const { data: vendor, error: vendorError } = await supabase
          .from('vendors')
          .select('id, is_active, company_name, email')
          .eq('id', updateData.vendor_id)
          .single()

        if (vendorError || !vendor) {
          return NextResponse.json(
            { success: false, error: 'New vendor not found' },
            { status: 404 }
          )
        }

        if (!vendor.is_active) {
          return NextResponse.json(
            { success: false, error: 'Cannot update to inactive vendor' },
            { status: 400 }
          )
        }
      }

      // Handle status change logic
      if (updateData.status && updateData.status !== existingOrder.status) {
        const statusChangeResult = await handleStatusChange(
          supabase, 
          existingOrder, 
          updateData.status, 
          user
        )
        
        if (!statusChangeResult.success) {
          return NextResponse.json(
            { success: false, error: statusChangeResult.error },
            { status: 400 }
          )
        }
      }

      // Update purchase order
      const { data: updatedOrder, error: updateError } = await supabase
        .from('purchase_orders')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          purchase_request:purchase_requests(
            id, request_number, item_description, quantity, unit_of_measure,
            project:projects(id, name, status)
          ),
          vendor:vendors(id, company_name, contact_person, email, phone),
          creator:user_profiles!created_by(id, first_name, last_name, role),
          delivery_confirmations(id, delivery_date, status, quantity_received)
        `)
        .single()

      if (updateError) {
        console.error('Purchase order update error:', updateError)
        return NextResponse.json(
          { success: false, error: 'Failed to update purchase order' },
          { status: 500 }
        )
      }

      // Send email notification if status changed to 'sent'
      if (updateData.status === 'sent' && existingOrder.status !== 'sent') {
        await sendPOEmailToVendor(updatedOrder)
      }

      const response: PurchaseApiResponse<{ order: PurchaseOrder }> = {
        success: true,
        message: 'Purchase order updated successfully',
        data: {
          order: updatedOrder
        }
      }

      return NextResponse.json(response)

    } catch (error) {
      console.error('Purchase order update API error:', error)
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }
  })(request)
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function verifyProjectAccess(supabase: any, user: any, projectId: string): Promise<boolean> {
  if (hasPermission(user.role, 'projects.read.all')) {
    return true
  }

  if (hasPermission(user.role, 'projects.read.assigned')) {
    const { data: assignment } = await supabase
      .from('project_assignments')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()
    
    return !!assignment
  }

  return false
}

function canEditOrder(user: any, order: any): boolean {
  // Purchase directors and above can edit any order
  if (['purchase_director', 'general_manager', 'admin'].includes(user.role)) {
    return true
  }

  // Purchase specialists can edit orders they created if not completed
  if (user.role === 'purchase_specialist' && 
      order.created_by === user.id && 
      !['completed', 'delivered'].includes(order.status)) {
    return true
  }

  return false
}

async function handleStatusChange(
  supabase: any, 
  existingOrder: any, 
  newStatus: string, 
  user: any
): Promise<{ success: boolean; error?: string }> {
  const currentStatus = existingOrder.status

  // Define valid status transitions
  const validTransitions: Record<string, string[]> = {
    'draft': ['sent', 'cancelled'],
    'sent': ['confirmed', 'cancelled'],
    'confirmed': ['delivered', 'cancelled'],
    'delivered': ['completed'],
    'completed': [], // Final state
    'cancelled': [] // Final state
  }

  if (!validTransitions[currentStatus]?.includes(newStatus)) {
    return {
      success: false,
      error: `Cannot change status from ${currentStatus} to ${newStatus}`
    }
  }

  // Additional business logic for specific transitions
  if (newStatus === 'sent' && !existingOrder.vendor?.email) {
    return {
      success: false,
      error: 'Cannot send order to vendor without email address'
    }
  }

  if (newStatus === 'delivered') {
    // Check if delivery confirmation exists
    const { data: delivery } = await supabase
      .from('delivery_confirmations')
      .select('id')
      .eq('purchase_order_id', existingOrder.id)
      .single()

    if (!delivery) {
      return {
        success: false,
        error: 'Delivery confirmation required before marking as delivered'
      }
    }
  }

  return { success: true }
}

async function sendPOEmailToVendor(purchaseOrder: any): Promise<void> {
  try {
    const vendor = purchaseOrder.vendor
    if (!vendor?.email) {
      console.log('No vendor email available for PO:', purchaseOrder.po_number)
      return
    }

    // This would integrate with your email service
    console.log('Sending PO email to vendor:', {
      vendor_email: vendor.email,
      po_number: purchaseOrder.po_number,
      total_amount: purchaseOrder.total_amount,
      vendor_name: vendor.company_name
    })

    // TODO: Implement actual email sending logic
    // await emailService.sendPONotification({
    //   to: vendor.email,
    //   po_number: purchaseOrder.po_number,
    //   vendor_name: vendor.company_name,
    //   total_amount: purchaseOrder.total_amount,
    //   items: purchaseOrder.purchase_request.item_description,
    //   delivery_date: purchaseOrder.expected_delivery_date,
    //   terms_conditions: purchaseOrder.terms_conditions
    // })

  } catch (error) {
    console.error('Failed to send PO email:', error)
    // Don't fail the order update if email fails
  }
}