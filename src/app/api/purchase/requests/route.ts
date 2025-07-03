/**
 * Formula PM 2.0 Purchase Requests API - Main Route
 * Purchase Department Workflow Implementation
 * 
 * Handles purchase request listing and creation with role-based access control
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, getAuthenticatedUser } from '@/lib/middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'
import { 
  purchaseRequestCreateSchema,
  purchaseRequestListParamsSchema,
  validatePurchaseInput,
  validatePurchaseListParams 
} from '@/lib/validation/purchase'
import { 
  PurchaseRequest, 
  PurchaseApiResponse, 
  PurchaseListResponse,
  PurchaseStatistics 
} from '@/types/purchase'

// ============================================================================
// GET /api/purchase/requests - List purchase requests with filtering and pagination
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
        { success: false, error: 'Insufficient permissions to view purchase requests' },
        { status: 403 }
      )
    }

    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    
    // Validate parameters
    const validationResult = validatePurchaseListParams(purchaseRequestListParamsSchema, queryParams)
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

    // Build query based on user permissions
    let query = supabase
      .from('purchase_requests')
      .select(`
        *,
        project:projects(id, name, status),
        requester:user_profiles!requester_id(id, first_name, last_name, role),
        purchase_orders(id, po_number, status, total_amount),
        approvals:approval_workflows(id, approver_role, approval_status, created_at)
      `, { count: 'exact' })

    // Apply role-based filtering
    if (!hasPermission(user.role, 'procurement.view_all')) {
      const accessibleProjects = await getAccessibleProjects(supabase, user)
      if (accessibleProjects.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            requests: [],
            statistics: getEmptyStatistics()
          },
          pagination: {
            page: 1,
            limit: params.limit,
            total: 0,
            has_more: false
          }
        } as PurchaseApiResponse<PurchaseListResponse<PurchaseRequest>>)
      }
      query = query.in('project_id', accessibleProjects)
    }

    // Apply filters
    if (params.project_id) {
      query = query.eq('project_id', params.project_id)
    }

    if (params.status?.length) {
      query = query.in('status', params.status)
    }

    if (params.urgency_level?.length) {
      query = query.in('urgency_level', params.urgency_level)
    }

    if (params.requester_id) {
      query = query.eq('requester_id', params.requester_id)
    }

    if (params.date_start) {
      query = query.gte('created_at', params.date_start)
    }

    if (params.date_end) {
      query = query.lte('created_at', params.date_end)
    }

    if (params.cost_min !== undefined) {
      query = query.gte('estimated_cost', params.cost_min)
    }

    if (params.cost_max !== undefined) {
      query = query.lte('estimated_cost', params.cost_max)
    }

    if (params.search) {
      query = query.or(`item_description.ilike.%${params.search}%,request_number.ilike.%${params.search}%,justification.ilike.%${params.search}%`)
    }

    // Apply sorting
    query = query.order(params.sort_field, { ascending: params.sort_direction === 'asc' })

    // Apply pagination
    const from = (params.page - 1) * params.limit
    const to = from + params.limit - 1
    query = query.range(from, to)

    const { data: requests, error, count } = await query

    if (error) {
      console.error('Purchase requests fetch error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch purchase requests' },
        { status: 500 }
      )
    }

    // Calculate statistics
    const statistics = await calculatePurchaseStatistics(supabase, params.project_id)

    const response: PurchaseApiResponse<PurchaseListResponse<PurchaseRequest>> = {
      success: true,
      data: {
        requests: requests || [],
        statistics
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
    console.error('Purchase requests API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// ============================================================================
// POST /api/purchase/requests - Create new purchase request
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

    // Check create permission
    if (!hasPermission(user.role, 'procurement.create')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to create purchase requests' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validate request data
    const validationResult = validatePurchaseInput(purchaseRequestCreateSchema, body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: validationResult.error.errors.map(e => e.message)
        },
        { status: 400 }
      )
    }

    const requestData = validationResult.data
    const supabase = createServerClient()

    // Verify user has access to the project
    const hasProjectAccess = await verifyProjectAccess(supabase, user, requestData.project_id)
    if (!hasProjectAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this project' },
        { status: 403 }
      )
    }

    // Generate request number
    const requestNumber = await generateRequestNumber(supabase, requestData.project_id)

    // Create purchase request
    const purchaseRequestData = {
      ...requestData,
      request_number: requestNumber,
      requester_id: user.id,
      status: 'draft' as const
    }

    const { data: purchaseRequest, error: insertError } = await supabase
      .from('purchase_requests')
      .insert(purchaseRequestData)
      .select(`
        *,
        project:projects(id, name, status),
        requester:user_profiles!requester_id(id, first_name, last_name, role)
      `)
      .single()

    if (insertError) {
      console.error('Purchase request creation error:', insertError)
      return NextResponse.json(
        { success: false, error: 'Failed to create purchase request' },
        { status: 500 }
      )
    }

    // Initialize approval workflow if not emergency
    if (requestData.urgency_level !== 'emergency') {
      await initializeApprovalWorkflow(supabase, purchaseRequest.id, user.role)
    }

    const response: PurchaseApiResponse<{ request: PurchaseRequest }> = {
      success: true,
      message: 'Purchase request created successfully',
      data: {
        request: purchaseRequest
      }
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Purchase request creation API error:', error)
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

async function generateRequestNumber(supabase: any, projectId: string): Promise<string> {
  const { data: project } = await supabase
    .from('projects')
    .select('name')
    .eq('id', projectId)
    .single()

  const projectCode = project?.name?.substring(0, 3).toUpperCase() || 'PRJ'
  const year = new Date().getFullYear().toString().slice(-2)
  
  // Get next sequence number
  const { data: lastRequest } = await supabase
    .from('purchase_requests')
    .select('request_number')
    .eq('project_id', projectId)
    .like('request_number', `${projectCode}-${year}-%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let sequence = 1
  if (lastRequest?.request_number) {
    const lastSequence = parseInt(lastRequest.request_number.split('-')[2] || '0')
    sequence = lastSequence + 1
  }

  return `${projectCode}-${year}-${sequence.toString().padStart(4, '0')}`
}

async function initializeApprovalWorkflow(supabase: any, requestId: string, requesterRole: string): Promise<void> {
  const approvalChain = getApprovalChain(requesterRole)
  
  const approvals = approvalChain.map(role => ({
    purchase_request_id: requestId,
    approver_role: role,
    approval_status: 'pending' as const
  }))

  await supabase
    .from('approval_workflows')
    .insert(approvals)
}

function getApprovalChain(requesterRole: string): string[] {
  switch (requesterRole) {
    case 'field_worker':
    case 'technical_engineer':
      return ['project_manager', 'purchase_director']
    case 'project_manager':
      return ['purchase_director']
    case 'purchase_specialist':
      return ['purchase_director']
    default:
      return ['purchase_director']
  }
}

async function calculatePurchaseStatistics(supabase: any, projectId?: string): Promise<PurchaseStatistics> {
  let query = supabase.from('purchase_requests').select('*')
  
  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { data: requests } = await query

  if (!requests) {
    return getEmptyStatistics()
  }

  const stats: PurchaseStatistics = {
    total_requests: requests.length,
    pending_approvals: 0,
    active_orders: 0,
    pending_deliveries: 0,
    total_spent: 0,
    average_approval_time: 0,
    by_status: {
      draft: 0,
      pending_approval: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0
    },
    by_urgency: {
      low: 0,
      normal: 0,
      high: 0,
      emergency: 0
    }
  }

  // Calculate statistics from requests
  requests.forEach((request: any) => {
    stats.by_status[request.status]++
    stats.by_urgency[request.urgency_level]++
    
    if (request.status === 'pending_approval') {
      stats.pending_approvals++
    }
  })

  // Get order statistics
  const { data: orders } = await supabase
    .from('purchase_orders')
    .select('status, total_amount')
    .in('status', ['sent', 'confirmed', 'delivered'])

  if (orders) {
    stats.active_orders = orders.length
    stats.total_spent = orders.reduce((sum: number, order: any) => sum + order.total_amount, 0)
  }

  // Get delivery statistics
  const { data: deliveries } = await supabase
    .from('delivery_confirmations')
    .select('status')
    .eq('status', 'pending')

  if (deliveries) {
    stats.pending_deliveries = deliveries.length
  }

  return stats
}

function getEmptyStatistics(): PurchaseStatistics {
  return {
    total_requests: 0,
    pending_approvals: 0,
    active_orders: 0,
    pending_deliveries: 0,
    total_spent: 0,
    average_approval_time: 0,
    by_status: {
      draft: 0,
      pending_approval: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0
    },
    by_urgency: {
      low: 0,
      normal: 0,
      high: 0,
      emergency: 0
    }
  }
}