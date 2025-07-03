/**
 * Client Portal Documents Page
 * Document library and management for external clients
 */

'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ClientDocumentLibrary } from '@/components/client-portal/documents/ClientDocumentLibrary'
import { useClientPortalCoordinator } from '@/components/client-portal/ClientPortalCoordinator'
import { FileText } from 'lucide-react'

export default function ClientPortalDocumentsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams?.get('project') || undefined

  const {
    coordinateDocumentDownload,
    coordinateDocumentApproval
  } = useClientPortalCoordinator({
    projectId,
    mobileOptimized: true
  })

  // Handle document selection
  const handleDocumentSelect = (documentId: string) => {
    router.push(`/client-portal/documents/${documentId}`)
  }

  // Handle document download
  const handleDocumentDownload = async (documentId: string) => {
    // Get document name from the documents list if needed
    const documentName = `document-${documentId}`
    await coordinateDocumentDownload(documentId, documentName)
  }

  // Handle document approval
  const handleDocumentApprove = (documentId: string) => {
    router.push(`/client-portal/documents/${documentId}/approve`)
  }

  // Handle document comment
  const handleDocumentComment = (documentId: string) => {
    router.push(`/client-portal/documents/${documentId}#comments`)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-6 h-6" />
          Documents
          {projectId && (
            <span className="text-lg font-normal text-gray-600">
              - Project Filter Active
            </span>
          )}
        </h1>
        <p className="text-gray-600 mt-1">
          Access, review, and approve project documents. Download files and provide feedback.
        </p>
      </div>

      {/* Document Library */}
      <ClientDocumentLibrary
        projectId={projectId}
        onDocumentSelect={handleDocumentSelect}
        onDocumentDownload={handleDocumentDownload}
        onDocumentApprove={handleDocumentApprove}
        onDocumentComment={handleDocumentComment}
        mobileOptimized={true}
      />
    </div>
  )
}