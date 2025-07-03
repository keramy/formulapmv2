'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar, 
  DollarSign, 
  User, 
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Package,
  ArrowUpDown
} from 'lucide-react'
import { PurchaseRequest, RequestStatus, UrgencyLevel } from '@/types/purchase'

interface PurchaseRequestListProps {
  requests: PurchaseRequest[]
  loading?: boolean
  onView: (request: PurchaseRequest) => void
  onEdit: (request: PurchaseRequest) => void
  onDelete: (requestId: string) => void
  onStatusFilter: (statuses: RequestStatus[]) => void
  onUrgencyFilter: (urgencyLevels: UrgencyLevel[]) => void
  onSearch: (searchTerm: string) => void
  canEdit?: boolean
  canDelete?: boolean
  canViewFinancials?: boolean
}

const STATUS_CONFIG = {
  draft: {
    label: 'Draft',
    color: 'bg-gray-500',
    variant: 'secondary' as const,
    icon: Edit
  },
  pending_approval: {
    label: 'Pending Approval',
    color: 'bg-yellow-500',
    variant: 'default' as const,
    icon: Clock
  },
  approved: {
    label: 'Approved',
    color: 'bg-green-500',
    variant: 'default' as const,
    icon: CheckCircle
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-500',
    variant: 'destructive' as const,
    icon: XCircle
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-gray-400',
    variant: 'outline' as const,
    icon: XCircle
  }
}

const URGENCY_CONFIG = {
  low: {
    label: 'Low',
    color: 'bg-blue-500',
    variant: 'outline' as const
  },
  normal: {
    label: 'Normal',
    color: 'bg-green-500',
    variant: 'secondary' as const
  },
  high: {
    label: 'High',
    color: 'bg-orange-500',
    variant: 'default' as const
  },
  emergency: {
    label: 'Emergency',
    color: 'bg-red-500',
    variant: 'destructive' as const
  }
}

export const PurchaseRequestList: React.FC<PurchaseRequestListProps> = ({
  requests,
  loading = false,
  onView,
  onEdit,
  onDelete,
  onStatusFilter,
  onUrgencyFilter,
  onSearch,
  canEdit = false,
  canDelete = false,
  canViewFinancials = false
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<RequestStatus[]>([])
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyLevel[]>([])
  const [sortField, setSortField] = useState<keyof PurchaseRequest>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    onSearch(value)
  }

  // Handle status filter
  const handleStatusFilter = (status: RequestStatus) => {
    const newFilter = statusFilter.includes(status)
      ? statusFilter.filter(s => s !== status)
      : [...statusFilter, status]
    setStatusFilter(newFilter)
    onStatusFilter(newFilter)
  }

  // Handle urgency filter
  const handleUrgencyFilter = (urgency: UrgencyLevel) => {
    const newFilter = urgencyFilter.includes(urgency)
      ? urgencyFilter.filter(u => u !== urgency)
      : [...urgencyFilter, urgency]
    setUrgencyFilter(newFilter)
    onUrgencyFilter(newFilter)
  }

  // Handle sorting
  const handleSort = (field: keyof PurchaseRequest) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Sorted and filtered requests
  const processedRequests = useMemo(() => {
    let filtered = [...requests]

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
  }, [requests, sortField, sortDirection])

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Not specified'
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

  const isOverdue = (requiredDate: string, status: RequestStatus) => {
    if (status === 'approved' || status === 'rejected' || status === 'cancelled') return false
    return new Date(requiredDate) < new Date()
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
          <Package className="h-5 w-5" />
          <span>Purchase Requests</span>
          <Badge variant="outline" className="ml-2">
            {requests.length}
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
              placeholder="Search requests by description, requester, or project..."
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
                variant={statusFilter.includes(status as RequestStatus) ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatusFilter(status as RequestStatus)}
                className="h-7"
              >
                {config.label}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Urgency:</span>
            </div>
            {Object.entries(URGENCY_CONFIG).map(([urgency, config]) => (
              <Button
                key={urgency}
                variant={urgencyFilter.includes(urgency as UrgencyLevel) ? "default" : "outline"}
                size="sm"
                onClick={() => handleUrgencyFilter(urgency as UrgencyLevel)}
                className="h-7"
              >
                {config.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Requests Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('request_number')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Request #</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Required Date</span>
                  </div>
                </TableHead>
                {canViewFinancials && (
                  <TableHead>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-4 w-4" />
                      <span>Est. Cost</span>
                    </div>
                  </TableHead>
                )}
                <TableHead>Status</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedRequests.map((request) => {
                const statusConfig = STATUS_CONFIG[request.status]
                const urgencyConfig = URGENCY_CONFIG[request.urgency_level]
                const overdue = isOverdue(request.required_date, request.status)
                
                return (
                  <TableRow key={request.id} className={overdue ? 'bg-red-50' : ''}>
                    <TableCell className="font-medium">
                      {request.request_number}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="truncate font-medium">{request.item_description}</p>
                        <p className="text-sm text-gray-500">
                          {request.quantity} {request.unit_of_measure}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {request.project?.name || 'Unknown Project'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {request.requester ? 
                            `${request.requester.first_name} ${request.requester.last_name}` : 
                            'Unknown'
                          }
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`text-sm ${overdue ? 'text-red-600 font-medium' : ''}`}>
                        {formatDate(request.required_date)}
                        {overdue && (
                          <div className="flex items-center space-x-1 text-red-600">
                            <AlertTriangle className="h-3 w-3" />
                            <span className="text-xs">Overdue</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    {canViewFinancials && (
                      <TableCell>
                        <span className="text-sm">
                          {formatCurrency(request.estimated_cost)}
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
                      <Badge variant={urgencyConfig.variant}>
                        {urgencyConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(request)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canEdit && request.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(request)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (request.status === 'draft' || request.status === 'rejected') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(request.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
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
        {processedRequests.length === 0 && !loading && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No purchase requests found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter.length || urgencyFilter.length
                ? 'No requests match your current filters.'
                : 'Create your first purchase request to get started.'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}