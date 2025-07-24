/**
 * Formula PM 2.0 Material Specifications Hook
 * V3 Phase 1 Implementation
 * 
 * Hook for material specification data management and API integration
 * Following exact patterns from useTasks hook for consistency
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAdvancedApiQuery } from './useAdvancedApiQuery'
import { 
  MaterialSpec, 
  MaterialSpecFormData, 
  MaterialSpecFilters, 
  MaterialSpecStatistics, 
  MaterialApprovalData,
  MaterialRejectionData,
  MaterialRevisionData,
  ScopeLinkData
} from '@/types/material-specs'
import { useAuth } from './useAuth'
import { hasPermission } from '@/lib/permissions'

interface MaterialSpecPermissions {
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canApprove: boolean
  canReject: boolean
  canRequestRevision: boolean
  canLinkScope: boolean
  canUnlinkScope: boolean
  canViewAll: boolean
}

interface UseMaterialSpecsReturn {
  materialSpecs: MaterialSpec[]
  statistics: MaterialSpecStatistics | null
  loading: boolean
  error: string | null
  permissions: MaterialSpecPermissions
  createMaterialSpec: (data: MaterialSpecFormData) => Promise<MaterialSpec | null>
  updateMaterialSpec: (id: string, data: Partial<MaterialSpecFormData>) => Promise<MaterialSpec | null>
  deleteMaterialSpec: (id: string) => Promise<boolean>
  approveMaterialSpec: (id: string, data: MaterialApprovalData) => Promise<boolean>
  rejectMaterialSpec: (id: string, data: MaterialRejectionData) => Promise<boolean>
  requestRevisionMaterialSpec: (id: string, data: MaterialRevisionData) => Promise<boolean>
  linkScopeItem: (id: string, data: ScopeLinkData) => Promise<boolean>
  unlinkScopeItem: (id: string, scopeItemId: string) => Promise<boolean>
  bulkUpdateMaterialSpecs: (ids: string[], updates: any) => Promise<boolean>
  refetch: () => Promise<void>
}

export function useMaterialSpecs(projectId: string, filters?: MaterialSpecFilters): UseMaterialSpecsReturn {
  const { user, profile } = useAuth()
  const [materialSpecs, setMaterialSpecs] = useState<MaterialSpec[]>([])
  const [statistics, setStatistics] = useState<MaterialSpecStatistics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate permissions based on user role
  const permissions: MaterialSpecPermissions = {
    canCreate: profile?.role ? (hasPermission(profile.role, 'projects.create') || 
               hasPermission(profile.role, 'projects.update')) : false,
    canEdit: profile?.role ? (hasPermission(profile.role, 'projects.update') || 
             hasPermission(profile.role, 'projects.create')) : false,
    canDelete: profile?.role ? hasPermission(profile.role, 'projects.delete') : false,
    canApprove: profile?.role ? (hasPermission(profile.role, 'projects.update') || 
                hasPermission(profile.role, 'projects.create')) : false,
    canReject: profile?.role ? (hasPermission(profile.role, 'projects.update') || 
               hasPermission(profile.role, 'projects.create')) : false,
    canRequestRevision: profile?.role ? (hasPermission(profile.role, 'projects.update') || 
                        hasPermission(profile.role, 'projects.create')) : false,
    canLinkScope: profile?.role ? (hasPermission(profile.role, 'projects.update') || 
                  hasPermission(profile.role, 'projects.create')) : false,
    canUnlinkScope: profile?.role ? (hasPermission(profile.role, 'projects.update') || 
                    hasPermission(profile.role, 'projects.create')) : false,
    canViewAll: profile?.role ? (hasPermission(profile.role, 'projects.read.all') || 
                hasPermission(profile.role, 'projects.read.assigned')) : false
  }

  // Fetch material specs for the project
  const fetchMaterialSpecs = useCallback(async () => {
    if (!projectId || !user) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        project_id: projectId,
        include_project: 'true',
        include_supplier: 'true',
        include_creator: 'true',
        include_approver: 'true',
        include_scope_items: 'true'
      })

      // Add filters if provided
      if (filters) {
        if (filters.status?.length) {
          params.set('status', filters.status.join(','))
        }
        if (filters.priority?.length) {
          params.set('priority', filters.priority.join(','))
        }
        if (filters.category?.length) {
          params.set('category', filters.category.join(','))
        }
        if (filters.supplier_id) {
          params.set('supplier_id', filters.supplier_id)
        }
        if (filters.search) {
          params.set('search', filters.search)
        }
        if (filters.created_by) {
          params.set('created_by', filters.created_by)
        }
        if (filters.approved_by) {
          params.set('approved_by', filters.approved_by)
        }
        if (filters.delivery_date_start) {
          params.set('delivery_date_start', filters.delivery_date_start)
        }
        if (filters.delivery_date_end) {
          params.set('delivery_date_end', filters.delivery_date_end)
        }
        if (filters.cost_range?.min !== undefined) {
          params.set('cost_min', filters.cost_range.min.toString())
        }
        if (filters.cost_range?.max !== undefined) {
          params.set('cost_max', filters.cost_range.max.toString())
        }
        if (filters.quantity_range?.min !== undefined) {
          params.set('quantity_min', filters.quantity_range.min.toString())
        }
        if (filters.quantity_range?.max !== undefined) {
          params.set('quantity_max', filters.quantity_range.max.toString())
        }
        if (filters.overdue_only) {
          params.set('overdue_only', 'true')
        }
        if (filters.approval_required_only) {
          params.set('approval_required_only', 'true')
        }
        if (filters.low_stock_only) {
          params.set('low_stock_only', 'true')
        }
        if (filters.has_supplier) {
          params.set('has_supplier', 'true')
        }
        if (filters.has_delivery_date) {
          params.set('has_delivery_date', 'true')
        }
        if (filters.scope_item_id) {
          params.set('scope_item_id', filters.scope_item_id)
        }
      }

      const response = await fetch(`/api/material-specs?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch material specifications')
      }

      const data = await response.json()
      
      if (data.success) {
        setMaterialSpecs(data.data.material_specs || [])
        setStatistics(data.data.statistics || null)
      } else {
        throw new Error(data.error || 'Failed to fetch material specifications')
      }
    } catch (err) {
      console.error('Error fetching material specifications:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [projectId, user, filters])

  // Create new material specification
  const createMaterialSpec = async (data: MaterialSpecFormData): Promise<MaterialSpec | null> => {
    if (!projectId || !user) return null

    try {
      const response = await fetch('/api/material-specs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to create material specification')
      }

      const result = await response.json()
      
      if (result.success) {
        const newMaterialSpec = result.data.material_spec
        setMaterialSpecs(prev => [...prev, newMaterialSpec])
        return newMaterialSpec
      } else {
        throw new Error(result.error || 'Failed to create material specification')
      }
    } catch (err) {
      console.error('Error creating material specification:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      return null
    }
  }

  // Update existing material specification
  const updateMaterialSpec = async (id: string, data: Partial<MaterialSpecFormData>): Promise<MaterialSpec | null> => {
    if (!user) return null

    try {
      const response = await fetch(`/api/material-specs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to update material specification')
      }

      const result = await response.json()
      
      if (result.success) {
        const updatedMaterialSpec = result.data.material_spec
        setMaterialSpecs(prev => prev.map(spec => spec.id === id ? updatedMaterialSpec : spec))
        return updatedMaterialSpec
      } else {
        throw new Error(result.error || 'Failed to update material specification')
      }
    } catch (err) {
      console.error('Error updating material specification:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      return null
    }
  }

  // Delete material specification
  const deleteMaterialSpec = async (id: string): Promise<boolean> => {
    if (!user) return false

    try {
      const response = await fetch(`/api/material-specs/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete material specification')
      }

      const result = await response.json()
      
      if (result.success) {
        setMaterialSpecs(prev => prev.filter(spec => spec.id !== id))
        return true
      } else {
        throw new Error(result.error || 'Failed to delete material specification')
      }
    } catch (err) {
      console.error('Error deleting material specification:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      return false
    }
  }

  // Approve material specification
  const approveMaterialSpec = async (id: string, data: MaterialApprovalData): Promise<boolean> => {
    if (!user) return false

    try {
      const response = await fetch(`/api/material-specs/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to approve material specification')
      }

      const result = await response.json()
      
      if (result.success) {
        const updatedMaterialSpec = result.data.material_spec
        setMaterialSpecs(prev => prev.map(spec => spec.id === id ? updatedMaterialSpec : spec))
        return true
      } else {
        throw new Error(result.error || 'Failed to approve material specification')
      }
    } catch (err) {
      console.error('Error approving material specification:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      return false
    }
  }

  // Reject material specification
  const rejectMaterialSpec = async (id: string, data: MaterialRejectionData): Promise<boolean> => {
    if (!user) return false

    try {
      const response = await fetch(`/api/material-specs/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to reject material specification')
      }

      const result = await response.json()
      
      if (result.success) {
        const updatedMaterialSpec = result.data.material_spec
        setMaterialSpecs(prev => prev.map(spec => spec.id === id ? updatedMaterialSpec : spec))
        return true
      } else {
        throw new Error(result.error || 'Failed to reject material specification')
      }
    } catch (err) {
      console.error('Error rejecting material specification:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      return false
    }
  }

  // Request revision for material specification
  const requestRevisionMaterialSpec = async (id: string, data: MaterialRevisionData): Promise<boolean> => {
    if (!user) return false

    try {
      const response = await fetch(`/api/material-specs/${id}/request-revision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to request revision for material specification')
      }

      const result = await response.json()
      
      if (result.success) {
        const updatedMaterialSpec = result.data.material_spec
        setMaterialSpecs(prev => prev.map(spec => spec.id === id ? updatedMaterialSpec : spec))
        return true
      } else {
        throw new Error(result.error || 'Failed to request revision for material specification')
      }
    } catch (err) {
      console.error('Error requesting revision for material specification:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      return false
    }
  }

  // Link scope item to material specification
  const linkScopeItem = async (id: string, data: ScopeLinkData): Promise<boolean> => {
    if (!user) return false

    try {
      const response = await fetch(`/api/material-specs/${id}/link-scope`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to link scope item to material specification')
      }

      const result = await response.json()
      
      if (result.success) {
        // Refresh material specs to get updated scope items
        await fetchMaterialSpecs()
        return true
      } else {
        throw new Error(result.error || 'Failed to link scope item to material specification')
      }
    } catch (err) {
      console.error('Error linking scope item to material specification:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      return false
    }
  }

  // Unlink scope item from material specification
  const unlinkScopeItem = async (id: string, scopeItemId: string): Promise<boolean> => {
    if (!user) return false

    try {
      const response = await fetch(`/api/material-specs/${id}/unlink-scope`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ scope_item_id: scopeItemId })
      })

      if (!response.ok) {
        throw new Error('Failed to unlink scope item from material specification')
      }

      const result = await response.json()
      
      if (result.success) {
        // Refresh material specs to get updated scope items
        await fetchMaterialSpecs()
        return true
      } else {
        throw new Error(result.error || 'Failed to unlink scope item from material specification')
      }
    } catch (err) {
      console.error('Error unlinking scope item from material specification:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      return false
    }
  }

  // Bulk update material specifications
  const bulkUpdateMaterialSpecs = async (ids: string[], updates: any): Promise<boolean> => {
    if (!user) return false

    try {
      const response = await fetch('/api/material-specs/bulk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          material_spec_ids: ids,
          updates,
          notify_stakeholders: false
        })
      })

      if (!response.ok) {
        throw new Error('Failed to bulk update material specifications')
      }

      const result = await response.json()
      
      if (result.success) {
        // Refresh material specs to get updated data
        await fetchMaterialSpecs()
        return true
      } else {
        throw new Error(result.error || 'Failed to bulk update material specifications')
      }
    } catch (err) {
      console.error('Error bulk updating material specifications:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      return false
    }
  }

  // Refetch material specifications
  const refetch = useCallback(async () => {
    await fetchMaterialSpecs()
  }, [fetchMaterialSpecs])

  // Fetch material specifications on mount and when dependencies change
  useEffect(() => {
    fetchMaterialSpecs()
  }, [fetchMaterialSpecs])

  return {
    materialSpecs,
    statistics,
    loading,
    error,
    permissions,
    createMaterialSpec,
    updateMaterialSpec,
    deleteMaterialSpec,
    approveMaterialSpec,
    rejectMaterialSpec,
    requestRevisionMaterialSpec,
    linkScopeItem,
    unlinkScopeItem,
    bulkUpdateMaterialSpecs,
    refetch
  }
}

/**
 * Enhanced Material Specs hook using advanced API query patterns
 * This demonstrates the optimized approach with caching and real-time updates
 */
export function useMaterialSpecsAdvanced(projectId: string, filters?: MaterialSpecFilters) {
  const { user, profile } = useAuth()

  // Use advanced API query for material specs
  const {
    data: materialSpecs = [],
    loading,
    error,
    refetch,
    mutate
  } = useAdvancedApiQuery<MaterialSpec[]>({
    endpoint: '/api/material-specs',
    params: {
      project_id: projectId,
      ...(filters?.status && { status: filters.status.join(',') }),
      ...(filters?.category && { category: filters.category.join(',') }),
      ...(filters?.search && { search: filters.search })
    },
    cacheKey: `material-specs-${projectId}-${JSON.stringify(filters)}`,
    enabled: !!projectId && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000 // 30 seconds for real-time updates
  })

  // Calculate permissions
  const permissions: MaterialSpecPermissions = {
    canCreate: profile?.role === 'admin' || profile?.role === 'project_manager',
    canEdit: profile?.role === 'admin' || profile?.role === 'project_manager',
    canDelete: profile?.role === 'admin',
    canApprove: profile?.role === 'admin' || profile?.role === 'project_manager',
    canReject: profile?.role === 'admin' || profile?.role === 'project_manager',
    canRequestRevision: profile?.role === 'admin' || profile?.role === 'project_manager',
    canLinkScope: profile?.role === 'admin' || profile?.role === 'project_manager',
    canUnlinkScope: profile?.role === 'admin' || profile?.role === 'project_manager',
    canViewAll: profile?.role === 'admin'
  }

  return {
    materialSpecs,
    loading,
    error,
    permissions,
    refetch,
    mutate
  }
}