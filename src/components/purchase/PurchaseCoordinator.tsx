/**
 * Formula PM 2.0 Purchase Coordinator Component
 * Purchase Department Workflow Implementation
 * 
 * Coordinator pattern implementation following Formula PM optimized-coordinator-v1.md
 * Orchestrates purchase management operations with maximum efficiency and parallel processing
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePurchaseRequests, usePurchaseOrders, useVendors, usePurchaseApprovals, useDeliveryConfirmations, usePurchaseStatistics } from '@/hooks/usePurchase'
import { usePermissions } from '@/hooks/usePermissions'
import { useToast } from '@/components/ui/use-toast'
import { RequestStatus, POStatus, UrgencyLevel, PurchaseRequestFilters, PurchaseOrderFilters, VendorFilters } from '@/types/purchase'

interface PurchaseCoordinatorProps {
  projectId?: string
  globalView?: boolean
  initialTab?: 'requests' | 'orders' | 'vendors' | 'approvals' | 'deliveries'
  userPermissions?: {
    canCreateRequests: boolean
    canApprove: boolean
    canCreateOrders: boolean
    canManageVendors: boolean
    canConfirmDeliveries: boolean
    canViewFinancials: boolean
  }
}

interface PurchaseCoordinatorState {
  activeTab: 'requests' | 'orders' | 'vendors' | 'approvals' | 'deliveries'
  requestFilters: PurchaseRequestFilters
  orderFilters: PurchaseOrderFilters
  vendorFilters: VendorFilters
  searchTerm: string
  sortField: string
  sortDirection: 'asc' | 'desc'
  showCreateDialog: boolean
  showApprovalDialog: boolean
  showDeliveryDialog: boolean
  selectedItem: string | null
  operationInProgress: boolean
}

/**
 * Coordinator hook following optimized-coordinator-v1.md patterns
 * Manages complex purchase operations through delegation and parallel processing
 */
export const usePurchaseCoordinator = ({ 
  projectId, 
  globalView = false,
  initialTab = 'requests',
  userPermissions
}: PurchaseCoordinatorProps) => {
  // === DEPENDENCY ANALYSIS (Core Dependencies First) ===
  const { 
    checkPermission,
    isManagement,
    isPurchaseRole
  } = usePermissions()
  
  const { toast } = useToast()

  // === STATE MANAGEMENT (Foundation) ===
  const [state, setState] = useState<PurchaseCoordinatorState>({
    activeTab: initialTab,
    requestFilters: {},
    orderFilters: {},
    vendorFilters: { is_active: true },
    searchTerm: '',
    sortField: 'created_at',
    sortDirection: 'desc',
    showCreateDialog: false,
    showApprovalDialog: false,
    showDeliveryDialog: false,
    selectedItem: null,
    operationInProgress: false
  })

  // === PARALLEL PROCESSING (Wave 1 - Foundation Tasks) ===
  const {
    requests,
    loading: requestsLoading,
    error: requestsError,
    totalCount: requestsCount,
    fetchRequests,
    createRequest,
    updateRequest,
    deleteRequest,
    filterByStatus: filterRequestsByStatus,
    filterByUrgency,
    canCreate: canCreateRequests,
    canUpdate: canUpdateRequests,
    canDelete: canDeleteRequests,
    canApprove: canApproveRequests
  } = usePurchaseRequests(globalView ? undefined : projectId)

  const {
    orders,
    loading: ordersLoading,
    error: ordersError,
    totalCount: ordersCount,
    fetchOrders,
    createOrder,
    updateOrder,
    filterByStatus: filterOrdersByStatus,
    canCreate: canCreateOrders,
    canUpdate: canUpdateOrders,
    canViewFinancials: canViewOrderFinancials
  } = usePurchaseOrders(globalView ? undefined : projectId)

  const {
    vendors,
    loading: vendorsLoading,
    error: vendorsError,
    totalCount: vendorsCount,
    fetchVendors,
    createVendor,
    updateVendor,
    rateVendor,
    activeVendors,
    getVendorsByRating,
    canCreate: canCreateVendors,
    canUpdate: canUpdateVendors,
    canRate: canRateVendors
  } = useVendors()

  const {
    pendingApprovals,
    loading: approvalsLoading,
    error: approvalsError,
    fetchPendingApprovals,
    processApproval,
    fetchApprovalHistory,
    canApprove,
    canViewHistory: canViewApprovalHistory
  } = usePurchaseApprovals(globalView ? undefined : projectId)

  const {
    deliveries,
    loading: deliveriesLoading,
    error: deliveriesError,
    fetchPendingDeliveries,
    confirmDelivery,
    canConfirm: canConfirmDeliveries
  } = useDeliveryConfirmations(globalView ? undefined : projectId)

  const {
    statistics,
    loading: statisticsLoading,
    error: statisticsError,
    refreshStatistics,
    canViewFinancials: canViewStatisticsFinancials
  } = usePurchaseStatistics(globalView ? undefined : projectId)

  // === EFFECTIVE PERMISSIONS (Quality Gate) ===
  const effectivePermissions = userPermissions || {
    canCreateRequests: canCreateRequests,
    canApprove: canApproveRequests,
    canCreateOrders: canCreateOrders,
    canManageVendors: canCreateVendors,
    canConfirmDeliveries: canConfirmDeliveries,
    canViewFinancials: canViewOrderFinancials || canViewStatisticsFinancials
  }

  // === COORDINATION WORKFLOW PROTOCOL ===
  
  /**
   * WAVE 1: Foundation Operations (Execute Immediately)
   * Core data fetching with filters and sorting
   */
  const coordinateDataFetch = useCallback(() => {
    const pagination = {
      page: 1,
      limit: 50,
      sort_field: state.sortField,
      sort_direction: state.sortDirection
    }

    // Parallel fetch based on active tab
    switch (state.activeTab) {
      case 'requests':
        fetchRequests(state.requestFilters, pagination)
        break
      case 'orders':
        fetchOrders(state.orderFilters, pagination)
        break
      case 'vendors':
        fetchVendors(state.vendorFilters, pagination)
        break
      case 'approvals':
        fetchPendingApprovals()
        break
      case 'deliveries':
        fetchPendingDeliveries()
        break
    }
  }, [state.activeTab, state.requestFilters, state.orderFilters, state.vendorFilters, state.sortField, state.sortDirection, fetchRequests, fetchOrders, fetchVendors, fetchPendingApprovals, fetchPendingDeliveries])

  /**
   * WAVE 2: Feature Operations (Execute After Wave 1 Approval)
   * CRUD operations for purchase requests
   */
  const coordinateRequestCreation = async (requestData: any) => {
    setState(prev => ({ ...prev, operationInProgress: true }))
    
    try {
      await createRequest({
        ...requestData,
        project_id: projectId || requestData.project_id
      })
      
      toast({
        title: "Request Created",
        description: "Purchase request created successfully",
      })
      
      setState(prev => ({ ...prev, showCreateDialog: false }))
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create purchase request",
        variant: "destructive"
      })
    } finally {
      setState(prev => ({ ...prev, operationInProgress: false }))
    }
  }

  const coordinateRequestUpdate = async (requestId: string, updates: any) => {
    try {
      await updateRequest(requestId, updates)
      
      toast({
        title: "Request Updated",
        description: "Purchase request updated successfully",
      })
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update purchase request",
        variant: "destructive"
      })
    }
  }

  const coordinateRequestDeletion = async (requestId: string) => {
    try {
      await deleteRequest(requestId)
      
      toast({
        title: "Request Deleted",
        description: "Purchase request deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Deletion Failed",
        description: error instanceof Error ? error.message : "Failed to delete purchase request",
        variant: "destructive"
      })
    }
  }

  /**
   * WAVE 3: Integration Operations (Execute After Wave 2 Approval)
   * Order management operations
   */
  const coordinateOrderCreation = async (orderData: any) => {
    setState(prev => ({ ...prev, operationInProgress: true }))
    
    try {
      await createOrder(orderData)
      
      toast({
        title: "Order Created",
        description: "Purchase order created successfully",
      })
      
      setState(prev => ({ ...prev, showCreateDialog: false }))
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create purchase order",
        variant: "destructive"
      })
    } finally {
      setState(prev => ({ ...prev, operationInProgress: false }))
    }
  }

  const coordinateOrderUpdate = async (orderId: string, updates: any) => {
    try {
      await updateOrder(orderId, updates)
      
      toast({
        title: "Order Updated",
        description: "Purchase order updated successfully",
      })
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update purchase order",
        variant: "destructive"
      })
    }
  }

  /**
   * WAVE 4: Workflow Operations (Execute After Wave 3 Approval)
   * Vendor management operations
   */
  const coordinateVendorCreation = async (vendorData: any) => {
    setState(prev => ({ ...prev, operationInProgress: true }))
    
    try {
      await createVendor(vendorData)
      
      toast({
        title: "Vendor Created",
        description: "Vendor created successfully",
      })
      
      setState(prev => ({ ...prev, showCreateDialog: false }))
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create vendor",
        variant: "destructive"
      })
    } finally {
      setState(prev => ({ ...prev, operationInProgress: false }))
    }
  }

  const coordinateVendorUpdate = async (vendorId: string, updates: any) => {
    try {
      await updateVendor(vendorId, updates)
      
      toast({
        title: "Vendor Updated",
        description: "Vendor updated successfully",
      })
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update vendor",
        variant: "destructive"
      })
    }
  }

  const coordinateVendorRating = async (ratingData: any) => {
    try {
      await rateVendor(ratingData)
      
      toast({
        title: "Rating Submitted",
        description: "Vendor rating submitted successfully",
      })
    } catch (error) {
      toast({
        title: "Rating Failed",
        description: error instanceof Error ? error.message : "Failed to rate vendor",
        variant: "destructive"
      })
    }
  }

  /**
   * WAVE 5: Approval Operations (Execute After Wave 4 Approval)
   * Approval workflow operations
   */
  const coordinateApprovalAction = async (approvalId: string, action: any) => {
    setState(prev => ({ ...prev, operationInProgress: true }))
    
    try {
      await processApproval(approvalId, action)
      
      toast({
        title: action.approval_status === 'approved' ? "Request Approved" : "Request Rejected",
        description: `Purchase request ${action.approval_status} successfully`,
      })
      
      setState(prev => ({ ...prev, showApprovalDialog: false }))
    } catch (error) {
      toast({
        title: "Approval Failed",
        description: error instanceof Error ? error.message : "Failed to process approval",
        variant: "destructive"
      })
    } finally {
      setState(prev => ({ ...prev, operationInProgress: false }))
    }
  }

  /**
   * WAVE 6: Delivery Operations (Execute After Wave 5 Approval)
   * Delivery confirmation operations
   */
  const coordinateDeliveryConfirmation = async (orderId: string, confirmationData: any) => {
    setState(prev => ({ ...prev, operationInProgress: true }))
    
    try {
      await confirmDelivery(orderId, confirmationData)
      
      toast({
        title: "Delivery Confirmed",
        description: "Delivery confirmed successfully",
      })
      
      setState(prev => ({ ...prev, showDeliveryDialog: false }))
    } catch (error) {
      toast({
        title: "Confirmation Failed",
        description: error instanceof Error ? error.message : "Failed to confirm delivery",
        variant: "destructive"
      })
    } finally {
      setState(prev => ({ ...prev, operationInProgress: false }))
    }
  }

  // === QUALITY CONTROL (Execute Wave 1 on mount and filter changes) ===
  useEffect(() => {
    coordinateDataFetch()
  }, [coordinateDataFetch])

  // === STATE UPDATE COORDINATORS ===
  const updateState = (updates: Partial<PurchaseCoordinatorState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }

  const resetFilters = () => {
    setState(prev => ({
      ...prev,
      requestFilters: {},
      orderFilters: {},
      vendorFilters: { is_active: true },
      searchTerm: '',
      sortField: 'created_at',
      sortDirection: 'desc'
    }))
  }

  const setActiveTab = (tab: typeof state.activeTab) => {
    setState(prev => ({ ...prev, activeTab: tab }))
  }

  // === COORDINATOR INTERFACE ===
  return {
    // State
    state,
    updateState,
    resetFilters,
    setActiveTab,
    
    // Data
    requests,
    orders,
    vendors,
    pendingApprovals,
    deliveries,
    statistics,
    activeVendors,
    
    // Loading states
    loading: requestsLoading || ordersLoading || vendorsLoading || approvalsLoading || deliveriesLoading || statisticsLoading || state.operationInProgress,
    requestsLoading,
    ordersLoading,
    vendorsLoading,
    approvalsLoading,
    deliveriesLoading,
    statisticsLoading,
    
    // Error states
    error: requestsError || ordersError || vendorsError || approvalsError || deliveriesError || statisticsError,
    requestsError,
    ordersError,
    vendorsError,
    approvalsError,
    deliveriesError,
    statisticsError,
    
    // Counts
    requestsCount,
    ordersCount,
    vendorsCount,
    
    // Operations (Coordinated)
    coordinateDataFetch,
    coordinateRequestCreation,
    coordinateRequestUpdate,
    coordinateRequestDeletion,
    coordinateOrderCreation,
    coordinateOrderUpdate,
    coordinateVendorCreation,
    coordinateVendorUpdate,
    coordinateVendorRating,
    coordinateApprovalAction,
    coordinateDeliveryConfirmation,
    
    // Filters and utilities
    filterRequestsByStatus,
    filterByUrgency,
    filterOrdersByStatus,
    getVendorsByRating,
    
    // Permissions
    effectivePermissions,
    canCreateRequests,
    canUpdateRequests,
    canDeleteRequests,
    canApproveRequests,
    canCreateOrders,
    canUpdateOrders,
    canCreateVendors,
    canUpdateVendors,
    canRateVendors,
    canApprove,
    canViewApprovalHistory,
    canConfirmDeliveries,
    canViewFinancials: effectivePermissions.canViewFinancials,
    
    // Role checks
    isManagement: isManagement(),
    isPurchaseRole: isPurchaseRole(),
    
    // Refresh functions
    refreshData: coordinateDataFetch,
    refreshStatistics
  }
}

export type PurchaseCoordinatorReturn = ReturnType<typeof usePurchaseCoordinator>