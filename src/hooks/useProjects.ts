/**
 * Formula PM 2.0 Project Management Hooks
 * Wave 2 Business Logic Implementation
 * 
 * Custom React hooks for project management operations with role-based access control
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from './useAuth'
import { usePermissions } from './usePermissions'
import { 
  ProjectWithDetails, 
  ProjectFormData, 
  ProjectFilters, 
  ProjectListParams,
  ProjectMetrics,
  ProjectTeamAssignment,
  ProjectStatusUpdate,
  ProjectBudgetUpdate,
  getProjectAccessLevel
} from '@/types/projects'

// ============================================================================
// MAIN PROJECT HOOK
// ============================================================================

export const useProjects = () => {
  const { profile } = useAuth()
  const { 
    canCreateProject, 
    canViewPricing, 
    isManagement,
    canAccessProject 
  } = usePermissions()

  const [projects, setProjects] = useState<ProjectWithDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  // Get user's accessible projects
  const fetchProjects = useCallback(async (params?: ProjectListParams) => {
    if (!profile) return

    setLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams()
      
      if (params?.page) queryParams.set('page', params.page.toString())
      if (params?.limit) queryParams.set('limit', params.limit.toString())
      if (params?.include_details) queryParams.set('include_details', 'true')
      
      // Apply filters
      if (params?.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              queryParams.set(key, value.join(','))
            } else {
              queryParams.set(key, value.toString())
            }
          }
        })
      }

      // Apply sorting
      if (params?.sort) {
        queryParams.set('sort_field', params.sort.field)
        queryParams.set('sort_direction', params.sort.direction)
      }

      const response = await fetch(`/api/projects?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${profile.id}`, // This would be the actual auth token
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }

      const data = await response.json()
      
      if (data.success) {
        setProjects(data.data.projects)
        setTotalCount(data.data.total_count)
        setCurrentPage(data.data.page)
        setHasMore(data.data.has_more)
      } else {
        throw new Error(data.error || 'Failed to fetch projects')
      }
    } catch (err) {
      console.error('Error fetching projects:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch projects')
    } finally {
      setLoading(false)
    }
  }, [profile])

  // Create new project
  const createProject = useCallback(async (projectData: ProjectFormData) => {
    if (!profile || !canCreateProject()) {
      throw new Error('Insufficient permissions to create projects')
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${profile.id}`,
        },
        body: JSON.stringify(projectData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create project')
      }

      const data = await response.json()
      
      if (data.success) {
        // Refresh projects list
        await fetchProjects()
        return data.data.project
      } else {
        throw new Error(data.error || 'Failed to create project')
      }
    } catch (err) {
      console.error('Error creating project:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to create project'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [profile, canCreateProject, fetchProjects])

  // Filter projects based on user access
  const accessibleProjects = useMemo(() => {
    if (!profile) return []
    
    return projects.filter(project => {
      // Management can see all projects
      if (isManagement()) return true
      
      // Check if user is assigned to project
      const assignment = project.assignments?.find(a => a.user_id === profile.id && a.is_active)
      if (assignment) return true
      
      // Check if user is project manager
      if (project.project_manager_id === profile.id) return true
      
      // Check if user is client for this project
      if (profile.role === 'client' && project.client?.user_id === profile.id) return true
      
      return false
    })
  }, [projects, profile, isManagement])

  return {
    projects: accessibleProjects,
    loading,
    error,
    totalCount,
    currentPage,
    hasMore,
    fetchProjects,
    createProject,
    refreshProjects: () => fetchProjects(),
    canCreate: canCreateProject(),
    canViewFinancials: canViewPricing
  }
}

// ============================================================================
// INDIVIDUAL PROJECT HOOK
// ============================================================================

export const useProject = (projectId: string) => {
  const { profile } = useAuth()
  const { canViewPricing } = usePermissions()
  
  const [project, setProject] = useState<ProjectWithDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accessLevel, setAccessLevel] = useState<'full' | 'limited' | 'read_only' | 'none'>('none')

  // Fetch individual project
  const fetchProject = useCallback(async () => {
    if (!profile || !projectId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${profile.id}`,
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Project not found or access denied')
        }
        throw new Error('Failed to fetch project')
      }

      const data = await response.json()
      
      if (data.success) {
        setProject(data.data.project)
        
        // Determine access level
        const assignment = data.data.project.assignments?.find((a: any) => a.user_id === profile.id && a.is_active)
        setAccessLevel(getProjectAccessLevel(profile.role, assignment))
      } else {
        throw new Error(data.error || 'Failed to fetch project')
      }
    } catch (err) {
      console.error('Error fetching project:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch project')
    } finally {
      setLoading(false)
    }
  }, [profile, projectId])

  // Update project
  const updateProject = useCallback(async (updates: Partial<ProjectFormData>) => {
    if (!profile || !projectId || accessLevel === 'none' || accessLevel === 'read_only') {
      throw new Error('Insufficient permissions to update project')
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${profile.id}`,
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update project')
      }

      const data = await response.json()
      
      if (data.success) {
        setProject(data.data.project)
        return data.data.project
      } else {
        throw new Error(data.error || 'Failed to update project')
      }
    } catch (err) {
      console.error('Error updating project:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update project'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [profile, projectId, accessLevel])

  // Delete project
  const deleteProject = useCallback(async () => {
    if (!profile || !projectId) {
      throw new Error('Invalid project or user')
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${profile.id}`,
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete project')
      }

      const data = await response.json()
      
      if (data.success) {
        setProject(null)
        return true
      } else {
        throw new Error(data.error || 'Failed to delete project')
      }
    } catch (err) {
      console.error('Error deleting project:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete project'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [profile, projectId])

  // Load project on mount
  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  return {
    project,
    loading,
    error,
    accessLevel,
    fetchProject,
    updateProject,
    deleteProject,
    canUpdate: accessLevel === 'full' || accessLevel === 'limited',
    canDelete: accessLevel === 'full',
    canViewFinancials: canViewPricing
  }
}

// ============================================================================
// PROJECT TEAM MANAGEMENT HOOK
// ============================================================================

export const useProjectTeam = (projectId: string) => {
  const { profile } = useAuth()
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch team assignments
  const fetchAssignments = useCallback(async () => {
    if (!profile || !projectId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/projects/${projectId}/assignments`, {
        headers: {
          'Authorization': `Bearer ${profile.id}`,
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch team assignments')
      }

      const data = await response.json()
      
      if (data.success) {
        setAssignments(data.data.assignments)
      } else {
        throw new Error(data.error || 'Failed to fetch team assignments')
      }
    } catch (err) {
      console.error('Error fetching assignments:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch team assignments')
    } finally {
      setLoading(false)
    }
  }, [profile, projectId])

  // Update team assignments
  const updateAssignments = useCallback(async (
    newAssignments: ProjectTeamAssignment[], 
    replaceExisting = false
  ) => {
    if (!profile || !projectId) {
      throw new Error('Invalid project or user')
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/projects/${projectId}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${profile.id}`,
        },
        body: JSON.stringify({
          assignments: newAssignments,
          replace_existing: replaceExisting,
          notify_assigned_users: true
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update team assignments')
      }

      const data = await response.json()
      
      if (data.success) {
        setAssignments(data.data.assignments)
        return data.data.assignments
      } else {
        throw new Error(data.error || 'Failed to update team assignments')
      }
    } catch (err) {
      console.error('Error updating assignments:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update team assignments'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [profile, projectId])

  // Remove team member
  const removeTeamMember = useCallback(async (userId: string, role?: string) => {
    if (!profile || !projectId) {
      throw new Error('Invalid project or user')
    }

    setLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams({ user_id: userId })
      if (role) queryParams.set('role', role)

      const response = await fetch(`/api/projects/${projectId}/assignments?${queryParams.toString()}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${profile.id}`,
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove team member')
      }

      const data = await response.json()
      
      if (data.success) {
        await fetchAssignments() // Refresh assignments
        return true
      } else {
        throw new Error(data.error || 'Failed to remove team member')
      }
    } catch (err) {
      console.error('Error removing team member:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove team member'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [profile, projectId, fetchAssignments])

  // Load assignments on mount
  useEffect(() => {
    fetchAssignments()
  }, [fetchAssignments])

  return {
    assignments,
    loading,
    error,
    fetchAssignments,
    updateAssignments,
    removeTeamMember
  }
}

// ============================================================================
// PROJECT METRICS HOOK
// ============================================================================

export const useProjectMetrics = () => {
  const { profile } = useAuth()
  const { canViewFinancials } = usePermissions()
  
  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch project metrics
  const fetchMetrics = useCallback(async (includeFinancials = false) => {
    if (!profile) return

    setLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams()
      if (includeFinancials && canViewFinancials) {
        queryParams.set('include_financials', 'true')
      }

      const response = await fetch(`/api/projects/metrics?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${profile.id}`,
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch project metrics')
      }

      const data = await response.json()
      
      if (data.success) {
        setMetrics(data.data.metrics)
      } else {
        throw new Error(data.error || 'Failed to fetch project metrics')
      }
    } catch (err) {
      console.error('Error fetching metrics:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch project metrics')
    } finally {
      setLoading(false)
    }
  }, [profile, canViewFinancials])

  // Load metrics on mount
  useEffect(() => {
    fetchMetrics(canViewFinancials())
  }, [fetchMetrics, canViewFinancials])

  return {
    metrics,
    loading,
    error,
    fetchMetrics,
    canViewFinancials
  }
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

// Hook for project status updates
export const useProjectStatus = (projectId: string) => {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateStatus = useCallback(async (statusUpdate: ProjectStatusUpdate) => {
    if (!profile || !projectId) {
      throw new Error('Invalid project or user')
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/projects/${projectId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${profile.id}`,
        },
        body: JSON.stringify(statusUpdate)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update project status')
      }

      const data = await response.json()
      
      if (data.success) {
        return data.data.project
      } else {
        throw new Error(data.error || 'Failed to update project status')
      }
    } catch (err) {
      console.error('Error updating status:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update project status'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [profile, projectId])

  return {
    updateStatus,
    loading,
    error
  }
}

// Hook for project budget updates
export const useProjectBudget = (projectId: string) => {
  const { profile } = useAuth()
  const { canViewPricing } = usePermissions()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateBudget = useCallback(async (budgetUpdate: ProjectBudgetUpdate) => {
    if (!profile || !projectId || !canViewPricing()) {
      throw new Error('Insufficient permissions to update budget')
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/projects/${projectId}/budget`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${profile.id}`,
        },
        body: JSON.stringify(budgetUpdate)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update project budget')
      }

      const data = await response.json()
      
      if (data.success) {
        return data.data.project
      } else {
        throw new Error(data.error || 'Failed to update project budget')
      }
    } catch (err) {
      console.error('Error updating budget:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update project budget'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [profile, projectId, canViewPricing])

  return {
    updateBudget,
    loading,
    error,
    canUpdateBudget: canViewPricing()
  }
}