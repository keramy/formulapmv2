/**
 * Real-time Updates Hook
 * Provides real-time subscriptions for project management features
 */

'use client'

import { useEffect, useCallback, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useAuth } from '@/hooks/useAuth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a separate client for real-time subscriptions
const realtimeClient = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// ============================================================================
// REAL-TIME SUBSCRIPTION TYPES
// ============================================================================

export interface RealtimeSubscriptionOptions {
  table: string
  filter?: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  onInsert?: (payload: any) => void
  onUpdate?: (payload: any) => void
  onDelete?: (payload: any) => void
  onChange?: (payload: any) => void
}

export interface ProjectRealtimeOptions {
  projectId: string
  onTaskUpdate?: (task: any) => void
  onScopeUpdate?: (scopeItem: any) => void
  onMilestoneUpdate?: (milestone: any) => void
  onProjectUpdate?: (project: any) => void
  onTeamUpdate?: (assignment: any) => void
}

// ============================================================================
// CORE REAL-TIME HOOKS
// ============================================================================

export function useRealtimeSubscription(options: RealtimeSubscriptionOptions) {
  const { user } = useAuth()
  const channelRef = useRef<any>(null)

  useEffect(() => {
    if (!user) return

    const channelName = `${options.table}-${options.filter || 'all'}-${user.id}`
    
    channelRef.current = realtimeClient
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: options.event || '*',
          schema: 'public',
          table: options.table,
          filter: options.filter
        },
        (payload) => {
          console.log(`Real-time update on ${options.table}:`, payload)
          
          switch (payload.eventType) {
            case 'INSERT':
              options.onInsert?.(payload)
              break
            case 'UPDATE':
              options.onUpdate?.(payload)
              break
            case 'DELETE':
              options.onDelete?.(payload)
              break
          }
          
          options.onChange?.(payload)
        }
      )
      .subscribe((status) => {
        console.log(`Subscription status for ${channelName}:`, status)
      })

    return () => {
      if (channelRef.current) {
        realtimeClient.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [user, options.table, options.filter])

  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      realtimeClient.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }, [])

  return { unsubscribe }
}

// ============================================================================
// PROJECT-SPECIFIC REAL-TIME HOOKS
// ============================================================================

export function useProjectRealtimeUpdates(options: ProjectRealtimeOptions) {
  const { user } = useAuth()
  const subscriptionsRef = useRef<any[]>([])

  useEffect(() => {
    if (!user || !options.projectId) return

    // Clean up existing subscriptions
    subscriptionsRef.current.forEach(channel => {
      realtimeClient.removeChannel(channel)
    })
    subscriptionsRef.current = []

    // Task updates
    if (options.onTaskUpdate) {
      const taskChannel = realtimeClient
        .channel(`project-${options.projectId}-tasks`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tasks',
            filter: `project_id=eq.${options.projectId}`
          },
          (payload) => {
            options.onTaskUpdate?.(payload)
          }
        )
        .subscribe()
      
      subscriptionsRef.current.push(taskChannel)
    }

    // Scope item updates
    if (options.onScopeUpdate) {
      const scopeChannel = realtimeClient
        .channel(`project-${options.projectId}-scope`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'scope_items',
            filter: `project_id=eq.${options.projectId}`
          },
          (payload) => {
            options.onScopeUpdate?.(payload)
          }
        )
        .subscribe()
      
      subscriptionsRef.current.push(scopeChannel)
    }

    // Milestone updates
    if (options.onMilestoneUpdate) {
      const milestoneChannel = realtimeClient
        .channel(`project-${options.projectId}-milestones`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'project_milestones',
            filter: `project_id=eq.${options.projectId}`
          },
          (payload) => {
            options.onMilestoneUpdate?.(payload)
          }
        )
        .subscribe()
      
      subscriptionsRef.current.push(milestoneChannel)
    }

    // Project updates
    if (options.onProjectUpdate) {
      const projectChannel = realtimeClient
        .channel(`project-${options.projectId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'projects',
            filter: `id=eq.${options.projectId}`
          },
          (payload) => {
            options.onProjectUpdate?.(payload)
          }
        )
        .subscribe()
      
      subscriptionsRef.current.push(projectChannel)
    }

    // Team assignment updates
    if (options.onTeamUpdate) {
      const teamChannel = realtimeClient
        .channel(`project-${options.projectId}-team`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'project_assignments',
            filter: `project_id=eq.${options.projectId}`
          },
          (payload) => {
            options.onTeamUpdate?.(payload)
          }
        )
        .subscribe()
      
      subscriptionsRef.current.push(teamChannel)
    }

    return () => {
      subscriptionsRef.current.forEach(channel => {
        realtimeClient.removeChannel(channel)
      })
      subscriptionsRef.current = []
    }
  }, [user, options.projectId])

  const unsubscribeAll = useCallback(() => {
    subscriptionsRef.current.forEach(channel => {
      realtimeClient.removeChannel(channel)
    })
    subscriptionsRef.current = []
  }, [])

  return { unsubscribeAll }
}

// ============================================================================
// USER-SPECIFIC REAL-TIME HOOKS
// ============================================================================

export function useUserTaskUpdates(onTaskUpdate: (task: any) => void) {
  const { user } = useAuth()

  return useRealtimeSubscription({
    table: 'tasks',
    filter: `assigned_to=eq.${user?.id}`,
    onChange: onTaskUpdate
  })
}

export function useUserMilestoneUpdates(onMilestoneUpdate: (milestone: any) => void) {
  const { user } = useAuth()

  return useRealtimeSubscription({
    table: 'project_milestones',
    filter: `created_by=eq.${user?.id}`,
    onChange: onMilestoneUpdate
  })
}

// ============================================================================
// DASHBOARD REAL-TIME HOOKS
// ============================================================================

export function useDashboardRealtimeUpdates(userId: string, onUpdate: (data: any) => void) {
  const { user } = useAuth()
  const subscriptionsRef = useRef<any[]>([])

  useEffect(() => {
    if (!user || !userId) return

    // Clean up existing subscriptions
    subscriptionsRef.current.forEach(channel => {
      realtimeClient.removeChannel(channel)
    })
    subscriptionsRef.current = []

    // Subscribe to user's assigned tasks
    const taskChannel = realtimeClient
      .channel(`dashboard-tasks-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `assigned_to=eq.${userId}`
        },
        (payload) => {
          onUpdate({ type: 'task', payload })
        }
      )
      .subscribe()

    // Subscribe to user's projects
    const projectChannel = realtimeClient
      .channel(`dashboard-projects-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_assignments',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          onUpdate({ type: 'project_assignment', payload })
        }
      )
      .subscribe()

    subscriptionsRef.current = [taskChannel, projectChannel]

    return () => {
      subscriptionsRef.current.forEach(channel => {
        realtimeClient.removeChannel(channel)
      })
      subscriptionsRef.current = []
    }
  }, [user, userId, onUpdate])

  return {
    unsubscribeAll: () => {
      subscriptionsRef.current.forEach(channel => {
        realtimeClient.removeChannel(channel)
      })
      subscriptionsRef.current = []
    }
  }
}
