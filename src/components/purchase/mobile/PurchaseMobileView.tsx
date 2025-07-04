'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { 
  Package, 
  ShoppingCart, 
  Building, 
  CheckCircle, 
  Truck, 
  Plus,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  DollarSign,
  User,
  Clock,
  AlertTriangle,
  Eye,
  Edit,
  Phone,
  Mail
} from 'lucide-react'
import { PurchaseRequest, PurchaseOrder, Vendor, ApprovalWorkflow, DeliveryConfirmation } from '@/types/purchase'

interface PurchaseMobileViewProps {
  // Data
  requests: PurchaseRequest[]
  orders: PurchaseOrder[]
  vendors: Vendor[]
  approvals: ApprovalWorkflow[]
  deliveries: DeliveryConfirmation[]
  
  // Loading states
  loading: boolean
  
  // Permissions
  canCreateRequests: boolean
  canCreateOrders: boolean
  canViewFinancials: boolean
  
  // Actions
  onCreateRequest: () => void
  onViewRequest: (request: PurchaseRequest) => void
  onViewOrder: (order: PurchaseOrder) => void
  onViewVendor: (vendor: Vendor) => void
  onViewApproval: (approval: ApprovalWorkflow) => void
  onViewDelivery: (delivery: DeliveryConfirmation) => void
}

export const PurchaseMobileView: React.FC<PurchaseMobileViewProps> = ({
  requests,
  orders,
  vendors,
  approvals,
  deliveries,
  loading,
  canCreateRequests,
  canCreateOrders,
  canViewFinancials,
  onCreateRequest,
  onViewRequest,
  onViewOrder,
  onViewVendor,
  onViewApproval,
  onViewDelivery
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('requests')

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getDaysAgo = (dateString: string) => {
    const today = new Date()
    const date = new Date(dateString)
    const diffTime = today.getTime() - date.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return '1 day ago'
    return `${diffDays} days ago`
  }

  // Filter data based on search term
  const filterData = (data: any[], searchFields: string[]) => {
    if (!searchTerm) return data
    
    return data.filter(item =>
      searchFields.some(field => {
        const value = field.split('.').reduce((obj, key) => obj?.[key], item)
        return value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      })
    )
  }

  const filteredRequests = filterData(requests, ['request_number', 'item_description', 'requester.first_name', 'requester.last_name'])
  const filteredOrders = filterData(orders, ['po_number', 'vendor.company_name'])
  const filteredVendors = filterData(vendors, ['company_name', 'contact_person'])
  const filteredApprovals = filterData(approvals, ['purchase_request.request_number', 'purchase_request.item_description'])
  const filteredDeliveries = filterData(deliveries, ['purchase_order.po_number', 'purchase_order.vendor.company_name'])

  const RequestCard = ({ request }: { request: PurchaseRequest }) => (
    <Card className="mb-3" onClick={() => onViewRequest(request)}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <p className="font-medium text-sm line-clamp-2">{request.item_description}</p>
            <p className="text-xs text-gray-500 mt-1">#{request.request_number}</p>
          </div>
          <Badge variant="outline" className="ml-2 text-xs">
            {request.status}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
          <div className="flex items-center text-gray-600">
            <Package className="h-3 w-3 mr-1" />
            {request.quantity} {request.unit_of_measure}
          </div>
          <div className="flex items-center text-gray-600">
            <Calendar className="h-3 w-3 mr-1" />
            {formatDate(request.required_date)}
          </div>
          {canViewFinancials && request.estimated_cost && (
            <div className="flex items-center text-gray-600">
              <DollarSign className="h-3 w-3 mr-1" />
              {formatCurrency(request.estimated_cost)}
            </div>
          )}
          <div className="flex items-center text-gray-600">
            <User className="h-3 w-3 mr-1" />
            {request.requester ? `${request.requester.first_name} ${request.requester.last_name}` : 'Unknown'}
          </div>
        </div>

        {request.urgency_level === 'high' || request.urgency_level === 'emergency' && (
          <div className="mt-2">
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {request.urgency_level}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const OrderCard = ({ order }: { order: PurchaseOrder }) => (
    <Card className="mb-3" onClick={() => onViewOrder(order)}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <p className="font-medium text-sm">PO #{order.po_number}</p>
            <p className="text-xs text-gray-500 mt-1">{order.vendor?.company_name || 'Unknown Vendor'}</p>
          </div>
          <Badge variant="outline" className="ml-2 text-xs">
            {order.status}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
          <div className="flex items-center text-gray-600">
            <Calendar className="h-3 w-3 mr-1" />
            {formatDate(order.po_date)}
          </div>
          {canViewFinancials && (
            <div className="flex items-center text-gray-600">
              <DollarSign className="h-3 w-3 mr-1" />
              {formatCurrency(order.total_amount)}
            </div>
          )}
          <div className="flex items-center text-gray-600">
            <Building className="h-3 w-3 mr-1" />
            {order.vendor?.company_name || 'Unknown'}
          </div>
          <div className="flex items-center text-gray-600">
            <Clock className="h-3 w-3 mr-1" />
            {getDaysAgo(order.created_at)}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const VendorCard = ({ vendor }: { vendor: Vendor }) => (
    <Card className="mb-3" onClick={() => onViewVendor(vendor)}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <p className="font-medium text-sm">{vendor.company_name}</p>
            {vendor.contact_person && (
              <p className="text-xs text-gray-500 mt-1">{vendor.contact_person}</p>
            )}
          </div>
          <Badge variant={vendor.is_active ? "default" : "secondary"} className="ml-2 text-xs">
            {vendor.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
          {vendor.email && (
            <div className="flex items-center text-gray-600">
              <Mail className="h-3 w-3 mr-1" />
              <span className="truncate">{vendor.email}</span>
            </div>
          )}
          {vendor.phone && (
            <div className="flex items-center text-gray-600">
              <Phone className="h-3 w-3 mr-1" />
              {vendor.phone}
            </div>
          )}
          {vendor.average_rating && (
            <div className="flex items-center text-gray-600">
              <span className="text-yellow-500">★</span>
              <span className="ml-1">{vendor.average_rating.toFixed(1)}</span>
            </div>
          )}
          <div className="flex items-center text-gray-600">
            <Clock className="h-3 w-3 mr-1" />
            {getDaysAgo(vendor.created_at)}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const ApprovalCard = ({ approval }: { approval: ApprovalWorkflow }) => {
    const daysWaiting = Math.ceil((new Date().getTime() - new Date(approval.created_at).getTime()) / (1000 * 60 * 60 * 24))
    const isUrgent = daysWaiting > 3

    return (
      <Card className={`mb-3 ${isUrgent ? 'border-red-300 bg-red-50' : ''}`} onClick={() => onViewApproval(approval)}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <p className="font-medium text-sm line-clamp-2">
                {approval.purchase_request?.item_description || 'Unknown Request'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                #{approval.purchase_request?.request_number}
              </p>
            </div>
            <Badge variant="outline" className="ml-2 text-xs">
              {approval.approver_role}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
            <div className="flex items-center text-gray-600">
              <User className="h-3 w-3 mr-1" />
              {approval.purchase_request?.requester ? 
                `${approval.purchase_request.requester.first_name} ${approval.purchase_request.requester.last_name}` : 
                'Unknown'
              }
            </div>
            <div className={`flex items-center ${isUrgent ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
              <Clock className="h-3 w-3 mr-1" />
              {daysWaiting} days waiting
            </div>
          </div>

          {isUrgent && (
            <div className="mt-2">
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Urgent
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const DeliveryCard = ({ delivery }: { delivery: DeliveryConfirmation }) => (
    <Card className="mb-3" onClick={() => onViewDelivery(delivery)}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <p className="font-medium text-sm">PO #{delivery.purchase_order?.po_number || 'Unknown'}</p>
            <p className="text-xs text-gray-500 mt-1">
              {delivery.purchase_order?.vendor?.company_name || 'Unknown Vendor'}
            </p>
          </div>
          <Badge variant="outline" className="ml-2 text-xs">
            {delivery.status}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
          <div className="flex items-center text-gray-600">
            <Calendar className="h-3 w-3 mr-1" />
            {formatDate(delivery.delivery_date)}
          </div>
          <div className="flex items-center text-gray-600">
            <Package className="h-3 w-3 mr-1" />
            {delivery.quantity_received}/{delivery.quantity_ordered}
          </div>
          <div className="flex items-center text-gray-600">
            <User className="h-3 w-3 mr-1" />
            {delivery.confirmer ? 
              `${delivery.confirmer.first_name} ${delivery.confirmer.last_name}` : 
              'Unknown'
            }
          </div>
          <div className="flex items-center text-gray-600">
            <Clock className="h-3 w-3 mr-1" />
            {getDaysAgo(delivery.created_at)}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="sticky top-0 bg-white z-10 p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">Purchase Management</h1>
          {canCreateRequests && (
            <Button size="sm" onClick={onCreateRequest}>
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mx-4 my-3">
          <TabsTrigger value="requests" className="text-xs">
            <Package className="w-3 h-3 mr-1" />
            Requests
          </TabsTrigger>
          <TabsTrigger value="orders" className="text-xs">
            <ShoppingCart className="w-3 h-3 mr-1" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="vendors" className="text-xs">
            <Building className="w-3 h-3 mr-1" />
            Vendors
          </TabsTrigger>
          <TabsTrigger value="approvals" className="text-xs">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approvals
          </TabsTrigger>
          <TabsTrigger value="deliveries" className="text-xs">
            <Truck className="w-3 h-3 mr-1" />
            Deliveries
          </TabsTrigger>
        </TabsList>

        <div className="px-4">
          <TabsContent value="requests" className="mt-0">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No purchase requests found</p>
              </div>
            ) : (
              <div>
                {filteredRequests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders" className="mt-0">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No purchase orders found</p>
              </div>
            ) : (
              <div>
                {filteredOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="vendors" className="mt-0">
            {filteredVendors.length === 0 ? (
              <div className="text-center py-8">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No vendors found</p>
              </div>
            ) : (
              <div>
                {filteredVendors.map((vendor) => (
                  <VendorCard key={vendor.id} vendor={vendor} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approvals" className="mt-0">
            {filteredApprovals.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No pending approvals</p>
              </div>
            ) : (
              <div>
                {filteredApprovals.map((approval) => (
                  <ApprovalCard key={approval.id} approval={approval} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="deliveries" className="mt-0">
            {filteredDeliveries.length === 0 ? (
              <div className="text-center py-8">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No delivery confirmations</p>
              </div>
            ) : (
              <div>
                {filteredDeliveries.map((delivery) => (
                  <DeliveryCard key={delivery.id} delivery={delivery} />
                ))}
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}