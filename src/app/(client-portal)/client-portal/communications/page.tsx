/**
 * Client Portal Communications Page
 * Message threads and team communication for external clients
 */

'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ClientCommunicationHub } from '@/components/client-portal/communications/ClientCommunicationHub'
import { MessageSquare } from 'lucide-react'

export default function ClientPortalCommunicationsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams?.get('project') || undefined

  // Handle thread selection
  const handleThreadSelect = (threadId: string) => {
    // Update URL to reflect selected thread if needed
    const params = new URLSearchParams(searchParams?.toString())
    params.set('thread', threadId)
    router.push(`/client-portal/communications?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-6 h-6" />
          Communications
          {projectId && (
            <span className="text-lg font-normal text-gray-600">
              - Project Filter Active
            </span>
          )}
        </h1>
        <p className="text-gray-600 mt-1">
          Communicate with your project team, ask questions, and stay updated on project discussions.
        </p>
      </div>

      {/* Communication Hub */}
      <ClientCommunicationHub
        projectId={projectId}
        onThreadSelect={handleThreadSelect}
        mobileOptimized={true}
      />
    </div>
  )
}