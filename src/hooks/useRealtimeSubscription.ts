/**
 * useRealtimeSubscription Hook - OPTIMIZATION PHASE 1.3
 * 
 * Simplified hook for managing real-time subscriptions in components
 * - Automatic cleanup on unmount
 * - Loading states
 * - Error handling
 * - Reconnection logic
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRealtime } from '@/contexts/RealtimeContext';
import { useAuth } from '@/hooks/useAuth';
import { useAdvancedApiQuery } from './useAdvancedApiQuery';

interface UseRealtimeSubscriptionOptions {
  // Auto-subscribe on mount
  autoSubscribe?: boolean;
  
  // Retry failed subscriptions
  retryOnError?: boolean;
  
  // Custom error handler
  onError?: (error: Error) => void;
  
  // Connection status callback
  onConnectionChange?: (connected: boolean) => void;
}

interface UseRealtimeSubscriptionReturn {
  // Subscription state
  isSubscribed: boolean;
  isConnected: boolean;
  error: Error | null;
  
  // Subscription methods
  subscribeToProject: (projectId: string, callback: (payload: any) => void) => void;
  subscribeToTasks: (projectId: string, callback: (payload: any) => void) => void;
  subscribeToScope: (projectId: string, callback: (payload: any) => void) => void;
  subscribeToActivity: (callback: (payload: any) => void) => void;
  
  // Utility methods
  unsubscribeAll: () => void;
  refreshSubscriptions: () => void;
  
  // User presence
  updatePresence: (projectId: string, status: 'viewing' | 'editing' | 'away') => void;
  getPresence: (projectId: string) => any[];
}

export function useRealtimeSubscription(
  options: UseRealtimeSubscriptionOptions = {}
): UseRealtimeSubscriptionReturn {
  const { 
    autoSubscribe = true, 
    retryOnError = true, 
    onError, 
    onConnectionChange 
  } = options;

  const { profile } = useAuth();
  const realtime = useRealtime();
  
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Track active subscriptions for cleanup
  const subscriptionsRef = useRef<(() => void)[]>([]);

  // Connection status change handler
  useEffect(() => {
    if (onConnectionChange) {
      onConnectionChange(realtime.isConnected);
    }
  }, [realtime.isConnected, onConnectionChange]);

  // Error handler
  const handleError = useCallback((err: Error) => {
    setError(err);
    if (onError) {
      onError(err);
    }
    
    if (retryOnError) {
      // Retry after 3 seconds
      setTimeout(() => {
        setError(null);
        // Could implement retry logic here
      }, 3000);
    }
  }, [onError, retryOnError]);

  // Subscribe to project updates
  const subscribeToProject = useCallback((projectId: string, callback: (payload: any) => void) => {
    if (!profile) return;
    
    try {
      const unsubscribe = realtime.subscribeToProject(projectId, (payload) => {
        try {
          callback(payload);
        } catch (err) {
          handleError(err as Error);
        }
      });
      
      subscriptionsRef.current.push(unsubscribe);
      setIsSubscribed(true);
      setError(null);
    } catch (err) {
      handleError(err as Error);
    }
  }, [profile, realtime, handleError]);

  // Subscribe to project tasks
  const subscribeToTasks = useCallback((projectId: string, callback: (payload: any) => void) => {
    if (!profile) return;
    
    try {
      const unsubscribe = realtime.subscribeToProjectTasks(projectId, (payload) => {
        try {
          callback(payload);
        } catch (err) {
          handleError(err as Error);
        }
      });
      
      subscriptionsRef.current.push(unsubscribe);
      setIsSubscribed(true);
      setError(null);
    } catch (err) {
      handleError(err as Error);
    }
  }, [profile, realtime, handleError]);

  // Subscribe to project scope
  const subscribeToScope = useCallback((projectId: string, callback: (payload: any) => void) => {
    if (!profile) return;
    
    try {
      const unsubscribe = realtime.subscribeToProjectScope(projectId, (payload) => {
        try {
          callback(payload);
        } catch (err) {
          handleError(err as Error);
        }
      });
      
      subscriptionsRef.current.push(unsubscribe);
      setIsSubscribed(true);
      setError(null);
    } catch (err) {
      handleError(err as Error);
    }
  }, [profile, realtime, handleError]);

  // Subscribe to activity feed
  const subscribeToActivity = useCallback((callback: (payload: any) => void) => {
    if (!profile) return;
    
    try {
      const unsubscribe = realtime.subscribeToActivity((payload) => {
        try {
          callback(payload);
        } catch (err) {
          handleError(err as Error);
        }
      });
      
      subscriptionsRef.current.push(unsubscribe);
      setIsSubscribed(true);
      setError(null);
    } catch (err) {
      handleError(err as Error);
    }
  }, [profile, realtime, handleError]);

  // Unsubscribe from all subscriptions
  const unsubscribeAll = useCallback(() => {
    subscriptionsRef.current.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch (err) {
        console.error('Error unsubscribing:', err);
      }
    });
    subscriptionsRef.current = [];
    setIsSubscribed(false);
  }, []);

  // Refresh all subscriptions
  const refreshSubscriptions = useCallback(() => {
    unsubscribeAll();
    setError(null);
    // Note: Components would need to re-call their subscription methods
  }, [unsubscribeAll]);

  // Update user presence
  const updatePresence = useCallback((projectId: string, status: 'viewing' | 'editing' | 'away') => {
    if (!profile) return;
    
    try {
      realtime.updatePresence(projectId, status);
    } catch (err) {
      handleError(err as Error);
    }
  }, [profile, realtime, handleError]);

  // Get presence for a project
  const getPresence = useCallback((projectId: string) => {
    if (!profile) return [];
    
    try {
      return realtime.getPresence(projectId);
    } catch (err) {
      handleError(err as Error);
      return [];
    }
  }, [profile, realtime, handleError]);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      unsubscribeAll();
    };
  }, [unsubscribeAll]);

  return {
    isSubscribed,
    isConnected: realtime.isConnected,
    error,
    subscribeToProject,
    subscribeToTasks,
    subscribeToScope,
    subscribeToActivity,
    unsubscribeAll,
    refreshSubscriptions,
    updatePresence,
    getPresence
  };
}

// Specialized hooks for common use cases
export function useProjectRealtime(projectId: string | null) {
  const subscription = useRealtimeSubscription();
  
  const [projectData, setProjectData] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [scopeItems, setScopeItems] = useState<any[]>([]);
  
  useEffect(() => {
    if (!projectId) return;
    
    // Subscribe to project updates
    subscription.subscribeToProject(projectId, (payload) => {
      if (payload.eventType === 'UPDATE') {
        setProjectData(payload.new);
      }
    });
    
    // Subscribe to tasks
    subscription.subscribeToTasks(projectId, (payload) => {
      if (payload.eventType === 'INSERT') {
        setTasks(prev => [...prev, payload.new]);
      } else if (payload.eventType === 'UPDATE') {
        setTasks(prev => prev.map(task => 
          task.id === payload.new.id ? payload.new : task
        ));
      } else if (payload.eventType === 'DELETE') {
        setTasks(prev => prev.filter(task => task.id !== payload.old.id));
      }
    });
    
    // Subscribe to scope items
    subscription.subscribeToScope(projectId, (payload) => {
      if (payload.eventType === 'INSERT') {
        setScopeItems(prev => [...prev, payload.new]);
      } else if (payload.eventType === 'UPDATE') {
        setScopeItems(prev => prev.map(item => 
          item.id === payload.new.id ? payload.new : item
        ));
      } else if (payload.eventType === 'DELETE') {
        setScopeItems(prev => prev.filter(item => item.id !== payload.old.id));
      }
    });
    
    return () => {
      subscription.unsubscribeAll();
    };
  }, [projectId, subscription]);
  
  return {
    ...subscription,
    projectData,
    tasks,
    scopeItems
  };
}

export function useDashboardRealtime() {
  const subscription = useRealtimeSubscription();
  
  const [activities, setActivities] = useState<any[]>([]);
  
  useEffect(() => {
    subscription.subscribeToActivity((payload) => {
      if (payload.eventType === 'INSERT') {
        setActivities(prev => [payload.new, ...prev.slice(0, 19)]);
      }
    });
    
    return () => {
      subscription.unsubscribeAll();
    };
  }, [subscription]);
  
  return {
    ...subscription,
    activities
  };
}

/**
 * Enhanced Realtime Subscription hook using advanced API query patterns
 * This demonstrates the optimized approach with caching and intelligent reconnection
 */
export function useRealtimeSubscriptionAdvanced(
  channel: string,
  options: UseRealtimeSubscriptionOptions = {}
) {
  const { autoSubscribe = true, retryOnError = true, onError, onConnectionChange } = options
  const { profile } = useAuth()
  const { realtime } = useRealtime()

  // Use advanced API query for initial data
  const {
    data: initialData,
    loading: initialLoading,
    error: initialError,
    refetch: refetchInitialData,
    mutate: mutateData
  } = useAdvancedApiQuery({
    queryKey: ['realtime-initial', channel],
    queryFn: async () => {
      if (!profile) return null

      // Fetch initial data for the channel
      const response = await fetch(`/api/realtime/initial/${channel}`)
      if (!response.ok) throw new Error('Failed to fetch initial data')

      const result = await response.json()
      return result.success ? result.data : null
    },
    enabled: !!profile && autoSubscribe,
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    refetchInterval: false // Real-time updates handle this
  })

  // Enhanced subscription state
  const [subscriptionState, setSubscriptionState] = useState({
    connected: false,
    subscribed: false,
    error: null as Error | null,
    lastUpdate: null as Date | null,
    reconnectAttempts: 0
  })

  // Real-time data state
  const [realtimeData, setRealtimeData] = useState(initialData)

  // Enhanced subscription management
  const subscribe = useCallback(() => {
    if (!profile || !realtime) return

    try {
      const unsubscribe = realtime.subscribe(channel, (payload) => {
        // Update real-time data
        setRealtimeData(prev => {
          // Merge or replace data based on payload type
          if (payload.type === 'UPDATE') {
            return { ...prev, ...payload.data }
          } else if (payload.type === 'INSERT') {
            return Array.isArray(prev) ? [...prev, payload.data] : payload.data
          } else if (payload.type === 'DELETE') {
            return Array.isArray(prev)
              ? prev.filter(item => item.id !== payload.data.id)
              : null
          }
          return payload.data
        })

        // Update subscription state
        setSubscriptionState(prev => ({
          ...prev,
          lastUpdate: new Date(),
          error: null,
          reconnectAttempts: 0
        }))

        // Invalidate related queries
        mutateData()
      })

      setSubscriptionState(prev => ({
        ...prev,
        connected: true,
        subscribed: true,
        error: null
      }))

      onConnectionChange?.(true)
      return unsubscribe

    } catch (error) {
      const err = error as Error
      setSubscriptionState(prev => ({
        ...prev,
        error: err,
        reconnectAttempts: prev.reconnectAttempts + 1
      }))

      onError?.(err)
      onConnectionChange?.(false)

      // Retry logic
      if (retryOnError && subscriptionState.reconnectAttempts < 3) {
        setTimeout(() => subscribe(), 1000 * Math.pow(2, subscriptionState.reconnectAttempts))
      }
    }
  }, [profile, realtime, channel, retryOnError, onError, onConnectionChange, subscriptionState.reconnectAttempts, mutateData])

  // Auto-subscribe effect
  useEffect(() => {
    if (autoSubscribe && profile) {
      const unsubscribe = subscribe()
      return unsubscribe
    }
  }, [autoSubscribe, profile, subscribe])

  // Sync initial data with real-time data
  useEffect(() => {
    if (initialData && !realtimeData) {
      setRealtimeData(initialData)
    }
  }, [initialData, realtimeData])

  return {
    // Data
    data: realtimeData || initialData,
    initialData,

    // Loading states
    loading: initialLoading,
    initialLoading,

    // Errors
    error: initialError || subscriptionState.error,
    initialError,
    subscriptionError: subscriptionState.error,

    // Connection state
    connected: subscriptionState.connected,
    subscribed: subscriptionState.subscribed,
    lastUpdate: subscriptionState.lastUpdate,
    reconnectAttempts: subscriptionState.reconnectAttempts,

    // Actions
    subscribe,
    refetchInitialData,
    mutateData
  }
}