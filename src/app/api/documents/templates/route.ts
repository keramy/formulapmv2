import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const CreateTemplateSchema = z.object({
  templateName: z.string().min(1).max(255),
  documentType: z.enum(['drawing', 'specification', 'report', 'contract', 'other']),
  workflowType: z.enum(['sequential', 'parallel', 'conditional']).default('sequential'),
  defaultApprovers: z.array(z.string().uuid()).optional(),
  approvalSequence: z.array(z.number()).optional(),
  estimatedDurationHours: z.number().optional(),
  description: z.string().optional()
})

const UpdateTemplateSchema = CreateTemplateSchema.partial()

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    const { searchParams } = new URL(request.url)
    const documentType = searchParams.get('documentType')
    const isActive = searchParams.get('active')

    try {
      let query = supabase
        .from('approval_workflow_templates')
        .select('*')
        .order('template_name', { ascending: true })

      if (documentType) {
        query = query.eq('document_type', documentType)
      }

      if (isActive !== null) {
        query = query.eq('is_active', isActive === 'true')
      }

      const { data: templates, error } = await query

      if (error) {
        console.error('Error fetching workflow templates:', error)
        return NextResponse.json({ error: 'Failed to fetch workflow templates' }, { status: 500 })
      }

      return NextResponse.json({ templates })
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
      const validatedData = CreateTemplateSchema.parse(body)

      const { data: template, error } = await supabase
        .from('approval_workflow_templates')
        .insert({
          template_name: validatedData.templateName,
          document_type: validatedData.documentType,
          workflow_type: validatedData.workflowType,
          default_approvers: validatedData.defaultApprovers || [],
          approval_sequence: validatedData.approvalSequence || [],
          estimated_duration_hours: validatedData.estimatedDurationHours,
          description: validatedData.description,
          created_by: user.id
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating workflow template:', error)
        if (error.code === '23505') {
          return NextResponse.json({ error: 'Template with this name already exists' }, { status: 409 })
        }
        return NextResponse.json({ error: 'Failed to create workflow template' }, { status: 500 })
      }

      return NextResponse.json(template, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 })
      }
      console.error('Unexpected error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }, { requiredPermission: 'documents.manage' })
}