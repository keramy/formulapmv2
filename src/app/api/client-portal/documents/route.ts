/**
 * Client Portal Documents - Main Documents List
 * Client accessible documents with filtering and permissions
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { 
  withClientAuth,
  getClientUser,
  logClientActivity
} from '@/lib/middleware/client-auth'
import { 
  clientDocumentListParamsSchema,
  validateClientPortalQueryParams
} from '@/lib/validation/client-portal'
import { 
  ClientApiResponse, 
  ClientListResponse
} from '@/types/client-portal'

// ============================================================================
// GET /api/client-portal/documents - Get Client's Accessible Documents
// ============================================================================

export const GET = withClientAuth(async (request: NextRequest) => {
  try {
    const clientUser = getClientUser(request)
    if (!clientUser) {
      return NextResponse.json(
        { success: false, error: 'Client user not found in request' } as ClientApiResponse<null>,
        { status: 401 }
      )
    }

    // Parse and validate query parameters
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())
    
    const validationResult = validateClientPortalQueryParams(clientDocumentListParamsSchema, queryParams)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid query parameters',
          details: validationResult.error.errors.map(e => e.message)
        } as ClientApiResponse<null>,
        { status: 400 }
      )
    }

    const params = validationResult.data
    const supabase = createServerClient()

    // Build query for client's accessible documents
    let query = supabase
      .from('client_document_access')
      .select(`
        access_type, can_download, can_comment, can_approve, watermarked,
        first_accessed, last_accessed, view_count, download_count,
        granted_at,
        document:documents(
          id, name, description, file_type, file_size, file_path,
          status, version, revision_letter, confidentiality_level,
          uploaded_at, updated_at, checksum,
          project:projects(id, name, status),
          document_category:document_categories(id, name, description),
          uploaded_by:user_profiles(first_name, last_name, role)
        )
      `, { count: 'exact' })
      .eq('client_user_id', clientUser.id)

    // Apply filters
    if (params.project_id) {
      query = query.eq('document.project_id', params.project_id)
    }

    if (params.document_type?.length) {
      query = query.in('document.file_type', params.document_type)
    }

    if (params.status?.length) {
      query = query.in('document.status', params.status)
    }

    if (params.requires_approval !== undefined) {
      query = query.eq('can_approve', params.requires_approval)
    }

    if (params.date_start) {
      query = query.gte('document.uploaded_at', params.date_start)
    }

    if (params.date_end) {
      query = query.lte('document.uploaded_at', params.date_end)
    }

    if (params.search) {
      query = query.or(`document.name.ilike.%${params.search}%,document.description.ilike.%${params.search}%`)
    }

    // Apply sorting
    const sortField = params.sort_field === 'created_at' ? 'document.uploaded_at' : `document.${params.sort_field}`
    query = query.order(sortField, { ascending: params.sort_direction === 'asc' })

    // Apply pagination
    const from = (params.page - 1) * params.limit
    const to = from + params.limit - 1
    query = query.range(from, to)

    const { data: documentAccess, error, count } = await query

    if (error) {
      console.error('Client documents fetch error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch documents' } as ClientApiResponse<null>,
        { status: 500 }
      )
    }

    // Transform documents for client consumption
    const documents = (documentAccess || []).map((access: any) => {
      const doc = access.document
      
      return {
        id: doc.id,
        name: doc.name,
        description: doc.description,
        file_type: doc.file_type,
        file_size: doc.file_size,
        status: doc.status,
        version: doc.version,
        revision_letter: doc.revision_letter,
        confidentiality_level: doc.confidentiality_level,
        uploaded_at: doc.uploaded_at,
        updated_at: doc.updated_at,
        
        // Project information
        project: doc.project ? {
          id: doc.project.id,
          name: doc.project.name,
          status: doc.project.status
        } : null,
        
        // Document category
        category: doc.document_category ? {
          id: doc.document_category.id,
          name: doc.document_category.name,
          description: doc.document_category.description
        } : null,
        
        // Upload information
        uploaded_by: doc.uploaded_by ? 
          `${doc.uploaded_by.first_name} ${doc.uploaded_by.last_name} (${doc.uploaded_by.role})` : 
          'System',
        
        // Client-specific access information
        client_access: {
          access_type: access.access_type,
          permissions: {
            can_download: access.can_download,
            can_comment: access.can_comment,
            can_approve: access.can_approve
          },
          watermarked: access.watermarked,
          access_history: {
            first_accessed: access.first_accessed,
            last_accessed: access.last_accessed,
            view_count: access.view_count,
            download_count: access.download_count
          },
          granted_at: access.granted_at
        },
        
        // Approval status (if client can approve)
        approval_status: access.can_approve ? await getDocumentApprovalStatus(
          supabase, 
          doc.id, 
          clientUser.id
        ) : null
      }
    })

    // Get document statistics
    const documentStats = await getDocumentStatistics(supabase, clientUser.id, params)

    // Log documents access
    await logClientActivity(clientUser.id, 'document_view', {
      action_taken: 'Documents list accessed',
      description: `Client accessed documents list with ${documents.length} documents`,
      ip_address: request.ip,
      user_agent: request.headers.get('user-agent') || undefined,
      metadata: {
        documents_accessed: true,
        documents_count: documents.length,
        page: params.page,
        limit: params.limit,
        filters_applied: {
          project_id: params.project_id,
          document_type: params.document_type,
          status: params.status,
          requires_approval: params.requires_approval,
          search: params.search
        }
      }
    })

    const response: ClientListResponse<any> = {
      items: documents,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: count || 0,
        has_more: params.page * params.limit < (count || 0)
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...response,
          statistics: documentStats
        }
      } as ClientApiResponse<ClientListResponse<any> & { statistics: any }>,
      { status: 200 }
    )

  } catch (error) {
    console.error('Client documents error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch documents' } as ClientApiResponse<null>,
      { status: 500 }
    )
  }
})

// ============================================================================
// Helper Functions
// ============================================================================

async function getDocumentApprovalStatus(supabase: any, documentId: string, clientUserId: string) {
  const { data: approval, error } = await supabase
    .from('client_document_approvals')
    .select('approval_decision, approval_date, approval_comments, is_final')
    .eq('document_id', documentId)
    .eq('client_user_id', clientUserId)
    .eq('is_final', true)
    .order('approval_date', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Document approval status fetch error:', error)
    return null
  }

  if (!approval) {
    return {
      status: 'pending',
      decision: null,
      date: null,
      comments: null
    }
  }

  return {
    status: 'submitted',
    decision: approval.approval_decision,
    date: approval.approval_date,
    comments: approval.approval_comments
  }
}

async function getDocumentStatistics(supabase: any, clientUserId: string, params: any) {
  // Get document counts by type
  let typeQuery = supabase
    .from('client_document_access')
    .select('document:documents(file_type)')
    .eq('client_user_id', clientUserId)

  if (params.project_id) {
    typeQuery = typeQuery.eq('document.project_id', params.project_id)
  }

  const { data: documentTypes } = await typeQuery

  // Get approval statistics
  const { data: approvalStats } = await supabase
    .from('client_document_access')
    .select(`
      can_approve,
      document:documents(
        id,
        client_document_approvals!inner(approval_decision, is_final)
      )
    `)
    .eq('client_user_id', clientUserId)
    .eq('can_approve', true)

  // Get recent activity
  const { count: recentViewsCount } = await supabase
    .from('client_activity_log')
    .select('id', { count: 'exact' })
    .eq('client_user_id', clientUserId)
    .eq('activity_type', 'document_view')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  // Process statistics
  const byType = documentTypes?.reduce((acc: any, item: any) => {
    const type = item.document?.file_type || 'unknown'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {}) || {}

  const approvalStatistics = {
    pending: 0,
    approved: 0,
    rejected: 0,
    requires_revision: 0
  }

  approvalStats?.forEach((item: any) => {
    if (item.can_approve && item.document?.client_document_approvals?.length > 0) {
      const latestApproval = item.document.client_document_approvals
        .filter((a: any) => a.is_final)
        .sort((a: any, b: any) => new Date(b.approval_date).getTime() - new Date(a.approval_date).getTime())[0]
      
      if (latestApproval) {
        approvalStatistics[latestApproval.approval_decision as keyof typeof approvalStatistics]++
      } else {
        approvalStatistics.pending++
      }
    }
  })

  return {
    total_documents: documentTypes?.length || 0,
    by_type: byType,
    approvals: approvalStatistics,
    recent_views: recentViewsCount || 0
  }
}