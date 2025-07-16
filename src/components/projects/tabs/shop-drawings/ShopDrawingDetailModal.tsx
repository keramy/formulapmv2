// ============================================================================
// V3 Shop Drawing Detail Modal Component
// ============================================================================
// Built with optimization patterns: DataStateWrapper, FormBuilder pattern
// Following V3 schema and workflow requirements
// ============================================================================

'use client'

import React, { useState } from 'react'
import { 
  Eye, Download, Upload, MessageSquare, CheckCircle, XCircle, 
  Clock, FileText, User, Calendar, Tag, ArrowRight, Edit 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataStateWrapper, ListLoading } from '@/components/ui/loading-states'
import { useAuth } from '@/hooks/useAuth'
import { hasPermission } from '@/lib/permissions'

// ============================================================================
// TYPES
// ============================================================================

interface ShopDrawing {
  id: string
  title: string
  discipline: string
  current_submission_id: string | null
  created_at: string
  created_by: string
  updated_at: string
  current_submission?: {
    id: string
    version_number: number
    status: string
    file_name: string
    submitted_at: string
    submitted_by: {
      full_name: string
    }
  }
}

interface ShopDrawingDetailModalProps {
  isOpen: boolean
  onClose: () => void
  drawing: ShopDrawing
  onUpdate: () => void
}

interface Submission {
  id: string
  version_number: number
  status: string
  file_name: string
  file_url: string
  file_size: number
  submitted_at: string
  submitted_by: {
    id: string
    full_name: string
    email: string
  }
  reviews: Review[]
}

interface Review {
  id: string
  reviewer_id: string
  review_type: 'internal' | 'client'
  action: 'approved' | 'approved_with_comments' | 'rejected' | 'commented'
  comments: string | null
  reviewed_at: string
  reviewer: {
    id: string
    full_name: string
    email: string
    role: string
  }
}

// ============================================================================
// STATUS HELPERS
// ============================================================================

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'pending_internal_review':
      return { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800', icon: Clock }
    case 'ready_for_client_review':
      return { label: 'Ready for Client', color: 'bg-blue-100 text-blue-800', icon: Eye }
    case 'pending_client_review':
      return { label: 'Client Review', color: 'bg-purple-100 text-purple-800', icon: Clock }
    case 'approved':
      return { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle }
    case 'rejected':
      return { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle }
    default:
      return { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: FileText }
  }
}

const getActionConfig = (action: string) => {
  switch (action) {
    case 'approved':
      return { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle }
    case 'approved_with_comments':
      return { label: 'Approved with Comments', color: 'bg-blue-100 text-blue-800', icon: CheckCircle }
    case 'rejected':
      return { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle }
    case 'commented':
      return { label: 'Commented', color: 'bg-gray-100 text-gray-800', icon: MessageSquare }
    default:
      return { label: action, color: 'bg-gray-100 text-gray-800', icon: MessageSquare }
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ShopDrawingDetailModal: React.FC<ShopDrawingDetailModalProps> = ({
  isOpen,
  onClose,
  drawing,
  onUpdate
}) => {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [isReviewing, setIsReviewing] = useState(false)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected' | 'commented'>('approved')

  // Mock data - replace with actual API calls
  const [submissions, setSubmissions] = useState<Submission[]>([
    {
      id: 'sub-1',
      version_number: 2,
      status: 'pending_internal_review',
      file_name: 'foundation-details-v2.pdf',
      file_url: '/mock-files/foundation-details-v2.pdf',
      file_size: 2457600,
      submitted_at: '2024-01-20T14:30:00Z',
      submitted_by: {
        id: 'user-1',
        full_name: 'John Architect',
        email: 'john@example.com'
      },
      reviews: [
        {
          id: 'rev-1',
          reviewer_id: 'user-2',
          review_type: 'internal',
          action: 'approved_with_comments',
          comments: 'Good overall design. Please adjust reinforcement details on sheet 3.',
          reviewed_at: '2024-01-18T10:00:00Z',
          reviewer: {
            id: 'user-2',
            full_name: 'Sarah Engineer',
            email: 'sarah@example.com',
            role: 'technical_engineer'
          }
        }
      ]
    }
  ])

  // Permission checks
  const canReview = profile && hasPermission(profile.role, 'shop_drawings.review')
  const canApprove = profile && hasPermission(profile.role, 'shop_drawings.approve')
  const canUpdate = profile && hasPermission(profile.role, 'shop_drawings.update')

  const currentSubmission = submissions.find(s => s.id === drawing.current_submission_id) || submissions[0]
  const statusConfig = getStatusConfig(currentSubmission?.status || 'draft')
  const StatusIcon = statusConfig.icon

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleReviewSubmit = async () => {
    if (!currentSubmission) return

    setIsReviewing(true)
    try {
      // TODO: Implement actual API call to submit review
      // POST /api/shop-drawings/submissions/{submissionId}/reviews
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock success
      onUpdate()
      setIsReviewing(false)
      setReviewComment('')
      
    } catch (error) {
      console.error('Review submission error:', error)
      setIsReviewing(false)
    }
  }

  const handleSendToClient = async () => {
    if (!currentSubmission) return

    try {
      // TODO: Implement actual API call
      // POST /api/shop-drawings/submissions/{submissionId}/ready-for-client
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      onUpdate()
      
    } catch (error) {
      console.error('Send to client error:', error)
    }
  }

  const handleFileDownload = (fileUrl: string, fileName: string) => {
    // TODO: Implement actual file download
    console.log('Downloading:', fileName, fileUrl)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="h-5 w-5" />
            {drawing.title}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Drawing Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Drawing Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Discipline:</span>
                    <Badge variant="outline">{drawing.discipline}</Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Created:</span>
                    <span>{new Date(drawing.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">Last Updated:</span>
                    <span>{new Date(drawing.updated_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Current Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Current Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentSubmission ? (
                    <>
                      <div className="flex items-center gap-2">
                        <StatusIcon className="h-4 w-4" />
                        <Badge className={statusConfig.color}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Version:</span>
                        <span>{currentSubmission.version_number}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Submitted by:</span>
                        <span>{currentSubmission.submitted_by.full_name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Submitted:</span>
                        <span>{new Date(currentSubmission.submitted_at).toLocaleDateString()}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500">No submissions yet</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Current File */}
            {currentSubmission && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Current File</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="font-medium">{currentSubmission.file_name}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(currentSubmission.file_size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleFileDownload(currentSubmission.file_url, currentSubmission.file_name)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            {currentSubmission && canReview && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    {currentSubmission.status === 'pending_internal_review' && canApprove && (
                      <>
                        <Button 
                          onClick={handleSendToClient}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve & Send to Client
                        </Button>
                        <Button variant="destructive">
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}
                    
                    {canUpdate && (
                      <Button variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload New Version
                      </Button>
                    )}
                  </div>
                  
                  {/* Review Form */}
                  <div className="space-y-3">
                    <Label htmlFor="review-comment">Add Comment</Label>
                    <Textarea
                      id="review-comment"
                      placeholder="Add your review comments..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                    />
                    <Button 
                      onClick={handleReviewSubmit}
                      disabled={isReviewing || !reviewComment.trim()}
                    >
                      {isReviewing ? (
                        <>
                          <MessageSquare className="h-4 w-4 mr-2 animate-pulse" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Add Comment
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Submissions Tab */}
          <TabsContent value="submissions" className="space-y-4">
            <DataStateWrapper
              loading={false}
              error={null}
              data={submissions}
            >
              <div className="space-y-4">
                {submissions.map((submission) => {
                  const submissionStatusConfig = getStatusConfig(submission.status)
                  const SubmissionStatusIcon = submissionStatusConfig.icon
                  
                  return (
                    <Card key={submission.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold">Version {submission.version_number}</h3>
                              <Badge className={submissionStatusConfig.color}>
                                <SubmissionStatusIcon className="h-3 w-3 mr-1" />
                                {submissionStatusConfig.label}
                              </Badge>
                            </div>
                            
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>
                                <span className="font-medium">File:</span> {submission.file_name}
                                <span className="ml-2 font-medium">Size:</span> {formatFileSize(submission.file_size)}
                              </p>
                              <p>
                                <span className="font-medium">Submitted by:</span> {submission.submitted_by.full_name}
                                <span className="ml-2 font-medium">Date:</span> {new Date(submission.submitted_at).toLocaleDateString()}
                              </p>
                              <p>
                                <span className="font-medium">Reviews:</span> {submission.reviews.length}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleFileDownload(submission.file_url, submission.file_name)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </DataStateWrapper>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-4">
            <DataStateWrapper
              loading={false}
              error={null}
              data={currentSubmission?.reviews || []}
            >
              <div className="space-y-4">
                {(currentSubmission?.reviews || []).map((review) => {
                  const actionConfig = getActionConfig(review.action)
                  const ActionIcon = actionConfig.icon
                  
                  return (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-600" />
                            </div>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">{review.reviewer.full_name}</span>
                              <Badge variant="outline" className="text-xs">
                                {review.review_type}
                              </Badge>
                              <Badge className={actionConfig.color}>
                                <ActionIcon className="h-3 w-3 mr-1" />
                                {actionConfig.label}
                              </Badge>
                            </div>
                            
                            {review.comments && (
                              <p className="text-gray-700 mb-2">{review.comments}</p>
                            )}
                            
                            <p className="text-xs text-gray-500">
                              {new Date(review.reviewed_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
                
                {(!currentSubmission?.reviews || currentSubmission.reviews.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    No reviews yet
                  </div>
                )}
              </div>
            </DataStateWrapper>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export default ShopDrawingDetailModal