import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { supabase } from '@/lib/supabase'
import { InvalidateCache } from '@/lib/cache'
import { z } from 'zod'

const ApproveDocumentSchema = z.object({
  comments: z.string().max(1000).optional(),
  delegateTo: z.string().uuid().optional()
})

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json()
      const validatedData = ApproveDocumentSchema.parse(body)

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

      // Check if user is authorized to approve
      if (!workflow.required_approvers.includes(user.id)) {
        return NextResponse.json({ error: 'You are not authorized to approve this document' }, { status: 403 })
      }

      // Check if user already approved
      if (workflow.completed_approvers.includes(user.id)) {
        return NextResponse.json({ error: 'You have already approved this document' }, { status: 409 })
      }

      // Check if workflow is in correct status
      if (!['pending', 'in_review'].includes(workflow.current_status)) {
        return NextResponse.json({ error: 'Document is not in a state that can be approved' }, { status: 400 })
      }

      // For sequential workflows, check if it's the user's turn
      if (workflow.workflow_type === 'sequential') {
        const approverSequence = workflow.approval_sequence || []
        const currentSequence = workflow.completed_approvers.length + 1
        const expectedApproverIndex = approverSequence.indexOf(currentSequence)
        
        if (expectedApproverIndex === -1 || workflow.required_approvers[expectedApproverIndex] !== user.id) {
          return NextResponse.json({ error: 'It is not your turn to approve in this sequential workflow' }, { status: 400 })
        }
      }

      // Handle delegation
      if (validatedData.delegateTo) {
        // Validate delegate exists
        const { data: delegate, error: delegateError } = await supabase
          .from('user_profiles')
          .select('user_id, email, full_name')
          .eq('user_id', validatedData.delegateTo)
          .single()

        if (delegateError || !delegate) {
          return NextResponse.json({ error: 'Delegate user not found' }, { status: 400 })
        }

        // Update workflow to replace user with delegate
        const updatedApprovers = workflow.required_approvers.map(id => 
          id === user.id ? validatedData.delegateTo : id
        )

        const { error: updateError } = await supabase
          .from('documents_approval_workflow')
          .update({
            required_approvers: updatedApprovers,
            delegation_chain: [
              ...workflow.delegation_chain,
              {
                original_approver: user.id,
                delegated_to: validatedData.delegateTo,
                timestamp: new Date().toISOString(),
                reason: validatedData.comments || 'No reason provided'
              }
            ]
          })
          .eq('id', workflow.id)

        if (updateError) {
          console.error('Error updating workflow for delegation:', updateError)
          return NextResponse.json({ error: 'Failed to delegate approval' }, { status: 500 })
        }

        // Record delegation action
        await supabase
          .from('approval_actions')
          .insert({
            workflow_id: workflow.id,
            user_id: user.id,
            action_type: 'delegate',
            comments: validatedData.comments,
            metadata_jsonb: {
              delegated_to: validatedData.delegateTo,
              delegate_email: delegate.email
            }
          })

        // Send notification to delegate
        await supabase
          .from('notifications')
          .insert({
            user_id: validatedData.delegateTo,
            type: 'approval_workflow',
            title: 'Document Approval Delegated',
            message: `You have been delegated to approve document "${workflow.documents.document_name}"`,
            metadata: {
              workflow_id: workflow.id,
              document_id: params.id,
              delegated_by: user.id,
              document_name: workflow.documents.document_name
            }
          })

        // Invalidate cache for both users
        InvalidateCache.userApprovals(user.id)
        InvalidateCache.userApprovals(validatedData.delegateTo)
        InvalidateCache.workflow(workflow.id, params.id)

        return NextResponse.json({
          message: 'Approval successfully delegated',
          delegatedTo: delegate.email,
          delegatedToName: delegate.full_name
        })
      }

      // Record approval action
      const { data: action, error: actionError } = await supabase
        .from('approval_actions')
        .insert({
          workflow_id: workflow.id,
          user_id: user.id,
          action_type: 'approve',
          comments: validatedData.comments,
          metadata_jsonb: {
            ip_address: request.ip,
            user_agent: request.headers.get('user-agent')
          }
        })
        .select()
        .single()

      if (actionError) {
        console.error('Error recording approval action:', actionError)
        return NextResponse.json({ error: 'Failed to record approval' }, { status: 500 })
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

      // Send notification to document owner if fully approved
      if (updatedWorkflow.current_status === 'approved') {
        await supabase
          .from('notifications')
          .insert({
            user_id: workflow.created_by,
            type: 'approval_workflow',
            title: 'Document Approved',
            message: `Document "${workflow.documents.document_name}" has been fully approved`,
            metadata: {
              workflow_id: workflow.id,
              document_id: params.id,
              approved_by: user.id,
              document_name: workflow.documents.document_name
            }
          })
      }

      // Invalidate cache for all affected users
      InvalidateCache.userApprovals(user.id)
      updatedWorkflow.required_approvers.forEach((approverId: string) => {
        InvalidateCache.userApprovals(approverId)
      })
      InvalidateCache.workflow(workflow.id, params.id)

      return NextResponse.json({
        message: 'Document approved successfully',
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