/**
 * Subcontractor Profile API Route
 * GET /api/subcontractor/profile
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSubcontractorAuth } from '@/lib/middleware/subcontractor-auth'

export async function GET(request: NextRequest) {
  try {
    // Get subcontractor authentication
    const subcontractorAuth = await getSubcontractorAuth(request)
    
    if (!subcontractorAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createClient()

    // Get full subcontractor profile with assigned projects
    const { data: subcontractorData, error: subcontractorError } = await supabase
      .from('subcontractor_users')
      .select(`
        *,
        subcontractor_scope_access (
          scope_item_id,
          document_id,
          can_download,
          granted_at,
          last_accessed,
          scope_items (
            id,
            name,
            category,
            project_id,
            projects (
              id,
              name,
              status,
              description
            )
          )
        )
      `)
      .eq('id', subcontractorAuth.user.id)
      .single()

    if (subcontractorError || !subcontractorData) {
      return NextResponse.json(
        { error: 'Subcontractor profile not found' },
        { status: 404 }
      )
    }

    // Process assigned projects
    const assignedProjects = new Map()
    
    subcontractorData.subcontractor_scope_access?.forEach((access: any) => {
      const project = access.scope_items?.projects
      if (project) {
        if (!assignedProjects.has(project.id)) {
          assignedProjects.set(project.id, {
            id: project.id,
            name: project.name,
            status: project.status,
            description: project.description,
            scope_items: [],
            document_count: 0
          })
        }
        
        const projectData = assignedProjects.get(project.id)
        projectData.scope_items.push({
          id: access.scope_items.id,
          name: access.scope_items.name,
          category: access.scope_items.category,
          can_download: access.can_download,
          granted_at: access.granted_at,
          last_accessed: access.last_accessed
        })
        projectData.document_count++
      }
    })

    // Get report statistics
    const { data: reportStats, error: reportError } = await supabase
      .from('subcontractor_reports')
      .select('status, created_at')
      .eq('subcontractor_id', subcontractorAuth.user.id)

    const reportStatistics = {
      total: reportStats?.length || 0,
      submitted: reportStats?.filter(r => r.status === 'submitted').length || 0,
      reviewed: reportStats?.filter(r => r.status === 'reviewed').length || 0,
      approved: reportStats?.filter(r => r.status === 'approved').length || 0,
      recent: reportStats?.filter(r => {
        const reportDate = new Date(r.created_at)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return reportDate >= weekAgo
      }).length || 0
    }

    return NextResponse.json({
      user: {
        id: subcontractorData.id,
        email: subcontractorData.email,
        company_name: subcontractorData.company_name,
        contact_person: subcontractorData.contact_person,
        phone: subcontractorData.phone,
        is_active: subcontractorData.is_active,
        last_login: subcontractorData.last_login,
        created_at: subcontractorData.created_at
      },
      assigned_projects: Array.from(assignedProjects.values()),
      report_statistics: reportStatistics,
      permissions: {
        can_submit_reports: subcontractorData.is_active,
        can_access_documents: subcontractorData.is_active,
        can_download_documents: subcontractorData.is_active
      }
    })

  } catch (error) {
    console.error('Subcontractor profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}