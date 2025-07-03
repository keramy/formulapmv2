/**
 * Client Portal Dashboard Page
 * Main dashboard for external clients
 * Mobile-first responsive design
 */

'use client'

import { useState } from 'react'
import { ClientDashboard } from '@/components/client-portal/dashboard/ClientDashboard'
import { useClientPortalCoordinator } from '@/components/client-portal/ClientPortalCoordinator'
import { useRouter } from 'next/navigation'

export default function ClientPortalDashboardPage() {
  const router = useRouter()
  
  const {
    state,
    dashboardData,
    loading,
    error,
    coordinateProjectSelection,
    coordinateDocumentDownload,
    coordinateNotificationManagement
  } = useClientPortalCoordinator({
    initialView: 'dashboard',
    mobileOptimized: true
  })

  // Handle project selection
  const handleProjectSelect = async (projectId: string) => {
    await coordinateProjectSelection(projectId)
    router.push(`/client-portal/projects/${projectId}`)
  }

  // Handle document view
  const handleDocumentView = (documentId: string) => {
    if (documentId) {
      router.push(`/client-portal/documents/${documentId}`)
    } else {
      router.push('/client-portal/documents')
    }
  }

  // Handle notification click
  const handleNotificationClick = async (notificationId: string) => {
    await coordinateNotificationManagement('mark_read', notificationId)
    router.push('/client-portal/notifications')
  }

  return (
    <ClientDashboard
      onProjectSelect={handleProjectSelect}
      onDocumentView={handleDocumentView}
      onNotificationClick={handleNotificationClick}
      mobileOptimized={true}
    />
  )
}