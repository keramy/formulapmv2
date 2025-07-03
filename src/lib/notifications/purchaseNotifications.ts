/**
 * Formula PM 2.0 Purchase Notifications
 * Purchase Department Workflow Implementation
 * 
 * Integration with existing notification system for purchase events
 */

import { PurchaseRequest, PurchaseOrder, Vendor } from '@/types/purchase'

export interface PurchaseNotification {
  id: string
  type: 'purchase_request_created' | 'purchase_request_approved' | 'purchase_request_rejected' | 
        'purchase_order_created' | 'purchase_order_sent' | 'delivery_confirmed' | 
        'approval_required' | 'urgent_request'
  title: string
  message: string
  data: {
    requestId?: string
    orderId?: string
    vendorId?: string
    projectId?: string
    urgency?: 'low' | 'normal' | 'high' | 'emergency'
  }
  recipients: string[] // User IDs
  actions?: {
    label: string
    url: string
    type: 'primary' | 'secondary'
  }[]
  createdAt: Date
  expiresAt?: Date
}

export class PurchaseNotificationService {
  private static instance: PurchaseNotificationService
  private baseUrl: string = '/api/notifications'

  private constructor() {}

  public static getInstance(): PurchaseNotificationService {
    if (!PurchaseNotificationService.instance) {
      PurchaseNotificationService.instance = new PurchaseNotificationService()
    }
    return PurchaseNotificationService.instance
  }

  /**
   * Send notification when a purchase request is created
   */
  async notifyPurchaseRequestCreated(
    request: PurchaseRequest,
    projectManagerId: string,
    purchaseDepartmentIds: string[]
  ): Promise<void> {
    const isUrgent = request.urgency_level === 'high' || request.urgency_level === 'emergency'
    
    const notification: Omit<PurchaseNotification, 'id' | 'createdAt'> = {
      type: isUrgent ? 'urgent_request' : 'purchase_request_created',
      title: isUrgent 
        ? `🚨 Urgent Purchase Request: ${request.request_number}`
        : `New Purchase Request: ${request.request_number}`,
      message: `${request.item_description} - Qty: ${request.quantity} ${request.unit_of_measure}${isUrgent ? ' (URGENT)' : ''}`,
      data: {
        requestId: request.id,
        projectId: request.project_id,
        urgency: request.urgency_level
      },
      recipients: [projectManagerId, ...purchaseDepartmentIds],
      actions: [
        {
          label: 'Review Request',
          url: `/purchase?tab=requests&id=${request.id}`,
          type: 'primary'
        },
        {
          label: 'Approve',
          url: `/api/purchase/requests/${request.id}/approve`,
          type: 'secondary'
        }
      ],
      expiresAt: isUrgent 
        ? new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours for urgent
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days for normal
    }

    await this.sendNotification(notification)

    // Send immediate notifications for urgent requests
    if (isUrgent) {
      await this.sendUrgentNotification(request, [...new Set([projectManagerId, ...purchaseDepartmentIds])])
    }
  }

  /**
   * Send notification when a purchase request needs approval
   */
  async notifyApprovalRequired(
    request: PurchaseRequest,
    approverIds: string[],
    escalationLevel: 'normal' | 'manager' | 'director' = 'normal'
  ): Promise<void> {
    const urgencyIcon = {
      emergency: '🚨',
      high: '⚠️',
      normal: '📋',
      low: '📝'
    }

    const notification: Omit<PurchaseNotification, 'id' | 'createdAt'> = {
      type: 'approval_required',
      title: `${urgencyIcon[request.urgency_level]} Approval Required: ${request.request_number}`,
      message: `${request.item_description} - $${request.estimated_cost?.toLocaleString() || 'TBD'} - Due: ${new Date(request.required_date).toLocaleDateString()}`,
      data: {
        requestId: request.id,
        projectId: request.project_id,
        urgency: request.urgency_level
      },
      recipients: approverIds,
      actions: [
        {
          label: 'Approve',
          url: `/api/purchase/requests/${request.id}/approve`,
          type: 'primary'
        },
        {
          label: 'Review Details',
          url: `/purchase?tab=requests&id=${request.id}`,
          type: 'secondary'
        }
      ],
      expiresAt: new Date(Date.now() + 
        (request.urgency_level === 'emergency' ? 4 : 
         request.urgency_level === 'high' ? 24 : 
         48) * 60 * 60 * 1000) // 4h, 24h, or 48h based on urgency
    }

    await this.sendNotification(notification)
  }

  /**
   * Send notification when a purchase request is approved
   */
  async notifyPurchaseRequestApproved(
    request: PurchaseRequest,
    requesterId: string,
    purchaseDepartmentIds: string[]
  ): Promise<void> {
    const notification: Omit<PurchaseNotification, 'id' | 'createdAt'> = {
      type: 'purchase_request_approved',
      title: `✅ Request Approved: ${request.request_number}`,
      message: `Your purchase request for ${request.item_description} has been approved and forwarded to procurement.`,
      data: {
        requestId: request.id,
        projectId: request.project_id
      },
      recipients: [requesterId, ...purchaseDepartmentIds],
      actions: [
        {
          label: 'View Request',
          url: `/purchase?tab=requests&id=${request.id}`,
          type: 'primary'
        },
        {
          label: 'Create Order',
          url: `/purchase?tab=orders&create_from=${request.id}`,
          type: 'secondary'
        }
      ]
    }

    await this.sendNotification(notification)
  }

  /**
   * Send notification when a purchase request is rejected
   */
  async notifyPurchaseRequestRejected(
    request: PurchaseRequest,
    requesterId: string,
    reason: string
  ): Promise<void> {
    const notification: Omit<PurchaseNotification, 'id' | 'createdAt'> = {
      type: 'purchase_request_rejected',
      title: `❌ Request Rejected: ${request.request_number}`,
      message: `Your purchase request for ${request.item_description} was rejected. Reason: ${reason}`,
      data: {
        requestId: request.id,
        projectId: request.project_id
      },
      recipients: [requesterId],
      actions: [
        {
          label: 'View Details',
          url: `/purchase?tab=requests&id=${request.id}`,
          type: 'primary'
        },
        {
          label: 'Resubmit Request',
          url: `/purchase?tab=requests&resubmit=${request.id}`,
          type: 'secondary'
        }
      ]
    }

    await this.sendNotification(notification)
  }

  /**
   * Send notification when a purchase order is created
   */
  async notifyPurchaseOrderCreated(
    order: PurchaseOrder,
    request: PurchaseRequest,
    vendor: Vendor,
    stakeholderIds: string[]
  ): Promise<void> {
    const notification: Omit<PurchaseNotification, 'id' | 'createdAt'> = {
      type: 'purchase_order_created',
      title: `📋 Purchase Order Created: ${order.po_number}`,
      message: `PO for ${request.item_description} sent to ${vendor.company_name} - $${order.total_amount.toLocaleString()}`,
      data: {
        orderId: order.id,
        requestId: request.id,
        vendorId: vendor.id,
        projectId: request.project_id
      },
      recipients: stakeholderIds,
      actions: [
        {
          label: 'View Order',
          url: `/purchase?tab=orders&id=${order.id}`,
          type: 'primary'
        },
        {
          label: 'Track Delivery',
          url: `/purchase?tab=deliveries&order=${order.id}`,
          type: 'secondary'
        }
      ]
    }

    await this.sendNotification(notification)
  }

  /**
   * Send notification when delivery is confirmed
   */
  async notifyDeliveryConfirmed(
    order: PurchaseOrder,
    request: PurchaseRequest,
    deliveryDetails: {
      deliveredQuantity: number
      deliveryDate: Date
      receivedBy: string
    },
    stakeholderIds: string[]
  ): Promise<void> {
    const notification: Omit<PurchaseNotification, 'id' | 'createdAt'> = {
      type: 'delivery_confirmed',
      title: `📦 Delivery Confirmed: ${order.po_number}`,
      message: `${request.item_description} delivered (${deliveryDetails.deliveredQuantity} units) - Received by ${deliveryDetails.receivedBy}`,
      data: {
        orderId: order.id,
        requestId: request.id,
        projectId: request.project_id
      },
      recipients: stakeholderIds,
      actions: [
        {
          label: 'View Delivery',
          url: `/purchase?tab=deliveries&id=${order.id}`,
          type: 'primary'
        }
      ]
    }

    await this.sendNotification(notification)
  }

  /**
   * Send urgent notification with immediate delivery
   */
  private async sendUrgentNotification(
    request: PurchaseRequest,
    recipientIds: string[]
  ): Promise<void> {
    const urgentNotification: Omit<PurchaseNotification, 'id' | 'createdAt'> = {
      type: 'urgent_request',
      title: `🚨 URGENT: Immediate Action Required`,
      message: `Emergency purchase request ${request.request_number} requires immediate approval - ${request.item_description}`,
      data: {
        requestId: request.id,
        projectId: request.project_id,
        urgency: request.urgency_level
      },
      recipients: recipientIds,
      actions: [
        {
          label: 'APPROVE NOW',
          url: `/api/purchase/requests/${request.id}/approve`,
          type: 'primary'
        },
        {
          label: 'Review Emergency Request',
          url: `/purchase?tab=requests&id=${request.id}&urgent=true`,
          type: 'secondary'
        }
      ],
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 hours
    }

    // Send with high priority flag
    await this.sendNotification(urgentNotification, { priority: 'high', immediate: true })
  }

  /**
   * Send notification to the system
   */
  private async sendNotification(
    notification: Omit<PurchaseNotification, 'id' | 'createdAt'>,
    options: { priority?: 'low' | 'normal' | 'high'; immediate?: boolean } = {}
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...notification,
          priority: options.priority || 'normal',
          immediate: options.immediate || false,
          source: 'purchase_department',
          createdAt: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error(`Notification service error: ${response.statusText}`)
      }

      // Log notification send for analytics
      await this.logNotificationSend(notification, options)
    } catch (error) {
      console.error('Error sending purchase notification:', error)
      // Don't throw here to avoid breaking the main purchase flow
    }
  }

  /**
   * Log notification send for analytics
   */
  private async logNotificationSend(
    notification: Omit<PurchaseNotification, 'id' | 'createdAt'>,
    options: { priority?: string; immediate?: boolean }
  ): Promise<void> {
    try {
      await fetch('/api/analytics/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: notification.type,
          recipientCount: notification.recipients.length,
          priority: options.priority,
          immediate: options.immediate,
          module: 'purchase',
          timestamp: new Date().toISOString()
        })
      })
    } catch (error) {
      console.error('Error logging notification send:', error)
      // Silent fail for analytics
    }
  }

  /**
   * Get purchase-related notifications for a user
   */
  async getUserPurchaseNotifications(
    userId: string,
    options: {
      unreadOnly?: boolean
      limit?: number
      types?: string[]
    } = {}
  ): Promise<PurchaseNotification[]> {
    try {
      const queryParams = new URLSearchParams({
        user_id: userId,
        module: 'purchase',
        ...(options.unreadOnly && { unread_only: 'true' }),
        ...(options.limit && { limit: options.limit.toString() }),
        ...(options.types && { types: options.types.join(',') })
      })

      const response = await fetch(`${this.baseUrl}/user?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`)
      }

      const data = await response.json()
      return data.notifications || []
    } catch (error) {
      console.error('Error fetching purchase notifications:', error)
      return []
    }
  }
}

// Export singleton instance
export const purchaseNotificationService = PurchaseNotificationService.getInstance()

// Export utility functions for easy use
export const notifyPurchaseRequestCreated = (
  request: PurchaseRequest,
  projectManagerId: string,
  purchaseDepartmentIds: string[]
) => purchaseNotificationService.notifyPurchaseRequestCreated(request, projectManagerId, purchaseDepartmentIds)

export const notifyApprovalRequired = (
  request: PurchaseRequest,
  approverIds: string[],
  escalationLevel?: 'normal' | 'manager' | 'director'
) => purchaseNotificationService.notifyApprovalRequired(request, approverIds, escalationLevel)

export const notifyPurchaseRequestApproved = (
  request: PurchaseRequest,
  requesterId: string,
  purchaseDepartmentIds: string[]
) => purchaseNotificationService.notifyPurchaseRequestApproved(request, requesterId, purchaseDepartmentIds)

export const notifyPurchaseRequestRejected = (
  request: PurchaseRequest,
  requesterId: string,
  reason: string
) => purchaseNotificationService.notifyPurchaseRequestRejected(request, requesterId, reason)

export const notifyPurchaseOrderCreated = (
  order: PurchaseOrder,
  request: PurchaseRequest,
  vendor: Vendor,
  stakeholderIds: string[]
) => purchaseNotificationService.notifyPurchaseOrderCreated(order, request, vendor, stakeholderIds)

export const notifyDeliveryConfirmed = (
  order: PurchaseOrder,
  request: PurchaseRequest,
  deliveryDetails: {
    deliveredQuantity: number
    deliveryDate: Date
    receivedBy: string
  },
  stakeholderIds: string[]
) => purchaseNotificationService.notifyDeliveryConfirmed(order, request, deliveryDetails, stakeholderIds)