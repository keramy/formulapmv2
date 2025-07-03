/**
 * Formula PM 2.0 Purchase Management Page
 * Purchase Department Workflow Implementation
 * 
 * Main purchase management interface following Formula PM patterns
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Package, 
  ShoppingCart, 
  Building, 
  CheckCircle, 
  Truck, 
  Plus,
  BarChart3,
  Clock,
  AlertTriangle,
  DollarSign,
  TrendingUp
} from 'lucide-react'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { usePurchaseCoordinator } from '@/components/purchase/PurchaseCoordinator'
import { PurchaseRequestForm } from '@/components/purchase/requests/PurchaseRequestForm'
import { PurchaseRequestList } from '@/components/purchase/requests/PurchaseRequestList'
import { PurchaseRequestDetails } from '@/components/purchase/requests/PurchaseRequestDetails'
import { PurchaseOrderForm } from '@/components/purchase/orders/PurchaseOrderForm'
import { PurchaseOrderList } from '@/components/purchase/orders/PurchaseOrderList'
import { VendorDatabase } from '@/components/purchase/vendors/VendorDatabase'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { PurchaseRequest, PurchaseOrder } from '@/types/purchase'

export default function PurchasePage() {
  const { profile } = useAuth()
  const { isPurchaseRole, isManagement } = usePermissions()
  
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [showRequestDetails, setShowRequestDetails] = useState(false)

  // Use the main coordinator
  const {
    state,
    setActiveTab,
    
    // Data
    requests,
    orders,
    vendors,
    statistics,
    
    // Loading states
    loading,
    requestsLoading,
    ordersLoading,
    vendorsLoading,
    
    // Operations
    coordinateRequestCreation,
    coordinateRequestUpdate,
    coordinateRequestDeletion,
    coordinateOrderCreation,
    coordinateOrderUpdate,
    coordinateVendorCreation,
    coordinateVendorUpdate,
    coordinateVendorRating,
    
    // Permissions
    effectivePermissions,
    isManagement: isManagementRole,
    isPurchaseRole: isPurchaseRoleActive
  } = usePurchaseCoordinator({
    globalView: true,
    initialTab: 'requests'
  })

  const handleCreateRequest = async (requestData: any) => {
    await coordinateRequestCreation(requestData)
    setShowRequestForm(false)
  }

  const handleUpdateRequest = async (requestId: string, updates: any) => {
    await coordinateRequestUpdate(requestId, updates)
    setShowRequestForm(false)
    setSelectedRequest(null)
  }

  const handleDeleteRequest = async (requestId: string) => {
    if (confirm('Are you sure you want to delete this request?')) {
      await coordinateRequestDeletion(requestId)
      setSelectedRequest(null)
      setShowRequestDetails(false)
    }
  }

  const handleCreateOrder = async (orderData: any) => {
    await coordinateOrderCreation(orderData)
    setShowOrderForm(false)
    setSelectedRequest(null)
  }

  const handleViewRequest = (request: PurchaseRequest) => {
    setSelectedRequest(request)
    setShowRequestDetails(true)
  }

  const handleEditRequest = (request: PurchaseRequest) => {
    setSelectedRequest(request)
    setShowRequestForm(true)
  }

  const handleCreateOrderFromRequest = (request: PurchaseRequest) => {
    setSelectedRequest(request)
    setShowOrderForm(true)
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <AuthGuard requiredPermission="purchase.view">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Purchase Management</h1>
            <p className="text-muted-foreground">
              {isPurchaseRoleActive 
                ? 'Manage purchase requests, orders, and vendor relationships'
                : 'Submit and track purchase requests for your projects'
              }
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {effectivePermissions.canCreateRequests && (
              <Button onClick={() => setShowRequestForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.total_requests}</div>
                <div className="flex items-center space-x-2 mt-2">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs text-muted-foreground">
                    {statistics.pending_approvals} pending approval
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {statistics.active_orders}
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <Truck className="h-3 w-3" />
                  <span className="text-xs text-muted-foreground">
                    {statistics.pending_deliveries} pending delivery
                  </span>
                </div>
              </CardContent>
            </Card>

            {effectivePermissions.canViewFinancials && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(statistics.total_spent)}
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <TrendingUp className="h-3 w-3" />
                    <span className="text-xs text-muted-foreground">
                      This period
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Approval Time</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {statistics.average_approval_time}h
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <CheckCircle className="h-3 w-3" />
                  <span className="text-xs text-muted-foreground">
                    Average processing
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={state.activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Requests
              {statistics?.pending_approvals > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {statistics.pending_approvals}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="vendors" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Vendors
            </TabsTrigger>
            <TabsTrigger value="approvals" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Approvals
            </TabsTrigger>
            <TabsTrigger value="deliveries" className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Deliveries
            </TabsTrigger>
          </TabsList>

          {/* Purchase Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            <PurchaseRequestList
              requests={requests}
              loading={requestsLoading}
              onView={handleViewRequest}
              onEdit={handleEditRequest}
              onDelete={handleDeleteRequest}
              onStatusFilter={() => {}} // Handled by coordinator
              onUrgencyFilter={() => {}} // Handled by coordinator
              onSearch={() => {}} // Handled by coordinator
              canEdit={effectivePermissions.canCreateRequests}
              canDelete={effectivePermissions.canCreateRequests}
              canViewFinancials={effectivePermissions.canViewFinancials}
            />
          </TabsContent>

          {/* Purchase Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <PurchaseOrderList
              orders={orders}
              loading={ordersLoading}
              onView={() => {}} // TODO: Implement order details
              onEdit={() => {}} // TODO: Implement order editing
              onStatusFilter={() => {}} // Handled by coordinator
              onSearch={() => {}} // Handled by coordinator
              canEdit={effectivePermissions.canCreateOrders}
              canViewFinancials={effectivePermissions.canViewFinancials}
            />
          </TabsContent>

          {/* Vendors Tab */}
          <TabsContent value="vendors" className="space-y-4">
            <VendorDatabase
              vendors={vendors}
              loading={vendorsLoading}
              onView={() => {}} // TODO: Implement vendor details
              onEdit={() => {}} // TODO: Implement vendor editing
              onCreate={coordinateVendorCreation}
              onUpdate={coordinateVendorUpdate}
              onRate={coordinateVendorRating}
              onSearch={() => {}} // Handled by coordinator
              canCreate={effectivePermissions.canManageVendors}
              canEdit={effectivePermissions.canManageVendors}
              canRate={isPurchaseRoleActive || isManagementRole}
            />
          </TabsContent>

          {/* Approvals Tab */}
          <TabsContent value="approvals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Approval Workflow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Approval workflow components coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deliveries Tab */}
          <TabsContent value="deliveries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  Delivery Confirmations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Delivery confirmation components coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        
        {/* Request Form Dialog */}
        <Dialog open={showRequestForm} onOpenChange={setShowRequestForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedRequest ? 'Edit Purchase Request' : 'Create Purchase Request'}
              </DialogTitle>
            </DialogHeader>
            <PurchaseRequestForm
              request={selectedRequest || undefined}
              onSubmit={selectedRequest ? 
                (data) => handleUpdateRequest(selectedRequest.id, data) : 
                handleCreateRequest
              }
              onCancel={() => {
                setShowRequestForm(false)
                setSelectedRequest(null)
              }}
              loading={loading}
            />
          </DialogContent>
        </Dialog>

        {/* Order Form Dialog */}
        <Dialog open={showOrderForm} onOpenChange={setShowOrderForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Purchase Order</DialogTitle>
            </DialogHeader>
            <PurchaseOrderForm
              purchaseRequest={selectedRequest || undefined}
              onSubmit={handleCreateOrder}
              onCancel={() => {
                setShowOrderForm(false)
                setSelectedRequest(null)
              }}
              loading={loading}
            />
          </DialogContent>
        </Dialog>

        {/* Request Details Dialog */}
        <Dialog open={showRequestDetails} onOpenChange={setShowRequestDetails}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            {selectedRequest && (
              <PurchaseRequestDetails
                request={selectedRequest}
                onEdit={() => {
                  setShowRequestDetails(false)
                  setShowRequestForm(true)
                }}
                onDelete={() => handleDeleteRequest(selectedRequest.id)}
                onCreateOrder={() => {
                  setShowRequestDetails(false)
                  handleCreateOrderFromRequest(selectedRequest)
                }}
                onClose={() => {
                  setShowRequestDetails(false)
                  setSelectedRequest(null)
                }}
                canEdit={effectivePermissions.canCreateRequests}
                canDelete={effectivePermissions.canCreateRequests}
                canCreateOrder={effectivePermissions.canCreateOrders && selectedRequest.status === 'approved'}
                canViewFinancials={effectivePermissions.canViewFinancials}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  )
}