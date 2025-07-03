'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Calendar, 
  DollarSign, 
  Building, 
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ShoppingCart,
  ArrowUpDown,
  AlertTriangle
} from 'lucide-react'
import { PurchaseOrder, POStatus } from '@/types/purchase'

interface PurchaseOrderListProps {
  orders: PurchaseOrder[]
  loading?: boolean
  onView: (order: PurchaseOrder) => void
  onEdit: (order: PurchaseOrder) => void
  onStatusFilter: (statuses: POStatus[]) => void
  onSearch: (searchTerm: string) => void
  canEdit?: boolean
  canViewFinancials?: boolean
}

const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    color: 'bg-gray-500',
    variant: 'secondary' as const,
    icon: Edit
  },
  sent: {
    label: 'Sent',
    color: 'bg-blue-500',
    variant: 'default' as const,
    icon: Clock
  },
  confirmed: {
    label: 'Confirmed',
    color: 'bg-green-500',
    variant: 'default' as const,
    icon: CheckCircle
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-purple-500',
    variant: 'default' as const,
    icon: Truck
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-600',
    variant: 'default' as const,
    icon: CheckCircle
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-gray-400',
    variant: 'outline' as const,
    icon: XCircle
  }
}

export const PurchaseOrderList: React.FC<PurchaseOrderListProps> = ({
  orders,
  loading = false,
  onView,
  onEdit,
  onStatusFilter,
  onSearch,
  canEdit = false,
  canViewFinancials = false
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<POStatus[]>([])
  const [sortField, setSortField] = useState<keyof PurchaseOrder>('po_date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    onSearch(value)
  }

  // Handle status filter
  const handleStatusFilter = (status: POStatus) => {
    const newFilter = statusFilter.includes(status)
      ? statusFilter.filter(s => s !== status)
      : [...statusFilter, status]
    setStatusFilter(newFilter)
    onStatusFilter(newFilter)
  }

  // Handle sorting
  const handleSort = (field: keyof PurchaseOrder) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Sorted orders
  const processedOrders = useMemo(() => {
    let filtered = [...orders]

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [orders, sortField, sortDirection])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isOverdue = (deliveryDate?: string, status?: POStatus) => {
    if (!deliveryDate || status === 'delivered' || status === 'completed' || status === 'cancelled') return false
    return new Date(deliveryDate) < new Date()
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
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
          <ShoppingCart className="h-5 w-5" />
          <span>Purchase Orders</span>
          <Badge variant="outline" className="ml-2">
            {orders.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters and Search */}
        <div className="space-y-4 mb-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search orders by PO number, vendor, or request..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Status:</span>
            </div>
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <Button
                key={status}
                variant={statusFilter.includes(status as POStatus) ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatusFilter(status as POStatus)}
                className="h-7"
              >
                {config.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('po_number')}
                >
                  <div className="flex items-center space-x-1">
                    <span>PO Number</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Request Item</TableHead>
                <TableHead>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>PO Date</span>
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center space-x-1">
                    <Truck className="h-4 w-4" />
                    <span>Expected Delivery</span>
                  </div>
                </TableHead>
                {canViewFinancials && (
                  <TableHead>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-4 w-4" />
                      <span>Amount</span>
                    </div>
                  </TableHead>
                )}
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedOrders.map((order) => {
                const statusConfig = STATUS_CONFIG[order.status]
                const overdue = isOverdue(order.expected_delivery_date, order.status)
                
                return (
                  <TableRow key={order.id} className={overdue ? 'bg-red-50' : ''}>
                    <TableCell className="font-medium">
                      {order.po_number}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium">{order.vendor?.company_name || 'Unknown Vendor'}</p>
                          {order.vendor?.contact_person && (
                            <p className="text-sm text-gray-500">{order.vendor.contact_person}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        {order.purchase_request ? (
                          <>
                            <p className="truncate font-medium">
                              {order.purchase_request.item_description}
                            </p>
                            <p className="text-sm text-gray-500">
                              Req #{order.purchase_request.request_number}
                            </p>
                          </>
                        ) : (
                          <p className="text-gray-500">Request not available</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatDate(order.po_date)}</span>
                    </TableCell>
                    <TableCell>
                      {order.expected_delivery_date ? (
                        <div className={`text-sm ${overdue ? 'text-red-600 font-medium' : ''}`}>
                          {formatDate(order.expected_delivery_date)}
                          {overdue && (
                            <div className="flex items-center space-x-1 text-red-600">
                              <AlertTriangle className="h-3 w-3" />
                              <span className="text-xs">Overdue</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Not specified</span>
                      )}
                    </TableCell>
                    {canViewFinancials && (
                      <TableCell>
                        <span className="text-sm font-medium">
                          {formatCurrency(order.total_amount)}
                        </span>
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant={statusConfig.variant}>
                        <statusConfig.icon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(order)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canEdit && (order.status === 'draft' || order.status === 'sent') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(order)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
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

        {/* Empty State */}
        {processedOrders.length === 0 && !loading && (
          <div className="text-center py-12">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No purchase orders found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter.length
                ? 'No orders match your current filters.'
                : 'Purchase orders will appear here once created from approved requests.'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}