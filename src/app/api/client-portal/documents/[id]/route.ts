/**
 * Client Portal Documents - Document Details
 * Individual document access with view tracking
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { 
  withClientAuth,
  getClientUser,
  checkClientDocumentAccess,
  logClientActivity
} from '@/lib/middleware/client-auth'
import { ClientApiResponse } from '@/types/client-portal'

// ============================================================================
// GET /api/client-portal/documents/[id] - Get Document Details
// ============================================================================

export const GET = withClientAuth(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const clientUser = getClientUser(request)
    if (!clientUser) {
      return NextResponse.json(
        { success: false, error: 'Client user not found in request' } as ClientApiResponse<null>,
        { status: 401 }
      )
    }

    const documentId = params.id

    // Verify client has access to this document
    const hasAccess = await checkClientDocumentAccess(clientUser.id, documentId)
    if (!hasAccess) {
      await logClientActivity(clientUser.id, 'document_view', {
        action_taken: 'Unauthorized document access attempt',
        description: `Client attempted to access document ${documentId} without permission`,
        resource_type: 'document',
        resource_id: documentId,
        ip_address: request.ip,
        user_agent: request.headers.get('user-agent') || undefined,
        metadata: {
          unauthorized_access: true,
          document_id: documentId
        }
      })

      return NextResponse.json(
        { success: false, error: 'Access denied to this document' } as ClientApiResponse<null>,
        { status: 403 }
      )
    }

    const supabase = createServerClient()

    // Get comprehensive document details
    const { data: documentAccess, error } = await supabase
      .from('client_document_access')
      .select(`
        access_type, can_download, can_comment, can_approve, watermarked,
        first_accessed, last_accessed, view_count, download_count,
        granted_at, granted_by,
        document:documents(
          id, name, description, file_type, file_size, file_path,
          status, version, revision_letter, confidentiality_level,
          uploaded_at, updated_at, checksum, metadata,
          project:projects(id, name, status),
          document_category:document_categories(id, name, description),
          uploaded_by:user_profiles(first_name, last_name, role),
          document_versions(
            id, version_number, revision_letter, changes_description,
            created_at, created_by:user_profiles(first_name, last_name)
          )
        ),
        granted_by_user:user_profiles(first_name, last_name, role)
      `)
      .eq('client_user_id', clientUser.id)
      .eq('document_id', documentId)
      .single()

    if (error || !documentAccess) {
      console.error('Document details fetch error:', error)
      return NextResponse.json(
        { success: false, error: 'Document not found or access denied' } as ClientApiResponse<null>,
        { status: 404 }
      )
    }

    const document = documentAccess.document

    // Get additional document data
    const [commentsData, approvalData, relatedDocuments] = await Promise.all([
      getDocumentComments(supabase, documentId, clientUser.id),
      getDocumentApprovals(supabase, documentId, clientUser.id),
      getRelatedDocuments(supabase, document.project.id, documentId, clientUser.id)
    ])

    // Update view tracking
    await updateDocumentViewTracking(supabase, clientUser.id, documentId)

    // Transform document data for client consumption
    const documentDetails = {
      id: document.id,
      name: document.name,
      description: document.description,
      file_type: document.file_type,
      file_size: document.file_size,
      status: document.status,
      version: document.version,
      revision_letter: document.revision_letter,
      confidentiality_level: document.confidentiality_level,
      uploaded_at: document.uploaded_at,
      updated_at: document.updated_at,
      checksum: document.checksum,
      metadata: document.metadata || {},
      
      // Project information
      project: {
        id: document.project.id,
        name: document.project.name,
        status: document.project.status
      },
      
      // Document category
      category: document.document_category ? {
        id: document.document_category.id,
        name: document.document_category.name,
        description: document.document_category.description
      } : null,
      
      // Upload information
      uploaded_by: document.uploaded_by ? 
        `${document.uploaded_by.first_name} ${document.uploaded_by.last_name} (${document.uploaded_by.role})` : 
        'System',
      
      // Version history
      versions: document.document_versions?.map((version: any) => ({
        id: version.id,
        version_number: version.version_number,
        revision_letter: version.revision_letter,
        changes_description: version.changes_description,
        created_at: version.created_at,
        created_by: version.created_by ? 
          `${version.created_by.first_name} ${version.created_by.last_name}` : 
          'System'
      })) || [],
      
      // Client-specific access information
      client_access: {
        access_type: documentAccess.access_type,
        permissions: {
          can_download: documentAccess.can_download,
          can_comment: documentAccess.can_comment,
          can_approve: documentAccess.can_approve
        },
        watermarked: documentAccess.watermarked,
        access_history: {
          first_accessed: documentAccess.first_accessed,
          last_accessed: documentAccess.last_accessed,
          view_count: documentAccess.view_count + 1, // Include current view
          download_count: documentAccess.download_count
        },
        granted_at: documentAccess.granted_at,
        granted_by: documentAccess.granted_by_user ? 
          `${documentAccess.granted_by_user.first_name} ${documentAccess.granted_by_user.last_name} (${documentAccess.granted_by_user.role})` : 
          'System'
      },
      
      // Comments (if client can comment)
      comments: documentAccess.can_comment ? commentsData : null,
      
      // Approval information (if client can approve)
      approval: documentAccess.can_approve ? approvalData : null,
      
      // Related documents
      related_documents: relatedDocuments
    }

    // Log document access
    await logClientActivity(clientUser.id, 'document_view', {
      action_taken: 'Document details accessed',
      description: `Client accessed document: ${document.name}`,
      resource_type: 'document',
      resource_id: documentId,
      project_id: document.project.id,
      ip_address: request.ip,
      user_agent: request.headers.get('user-agent') || undefined,
      metadata: {
        document_accessed: true,
        document_name: document.name,
        document_type: document.file_type,
        access_type: documentAccess.access_type,
        view_count: documentAccess.view_count + 1
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: { document: documentDetails }
      } as ClientApiResponse<{ document: any }>,
      { status: 200 }
    )

  } catch (error) {
    console.error('Document details error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch document details' } as ClientApiResponse<null>,
      { status: 500 }
    )
  }
})

// ============================================================================
// Helper Functions
// ============================================================================

async function updateDocumentViewTracking(supabase: any, clientUserId: string, documentId: string) {
  try {
    const now = new Date().toISOString()
    
    // Update view count and last accessed time
    await supabase
      .from('client_document_access')
      .update({
        last_accessed: now,
        view_count: supabase.rpc('increment', { x: 1 })
      })
      .eq('client_user_id', clientUserId)
      .eq('document_id', documentId)

    // Set first_accessed if it's null
    await supabase
      .from('client_document_access')
      .update({ first_accessed: now })
      .eq('client_user_id', clientUserId)
      .eq('document_id', documentId)
      .is('first_accessed', null)

  } catch (error) {
    console.error('Failed to update document view tracking:', error)
    // Don't throw error as this is not critical for the main operation
  }
}

async function getDocumentComments(supabase: any, documentId: string, clientUserId: string) {
  const { data: comments, error } = await supabase
    .from('client_document_comments')
    .select(`
      id, comment_text, comment_type, priority, status,
      page_number, x_coordinate, y_coordinate, markup_data,
      created_at, updated_at, resolved_at,
      parent_comment_id,
      client_user:client_users(
        user_profile:user_profiles(first_name, last_name)
      ),
      resolved_by:user_profiles(first_name, last_name, role)
    `)
    .eq('document_id', documentId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Document comments fetch error:', error)
    return []
  }

  return (comments || []).map((comment: any) => ({
    id: comment.id,
    text: comment.comment_text,
    type: comment.comment_type,
    priority: comment.priority,
    status: comment.status,
    position: comment.page_number ? {
      page: comment.page_number,
      x: comment.x_coordinate,
      y: comment.y_coordinate
    } : null,
    markup_data: comment.markup_data,
    created_at: comment.created_at,
    updated_at: comment.updated_at,
    resolved_at: comment.resolved_at,
    parent_comment_id: comment.parent_comment_id,
    author: comment.client_user?.user_profile ? 
      `${comment.client_user.user_profile.first_name} ${comment.client_user.user_profile.last_name}` : 
      'Unknown',
    resolved_by: comment.resolved_by ? 
      `${comment.resolved_by.first_name} ${comment.resolved_by.last_name} (${comment.resolved_by.role})` : 
      null,
    is_own_comment: comment.client_user_id === clientUserId
  }))
}

async function getDocumentApprovals(supabase: any, documentId: string, clientUserId: string) {
  const { data: approvals, error } = await supabase
    .from('client_document_approvals')
    .select(`
      id, approval_decision, approval_date, approval_comments,
      approval_conditions, document_version, revision_letter,
      is_final, superseded_by, ip_address
    `)
    .eq('document_id', documentId)
    .eq('client_user_id', clientUserId)
    .order('approval_date', { ascending: false })

  if (error) {
    console.error('Document approvals fetch error:', error)
    return null
  }

  const latestApproval = approvals?.[0]
  
  return {
    history: approvals || [],
    current_status: latestApproval ? {
      decision: latestApproval.approval_decision,
      date: latestApproval.approval_date,
      comments: latestApproval.approval_comments,
      conditions: latestApproval.approval_conditions || [],
      document_version: latestApproval.document_version,
      revision_letter: latestApproval.revision_letter,
      is_final: latestApproval.is_final
    } : {
      decision: null,
      status: 'pending'
    }
  }
}

async function getRelatedDocuments(supabase: any, projectId: string, currentDocumentId: string, clientUserId: string) {
  const { data: relatedDocs, error } = await supabase
    .from('client_document_access')
    .select(`
      document:documents(
        id, name, file_type, status, version,
        uploaded_at, confidentiality_level
      )
    `)
    .eq('client_user_id', clientUserId)
    .eq('document.project_id', projectId)
    .neq('document.id', currentDocumentId)
    .order('document.uploaded_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Related documents fetch error:', error)
    return []
  }

  return (relatedDocs || []).map((item: any) => ({
    id: item.document.id,
    name: item.document.name,
    file_type: item.document.file_type,
    status: item.document.status,
    version: item.document.version,
    uploaded_at: item.document.uploaded_at,
    confidentiality_level: item.document.confidentiality_level
  }))
}