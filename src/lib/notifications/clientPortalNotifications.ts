/**
 * Client Portal Notification System Integration
 * Integrates client portal notifications with existing Formula PM notification system
 * Maintains security isolation while providing unified notification management
 */

import { 
  ClientNotificationType, 
  ClientPriority, 
  ClientDeliveryMethod,
  ClientNotification
} from '@/types/client-portal'

// Integration with existing notification patterns
interface ClientNotificationPayload {
  client_user_id: string
  project_id?: string
  title: string
  message: string
  notification_type: ClientNotificationType
  priority: ClientPriority
  delivery_method?: ClientDeliveryMethod[]
  metadata?: Record<string, any>
  scheduled_for?: Date
}

interface ClientNotificationBatch {
  notifications: ClientNotificationPayload[]
  send_immediately?: boolean
}

/**
 * Client Portal Notification Manager
 * Handles creation, delivery, and management of client portal notifications
 */
export class ClientPortalNotificationManager {
  private static instance: ClientPortalNotificationManager
  private pendingNotifications: Map<string, ClientNotificationPayload[]> = new Map()

  static getInstance(): ClientPortalNotificationManager {
    if (!ClientPortalNotificationManager.instance) {
      ClientPortalNotificationManager.instance = new ClientPortalNotificationManager()
    }
    return ClientPortalNotificationManager.instance
  }

  /**
   * Create a single client notification
   */
  async createNotification(payload: ClientNotificationPayload): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/client-portal/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...payload,
          delivery_method: payload.delivery_method || ['in_app'],
          scheduled_for: payload.scheduled_for || new Date()
        })
      })

      if (!response.ok) {
        throw new Error(`Notification creation failed: ${response.statusText}`)
      }

      const result = await response.json()
      return { success: result.success, error: result.error }
    } catch (error) {
      console.error('Failed to create client notification:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Create multiple notifications in batch
   */
  async createBatchNotifications(batch: ClientNotificationBatch): Promise<{ success: boolean; errors?: string[] }> {
    const results = await Promise.allSettled(
      batch.notifications.map(notification => this.createNotification(notification))
    )

    const errors: string[] = []
    let successCount = 0

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        successCount++
      } else if (result.status === 'fulfilled' && result.value.error) {
        errors.push(`Notification ${index + 1}: ${result.value.error}`)
      } else if (result.status === 'rejected') {
        errors.push(`Notification ${index + 1}: ${result.reason}`)
      }
    })

    return {
      success: successCount === batch.notifications.length,
      errors: errors.length > 0 ? errors : undefined
    }
  }

  /**
   * Document approval notification
   */
  async notifyDocumentApprovalRequired(
    clientUserId: string,
    projectId: string,
    documentId: string,
    documentName: string,
    deadline?: Date
  ): Promise<void> {
    await this.createNotification({
      client_user_id: clientUserId,
      project_id: projectId,
      title: 'Document Approval Required',
      message: `The document "${documentName}" is ready for your review and approval.`,
      notification_type: 'approval_required',
      priority: deadline ? 'high' : 'medium',
      delivery_method: ['in_app', 'email'],
      metadata: {
        document_id: documentId,
        document_name: documentName,
        deadline: deadline?.toISOString()
      },
      scheduled_for: new Date()
    })
  }

  /**
   * Document submitted notification
   */
  async notifyDocumentSubmitted(
    clientUserId: string,
    projectId: string,
    documentId: string,
    documentName: string,
    submittedBy: string
  ): Promise<void> {
    await this.createNotification({
      client_user_id: clientUserId,
      project_id: projectId,
      title: 'New Document Submitted',
      message: `A new document "${documentName}" has been submitted for your review by ${submittedBy}.`,
      notification_type: 'document_submitted',
      priority: 'medium',
      delivery_method: ['in_app', 'email'],
      metadata: {
        document_id: documentId,
        document_name: documentName,
        submitted_by: submittedBy
      }
    })
  }

  /**
   * Project milestone notification
   */
  async notifyProjectMilestone(
    clientUserId: string,
    projectId: string,
    milestoneName: string,
    milestoneDate: Date,
    description?: string
  ): Promise<void> {
    await this.createNotification({
      client_user_id: clientUserId,
      project_id: projectId,
      title: 'Project Milestone Reached',
      message: `Project milestone "${milestoneName}" has been reached.${description ? ` ${description}` : ''}`,
      notification_type: 'project_milestone',
      priority: 'medium',
      delivery_method: ['in_app', 'email'],
      metadata: {
        milestone_name: milestoneName,
        milestone_date: milestoneDate.toISOString(),
        description
      }
    })
  }

  /**
   * Schedule change notification
   */
  async notifyScheduleChange(
    clientUserId: string,
    projectId: string,
    changeDescription: string,
    newDate?: Date,
    impact?: string
  ): Promise<void> {
    await this.createNotification({
      client_user_id: clientUserId,
      project_id: projectId,
      title: 'Project Schedule Updated',
      message: `There has been a change to your project schedule: ${changeDescription}`,
      notification_type: 'schedule_change',
      priority: impact === 'high' ? 'high' : 'medium',
      delivery_method: ['in_app', 'email'],
      metadata: {
        change_description: changeDescription,
        new_date: newDate?.toISOString(),
        impact
      }
    })
  }

  /**
   * New message notification
   */
  async notifyNewMessage(
    clientUserId: string,
    projectId: string,
    threadId: string,
    senderName: string,
    subject: string,
    preview: string
  ): Promise<void> {
    await this.createNotification({
      client_user_id: clientUserId,
      project_id: projectId,
      title: 'New Message Received',
      message: `${senderName} sent you a message: "${preview.substring(0, 100)}${preview.length > 100 ? '...' : ''}"`,
      notification_type: 'message_received',
      priority: 'medium',
      delivery_method: ['in_app', 'email'],
      metadata: {
        thread_id: threadId,
        sender_name: senderName,
        subject,
        preview
      }
    })
  }

  /**
   * System announcement notification
   */
  async notifySystemAnnouncement(
    clientUserIds: string[],
    title: string,
    message: string,
    priority: ClientPriority = 'medium',
    scheduledFor?: Date
  ): Promise<void> {
    const notifications = clientUserIds.map(clientUserId => ({
      client_user_id: clientUserId,
      title,
      message,
      notification_type: 'system_announcement' as ClientNotificationType,
      priority,
      delivery_method: ['in_app', 'email'] as ClientDeliveryMethod[],
      scheduled_for: scheduledFor || new Date()
    }))

    await this.createBatchNotifications({
      notifications,
      send_immediately: !scheduledFor
    })
  }

  /**
   * Quality issue notification
   */
  async notifyQualityIssue(
    clientUserId: string,
    projectId: string,
    issueDescription: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    affectedItems?: string[]
  ): Promise<void> {
    const priorityMap = {
      low: 'low' as ClientPriority,
      medium: 'medium' as ClientPriority,
      high: 'high' as ClientPriority,
      critical: 'urgent' as ClientPriority
    }

    await this.createNotification({
      client_user_id: clientUserId,
      project_id: projectId,
      title: `Quality Issue - ${severity.charAt(0).toUpperCase() + severity.slice(1)} Priority`,
      message: `A quality issue has been identified: ${issueDescription}`,
      notification_type: 'quality_issue',
      priority: priorityMap[severity],
      delivery_method: severity === 'critical' ? ['in_app', 'email', 'sms'] : ['in_app', 'email'],
      metadata: {
        issue_description: issueDescription,
        severity,
        affected_items: affectedItems
      }
    })
  }

  /**
   * Budget update notification
   */
  async notifyBudgetUpdate(
    clientUserId: string,
    projectId: string,
    updateType: 'increase' | 'decrease' | 'change_order',
    amount: number,
    reason: string,
    requiresApproval: boolean = false
  ): Promise<void> {
    const title = requiresApproval 
      ? 'Budget Change Approval Required'
      : 'Project Budget Updated'

    await this.createNotification({
      client_user_id: clientUserId,
      project_id: projectId,
      title,
      message: `Project budget ${updateType}: $${amount.toLocaleString()}. Reason: ${reason}`,
      notification_type: 'budget_update',
      priority: requiresApproval ? 'high' : 'medium',
      delivery_method: requiresApproval ? ['in_app', 'email'] : ['in_app'],
      metadata: {
        update_type: updateType,
        amount,
        reason,
        requires_approval: requiresApproval
      }
    })
  }

  /**
   * Delivery notification
   */
  async notifyDelivery(
    clientUserId: string,
    projectId: string,
    deliveryType: 'material' | 'equipment' | 'document',
    description: string,
    expectedDate?: Date,
    actualDate?: Date
  ): Promise<void> {
    const isDelayed = expectedDate && actualDate && actualDate > expectedDate
    const title = actualDate 
      ? `${deliveryType.charAt(0).toUpperCase() + deliveryType.slice(1)} Delivered`
      : `${deliveryType.charAt(0).toUpperCase() + deliveryType.slice(1)} Delivery Scheduled`

    await this.createNotification({
      client_user_id: clientUserId,
      project_id: projectId,
      title: isDelayed ? `${title} (Delayed)` : title,
      message: `${description}${actualDate ? ` delivered on ${actualDate.toLocaleDateString()}` : ` scheduled for ${expectedDate?.toLocaleDateString()}`}`,
      notification_type: 'delivery_notification',
      priority: isDelayed ? 'high' : 'medium',
      delivery_method: ['in_app', 'email'],
      metadata: {
        delivery_type: deliveryType,
        description,
        expected_date: expectedDate?.toISOString(),
        actual_date: actualDate?.toISOString(),
        is_delayed: isDelayed
      }
    })
  }

  /**
   * Get notification preferences for a client
   */
  async getClientNotificationPreferences(clientUserId: string): Promise<Record<string, any> | null> {
    try {
      const response = await fetch(`/api/client-portal/notifications/preferences?client_user_id=${clientUserId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch notification preferences')
      }

      const result = await response.json()
      return result.success ? result.data : null
    } catch (error) {
      console.error('Failed to get client notification preferences:', error)
      return null
    }
  }

  /**
   * Update notification preferences for a client
   */
  async updateClientNotificationPreferences(
    clientUserId: string, 
    preferences: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/client-portal/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_user_id: clientUserId,
          preferences
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update notification preferences')
      }

      const result = await response.json()
      return { success: result.success, error: result.error }
    } catch (error) {
      console.error('Failed to update client notification preferences:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Mark notifications as read
   */
  async markNotificationsAsRead(
    clientUserId: string, 
    notificationIds: string[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/client-portal/notifications/bulk/read', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_user_id: clientUserId,
          notification_ids: notificationIds
        })
      })

      if (!response.ok) {
        throw new Error('Failed to mark notifications as read')
      }

      const result = await response.json()
      return { success: result.success, error: result.error }
    } catch (error) {
      console.error('Failed to mark notifications as read:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
}

// Export singleton instance
export const clientPortalNotifications = ClientPortalNotificationManager.getInstance()

// Convenience functions for common notification types
export const notifyClientDocumentApproval = clientPortalNotifications.notifyDocumentApprovalRequired.bind(clientPortalNotifications)
export const notifyClientDocumentSubmitted = clientPortalNotifications.notifyDocumentSubmitted.bind(clientPortalNotifications)
export const notifyClientProjectMilestone = clientPortalNotifications.notifyProjectMilestone.bind(clientPortalNotifications)
export const notifyClientScheduleChange = clientPortalNotifications.notifyScheduleChange.bind(clientPortalNotifications)
export const notifyClientNewMessage = clientPortalNotifications.notifyNewMessage.bind(clientPortalNotifications)
export const notifyClientQualityIssue = clientPortalNotifications.notifyQualityIssue.bind(clientPortalNotifications)
export const notifyClientBudgetUpdate = clientPortalNotifications.notifyBudgetUpdate.bind(clientPortalNotifications)
export const notifyClientDelivery = clientPortalNotifications.notifyDelivery.bind(clientPortalNotifications)

// Integration hooks for existing Formula PM systems
export interface ClientNotificationIntegrationHooks {
  onDocumentApprovalStatusChange?: (documentId: string, status: string, clientUserIds: string[]) => Promise<void>
  onProjectMilestoneReached?: (projectId: string, milestone: any, clientUserIds: string[]) => Promise<void>
  onScheduleChange?: (projectId: string, change: any, clientUserIds: string[]) => Promise<void>
  onQualityIssueCreated?: (projectId: string, issue: any, clientUserIds: string[]) => Promise<void>
  onBudgetChange?: (projectId: string, budgetChange: any, clientUserIds: string[]) => Promise<void>
}

/**
 * Register integration hooks for automatic notifications
 */
export function registerClientNotificationHooks(hooks: ClientNotificationIntegrationHooks): void {
  // In a real implementation, these would be registered with the respective systems
  console.log('Client notification hooks registered:', Object.keys(hooks))
}