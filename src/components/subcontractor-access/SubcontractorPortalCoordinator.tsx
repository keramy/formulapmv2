/**
 * Subcontractor Portal Coordinator
 * Main orchestrator component for subcontractor portal functionality
 */

'use client'

import { useState } from 'react'
import { useSubcontractorPortal } from '@/hooks/useSubcontractorPortal'
import { SubcontractorAuth } from './SubcontractorAuth'
import { SubcontractorReportManager } from './SubcontractorReportManager'
import { SubcontractorDocumentViewer } from './SubcontractorDocumentViewer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Building, FileText, Download, User, LogOut, AlertCircle, CheckCircle } from 'lucide-react'

interface SubcontractorPortalCoordinatorProps {
  initialTab?: 'dashboard' | 'reports' | 'documents'
}

export function SubcontractorPortalCoordinator({ 
  initialTab = 'dashboard' 
}: SubcontractorPortalCoordinatorProps) {
  const {
    user,
    profile,
    reports,
    documents,
    isAuthenticated,
    isLoading,
    isLoadingProfile,
    error,
    logout,
    clearError,
    refreshProfile,
    refreshReports,
    refreshDocuments
  } = useSubcontractorPortal()

  const [activeTab, setActiveTab] = useState(initialTab)

  // Show authentication form if not authenticated
  if (!isAuthenticated) {
    return <SubcontractorAuth />
  }

  // Show loading state
  if (isLoading || isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading portal...</p>
        </div>
      </div>
    )
  }

  // Handle logout
  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Building className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Subcontractor Portal
                </h1>
                <p className="text-sm text-gray-500">
                  {user?.company_name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.contact_person}
                </p>
                <p className="text-sm text-gray-500">
                  {user?.email}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex justify-between items-center">
              {error}
              <Button
                variant="outline"
                size="sm"
                onClick={clearError}
                className="ml-4"
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab Navigation */}
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Reports</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Documents</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Profile Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Profile</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Company</p>
                      <p className="text-sm text-gray-900">{user?.company_name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Contact</p>
                      <p className="text-sm text-gray-900">{user?.contact_person}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <Badge variant={user?.is_active ? "default" : "destructive"}>
                        {user?.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reports Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Reports</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Total</span>
                      <span className="text-sm font-medium">
                        {profile?.report_statistics?.total || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Submitted</span>
                      <span className="text-sm font-medium">
                        {profile?.report_statistics?.submitted || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Approved</span>
                      <span className="text-sm font-medium">
                        {profile?.report_statistics?.approved || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Documents Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Download className="h-5 w-5" />
                    <span>Documents</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Available</span>
                      <span className="text-sm font-medium">
                        {documents.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Projects</span>
                      <span className="text-sm font-medium">
                        {profile?.assigned_projects?.length || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Assigned Projects */}
            <Card>
              <CardHeader>
                <CardTitle>Assigned Projects</CardTitle>
                <CardDescription>
                  Projects you have access to
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profile?.assigned_projects?.length ? (
                  <div className="space-y-3">
                    {profile.assigned_projects.map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{project.name}</p>
                          <p className="text-sm text-gray-500">{project.description}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {project.document_count} docs
                          </Badge>
                          <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                            {project.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No projects assigned yet
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <SubcontractorReportManager
              reports={reports}
              assignedProjects={profile?.assigned_projects || []}
              onRefresh={refreshReports}
            />
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <SubcontractorDocumentViewer
              documents={documents}
              onRefresh={refreshDocuments}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}