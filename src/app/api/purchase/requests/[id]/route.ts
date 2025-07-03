/**
 * Formula PM 2.0 Purchase Requests API - Individual Route
 * Purchase Department Workflow Implementation
 * 
 * Handles individual purchase request operations (GET, PUT, DELETE)
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, getAuthenticatedUser } from '@/lib/middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'
import { 
  purchaseRequestUpdateSchema,
  validatePurchaseInput 
} from '@/lib/validation/purchase'
import { 
  PurchaseRequest, 
  PurchaseApiResponse 
} from '@/types/purchase'

// ============================================================================
// GET /api/purchase/requests/[id] - Get specific purchase request
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
          { success: false, error: 'Insufficient permissions to view purchase requests' },
          { status: 403 }
        )
      }

      const supabase = createServerClient()
      const { id } = params

      // Validate UUID format
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        return NextResponse.json(
          { success: false, error: 'Invalid request ID format' },
          { status: 400 }
        )
      }

      // Fetch purchase request with relations
      const { data: purchaseRequest, error } = await supabase
        .from('purchase_requests')
        .select(`
          *,
          project:projects(id, name, status, budget, actual_cost),
          requester:user_profiles!requester_id(id, first_name, last_name, role, email),
          purchase_orders(
            id, po_number, status, total_amount, vendor_id, po_date, expected_delivery_date,
            vendor:vendors(id, company_name, contact_person, email, phone)
          ),
          approvals:approval_workflows(
            id, approver_role, approver_id, approval_status, approval_date, comments,
            approver:user_profiles!approver_id(id, first_name, last_name, role)
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { success: false, error: 'Purchase request not found' },
            { status: 404 }
          )
        }
        console.error('Purchase request fetch error:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch purchase request' },
          { status: 500 }
        )
      }

      // Check project access
      const hasProjectAccess = await verifyProjectAccess(supabase, user, purchaseRequest.project_id)
      if (!hasProjectAccess) {
        return NextResponse.json(
          { success: false, error: 'Access denied to this purchase request' },
          { status: 403 }
        )
      }

      const response: PurchaseApiResponse<{ request: PurchaseRequest }> = {
        success: true,
        data: {
          request: purchaseRequest
        }
      }

      return NextResponse.json(response)

    } catch (error) {
      console.error('Purchase request fetch API error:', error)
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }
  })(request)
}

// ============================================================================
// PUT /api/purchase/requests/[id] - Update purchase request
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

      // Check edit permission
      if (!hasPermission(user.role, 'procurement.edit')) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions to edit purchase requests' },
          { status: 403 }
        )
      }

      const supabase = createServerClient()
      const { id } = params

      // Validate UUID format
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        return NextResponse.json(
          { success: false, error: 'Invalid request ID format' },
          { status: 400 }
        )
      }

      // Check if request exists and get current status
      const { data: existingRequest, error: fetchError } = await supabase
        .from('purchase_requests')
        .select('id, project_id, status, requester_id')
        .eq('id', id)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return NextResponse.json(
            { success: false, error: 'Purchase request not found' },
            { status: 404 }
          )
        }
        console.error('Purchase request fetch error:', fetchError)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch purchase request' },
          { status: 500 }
        )
      }

      // Check project access
      const hasProjectAccess = await verifyProjectAccess(supabase, user, existingRequest.project_id)
      if (!hasProjectAccess) {
        return NextResponse.json(
          { success: false, error: 'Access denied to this purchase request' },
          { status: 403 }
        )
      }

      // Check if user can edit this specific request
      const canEdit = await canEditRequest(user, existingRequest)
      if (!canEdit) {
        return NextResponse.json(
          { success: false, error: 'Cannot edit this purchase request due to status or permissions' },
          { status: 403 }
        )
      }

      const body = await req.json()
      
      // Validate update data
      const validationResult = validatePurchaseInput(purchaseRequestUpdateSchema, body)
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

      // If status is being changed to pending_approval, validate workflow
      if (updateData.status === 'pending_approval' && existingRequest.status === 'draft') {
        await updateApprovalWorkflowStatus(supabase, id, 'pending')
      }

      // Update purchase request
      const { data: updatedRequest, error: updateError } = await supabase
        .from('purchase_requests')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          project:projects(id, name, status),
          requester:user_profiles!requester_id(id, first_name, last_name, role),
          purchase_orders(id, po_number, status, total_amount),
          approvals:approval_workflows(id, approver_role, approval_status, created_at)
        `)
        .single()

      if (updateError) {
        console.error('Purchase request update error:', updateError)
        return NextResponse.json(
          { success: false, error: 'Failed to update purchase request' },
          { status: 500 }
        )
      }

      const response: PurchaseApiResponse<{ request: PurchaseRequest }> = {
        success: true,
        message: 'Purchase request updated successfully',
        data: {
          request: updatedRequest
        }
      }

      return NextResponse.json(response)

    } catch (error) {
      console.error('Purchase request update API error:', error)
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }
  })(request)
}

// ============================================================================
// DELETE /api/purchase/requests/[id] - Delete purchase request
// ============================================================================

export async function DELETE(
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

      // Check delete permission (only high-level roles can delete)
      if (!hasPermission(user.role, 'procurement.delete') && 
          !['purchase_director', 'general_manager', 'admin'].includes(user.role)) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions to delete purchase requests' },
          { status: 403 }
        )
      }

      const supabase = createServerClient()
      const { id } = params

      // Validate UUID format
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        return NextResponse.json(
          { success: false, error: 'Invalid request ID format' },
          { status: 400 }
        )
      }

      // Check if request exists and can be deleted
      const { data: existingRequest, error: fetchError } = await supabase
        .from('purchase_requests')
        .select('id, project_id, status, requester_id')
        .eq('id', id)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return NextResponse.json(
            { success: false, error: 'Purchase request not found' },
            { status: 404 }
          )
        }
        console.error('Purchase request fetch error:', fetchError)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch purchase request' },
          { status: 500 }
        )
      }

      // Check project access
      const hasProjectAccess = await verifyProjectAccess(supabase, user, existingRequest.project_id)
      if (!hasProjectAccess) {
        return NextResponse.json(
          { success: false, error: 'Access denied to this purchase request' },
          { status: 403 }
        )
      }

      // Check if request can be deleted (only draft or rejected requests)
      if (!['draft', 'rejected', 'cancelled'].includes(existingRequest.status)) {
        return NextResponse.json(
          { success: false, error: 'Cannot delete request with current status' },
          { status: 400 }
        )
      }

      // Check for related purchase orders
      const { data: relatedOrders } = await supabase
        .from('purchase_orders')
        .select('id')
        .eq('purchase_request_id', id)
        .limit(1)

      if (relatedOrders && relatedOrders.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Cannot delete request with existing purchase orders' },
          { status: 400 }
        )
      }

      // Delete approval workflows first (foreign key constraint)
      await supabase
        .from('approval_workflows')
        .delete()
        .eq('purchase_request_id', id)

      // Delete purchase request
      const { error: deleteError } = await supabase
        .from('purchase_requests')
        .delete()
        .eq('id', id)

      if (deleteError) {
        console.error('Purchase request deletion error:', deleteError)
        return NextResponse.json(
          { success: false, error: 'Failed to delete purchase request' },
          { status: 500 }
        )
      }

      const response: PurchaseApiResponse<{}> = {
        success: true,
        message: 'Purchase request deleted successfully'
      }

      return NextResponse.json(response)

    } catch (error) {
      console.error('Purchase request deletion API error:', error)
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

async function canEditRequest(user: any, request: any): Promise<boolean> {
  // Purchase directors and above can edit any request
  if (['purchase_director', 'general_manager', 'admin'].includes(user.role)) {
    return true
  }

  // Requesters can edit their own draft requests
  if (request.requester_id === user.id && request.status === 'draft') {
    return true
  }

  // Project managers can edit requests in their projects if not approved
  if (user.role === 'project_manager' && !['approved', 'completed'].includes(request.status)) {
    return true
  }

  return false
}

async function updateApprovalWorkflowStatus(supabase: any, requestId: string, status: string): Promise<void> {
  await supabase
    .from('approval_workflows')
    .update({ approval_status: status })
    .eq('purchase_request_id', requestId)
    .eq('approval_status', 'pending')
}