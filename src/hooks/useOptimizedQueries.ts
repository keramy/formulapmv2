/**
 * Optimized Query Hooks for Core Features
 * Pre-configured hooks with optimal caching and performance settings
 */

'use client'

import { useAdvancedApiQuery } from './useAdvancedApiQuery'
import type { Task } from '@/types/tasks'
import type { ScopeItem } from '@/types/scope'
import type { Project } from '@/types/projects'
import type { Milestone as ProjectMilestone } from '@/types/milestones'

// ============================================================================
// TASK MANAGEMENT QUERIES
// ============================================================================

export function useProjectTasks(projectId: string, options?: {
  status?: string
  assignedTo?: string
  realtime?: boolean
}) {
  return useAdvancedApiQuery<Task[]>({
    endpoint: `/api/projects/${projectId}/tasks`,
    params: {
      status: options?.status,
      assigned_to: options?.assignedTo
    },
    cacheKey: `project-tasks-${projectId}-${options?.status || 'all'}-${options?.assignedTo || 'all'}`,
    staleTime: 2 * 60 * 1000, // 2 minutes - tasks change frequently
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: options?.realtime ? 30 * 1000 : undefined, // 30 seconds if realtime
    realtime: options?.realtime,
    realtimeChannel: `project-${projectId}-tasks`,
    realtimeEvents: ['INSERT', 'UPDATE', 'DELETE'],
    enabled: !!projectId
  })
}

export function useUserTasks(userId: string, options?: {
  status?: string
  dueDate?: string
}) {
  return useAdvancedApiQuery<Task[]>({
    endpoint: `/api/users/${userId}/tasks`,
    params: {
      status: options?.status,
      due_date: options?.dueDate
    },
    cacheKey: `user-tasks-${userId}-${options?.status || 'all'}`,
    staleTime: 1 * 60 * 1000, // 1 minute - user tasks are high priority
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    enabled: !!userId
  })
}

export function useTaskDetails(taskId: string) {
  return useAdvancedApiQuery<Task>({
    endpoint: `/api/tasks/${taskId}`,
    cacheKey: `task-details-${taskId}`,
    staleTime: 30 * 1000, // 30 seconds - details change often
    cacheTime: 2 * 60 * 1000, // 2 minutes
    realtime: true,
    realtimeChannel: `task-${taskId}`,
    realtimeEvents: ['UPDATE'],
    enabled: !!taskId
  })
}

// ============================================================================
// SCOPE MANAGEMENT QUERIES
// ============================================================================

export function useProjectScopeItems(projectId: string, options?: {
  category?: string
  status?: string
  includeAssignments?: boolean
}) {
  return useAdvancedApiQuery<ScopeItem[]>({
    endpoint: `/api/projects/${projectId}/scope`,
    params: {
      category: options?.category,
      status: options?.status,
      include_assignments: options?.includeAssignments
    },
    cacheKey: `project-scope-${projectId}-${options?.category || 'all'}-${options?.status || 'all'}`,
    staleTime: 5 * 60 * 1000, // 5 minutes - scope changes less frequently
    cacheTime: 15 * 60 * 1000, // 15 minutes
    refetchInterval: 2 * 60 * 1000, // 2 minutes background refresh
    backgroundRefetch: true,
    enabled: !!projectId
  })
}

export function useScopeItemDetails(scopeId: string) {
  return useAdvancedApiQuery<ScopeItem>({
    endpoint: `/api/scope/${scopeId}`,
    cacheKey: `scope-details-${scopeId}`,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!scopeId
  })
}

export function useScopeStatistics(projectId: string) {
  return useAdvancedApiQuery<{
    totalItems: number
    completedItems: number
    totalCost: number
    completedCost: number
    byCategory: Record<string, number>
    byStatus: Record<string, number>
  }>({
    endpoint: `/api/projects/${projectId}/scope/statistics`,
    cacheKey: `scope-stats-${projectId}`,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes background refresh
    enabled: !!projectId
  })
}

// ============================================================================
// PROJECT MANAGEMENT QUERIES
// ============================================================================

export function useUserProjects(userId: string, options?: {
  status?: string
  role?: string
}) {
  return useAdvancedApiQuery<Project[]>({
    endpoint: `/api/users/${userId}/projects`,
    params: {
      status: options?.status,
      role: options?.role
    },
    cacheKey: `user-projects-${userId}-${options?.status || 'all'}`,
    staleTime: 10 * 60 * 1000, // 10 minutes - projects change slowly
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: true,
    enabled: !!userId
  })
}

export function useProjectDetails(projectId: string, options?: {
  includeTeam?: boolean
  includeStats?: boolean
}) {
  return useAdvancedApiQuery<Project>({
    endpoint: `/api/projects/${projectId}`,
    params: {
      include_team: options?.includeTeam,
      include_stats: options?.includeStats
    },
    cacheKey: `project-details-${projectId}-${options?.includeTeam ? 'team' : 'basic'}`,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 20 * 60 * 1000, // 20 minutes
    realtime: true,
    realtimeChannel: `project-${projectId}`,
    realtimeEvents: ['UPDATE'],
    enabled: !!projectId
  })
}

export function useProjectDashboard(projectId: string) {
  return useAdvancedApiQuery<{
    project: Project
    taskStats: { total: number; completed: number; overdue: number }
    scopeStats: { total: number; completed: number; totalCost: number }
    milestoneStats: { total: number; completed: number; overdue: number }
    recentActivity: any[]
  }>({
    endpoint: `/api/projects/${projectId}/dashboard`,
    cacheKey: `project-dashboard-${projectId}`,
    staleTime: 2 * 60 * 1000, // 2 minutes - dashboard needs fresh data
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 60 * 1000, // 1 minute background refresh
    backgroundRefetch: true,
    enabled: !!projectId
  })
}

// ============================================================================
// MILESTONE MANAGEMENT QUERIES
// ============================================================================

export function useProjectMilestones(projectId: string, options?: {
  status?: string
  upcoming?: boolean
}) {
  return useAdvancedApiQuery<ProjectMilestone[]>({
    endpoint: `/api/projects/${projectId}/milestones`,
    params: {
      status: options?.status,
      upcoming: options?.upcoming
    },
    cacheKey: `project-milestones-${projectId}-${options?.status || 'all'}`,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes - check for overdue milestones
    enabled: !!projectId
  })
}

export function useOverdueMilestones(userId?: string) {
  return useAdvancedApiQuery<ProjectMilestone[]>({
    endpoint: '/api/milestones/overdue',
    params: userId ? { user_id: userId } : undefined,
    cacheKey: `overdue-milestones-${userId || 'all'}`,
    staleTime: 1 * 60 * 1000, // 1 minute - overdue is critical
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true
  })
}

export function useMilestoneCalendar(startDate: string, endDate: string, projectId?: string) {
  return useAdvancedApiQuery<{
    date: string
    milestones: ProjectMilestone[]
  }[]>({
    endpoint: '/api/milestones/calendar',
    params: {
      start_date: startDate,
      end_date: endDate,
      project_id: projectId
    },
    cacheKey: `milestone-calendar-${startDate}-${endDate}-${projectId || 'all'}`,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!startDate && !!endDate
  })
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

export function useQueryInvalidation() {
  const invalidateProjectQueries = useCallback((projectId: string) => {
    // This would integrate with your cache invalidation system
    // For now, it's a placeholder for the pattern
    console.log(`Invalidating queries for project ${projectId}`)
  }, [])

  const invalidateUserQueries = useCallback((userId: string) => {
    console.log(`Invalidating queries for user ${userId}`)
  }, [])

  return {
    invalidateProjectQueries,
    invalidateUserQueries
  }
}

// Export all hooks for easy importing
export const OptimizedQueries = {
  // Tasks
  useProjectTasks,
  useUserTasks,
  useTaskDetails,
  
  // Scope
  useProjectScopeItems,
  useScopeItemDetails,
  useScopeStatistics,
  
  // Projects
  useUserProjects,
  useProjectDetails,
  useProjectDashboard,
  
  // Milestones
  useProjectMilestones,
  useOverdueMilestones,
  useMilestoneCalendar,
  
  // Utilities
  useQueryInvalidation
}
