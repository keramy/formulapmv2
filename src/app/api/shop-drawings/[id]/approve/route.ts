import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { supabase } from '@/lib/supabase'
import { InvalidateCache } from '@/lib/cache'
import { z } from 'zod'

const ApproveShopDrawingSchema = z.object({
  versionNumber: z.string().optional(),
  approvalStatus: z.enum(['approved', 'rejected', 'revision_requested']),
  comments: z.string().max(1000).optional(),
  revisionRequests: z.string().max(1000).optional(),
  signatureData: z.object({
    signature: z.string(),
    timestamp: z.string().datetime(),
    method: z.enum(['digital', 'electronic', 'manual'])
  }).optional()
})

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json()
      const validatedData = ApproveShopDrawingSchema.parse(body)

      // Get drawing information
      const { data: drawing, error: drawingError } = await supabase
        .from('shop_drawings')
        .select(`
          id,
          drawing_number,
          drawing_title,
          current_version,
          current_status,
          project_id,
          projects!inner(id, name)
        `)
        .eq('id', params.id)
        .single()

      if (drawingError || !drawing) {
        return NextResponse.json({ error: 'Shop drawing not found' }, { status: 404 })
      }

      const versionToApprove = validatedData.versionNumber || drawing.current_version

      // Determine user's approval role based on their role in the system
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (profileError || !userProfile) {
        return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
      }

      // Map user role to approval role
      let approvalRole: 'architect' | 'project_manager' | 'client'
      switch (userProfile.role) {
        case 'architect':
          approvalRole = 'architect'
          break
        case 'project_manager':
        case 'general_manager':
        case 'deputy_general_manager':
          approvalRole = 'project_manager'
          break
        case 'client':
          approvalRole = 'client'
          break
        default:
          return NextResponse.json({ 
            error: 'Your role is not authorized to approve shop drawings' 
          }, { status: 403 })
      }

      // Check if user has already approved this version
      const { data: existingApproval, error: approvalCheckError } = await supabase
        .from('shop_drawing_approvals')
        .select('id, approval_status')
        .eq('shop_drawing_id', params.id)
        .eq('version_number', versionToApprove)
        .eq('approver_role', approvalRole)
        .eq('approver_user_id', user.id)
        .single()

      if (existingApproval && existingApproval.approval_status !== 'pending') {
        return NextResponse.json({ 
          error: 'You have already provided approval for this version' 
        }, { status: 409 })
      }

      // Validate revision requests are provided for revision_requested status
      if (validatedData.approvalStatus === 'revision_requested' && !validatedData.revisionRequests) {
        return NextResponse.json({ 
          error: 'Revision requests are required when requesting revisions' 
        }, { status: 400 })
      }

      const isMobileApproval = request.headers.get('user-agent')?.toLowerCase().includes('mobile') || false

      // Create or update approval record
      const approvalData = {
        shop_drawing_id: params.id,
        version_number: versionToApprove,
        approver_role: approvalRole,
        approver_user_id: user.id,
        approval_status: validatedData.approvalStatus,
        approval_date: new Date().toISOString(),
        comments: validatedData.comments,
        revision_requests: validatedData.revisionRequests,
        signature_data: validatedData.signatureData,
        signature_timestamp: validatedData.signatureData ? new Date().toISOString() : null,
        signature_ip: request.ip,
        approved_from_mobile: isMobileApproval,
        device_info: {
          user_agent: request.headers.get('user-agent'),
          mobile: isMobileApproval,
          timestamp: new Date().toISOString()
        }
      }

      let approval
      if (existingApproval) {
        // Update existing approval
        const { data: updatedApproval, error } = await supabase
          .from('shop_drawing_approvals')
          .update(approvalData)
          .eq('id', existingApproval.id)
          .select(`
            *,
            approver_user:user_profiles!shop_drawing_approvals_approver_user_id_fkey(user_id, email, full_name)
          `)
          .single()

        if (error) {
          console.error('Error updating approval:', error)
          return NextResponse.json({ error: 'Failed to update approval' }, { status: 500 })
        }
        approval = updatedApproval
      } else {
        // Create new approval
        const { data: newApproval, error } = await supabase
          .from('shop_drawing_approvals')
          .insert(approvalData)
          .select(`
            *,
            approver_user:user_profiles!shop_drawing_approvals_approver_user_id_fkey(user_id, email, full_name)
          `)
          .single()

        if (error) {
          console.error('Error creating approval:', error)
          return NextResponse.json({ error: 'Failed to create approval' }, { status: 500 })
        }
        approval = newApproval
      }

      // Log access for analytics
      await supabase
        .from('shop_drawing_access_logs')
        .insert({
          shop_drawing_id: params.id,
          user_id: user.id,
          access_type: 'approve',
          is_mobile_access: isMobileApproval,
          device_type: isMobileApproval ? 'mobile' : 'desktop',
          user_agent: request.headers.get('user-agent'),
          ip_address: request.ip
        })

      // Send notifications based on approval status
      const notificationPromises = []

      if (validatedData.approvalStatus === 'approved') {
        // Notify drawing creator
        notificationPromises.push(
          supabase
            .from('notifications')
            .insert({
              user_id: drawing.created_by || '',
              type: 'shop_drawing_approval',
              title: 'Shop Drawing Approved',
              message: `Drawing "${drawing.drawing_number} - ${drawing.drawing_title}" has been approved by ${approvalRole}`,
              metadata: {
                drawing_id: params.id,
                drawing_number: drawing.drawing_number,
                approver_role: approvalRole,
                approval_status: validatedData.approvalStatus
              }
            })
        )

        // Check if this was the final approval needed
        const { data: allApprovals, error: approvalsError } = await supabase
          .from('shop_drawing_approvals')
          .select('approval_status, approver_role')
          .eq('shop_drawing_id', params.id)
          .eq('version_number', versionToApprove)

        if (!approvalsError && allApprovals) {
          const approvedCount = allApprovals.filter(a => a.approval_status === 'approved').length
          const requiredApprovals = ['architect', 'project_manager', 'client']
          
          if (approvedCount === requiredApprovals.length) {
            // All approvals complete - notify project team
            notificationPromises.push(
              supabase
                .from('notifications')
                .insert({
                  user_id: drawing.assigned_to || '',
                  type: 'shop_drawing_complete',
                  title: 'Shop Drawing Fully Approved',
                  message: `Drawing "${drawing.drawing_number} - ${drawing.drawing_title}" has received all required approvals`,
                  metadata: {
                    drawing_id: params.id,
                    drawing_number: drawing.drawing_number,
                    status: 'fully_approved'
                  }
                })
            )
          }
        }
      } else if (validatedData.approvalStatus === 'rejected') {
        // Notify drawing creator of rejection
        notificationPromises.push(
          supabase
            .from('notifications')
            .insert({
              user_id: drawing.created_by || '',
              type: 'shop_drawing_rejection',
              title: 'Shop Drawing Rejected',
              message: `Drawing "${drawing.drawing_number} - ${drawing.drawing_title}" has been rejected by ${approvalRole}`,
              metadata: {
                drawing_id: params.id,
                drawing_number: drawing.drawing_number,
                approver_role: approvalRole,
                rejection_reason: validatedData.comments
              }
            })
        )
      } else if (validatedData.approvalStatus === 'revision_requested') {
        // Notify drawing creator of revision request
        notificationPromises.push(
          supabase
            .from('notifications')
            .insert({
              user_id: drawing.created_by || '',
              type: 'shop_drawing_revision',
              title: 'Shop Drawing Revision Requested',
              message: `Drawing "${drawing.drawing_number} - ${drawing.drawing_title}" requires revisions`,
              metadata: {
                drawing_id: params.id,
                drawing_number: drawing.drawing_number,
                approver_role: approvalRole,
                revision_requests: validatedData.revisionRequests
              }
            })
        )
      }

      await Promise.all(notificationPromises)

      // Invalidate cache
      InvalidateCache.project(drawing.project_id)

      return NextResponse.json({
        message: `Drawing ${validatedData.approvalStatus} successfully`,
        approval,
        drawing: {
          id: drawing.id,
          drawing_number: drawing.drawing_number,
          drawing_title: drawing.drawing_title
        }
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 })
      }
      console.error('Unexpected error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }, { requiredPermission: 'shop_drawings.approve' })
}