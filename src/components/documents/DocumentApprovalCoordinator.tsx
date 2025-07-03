'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, CheckCircle, Clock, FileText, Users, Zap } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useDocumentWorkflow } from '@/hooks/useDocumentWorkflow'
import { toast } from '@/components/ui/use-toast'

import { ApprovalWorkflowManager } from './ApprovalWorkflowManager'
import { ApprovalStatusCards } from './ApprovalStatusCards'
import { PendingApprovalsTable } from './PendingApprovalsTable'
import { DocumentList } from './DocumentList'

interface DocumentApprovalCoordinatorProps {
  projectId?: string
  initialTab?: 'pending' | 'documents' | 'workflows'
}

interface ApprovalStats {
  totalPending: number
  priorityBreakdown: {
    urgent: number
    high: number
    medium: number
    low: number
  }
  avgAge: number
}

interface PendingApproval {
  id: string
  document_id: string
  workflow_type: string
  current_status: string
  priority_level: number
  created_at: string
  estimated_completion_date?: string
  documents: {
    id: string
    document_name: string
    document_type: string
    document_number?: string
    version: string
    projects: {
      id: string
      name: string
    }
  }
  created_by_user: {
    id: string
    email: string
  }
  approval_actions: Array<{
    id: string
    action_type: string
    timestamp: string
    user_id: string
    comments?: string
    user: {
      id: string
      email: string
    }
  }>
}

const DocumentApprovalCoordinator: React.FC<DocumentApprovalCoordinatorProps> = ({
  projectId,
  initialTab = 'pending'
}) => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState(initialTab)
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null)
  
  // Use the real-time workflow hook
  const {
    pendingApprovals,
    workflowStats: approvalStats,
    isLoading,
    error,
    approveDocument,
    rejectDocument,
    refreshData: fetchPendingApprovals,
    hasPendingApprovals,
    urgentApprovals,
    overdueApprovals
  } = useDocumentWorkflow({ projectId })

  // Display error toast if there's an error
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive'
      })
    }
  }, [error])

  const handleApprovalAction = useCallback(async (workflowId: string, action: 'approve' | 'reject', data: any) => {
    try {
      if (action === 'approve') {
        await approveDocument(workflowId, data)
        toast({
          title: 'Document Approved',
          description: 'Document has been approved successfully'
        })
      } else {
        await rejectDocument(workflowId, data)
        toast({
          title: 'Document Rejected',
          description: 'Document has been rejected successfully',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error(`Error ${action}ing document:`, error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${action} document`,
        variant: 'destructive'
      })
    }
  }, [approveDocument, rejectDocument])

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 4: return 'bg-red-500'
      case 3: return 'bg-orange-500'
      case 2: return 'bg-yellow-500'
      default: return 'bg-blue-500'
    }
  }

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 4: return 'Urgent'
      case 3: return 'High'
      case 2: return 'Medium'
      default: return 'Low'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Approval Statistics */}
      <ApprovalStatusCards 
        stats={approvalStats}
        onRefresh={fetchPendingApprovals}
      />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending Approvals
            {hasPendingApprovals && (
              <Badge variant="destructive" className="ml-1">
                {pendingApprovals.length}
              </Badge>
            )}
            {urgentApprovals.length > 0 && (
              <Badge variant="destructive" className="ml-1 bg-red-600">
                {urgentApprovals.length} urgent
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="workflows" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Workflows
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Pending Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PendingApprovalsTable
                approvals={pendingApprovals}
                onApprove={(workflowId, data) => handleApprovalAction(workflowId, 'approve', data)}
                onReject={(workflowId, data) => handleApprovalAction(workflowId, 'reject', data)}
                onViewDetails={setSelectedWorkflow}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <DocumentList
            projectId={projectId}
            onWorkflowSelect={setSelectedWorkflow}
          />
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Approval Workflows
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ApprovalWorkflowManager
                projectId={projectId}
                selectedWorkflow={selectedWorkflow}
                onWorkflowUpdate={fetchPendingApprovals}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default DocumentApprovalCoordinator