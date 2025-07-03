'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  FileText, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Camera,
  Download,
  Calendar,
  User,
  AlertTriangle
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ShopDrawing {
  id: string
  drawing_number: string
  drawing_title: string
  drawing_category: string
  current_version: string
  current_status: string
  pdf_file_path?: string
  thumbnail_path?: string
  assigned_to?: string
  target_approval_date?: string
  created_at: string
  projects: {
    id: string
    name: string
  }
  created_by_user: {
    user_id: string
    email: string
    full_name?: string
  }
  assigned_user?: {
    user_id: string
    email: string
    full_name?: string
  }
  current_approvals: Array<{
    id: string
    approver_role: string
    approval_status: string
    approval_date?: string
  }>
  progress_photos: Array<{
    id: string
    thumbnail_path?: string
    description?: string
    is_issue_photo: boolean
    taken_at: string
  }>
}

interface MobileDrawingCardProps {
  drawing: ShopDrawing
  onSelect: (drawing: ShopDrawing) => void
  onApprove: (data: { approvalStatus: string; comments?: string }) => void
  onReject: (data: { approvalStatus: string; comments: string }) => void
}

const MobileDrawingCard: React.FC<MobileDrawingCardProps> = ({
  drawing,
  onSelect,
  onApprove,
  onReject
}) => {
  const [approvalComments, setApprovalComments] = useState('')
  const [rejectionComments, setRejectionComments] = useState('')
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [showRejectionDialog, setShowRejectionDialog] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500'
      case 'submitted': return 'bg-blue-500'
      case 'under_review': return 'bg-yellow-500'
      case 'approved': return 'bg-green-500'
      case 'rejected': return 'bg-red-500'
      case 'revision_required': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const getCategoryIcon = (category: string) => {
    return <FileText className="w-4 h-4" />
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />
      case 'revision_required': return <AlertTriangle className="w-4 h-4 text-orange-600" />
      default: return <FileText className="w-4 h-4 text-blue-600" />
    }
  }

  const handleApprove = () => {
    onApprove({
      approvalStatus: 'approved',
      comments: approvalComments
    })
    setShowApprovalDialog(false)
    setApprovalComments('')
  }

  const handleReject = () => {
    if (!rejectionComments.trim()) return
    
    onReject({
      approvalStatus: 'rejected',
      comments: rejectionComments
    })
    setShowRejectionDialog(false)
    setRejectionComments('')
  }

  const canApprove = ['submitted', 'under_review'].includes(drawing.current_status)
  const hasIssues = drawing.progress_photos?.some(p => p.is_issue_photo) || false
  const isOverdue = drawing.target_approval_date && 
    new Date(drawing.target_approval_date) < new Date() &&
    !['approved', 'rejected'].includes(drawing.current_status)

  return (
    <Card className="w-full touch-manipulation">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header with status and category */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {getCategoryIcon(drawing.drawing_category)}
                <span className="font-medium text-sm truncate">
                  {drawing.drawing_number}
                </span>
                <Badge variant="outline" className="text-xs capitalize">
                  {drawing.drawing_category}
                </Badge>
              </div>
              <h3 className="font-semibold text-base line-clamp-2 mb-2">
                {drawing.drawing_title}
              </h3>
              <p className="text-xs text-muted-foreground">
                {drawing.projects.name}
              </p>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <Badge 
                variant="secondary" 
                className={`text-white text-xs ${getStatusColor(drawing.current_status)}`}
              >
                {drawing.current_status.replace('_', ' ')}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive" className="text-xs">
                  Overdue
                </Badge>
              )}
            </div>
          </div>

          {/* Meta information */}
          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span className="truncate">
                {drawing.created_by_user.full_name || drawing.created_by_user.email}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>v{drawing.current_version}</span>
            </div>
            <div className="flex items-center gap-1 col-span-2">
              <span>Created {formatDistanceToNow(new Date(drawing.created_at), { addSuffix: true })}</span>
            </div>
          </div>

          {/* Progress indicators */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Approval status */}
              <div className="flex items-center gap-1">
                {getStatusIcon(drawing.current_status)}
                <span className="text-xs">
                  {drawing.current_approvals?.filter(a => a.approval_status === 'approved').length || 0}/3
                </span>
              </div>
              
              {/* Progress photos */}
              {drawing.progress_photos && drawing.progress_photos.length > 0 && (
                <div className="flex items-center gap-1">
                  <Camera className={`w-4 h-4 ${hasIssues ? 'text-red-500' : 'text-green-500'}`} />
                  <span className="text-xs">
                    {drawing.progress_photos.length}
                    {hasIssues && ' (!)'}
                  </span>
                </div>
              )}
            </div>

            {/* Target date */}
            {drawing.target_approval_date && (
              <div className="text-xs text-muted-foreground">
                Due {formatDistanceToNow(new Date(drawing.target_approval_date))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelect(drawing)}
              className="flex-1 text-xs"
            >
              <Eye className="w-3 h-3 mr-1" />
              View PDF
            </Button>

            {drawing.pdf_file_path && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/api/shop-drawings/${drawing.id}/pdf?download=true`, '_blank')}
                className="text-xs"
              >
                <Download className="w-3 h-3" />
              </Button>
            )}

            {canApprove && (
              <>
                <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 hover:text-green-700 text-xs"
                    >
                      <CheckCircle className="w-3 h-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Approve Drawing
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="p-3 bg-muted rounded-md">
                        <p className="font-medium text-sm">{drawing.drawing_number}</p>
                        <p className="text-sm text-muted-foreground">{drawing.drawing_title}</p>
                      </div>
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
                        <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                          Approve
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 text-xs"
                    >
                      <XCircle className="w-3 h-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-red-600" />
                        Reject Drawing
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="p-3 bg-muted rounded-md">
                        <p className="font-medium text-sm">{drawing.drawing_number}</p>
                        <p className="text-sm text-muted-foreground">{drawing.drawing_title}</p>
                      </div>
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
                          onClick={handleReject} 
                          disabled={!rejectionComments.trim()}
                          variant="destructive"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default MobileDrawingCard