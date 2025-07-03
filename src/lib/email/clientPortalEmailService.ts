/**
 * Client Portal Email Service
 * Handles email notifications for external client portal users
 * Integrates with existing Formula PM email infrastructure while maintaining isolation
 */

import { 
  ClientNotificationType, 
  ClientPriority, 
  ClientNotification 
} from '@/types/client-portal'

// Email template types
interface EmailTemplate {
  subject: string
  html: string
  text: string
}

interface EmailRecipient {
  email: string
  name?: string
  client_company?: string
}

interface EmailAttachment {
  filename: string
  content: Buffer | string
  contentType: string
}

interface ClientEmailPayload {
  to: EmailRecipient
  template_type: ClientNotificationType
  data: Record<string, any>
  priority: ClientPriority
  attachments?: EmailAttachment[]
  reply_to?: string
  tracking_id?: string
}

/**
 * Client Portal Email Service
 * Manages email delivery for client portal notifications
 */
export class ClientPortalEmailService {
  private static instance: ClientPortalEmailService
  private emailProvider: 'smtp' | 'sendgrid' | 'ses' = 'smtp' // Default to SMTP
  
  static getInstance(): ClientPortalEmailService {
    if (!ClientPortalEmailService.instance) {
      ClientPortalEmailService.instance = new ClientPortalEmailService()
    }
    return ClientPortalEmailService.instance
  }

  /**
   * Send email notification to client
   */
  async sendNotificationEmail(payload: ClientEmailPayload): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      // Get email template
      const template = await this.getEmailTemplate(payload.template_type, payload.data)
      
      // Build email content
      const emailContent = {
        to: payload.to,
        subject: template.subject,
        html: template.html,
        text: template.text,
        priority: payload.priority,
        attachments: payload.attachments,
        reply_to: payload.reply_to || process.env.CLIENT_PORTAL_REPLY_EMAIL,
        tracking_id: payload.tracking_id
      }

      // Send via configured provider
      const result = await this.sendEmail(emailContent)
      
      // Log email delivery
      await this.logEmailDelivery({
        recipient: payload.to.email,
        template_type: payload.template_type,
        success: result.success,
        message_id: result.messageId,
        error: result.error,
        tracking_id: payload.tracking_id
      })

      return result
    } catch (error) {
      console.error('Failed to send client notification email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error'
      }
    }
  }

  /**
   * Send document approval required email
   */
  async sendDocumentApprovalEmail(
    recipient: EmailRecipient,
    projectName: string,
    documentName: string,
    documentId: string,
    deadline?: Date
  ): Promise<{ success: boolean; error?: string }> {
    const approvalUrl = `${process.env.NEXT_PUBLIC_CLIENT_PORTAL_URL}/client-portal/documents/${documentId}`
    
    return this.sendNotificationEmail({
      to: recipient,
      template_type: 'approval_required',
      priority: deadline ? 'high' : 'medium',
      data: {
        project_name: projectName,
        document_name: documentName,
        document_id: documentId,
        approval_url: approvalUrl,
        deadline: deadline?.toLocaleDateString(),
        has_deadline: !!deadline
      }
    })
  }

  /**
   * Send document submitted email
   */
  async sendDocumentSubmittedEmail(
    recipient: EmailRecipient,
    projectName: string,
    documentName: string,
    documentId: string,
    submittedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    const documentUrl = `${process.env.NEXT_PUBLIC_CLIENT_PORTAL_URL}/client-portal/documents/${documentId}`
    
    return this.sendNotificationEmail({
      to: recipient,
      template_type: 'document_submitted',
      priority: 'medium',
      data: {
        project_name: projectName,
        document_name: documentName,
        document_id: documentId,
        document_url: documentUrl,
        submitted_by: submittedBy
      }
    })
  }

  /**
   * Send project milestone notification
   */
  async sendProjectMilestoneEmail(
    recipient: EmailRecipient,
    projectName: string,
    milestoneName: string,
    milestoneDate: Date,
    description?: string
  ): Promise<{ success: boolean; error?: string }> {
    const projectUrl = `${process.env.NEXT_PUBLIC_CLIENT_PORTAL_URL}/client-portal/projects`
    
    return this.sendNotificationEmail({
      to: recipient,
      template_type: 'project_milestone',
      priority: 'medium',
      data: {
        project_name: projectName,
        milestone_name: milestoneName,
        milestone_date: milestoneDate.toLocaleDateString(),
        description,
        project_url: projectUrl
      }
    })
  }

  /**
   * Send schedule change notification
   */
  async sendScheduleChangeEmail(
    recipient: EmailRecipient,
    projectName: string,
    changeDescription: string,
    newDate?: Date,
    impact?: string
  ): Promise<{ success: boolean; error?: string }> {
    const projectUrl = `${process.env.NEXT_PUBLIC_CLIENT_PORTAL_URL}/client-portal/projects`
    
    return this.sendNotificationEmail({
      to: recipient,
      template_type: 'schedule_change',
      priority: impact === 'high' ? 'high' : 'medium',
      data: {
        project_name: projectName,
        change_description: changeDescription,
        new_date: newDate?.toLocaleDateString(),
        impact,
        project_url: projectUrl
      }
    })
  }

  /**
   * Send new message notification
   */
  async sendNewMessageEmail(
    recipient: EmailRecipient,
    projectName: string,
    senderName: string,
    subject: string,
    messagePreview: string,
    threadId: string
  ): Promise<{ success: boolean; error?: string }> {
    const messageUrl = `${process.env.NEXT_PUBLIC_CLIENT_PORTAL_URL}/client-portal/communications/threads/${threadId}`
    
    return this.sendNotificationEmail({
      to: recipient,
      template_type: 'message_received',
      priority: 'medium',
      data: {
        project_name: projectName,
        sender_name: senderName,
        subject,
        message_preview: messagePreview,
        message_url: messageUrl
      }
    })
  }

  /**
   * Send system announcement
   */
  async sendSystemAnnouncementEmail(
    recipient: EmailRecipient,
    title: string,
    message: string,
    priority: ClientPriority = 'medium'
  ): Promise<{ success: boolean; error?: string }> {
    const portalUrl = `${process.env.NEXT_PUBLIC_CLIENT_PORTAL_URL}/client-portal`
    
    return this.sendNotificationEmail({
      to: recipient,
      template_type: 'system_announcement',
      priority,
      data: {
        title,
        message,
        portal_url: portalUrl
      }
    })
  }

  /**
   * Send quality issue notification
   */
  async sendQualityIssueEmail(
    recipient: EmailRecipient,
    projectName: string,
    issueDescription: string,
    severity: string,
    affectedItems?: string[]
  ): Promise<{ success: boolean; error?: string }> {
    const projectUrl = `${process.env.NEXT_PUBLIC_CLIENT_PORTAL_URL}/client-portal/projects`
    
    return this.sendNotificationEmail({
      to: recipient,
      template_type: 'quality_issue',
      priority: severity === 'critical' ? 'urgent' : 'high',
      data: {
        project_name: projectName,
        issue_description: issueDescription,
        severity,
        affected_items: affectedItems?.join(', '),
        project_url: projectUrl
      }
    })
  }

  /**
   * Send budget update notification
   */
  async sendBudgetUpdateEmail(
    recipient: EmailRecipient,
    projectName: string,
    updateType: string,
    amount: number,
    reason: string,
    requiresApproval: boolean = false
  ): Promise<{ success: boolean; error?: string }> {
    const projectUrl = `${process.env.NEXT_PUBLIC_CLIENT_PORTAL_URL}/client-portal/projects`
    
    return this.sendNotificationEmail({
      to: recipient,
      template_type: 'budget_update',
      priority: requiresApproval ? 'high' : 'medium',
      data: {
        project_name: projectName,
        update_type: updateType,
        amount: amount.toLocaleString(),
        reason,
        requires_approval: requiresApproval,
        project_url: projectUrl
      }
    })
  }

  /**
   * Send delivery notification
   */
  async sendDeliveryNotificationEmail(
    recipient: EmailRecipient,
    projectName: string,
    deliveryType: string,
    description: string,
    expectedDate?: Date,
    actualDate?: Date
  ): Promise<{ success: boolean; error?: string }> {
    const isDelayed = expectedDate && actualDate && actualDate > expectedDate
    const projectUrl = `${process.env.NEXT_PUBLIC_CLIENT_PORTAL_URL}/client-portal/projects`
    
    return this.sendNotificationEmail({
      to: recipient,
      template_type: 'delivery_notification',
      priority: isDelayed ? 'high' : 'medium',
      data: {
        project_name: projectName,
        delivery_type: deliveryType,
        description,
        expected_date: expectedDate?.toLocaleDateString(),
        actual_date: actualDate?.toLocaleDateString(),
        is_delayed: isDelayed,
        project_url: projectUrl
      }
    })
  }

  /**
   * Get email template for notification type
   */
  private async getEmailTemplate(templateType: ClientNotificationType, data: Record<string, any>): Promise<EmailTemplate> {
    // In a real implementation, these would come from a template service or database
    const templates: Record<ClientNotificationType, (data: any) => EmailTemplate> = {
      document_submitted: (data) => ({
        subject: `New Document: ${data.document_name} - ${data.project_name}`,
        html: this.generateDocumentSubmittedHTML(data),
        text: this.generateDocumentSubmittedText(data)
      }),
      approval_required: (data) => ({
        subject: `Approval Required: ${data.document_name} - ${data.project_name}`,
        html: this.generateApprovalRequiredHTML(data),
        text: this.generateApprovalRequiredText(data)
      }),
      approval_received: (data) => ({
        subject: `Approval Received: ${data.document_name} - ${data.project_name}`,
        html: this.generateApprovalReceivedHTML(data),
        text: this.generateApprovalReceivedText(data)
      }),
      project_milestone: (data) => ({
        subject: `Project Milestone: ${data.milestone_name} - ${data.project_name}`,
        html: this.generateMilestoneHTML(data),
        text: this.generateMilestoneText(data)
      }),
      schedule_change: (data) => ({
        subject: `Schedule Update: ${data.project_name}`,
        html: this.generateScheduleChangeHTML(data),
        text: this.generateScheduleChangeText(data)
      }),
      budget_update: (data) => ({
        subject: `Budget ${data.requires_approval ? 'Approval Required' : 'Update'}: ${data.project_name}`,
        html: this.generateBudgetUpdateHTML(data),
        text: this.generateBudgetUpdateText(data)
      }),
      quality_issue: (data) => ({
        subject: `Quality Issue - ${data.severity.toUpperCase()}: ${data.project_name}`,
        html: this.generateQualityIssueHTML(data),
        text: this.generateQualityIssueText(data)
      }),
      delivery_notification: (data) => ({
        subject: `Delivery ${data.is_delayed ? '(Delayed)' : 'Update'}: ${data.project_name}`,
        html: this.generateDeliveryHTML(data),
        text: this.generateDeliveryText(data)
      }),
      message_received: (data) => ({
        subject: `New Message: ${data.subject} - ${data.project_name}`,
        html: this.generateMessageHTML(data),
        text: this.generateMessageText(data)
      }),
      system_announcement: (data) => ({
        subject: `System Announcement: ${data.title}`,
        html: this.generateAnnouncementHTML(data),
        text: this.generateAnnouncementText(data)
      })
    }

    const templateGenerator = templates[templateType]
    if (!templateGenerator) {
      throw new Error(`Unknown email template type: ${templateType}`)
    }

    return templateGenerator(data)
  }

  /**
   * Send email via configured provider
   */
  private async sendEmail(content: any): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
      switch (this.emailProvider) {
        case 'smtp':
          return await this.sendViaSMTP(content)
        case 'sendgrid':
          return await this.sendViaSendGrid(content)
        case 'ses':
          return await this.sendViaSES(content)
        default:
          throw new Error(`Unknown email provider: ${this.emailProvider}`)
      }
    } catch (error) {
      console.error('Email sending failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error'
      }
    }
  }

  /**
   * Send email via SMTP
   */
  private async sendViaSMTP(content: any): Promise<{ success: boolean; error?: string; messageId?: string }> {
    // Implementation would use nodemailer or similar
    console.log('Sending email via SMTP:', content.subject)
    
    // Mock implementation
    return {
      success: true,
      messageId: `smtp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
  }

  /**
   * Send email via SendGrid
   */
  private async sendViaSendGrid(content: any): Promise<{ success: boolean; error?: string; messageId?: string }> {
    // Implementation would use @sendgrid/mail
    console.log('Sending email via SendGrid:', content.subject)
    
    // Mock implementation
    return {
      success: true,
      messageId: `sendgrid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
  }

  /**
   * Send email via AWS SES
   */
  private async sendViaSES(content: any): Promise<{ success: boolean; error?: string; messageId?: string }> {
    // Implementation would use @aws-sdk/client-ses
    console.log('Sending email via AWS SES:', content.subject)
    
    // Mock implementation
    return {
      success: true,
      messageId: `ses-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
  }

  /**
   * Log email delivery for audit purposes
   */
  private async logEmailDelivery(data: {
    recipient: string
    template_type: ClientNotificationType
    success: boolean
    message_id?: string
    error?: string
    tracking_id?: string
  }): Promise<void> {
    try {
      // In a real implementation, this would log to database
      console.log('Email delivery log:', {
        ...data,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to log email delivery:', error)
    }
  }

  // Template generation methods (simplified versions)
  private generateDocumentSubmittedHTML(data: any): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Document Submitted</h2>
          <p>A new document has been submitted for your review:</p>
          <ul>
            <li><strong>Project:</strong> ${data.project_name}</li>
            <li><strong>Document:</strong> ${data.document_name}</li>
            <li><strong>Submitted by:</strong> ${data.submitted_by}</li>
          </ul>
          <a href="${data.document_url}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Document</a>
        </body>
      </html>
    `
  }

  private generateDocumentSubmittedText(data: any): string {
    return `
New Document Submitted

A new document has been submitted for your review:
- Project: ${data.project_name}
- Document: ${data.document_name}
- Submitted by: ${data.submitted_by}

View document: ${data.document_url}
    `.trim()
  }

  private generateApprovalRequiredHTML(data: any): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Document Approval Required</h2>
          <p>The following document requires your approval:</p>
          <ul>
            <li><strong>Project:</strong> ${data.project_name}</li>
            <li><strong>Document:</strong> ${data.document_name}</li>
            ${data.has_deadline ? `<li><strong>Deadline:</strong> ${data.deadline}</li>` : ''}
          </ul>
          <a href="${data.approval_url}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review & Approve</a>
        </body>
      </html>
    `
  }

  private generateApprovalRequiredText(data: any): string {
    return `
Document Approval Required

The following document requires your approval:
- Project: ${data.project_name}
- Document: ${data.document_name}
${data.has_deadline ? `- Deadline: ${data.deadline}` : ''}

Review and approve: ${data.approval_url}
    `.trim()
  }

  // Additional template methods would be implemented similarly...
  private generateApprovalReceivedHTML(data: any): string { return '' }
  private generateApprovalReceivedText(data: any): string { return '' }
  private generateMilestoneHTML(data: any): string { return '' }
  private generateMilestoneText(data: any): string { return '' }
  private generateScheduleChangeHTML(data: any): string { return '' }
  private generateScheduleChangeText(data: any): string { return '' }
  private generateBudgetUpdateHTML(data: any): string { return '' }
  private generateBudgetUpdateText(data: any): string { return '' }
  private generateQualityIssueHTML(data: any): string { return '' }
  private generateQualityIssueText(data: any): string { return '' }
  private generateDeliveryHTML(data: any): string { return '' }
  private generateDeliveryText(data: any): string { return '' }
  private generateMessageHTML(data: any): string { return '' }
  private generateMessageText(data: any): string { return '' }
  private generateAnnouncementHTML(data: any): string { return '' }
  private generateAnnouncementText(data: any): string { return '' }
}

// Export singleton instance
export const clientPortalEmailService = ClientPortalEmailService.getInstance()

// Convenience functions
export const sendClientDocumentApprovalEmail = clientPortalEmailService.sendDocumentApprovalEmail.bind(clientPortalEmailService)
export const sendClientDocumentSubmittedEmail = clientPortalEmailService.sendDocumentSubmittedEmail.bind(clientPortalEmailService)
export const sendClientProjectMilestoneEmail = clientPortalEmailService.sendProjectMilestoneEmail.bind(clientPortalEmailService)
export const sendClientScheduleChangeEmail = clientPortalEmailService.sendScheduleChangeEmail.bind(clientPortalEmailService)
export const sendClientNewMessageEmail = clientPortalEmailService.sendNewMessageEmail.bind(clientPortalEmailService)
export const sendClientQualityIssueEmail = clientPortalEmailService.sendQualityIssueEmail.bind(clientPortalEmailService)
export const sendClientBudgetUpdateEmail = clientPortalEmailService.sendBudgetUpdateEmail.bind(clientPortalEmailService)
export const sendClientDeliveryNotificationEmail = clientPortalEmailService.sendDeliveryNotificationEmail.bind(clientPortalEmailService)