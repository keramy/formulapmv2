import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const CreateDocumentSchema = z.object({
  projectId: z.string().uuid(),
  documentType: z.enum(['drawing', 'specification', 'report', 'contract', 'other']),
  documentName: z.string().min(1).max(255),
  documentNumber: z.string().optional(),
  version: z.string().default('1.0'),
  filePath: z.string().optional(),
  fileSize: z.number().optional(),
  fileType: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional()
})

const UpdateDocumentSchema = CreateDocumentSchema.partial()

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const documentType = searchParams.get('documentType')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    try {
      let query = supabase
        .from('documents')
        .select(`
          *,
          projects!inner(id, name),
          created_by_user:user_profiles!documents_created_by_fkey(user_id, email, full_name),
          approval_workflow:documents_approval_workflow(
            id,
            current_status,
            priority_level,
            required_approvers,
            completed_approvers,
            created_at,
            estimated_completion_date
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      if (documentType) {
        query = query.eq('document_type', documentType)
      }

      const { data: documents, error, count } = await query

      if (error) {
        console.error('Error fetching documents:', error)
        return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
      }

      const totalPages = Math.ceil((count || 0) / limit)

      return NextResponse.json({
        documents,
        pagination: {
          page,
          limit,
          total: count,
          totalPages
        }
      })
    } catch (error) {
      console.error('Unexpected error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }, { requiredPermission: 'documents.view' })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json()
      const validatedData = CreateDocumentSchema.parse(body)

      const { data: document, error } = await supabase
        .from('documents')
        .insert({
          project_id: validatedData.projectId,
          document_type: validatedData.documentType,
          document_name: validatedData.documentName,
          document_number: validatedData.documentNumber,
          version: validatedData.version,
          file_path: validatedData.filePath,
          file_size: validatedData.fileSize,
          file_type: validatedData.fileType,
          description: validatedData.description,
          tags: validatedData.tags,
          created_by: user.id
        })
        .select(`
          *,
          projects!inner(id, name),
          created_by_user:user_profiles!documents_created_by_fkey(user_id, email, full_name)
        `)
        .single()

      if (error) {
        console.error('Error creating document:', error)
        if (error.code === '23505') {
          return NextResponse.json({ error: 'Document with this number already exists in the project' }, { status: 409 })
        }
        return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
      }

      return NextResponse.json(document, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 })
      }
      console.error('Unexpected error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }, { requiredPermission: 'documents.create' })
}