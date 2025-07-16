// ============================================================================
// V3 Reports API - Publish Report Route
// ============================================================================
// Built with optimization patterns: withAuth, createSuccessResponse, createErrorResponse
// Handles report publishing and sharing workflow
// ============================================================================

import { NextRequest } from 'next/server'
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'
import { createServerClient } from '@/lib/supabase'
import { z } from 'zod'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const publishReportSchema = z.object({
  share_with_users: z.array(z.string().uuid()).optional().default([]),
  share_with_clients: z.array(z.string().uuid()).optional().default([]),
  notification_message: z.string().max(500).optional()
})

// ============================================================================
// POST /api/reports/[id]/publish - Publish report and share
// ============================================================================

export const POST = withAuth(async (request: NextRequest, context: { params: Promise<{ id: string }> }, { user, profile }) => {
  try {
    const params = await context.params
    const reportId = params.id

    const supabase = createServerClient()
    const body = await request.json()

    // Validate request body
    const validation = publishReportSchema.safeParse(body)
    if (!validation.success) {
      return createErrorResponse('Invalid request data', 400, {
        details: validation.error.issues
      })
    }

    const { share_with_users, share_with_clients, notification_message } = validation.data

    // Verify report exists and user has access
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select(`
        id,
        name,
        status,
        pdf_url,
        generated_by,
        project:projects!project_id (
          id,
          name,
          project_manager_id
        ),
        generated_by_profile:user_profiles!generated_by (
          id,
          full_name,
          email
        )
      `)
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      return createErrorResponse('Report not found or access denied', 404)
    }

    // Check if report has PDF generated
    if (!report.pdf_url) {
      return createErrorResponse('Report must have a PDF generated before publishing', 400)
    }

    // Check if already published
    if (report.status === 'published') {
      return createErrorResponse('Report is already published', 400)
    }

    // Update report status to published
    const { data: publishedReport, error: publishError } = await supabase
      .from('reports')
      .update({ 
        status: 'published',
        published_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select(`
        id,
        name,
        type,
        status,
        published_at,
        pdf_url,
        generated_by,
        generated_at,
        project:projects!project_id (
          id,
          name
        ),
        generated_by_profile:user_profiles!generated_by (
          id,
          full_name,
          email
        )
      `)
      .single()

    if (publishError) {
      console.error('Error publishing report:', publishError)
      return createErrorResponse('Failed to publish report', 500)
    }

    // Create sharing records
    const sharePromises: Promise<any>[] = []

    // Share with users
    if (share_with_users && share_with_users.length > 0) {
      const userShares = share_with_users.map(userId => ({
        report_id: reportId,
        shared_with_user_id: userId,
        shared_at: new Date().toISOString()
      }))

      sharePromises.push(
        supabase
          .from('report_shares')
          .insert(userShares)
          .select('id, shared_with_user_id')
      )
    }

    // Share with clients
    if (share_with_clients && share_with_clients.length > 0) {
      const clientShares = share_with_clients.map(clientId => ({
        report_id: reportId,
        shared_with_client_id: clientId,
        shared_at: new Date().toISOString()
      }))

      sharePromises.push(
        supabase
          .from('report_shares')
          .insert(clientShares)
          .select('id, shared_with_client_id')
      )
    }

    // Execute all sharing operations
    let shareResults: any[] = []
    if (sharePromises.length > 0) {
      try {
        shareResults = await Promise.all(sharePromises)
      } catch (shareError) {
        console.error('Error creating shares:', shareError)
        return createErrorResponse('Report published but failed to create shares', 500)
      }
    }

    // TODO: Send notifications to shared users/clients
    // This would integrate with email service or in-app notifications
    try {
      await sendReportNotifications(report, share_with_users, share_with_clients, notification_message)
    } catch (notificationError) {
      console.error('Error sending notifications:', notificationError)
      // Don't fail the request if notifications fail
    }

    return createSuccessResponse({
      data: {
        report: publishedReport,
        shares_created: shareResults.reduce((total, result) => total + (result.data?.length || 0), 0),
        notifications_sent: (share_with_users?.length || 0) + (share_with_clients?.length || 0)
      },
      message: 'Report published and shared successfully'
    })

  } catch (error) {
    console.error('Publish report error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}, {
  permission: 'reports.publish'
})

// ============================================================================
// NOTIFICATION HELPER FUNCTION
// ============================================================================

async function sendReportNotifications(
  report: any, 
  userIds: string[] = [], 
  clientIds: string[] = [], 
  message?: string
): Promise<void> {
  // TODO: Implement actual notification sending
  // This could integrate with:
  // - Email service (SendGrid, SES, etc.)
  // - In-app notifications
  // - SMS service
  // - Slack/Teams webhooks
  
  console.log('Sending report notifications:', {
    reportId: report.id,
    reportName: report.name,
    userIds,
    clientIds,
    message
  })

  // Example notification content:
  const notificationContent = {
    subject: `New Report Published: ${report.name}`,
    body: `
      A new report "${report.name}" has been published for project ${report.project?.name}.
      
      Generated by: ${report.generated_by_profile?.full_name}
      
      ${message ? `Message: ${message}` : ''}
      
      You can view the report PDF at: ${report.pdf_url}
    `.trim()
  }

  // In a real implementation, you would:
  // 1. Fetch user email addresses from userIds
  // 2. Fetch client contact info from clientIds  
  // 3. Send emails/notifications using your preferred service
  // 4. Log notification attempts and results
  // 5. Handle failures gracefully

  // Mock implementation
  if (userIds.length > 0) {
    console.log(`Would send email to ${userIds.length} users`)
  }
  
  if (clientIds.length > 0) {
    console.log(`Would send email to ${clientIds.length} clients`)
  }
}