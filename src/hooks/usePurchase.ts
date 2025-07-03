/**
 * Formula PM 2.0 Purchase Management Hooks
 * Purchase Department Workflow Implementation
 * 
 * Custom React hooks for purchase operations with project integration
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from './useAuth'
import { usePermissions } from './usePermissions'
import { useProjects } from './useProjects'
import { PurchaseRequest, PurchaseOrder, Vendor, PurchaseStatistics } from '@/types/purchase'

// ============================================================================
// MAIN PURCHASE HOOK
// ============================================================================

export const usePurchase = () => {
  const { profile } = useAuth()
  const { 
    canViewPurchaseRequests,
    canCreatePurchaseRequests,
    canViewPurchaseFinancials,
    isPurchase,
    isManagement
  } = usePermissions()
  const { projects } = useProjects()

  const [requests, setRequests] = useState<PurchaseRequest[]>([])
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [statistics, setStatistics] = useState<PurchaseStatistics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get user's accessible purchase requests
  const fetchRequests = useCallback(async (projectId?: string) => {
    if (!profile || !canViewPurchaseRequests()) return

    setLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams()
      if (projectId) queryParams.set('project_id', projectId)

      const response = await fetch(`/api/purchase/requests?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${profile.id}`,
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch purchase requests')
      }

      const data = await response.json()
      
      if (data.success) {
        setRequests(data.data.requests)
      } else {
        throw new Error(data.error || 'Failed to fetch purchase requests')
      }
    } catch (err) {
      console.error('Error fetching requests:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch requests')
    } finally {
      setLoading(false)
    }
  }, [profile, canViewPurchaseRequests])

  // Create new purchase request
  const createRequest = useCallback(async (requestData: Partial<PurchaseRequest>) => {
    if (!profile || !canCreatePurchaseRequests()) {
      throw new Error('Insufficient permissions to create purchase requests')
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/purchase/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${profile.id}`,
        },
        body: JSON.stringify({
          ...requestData,
          requester_id: profile.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create purchase request')
      }

      const data = await response.json()
      
      if (data.success) {
        // Refresh requests list
        await fetchRequests()
        return data.data.request
      } else {
        throw new Error(data.error || 'Failed to create purchase request')
      }
    } catch (err) {
      console.error('Error creating request:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to create request'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [profile, canCreatePurchaseRequests, fetchRequests])

  // Fetch purchase orders
  const fetchOrders = useCallback(async (projectId?: string) => {
    if (!profile) return

    try {
      const queryParams = new URLSearchParams()
      if (projectId) queryParams.set('project_id', projectId)

      const response = await fetch(`/api/purchase/orders?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${profile.id}`,
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch purchase orders')
      }

      const data = await response.json()
      
      if (data.success) {
        setOrders(data.data.orders)
      }
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch orders')
    }
  }, [profile])

  // Fetch vendors
  const fetchVendors = useCallback(async () => {
    if (!profile) return

    try {
      const response = await fetch('/api/purchase/vendors', {
        headers: {
          'Authorization': `Bearer ${profile.id}`,
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch vendors')
      }

      const data = await response.json()
      
      if (data.success) {
        setVendors(data.data.vendors)
      }
    } catch (err) {
      console.error('Error fetching vendors:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch vendors')
    }
  }, [profile])

  // Fetch purchase statistics
  const fetchStatistics = useCallback(async (projectId?: string) => {
    if (!profile) return

    try {
      const queryParams = new URLSearchParams()
      if (projectId) queryParams.set('project_id', projectId)
      if (canViewPurchaseFinancials()) queryParams.set('include_financials', 'true')

      const response = await fetch(`/api/purchase/statistics?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${profile.id}`,
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch purchase statistics')
      }

      const data = await response.json()
      
      if (data.success) {
        setStatistics(data.data.statistics)
      }
    } catch (err) {
      console.error('Error fetching statistics:', err)
      // Don't set error for statistics, as it's not critical
    }
  }, [profile, canViewPurchaseFinancials])

  // Load initial data
  useEffect(() => {
    if (profile && canViewPurchaseRequests()) {
      fetchRequests()
      fetchOrders()
      fetchVendors()
      fetchStatistics()
    }
  }, [profile, canViewPurchaseRequests, fetchRequests, fetchOrders, fetchVendors, fetchStatistics])

  // Filter data based on user access
  const accessibleRequests = useMemo(() => {
    if (!profile) return []
    
    return requests.filter(request => {
      // Management and purchase roles can see all requests
      if (isManagement() || isPurchase()) return true
      
      // Others can only see their own requests or requests from their projects
      if (request.requester_id === profile.id) return true
      
      // Check if user is assigned to the project
      const project = projects.find(p => p.id === request.project_id)
      if (project) {
        const assignment = project.assignments?.find(a => a.user_id === profile.id && a.is_active)
        if (assignment) return true
        
        if (project.project_manager_id === profile.id) return true
      }
      
      return false
    })
  }, [requests, profile, isManagement, isPurchase, projects])

  const accessibleOrders = useMemo(() => {
    if (!profile) return []
    
    return orders.filter(order => {
      // Management and purchase roles can see all orders
      if (isManagement() || isPurchase()) return true
      
      // Others can only see orders from their projects
      const request = requests.find(r => r.id === order.purchase_request_id)
      if (!request) return false
      
      const project = projects.find(p => p.id === request.project_id)
      if (project) {
        const assignment = project.assignments?.find(a => a.user_id === profile.id && a.is_active)
        if (assignment) return true
        
        if (project.project_manager_id === profile.id) return true
      }
      
      return false
    })
  }, [orders, requests, profile, isManagement, isPurchase, projects])

  return {
    // Data
    requests: accessibleRequests,
    orders: accessibleOrders,
    vendors,
    statistics,
    
    // State
    loading,
    error,
    
    // Operations
    fetchRequests,
    fetchOrders,
    fetchVendors,
    fetchStatistics,
    createRequest,
    
    // Permissions
    canCreate: canCreatePurchaseRequests(),
    canViewFinancials: canViewPurchaseFinancials(),
    
    // Utils
    refreshAll: () => {
      fetchRequests()
      fetchOrders()
      fetchVendors()
      fetchStatistics()
    }
  }
}

// ============================================================================
// PROJECT-SPECIFIC PURCHASE HOOK
// ============================================================================

export const useProjectPurchase = (projectId: string) => {
  const { profile } = useAuth()
  const { canViewPurchaseRequests } = usePermissions()
  
  const [requests, setRequests] = useState<PurchaseRequest[]>([])
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [statistics, setStatistics] = useState<PurchaseStatistics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch project-specific purchase data
  const fetchProjectPurchaseData = useCallback(async () => {
    if (!profile || !projectId || !canViewPurchaseRequests()) return

    setLoading(true)
    setError(null)

    try {
      // Fetch project requests
      const requestsResponse = await fetch(`/api/purchase/requests?project_id=${projectId}`, {
        headers: {
          'Authorization': `Bearer ${profile.id}`,
        }
      })

      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json()
        if (requestsData.success) {
          setRequests(requestsData.data.requests)
        }
      }

      // Fetch project orders
      const ordersResponse = await fetch(`/api/purchase/orders?project_id=${projectId}`, {
        headers: {
          'Authorization': `Bearer ${profile.id}`,
        }
      })

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        if (ordersData.success) {
          setOrders(ordersData.data.orders)
        }
      }

      // Fetch project statistics
      const statsResponse = await fetch(`/api/purchase/statistics?project_id=${projectId}`, {
        headers: {
          'Authorization': `Bearer ${profile.id}`,
        }
      })

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        if (statsData.success) {
          setStatistics(statsData.data.statistics)
        }
      }

    } catch (err) {
      console.error('Error fetching project purchase data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch project purchase data')
    } finally {
      setLoading(false)
    }
  }, [profile, projectId, canViewPurchaseRequests])

  // Load data on mount and when projectId changes
  useEffect(() => {
    fetchProjectPurchaseData()
  }, [fetchProjectPurchaseData])

  return {
    requests,
    orders,
    statistics,
    loading,
    error,
    refreshData: fetchProjectPurchaseData
  }
}

// ============================================================================
// PURCHASE REQUEST HOOK
// ============================================================================

export const usePurchaseRequest = (requestId: string) => {
  const { profile } = useAuth()
  const [request, setRequest] = useState<PurchaseRequest | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRequest = useCallback(async () => {
    if (!profile || !requestId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/purchase/requests/${requestId}`, {
        headers: {
          'Authorization': `Bearer ${profile.id}`,
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Purchase request not found or access denied')
        }
        throw new Error('Failed to fetch purchase request')
      }

      const data = await response.json()
      
      if (data.success) {
        setRequest(data.data.request)
      } else {
        throw new Error(data.error || 'Failed to fetch purchase request')
      }
    } catch (err) {
      console.error('Error fetching request:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch purchase request')
    } finally {
      setLoading(false)
    }
  }, [profile, requestId])

  const updateRequest = useCallback(async (updates: Partial<PurchaseRequest>) => {
    if (!profile || !requestId) {
      throw new Error('Invalid request or user')
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/purchase/requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${profile.id}`,
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update purchase request')
      }

      const data = await response.json()
      
      if (data.success) {
        setRequest(data.data.request)
        return data.data.request
      } else {
        throw new Error(data.error || 'Failed to update purchase request')
      }
    } catch (err) {
      console.error('Error updating request:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update request'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [profile, requestId])

  // Load request on mount
  useEffect(() => {
    fetchRequest()
  }, [fetchRequest])

  return {
    request,
    loading,
    error,
    fetchRequest,
    updateRequest
  }
}