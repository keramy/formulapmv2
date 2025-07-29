'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Globe, FileText, MessageSquare, Calendar } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function ClientPortalPage() {
  const { profile } = useAuth()
  
  const isClient = profile?.role === 'client'
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {isClient ? 'My Projects' : 'Client Portal Management'}
        </h1>
        <p className="text-gray-600">
          {isClient 
            ? 'View your project progress and communicate with the team'
            : 'Manage client access and communications'
          }
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Active Projects
            </CardTitle>
            <CardDescription>
              Projects with client access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-gray-600">No active client projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Messages
            </CardTitle>
            <CardDescription>
              Client communications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-gray-600">No new messages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents
            </CardTitle>
            <CardDescription>
              Shared project documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-gray-600">No documents shared</p>
          </CardContent>
        </Card>
      </div>

      {!isClient && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Client Access Overview</CardTitle>
              <CardDescription>
                Manage which clients can access which projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                No client access configured. Assign clients to projects to enable portal access.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {isClient && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Project Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                No project timeline available. Contact your project manager for updates.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}