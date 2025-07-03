import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const StartApprovalSchema = z.object({
  workflowType: z.enum(['sequential', 'parallel', 'conditional']).default('sequential'),
  approvers: z.array(z.string().uuid()).min(1),
  approvalSequence: z.array(z.number()).optional(),
  estimatedCompletionDate: z.string().datetime().optional(),
  priorityLevel: z.number().min(1).max(4).default(1),
  comments: z.string().max(1000).optional()
})

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json()
      const validatedData = StartApprovalSchema.parse(body)

      // Check if document exists and user has permission
      const { data: document, error: docError } = await supabase
        .from('documents')
        .select('id, project_id, document_name')
        .eq('id', params.id)
        .single()

      if (docError || !document) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 })
      }

      // Check if approval workflow already exists
      const { data: existingWorkflow, error: workflowCheckError } = await supabase
        .from('documents_approval_workflow')
        .select('id, current_status')
        .eq('document_id', params.id)
        .single()

      if (existingWorkflow && existingWorkflow.current_status !== 'cancelled') {
        return NextResponse.json({ 
          error: 'Approval workflow already exists for this document',
          workflowId: existingWorkflow.id
        }, { status: 409 })
      }

      // Validate approvers exist
      const { data: approverCheck, error: approverError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .in('user_id', validatedData.approvers)

      if (approverError || !approverCheck || approverCheck.length !== validatedData.approvers.length) {
        return NextResponse.json({ error: 'One or more approvers not found' }, { status: 400 })
      }

      // Create approval workflow
      const { data: workflow, error } = await supabase
        .from('documents_approval_workflow')
        .insert({
          document_id: params.id,
          workflow_type: validatedData.workflowType,
          required_approvers: validatedData.approvers,
          approval_sequence: validatedData.approvalSequence || validatedData.approvers.map((_, index) => index + 1),
          estimated_completion_date: validatedData.estimatedCompletionDate,
          priority_level: validatedData.priorityLevel,
          current_status: 'pending',
          created_by: user.id
        })
        .select(`
          *,
          documents!inner(id, document_name, project_id)
        `)
        .single()

      if (error) {
        console.error('Error creating approval workflow:', error)
        return NextResponse.json({ error: 'Failed to create approval workflow' }, { status: 500 })
      }

      // Create initial action record
      if (validatedData.comments) {
        await supabase
          .from('approval_actions')
          .insert({
            workflow_id: workflow.id,
            user_id: user.id,
            action_type: 'comment',
            comments: validatedData.comments,
            metadata_jsonb: { action: 'workflow_started' }
          })
      }

      // Send notifications to approvers
      const notificationPromises = validatedData.approvers.map(approverId => 
        supabase
          .from('notifications')
          .insert({
            user_id: approverId,
            type: 'approval_workflow',
            title: 'Document Approval Required',
            message: `You have been assigned to approve document "${document.document_name}"`,
            metadata: {
              workflow_id: workflow.id,
              document_id: params.id,
              priority: validatedData.priorityLevel,
              document_name: document.document_name
            }
          })
      )

      await Promise.all(notificationPromises)

      return NextResponse.json(workflow, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 })
      }
      console.error('Unexpected error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }, { requiredPermission: 'documents.manage' })
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (user) => {
    try {
      const { data: workflow, error } = await supabase
        .from('documents_approval_workflow')
        .select(`
          *,
          documents!inner(id, document_name, project_id),
          approval_actions(
            id,
            user_id,
            action_type,
            comments,
            timestamp,
            metadata_jsonb,
            user:user_profiles!approval_actions_user_id_fkey(user_id, email, full_name)
          )
        `)
        .eq('document_id', params.id)
        .order('created_at', { ascending: false })
        .single()

      if (error) {
        console.error('Error fetching approval workflow:', error)
        if (error.code === 'PGRST116') {
          return NextResponse.json({ error: 'Approval workflow not found' }, { status: 404 })
        }
        return NextResponse.json({ error: 'Failed to fetch approval workflow' }, { status: 500 })
      }

      return NextResponse.json(workflow)
    } catch (error) {
      console.error('Unexpected error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }, { requiredPermission: 'documents.view' })
}