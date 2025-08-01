/**
 * Formula PM 2.0 Milestones Hook
 * V3 Phase 1 Implementation
 * 
 * Hook for milestone data management and API integration
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Milestone, MilestoneFormData, MilestoneFilters, MilestoneStatistics, MilestonePermissions } from '@/types/milestones'
import { useAuth } from './useAuth'
import { hasPermission } from '@/lib/permissions'
import { useAdvancedApiQuery } from './useAdvancedApiQuery'

interface UseMilestonesReturn {
  milestones: Milestone[]
  statistics: MilestoneStatistics | null
  loading: boolean
  error: string | null
  permissions: MilestonePermissions
  createMilestone: (data: MilestoneFormData) => Promise<Milestone | null>
  updateMilestone: (id: string, data: Partial<MilestoneFormData>) => Promise<Milestone | null>
  deleteMilestone: (id: string) => Promise<boolean>
  updateMilestoneStatus: (id: string, status: Milestone['status']) => Promise<boolean>
  bulkUpdateMilestones: (ids: string[], updates: any) => Promise<boolean>
  refetch: () => Promise<void>
}

export function useMilestones(projectId: string, filters?: MilestoneFilters): UseMilestonesReturn {
  const { user, profile, getAccessToken } = useAuth()
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [statistics, setStatistics] = useState<MilestoneStatistics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate permissions based on user role
  const permissions: MilestonePermissions = {
    canCreate: profile?.role ? (hasPermission(profile.role, 'projects.create') || 
               hasPermission(profile.role, 'projects.update')) : false,
    canEdit: profile?.role ? (hasPermission(profile.role, 'projects.update') || 
             hasPermission(profile.role, 'projects.create')) : false,
    canDelete: profile?.role ? hasPermission(profile.role, 'projects.delete') : false,
    canChangeStatus: profile?.role ? (hasPermission(profile.role, 'projects.update') || 
                     hasPermission(profile.role, 'projects.create')) : false,
    canViewAll: profile?.role ? (hasPermission(profile.role, 'projects.read.all') || 
                hasPermission(profile.role, 'projects.read.assigned')) : false
  }

  // Fetch milestones for the project
  const fetchMilestones = useCallback(async () => {
    if (!projectId || !user) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        include_creator: 'true',
        include_project: 'true'
      })

      // Add filters if provided
      if (filters) {
        if (filters.status?.length) {
          params.set('status', filters.status.join(','))
        }
        if (filters.search) {
          params.set('search', filters.search)
        }
        if (filters.target_date_start) {
          params.set('target_date_start', filters.target_date_start)
        }
        if (filters.target_date_end) {
          params.set('target_date_end', filters.target_date_end)
        }
        if (filters.overdue_only) {
          params.set('overdue_only', 'true')
        }
        if (filters.upcoming_only) {
          params.set('upcoming_only', 'true')
        }
        if (filters.completed_only) {
          params.set('completed_only', 'true')
        }
      }

      const token = await getAccessToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const response = await fetch(`/api/projects/${projectId}/milestones?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch milestones')
      }

      const data = await response.json()
      
      if (data.success) {
        setMilestones(data.data.data || [])
        setStatistics(data.data.statistics || null)
      } else {
        throw new Error(data.error || 'Failed to fetch milestones')
      }
    } catch (err) {
      console.error('Error fetching milestones:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [projectId, user, filters])

  // Create new milestone
  const createMilestone = async (data: MilestoneFormData): Promise<Milestone | null> => {
    if (!projectId || !user) return null

    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const response = await fetch(`/api/projects/${projectId}/milestones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to create milestone')
      }

      const result = await response.json()
      
      if (result.success) {
        const newMilestone = result.data
        setMilestones(prev => [...prev, newMilestone])
        // Refetch to get updated statistics
        await fetchMilestones()
        return newMilestone
      } else {
        throw new Error(result.error || 'Failed to create milestone')
      }
    } catch (err) {
      console.error('Error creating milestone:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      return null
    }
  }

  // Update existing milestone
  const updateMilestone = async (id: string, data: Partial<MilestoneFormData>): Promise<Milestone | null> => {
    if (!user) return null

    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const response = await fetch(`/api/milestones/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to update milestone')
      }

      const result = await response.json()
      
      if (result.success) {
        const updatedMilestone = result.data
        setMilestones(prev => prev.map(m => m.id === id ? updatedMilestone : m))
        return updatedMilestone
      } else {
        throw new Error(result.error || 'Failed to update milestone')
      }
    } catch (err) {
      console.error('Error updating milestone:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      return null
    }
  }

  // Delete milestone
  const deleteMilestone = async (id: string): Promise<boolean> => {
    if (!user) return false

    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const response = await fetch(`/api/milestones/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete milestone')
      }

      const result = await response.json()
      
      if (result.success) {
        setMilestones(prev => prev.filter(m => m.id !== id))
        return true
      } else {
        throw new Error(result.error || 'Failed to delete milestone')
      }
    } catch (err) {
      console.error('Error deleting milestone:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      return false
    }
  }

  // Update milestone status
  const updateMilestoneStatus = async (id: string, status: Milestone['status']): Promise<boolean> => {
    if (!user) return false

    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const response = await fetch(`/api/milestones/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        throw new Error('Failed to update milestone status')
      }

      const result = await response.json()
      
      if (result.success) {
        const updatedMilestone = result.data
        setMilestones(prev => prev.map(m => m.id === id ? updatedMilestone : m))
        return true
      } else {
        throw new Error(result.error || 'Failed to update milestone status')
      }
    } catch (err) {
      console.error('Error updating milestone status:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      return false
    }
  }

  // Bulk update milestones
  const bulkUpdateMilestones = async (ids: string[], updates: any): Promise<boolean> => {
    if (!user) return false

    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const response = await fetch('/api/milestones/bulk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ milestone_ids: ids, updates })
      })

      if (!response.ok) {
        throw new Error('Failed to bulk update milestones')
      }

      const result = await response.json()
      
      if (result.success) {
        const updatedMilestones = result.data.milestones
        setMilestones(prev => prev.map(m => {
          const updated = updatedMilestones.find((um: Milestone) => um.id === m.id)
          return updated || m
        }))
        return true
      } else {
        throw new Error(result.error || 'Failed to bulk update milestones')
      }
    } catch (err) {
      console.error('Error bulk updating milestones:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      return false
    }
  }

  // Refetch milestones
  const refetch = useCallback(async () => {
    await fetchMilestones()
  }, [fetchMilestones])

  // Fetch milestones on mount and when dependencies change
  useEffect(() => {
    fetchMilestones()
  }, [fetchMilestones])

  return {
    milestones,
    statistics,
    loading,
    error,
    permissions,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    updateMilestoneStatus,
    bulkUpdateMilestones,
    refetch
  }
}

/**
 * Enhanced Milestones hook using advanced API query patterns
 * This demonstrates the optimized approach with caching and real-time updates
 */
export function useMilestonesAdvanced(projectId: string, filters?: MilestoneFilters) {
  const { user, profile } = useAuth()

  // Use advanced API query for milestones
  const {
    data: milestones = [],
    loading,
    error,
    refetch,
    mutate
  } = useAdvancedApiQuery<Milestone[]>({
    endpoint: `/api/projects/${projectId}/milestones`,
    params: {
      project_id: projectId,
      ...(filters?.status && { status: filters.status.join(',') }),
      ...(filters?.search && { search: filters.search })
    },
    cacheKey: `milestones-${projectId}-${JSON.stringify(filters)}`,
    enabled: !!projectId && !!user,
    staleTime: 3 * 60 * 1000, // 3 minutes
    cacheTime: 8 * 60 * 1000, // 8 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 45 * 1000 // 45 seconds for real-time updates
  })

  // Use advanced API query for statistics
  const {
    data: statistics = null
  } = useAdvancedApiQuery<MilestoneStatistics>({
    endpoint: '/api/milestones/statistics',
    params: { project_id: projectId },
    cacheKey: `milestone-statistics-${projectId}`,
    enabled: !!projectId && !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000 // 5 minutes
  })

  // Calculate permissions (using project permissions as milestones are part of projects)
  const permissions: MilestonePermissions = {
    canCreate: hasPermission(profile?.role ?? 'client', 'projects.update'),
    canEdit: hasPermission(profile?.role ?? 'client', 'projects.update'),
    canDelete: hasPermission(profile?.role ?? 'client', 'projects.delete'),
    canChangeStatus: hasPermission(profile?.role ?? 'client', 'projects.update'),
    canViewAll: hasPermission(profile?.role ?? 'client', 'projects.read.all')
  }

  return {
    milestones,
    statistics,
    loading,
    error,
    permissions,
    refetch,
    mutate
  }
}