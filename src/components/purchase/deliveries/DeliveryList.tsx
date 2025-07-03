'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Truck, CheckCircle, Clock, AlertTriangle, Camera } from 'lucide-react'
import { DeliveryConfirmation } from '@/types/purchase'

interface DeliveryListProps {
  deliveries: DeliveryConfirmation[]
  loading?: boolean
  onConfirm: (deliveryId: string, confirmationData: any) => void
  onView: (delivery: DeliveryConfirmation) => void
  canConfirm?: boolean
}

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    variant: 'default' as const,
    icon: Clock
  },
  partial: {
    label: 'Partial',
    variant: 'default' as const,
    icon: AlertTriangle
  },
  completed: {
    label: 'Completed',
    variant: 'default' as const,
    icon: CheckCircle
  },
  damaged: {
    label: 'Damaged',
    variant: 'destructive' as const,
    icon: AlertTriangle
  },
  rejected: {
    label: 'Rejected',
    variant: 'destructive' as const,
    icon: AlertTriangle
  }
}

export const DeliveryList: React.FC<DeliveryListProps> = ({
  deliveries,
  loading = false,
  onConfirm,
  onView,
  canConfirm = false
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
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
          <Truck className="h-5 w-5" />
          <span>Delivery Confirmations</span>
          <Badge variant="outline" className="ml-2">
            {deliveries.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {deliveries.length === 0 ? (
          <div className="text-center py-8">
            <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No pending deliveries</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Delivery Date</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Photos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((delivery) => {
                  const statusConfig = STATUS_CONFIG[delivery.status]
                  const StatusIcon = statusConfig.icon
                  
                  return (
                    <TableRow key={delivery.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            PO #{delivery.purchase_order?.po_number || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {delivery.purchase_order?.vendor?.company_name || 'Unknown Vendor'}
                          </p>
                        </div>
                      </TableCell>
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
                        <div className="flex items-center space-x-1">
                          <Camera className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {delivery.photos?.length || 0} photos
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig.variant}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {canConfirm && delivery.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onConfirm(delivery.id, {})}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
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