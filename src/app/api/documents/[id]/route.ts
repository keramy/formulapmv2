import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const UpdateDocumentSchema = z.object({
  documentName: z.string().min(1).max(255).optional(),
  documentNumber: z.string().optional(),
  version: z.string().optional(),
  filePath: z.string().optional(),
  fileSize: z.number().optional(),
  fileType: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional()
})

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (user) => {
    try {
      const { data: document, error } = await supabase
        .from('documents')
        .select(`
          *,
          projects!inner(id, name),
          created_by_user:user_profiles!documents_created_by_fkey(user_id, email, full_name),
          approval_workflow:documents_approval_workflow(
            id,
            workflow_type,
            current_status,
            priority_level,
            required_approvers,
            completed_approvers,
            rejected_by,
            rejection_reason,
            estimated_completion_date,
            actual_completion_date,
            created_at,
            updated_at
          )
        `)
        .eq('id', params.id)
        .single()

      if (error) {
        console.error('Error fetching document:', error)
        if (error.code === 'PGRST116') {
          return NextResponse.json({ error: 'Document not found' }, { status: 404 })
        }
        return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 })
      }

      return NextResponse.json(document)
    } catch (error) {
      console.error('Unexpected error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }, { requiredPermission: 'documents.view' })
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json()
      const validatedData = UpdateDocumentSchema.parse(body)

      const { data: document, error } = await supabase
        .from('documents')
        .update({
          document_name: validatedData.documentName,
          document_number: validatedData.documentNumber,
          version: validatedData.version,
          file_path: validatedData.filePath,
          file_size: validatedData.fileSize,
          file_type: validatedData.fileType,
          description: validatedData.description,
          tags: validatedData.tags,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)
        .select(`
          *,
          projects!inner(id, name),
          created_by_user:user_profiles!documents_created_by_fkey(user_id, email, full_name)
        `)
        .single()

      if (error) {
        console.error('Error updating document:', error)
        if (error.code === 'PGRST116') {
          return NextResponse.json({ error: 'Document not found' }, { status: 404 })
        }
        if (error.code === '23505') {
          return NextResponse.json({ error: 'Document with this number already exists in the project' }, { status: 409 })
        }
        return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
      }

      return NextResponse.json(document)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 })
      }
      console.error('Unexpected error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }, { requiredPermission: 'documents.update' })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (user) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', params.id)

      if (error) {
        console.error('Error deleting document:', error)
        if (error.code === 'PGRST116') {
          return NextResponse.json({ error: 'Document not found' }, { status: 404 })
        }
        return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
      }

      return NextResponse.json({ message: 'Document deleted successfully' })
    } catch (error) {
      console.error('Unexpected error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }, { requiredPermission: 'documents.delete' })
}