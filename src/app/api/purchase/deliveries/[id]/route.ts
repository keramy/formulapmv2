/**
 * Formula PM 2.0 Delivery Confirmations API - Individual Delivery Routes
 * Purchase Department Workflow Implementation
 * 
 * Handles individual delivery confirmation operations
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
  PurchaseApiResponse 
} from '@/types/purchase'

// ============================================================================
// GET /api/purchase/deliveries/[id] - Get specific delivery confirmation
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (request: NextRequest) => {
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

      const { id } = params
      const supabase = createServerClient()

      // Get delivery confirmation with relations
      const { data: delivery, error } = await supabase
        .from('delivery_confirmations')
        .select(`
          *,
          purchase_order:purchase_orders(
            id, po_number, total_amount, expected_delivery_date, status,
            purchase_request:purchase_requests(
              id, request_number, item_description, quantity, unit_of_measure,
              required_date, urgency_level, project_id,
              project:projects(id, name, status),
              requester:user_profiles!requester_id(id, first_name, last_name, role)
            ),
            vendor:vendors(id, company_name, contact_person, email, phone)
          ),
          confirmer:user_profiles!confirmed_by(id, first_name, last_name, role, email)
        `)
        .eq('id', id)
        .single()

      if (error || !delivery) {
        return NextResponse.json(
          { success: false, error: 'Delivery confirmation not found' },
          { status: 404 }
        )
      }

      // Verify user has access to this project
      const projectId = delivery.purchase_order?.purchase_request?.project_id
      if (projectId) {
        const hasAccess = await verifyProjectAccess(supabase, user, projectId)
        if (!hasAccess) {
          return NextResponse.json(
            { success: false, error: 'Access denied to this delivery confirmation' },
            { status: 403 }
          )
        }
      }

      // Enhance with metadata
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

      const enhancedDelivery = {
        ...delivery,
        metadata: {
          delivery_status: deliveryStatus,
          completion_percentage: delivery.quantity_ordered > 0 
            ? Math.round((delivery.quantity_received / delivery.quantity_ordered) * 100)
            : 0,
          is_partial: delivery.quantity_received < delivery.quantity_ordered,
          is_complete: delivery.quantity_received >= delivery.quantity_ordered,
          days_early_late: expectedDate 
            ? Math.floor((deliveryDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24))
            : 0
        }
      }

      const response: PurchaseApiResponse<{ delivery: DeliveryConfirmation }> = {
        success: true,
        data: {
          delivery: enhancedDelivery
        }
      }

      return NextResponse.json(response)

    } catch (error) {
      console.error('Delivery confirmation fetch API error:', error)
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }
  })(request)
}

// ============================================================================
// PUT /api/purchase/deliveries/[id] - Update delivery confirmation
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (request: NextRequest) => {
    try {
      const user = getAuthenticatedUser(request)
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        )
      }

      // Check edit permission (only confirmer, project managers, or admins can edit)
      if (!hasPermission(user.role, 'deliveries.edit') && 
          !['project_manager', 'purchase_specialist', 'purchase_director', 'general_manager', 'admin'].includes(user.role)) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions to edit delivery confirmations' },
          { status: 403 }
        )
      }

      const { id } = params
      const body = await request.json()
      const supabase = createServerClient()

      // Get existing delivery confirmation
      const { data: existingDelivery, error: fetchError } = await supabase
        .from('delivery_confirmations')
        .select(`
          *,
          purchase_order:purchase_orders(
            id, status,
            purchase_request:purchase_requests(id, project_id, quantity)
          )
        `)
        .eq('id', id)
        .single()

      if (fetchError || !existingDelivery) {
        return NextResponse.json(
          { success: false, error: 'Delivery confirmation not found' },
          { status: 404 }
        )
      }

      // Verify user has access to this project
      const projectId = existingDelivery.purchase_order?.purchase_request?.project_id
      if (projectId) {
        const hasAccess = await verifyProjectAccess(supabase, user, projectId)
        if (!hasAccess) {
          return NextResponse.json(
            { success: false, error: 'Access denied to this delivery confirmation' },
            { status: 403 }
          )
        }
      }

      // Only confirmer or higher roles can edit
      if (existingDelivery.confirmed_by !== user.id && 
          !['purchase_specialist', 'purchase_director', 'general_manager', 'admin'].includes(user.role)) {
        return NextResponse.json(
          { success: false, error: 'Only the confirmer or purchase department can edit this delivery' },
          { status: 403 }
        )
      }

      // Validate update data (partial schema)
      const updateSchema = deliveryConfirmationSchema.partial()
      const validationResult = validatePurchaseInput(updateSchema, body)
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

      const updateData = validationResult.data

      // If quantity is being updated, validate against order
      if (updateData.quantity_received !== undefined) {
        const originalQuantity = existingDelivery.purchase_order?.purchase_request?.quantity || 0
        
        // Get other deliveries for this order
        const { data: otherDeliveries } = await supabase
          .from('delivery_confirmations')
          .select('quantity_received')
          .eq('purchase_order_id', existingDelivery.purchase_order_id)
          .neq('id', id)

        const otherQuantityReceived = otherDeliveries?.reduce(
          (total, delivery) => total + delivery.quantity_received,
          0
        ) || 0

        const totalAfterUpdate = otherQuantityReceived + updateData.quantity_received

        if (totalAfterUpdate > originalQuantity) {
          return NextResponse.json(
            { 
              success: false, 
              error: `Total received quantity would exceed ordered quantity. Ordered: ${originalQuantity}, Other deliveries: ${otherQuantityReceived}, Update to: ${updateData.quantity_received}` 
            },
            { status: 400 }
          )
        }
      }

      // Update delivery confirmation
      const { data: updatedDelivery, error: updateError } = await supabase
        .from('delivery_confirmations')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          purchase_order:purchase_orders(
            id, po_number, total_amount, expected_delivery_date, status,
            purchase_request:purchase_requests(
              id, request_number, item_description, quantity, unit_of_measure,
              project:projects(id, name, status)
            ),
            vendor:vendors(id, company_name, contact_person, email, phone)
          ),
          confirmer:user_profiles!confirmed_by(id, first_name, last_name, role)
        `)
        .single()

      if (updateError) {
        console.error('Delivery confirmation update error:', updateError)
        return NextResponse.json(
          { success: false, error: 'Failed to update delivery confirmation' },
          { status: 500 }
        )
      }

      const response: PurchaseApiResponse<{ delivery: DeliveryConfirmation }> = {
        success: true,
        message: 'Delivery confirmation updated successfully',
        data: {
          delivery: updatedDelivery
        }
      }

      return NextResponse.json(response)

    } catch (error) {
      console.error('Delivery confirmation update API error:', error)
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }
  })(request)
}

// ============================================================================
// DELETE /api/purchase/deliveries/[id] - Delete delivery confirmation
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (request: NextRequest) => {
    try {
      const user = getAuthenticatedUser(request)
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        )
      }

      // Check delete permission (only purchase department and above)
      if (!hasPermission(user.role, 'deliveries.delete') && 
          !['purchase_director', 'general_manager', 'admin'].includes(user.role)) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions to delete delivery confirmations' },
          { status: 403 }
        )
      }

      const { id } = params
      const supabase = createServerClient()

      // Get existing delivery confirmation
      const { data: existingDelivery, error: fetchError } = await supabase
        .from('delivery_confirmations')
        .select(`
          *,
          purchase_order:purchase_orders(
            id, status,
            purchase_request:purchase_requests(id, project_id)
          )
        `)
        .eq('id', id)
        .single()

      if (fetchError || !existingDelivery) {
        return NextResponse.json(
          { success: false, error: 'Delivery confirmation not found' },
          { status: 404 }
        )
      }

      // Verify user has access to this project
      const projectId = existingDelivery.purchase_order?.purchase_request?.project_id
      if (projectId) {
        const hasAccess = await verifyProjectAccess(supabase, user, projectId)
        if (!hasAccess) {
          return NextResponse.json(
            { success: false, error: 'Access denied to this delivery confirmation' },
            { status: 403 }
          )
        }
      }

      // Delete delivery confirmation
      const { error: deleteError } = await supabase
        .from('delivery_confirmations')
        .delete()
        .eq('id', id)

      if (deleteError) {
        console.error('Delivery confirmation deletion error:', deleteError)
        return NextResponse.json(
          { success: false, error: 'Failed to delete delivery confirmation' },
          { status: 500 }
        )
      }

      // Check if we need to update purchase order status
      const { data: remainingDeliveries } = await supabase
        .from('delivery_confirmations')
        .select('quantity_received')
        .eq('purchase_order_id', existingDelivery.purchase_order_id)

      const totalRemaining = remainingDeliveries?.reduce(
        (total, delivery) => total + delivery.quantity_received,
        0
      ) || 0

      const originalQuantity = existingDelivery.purchase_order?.purchase_request?.quantity || 0

      // If no longer fully delivered, update order status back to confirmed
      if (totalRemaining < originalQuantity && existingDelivery.purchase_order?.status === 'delivered') {
        await supabase
          .from('purchase_orders')
          .update({ status: 'confirmed' })
          .eq('id', existingDelivery.purchase_order_id)
      }

      const response: PurchaseApiResponse<{}> = {
        success: true,
        message: 'Delivery confirmation deleted successfully'
      }

      return NextResponse.json(response)

    } catch (error) {
      console.error('Delivery confirmation deletion API error:', error)
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
      .eq('user_id', user.id)
      .eq('project_id', projectId)
      .eq('is_active', true)
      .single()
    
    return !!assignment
  }

  return false
}