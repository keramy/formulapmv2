/**
 * Formula PM 2.0 Project Members Hook
 * V3 Phase 1 Implementation
 * 
 * Hook for fetching project team members
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { useAdvancedApiQuery } from './useAdvancedApiQuery'

interface ProjectMember {
  id: string
  first_name: string
  last_name: string
  email: string
  role?: string
  department?: string
  phone?: string
  full_name: string
  avatar_url?: string
}

interface UseProjectMembersReturn {
  members: ProjectMember[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useProjectMembers(projectId: string | null): UseProjectMembersReturn {
  const { user } = useAuth()
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMembers = useCallback(async () => {
    if (!projectId || !user) {
      setMembers([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/projects/${projectId}/assignments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch project members')
      }

      const data = await response.json()
      
      if (data.success && data.data.assignments) {
        // Transform assignments to member format
        const projectMembers = data.data.assignments.map((assignment: any) => ({
          id: assignment.user.id,
          first_name: assignment.user.first_name,
          last_name: assignment.user.last_name,
          email: assignment.user.email,
          role: assignment.user.role,
          department: assignment.user.department,
          phone: assignment.user.phone,
          full_name: `${assignment.user.first_name} ${assignment.user.last_name}`,
          avatar_url: assignment.user.avatar_url
        }))
        
        setMembers(projectMembers)
      } else {
        throw new Error(data.error || 'Failed to fetch project members')
      }
    } catch (err) {
      console.error('Error fetching project members:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      setMembers([])
    } finally {
      setLoading(false)
    }
  }, [projectId, user])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  return {
    members,
    loading,
    error,
    refetch: fetchMembers
  }
}

/**
 * Enhanced Project Members hook using advanced API query patterns
 * This demonstrates the optimized approach with caching and real-time updates
 */
export function useProjectMembersAdvanced(projectId: string) {
  const { user } = useAuth()

  // Use advanced API query for project members
  const {
    data: members = [],
    loading,
    error,
    refetch,
    mutate
  } = useAdvancedApiQuery<ProjectMember[]>({
    queryKey: ['project-members', projectId],
    queryFn: async () => {
      if (!projectId || !user) return []

      const response = await fetch(`/api/projects/${projectId}/members`)
      if (!response.ok) throw new Error('Failed to fetch project members')

      const result = await response.json()
      return result.success ? result.data : []
    },
    enabled: !!projectId && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 2 * 60 * 1000 // 2 minutes for team updates
  })

  return {
    members,
    loading,
    error,
    refetch,
    mutate
  }
}