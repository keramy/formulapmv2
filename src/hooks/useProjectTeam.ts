// ============================================================================
// V3 Project Team Management Hook
// ============================================================================
// Built with optimization patterns: useApiQuery integration
// Connects to existing project assignments API
// ============================================================================

'use client'

import React, { useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'

// ============================================================================
// TYPES
// ============================================================================

interface ProjectAssignment {
  id: string
  user_id: string
  project_id: string
  role: string
  responsibilities: string
  assigned_at: string
  assigned_by: string
  is_active: boolean
  user: {
    id: string
    first_name: string
    last_name: string
    email: string
    role: string
    department: string
    phone?: string
    avatar_url?: string
  }
  assigned_by_user: {
    first_name: string
    last_name: string
  }
}

interface AssignmentData {
  assignments: ProjectAssignment[]
}

interface AddMemberRequest {
  user_id: string
  role: string
  responsibilities?: string
}

// ============================================================================
// PROJECT ASSIGNMENTS HOOK
// ============================================================================

export function useProjectAssignments(projectId: string) {
  const { profile } = useAuth()
  const [data, setData] = useState<AssignmentData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAssignments = useCallback(async () => {
    if (!projectId || !profile) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/projects/${projectId}/assignments`, {
        headers: {
          'Authorization': `Bearer ${await profile.getAccessToken()}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch assignments')
      }
    } catch (err) {
      console.error('Error fetching project assignments:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [projectId, profile])

  // Auto-fetch on mount and when dependencies change
  React.useEffect(() => {
    fetchAssignments()
  }, [fetchAssignments])

  return {
    data,
    loading,
    error,
    refetch: fetchAssignments
  }
}

// ============================================================================
// ADD TEAM MEMBER HOOK
// ============================================================================

export function useAddTeamMember(projectId: string) {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addMember = useCallback(async (memberData: AddMemberRequest) => {
    if (!projectId || !profile) {
      throw new Error('Project ID and authentication required')
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/projects/${projectId}/assignments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await profile.getAccessToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assignments: [memberData],
          replace_existing: false,
          notify_assigned_users: true
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add team member')
      }

      return result.data
    } catch (err) {
      console.error('Error adding team member:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [projectId, profile])

  return {
    addMember,
    loading,
    error
  }
}

// ============================================================================
// REMOVE TEAM MEMBER HOOK
// ============================================================================

export function useRemoveTeamMember(projectId: string) {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const removeMember = useCallback(async (userId: string, role?: string) => {
    if (!projectId || !profile) {
      throw new Error('Project ID and authentication required')
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ user_id: userId })
      if (role) params.append('role', role)

      const response = await fetch(`/api/projects/${projectId}/assignments?${params}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await profile.getAccessToken()}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to remove team member')
      }

      return result.data
    } catch (err) {
      console.error('Error removing team member:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [projectId, profile])

  return {
    removeMember,
    loading,
    error
  }
}

// ============================================================================
// AVAILABLE USERS HOOK
// ============================================================================

export function useAvailableUsers() {
  const { profile } = useAuth()
  const [data, setData] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    if (!profile) return

    setLoading(true)
    setError(null)

    try {
      // For now, we'll use a simple user list endpoint
      // In production, this might be /api/users with filtering
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${await profile.getAccessToken()}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        // Filter to active users only
        const activeUsers = result.data?.users?.filter((user: any) => user.is_active) || []
        setData(activeUsers)
      } else {
        throw new Error(result.error || 'Failed to fetch users')
      }
    } catch (err) {
      console.error('Error fetching available users:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [profile])

  // Auto-fetch on mount
  React.useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return {
    data,
    loading,
    error,
    refetch: fetchUsers
  }
}

// ============================================================================
// TEAM MANAGEMENT COMPOUND HOOK
// ============================================================================

export function useTeamManagement(projectId: string) {
  const assignments = useProjectAssignments(projectId)
  const addMember = useAddTeamMember(projectId)
  const removeMember = useRemoveTeamMember(projectId)
  const availableUsers = useAvailableUsers()

  return {
    assignments,
    addMember,
    removeMember,
    availableUsers
  }
}

export default useTeamManagement