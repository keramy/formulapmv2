/**
 * Formula PM 2.0 Purchase Approvals API - Pending Approvals
 * Purchase Department Workflow Implementation
 * 
 * Handles listing pending approvals for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, getAuthenticatedUser } from '@/lib/middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'
import { 
  ApprovalWorkflow, 
  PurchaseApiResponse, 
  PurchaseListResponse 
} from '@/types/purchase'

// ============================================================================
// GET /api/purchase/approvals/pending - Get pending approvals for user
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
        { success: false, error: 'Insufficient permissions to view approvals' },
        { status: 403 }
      )
    }

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const urgencyFilter = url.searchParams.get('urgency')
    const projectFilter = url.searchParams.get('project_id')

    const supabase = createServerClient()

    // Build query for pending approvals
    let query = supabase
      .from('approval_workflows')
      .select(`
        *,
        purchase_request:purchase_requests(
          id, request_number, item_description, quantity, unit_of_measure,
          estimated_cost, required_date, urgency_level, justification, created_at,
          project:projects(id, name, status, budget),
          requester:user_profiles!requester_id(id, first_name, last_name, role, email)
        ),
        approver:user_profiles!approver_id(id, first_name, last_name, role)
      `, { count: 'exact' })
      .eq('approval_status', 'pending')

    // Filter by user's role and responsibilities
    if (user.role === 'project_manager') {
      // Project managers see approvals for projects they manage
      const { data: managedProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('project_manager_id', user.id)
      
      const projectIds = managedProjects?.map(p => p.id) || []
      
      if (projectIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            approvals: []
          },
          pagination: {
            page: 1,
            limit,
            total: 0,
            has_more: false
          }
        } as PurchaseApiResponse<PurchaseListResponse<ApprovalWorkflow>>)
      }

      query = query
        .eq('approver_role', 'project_manager')
        .in('purchase_request.project_id', projectIds)
    } else if (['purchase_director', 'purchase_specialist'].includes(user.role)) {
      // Purchase department sees all pending approvals for their role
      query = query.eq('approver_role', user.role)
    } else if (['general_manager', 'admin'].includes(user.role)) {
      // Management sees all pending approvals
      // No additional filtering needed
    } else {
      // Other roles can't see pending approvals
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to view pending approvals' },
        { status: 403 }
      )
    }

    // Apply additional filters
    if (urgencyFilter) {
      query = query.eq('purchase_request.urgency_level', urgencyFilter)
    }

    if (projectFilter) {
      query = query.eq('purchase_request.project_id', projectFilter)
    }

    // Sort by urgency and date
    query = query.order('created_at', { ascending: true })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: approvals, error, count } = await query

    if (error) {
      console.error('Pending approvals fetch error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch pending approvals' },
        { status: 500 }
      )
    }

    // Enhance approvals with additional metadata
    const enhancedApprovals = approvals?.map(approval => {
      const request = approval.purchase_request
      const daysWaiting = Math.floor(
        (new Date().getTime() - new Date(approval.created_at).getTime()) / (1000 * 60 * 60 * 24)
      )
      
      const daysUntilRequired = request?.required_date 
        ? Math.floor(
            (new Date(request.required_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          )
        : null

      return {
        ...approval,
        metadata: {
          days_waiting: daysWaiting,
          days_until_required: daysUntilRequired,
          is_urgent: request?.urgency_level === 'emergency' || 
                    request?.urgency_level === 'high' || 
                    (daysUntilRequired !== null && daysUntilRequired <= 3),
          is_overdue: daysUntilRequired !== null && daysUntilRequired < 0
        }
      }
    }) || []

    // Sort by priority (urgent/overdue first)
    enhancedApprovals.sort((a, b) => {
      // Emergency requests first
      if (a.purchase_request.urgency_level === 'emergency' && b.purchase_request.urgency_level !== 'emergency') return -1
      if (b.purchase_request.urgency_level === 'emergency' && a.purchase_request.urgency_level !== 'emergency') return 1
      
      // Overdue requests next
      if (a.metadata.is_overdue && !b.metadata.is_overdue) return -1
      if (b.metadata.is_overdue && !a.metadata.is_overdue) return 1
      
      // Then by urgency level
      const urgencyOrder = { emergency: 4, high: 3, normal: 2, low: 1 }
      const aUrgency = urgencyOrder[a.purchase_request.urgency_level] || 0
      const bUrgency = urgencyOrder[b.purchase_request.urgency_level] || 0
      if (aUrgency !== bUrgency) return bUrgency - aUrgency
      
      // Finally by days waiting (oldest first)
      return b.metadata.days_waiting - a.metadata.days_waiting
    })

    const response: PurchaseApiResponse<PurchaseListResponse<ApprovalWorkflow>> = {
      success: true,
      data: {
        approvals: enhancedApprovals
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
    console.error('Pending approvals API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})