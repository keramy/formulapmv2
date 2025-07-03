/**
 * Formula PM 2.0 Purchase Approvals API - Approval Actions
 * Purchase Department Workflow Implementation
 * 
 * Handles approval/rejection of purchase requests
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, getAuthenticatedUser } from '@/lib/middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'
import { 
  approvalActionSchema,
  validatePurchaseInput 
} from '@/lib/validation/purchase'
import { 
  ApprovalWorkflow, 
  PurchaseApiResponse 
} from '@/types/purchase'

// ============================================================================
// POST /api/purchase/approvals/[id] - Approve or reject purchase request
// ============================================================================

export async function POST(
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

      // Check approval permission
      if (!hasPermission(user.role, 'procurement.approve') &&
          !['project_manager', 'purchase_director', 'general_manager', 'admin'].includes(user.role)) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions to approve purchase requests' },
          { status: 403 }
        )
      }

      const supabase = createServerClient()
      const { id: approvalId } = params

      // Validate UUID format
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(approvalId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid approval ID format' },
          { status: 400 }
        )
      }

      const body = await req.json()
      
      // Validate approval action data
      const validationResult = validatePurchaseInput(approvalActionSchema, body)
      if (!validationResult.success) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid approval action data',
            details: validationResult.error.errors.map(e => e.message)
          },
          { status: 400 }
        )
      }

      const actionData = validationResult.data

      // Get approval workflow details
      const { data: approval, error: approvalError } = await supabase
        .from('approval_workflows')
        .select(`
          *,
          purchase_request:purchase_requests(
            id, status, urgency_level, project_id,
            project:projects(id, name, project_manager_id),
            requester:user_profiles!requester_id(id, first_name, last_name, email)
          )
        `)
        .eq('id', approvalId)
        .single()

      if (approvalError || !approval) {
        return NextResponse.json(
          { success: false, error: 'Approval workflow not found' },
          { status: 404 }
        )
      }

      // Check if approval is still pending
      if (approval.approval_status !== 'pending') {
        return NextResponse.json(
          { success: false, error: 'This approval has already been processed' },
          { status: 400 }
        )
      }

      // Verify user has authority to approve this request
      const canApprove = await verifyApprovalAuthority(supabase, user, approval)
      if (!canApprove) {
        return NextResponse.json(
          { success: false, error: 'You do not have authority to approve this request' },
          { status: 403 }
        )
      }

      // Process the approval/rejection
      const now = new Date().toISOString()
      
      // Update approval workflow
      const { data: updatedApproval, error: updateError } = await supabase
        .from('approval_workflows')
        .update({
          approval_status: actionData.approval_status,
          approver_id: user.id,
          approval_date: now,
          comments: actionData.comments || null
        })
        .eq('id', approvalId)
        .select(`
          *,
          purchase_request:purchase_requests(
            id, request_number, status,
            project:projects(id, name),
            requester:user_profiles!requester_id(id, first_name, last_name, role)
          ),
          approver:user_profiles!approver_id(id, first_name, last_name, role)
        `)
        .single()

      if (updateError) {
        console.error('Approval update error:', updateError)
        return NextResponse.json(
          { success: false, error: 'Failed to process approval' },
          { status: 500 }
        )
      }

      // Handle approval workflow logic
      if (actionData.approval_status === 'approved') {
        await handleApproval(supabase, approval.purchase_request_id, approval.approver_role)
      } else if (actionData.approval_status === 'rejected') {
        await handleRejection(supabase, approval.purchase_request_id)
      }

      // Send notifications
      await sendApprovalNotifications(supabase, updatedApproval, actionData.approval_status)

      const response: PurchaseApiResponse<{ approval: ApprovalWorkflow }> = {
        success: true,
        message: `Purchase request ${actionData.approval_status} successfully`,
        data: {
          approval: updatedApproval
        }
      }

      return NextResponse.json(response)

    } catch (error) {
      console.error('Approval action API error:', error)
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

async function verifyApprovalAuthority(supabase: any, user: any, approval: any): Promise<boolean> {
  const requiredRole = approval.approver_role
  const request = approval.purchase_request

  // Check if user has the required role
  if (user.role !== requiredRole) {
    // Allow higher-level roles to approve lower-level requests
    const roleHierarchy = {
      'project_manager': 1,
      'purchase_specialist': 2,
      'purchase_director': 3,
      'general_manager': 4,
      'admin': 5
    }

    const userLevel = roleHierarchy[user.role] || 0
    const requiredLevel = roleHierarchy[requiredRole] || 0

    if (userLevel <= requiredLevel) {
      return false
    }
  }

  // For project managers, verify they manage the project
  if (requiredRole === 'project_manager') {
    if (request.project.project_manager_id !== user.id) {
      return false
    }
  }

  // For purchase roles, check department access
  if (['purchase_specialist', 'purchase_director'].includes(requiredRole)) {
    if (!['purchase_specialist', 'purchase_director', 'general_manager', 'admin'].includes(user.role)) {
      return false
    }
  }

  return true
}

async function handleApproval(supabase: any, requestId: string, approverRole: string): Promise<void> {
  // Check if this was the final approval needed
  const { data: pendingApprovals } = await supabase
    .from('approval_workflows')
    .select('id')
    .eq('purchase_request_id', requestId)
    .eq('approval_status', 'pending')

  // If no more pending approvals, mark request as approved
  if (!pendingApprovals || pendingApprovals.length === 0) {
    await supabase
      .from('purchase_requests')
      .update({ 
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
  } else {
    // Move to next approval level if needed
    await supabase
      .from('purchase_requests')
      .update({ 
        status: 'pending_approval',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
  }
}

async function handleRejection(supabase: any, requestId: string): Promise<void> {
  // Mark request as rejected and cancel all other pending approvals
  await supabase
    .from('purchase_requests')
    .update({ 
      status: 'rejected',
      updated_at: new Date().toISOString()
    })
    .eq('id', requestId)

  // Cancel other pending approvals for this request
  await supabase
    .from('approval_workflows')
    .update({ 
      approval_status: 'rejected',
      approval_date: new Date().toISOString()
    })
    .eq('purchase_request_id', requestId)
    .eq('approval_status', 'pending')
}

async function sendApprovalNotifications(
  supabase: any, 
  approval: any, 
  status: string
): Promise<void> {
  try {
    const request = approval.purchase_request
    const requester = request.requester
    const approver = approval.approver

    // Log notification (in a real implementation, this would send emails/push notifications)
    console.log('Approval notification:', {
      type: `request_${status}`,
      to: requester.email,
      request_number: request.request_number,
      approver_name: `${approver.first_name} ${approver.last_name}`,
      project_name: request.project.name,
      status: status
    })

    // TODO: Implement actual notification service
    // await notificationService.send({
    //   to: requester.email,
    //   template: `purchase_request_${status}`,
    //   data: {
    //     request_number: request.request_number,
    //     approver_name: `${approver.first_name} ${approver.last_name}`,
    //     project_name: request.project.name,
    //     comments: approval.comments
    //   }
    // })

    // If approved and no more approvals needed, notify purchase department
    if (status === 'approved') {
      const { data: pendingApprovals } = await supabase
        .from('approval_workflows')
        .select('id')
        .eq('purchase_request_id', request.id)
        .eq('approval_status', 'pending')

      if (!pendingApprovals || pendingApprovals.length === 0) {
        console.log('Final approval notification to purchase department:', {
          request_number: request.request_number,
          project_name: request.project.name
        })
      }
    }

  } catch (error) {
    console.error('Failed to send approval notifications:', error)
    // Don't fail the approval process if notifications fail
  }
}