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
import { useApiQuery } from './useApiQuery'
import { useAdvancedApiQuery } from './useAdvancedApiQuery'
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
// OPTIMIZED PROJECT HOOKS (New Pattern)
// ============================================================================

/**
 * Optimized project hook using useApiQuery pattern
 * This is the new recommended way to fetch projects
 */
export const useProjectsOptimized = (params?: ProjectListParams) => {
  const { profile } = useAuth()
  const { canAccessProject } = usePermissions()

  // Use the new useApiQuery hook for data fetching
  const { data, loading, error, refetch } = useApiQuery({
    endpoint: '/api/projects',
    params: {
      page: params?.page || 1,
      limit: params?.limit || 20,
      include_details: params?.include_details || false,
      ...params?.filters
    },
    enabled: !!profile,
    cacheKey: `projects-${JSON.stringify(params)}`,
    dependencies: [profile?.id],
    transform: (data) => {
      // Filter projects based on user access (client-side filtering for security)
      if (!profile || !data?.projects) return { projects: [], pagination: data?.pagination }

      const accessibleProjects = data.projects.filter((project: any) =>
        canAccessProject(project.id)
      )

      return {
        projects: accessibleProjects,
        pagination: data.pagination
      }
    }
  })

  return {
    projects: data?.projects || [],
    pagination: data?.pagination,
    loading,
    error,
    refetch,
    // Computed values
    totalCount: data?.pagination?.total || 0,
    hasMore: data?.pagination?.has_more || false,
    currentPage: data?.pagination?.page || 1
  }
}

/**
 * Simple project fetcher for dropdowns and selects
 */
export const useProjectsList = () => {
  return useApiQuery({
    endpoint: '/api/projects',
    params: { limit: 100, include_details: false },
    cacheKey: 'projects-list',
    transform: (data) => data?.projects || []
  })
}

/**
 * Direct single project hook - fetches project directly from API (RECOMMENDED)
 * This bypasses the need to load all projects first
 */
export const useProjectDirect = (projectId: string) => {
  const { profile, getAccessToken } = useAuth()
  const { canAccessProject } = usePermissions()
  
  const [project, setProject] = useState<ProjectWithDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProject = useCallback(async () => {
    if (!profile || !projectId) {
      console.log('🔍 [useProjectDirect] Skipping fetch - no profile or projectId', {
        hasProfile: !!profile,
        projectId
      })
      return
    }

    console.log('🔍 [useProjectDirect] Starting fetch', {
      projectId,
      profileId: profile.id,
      profileRole: profile.role
    })

    setLoading(true)
    setError(null)

    try {
      const token = await getAccessToken()
      if (!token) {
        console.error('❌ [useProjectDirect] No access token available')
        throw new Error('Authentication required')
      }

      console.log('📡 [useProjectDirect] Making API call', {
        url: `/api/projects/${projectId}`,
        tokenLength: token.length
      })

      const response = await fetch(`/api/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      console.log('📡 [useProjectDirect] API response', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Project not found or access denied')
        } else if (response.status === 403) {
          throw new Error('Access denied - insufficient permissions')
        } else {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Failed to fetch project: ${response.status}`)
        }
      }

      const data = await response.json()
      
      console.log('📡 [useProjectDirect] API data received', {
        success: data.success,
        hasProject: !!data.data?.project,
        projectName: data.data?.project?.name
      })
      
      if (data.success && data.data?.project) {
        setProject(data.data.project)
        setError(null)
      } else {
        throw new Error(data.error || 'Project data not found in response')
      }
    } catch (err) {
      console.error('❌ [useProjectDirect] Error fetching project:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch project'
      setError(errorMessage)
      setProject(null)
    } finally {
      setLoading(false)
    }
  }, [profile, projectId, getAccessToken])

  // Load project on mount and when dependencies change
  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  return {
    data: project,
    loading,
    error,
    refetch: fetchProject
  }
}

/**
 * Single project hook - uses existing projects data (LEGACY - for backward compatibility)
 */
export const useProject = (projectId: string) => {
  const { projects, loading, error } = useProjects()
  
  const project = projects.find(p => p.id === projectId)
  
  // Debug logging
  console.log('🔍 [useProject] Debug:', {
    projectId,
    projectsCount: projects.length,
    projectFound: !!project,
    projects: projects.map(p => ({ id: p.id, name: p.name }))
  })
  
  return {
    data: project || null,
    loading: loading,
    error: !loading && !project ? 'Project not found' : error,
    refetch: () => {} // Not needed since useProjects handles refresh
  }
}

/**
 * ADVANCED OPTIMIZED HOOKS - NEXT GENERATION PATTERNS
 */

/**
 * Advanced projects hook with sophisticated caching and real-time updates
 */
export const useProjectsAdvanced = (params?: ProjectListParams) => {
  const { profile } = useAuth()
  const { canAccessProject } = usePermissions()

  return useAdvancedApiQuery({
    endpoint: '/api/projects',
    params: {
      page: params?.page || 1,
      limit: params?.limit || 20,
      include_details: params?.include_details || false,
      ...params?.filters
    },
    enabled: !!profile,
    cacheKey: `projects-advanced-${JSON.stringify(params)}`,
    dependencies: [profile?.id],

    // Advanced caching
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,

    // Performance optimization
    debounceMs: 300,
    retryCount: 3,
    keepPreviousData: true,

    // Real-time updates
    realtime: true,
    realtimeChannel: 'projects',

    // Data transformation
    transform: (data) => {
      if (!profile || !data?.projects) return { projects: [], pagination: data?.pagination }

      const accessibleProjects = data.projects.filter((project: any) =>
        canAccessProject(project.id)
      )

      return {
        projects: accessibleProjects,
        pagination: data.pagination
      }
    },

    // Validation
    validate: (data) => data && typeof data === 'object' && Array.isArray(data.projects)
  })
}

/**
 * Advanced single project hook with real-time updates
 */
export const useProjectAdvanced = (projectId: string) => {
  return useAdvancedApiQuery({
    endpoint: `/api/projects/${projectId}`,
    enabled: !!projectId,
    cacheKey: `project-advanced-${projectId}`,
    dependencies: [projectId],

    // Advanced features
    staleTime: 1 * 60 * 1000, // 1 minute
    realtime: true,
    realtimeChannel: `project-${projectId}`,
    keepPreviousData: true,

    // Performance
    retryCount: 3,
    debounceMs: 100,

    // Validation
    validate: (data) => data && typeof data === 'object' && data.id === projectId
  })
}

/**
 * Project metrics hook with advanced caching
 */
export const useProjectMetricsAdvanced = (projectId?: string) => {
  return useAdvancedApiQuery({
    endpoint: projectId ? `/api/projects/${projectId}/metrics` : '/api/projects/metrics',
    enabled: !!projectId,
    cacheKey: `project-metrics-${projectId || 'all'}`,
    dependencies: [projectId],

    // Longer cache for metrics
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes

    // Auto-refresh metrics
    refetchInterval: 30 * 1000, // 30 seconds

    // Transform metrics data
    transform: (data) => {
      if (!data) return null

      // Add computed metrics
      return {
        ...data,
        computed: {
          completionPercentage: data.completed_tasks / data.total_tasks * 100,
          budgetUtilization: data.spent_budget / data.total_budget * 100,
          timeUtilization: data.time_spent / data.estimated_time * 100
        }
      }
    }
  })
}

// ============================================================================
// MAIN PROJECT HOOK (Legacy - Keep for backward compatibility)
// ============================================================================

export const useProjects = () => {
  const { profile, getAccessToken } = useAuth()
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

      const token = await getAccessToken()
      if (!token) {
        console.error('❌ [useProjects:fetchProjects] No access token available', {
          profileId: profile?.id,
          profileRole: profile?.role,
          profileActive: profile?.is_active
        })
        throw new Error('No access token available')
      }

      console.log('📡 [useProjects:fetchProjects] Making API call', {
        url: `/api/projects?${queryParams.toString()}`,
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 20) + '...',
        queryParams: Object.fromEntries(queryParams.entries())
      })

      const response = await fetch(`/api/projects?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ [useProjects:fetchProjects] API call failed', {
          status: response.status,
          statusText: response.statusText,
          errorText,
          url: `/api/projects?${queryParams.toString()}`
        })
        throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      console.log('📡 [useProjects:fetchProjects] API response', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        data,
        headers: Object.fromEntries(response.headers.entries())
      })
      
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
    console.log('🏗️ [createProject] Starting project creation', {
      hasProfile: !!profile,
      profileRole: profile?.role,
      profileActive: profile?.is_active,
      canCreate: canCreateProject(),
      projectName: projectData.name
    })

    if (!profile || !canCreateProject()) {
      console.error('❌ [createProject] Permission check failed', {
        hasProfile: !!profile,
        canCreate: canCreateProject(),
        profileRole: profile?.role
      })
      throw new Error('Insufficient permissions to create projects')
    }

    setLoading(true)
    setError(null)

    try {
      console.log('🔑 [createProject] Getting access token')
      const token = await getAccessToken()
      if (!token) {
        console.error('❌ [createProject] No access token available')
        throw new Error('No access token available')
      }
      
      console.log('🔑 [createProject] Token obtained, making API call')

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(projectData)
      })

      console.log('📡 [createProject] API response received', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ [createProject] API error response', {
          status: response.status,
          errorData
        })
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
    if (!profile || !projects) return []
    
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

export const useProjectDetailed = (projectId: string) => {
  const { profile, getAccessToken } = useAuth()
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
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const response = await fetch(`/api/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
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
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
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
  const { profile, getAccessToken } = useAuth()
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch team assignments
  const fetchAssignments = useCallback(async () => {
    if (!profile || !projectId) return

    setLoading(true)
    setError(null)

    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const response = await fetch(`/api/projects/${projectId}/assignments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
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
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const response = await fetch(`/api/projects/${projectId}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const queryParams = new URLSearchParams({ user_id: userId })
      if (role) queryParams.set('role', role)

      const response = await fetch(`/api/projects/${projectId}/assignments?${queryParams.toString()}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
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
  const { profile, getAccessToken } = useAuth()
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
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const queryParams = new URLSearchParams()
      if (includeFinancials && canViewFinancials()) {
        queryParams.set('include_financials', 'true')
      }

      const response = await fetch(`/api/projects/metrics?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
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
  const { profile, getAccessToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateStatus = useCallback(async (statusUpdate: ProjectStatusUpdate) => {
    if (!profile || !projectId) {
      throw new Error('Invalid project or user')
    }

    setLoading(true)
    setError(null)

    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const response = await fetch(`/api/projects/${projectId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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
  const { profile, getAccessToken } = useAuth()
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
      const token = await getAccessToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const response = await fetch(`/api/projects/${projectId}/budget`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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