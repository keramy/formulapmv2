# Document Approval Workflow - Wave 2 Business Logic
## Enhanced Coordinator Agent Implementation

### **🎯 OBJECTIVE**
Implement a comprehensive document approval workflow system supporting multi-stage approvals, version control, client integration, and role-based approval authority for all document types in Formula PM 2.0.

### **📋 TASK BREAKDOWN FOR COORDINATOR**

**FOUNDATION TASKS (Wait for Wave 1 approval - spawn after scope management ready):**
1. **Multi-Stage Approval System**: Internal and client approval workflows
2. **Version Control Management**: Document versioning with change tracking
3. **Role-Based Approval Authority**: Permission-based approval routing
4. **Client Integration Portal**: External client approval interface

**DEPENDENT TASKS (Wait for foundation approval):**
5. **Automated Approval Routing**: Smart workflow assignment based on document type
6. **Approval Analytics**: Timeline and bottleneck analysis

---

## **📋 Document Approval Data Structure**

### **Enhanced Document Schema**
```typescript
// types/documents.ts
export interface Document {
  id: string
  project_id: string
  scope_item_id?: string
  
  // Basic Information
  title: string
  description: string
  document_type: DocumentType
  category: DocumentCategory
  file_path: string
  file_name: string
  file_size: number
  mime_type: string
  
  // Version Control
  version: number
  version_history: DocumentVersion[]
  is_latest_version: boolean
  supersedes_document_id?: string
  
  // Approval Workflow
  approval_workflow_id: string
  current_approval_stage: ApprovalStage
  approval_status: ApprovalStatus
  requires_client_approval: boolean
  client_visible: boolean
  
  // Metadata
  tags: string[]
  drawing_number?: string
  revision_letter?: string
  discipline?: string
  sheet_size?: string
  
  // Tracking
  created_by: string
  created_at: string
  updated_at: string
  approved_at?: string
  approved_by?: string
  submitted_for_approval_at?: string
  client_deadline?: string
  
  // Relations
  approvals: DocumentApproval[]
  comments: DocumentComment[]
  related_documents: string[]
}

export type DocumentType = 
  | 'shop_drawing'
  | 'material_spec'
  | 'submittal'
  | 'rfi'
  | 'change_order'
  | 'contract'
  | 'permit'
  | 'inspection_report'
  | 'progress_report'
  | 'photo'
  | 'correspondence'
  | 'other'

export type DocumentCategory = 
  | 'construction'
  | 'millwork'
  | 'electrical'
  | 'mechanical'
  | 'architectural'
  | 'structural'
  | 'administrative'

export type ApprovalStatus = 
  | 'draft'
  | 'internal_review'
  | 'internal_approved'
  | 'submitted_to_client'
  | 'client_review'
  | 'client_approved'
  | 'client_rejected'
  | 'revision_required'
  | 'final_approved'
  | 'superseded'
  | 'cancelled'

export type ApprovalStage = 
  | 'draft'
  | 'technical_review'
  | 'project_manager_review'
  | 'director_review'
  | 'client_submission'
  | 'client_review'
  | 'final_approval'

export interface DocumentVersion {
  id: string
  document_id: string
  version_number: number
  file_path: string
  upload_date: string
  uploaded_by: string
  change_description: string
  approval_status: ApprovalStatus
  superseded_at?: string
}

export interface DocumentApproval {
  id: string
  document_id: string
  version_number: number
  approval_stage: ApprovalStage
  approver_id: string
  approver_type: 'internal' | 'client'
  required: boolean
  
  // Approval Details
  status: 'pending' | 'approved' | 'rejected' | 'revision_required'
  approved_at?: string
  rejection_reason?: string
  comments?: string
  conditions?: string[]
  
  // Workflow
  sequence_order: number
  depends_on_approval_id?: string
  notification_sent: boolean
  reminder_count: number
  due_date?: string
  
  // Metadata
  created_at: string
  updated_at: string
}

export interface DocumentComment {
  id: string
  document_id: string
  version_number: number
  commenter_id: string
  commenter_type: 'internal' | 'client'
  
  comment_text: string
  comment_type: 'general' | 'revision_request' | 'clarification' | 'approval_condition'
  status: 'open' | 'addressed' | 'resolved'
  priority: 'low' | 'medium' | 'high'
  
  // Positioning (for drawing markup)
  page_number?: number
  x_coordinate?: number
  y_coordinate?: number
  markup_data?: any
  
  // Relations
  parent_comment_id?: string
  replies: DocumentComment[]
  
  created_at: string
  updated_at: string
  resolved_at?: string
  resolved_by?: string
}

export interface ApprovalWorkflow {
  id: string
  name: string
  document_type: DocumentType
  project_type?: string
  
  // Workflow Definition
  stages: ApprovalWorkflowStage[]
  parallel_approval_allowed: boolean
  client_approval_required: boolean
  auto_route_enabled: boolean
  
  // Settings
  default_due_days: number
  reminder_frequency_days: number
  escalation_days: number
  escalation_to_role?: string
  
  created_by: string
  created_at: string
  is_active: boolean
}

export interface ApprovalWorkflowStage {
  id: string
  workflow_id: string
  stage_name: ApprovalStage
  sequence_order: number
  
  // Approval Requirements
  required_approver_roles: string[]
  optional_approver_roles: string[]
  minimum_approvals_required: number
  
  // Workflow Logic
  can_be_skipped: boolean
  skip_conditions?: string[]
  parallel_with_stage_id?: string
  
  // Timing
  target_duration_days: number
  max_duration_days: number
  
  // Notifications
  notification_template: string
  reminder_template: string
  escalation_template: string
}
```

---

## **📋 Document Approval Workflow Interface**

### **Main Approval Workflow Component**
```typescript
// components/documents/ApprovalWorkflowManager.tsx
'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Eye,
  MessageSquare,
  Download,
  Upload,
  RotateCcw
} from 'lucide-react'
import { Document, DocumentApproval, ApprovalStatus } from '@/types/documents'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { useToast } from '@/components/ui/use-toast'

interface ApprovalWorkflowManagerProps {
  projectId: string
}

export const ApprovalWorkflowManager: React.FC<ApprovalWorkflowManagerProps> = ({ 
  projectId 
}) => {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const { profile } = useAuth()
  const { checkPermission } = usePermissions()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch documents requiring approval
  const { data: documents, isLoading } = useQuery({
    queryKey: ['approval-documents', projectId, activeTab],
    queryFn: () => fetchDocumentsForApproval(projectId, activeTab, profile?.id),
  })

  // Fetch approval statistics
  const { data: approvalStats } = useQuery({
    queryKey: ['approval-stats', projectId],
    queryFn: () => fetchApprovalStatistics(projectId),
  })

  const approveMutation = useMutation({
    mutationFn: ({ documentId, approvalId, decision, comments }: {
      documentId: string
      approvalId: string  
      decision: 'approved' | 'rejected' | 'revision_required'
      comments?: string
    }) => processApproval(documentId, approvalId, decision, comments),
    onSuccess: () => {
      queryClient.invalidateQueries(['approval-documents', projectId])
      queryClient.invalidateQueries(['approval-stats', projectId])
      toast({
        title: "Approval Processed",
        description: "Document approval has been recorded successfully.",
      })
    },
    onError: () => {
      toast({
        title: "Approval Failed",
        description: "Failed to process document approval.",
        variant: "destructive"
      })
    }
  })

  const submitForApprovalMutation = useMutation({
    mutationFn: (documentId: string) => submitDocumentForApproval(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['approval-documents', projectId])
      toast({
        title: "Submitted for Approval",
        description: "Document has been submitted for approval.",
      })
    }
  })

  if (isLoading) {
    return <div>Loading approval workflow...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Document Approvals</h2>
          <p className="text-muted-foreground">
            Manage document approval workflows and review submissions
          </p>
        </div>
        
        {checkPermission('documents.create') && (
          <Button className="flex items-center space-x-2">
            <Upload className="h-4 w-4" />
            <span>Upload Document</span>
          </Button>
        )}
      </div>

      {/* Approval Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvalStats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvalStats?.approved || 0}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revisions</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvalStats?.revisions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Requiring changes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Approval Time</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvalStats?.avgDays || 0}</div>
            <p className="text-xs text-muted-foreground">
              Days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Document Approval Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">Pending ({approvalStats?.pending || 0})</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Revisions</TabsTrigger>
          <TabsTrigger value="all">All Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <DocumentApprovalList 
            documents={filterDocumentsByStatus(documents || [], 'pending')}
            onApprove={(doc, approval, decision, comments) => 
              approveMutation.mutate({ 
                documentId: doc.id, 
                approvalId: approval.id, 
                decision, 
                comments 
              })
            }
            onSelect={setSelectedDocument}
            showApprovalActions={true}
          />
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <DocumentApprovalList 
            documents={filterDocumentsByStatus(documents || [], 'approved')}
            onSelect={setSelectedDocument}
            showApprovalActions={false}
          />
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          <DocumentApprovalList 
            documents={filterDocumentsByStatus(documents || [], 'revision_required')}
            onSelect={setSelectedDocument}
            showApprovalActions={false}
          />
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <DocumentApprovalList 
            documents={documents || []}
            onSelect={setSelectedDocument}
            showApprovalActions={false}
          />
        </TabsContent>
      </Tabs>

      {/* Document Details Modal */}
      {selectedDocument && (
        <DocumentApprovalDetail
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onApprove={(approval, decision, comments) => 
            approveMutation.mutate({ 
              documentId: selectedDocument.id, 
              approvalId: approval.id, 
              decision, 
              comments 
            })
          }
        />
      )}
    </div>
  )
}
```

### **Document Approval List Component**
```typescript
// components/documents/DocumentApprovalList.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { 
  FileText, 
  Calendar, 
  User, 
  Clock, 
  Eye,
  Download,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import { Document, DocumentApproval } from '@/types/documents'
import { useAuth } from '@/hooks/useAuth'

interface DocumentApprovalListProps {
  documents: Document[]
  onSelect: (document: Document) => void
  onApprove?: (
    document: Document, 
    approval: DocumentApproval, 
    decision: 'approved' | 'rejected' | 'revision_required',
    comments?: string
  ) => void
  showApprovalActions: boolean
}

export const DocumentApprovalList: React.FC<DocumentApprovalListProps> = ({
  documents,
  onSelect,
  onApprove,
  showApprovalActions
}) => {
  const { profile } = useAuth()

  const getStatusColor = (status: string) => {
    const colors = {
      'draft': 'bg-gray-100 text-gray-800',
      'internal_review': 'bg-blue-100 text-blue-800',
      'internal_approved': 'bg-green-100 text-green-800',
      'submitted_to_client': 'bg-yellow-100 text-yellow-800',
      'client_review': 'bg-orange-100 text-orange-800',
      'client_approved': 'bg-emerald-100 text-emerald-800',
      'client_rejected': 'bg-red-100 text-red-800',
      'revision_required': 'bg-amber-100 text-amber-800',
      'final_approved': 'bg-green-100 text-green-800',
      'superseded': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || colors['draft']
  }

  const getDocumentTypeIcon = (type: string) => {
    // Return appropriate icon based on document type
    return <FileText className="h-4 w-4" />
  }

  const calculateApprovalProgress = (document: Document): number => {
    const totalApprovals = document.approvals.length
    const completedApprovals = document.approvals.filter(
      a => a.status === 'approved'
    ).length
    return totalApprovals > 0 ? (completedApprovals / totalApprovals) * 100 : 0
  }

  const getPendingApprovalForUser = (document: Document): DocumentApproval | null => {
    return document.approvals.find(
      approval => approval.approver_id === profile?.id && approval.status === 'pending'
    ) || null
  }

  const isOverdue = (approval: DocumentApproval): boolean => {
    if (!approval.due_date) return false
    return new Date(approval.due_date) < new Date()
  }

  if (documents.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <div className="text-muted-foreground">
            No documents found for this category.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {documents.map((document) => {
        const pendingApproval = getPendingApprovalForUser(document)
        const progressPercentage = calculateApprovalProgress(document)
        
        return (
          <Card key={document.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex-shrink-0">
                    {getDocumentTypeIcon(document.document_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold truncate">
                        {document.title}
                      </h3>
                      <Badge className={getStatusColor(document.approval_status)}>
                        {document.approval_status.replace('_', ' ')}
                      </Badge>
                      {document.revision_letter && (
                        <Badge variant="outline">
                          Rev {document.revision_letter}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                      {document.description}
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>
                          {document.submitted_for_approval_at 
                            ? new Date(document.submitted_for_approval_at).toLocaleDateString()
                            : 'Not submitted'
                          }
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span>v{document.version}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <span className="capitalize">
                          {document.document_type.replace('_', ' ')}
                        </span>
                      </div>
                      
                      {document.client_deadline && (
                        <div className="flex items-center space-x-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span>
                            Due {new Date(document.client_deadline).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Approval Progress */}
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Approval Progress</span>
                        <span>{Math.round(progressPercentage)}%</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </div>
                    
                    {/* Pending Approval Alert */}
                    {pendingApproval && (
                      <div className={`mt-3 p-3 rounded-md border-l-4 ${
                        isOverdue(pendingApproval) 
                          ? 'bg-red-50 border-red-400' 
                          : 'bg-blue-50 border-blue-400'
                      }`}>
                        <div className="flex items-center space-x-2">
                          {isOverdue(pendingApproval) ? (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-blue-600" />
                          )}
                          <span className="text-sm font-medium">
                            {isOverdue(pendingApproval) 
                              ? 'Overdue - Your approval is required'
                              : 'Pending your approval'
                            }
                          </span>
                        </div>
                        {pendingApproval.due_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Due: {new Date(pendingApproval.due_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelect(document)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  
                  {document.comments.length > 0 && (
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {document.comments.length}
                    </Button>
                  )}
                  
                  {showApprovalActions && pendingApproval && onApprove && (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => onApprove(document, pendingApproval, 'approved')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onApprove(document, pendingApproval, 'revision_required')}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Revise
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
```

---

## **📋 Client Approval Interface**

### **External Client Approval Portal**
```typescript
// components/documents/ClientApprovalPortal.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  FileText, 
  Download, 
  MessageSquare, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Clock,
  Eye
} from 'lucide-react'
import { Document, DocumentComment } from '@/types/documents'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/use-toast'

interface ClientApprovalPortalProps {
  projectId: string
}

export const ClientApprovalPortal: React.FC<ClientApprovalPortalProps> = ({ 
  projectId 
}) => {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [approvalComments, setApprovalComments] = useState('')
  const [approvalConditions, setApprovalConditions] = useState<string[]>([])
  const [showCommentForm, setShowCommentForm] = useState(false)
  const { profile } = useAuth()
  const { toast } = useToast()

  // Fetch client documents
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClientDocuments()
  }, [projectId])

  const fetchClientDocuments = async () => {
    try {
      // Fetch documents visible to client
      const response = await fetch(`/api/projects/${projectId}/client-documents`)
      const data = await response.json()
      setDocuments(data)
    } catch (error) {
      console.error('Error fetching client documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClientApproval = async (
    document: Document, 
    decision: 'approved' | 'rejected' | 'revision_required',
    comments?: string,
    conditions?: string[]
  ) => {
    try {
      const response = await fetch(`/api/documents/${document.id}/client-approval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          decision,
          comments,
          conditions,
          client_id: profile?.id
        })
      })

      if (response.ok) {
        toast({
          title: "Approval Submitted",
          description: `Document ${decision} successfully.`,
        })
        
        // Refresh documents
        await fetchClientDocuments()
        setSelectedDocument(null)
        setApprovalComments('')
        setApprovalConditions([])
      } else {
        throw new Error('Failed to submit approval')
      }
    } catch (error) {
      toast({
        title: "Approval Failed",
        description: "Failed to submit approval. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleAddComment = async (
    document: Document,
    commentText: string,
    commentType: 'general' | 'revision_request' | 'clarification'
  ) => {
    try {
      const response = await fetch(`/api/documents/${document.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          comment_text: commentText,
          comment_type: commentType,
          commenter_id: profile?.id,
          commenter_type: 'client',
          version_number: document.version
        })
      })

      if (response.ok) {
        toast({
          title: "Comment Added",
          description: "Your comment has been added to the document.",
        })
        
        await fetchClientDocuments()
        setShowCommentForm(false)
      }
    } catch (error) {
      toast({
        title: "Comment Failed",
        description: "Failed to add comment. Please try again.",
        variant: "destructive"
      })
    }
  }

  const pendingDocuments = documents.filter(
    doc => doc.approval_status === 'submitted_to_client' || doc.approval_status === 'client_review'
  )
  
  const approvedDocuments = documents.filter(
    doc => doc.approval_status === 'client_approved'
  )
  
  const revisedDocuments = documents.filter(
    doc => doc.approval_status === 'client_rejected' || doc.approval_status === 'revision_required'
  )

  if (loading) {
    return <div>Loading documents...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Document Review & Approval</h2>
        <p className="text-muted-foreground">
          Review and approve project documents submitted for your review
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingDocuments.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting your review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedDocuments.length}</div>
            <p className="text-xs text-muted-foreground">
              Documents approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revisions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revisedDocuments.length}</div>
            <p className="text-xs text-muted-foreground">
              Requiring changes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Document Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Pending Review ({pendingDocuments.length})
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="revisions">Revisions</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingDocuments.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <div className="text-muted-foreground">
                  No documents pending your review.
                </div>
              </CardContent>
            </Card>
          ) : (
            <ClientDocumentList
              documents={pendingDocuments}
              onSelect={setSelectedDocument}
              onApprove={handleClientApproval}
              onComment={handleAddComment}
              showApprovalActions={true}
            />
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <ClientDocumentList
            documents={approvedDocuments}
            onSelect={setSelectedDocument}
            showApprovalActions={false}
          />
        </TabsContent>

        <TabsContent value="revisions" className="space-y-4">
          <ClientDocumentList
            documents={revisedDocuments}
            onSelect={setSelectedDocument}
            showApprovalActions={false}
          />
        </TabsContent>
      </Tabs>

      {/* Document Detail Modal */}
      {selectedDocument && (
        <ClientDocumentDetailModal
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onApprove={handleClientApproval}
          onComment={handleAddComment}
        />
      )}
    </div>
  )
}
```

---

## **🔧 COORDINATOR IMPLEMENTATION INSTRUCTIONS**

### **Subagent Spawning Strategy**
```
TASK: Document Approval Workflow Implementation
OBJECTIVE: Deploy comprehensive multi-stage approval system with client integration and version control
CONTEXT: Core workflow system for all document types with role-based approval routing and real-time status tracking

REQUIRED READING:
- Patterns: @Patterns/optimized-coordinator-v1.md
- Database: @Planing App/Wave-1-Foundation/database-schema-design.md
- Scope System: @Planing App/Wave-2-Business-Logic/scope-management-system.md
- UI Framework: @Planing App/Wave-1-Foundation/core-ui-framework.md
- Templates: @Patterns/templates/subagent-template.md

IMPLEMENTATION REQUIREMENTS:
1. Implement multi-stage approval workflow system with configurable stages
2. Build version control system with document history tracking
3. Create role-based approval routing with permission validation
4. Develop client approval portal with external access
5. Implement comment system with markup capabilities
6. Build automated notification and reminder system
7. Create approval analytics and bottleneck identification

DELIVERABLES:
1. Complete approval workflow management interface
2. Document version control system with history
3. Role-based approval routing engine
4. Client approval portal with secure external access
5. Comment and markup system for document feedback
6. Automated notification system with escalation
7. Approval analytics dashboard
```

### **Quality Gates**
- ✅ Multi-stage approval workflow handles all document types
- ✅ Version control maintains complete document history
- ✅ Role-based routing respects permission matrix
- ✅ Client portal provides secure external access
- ✅ Comment system supports markup and positioning
- ✅ Notification system sends timely alerts and reminders
- ✅ Analytics identify workflow bottlenecks

### **Dependencies for Next Wave**
- Approval workflow system must be fully functional
- Client portal integration tested for external access
- Version control system handles concurrent updates
- Comment system ready for shop drawing integration
- Notification system integrated with real-time updates

---

## **🎯 SUCCESS CRITERIA**
1. **Workflow Management**: Complete multi-stage approval process for all document types
2. **Version Control**: Comprehensive document history with change tracking
3. **Client Integration**: Secure external portal for client approvals and feedback
4. **Role-Based Security**: Approval authority respects user permissions and project assignments
5. **Analytics & Optimization**: Workflow bottleneck identification and performance metrics

**Evaluation Score Target**: 90+ using @Patterns/templates/evaluator-prompt.md