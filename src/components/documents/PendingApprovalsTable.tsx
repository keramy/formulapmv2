'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Calendar, 
  User,
  FileText,
  AlertTriangle,
  MessageSquare
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

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

interface PendingApprovalsTableProps {
  approvals: PendingApproval[]
  onApprove: (workflowId: string, data: { comments?: string }) => void
  onReject: (workflowId: string, data: { comments: string }) => void
  onViewDetails: (workflowId: string) => void
}

const PendingApprovalsTable: React.FC<PendingApprovalsTableProps> = ({
  approvals,
  onApprove,
  onReject,
  onViewDetails
}) => {
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null)
  const [approvalComments, setApprovalComments] = useState('')
  const [rejectionComments, setRejectionComments] = useState('')
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [showRejectionDialog, setShowRejectionDialog] = useState(false)

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

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'drawing':
        return <FileText className="w-4 h-4" />
      case 'specification':
        return <FileText className="w-4 h-4" />
      case 'report':
        return <FileText className="w-4 h-4" />
      case 'contract':
        return <FileText className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const handleApprove = (approval: PendingApproval) => {
    setSelectedApproval(approval)
    setApprovalComments('')
    setShowApprovalDialog(true)
  }

  const handleReject = (approval: PendingApproval) => {
    setSelectedApproval(approval)
    setRejectionComments('')
    setShowRejectionDialog(true)
  }

  const confirmApproval = () => {
    if (selectedApproval) {
      onApprove(selectedApproval.id, { comments: approvalComments })
      setShowApprovalDialog(false)
      setSelectedApproval(null)
      setApprovalComments('')
    }
  }

  const confirmRejection = () => {
    if (selectedApproval && rejectionComments.trim()) {
      onReject(selectedApproval.id, { comments: rejectionComments })
      setShowRejectionDialog(false)
      setSelectedApproval(null)
      setRejectionComments('')
    }
  }

  if (approvals.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Pending Approvals</h3>
          <p className="text-muted-foreground text-center">
            You have no documents waiting for your approval at the moment.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Mobile-friendly card layout for smaller screens */}
      <div className="block md:hidden space-y-4">
        {approvals.map((approval) => (
          <Card key={approval.id} className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getDocumentTypeIcon(approval.documents.document_type)}
                    <span className="font-medium text-sm">{approval.documents.document_name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    #{approval.documents.document_number || 'N/A'} • v{approval.documents.version}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {approval.documents.projects.name}
                  </div>
                </div>
                <Badge 
                  variant="secondary" 
                  className={`text-white ${getPriorityColor(approval.priority_level)} text-xs`}
                >
                  {getPriorityLabel(approval.priority_level)}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs capitalize">
                    {approval.documents.document_type}
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize">
                    {approval.workflow_type}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(approval.created_at), { addSuffix: true })}
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetails(approval.id)}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleApprove(approval)}
                  className="flex-1 text-green-600 hover:text-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReject(approval)}
                  className="flex-1 text-red-600 hover:text-red-700"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Desktop table layout */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Workflow</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {approvals.map((approval) => (
              <TableRow key={approval.id}>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getDocumentTypeIcon(approval.documents.document_type)}
                      <span className="font-medium">{approval.documents.document_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>#{approval.documents.document_number || 'N/A'}</span>
                      <span>v{approval.documents.version}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{approval.documents.projects.name}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {approval.documents.document_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="secondary" 
                    className={`text-white ${getPriorityColor(approval.priority_level)}`}
                  >
                    {getPriorityLabel(approval.priority_level)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {formatDistanceToNow(new Date(approval.created_at), { addSuffix: true })}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {approval.workflow_type}
                    </Badge>
                    <Badge variant="secondary" className="capitalize">
                      {approval.current_status}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDetails(approval.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApprove(approval)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(approval)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Approve Document
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedApproval && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  You are about to approve:
                </p>
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium">{selectedApproval.documents.document_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedApproval.documents.projects.name}
                  </p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="approval-comments">Comments (Optional)</Label>
              <Textarea
                id="approval-comments"
                placeholder="Add any comments about your approval..."
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmApproval} className="bg-green-600 hover:bg-green-700">
                Approve Document
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Reject Document
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedApproval && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  You are about to reject:
                </p>
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium">{selectedApproval.documents.document_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedApproval.documents.projects.name}
                  </p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="rejection-comments">Rejection Reason *</Label>
              <Textarea
                id="rejection-comments"
                placeholder="Please provide a reason for rejection..."
                value={rejectionComments}
                onChange={(e) => setRejectionComments(e.target.value)}
                rows={3}
                className={rejectionComments.trim() ? '' : 'border-red-300'}
              />
              {!rejectionComments.trim() && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Rejection reason is required
                </p>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowRejectionDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={confirmRejection} 
                disabled={!rejectionComments.trim()}
                variant="destructive"
              >
                Reject Document
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PendingApprovalsTable