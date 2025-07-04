/**
 * Subcontractor Documents API Route
 * GET /api/subcontractor/documents - List accessible documents
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
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const projectId = searchParams.get('project_id')
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Get accessible documents through scope access
    let query = supabase
      .from('subcontractor_scope_access')
      .select(`
        id,
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
            status
          )
        ),
        documents (
          id,
          name,
          file_type,
          file_size,
          file_url,
          created_at,
          updated_at
        )
      `)
      .eq('subcontractor_id', subcontractorAuth.user.id)
      .eq('can_download', true)
      .order('granted_at', { ascending: false })

    // Apply filters
    if (projectId) {
      // Filter by project through scope items
      query = query.eq('scope_items.project_id', projectId)
    }

    if (category) {
      query = query.eq('scope_items.category', category)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: accessData, error: accessError } = await query

    if (accessError) {
      console.error('Error fetching document access:', accessError)
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      )
    }

    // Process the data to create clean document list
    const documents = accessData?.map(access => ({
      id: access.documents.id,
      name: access.documents.name,
      file_type: access.documents.file_type,
      file_size: access.documents.file_size,
      created_at: access.documents.created_at,
      updated_at: access.documents.updated_at,
      scope_item: {
        id: access.scope_items.id,
        name: access.scope_items.name,
        category: access.scope_items.category,
        project: {
          id: access.scope_items.projects.id,
          name: access.scope_items.projects.name,
          status: access.scope_items.projects.status
        }
      },
      access_info: {
        can_download: access.can_download,
        granted_at: access.granted_at,
        last_accessed: access.last_accessed
      }
    })) || []

    // Get total count for pagination
    let countQuery = supabase
      .from('subcontractor_scope_access')
      .select('*', { count: 'exact', head: true })
      .eq('subcontractor_id', subcontractorAuth.user.id)
      .eq('can_download', true)

    if (projectId) {
      countQuery = countQuery.eq('scope_items.project_id', projectId)
    }
    
    if (category) {
      countQuery = countQuery.eq('scope_items.category', category)
    }

    const { count } = await countQuery

    // Get unique projects and categories for filtering
    const projects = [...new Set(documents.map(d => d.scope_item.project))]
    const categories = [...new Set(documents.map(d => d.scope_item.category))]

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      },
      filters: {
        projects,
        categories
      }
    })

  } catch (error) {
    console.error('Documents GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}