'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CheckCircle, XCircle, Clock, AlertTriangle, Eye } from 'lucide-react'
import { ApprovalWorkflow } from '@/types/purchase'

interface ApprovalQueueProps {
  approvals: ApprovalWorkflow[]
  loading?: boolean
  onApprove: (approvalId: string, comments?: string) => void
  onReject: (approvalId: string, comments: string) => void
  onView: (approval: ApprovalWorkflow) => void
  canApprove?: boolean
}

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({
  approvals,
  loading = false,
  onApprove,
  onReject,
  onView,
  canApprove = false
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Pending Approvals</span>
          <Badge variant="outline" className="ml-2">
            {approvals.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {approvals.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No pending approvals</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Days Waiting</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvals.map((approval) => {
                  const daysWaiting = getDaysWaiting(approval.created_at)
                  const isUrgent = daysWaiting > 3
                  
                  return (
                    <TableRow key={approval.id} className={isUrgent ? 'bg-red-50' : ''}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {approval.purchase_request?.item_description || 'Unknown Request'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Req #{approval.purchase_request?.request_number}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {approval.purchase_request?.requester ? 
                            `${approval.purchase_request.requester.first_name} ${approval.purchase_request.requester.last_name}` : 
                            'Unknown'
                          }
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{approval.approver_role}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className={`text-sm ${isUrgent ? 'text-red-600 font-medium' : ''}`}>
                          {daysWaiting} {daysWaiting === 1 ? 'day' : 'days'}
                          {isUrgent && (
                            <div className="flex items-center space-x-1 text-red-600">
                              <AlertTriangle className="h-3 w-3" />
                              <span className="text-xs">Urgent</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onView(approval)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canApprove && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onApprove(approval.id)}
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onReject(approval.id, 'Rejected from queue')}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}