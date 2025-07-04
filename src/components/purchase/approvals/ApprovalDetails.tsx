'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  User, 
  Calendar, 
  Package, 
  DollarSign,
  FileText,
  Building 
} from 'lucide-react'
import { ApprovalWorkflow, ApprovalAction } from '@/types/purchase'

const approvalSchema = z.object({
  approval_status: z.enum(['approved', 'rejected']),
  comments: z.string().max(500, 'Comments must be less than 500 characters').optional()
})

type ApprovalFormData = z.infer<typeof approvalSchema>

interface ApprovalDetailsProps {
  approval: ApprovalWorkflow
  onApprove: (approvalId: string, action: ApprovalAction) => Promise<void>
  onClose: () => void
  loading?: boolean
  canApprove?: boolean
}

export const ApprovalDetails: React.FC<ApprovalDetailsProps> = ({
  approval,
  onApprove,
  onClose,
  loading = false,
  canApprove = false
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [selectedAction, setSelectedAction] = useState<'approved' | 'rejected' | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ApprovalFormData>({
    resolver: zodResolver(approvalSchema)
  })

  const handleApprovalAction = async (action: 'approved' | 'rejected') => {
    setSelectedAction(action)
    setSubmitting(true)
    
    try {
      await onApprove(approval.id, {
        approval_status: action,
        comments: ''
      })
      onClose()
    } catch (error) {
      console.error('Approval action failed:', error)
    } finally {
      setSubmitting(false)
      setSelectedAction(null)
    }
  }

  const onSubmit = async (data: ApprovalFormData) => {
    setSubmitting(true)
    
    try {
      await onApprove(approval.id, {
        approval_status: data.approval_status,
        comments: data.comments || ''
      })
      onClose()
    } catch (error) {
      console.error('Approval submission failed:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getDaysWaiting = (createdAt: string) => {
    const today = new Date()
    const created = new Date(createdAt)
    const diffTime = today.getTime() - created.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysWaiting = getDaysWaiting(approval.created_at)
  const isUrgent = daysWaiting > 3
  const request = approval.purchase_request

  return (
    <div className="max-w-4xl mx-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Approval Request Details</span>
          {isUrgent && (
            <Badge variant="destructive" className="ml-2">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Urgent ({daysWaiting} days)
            </Badge>
          )}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6 mt-6">
        {/* Request Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Purchase Request Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Request Number</Label>
                <p className="text-sm font-mono">{request?.request_number || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Status</Label>
                <Badge variant="outline" className="mt-1">
                  {request?.status || 'Unknown'}
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Project</Label>
                <p className="text-sm">{request?.project?.name || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Requester</Label>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {request?.requester ? 
                      `${request.requester.first_name} ${request.requester.last_name}` : 
                      'Unknown'
                    }
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-sm font-medium text-gray-600">Item Description</Label>
              <p className="text-sm mt-1">{request?.item_description || 'N/A'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Quantity</Label>
                <p className="text-sm">{request?.quantity || 0} {request?.unit_of_measure || ''}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Estimated Cost</Label>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">
                    {formatCurrency(request?.estimated_cost)}
                  </span>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Required Date</Label>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {request?.required_date ? formatDate(request.required_date) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {request?.urgency_level && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Urgency Level</Label>
                <Badge 
                  variant={request.urgency_level === 'emergency' ? 'destructive' : 'outline'} 
                  className="mt-1"
                >
                  {request.urgency_level.charAt(0).toUpperCase() + request.urgency_level.slice(1)}
                </Badge>
              </div>
            )}

            {request?.justification && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Justification</Label>
                <p className="text-sm mt-1 p-3 bg-gray-50 rounded-md">{request.justification}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approval Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>Approval Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Approver Role</Label>
                <Badge variant="outline" className="mt-1">
                  {approval.approver_role}
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Submitted</Label>
                <p className="text-sm">{formatDate(approval.created_at)}</p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-600">Days Waiting</Label>
              <div className={`text-sm ${isUrgent ? 'text-red-600 font-medium' : ''}`}>
                {daysWaiting} {daysWaiting === 1 ? 'day' : 'days'}
                {isUrgent && (
                  <span className="ml-2 text-red-600">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    Requires immediate attention
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Approval Actions */}
        {canApprove && approval.approval_status === 'pending' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Approval Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="comments">Comments (Optional)</Label>
                  <Textarea
                    id="comments"
                    {...register('comments')}
                    placeholder="Add any comments about your approval decision..."
                    className="mt-1"
                    rows={3}
                  />
                  {errors.comments && (
                    <p className="text-sm text-red-600 mt-1">{errors.comments.message}</p>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4">
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleApprovalAction('approved')}
                      disabled={submitting}
                      className="text-green-600 border-green-600 hover:bg-green-50"
                    >
                      {submitting && selectedAction === 'approved' ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleApprovalAction('rejected')}
                      disabled={submitting}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      {submitting && selectedAction === 'rejected' ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Rejecting...
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </>
                      )}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Read-only for non-approvers */}
        {!canApprove && (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}