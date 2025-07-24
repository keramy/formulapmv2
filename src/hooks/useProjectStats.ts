/**
 * useProjectStats Hook - Replace mockStats with real API integration
 * Uses consistent patterns from existing hooks
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'

interface ProjectStats {
  totalTasks: number
  completedTasks: number
  teamMembers: number
  documents: number
  budgetSpent: number
  budgetRemaining: number
  riskLevel: 'low' | 'medium' | 'high'
  scopeItemsTotal: number
  scopeItemsCompleted: number
  milestonesTotal: number
  milestonesCompleted: number
  materialSpecsTotal: number
  materialSpecsApproved: number
}

interface ProjectStatsResponse {
  success: boolean
  data: ProjectStats
  error?: string
}

export function useProjectStats(projectId: string) {
  const { user, getAccessToken } = useAuth()
  const [stats, setStats] = useState<ProjectStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!user || !projectId) {
      setLoading(false)
      return
    }

    try {
      setError(null)
      const token = await getAccessToken()
      
      if (!token) {
        throw new Error('Authentication token not available')
      }

      const response = await fetch(`/api/projects/${projectId}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Project not found')
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: ProjectStatsResponse = await response.json()

      if (result.success) {
        setStats(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch project statistics')
      }
    } catch (err) {
      console.error('Error fetching project stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch project statistics')
    } finally {
      setLoading(false)
    }
  }, [user, getAccessToken, projectId])

  // Refresh stats
  const refresh = useCallback(() => {
    setLoading(true)
    fetchStats()
  }, [fetchStats])

  // Initial fetch
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Auto-refresh when projectId changes
  useEffect(() => {
    if (projectId) {
      setLoading(true)
      setStats(null)
      fetchStats()
    }
  }, [projectId, fetchStats])

  return {
    stats,
    loading,
    error,
    refresh,
    refetch: fetchStats
  }
}