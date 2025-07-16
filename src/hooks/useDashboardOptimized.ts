/**
 * Optimized Dashboard Hook
 * High-performance dashboard data fetching with intelligent caching
 */

'use client'

import { useAdvancedApiQuery } from './useAdvancedApiQuery'
import { useOptimizedQueries } from './useOptimizedQueries'
import { useRealtimeUpdates } from './useRealtimeUpdates'
import { useAuth } from './useAuth'
import { useMemo, useCallback } from 'react'

// ============================================================================
// DASHBOARD DATA TYPES
// ============================================================================

export interface DashboardStats {
  tasks: {
    total: number
    completed: number
    overdue: number
    dueToday: number
    assigned: number
  }
  projects: {
    total: number
    active: number
    completed: number
    planning: number
    myProjects: number
  }
  milestones: {
    total: number
    upcoming: number
    overdue: number
    completed: number
  }
  scope: {
    totalItems: number
    completedItems: number
    totalValue: number
    completedValue: number
  }
}

export interface DashboardData {
  stats: DashboardStats
  recentTasks: any[]
  recentProjects: any[]
  upcomingMilestones: any[]
  recentActivity: any[]
  notifications: any[]
}

// ============================================================================
// OPTIMIZED DASHBOARD HOOK
// ============================================================================

export function useDashboardOptimized(userId: string) {
  const { user } = useAuth()
  
  // Core dashboard statistics with aggressive caching
  const { data: stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useAdvancedApiQuery<DashboardStats>({
    endpoint: `/api/dashboard/stats`,
    params: { user_id: userId },
    cacheKey: `dashboard-stats-${userId}`,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes background refresh
    backgroundRefetch: true,
    enabled: !!userId
  })

  // Recent tasks with real-time updates
  const { data: recentTasks, loading: tasksLoading, refetch: refetchTasks } = useAdvancedApiQuery({
    endpoint: `/api/users/${userId}/tasks/recent`,
    cacheKey: `dashboard-recent-tasks-${userId}`,
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
    realtime: true,
    realtimeChannel: `user-${userId}-tasks`,
    realtimeEvents: ['INSERT', 'UPDATE'],
    enabled: !!userId
  })

  // User's active projects
  const { data: recentProjects, loading: projectsLoading, refetch: refetchProjects } = useAdvancedApiQuery({
    endpoint: `/api/users/${userId}/projects/active`,
    cacheKey: `dashboard-active-projects-${userId}`,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    enabled: !!userId
  })

  // Upcoming milestones
  const { data: upcomingMilestones, loading: milestonesLoading, refetch: refetchMilestones } = useAdvancedApiQuery({
    endpoint: `/api/users/${userId}/milestones/upcoming`,
    params: { days_ahead: 14 },
    cacheKey: `dashboard-upcoming-milestones-${userId}`,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    enabled: !!userId
  })

  // Recent activity feed
  const { data: recentActivity, loading: activityLoading, refetch: refetchActivity } = useAdvancedApiQuery({
    endpoint: `/api/users/${userId}/activity/recent`,
    params: { limit: 10 },
    cacheKey: `dashboard-recent-activity-${userId}`,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 3 * 60 * 1000, // 3 minutes background refresh
    enabled: !!userId
  })

  // Notifications
  const { data: notifications, loading: notificationsLoading, refetch: refetchNotifications } = useAdvancedApiQuery({
    endpoint: `/api/users/${userId}/notifications`,
    params: { unread_only: true },
    cacheKey: `dashboard-notifications-${userId}`,
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 60 * 1000, // 1 minute
    realtime: true,
    realtimeChannel: `user-${userId}-notifications`,
    enabled: !!userId
  })

  // Real-time updates for dashboard
  useRealtimeUpdates({
    table: 'tasks',
    filter: `assigned_to=eq.${userId}`,
    onChange: useCallback(() => {
      refetchStats()
      refetchTasks()
    }, [refetchStats, refetchTasks])
  })

  // Aggregate loading state
  const loading = statsLoading || tasksLoading || projectsLoading || milestonesLoading

  // Aggregate error state
  const error = statsError

  // Combined dashboard data
  const dashboardData: DashboardData | null = useMemo(() => {
    if (!stats) return null

    return {
      stats,
      recentTasks: recentTasks || [],
      recentProjects: recentProjects || [],
      upcomingMilestones: upcomingMilestones || [],
      recentActivity: recentActivity || [],
      notifications: notifications || []
    }
  }, [stats, recentTasks, recentProjects, upcomingMilestones, recentActivity, notifications])

  // Refresh all dashboard data
  const refreshAll = useCallback(async () => {
    await Promise.all([
      refetchStats(),
      refetchTasks(),
      refetchProjects(),
      refetchMilestones(),
      refetchActivity(),
      refetchNotifications()
    ])
  }, [refetchStats, refetchTasks, refetchProjects, refetchMilestones, refetchActivity, refetchNotifications])

  // Quick actions
  const quickActions = useMemo(() => ({
    markNotificationRead: async (notificationId: string) => {
      // This would call the API to mark notification as read
      // Then refresh notifications
      await refetchNotifications()
    },
    
    markTaskComplete: async (taskId: string) => {
      // This would call the API to mark task as complete
      // Then refresh stats and tasks
      await Promise.all([refetchStats(), refetchTasks()])
    },

    refreshStats: refetchStats,
    refreshTasks: refetchTasks,
    refreshProjects: refetchProjects
  }), [refetchStats, refetchTasks, refetchProjects, refetchNotifications])

  return {
    data: dashboardData,
    loading,
    error,
    refreshAll,
    quickActions,
    
    // Individual loading states for granular UI control
    loadingStates: {
      stats: statsLoading,
      tasks: tasksLoading,
      projects: projectsLoading,
      milestones: milestonesLoading,
      activity: activityLoading,
      notifications: notificationsLoading
    }
  }
}

// ============================================================================
// PROJECT-SPECIFIC DASHBOARD HOOK
// ============================================================================

export function useProjectDashboardOptimized(projectId: string) {
  const { user } = useAuth()

  // Project overview with real-time updates
  const { data: projectData, loading: projectLoading, error: projectError, refetch: refetchProject } = useAdvancedApiQuery({
    endpoint: `/api/projects/${projectId}/dashboard`,
    cacheKey: `project-dashboard-${projectId}`,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    realtime: true,
    realtimeChannel: `project-${projectId}`,
    realtimeEvents: ['UPDATE'],
    enabled: !!projectId
  })

  // Project tasks with real-time updates
  const { data: tasks, loading: tasksLoading, refetch: refetchTasks } = useOptimizedQueries.useProjectTasks(projectId, {
    realtime: true
  })

  // Project scope items
  const { data: scopeItems, loading: scopeLoading, refetch: refetchScope } = useOptimizedQueries.useProjectScopeItems(projectId)

  // Project milestones
  const { data: milestones, loading: milestonesLoading, refetch: refetchMilestones } = useOptimizedQueries.useProjectMilestones(projectId)

  // Project statistics
  const { data: scopeStats, loading: scopeStatsLoading } = useOptimizedQueries.useScopeStatistics(projectId)

  const loading = projectLoading || tasksLoading || scopeLoading || milestonesLoading

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refetchProject(),
      refetchTasks(),
      refetchScope(),
      refetchMilestones()
    ])
  }, [refetchProject, refetchTasks, refetchScope, refetchMilestones])

  return {
    project: projectData,
    tasks,
    scopeItems,
    milestones,
    scopeStats,
    loading,
    error: projectError,
    refreshAll,
    
    loadingStates: {
      project: projectLoading,
      tasks: tasksLoading,
      scope: scopeLoading,
      milestones: milestonesLoading,
      scopeStats: scopeStatsLoading
    }
  }
}

// ============================================================================
// ROLE-BASED DASHBOARD HOOKS
// ============================================================================

export function useManagerDashboard(userId: string) {
  const baseDashboard = useDashboardOptimized(userId)
  
  // Additional manager-specific data
  const { data: teamStats } = useAdvancedApiQuery({
    endpoint: `/api/managers/${userId}/team-stats`,
    cacheKey: `manager-team-stats-${userId}`,
    staleTime: 5 * 60 * 1000,
    enabled: !!userId
  })

  const { data: budgetOverview } = useAdvancedApiQuery({
    endpoint: `/api/managers/${userId}/budget-overview`,
    cacheKey: `manager-budget-${userId}`,
    staleTime: 10 * 60 * 1000,
    enabled: !!userId
  })

  return {
    ...baseDashboard,
    teamStats,
    budgetOverview
  }
}

export function useFieldWorkerDashboard(userId: string) {
  const baseDashboard = useDashboardOptimized(userId)
  
  // Field worker specific data
  const { data: todaysTasks } = useAdvancedApiQuery({
    endpoint: `/api/field-workers/${userId}/todays-tasks`,
    cacheKey: `field-worker-today-${userId}`,
    staleTime: 30 * 1000, // 30 seconds - field work changes quickly
    refetchInterval: 2 * 60 * 1000, // 2 minutes
    enabled: !!userId
  })

  return {
    ...baseDashboard,
    todaysTasks
  }
}
