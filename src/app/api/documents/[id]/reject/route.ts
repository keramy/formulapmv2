import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const RejectDocumentSchema = z.object({
  comments: z.string().min(1).max(1000, 'Rejection reason is required and must be under 1000 characters')
})

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json()
      const validatedData = RejectDocumentSchema.parse(body)

      // Get the approval workflow
      const { data: workflow, error: workflowError } = await supabase
        .from('documents_approval_workflow')
        .select(`
          *,
          documents!inner(id, document_name, project_id)
        `)
        .eq('document_id', params.id)
        .single()

      if (workflowError || !workflow) {
        return NextResponse.json({ error: 'Approval workflow not found' }, { status: 404 })
      }

      // Check if user is authorized to reject
      if (!workflow.required_approvers.includes(user.id)) {
        return NextResponse.json({ error: 'You are not authorized to reject this document' }, { status: 403 })
      }

      // Check if workflow is in correct status
      if (!['pending', 'in_review'].includes(workflow.current_status)) {
        return NextResponse.json({ error: 'Document is not in a state that can be rejected' }, { status: 400 })
      }

      // Record rejection action
      const { data: action, error: actionError } = await supabase
        .from('approval_actions')
        .insert({
          workflow_id: workflow.id,
          user_id: user.id,
          action_type: 'reject',
          comments: validatedData.comments,
          metadata_jsonb: {
            ip_address: request.ip,
            user_agent: request.headers.get('user-agent')
          }
        })
        .select()
        .single()

      if (actionError) {
        console.error('Error recording rejection action:', actionError)
        return NextResponse.json({ error: 'Failed to record rejection' }, { status: 500 })
      }

      // Get updated workflow status (triggers will have updated it)
      const { data: updatedWorkflow, error: updatedError } = await supabase
        .from('documents_approval_workflow')
        .select(`
          *,
          documents!inner(id, document_name, project_id)
        `)
        .eq('id', workflow.id)
        .single()

      if (updatedError) {
        console.error('Error fetching updated workflow:', updatedError)
        return NextResponse.json({ error: 'Failed to fetch updated workflow status' }, { status: 500 })
      }

      // Send notification to document owner about rejection
      await supabase
        .from('notifications')
        .insert({
          user_id: workflow.created_by,
          type: 'approval_workflow',
          title: 'Document Rejected',
          message: `Document "${workflow.documents.document_name}" has been rejected`,
          metadata: {
            workflow_id: workflow.id,
            document_id: params.id,
            rejected_by: user.id,
            rejection_reason: validatedData.comments,
            document_name: workflow.documents.document_name
          }
        })

      // Send notification to other approvers that workflow is cancelled
      const otherApprovers = workflow.required_approvers.filter(id => id !== user.id)
      if (otherApprovers.length > 0) {
        const notificationPromises = otherApprovers.map(approverId => 
          supabase
            .from('notifications')
            .insert({
              user_id: approverId,
              type: 'approval_workflow',
              title: 'Document Approval Cancelled',
              message: `Document "${workflow.documents.document_name}" approval has been cancelled due to rejection`,
              metadata: {
                workflow_id: workflow.id,
                document_id: params.id,
                rejected_by: user.id,
                document_name: workflow.documents.document_name
              }
            })
        )
        await Promise.all(notificationPromises)
      }

      return NextResponse.json({
        message: 'Document rejected successfully',
        workflow: updatedWorkflow,
        action: action
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 })
      }
      console.error('Unexpected error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }, { requiredPermission: 'documents.approve' })
}