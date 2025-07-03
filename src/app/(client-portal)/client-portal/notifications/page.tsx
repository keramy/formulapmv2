/**
 * Client Portal Notifications Page
 * Notification center and preferences for external clients
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClientNotificationCenter } from '@/components/client-portal/notifications/ClientNotificationCenter'
import { useClientPortalCoordinator } from '@/components/client-portal/ClientPortalCoordinator'
import { Bell } from 'lucide-react'
import { ClientNotification } from '@/types/client-portal'

export default function ClientPortalNotificationsPage() {
  const router = useRouter()

  const {
    coordinateNotificationManagement
  } = useClientPortalCoordinator({
    mobileOptimized: true
  })

  // Handle notification click
  const handleNotificationClick = async (notification: ClientNotification) => {
    // Mark as read
    await coordinateNotificationManagement('mark_read', notification.id)

    // Navigate based on notification type
    switch (notification.notification_type) {
      case 'document_submitted':
      case 'approval_required':
        if (notification.project_id) {
          router.push(`/client-portal/documents?project=${notification.project_id}`)
        } else {
          router.push('/client-portal/documents')
        }
        break
      case 'message_received':
        if (notification.project_id) {
          router.push(`/client-portal/communications?project=${notification.project_id}`)
        } else {
          router.push('/client-portal/communications')
        }
        break
      case 'project_milestone':
      case 'schedule_change':
        if (notification.project_id) {
          router.push(`/client-portal/projects/${notification.project_id}`)
        } else {
          router.push('/client-portal/projects')
        }
        break
      default:
        // Stay on notifications page for other types
        break
    }
  }

  // Handle settings change
  const handleSettingsChange = async (preferences: any) => {
    // This would typically save to the backend
    console.log('Saving notification preferences:', preferences)
    // You could call an API endpoint here
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="w-6 h-6" />
          Notifications
        </h1>
        <p className="text-gray-600 mt-1">
          Stay updated with project activities, approvals, and important announcements.
        </p>
      </div>

      {/* Notification Center */}
      <ClientNotificationCenter
        onNotificationClick={handleNotificationClick}
        onSettingsChange={handleSettingsChange}
        mobileOptimized={true}
      />
    </div>
  )
}