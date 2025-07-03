'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Plus, 
  Users, 
  FileText, 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  ArrowRight,
  User,
  AlertTriangle
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from '@/components/ui/use-toast'

interface ApprovalWorkflowManagerProps {
  projectId?: string
  selectedWorkflow?: string | null
  onWorkflowUpdate?: () => void
}

interface WorkflowTemplate {
  id: string
  template_name: string
  document_type: string
  workflow_type: string
  default_approvers: string[]
  description: string
}

interface Document {
  id: string
  document_name: string
  document_type: string
  document_number?: string
  version: string
}

interface User {
  id: string
  email: string
  role?: string
}

interface WorkflowDetails {
  id: string
  document_id: string
  workflow_type: string
  current_status: string
  priority_level: number
  required_approvers: string[]
  completed_approvers: string[]
  created_at: string
  estimated_completion_date?: string
  documents: Document
  approval_actions: Array<{
    id: string
    user_id: string
    action_type: string
    comments?: string
    timestamp: string
    user: User
  }>
}

const ApprovalWorkflowManager: React.FC<ApprovalWorkflowManagerProps> = ({
  projectId,
  selectedWorkflow,
  onWorkflowUpdate
}) => {
  const [documents, setDocuments] = useState<Document[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([])
  const [workflowDetails, setWorkflowDetails] = useState<WorkflowDetails | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [selectedDocumentId, setSelectedDocumentId] = useState('')
  const [workflowType, setWorkflowType] = useState<'sequential' | 'parallel' | 'conditional'>('sequential')
  const [selectedApprovers, setSelectedApprovers] = useState<string[]>([])
  const [priorityLevel, setPriorityLevel] = useState(1)
  const [estimatedDate, setEstimatedDate] = useState('')
  const [comments, setComments] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch documents
        const docParams = projectId ? `?projectId=${projectId}` : ''
        const docsResponse = await fetch(`/api/documents${docParams}`)
        if (docsResponse.ok) {
          const docsData = await docsResponse.json()
          setDocuments(docsData.documents || [])
        }

        // Fetch users for approver selection
        const usersResponse = await fetch('/api/auth/users')
        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          setUsers(usersData.users || [])
        }

        // Fetch workflow templates
        const templatesResponse = await fetch('/api/documents/templates')
        if (templatesResponse.ok) {
          const templatesData = await templatesResponse.json()
          setTemplates(templatesData.templates || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [projectId])

  useEffect(() => {
    if (selectedWorkflow) {
      fetchWorkflowDetails(selectedWorkflow)
    }
  }, [selectedWorkflow])

  const fetchWorkflowDetails = async (workflowId: string) => {
    try {
      const response = await fetch(`/api/documents/workflow/${workflowId}`)
      if (response.ok) {
        const data = await response.json()
        setWorkflowDetails(data)
      }
    } catch (error) {
      console.error('Error fetching workflow details:', error)
    }
  }

  const handleCreateWorkflow = async () => {
    if (!selectedDocumentId || selectedApprovers.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select a document and at least one approver',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/documents/${selectedDocumentId}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowType,
          approvers: selectedApprovers,
          priorityLevel,
          estimatedCompletionDate: estimatedDate || undefined,
          comments
        })
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Approval workflow created successfully'
        })
        setIsCreateDialogOpen(false)
        resetForm()
        onWorkflowUpdate?.()
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to create approval workflow',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error creating workflow:', error)
      toast({
        title: 'Error',
        description: 'Failed to create approval workflow',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedDocumentId('')
    setWorkflowType('sequential')
    setSelectedApprovers([])
    setPriorityLevel(1)
    setEstimatedDate('')
    setComments('')
  }

  const handleApproverToggle = (userId: string) => {
    setSelectedApprovers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500'
      case 'in_review': return 'bg-blue-500'
      case 'approved': return 'bg-green-500'
      case 'rejected': return 'bg-red-500'
      default: return 'bg-gray-500'
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

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'approve': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'reject': return <XCircle className="w-4 h-4 text-red-600" />
      case 'comment': return <MessageSquare className="w-4 h-4 text-blue-600" />
      case 'delegate': return <ArrowRight className="w-4 h-4 text-purple-600" />
      default: return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Create Workflow Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Approval Workflows</h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Approval Workflow</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="document-select">Document</Label>
                  <Select value={selectedDocumentId} onValueChange={setSelectedDocumentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select document" />
                    </SelectTrigger>
                    <SelectContent>
                      {documents.map(doc => (
                        <SelectItem key={doc.id} value={doc.id}>
                          {doc.document_name} ({doc.document_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workflow-type">Workflow Type</Label>
                  <Select value={workflowType} onValueChange={(value: any) => setWorkflowType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sequential">Sequential</SelectItem>
                      <SelectItem value="parallel">Parallel</SelectItem>
                      <SelectItem value="conditional">Conditional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Approvers</Label>
                <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                  {users.map(user => (
                    <div key={user.id} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        checked={selectedApprovers.includes(user.id)}
                        onChange={() => handleApproverToggle(user.id)}
                        className="rounded"
                      />
                      <span className="text-sm">{user.email}</span>
                      {user.role && (
                        <Badge variant="outline" className="text-xs">
                          {user.role}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select value={priorityLevel.toString()} onValueChange={(value) => setPriorityLevel(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Low</SelectItem>
                      <SelectItem value="2">Medium</SelectItem>
                      <SelectItem value="3">High</SelectItem>
                      <SelectItem value="4">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimated-date">Estimated Completion</Label>
                  <Input
                    type="datetime-local"
                    value={estimatedDate}
                    onChange={(e) => setEstimatedDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comments">Comments</Label>
                <Textarea
                  placeholder="Add any initial comments..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateWorkflow} disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Workflow'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Workflow Details */}
      {workflowDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Workflow Details</span>
              <Badge className={`${getStatusColor(workflowDetails.current_status)} text-white`}>
                {workflowDetails.current_status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="approvers">Approvers</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Document</h4>
                    <p className="text-sm">{workflowDetails.documents.document_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {workflowDetails.documents.document_type} | v{workflowDetails.documents.version}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Workflow Type</h4>
                    <Badge variant="outline" className="capitalize">
                      {workflowDetails.workflow_type}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Priority</h4>
                    <Badge variant="secondary">
                      {getPriorityLabel(workflowDetails.priority_level)}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Created</h4>
                    <p className="text-sm">
                      {formatDistanceToNow(new Date(workflowDetails.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="approvers" className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Required Approvers</h4>
                  <div className="space-y-2">
                    {workflowDetails.required_approvers.map((approverId, index) => {
                      const hasApproved = workflowDetails.completed_approvers.includes(approverId)
                      const user = users.find(u => u.id === approverId)
                      
                      return (
                        <div key={approverId} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span className="text-sm">{user?.email || 'Unknown User'}</span>
                            {workflowDetails.workflow_type === 'sequential' && (
                              <Badge variant="outline" className="text-xs">
                                Step {index + 1}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {hasApproved ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <Clock className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {hasApproved ? 'Approved' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Approval History</h4>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {workflowDetails.approval_actions.map((action) => (
                        <div key={action.id} className="flex items-start gap-3 p-2 border rounded">
                          <div className="mt-1">
                            {getActionIcon(action.action_type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{action.user.email}</span>
                              <span className="text-xs text-muted-foreground capitalize">
                                {action.action_type}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(action.timestamp), { addSuffix: true })}
                              </span>
                            </div>
                            {action.comments && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {action.comments}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ApprovalWorkflowManager