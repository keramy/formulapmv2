'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Package, 
  Calendar, 
  DollarSign, 
  User, 
  Building, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Edit,
  Trash2,
  ShoppingCart,
  History,
  MessageSquare
} from 'lucide-react'
import { PurchaseRequest } from '@/types/purchase'

interface PurchaseRequestDetailsProps {
  request: PurchaseRequest
  onEdit?: () => void
  onDelete?: () => void
  onCreateOrder?: () => void
  onClose: () => void
  canEdit?: boolean
  canDelete?: boolean
  canCreateOrder?: boolean
  canViewFinancials?: boolean
}

const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    color: 'bg-gray-500',
    variant: 'secondary' as const,
    icon: Edit,
    description: 'Request is being prepared'
  },
  pending_approval: {
    label: 'Pending Approval',
    color: 'bg-yellow-500',
    variant: 'default' as const,
    icon: Clock,
    description: 'Waiting for management approval'
  },
  approved: {
    label: 'Approved',
    color: 'bg-green-500',
    variant: 'default' as const,
    icon: CheckCircle,
    description: 'Request has been approved'
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-500',
    variant: 'destructive' as const,
    icon: XCircle,
    description: 'Request was rejected'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-gray-400',
    variant: 'outline' as const,
    icon: XCircle,
    description: 'Request was cancelled'
  }
}

const URGENCY_CONFIG = {
  low: {
    label: 'Low Priority',
    color: 'bg-blue-500',
    variant: 'outline' as const,
    description: 'Standard procurement timeline'
  },
  normal: {
    label: 'Normal Priority',
    color: 'bg-green-500',
    variant: 'secondary' as const,
    description: 'Regular business need'
  },
  high: {
    label: 'High Priority',
    color: 'bg-orange-500',
    variant: 'default' as const,
    description: 'Expedited processing needed'
  },
  emergency: {
    label: 'Emergency',
    color: 'bg-red-500',
    variant: 'destructive' as const,
    description: 'Critical for project continuity'
  }
}

export const PurchaseRequestDetails: React.FC<PurchaseRequestDetailsProps> = ({
  request,
  onEdit,
  onDelete,
  onCreateOrder,
  onClose,
  canEdit = false,
  canDelete = false,
  canCreateOrder = false,
  canViewFinancials = false
}) => {
  const [activeTab, setActiveTab] = useState('details')

  const statusConfig = STATUS_CONFIG[request.status]
  const urgencyConfig = URGENCY_CONFIG[request.urgency_level]
  const StatusIcon = statusConfig.icon
  
  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Not specified'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isOverdue = () => {
    if (request.status === 'approved' || request.status === 'rejected' || request.status === 'cancelled') return false
    return new Date(request.required_date) < new Date()
  }

  const daysUntilDue = () => {
    const today = new Date()
    const dueDate = new Date(request.required_date)
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Package className="h-6 w-6" />
              <div>
                <CardTitle className="text-xl">
                  Purchase Request #{request.request_number}
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Created on {formatDateTime(request.created_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {canEdit && request.status === 'draft' && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {canCreateOrder && request.status === 'approved' && (
                <Button size="sm" onClick={onCreateOrder}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Create Order
                </Button>
              )}
              {canDelete && (request.status === 'draft' || request.status === 'rejected') && (
                <Button variant="destructive" size="sm" onClick={onDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Status and Priority Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <StatusIcon className="h-5 w-5" />
                <div>
                  <h3 className="font-medium">Status</h3>
                  <p className="text-sm text-gray-500">{statusConfig.description}</p>
                </div>
              </div>
              <Badge variant={statusConfig.variant}>
                {statusConfig.label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <h3 className="font-medium">Priority</h3>
                  <p className="text-sm text-gray-500">{urgencyConfig.description}</p>
                </div>
              </div>
              <Badge variant={urgencyConfig.variant}>
                {urgencyConfig.label}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Due Date Alert */}
      {isOverdue() && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-medium text-red-900">Request Overdue</h3>
                <p className="text-sm text-red-700">
                  This request was due {Math.abs(daysUntilDue())} days ago
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="approvals" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approvals
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Request Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Item Description */}
              <div>
                <h3 className="font-medium mb-2">Item Description</h3>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm">{request.item_description}</p>
                </div>
              </div>

              {/* Quantity and Unit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Quantity</h3>
                  <p className="text-lg font-semibold">{request.quantity}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Unit of Measure</h3>
                  <p className="text-lg">{request.unit_of_measure}</p>
                </div>
              </div>

              {/* Cost and Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {canViewFinancials && (
                  <div>
                    <h3 className="font-medium mb-2 flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      Estimated Cost
                    </h3>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(request.estimated_cost)}
                    </p>
                  </div>
                )}
                <div>
                  <h3 className="font-medium mb-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Required Date
                  </h3>
                  <p className="text-lg">{formatDate(request.required_date)}</p>
                  {!isOverdue() && daysUntilDue() >= 0 && (
                    <p className="text-sm text-gray-500">
                      {daysUntilDue() === 0 ? 'Due today' : `${daysUntilDue()} days remaining`}
                    </p>
                  )}
                </div>
              </div>

              {/* Justification */}
              {request.justification && (
                <div>
                  <h3 className="font-medium mb-2">Justification</h3>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm">{request.justification}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project and Requester Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Project
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{request.project?.name || 'Unknown Project'}</p>
                  {request.project?.status && (
                    <Badge variant="outline">{request.project.status}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Requester
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">
                    {request.requester ? 
                      `${request.requester.first_name} ${request.requester.last_name}` : 
                      'Unknown Requester'
                    }
                  </p>
                  {request.requester?.role && (
                    <Badge variant="outline">{request.requester.role}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Approvals Tab */}
        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle>Approval Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              {request.approvals && request.approvals.length > 0 ? (
                <div className="space-y-4">
                  {request.approvals.map((approval, index) => (
                    <div key={approval.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{approval.approver_role}</Badge>
                          {approval.approver && (
                            <span className="text-sm">
                              {approval.approver.first_name} {approval.approver.last_name}
                            </span>
                          )}
                        </div>
                        <Badge variant={approval.approval_status === 'approved' ? 'default' : 
                                      approval.approval_status === 'rejected' ? 'destructive' : 'secondary'}>
                          {approval.approval_status}
                        </Badge>
                      </div>
                      {approval.approval_date && (
                        <p className="text-sm text-gray-500 mb-2">
                          {approval.approval_status} on {formatDateTime(approval.approval_date)}
                        </p>
                      )}
                      {approval.comments && (
                        <div className="bg-gray-50 p-2 rounded text-sm">
                          {approval.comments}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No approval workflow started yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {request.purchase_orders && request.purchase_orders.length > 0 ? (
                <div className="space-y-4">
                  {request.purchase_orders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">PO #{order.po_number}</h3>
                        <Badge variant="outline">{order.status}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Vendor:</span>
                          <p>{order.vendor?.company_name || 'Unknown'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Amount:</span>
                          <p className="font-medium">{formatCurrency(order.total_amount)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">PO Date:</span>
                          <p>{formatDate(order.po_date)}</p>
                        </div>
                        {order.expected_delivery_date && (
                          <div>
                            <span className="text-gray-500">Expected Delivery:</span>
                            <p>{formatDate(order.expected_delivery_date)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {request.status === 'approved' 
                      ? 'No purchase orders created yet'
                      : 'Request must be approved before creating purchase orders'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-2 border-gray-200 pl-4">
                  <div className="flex items-center space-x-2 mb-1">
                    <Package className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium">Request Created</span>
                  </div>
                  <p className="text-sm text-gray-500">{formatDateTime(request.created_at)}</p>
                </div>
                
                {request.updated_at !== request.created_at && (
                  <div className="border-l-2 border-gray-200 pl-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <Edit className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium">Request Updated</span>
                    </div>
                    <p className="text-sm text-gray-500">{formatDateTime(request.updated_at)}</p>
                  </div>
                )}

                {/* Additional history items would come from a separate API call */}
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">Complete activity history coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}