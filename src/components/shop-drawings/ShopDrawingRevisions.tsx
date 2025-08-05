'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/use-toast'
import { 
  FileText, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Upload,
  Download,
  Eye,
  MessageSquare,
  User,
  Calendar,
  History
} from 'lucide-react'

interface ShopDrawingRevision {
  id: string
  drawing_id: string
  revision_number: string
  revision_letter?: string
  title: string
  description: string
  file_url: string
  file_name: string
  file_size: number
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'superseded'
  approval_stage: 'internal' | 'client' | 'final'
  created_by: string
  created_at: string
  reviewed_by?: string
  reviewed_at?: string
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  comments: RevisionComment[]
}

interface RevisionComment {
  id: string
  revision_id: string
  comment: string
  comment_type: 'general' | 'approval' | 'rejection' | 'clarification'
  created_by: string
  created_by_name: string
  created_at: string
  is_internal: boolean
}

interface ShopDrawingRevisionsProps {
  drawingId: string
  projectId?: string
  canCreateRevision?: boolean
  canApprove?: boolean
  canReject?: boolean
  showClientView?: boolean
}

const REVISION_STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-500', icon: FileText },
  submitted: { label: 'Submitted', color: 'bg-blue-500', icon: Upload },
  under_review: { label: 'Under Review', color: 'bg-yellow-500', icon: Clock },
  approved: { label: 'Approved', color: 'bg-green-500', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-500', icon: XCircle },
  superseded: { label: 'Superseded', color: 'bg-gray-400', icon: History }
}

const APPROVAL_STAGES = [
  { value: 'internal', label: 'Internal Review', description: 'Technical team review' },
  { value: 'client', label: 'Client Review', description: 'Client approval required' },
  { value: 'final', label: 'Final Approval', description: 'Ready for production' }
]

export function ShopDrawingRevisions({
  drawingId,
  projectId,
  canCreateRevision = false,
  canApprove = false,
  canReject = false,
  showClientView = false
}: ShopDrawingRevisionsProps) {
  const { getAccessToken } = useAuth()
  const { toast } = useToast()
  
  const [revisions, setRevisions] = useState<ShopDrawingRevision[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRevision, setSelectedRevision] = useState<ShopDrawingRevision | null>(null)
  const [showNewRevisionDialog, setShowNewRevisionDialog] = useState(false)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)
  
  // New revision form state
  const [newRevisionData, setNewRevisionData] = useState({
    title: '',
    description: '',
    approval_stage: 'internal' as const,
    file: null as File | null
  })
  
  // Approval/rejection form state
  const [approvalData, setApprovalData] = useState({
    comments: '',
    rejection_reason: ''
  })

  useEffect(() => {
    loadRevisions()
  }, [drawingId])

  const loadRevisions = async () => {
    try {
      const token = await getAccessToken()
      if (!token) return

      const response = await fetch(`/api/shop-drawings/${drawingId}/revisions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setRevisions(result.data)
        }
      }
    } catch (error) {
      console.error('Error loading revisions:', error)
      toast({
        title: "Error",
        description: "Failed to load revisions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRevision = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newRevisionData.file) {
      toast({
        title: "File Required",
        description: "Please select a file for the revision",
        variant: "destructive",
      })
      return
    }

    try {
      const token = await getAccessToken()
      if (!token) throw new Error('No access token')

      const formData = new FormData()
      formData.append('file', newRevisionData.file)
      formData.append('title', newRevisionData.title)
      formData.append('description', newRevisionData.description)
      formData.append('approval_stage', newRevisionData.approval_stage)
      formData.append('drawing_id', drawingId)
      
      if (projectId) {
        formData.append('project_id', projectId)
      }

      const response = await fetch(`/api/shop-drawings/${drawingId}/revisions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create revision')
      }

      toast({
        title: "Revision Created",
        description: "New revision uploaded successfully",
      })

      // Reset form and reload
      setNewRevisionData({
        title: '',
        description: '',
        approval_stage: 'internal',
        file: null
      })
      setShowNewRevisionDialog(false)
      await loadRevisions()

    } catch (error) {
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : 'Failed to create revision',
        variant: "destructive",
      })
    }
  }

  const handleApprovalAction = async (revision: ShopDrawingRevision, action: 'approve' | 'reject') => {
    setSelectedRevision(revision)
    setActionType(action)
    setShowApprovalDialog(true)
  }

  const submitApprovalAction = async () => {
    if (!selectedRevision || !actionType) return

    try {
      const token = await getAccessToken()
      if (!token) throw new Error('No access token')

      const payload = {
        action: actionType,
        comments: approvalData.comments,
        ...(actionType === 'reject' && { rejection_reason: approvalData.rejection_reason })
      }

      const response = await fetch(`/api/shop-drawings/revisions/${selectedRevision.id}/review`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Failed to ${actionType} revision`)
      }

      toast({
        title: `Revision ${actionType === 'approve' ? 'Approved' : 'Rejected'}`,
        description: `Revision ${selectedRevision.revision_number} has been ${actionType}d`,
      })

      // Reset and reload
      setApprovalData({ comments: '', rejection_reason: '' })
      setShowApprovalDialog(false)
      setSelectedRevision(null)
      setActionType(null)
      await loadRevisions()

    } catch (error) {
      toast({
        title: "Action Failed",
        description: error instanceof Error ? error.message : `Failed to ${actionType} revision`,
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: ShopDrawingRevision['status']) => {
    const config = REVISION_STATUS_CONFIG[status]
    const Icon = config.icon
    
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${config.color}`} />
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getLatestRevision = () => {
    return revisions.reduce((latest, current) => {
      if (!latest) return current
      return new Date(current.created_at) > new Date(latest.created_at) ? current : latest
    }, null as ShopDrawingRevision | null)
  }

  const getCurrentRevision = () => {
    return revisions.find(r => ['approved', 'under_review', 'submitted'].includes(r.status)) || getLatestRevision()
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            Loading revisions...
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentRevision = getCurrentRevision()
  const latestRevision = getLatestRevision()

  return (
    <div className="space-y-6">
      {/* Current Revision Status */}
      {currentRevision && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Current Revision: {currentRevision.revision_number}
                  {getStatusBadge(currentRevision.status)}
                </CardTitle>
                <CardDescription>{currentRevision.title}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {!showClientView && canCreateRevision && (
                  <Dialog open={showNewRevisionDialog} onOpenChange={setShowNewRevisionDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        New Revision
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create New Revision</DialogTitle>
                        <DialogDescription>
                          Upload a new revision of this shop drawing
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateRevision} className="space-y-4">
                        <div>
                          <Label htmlFor="revision-title">Title *</Label>
                          <Input
                            id="revision-title"
                            value={newRevisionData.title}
                            onChange={(e) => setNewRevisionData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Revision title"
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="revision-description">Description *</Label>
                          <Textarea
                            id="revision-description"
                            value={newRevisionData.description}
                            onChange={(e) => setNewRevisionData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Describe the changes in this revision"
                            rows={3}
                            required
                          />
                        </div>
                        
                        <div>
                          <Label>Approval Stage</Label>
                          <Select 
                            value={newRevisionData.approval_stage} 
                            onValueChange={(value: any) => setNewRevisionData(prev => ({ ...prev, approval_stage: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {APPROVAL_STAGES.map(stage => (
                                <SelectItem key={stage.value} value={stage.value}>
                                  <div>
                                    <div>{stage.label}</div>
                                    <div className="text-xs text-muted-foreground">{stage.description}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="revision-file">Drawing File *</Label>
                          <Input
                            id="revision-file"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            onChange={(e) => setNewRevisionData(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                            required
                          />
                        </div>
                        
                        <div className="flex justify-end gap-2 pt-4">
                          <Button type="button" variant="outline" onClick={() => setShowNewRevisionDialog(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">
                            Create Revision
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
                
                {currentRevision.status === 'under_review' && canApprove && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleApprovalAction(currentRevision, 'approve')}
                      className="text-green-600 hover:text-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleApprovalAction(currentRevision, 'reject')}
                      className="text-red-600 hover:text-red-700"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Created by: {currentRevision.created_by}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Created: {new Date(currentRevision.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{currentRevision.approval_stage}</Badge>
              </div>
            </div>
            
            {currentRevision.description && (
              <p className="mt-3 text-muted-foreground">{currentRevision.description}</p>
            )}
            
            {currentRevision.rejection_reason && (
              <Alert className="mt-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Rejection Reason:</strong> {currentRevision.rejection_reason}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Revision History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Revision History ({revisions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {revisions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No revisions yet. Create the first revision to begin the approval process.
            </div>
          ) : (
            <div className="space-y-4">
              {revisions
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((revision, index) => (
                  <div key={revision.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-700">
                        {revision.revision_number}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{revision.title}</h4>
                        {getStatusBadge(revision.status)}
                        {index === 0 && (
                          <Badge variant="outline" className="text-xs">Latest</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{revision.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>By {revision.created_by}</span>
                        <span>{new Date(revision.created_at).toLocaleDateString()}</span>
                        <span>{(revision.file_size / 1024 / 1024).toFixed(1)} MB</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval/Rejection Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve' : 'Reject'} Revision
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' 
                ? 'Approve this revision to move it to the next stage'
                : 'Reject this revision and provide feedback for improvement'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="approval-comments">Comments</Label>
              <Textarea
                id="approval-comments"
                value={approvalData.comments}
                onChange={(e) => setApprovalData(prev => ({ ...prev, comments: e.target.value }))}
                placeholder={actionType === 'approve' ? 'Optional approval notes' : 'Feedback for revision'}
                rows={3}
              />
            </div>
            
            {actionType === 'reject' && (
              <div>
                <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                <Textarea
                  id="rejection-reason"
                  value={approvalData.rejection_reason}
                  onChange={(e) => setApprovalData(prev => ({ ...prev, rejection_reason: e.target.value }))}
                  placeholder="Specify what needs to be changed"
                  rows={2}
                  required
                />
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitApprovalAction}
              variant={actionType === 'approve' ? 'default' : 'destructive'}
            >
              {actionType === 'approve' ? 'Approve' : 'Reject'} Revision
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}