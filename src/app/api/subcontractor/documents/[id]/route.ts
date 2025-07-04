/**
 * Subcontractor Document Download API Route
 * GET /api/subcontractor/documents/[id] - Download specific document
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSubcontractorAuth, logSubcontractorActivity } from '@/lib/middleware/subcontractor-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get subcontractor authentication
    const subcontractorAuth = await getSubcontractorAuth(request)
    
    if (!subcontractorAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const documentId = params.id
    const supabase = createClient()

    // Check if subcontractor has access to this document
    const { data: accessData, error: accessError } = await supabase
      .from('subcontractor_scope_access')
      .select(`
        id,
        can_download,
        documents (
          id,
          name,
          file_type,
          file_size,
          file_url,
          created_at
        ),
        scope_items (
          id,
          name,
          category,
          project_id,
          projects (
            id,
            name
          )
        )
      `)
      .eq('subcontractor_id', subcontractorAuth.user.id)
      .eq('document_id', documentId)
      .eq('can_download', true)
      .single()

    if (accessError || !accessData) {
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      )
    }

    // Get the document file
    const document = accessData.documents
    if (!document.file_url) {
      return NextResponse.json(
        { error: 'Document file not available' },
        { status: 404 }
      )
    }

    // Update last accessed timestamp
    await supabase
      .from('subcontractor_scope_access')
      .update({ last_accessed: new Date().toISOString() })
      .eq('id', accessData.id)

    // Log activity
    await logSubcontractorActivity(
      subcontractorAuth.user.id,
      'document_accessed',
      { 
        document_id: documentId,
        document_name: document.name,
        project_id: accessData.scope_items.project_id,
        scope_item_id: accessData.scope_items.id
      },
      request.ip,
      request.headers.get('user-agent') || undefined
    )

    // For direct download, we'll redirect to the file URL
    // In a production environment, you might want to proxy the file
    // or generate a signed URL for security
    const { searchParams } = new URL(request.url)
    const download = searchParams.get('download') === 'true'

    if (download) {
      // Redirect to file URL for download
      return NextResponse.redirect(document.file_url)
    } else {
      // Return document metadata
      return NextResponse.json({
        id: document.id,
        name: document.name,
        file_type: document.file_type,
        file_size: document.file_size,
        file_url: document.file_url,
        created_at: document.created_at,
        scope_item: {
          id: accessData.scope_items.id,
          name: accessData.scope_items.name,
          category: accessData.scope_items.category,
          project: {
            id: accessData.scope_items.projects.id,
            name: accessData.scope_items.projects.name
          }
        },
        access_info: {
          can_download: accessData.can_download,
          last_accessed: new Date().toISOString()
        }
      })
    }

  } catch (error) {
    console.error('Document access error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}