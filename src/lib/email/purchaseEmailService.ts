/**
 * Formula PM 2.0 Purchase Email Service
 * Purchase Department Workflow Implementation
 * 
 * Email integration framework for purchase order sending and notifications
 */

import { PurchaseOrder, PurchaseRequest, Vendor } from '@/types/purchase'

export interface EmailTemplate {
  subject: string
  body: string
  attachments?: string[]
}

export interface EmailRecipient {
  email: string
  name?: string
  type: 'vendor' | 'internal' | 'client'
}

export interface EmailSendResult {
  success: boolean
  messageId?: string
  error?: string
  deliveredTo: string[]
  failedTo: string[]
}

export class PurchaseEmailService {
  private static instance: PurchaseEmailService
  private apiKey: string | null = null
  private baseUrl: string = '/api/email'

  private constructor() {
    // Initialize with environment variables if available
    this.apiKey = process.env.NEXT_PUBLIC_EMAIL_API_KEY || null
  }

  public static getInstance(): PurchaseEmailService {
    if (!PurchaseEmailService.instance) {
      PurchaseEmailService.instance = new PurchaseEmailService()
    }
    return PurchaseEmailService.instance
  }

  /**
   * Send purchase order to vendor
   */
  async sendPurchaseOrder(
    order: PurchaseOrder,
    vendor: Vendor,
    request: PurchaseRequest,
    options: {
      ccEmails?: string[]
      includeAttachments?: boolean
      urgent?: boolean
    } = {}
  ): Promise<EmailSendResult> {
    try {
      const template = this.generatePurchaseOrderTemplate(order, vendor, request, options)
      const recipients = this.buildRecipientList(vendor, options.ccEmails)

      const emailData = {
        to: recipients,
        subject: template.subject,
        body: template.body,
        attachments: template.attachments,
        metadata: {
          type: 'purchase_order',
          orderId: order.id,
          vendorId: vendor.id,
          urgent: options.urgent || false
        }
      }

      const response = await fetch(`${this.baseUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify(emailData)
      })

      if (!response.ok) {
        throw new Error(`Email service error: ${response.statusText}`)
      }

      const result = await response.json()
      
      // Log the email send for audit purposes
      await this.logEmailSend({
        type: 'purchase_order',
        orderId: order.id,
        vendorId: vendor.id,
        recipients: recipients.map(r => r.email),
        success: result.success,
        messageId: result.messageId
      })

      return result
    } catch (error) {
      console.error('Error sending purchase order email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        deliveredTo: [],
        failedTo: []
      }
    }
  }

  /**
   * Send purchase request approval notification
   */
  async sendApprovalNotification(
    request: PurchaseRequest,
    approvers: string[],
    requestUrl: string,
    urgent: boolean = false
  ): Promise<EmailSendResult> {
    try {
      const template = this.generateApprovalNotificationTemplate(request, requestUrl, urgent)
      const recipients = approvers.map(email => ({ email, type: 'internal' as const }))

      const emailData = {
        to: recipients,
        subject: template.subject,
        body: template.body,
        metadata: {
          type: 'approval_notification',
          requestId: request.id,
          urgent
        }
      }

      const response = await fetch(`${this.baseUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify(emailData)
      })

      if (!response.ok) {
        throw new Error(`Email service error: ${response.statusText}`)
      }

      const result = await response.json()
      
      await this.logEmailSend({
        type: 'approval_notification',
        requestId: request.id,
        recipients: approvers,
        success: result.success,
        messageId: result.messageId
      })

      return result
    } catch (error) {
      console.error('Error sending approval notification:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        deliveredTo: [],
        failedTo: []
      }
    }
  }

  /**
   * Send delivery confirmation notification
   */
  async sendDeliveryConfirmation(
    order: PurchaseOrder,
    deliveryDetails: {
      deliveredQuantity: number
      deliveryDate: Date
      receivedBy: string
      notes?: string
      photos?: string[]
    }
  ): Promise<EmailSendResult> {
    try {
      const template = this.generateDeliveryConfirmationTemplate(order, deliveryDetails)
      
      // Send to internal stakeholders
      const recipients = [
        { email: 'purchase@company.com', type: 'internal' as const },
        // Add project manager, requester, etc.
      ]

      const emailData = {
        to: recipients,
        subject: template.subject,
        body: template.body,
        attachments: deliveryDetails.photos,
        metadata: {
          type: 'delivery_confirmation',
          orderId: order.id
        }
      }

      const response = await fetch(`${this.baseUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify(emailData)
      })

      if (!response.ok) {
        throw new Error(`Email service error: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error sending delivery confirmation:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        deliveredTo: [],
        failedTo: []
      }
    }
  }

  /**
   * Generate purchase order email template
   */
  private generatePurchaseOrderTemplate(
    order: PurchaseOrder,
    vendor: Vendor,
    request: PurchaseRequest,
    options: { urgent?: boolean } = {}
  ): EmailTemplate {
    const urgentFlag = options.urgent ? '[URGENT] ' : ''
    
    const subject = `${urgentFlag}Purchase Order ${order.po_number} - ${request.item_description}`
    
    const body = `
Dear ${vendor.contact_person || vendor.company_name},

We are pleased to send you Purchase Order ${order.po_number} for your review and confirmation.

Order Details:
- PO Number: ${order.po_number}
- Item: ${request.item_description}
- Quantity: ${request.quantity} ${request.unit_of_measure}
- Total Amount: $${order.total_amount.toLocaleString()}
- Expected Delivery: ${order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString() : 'TBD'}

${options.urgent ? '⚠️ THIS IS AN URGENT ORDER - Please confirm receipt and expected delivery time within 24 hours.' : ''}

Terms & Conditions:
${order.terms_conditions || 'Standard payment terms apply.'}

Please confirm receipt of this purchase order and provide:
1. Order confirmation with delivery schedule
2. Any special requirements or considerations
3. Contact information for delivery coordination

If you have any questions, please don't hesitate to contact us.

Best regards,
Formula PM Purchase Department

---
This is an automated message from Formula PM 2.0
PO Reference: ${order.id}
Generated: ${new Date().toLocaleString()}
    `.trim()

    return {
      subject,
      body,
      attachments: [`po_${order.po_number}.pdf`] // PDF generation would be handled separately
    }
  }

  /**
   * Generate approval notification template
   */
  private generateApprovalNotificationTemplate(
    request: PurchaseRequest,
    requestUrl: string,
    urgent: boolean
  ): EmailTemplate {
    const urgentFlag = urgent ? '[URGENT] ' : ''
    
    const subject = `${urgentFlag}Purchase Request Approval Required - ${request.request_number}`
    
    const body = `
A purchase request requires your approval:

Request Details:
- Request Number: ${request.request_number}
- Item: ${request.item_description}
- Quantity: ${request.quantity} ${request.unit_of_measure}
- Estimated Cost: $${request.estimated_cost?.toLocaleString() || 'TBD'}
- Required Date: ${new Date(request.required_date).toLocaleDateString()}
- Urgency: ${request.urgency_level.toUpperCase()}

${urgent ? '⚠️ URGENT APPROVAL REQUIRED' : ''}

Justification:
${request.justification || 'No justification provided.'}

Please review and approve/reject this request:
${requestUrl}

Time-sensitive requests require prompt attention to avoid project delays.

---
Formula PM 2.0 Purchase Management
Request ID: ${request.id}
    `.trim()

    return {
      subject,
      body
    }
  }

  /**
   * Generate delivery confirmation template
   */
  private generateDeliveryConfirmationTemplate(
    order: PurchaseOrder,
    deliveryDetails: {
      deliveredQuantity: number
      deliveryDate: Date
      receivedBy: string
      notes?: string
      photos?: string[]
    }
  ): EmailTemplate {
    const subject = `Delivery Confirmed - PO ${order.po_number}`
    
    const body = `
Delivery confirmation for Purchase Order ${order.po_number}:

Delivery Details:
- Delivered Quantity: ${deliveryDetails.deliveredQuantity}
- Delivery Date: ${deliveryDetails.deliveryDate.toLocaleDateString()}
- Received By: ${deliveryDetails.receivedBy}
- Order Total: $${order.total_amount.toLocaleString()}

${deliveryDetails.notes ? `Notes: ${deliveryDetails.notes}` : ''}

${deliveryDetails.photos?.length ? `${deliveryDetails.photos.length} delivery photo(s) attached.` : ''}

This delivery has been logged in the Formula PM system.

---
Formula PM 2.0 Purchase Management
Order ID: ${order.id}
    `.trim()

    return {
      subject,
      body,
      attachments: deliveryDetails.photos
    }
  }

  /**
   * Build recipient list for emails
   */
  private buildRecipientList(vendor: Vendor, ccEmails: string[] = []): EmailRecipient[] {
    const recipients: EmailRecipient[] = []

    // Primary vendor contact
    if (vendor.email) {
      recipients.push({
        email: vendor.email,
        name: vendor.contact_person || vendor.company_name,
        type: 'vendor'
      })
    }

    // CC recipients
    ccEmails.forEach(email => {
      recipients.push({
        email,
        type: 'internal'
      })
    })

    return recipients
  }

  /**
   * Log email send for audit purposes
   */
  private async logEmailSend(logData: {
    type: string
    orderId?: string
    requestId?: string
    vendorId?: string
    recipients: string[]
    success: boolean
    messageId?: string
  }): Promise<void> {
    try {
      await fetch('/api/purchase/email-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...logData,
          timestamp: new Date().toISOString()
        })
      })
    } catch (error) {
      console.error('Error logging email send:', error)
      // Don't throw here, as logging shouldn't break the main flow
    }
  }

  /**
   * Test email service connectivity
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/test`, {
        method: 'GET',
        headers: {
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        }
      })

      if (!response.ok) {
        throw new Error(`Email service test failed: ${response.statusText}`)
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Export singleton instance
export const purchaseEmailService = PurchaseEmailService.getInstance()

// Export utility functions
export const sendPurchaseOrderEmail = (
  order: PurchaseOrder,
  vendor: Vendor,
  request: PurchaseRequest,
  options?: { ccEmails?: string[]; urgent?: boolean }
) => purchaseEmailService.sendPurchaseOrder(order, vendor, request, options)

export const sendApprovalNotificationEmail = (
  request: PurchaseRequest,
  approvers: string[],
  requestUrl: string,
  urgent?: boolean
) => purchaseEmailService.sendApprovalNotification(request, approvers, requestUrl, urgent)

export const sendDeliveryConfirmationEmail = (
  order: PurchaseOrder,
  deliveryDetails: {
    deliveredQuantity: number
    deliveryDate: Date
    receivedBy: string
    notes?: string
    photos?: string[]
  }
) => purchaseEmailService.sendDeliveryConfirmation(order, deliveryDetails)