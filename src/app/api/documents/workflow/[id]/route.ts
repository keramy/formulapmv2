import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const UpdateWorkflowSchema = z.object({
  priorityLevel: z.number().min(1).max(4).optional(),
  estimatedCompletionDate: z.string().datetime().optional(),
  additionalApprovers: z.array(z.string().uuid()).optional(),
  comments: z.string().max(1000).optional()
})

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (user) => {
    try {
      const { data: workflow, error } = await supabase
        .from('documents_approval_workflow')
        .select(`
          *,
          documents!inner(
            id,
            document_name,
            document_type,
            document_number,
            version,
            file_path,
            description,
            project_id,
            projects!inner(id, name)
          ),
          approval_actions(
            id,
            user_id,
            action_type,
            comments,
            timestamp,
            metadata_jsonb,
            delegated_by,
            original_approver
          )
        `)
        .eq('id', params.id)
        .single()

      if (error) {
        console.error('Error fetching workflow:', error)
        if (error.code === 'PGRST116') {
          return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
        }
        return NextResponse.json({ error: 'Failed to fetch workflow' }, { status: 500 })
      }

      // Get user details for approvers and actions
      const allUserIds = [
        ...workflow.required_approvers,
        ...workflow.completed_approvers,
        ...(workflow.approval_actions?.map((action: any) => action.user_id) || [])
      ]
      const uniqueUserIds = [...new Set(allUserIds)]

      let users = []
      if (uniqueUserIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('user_profiles')
          .select('user_id, email, full_name, role')
          .in('user_id', uniqueUserIds)

        if (!usersError && usersData) {
          users = usersData
        }
      }

      // Enhance workflow data with user information
      const enhancedWorkflow = {
        ...workflow,
        approvers_details: workflow.required_approvers.map((userId: string) => {
          const user = users.find((u: any) => u.user_id === userId)
          return {
            user_id: userId,
            email: user?.email || 'Unknown',
            full_name: user?.full_name || 'Unknown User',
            role: user?.role || 'unknown',
            has_approved: workflow.completed_approvers.includes(userId)
          }
        }),
        approval_actions: workflow.approval_actions?.map((action: any) => {
          const user = users.find((u: any) => u.user_id === action.user_id)
          return {
            ...action,
            user: {
              id: action.user_id,
              email: user?.email || 'Unknown',
              full_name: user?.full_name || 'Unknown User'
            }
          }
        }) || []
      }

      return NextResponse.json(enhancedWorkflow)
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
      const validatedData = UpdateWorkflowSchema.parse(body)

      // Check if workflow exists and user has permission
      const { data: existingWorkflow, error: fetchError } = await supabase
        .from('documents_approval_workflow')
        .select('id, created_by, current_status, required_approvers')
        .eq('id', params.id)
        .single()

      if (fetchError || !existingWorkflow) {
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
      }

      // Check if user can modify this workflow
      const canModify = existingWorkflow.created_by === user.id || 
                       existingWorkflow.required_approvers.includes(user.id)

      if (!canModify) {
        return NextResponse.json({ error: 'You do not have permission to modify this workflow' }, { status: 403 })
      }

      // Prepare update data
      const updateData: any = {}
      
      if (validatedData.priorityLevel) {
        updateData.priority_level = validatedData.priorityLevel
      }
      
      if (validatedData.estimatedCompletionDate) {
        updateData.estimated_completion_date = validatedData.estimatedCompletionDate
      }
      
      if (validatedData.additionalApprovers && validatedData.additionalApprovers.length > 0) {
        // Add new approvers to existing list (avoid duplicates)
        const currentApprovers = existingWorkflow.required_approvers
        const newApprovers = validatedData.additionalApprovers.filter(
          id => !currentApprovers.includes(id)
        )
        if (newApprovers.length > 0) {
          updateData.required_approvers = [...currentApprovers, ...newApprovers]
        }
      }

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 })
      }

      updateData.updated_at = new Date().toISOString()

      const { data: updatedWorkflow, error } = await supabase
        .from('documents_approval_workflow')
        .update(updateData)
        .eq('id', params.id)
        .select(`
          *,
          documents!inner(
            id,
            document_name,
            document_type,
            project_id,
            projects!inner(id, name)
          )
        `)
        .single()

      if (error) {
        console.error('Error updating workflow:', error)
        return NextResponse.json({ error: 'Failed to update workflow' }, { status: 500 })
      }

      // Log the update action
      if (validatedData.comments) {
        await supabase
          .from('approval_actions')
          .insert({
            workflow_id: params.id,
            user_id: user.id,
            action_type: 'comment',
            comments: validatedData.comments,
            metadata_jsonb: { action: 'workflow_updated', updates: Object.keys(updateData) }
          })
      }

      return NextResponse.json(updatedWorkflow)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 })
      }
      console.error('Unexpected error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }, { requiredPermission: 'documents.manage' })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (user) => {
    try {
      // Check if workflow exists and user has permission
      const { data: workflow, error: fetchError } = await supabase
        .from('documents_approval_workflow')
        .select('id, created_by, current_status')
        .eq('id', params.id)
        .single()

      if (fetchError || !workflow) {
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
      }

      // Only creator or admin can cancel workflow
      if (workflow.created_by !== user.id) {
        return NextResponse.json({ error: 'You do not have permission to cancel this workflow' }, { status: 403 })
      }

      // Can only cancel if not already completed
      if (['approved', 'rejected', 'cancelled'].includes(workflow.current_status)) {
        return NextResponse.json({ 
          error: `Cannot cancel workflow with status: ${workflow.current_status}` 
        }, { status: 400 })
      }

      // Update status to cancelled instead of deleting
      const { error } = await supabase
        .from('documents_approval_workflow')
        .update({
          current_status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)

      if (error) {
        console.error('Error cancelling workflow:', error)
        return NextResponse.json({ error: 'Failed to cancel workflow' }, { status: 500 })
      }

      // Log the cancellation
      await supabase
        .from('approval_actions')
        .insert({
          workflow_id: params.id,
          user_id: user.id,
          action_type: 'comment',
          comments: 'Workflow cancelled by creator',
          metadata_jsonb: { action: 'workflow_cancelled' }
        })

      return NextResponse.json({ message: 'Workflow cancelled successfully' })
    } catch (error) {
      console.error('Unexpected error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }, { requiredPermission: 'documents.manage' })
}