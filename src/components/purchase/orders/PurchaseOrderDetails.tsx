'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  ShoppingCart, 
  Building, 
  Calendar, 
  DollarSign, 
  Package, 
  FileText, 
  Truck, 
  User,
  Edit,
  Download,
  Send,
  CheckCircle,
  Clock,
  AlertTriangle,
  Camera,
  History
} from 'lucide-react'
import { PurchaseOrder, POStatus } from '@/types/purchase'

interface PurchaseOrderDetailsProps {
  order: PurchaseOrder
  onEdit?: () => void
  onDownload?: () => void
  onSendToVendor?: () => void
  onConfirmDelivery?: () => void
  onClose: () => void
  canEdit?: boolean
  canDownload?: boolean
  canSendToVendor?: boolean
  canConfirmDelivery?: boolean
  canViewFinancials?: boolean
}

const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    variant: 'secondary' as const,
    icon: FileText,
    color: 'bg-gray-500'
  },
  sent: {
    label: 'Sent',
    variant: 'default' as const,
    icon: Send,
    color: 'bg-blue-500'
  },
  confirmed: {
    label: 'Confirmed',
    variant: 'default' as const,
    icon: CheckCircle,
    color: 'bg-green-500'
  },
  delivered: {
    label: 'Delivered',
    variant: 'default' as const,
    icon: Truck,
    color: 'bg-indigo-500'
  },
  completed: {
    label: 'Completed',
    variant: 'default' as const,
    icon: CheckCircle,
    color: 'bg-green-600'
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'destructive' as const,
    icon: AlertTriangle,
    color: 'bg-red-500'
  }
}

export const PurchaseOrderDetails: React.FC<PurchaseOrderDetailsProps> = ({
  order,
  onEdit,
  onDownload,
  onSendToVendor,
  onConfirmDelivery,
  onClose,
  canEdit = false,
  canDownload = false,
  canSendToVendor = false,
  canConfirmDelivery = false,
  canViewFinancials = false
}) => {
  const [activeTab, setActiveTab] = useState('details')

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

  const statusConfig = STATUS_CONFIG[order.status]
  const StatusIcon = statusConfig.icon

  return (
    <div className="max-w-6xl mx-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Purchase Order Details</span>
            <Badge variant={statusConfig.variant} className="ml-2">
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {canDownload && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDownload}
                className="text-green-600 border-green-600 hover:bg-green-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
            {canSendToVendor && order.status === 'draft' && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSendToVendor}
                className="text-purple-600 border-purple-600 hover:bg-purple-50"
              >
                <Send className="h-4 w-4 mr-2" />
                Send to Vendor
              </Button>
            )}
            {canConfirmDelivery && order.status === 'confirmed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={onConfirmDelivery}
                className="text-indigo-600 border-indigo-600 hover:bg-indigo-50"
              >
                <Truck className="h-4 w-4 mr-2" />
                Confirm Delivery
              </Button>
            )}
          </div>
        </DialogTitle>
      </DialogHeader>

      <div className="mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="request">Original Request</TabsTrigger>
            <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Purchase Order Details */}
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Order Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ShoppingCart className="h-5 w-5" />
                    <span>Order Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">PO Number</Label>
                      <p className="text-sm font-mono">{order.po_number}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Status</Label>
                      <Badge variant={statusConfig.variant} className="mt-1">
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">PO Date</Label>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{formatDate(order.po_date)}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Expected Delivery</Label>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {order.expected_delivery_date ? 
                            formatDate(order.expected_delivery_date) : 
                            'Not specified'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {canViewFinancials && (
                    <>
                      <Separator />
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Total Amount</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span className="text-lg font-semibold text-green-600">
                            {formatCurrency(order.total_amount)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div>
                    <Label className="text-sm font-medium text-gray-600">Created By</Label>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {order.creator ? 
                          `${order.creator.first_name} ${order.creator.last_name}` : 
                          'Unknown'
                        }
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">Created Date</Label>
                    <p className="text-sm">{formatDate(order.created_at)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Vendor Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5" />
                    <span>Vendor Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Company Name</Label>
                    <p className="text-sm font-medium">{order.vendor?.company_name || 'Unknown'}</p>
                  </div>

                  {order.vendor?.contact_person && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Contact Person</Label>
                      <p className="text-sm">{order.vendor.contact_person}</p>
                    </div>
                  )}

                  {order.vendor?.email && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Email</Label>
                      <p className="text-sm">{order.vendor.email}</p>
                    </div>
                  )}

                  {order.vendor?.phone && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Phone</Label>
                      <p className="text-sm">{order.vendor.phone}</p>
                    </div>
                  )}

                  {order.vendor?.address && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Address</Label>
                      <p className="text-sm">{order.vendor.address}</p>
                    </div>
                  )}

                  {order.vendor?.payment_terms && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Payment Terms</Label>
                      <p className="text-sm">{order.vendor.payment_terms}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Terms and Conditions */}
            {order.terms_conditions && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Terms and Conditions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{order.terms_conditions}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Original Request */}
          <TabsContent value="request" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Original Purchase Request</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.purchase_request ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Request Number</Label>
                        <p className="text-sm font-mono">{order.purchase_request.request_number}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Status</Label>
                        <Badge variant="outline" className="mt-1">
                          {order.purchase_request.status}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Requester</Label>
                        <p className="text-sm">
                          {order.purchase_request.requester ? 
                            `${order.purchase_request.requester.first_name} ${order.purchase_request.requester.last_name}` : 
                            'Unknown'
                          }
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Project</Label>
                        <p className="text-sm">{order.purchase_request.project?.name || 'Unknown'}</p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <Label className="text-sm font-medium text-gray-600">Item Description</Label>
                      <p className="text-sm mt-1">{order.purchase_request.item_description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Quantity</Label>
                        <p className="text-sm">{order.purchase_request.quantity} {order.purchase_request.unit_of_measure}</p>
                      </div>
                      {canViewFinancials && order.purchase_request.estimated_cost && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Estimated Cost</Label>
                          <p className="text-sm">{formatCurrency(order.purchase_request.estimated_cost)}</p>
                        </div>
                      )}
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Required Date</Label>
                        <p className="text-sm">{formatDate(order.purchase_request.required_date)}</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-600">Urgency Level</Label>
                      <Badge variant="outline" className="mt-1">
                        {order.purchase_request.urgency_level}
                      </Badge>
                    </div>

                    {order.purchase_request.justification && (
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Justification</Label>
                        <p className="text-sm mt-1 p-3 bg-gray-50 rounded-md">{order.purchase_request.justification}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Original request information not available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deliveries */}
          <TabsContent value="deliveries" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Truck className="h-5 w-5" />
                  <span>Delivery Confirmations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.delivery_confirmations && order.delivery_confirmations.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Delivery Date</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Confirmed By</TableHead>
                          <TableHead>Photos</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.delivery_confirmations.map((delivery) => (
                          <TableRow key={delivery.id}>
                            <TableCell>
                              <span className="text-sm">{formatDate(delivery.delivery_date)}</span>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p>{delivery.quantity_received} received</p>
                                <p className="text-gray-500">of {delivery.quantity_ordered} ordered</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{delivery.status}</Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">
                                {delivery.confirmer ? 
                                  `${delivery.confirmer.first_name} ${delivery.confirmer.last_name}` : 
                                  'Unknown'
                                }
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <Camera className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">
                                  {delivery.photos?.length || 0} photos
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No delivery confirmations yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <History className="h-5 w-5" />
                  <span>Order History</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Order Created</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(order.created_at)} by {order.creator?.first_name} {order.creator?.last_name}
                      </p>
                    </div>
                  </div>

                  {order.status !== 'draft' && (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Order Sent to Vendor</p>
                        <p className="text-xs text-gray-500">
                          Sent to {order.vendor?.company_name}
                        </p>
                      </div>
                    </div>
                  )}

                  {['confirmed', 'delivered', 'completed'].includes(order.status) && (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Order Confirmed</p>
                        <p className="text-xs text-gray-500">
                          Confirmed by vendor
                        </p>
                      </div>
                    </div>
                  )}

                  {['delivered', 'completed'].includes(order.status) && (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Delivery Confirmed</p>
                        <p className="text-xs text-gray-500">
                          Items delivered and confirmed
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <div className="flex justify-end mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  )
}