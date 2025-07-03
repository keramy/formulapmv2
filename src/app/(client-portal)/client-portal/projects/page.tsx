/**
 * Client Portal Projects Page
 * Project overview and selection for external clients
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProjectOverviewCards } from '@/components/client-portal/dashboard/ProjectOverviewCards'
import { useClientProjects } from '@/hooks/useClientPortal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FolderOpen } from 'lucide-react'

export default function ClientPortalProjectsPage() {
  const router = useRouter()
  const { projects, loading, error } = useClientProjects()

  // Handle project selection
  const handleProjectSelect = (projectId: string) => {
    router.push(`/client-portal/projects/${projectId}`)
  }

  // Handle view documents
  const handleViewDocuments = (projectId: string) => {
    router.push(`/client-portal/documents?project=${projectId}`)
  }

  // Handle view progress
  const handleViewProgress = (projectId: string) => {
    router.push(`/client-portal/projects/${projectId}/progress`)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FolderOpen className="w-6 h-6" />
          Projects
        </h1>
        <p className="text-gray-600 mt-1">
          View your projects, track progress, and access project-specific information.
        </p>
      </div>

      {/* Projects Grid */}
      <ProjectOverviewCards
        projects={projects}
        onProjectSelect={handleProjectSelect}
        onViewDocuments={handleViewDocuments}
        onViewProgress={handleViewProgress}
        loading={loading}
        mobileOptimized={true}
      />
    </div>
  )
}