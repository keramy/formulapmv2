'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, XCircle, Clock, AlertTriangle, Eye, CheckCheck, XSquare, Filter, SortDesc } from 'lucide-react'
import { ApprovalWorkflow } from '@/types/purchase'

interface ApprovalQueueProps {
  approvals: ApprovalWorkflow[]
  loading?: boolean
  onApprove: (approvalId: string, comments?: string) => void
  onReject: (approvalId: string, comments: string) => void
  onBatchApprove?: (approvalIds: string[], comments?: string) => void
  onBatchReject?: (approvalIds: string[], comments: string) => void
  onView: (approval: ApprovalWorkflow) => void
  canApprove?: boolean
  enableBatchActions?: boolean
}

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({
  approvals,
  loading = false,
  onApprove,
  onReject,
  onBatchApprove,
  onBatchReject,
  onView,
  canApprove = false,
  enableBatchActions = false
}) => {
  const [selectedApprovals, setSelectedApprovals] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'date' | 'urgency' | 'requester'>('date')
  const [filterByRole, setFilterByRole] = useState<string | null>(null)
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

  // Filter and sort approvals
  const filteredAndSortedApprovals = React.useMemo(() => {
    let filtered = approvals

    // Filter by role
    if (filterByRole) {
      filtered = filtered.filter(approval => approval.approver_role === filterByRole)
    }

    // Sort approvals
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'urgency':
          const aDays = getDaysWaiting(a.created_at)
          const bDays = getDaysWaiting(b.created_at)
          return bDays - aDays // Most urgent first
        case 'requester':
          const aRequester = a.purchase_request?.requester ? 
            `${a.purchase_request.requester.first_name} ${a.purchase_request.requester.last_name}` : 
            'Unknown'
          const bRequester = b.purchase_request?.requester ? 
            `${b.purchase_request.requester.first_name} ${b.purchase_request.requester.last_name}` : 
            'Unknown'
          return aRequester.localeCompare(bRequester)
        case 'date':
        default:
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
    })

    return filtered
  }, [approvals, filterByRole, sortBy])

  // Batch selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedApprovals(filteredAndSortedApprovals.map(approval => approval.id))
    } else {
      setSelectedApprovals([])
    }
  }

  const handleSelectApproval = (approvalId: string, checked: boolean) => {
    if (checked) {
      setSelectedApprovals(prev => [...prev, approvalId])
    } else {
      setSelectedApprovals(prev => prev.filter(id => id !== approvalId))
    }
  }

  const handleBatchApprove = () => {
    if (selectedApprovals.length > 0 && onBatchApprove) {
      onBatchApprove(selectedApprovals, 'Batch approved')
      setSelectedApprovals([])
    }
  }

  const handleBatchReject = () => {
    if (selectedApprovals.length > 0 && onBatchReject) {
      onBatchReject(selectedApprovals, 'Batch rejected')
      setSelectedApprovals([])
    }
  }

  const uniqueRoles = Array.from(new Set(approvals.map(approval => approval.approver_role)))
  const urgentCount = filteredAndSortedApprovals.filter(approval => getDaysWaiting(approval.created_at) > 3).length

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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Pending Approvals</span>
            <Badge variant="outline" className="ml-2">
              {filteredAndSortedApprovals.length}
            </Badge>
            {urgentCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {urgentCount} urgent
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            {/* Sort Options */}
            <div className="flex items-center space-x-1">
              <SortDesc className="h-4 w-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'urgency' | 'requester')}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="date">Date</option>
                <option value="urgency">Urgency</option>
                <option value="requester">Requester</option>
              </select>
            </div>

            {/* Role Filter */}
            {uniqueRoles.length > 1 && (
              <div className="flex items-center space-x-1">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={filterByRole || ''}
                  onChange={(e) => setFilterByRole(e.target.value || null)}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="">All Roles</option>
                  {uniqueRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Batch Actions */}
        {enableBatchActions && canApprove && selectedApprovals.length > 0 && (
          <div className="flex items-center space-x-2 pt-2">
            <Badge variant="secondary">
              {selectedApprovals.length} selected
            </Badge>
            <Button
              size="sm"
              onClick={handleBatchApprove}
              className="text-green-600 border-green-600 hover:bg-green-50"
              variant="outline"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Approve All
            </Button>
            <Button
              size="sm"
              onClick={handleBatchReject}
              className="text-red-600 border-red-600 hover:bg-red-50"
              variant="outline"
            >
              <XSquare className="h-4 w-4 mr-1" />
              Reject All
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {filteredAndSortedApprovals.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {approvals.length === 0 ? 'No pending approvals' : 'No approvals match the current filter'}
            </p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  {enableBatchActions && canApprove && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedApprovals.length === filteredAndSortedApprovals.length && filteredAndSortedApprovals.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                  )}
                  <TableHead>Request</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Days Waiting</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedApprovals.map((approval) => {
                  const daysWaiting = getDaysWaiting(approval.created_at)
                  const isUrgent = daysWaiting > 3
                  
                  return (
                    <TableRow key={approval.id} className={isUrgent ? 'bg-red-50' : ''}>
                      {enableBatchActions && canApprove && (
                        <TableCell>
                          <Checkbox
                            checked={selectedApprovals.includes(approval.id)}
                            onCheckedChange={(checked) => handleSelectApproval(approval.id, checked as boolean)}
                          />
                        </TableCell>
                      )}
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