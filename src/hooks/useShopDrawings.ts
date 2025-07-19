/**
 * Formula PM 2.0 Shop Drawings Hook
 * V3 Phase 1 Implementation
 * 
 * Hook for shop drawing data management and API integration
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { hasPermission } from '@/lib/permissions'

// Shop drawing types based on frontend interface and database schema
export interface ShopDrawing {
  id: string;
  project_id: string;
  scope_item_id?: string;
  name: string;
  description: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'revision_required';
  priority: 'low' | 'medium' | 'high';
  submittedBy: string;
  submittedDate: string;
  reviewedBy?: string;
  reviewedDate?: string;
  version: number;
  category: string;
  notes?: string;
  fileSize: string;
  fileType: string;
  
  // Additional shop drawing specific data
  drawing_number: string;
  discipline: 'architectural' | 'structural' | 'mechanical' | 'electrical' | 'plumbing' | 'millwork' | 'landscape' | 'interior_design' | 'other';
  revision: string;
  scale?: string;
  size?: string;
  file_path?: string;
  thumbnail_path?: string;
  assigned_architect?: {
    id: string;
    name: string;
    email: string;
  };
  scope_item?: {
    id: string;
    name: string;
    description: string;
  };
  project?: {
    id: string;
    name: string;
    status: string;
  };
  internal_approved_at?: string;
  submitted_to_client_at?: string;
  client_approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ShopDrawingFormData {
  scope_item_id?: string;
  drawing_number?: string;
  title: string;
  discipline: ShopDrawing['discipline'];
  description?: string;
  revision?: string;
  scale?: string;
  size?: string;
  file_path?: string;
  file_size?: number;
  assigned_architect?: string;
  notes?: string;
}

export interface ShopDrawingFilters {
  status?: string;
  discipline?: string;
  revision?: string;
  date_from?: string;
  date_to?: string;
  has_approvals?: boolean;
  pending_approval?: boolean;
  assigned_architect?: string;
  search?: string;
}

export interface ShopDrawingStatistics {
  total: number;
  byStatus: Record<string, number>;
  byDiscipline: Record<string, number>;
  pendingApproval: number;
  recentSubmissions: number;
}

export interface ShopDrawingPermissions {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canView: boolean;
  canDownload: boolean;
  canApprove: boolean;
  canSubmitToClient: boolean;
}

interface UseShopDrawingsReturn {
  shopDrawings: ShopDrawing[];
  statistics: ShopDrawingStatistics | null;
  loading: boolean;
  error: string | null;
  permissions: ShopDrawingPermissions;
  createShopDrawing: (data: ShopDrawingFormData) => Promise<ShopDrawing | null>;
  updateShopDrawing: (id: string, data: Partial<ShopDrawingFormData>) => Promise<ShopDrawing | null>;
  deleteShopDrawing: (id: string) => Promise<boolean>;
  updateShopDrawingStatus: (id: string, status: ShopDrawing['status'], notes?: string) => Promise<boolean>;
  downloadShopDrawing: (id: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useShopDrawings(projectId: string, filters?: ShopDrawingFilters): UseShopDrawingsReturn {
  const { user, profile, getAccessToken } = useAuth()
  const [shopDrawings, setShopDrawings] = useState<ShopDrawing[]>([])
  const [statistics, setStatistics] = useState<ShopDrawingStatistics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate permissions based on user role
  const permissions: ShopDrawingPermissions = {
    canCreate: profile?.role ? (hasPermission(profile.role, 'projects.create') || 
               hasPermission(profile.role, 'projects.update')) : false,
    canEdit: profile?.role ? (hasPermission(profile.role, 'projects.update') || 
             hasPermission(profile.role, 'projects.create')) : false,
    canDelete: profile?.role ? hasPermission(profile.role, 'projects.delete') : false,
    canView: profile?.role ? (hasPermission(profile.role, 'projects.read.all') || 
             hasPermission(profile.role, 'projects.read.assigned')) : false,
    canDownload: profile?.role ? (hasPermission(profile.role, 'projects.read.all') || 
                 hasPermission(profile.role, 'projects.read.assigned')) : false,
    canApprove: profile?.role ? (hasPermission(profile.role, 'projects.update') ||
                profile.role === 'project_manager' || profile.role === 'company_owner') : false,
    canSubmitToClient: profile?.role ? (hasPermission(profile.role, 'projects.update') ||
                       profile.role === 'project_manager' || profile.role === 'company_owner') : false
  }

  // Fetch shop drawings for the project
  const fetchShopDrawings = useCallback(async () => {
    if (!projectId || !user) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()

      // Add filters if provided
      if (filters) {
        if (filters.status && filters.status !== 'all') {
          params.set('status', filters.status)
        }
        if (filters.discipline && filters.discipline !== 'all') {
          params.set('discipline', filters.discipline)
        }
        if (filters.revision) {
          params.set('revision', filters.revision)
        }
        if (filters.search) {
          params.set('search', filters.search)
        }
        if (filters.date_from) {
          params.set('date_from', filters.date_from)
        }
        if (filters.date_to) {
          params.set('date_to', filters.date_to)
        }
        if (filters.has_approvals) {
          params.set('has_approvals', 'true')
        }
        if (filters.pending_approval) {
          params.set('pending_approval', 'true')
        }
        if (filters.assigned_architect) {
          params.set('assigned_architect', filters.assigned_architect)
        }
      }

      const token = await getAccessToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const response = await fetch(`/api/projects/${projectId}/shop-drawings?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch shop drawings')
      }

      const data = await response.json()
      
      if (data.success) {
        setShopDrawings(data.data || [])
        setStatistics(data.pagination?.statistics || null)
      } else {
        throw new Error(data.error || 'Failed to fetch shop drawings')
      }
    } catch (err) {
      console.error('Error fetching shop drawings:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [projectId, user, filters, getAccessToken])

  // Create new shop drawing
  const createShopDrawing = async (data: ShopDrawingFormData): Promise<ShopDrawing | null> => {
    if (!projectId || !user) return null

    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const response = await fetch(`/api/projects/${projectId}/shop-drawings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to create shop drawing')
      }

      const result = await response.json()
      
      if (result.success) {
        const newShopDrawing = result.data
        setShopDrawings(prev => [...prev, newShopDrawing])
        // Refetch to get updated statistics
        await fetchShopDrawings()
        return newShopDrawing
      } else {
        throw new Error(result.error || 'Failed to create shop drawing')
      }
    } catch (err) {
      console.error('Error creating shop drawing:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      return null
    }
  }

  // Update existing shop drawing
  const updateShopDrawing = async (id: string, data: Partial<ShopDrawingFormData>): Promise<ShopDrawing | null> => {
    if (!user) return null

    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const response = await fetch(`/api/shop-drawings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to update shop drawing')
      }

      const result = await response.json()
      
      if (result.success) {
        const updatedShopDrawing = result.data
        setShopDrawings(prev => prev.map(sd => sd.id === id ? updatedShopDrawing : sd))
        return updatedShopDrawing
      } else {
        throw new Error(result.error || 'Failed to update shop drawing')
      }
    } catch (err) {
      console.error('Error updating shop drawing:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      return null
    }
  }

  // Delete shop drawing
  const deleteShopDrawing = async (id: string): Promise<boolean> => {
    if (!user) return false

    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const response = await fetch(`/api/shop-drawings/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete shop drawing')
      }

      const result = await response.json()
      
      if (result.success) {
        setShopDrawings(prev => prev.filter(sd => sd.id !== id))
        return true
      } else {
        throw new Error(result.error || 'Failed to delete shop drawing')
      }
    } catch (err) {
      console.error('Error deleting shop drawing:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      return false
    }
  }

  // Update shop drawing status
  const updateShopDrawingStatus = async (id: string, status: ShopDrawing['status'], notes?: string): Promise<boolean> => {
    if (!user) return false

    try {
      const updateData: any = { status }
      if (notes) {
        updateData.notes = notes
      }

      const updatedShopDrawing = await updateShopDrawing(id, updateData)
      return !!updatedShopDrawing
    } catch (err) {
      console.error('Error updating shop drawing status:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      return false
    }
  }

  // Download shop drawing (placeholder for future implementation)
  const downloadShopDrawing = async (id: string): Promise<boolean> => {
    // This would download the PDF or other file format
    console.warn('Shop drawing download not implemented yet')
    return false
  }

  // Refetch shop drawings
  const refetch = useCallback(async () => {
    await fetchShopDrawings()
  }, [fetchShopDrawings])

  // Fetch shop drawings on mount and when dependencies change
  useEffect(() => {
    fetchShopDrawings()
  }, [fetchShopDrawings])

  return {
    shopDrawings,
    statistics,
    loading,
    error,
    permissions,
    createShopDrawing,
    updateShopDrawing,
    deleteShopDrawing,
    updateShopDrawingStatus,
    downloadShopDrawing,
    refetch
  }
}