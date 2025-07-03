/**
 * Client Portal Projects - Project Details
 * Detailed project information for client access
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { 
  withClientAuth,
  getClientUser,
  checkClientProjectAccess,
  logClientActivity
} from '@/lib/middleware/client-auth'
import { 
  ClientApiResponse,
  ClientProjectDetails
} from '@/types/client-portal'

// ============================================================================
// GET /api/client-portal/projects/[id] - Get Project Details
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

    const projectId = params.id

    // Verify client has access to this project
    const hasAccess = await checkClientProjectAccess(clientUser.id, projectId)
    if (!hasAccess) {
      await logClientActivity(clientUser.id, 'project_access', {
        action_taken: 'Unauthorized project access attempt',
        description: `Client attempted to access project ${projectId} without permission`,
        project_id: projectId,
        ip_address: request.ip,
        user_agent: request.headers.get('user-agent') || undefined,
        metadata: {
          unauthorized_access: true,
          project_id: projectId
        }
      })

      return NextResponse.json(
        { success: false, error: 'Access denied to this project' } as ClientApiResponse<null>,
        { status: 403 }
      )
    }

    const supabase = createServerClient()

    // Get comprehensive project details
    const { data: projectAccess, error } = await supabase
      .from('client_project_access')
      .select(`
        access_level, can_view_financials, can_approve_documents,
        can_view_schedules, can_access_reports, restricted_areas,
        granted_at, last_accessed,
        project:projects(
          id, name, description, status, progress,
          start_date, end_date, created_at, updated_at,
          budget_total, budget_spent,
          project_milestones(
            id, name, description, target_date, completion_date,
            status, milestone_type, deliverables
          ),
          project_assignments(
            id, role, responsibilities,
            user:user_profiles(
              id, first_name, last_name, email, role, phone
            )
          )
        )
      `)
      .eq('client_user_id', clientUser.id)
      .eq('project_id', projectId)
      .single()

    if (error || !projectAccess) {
      console.error('Project details fetch error:', error)
      return NextResponse.json(
        { success: false, error: 'Project not found or access denied' } as ClientApiResponse<null>,
        { status: 404 }
      )
    }

    const project = projectAccess.project

    // Get additional project data based on permissions
    const additionalData = await getAdditionalProjectData(
      supabase, 
      projectId, 
      projectAccess,
      clientUser.id
    )

    // Update last accessed timestamp
    await supabase
      .from('client_project_access')
      .update({
        last_accessed: new Date().toISOString()
      })
      .eq('client_user_id', clientUser.id)
      .eq('project_id', projectId)

    // Transform project data for client consumption
    const projectDetails: ClientProjectDetails = {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      progress: project.progress || 0,
      start_date: project.start_date ? new Date(project.start_date) : undefined,
      end_date: project.end_date ? new Date(project.end_date) : undefined,
      
      // Client-specific access information
      access_level: projectAccess.access_level,
      can_view_financials: projectAccess.can_view_financials,
      can_approve_documents: projectAccess.can_approve_documents,
      can_view_schedules: projectAccess.can_view_schedules,
      can_access_reports: projectAccess.can_access_reports,
      
      // Milestones (filtered by client access)
      milestones: filterMilestones(project.project_milestones, projectAccess.restricted_areas),
      
      // Team contacts (filtered based on access level)
      team: filterTeamMembers(project.project_assignments, projectAccess.access_level),
      
      // Recent documents (if accessible)
      recent_documents: additionalData.recent_documents
    }

    // Include financial data only if client has permission
    if (projectAccess.can_view_financials && project.budget_total) {
      (projectDetails as any).financial = {
        budget_total: project.budget_total,
        budget_spent: project.budget_spent || 0,
        budget_remaining: project.budget_total - (project.budget_spent || 0),
        spent_percentage: ((project.budget_spent || 0) / project.budget_total) * 100
      }
    }

    // Log project access
    await logClientActivity(clientUser.id, 'project_access', {
      action_taken: 'Project details accessed',
      description: `Client accessed detailed information for project: ${project.name}`,
      project_id: projectId,
      ip_address: request.ip,
      user_agent: request.headers.get('user-agent') || undefined,
      metadata: {
        project_accessed: true,
        project_name: project.name,
        access_level: projectAccess.access_level,
        permissions: {
          view_financials: projectAccess.can_view_financials,
          approve_documents: projectAccess.can_approve_documents,
          view_schedules: projectAccess.can_view_schedules,
          access_reports: projectAccess.can_access_reports
        }
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          project: projectDetails,
          statistics: additionalData.statistics
        }
      } as ClientApiResponse<{
        project: ClientProjectDetails,
        statistics: any
      }>,
      { status: 200 }
    )

  } catch (error) {
    console.error('Project details error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch project details' } as ClientApiResponse<null>,
      { status: 500 }
    )
  }
})

// ============================================================================
// Helper Functions
// ============================================================================

async function getAdditionalProjectData(
  supabase: any, 
  projectId: string, 
  projectAccess: any,
  clientUserId: string
) {
  const [documentsResult, statisticsResult] = await Promise.all([
    // Get recent documents client has access to
    getClientAccessibleDocuments(supabase, projectId, clientUserId),
    // Get project statistics
    getProjectStatistics(supabase, projectId, clientUserId)
  ])

  return {
    recent_documents: documentsResult,
    statistics: statisticsResult
  }
}

async function getClientAccessibleDocuments(supabase: any, projectId: string, clientUserId: string) {
  const { data: documentAccess, error } = await supabase
    .from('client_document_access')
    .select(`
      access_type, can_download, can_comment, can_approve,
      view_count, download_count, last_accessed,
      document:documents(
        id, name, file_type, file_size, uploaded_at,
        status, version, confidentiality_level
      )
    `)
    .eq('client_user_id', clientUserId)
    .eq('document.project_id', projectId)
    .order('document.uploaded_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Client documents fetch error:', error)
    return []
  }

  return (documentAccess || []).map((access: any) => ({
    id: access.document.id,
    name: access.document.name,
    type: access.document.file_type,
    size: access.document.file_size,
    uploaded_at: new Date(access.document.uploaded_at),
    status: access.document.status,
    version: access.document.version,
    requires_approval: access.can_approve,
    client_access: {
      access_type: access.access_type,
      can_download: access.can_download,
      can_comment: access.can_comment,
      can_approve: access.can_approve,
      view_count: access.view_count,
      download_count: access.download_count,
      last_accessed: access.last_accessed
    }
  }))
}

async function getProjectStatistics(supabase: any, projectId: string, clientUserId: string) {
  const [
    documentsCount,
    pendingApprovalsCount,
    communicationsCount,
    clientActivityCount
  ] = await Promise.all([
    // Documents accessible to client
    supabase
      .from('client_document_access')
      .select('id', { count: 'exact' })
      .eq('client_user_id', clientUserId)
      .eq('document.project_id', projectId),
    
    // Pending approvals for client
    supabase
      .from('client_document_access')
      .select('id', { count: 'exact' })
      .eq('client_user_id', clientUserId)
      .eq('can_approve', true)
      .eq('document.project_id', projectId),
    
    // Communication threads for this project
    supabase
      .from('client_communication_threads')
      .select('id', { count: 'exact' })
      .eq('client_user_id', clientUserId)
      .eq('project_id', projectId),
    
    // Client's activity on this project (last 30 days)
    supabase
      .from('client_activity_log')
      .select('id', { count: 'exact' })
      .eq('client_user_id', clientUserId)
      .eq('project_id', projectId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
  ])

  return {
    documents: {
      total: documentsCount.count || 0,
      pending_approval: pendingApprovalsCount.count || 0
    },
    communications: {
      total_threads: communicationsCount.count || 0
    },
    client_activity: {
      last_30_days: clientActivityCount.count || 0
    }
  }
}

function filterMilestones(milestones: any[], restrictedAreas: string[]) {
  if (!milestones) return []
  
  return milestones
    .filter(milestone => {
      // Filter out milestones in restricted areas
      if (restrictedAreas && restrictedAreas.length > 0) {
        return !restrictedAreas.some(area => 
          milestone.name?.toLowerCase().includes(area.toLowerCase()) ||
          milestone.description?.toLowerCase().includes(area.toLowerCase())
        )
      }
      return true
    })
    .map(milestone => ({
      id: milestone.id,
      name: milestone.name,
      description: milestone.description,
      date: new Date(milestone.target_date),
      completion_date: milestone.completion_date ? new Date(milestone.completion_date) : undefined,
      status: milestone.status,
      milestone_type: milestone.milestone_type,
      deliverables: milestone.deliverables || []
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}

function filterTeamMembers(assignments: any[], accessLevel: string) {
  if (!assignments) return []
  
  // Show different team member details based on client access level
  const showDetails = ['approver', 'project_owner'].includes(accessLevel)
  
  return assignments.map((assignment: any) => ({
    id: assignment.user.id,
    name: `${assignment.user.first_name} ${assignment.user.last_name}`,
    role: assignment.user.role,
    project_role: assignment.role,
    responsibilities: assignment.responsibilities,
    // Only show contact details for higher access levels
    email: showDetails ? assignment.user.email : undefined,
    phone: showDetails ? assignment.user.phone : undefined
  }))
}