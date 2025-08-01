/**
 * Supabase Realtime Context - OPTIMIZATION PHASE 1.3
 * 
 * Provides real-time subscriptions for:
 * - Project updates
 * - Task status changes
 * - Scope item modifications
 * - Activity feed updates
 * - User presence
 * 
 * Features:
 * - Connection management with automatic reconnection
 * - Selective subscriptions based on user permissions
 * - Optimized for performance with minimal re-renders
 * - Real-time collaboration support
 */

'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useAuth } from '@/hooks/useAuth';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface RealtimeContextType {
  // Connection status
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  
  // Project updates
  subscribeToProject: (projectId: string, callback: (payload: any) => void) => () => void;
  subscribeToProjectTasks: (projectId: string, callback: (payload: any) => void) => () => void;
  subscribeToProjectScope: (projectId: string, callback: (payload: any) => void) => () => void;
  
  // Activity feed
  subscribeToActivity: (callback: (payload: any) => void) => () => void;
  
  // User presence
  updatePresence: (projectId: string, status: 'viewing' | 'editing' | 'away') => void;
  getPresence: (projectId: string) => UserPresence[];
  
  // Utility functions
  broadcastProjectUpdate: (projectId: string, update: any) => void;
  broadcastTaskUpdate: (taskId: string, update: any) => void;
}

interface UserPresence {
  userId: string;
  userName: string;
  status: 'viewing' | 'editing' | 'away';
  lastSeen: Date;
  projectId: string;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

interface RealtimeProviderProps {
  children: ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const { profile } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [channels, setChannels] = useState<Map<string, RealtimeChannel>>(new Map());
  const channelsRef = useRef<Map<string, RealtimeChannel>>(new Map());
  const [presence, setPresence] = useState<Map<string, UserPresence[]>>(new Map());
  
  const supabase = createClientComponentClient();

  // Keep channelsRef in sync with channels state
  useEffect(() => {
    channelsRef.current = channels;
  }, [channels]);

  // Initialize realtime connection
  useEffect(() => {
    if (!profile) return;

    console.log('🔴 [Realtime] Initializing connection for user:', profile.id);
    setConnectionStatus('connecting');

    // Monitor connection status (reduced frequency)
    const checkConnection = () => {
      const channels = supabase.getChannels();
      const hasConnectedChannels = channels.some(channel => channel.state === 'joined');
      
      if (hasConnectedChannels) {
        setIsConnected(true);
        setConnectionStatus('connected');
        console.log('🟢 [Realtime] Connected successfully');
      } else {
        setIsConnected(false);  
        setConnectionStatus('disconnected');
      }
    };
    
    // Check connection status less frequently (every 30 seconds instead of every second)
    const connectionInterval = setInterval(checkConnection, 30000);
    
    // Initial check with delay to allow connection to establish
    setTimeout(checkConnection, 2000);

    return () => {
      console.log('🔴 [Realtime] Cleaning up connection');
      clearInterval(connectionInterval);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      
      // Clean up all channels
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      setChannels(new Map());
    };
  }, [profile?.id]);

  // Subscribe to project updates
  const subscribeToProject = useCallback((projectId: string, callback: (payload: any) => void) => {
    if (!profile) return () => {};

    const channelName = `project:${projectId}`;
    console.log('🔴 [Realtime] Subscribing to project:', projectId);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('🔴 [Realtime] Project update:', payload);
          callback(payload);
        }
      )
      .subscribe((status) => {
        console.log('🔴 [Realtime] Project subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setChannels(prev => new Map(prev).set(channelName, channel));
        }
      });

    return () => {
      console.log('🔴 [Realtime] Unsubscribing from project:', projectId);
      supabase.removeChannel(channel);
      setChannels(prev => {
        const newMap = new Map(prev);
        newMap.delete(channelName);
        return newMap;
      });
    };
  }, [profile, supabase]);

  // Subscribe to project tasks
  const subscribeToProjectTasks = useCallback((projectId: string, callback: (payload: any) => void) => {
    if (!profile) return () => {};

    const channelName = `project-tasks:${projectId}`;
    console.log('🔴 [Realtime] Subscribing to project tasks:', projectId);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectId}`,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('🔴 [Realtime] Task update:', payload);
          callback(payload);
        }
      )
      .subscribe((status) => {
        console.log('🔴 [Realtime] Task subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setChannels(prev => new Map(prev).set(channelName, channel));
        }
      });

    return () => {
      console.log('🔴 [Realtime] Unsubscribing from project tasks:', projectId);
      supabase.removeChannel(channel);
      setChannels(prev => {
        const newMap = new Map(prev);
        newMap.delete(channelName);
        return newMap;
      });
    };
  }, [profile, supabase]);

  // Subscribe to project scope items
  const subscribeToProjectScope = useCallback((projectId: string, callback: (payload: any) => void) => {
    if (!profile) return () => {};

    const channelName = `project-scope:${projectId}`;
    console.log('🔴 [Realtime] Subscribing to project scope:', projectId);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scope_items',
          filter: `project_id=eq.${projectId}`,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('🔴 [Realtime] Scope update:', payload);
          callback(payload);
        }
      )
      .subscribe((status) => {
        console.log('🔴 [Realtime] Scope subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setChannels(prev => new Map(prev).set(channelName, channel));
        }
      });

    return () => {
      console.log('🔴 [Realtime] Unsubscribing from project scope:', projectId);
      supabase.removeChannel(channel);
      setChannels(prev => {
        const newMap = new Map(prev);
        newMap.delete(channelName);
        return newMap;
      });
    };
  }, [profile, supabase]);

  // Subscribe to activity feed
  const subscribeToActivity = useCallback((callback: (payload: any) => void) => {
    if (!profile) return () => {};

    const channelName = `activity-feed:${profile.id}`;
    console.log('🔴 [Realtime] Subscribing to activity feed');
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_logs',
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('🔴 [Realtime] Activity update:', payload);
          callback(payload);
        }
      )
      .subscribe((status) => {
        console.log('🔴 [Realtime] Activity subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setChannels(prev => new Map(prev).set(channelName, channel));
        }
      });

    return () => {
      console.log('🔴 [Realtime] Unsubscribing from activity feed');
      supabase.removeChannel(channel);
      setChannels(prev => {
        const newMap = new Map(prev);
        newMap.delete(channelName);
        return newMap;
      });
    };
  }, [profile, supabase]);

  // Update user presence
  const updatePresence = useCallback((projectId: string, status: 'viewing' | 'editing' | 'away') => {
    if (!profile) return;

    const channelName = `presence:${projectId}`;
    const existingChannel = channelsRef.current.get(channelName);
    
    if (existingChannel) {
      existingChannel.track({
        userId: profile.id,
        userName: `${profile.first_name} ${profile.last_name}`,
        status,
        lastSeen: new Date().toISOString(),
        projectId
      });
    } else {
      // Create new presence channel
      const channel = supabase
        .channel(channelName)
        .on('presence', { event: 'sync' }, () => {
          const newState = channel.presenceState();
          const presenceList: UserPresence[] = [];
          
          Object.values(newState).forEach((presences: any) => {
            presences.forEach((presence: any) => {
              presenceList.push({
                userId: presence.userId,
                userName: presence.userName,
                status: presence.status,
                lastSeen: new Date(presence.lastSeen),
                projectId: presence.projectId
              });
            });
          });
          
          setPresence(prev => new Map(prev).set(projectId, presenceList));
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            setChannels(prev => {
              const newMap = new Map(prev);
              newMap.set(channelName, channel);
              return newMap;
            });
            channelsRef.current.set(channelName, channel);
            await channel.track({
              userId: profile.id,
              userName: `${profile.first_name} ${profile.last_name}`,
              status,
              lastSeen: new Date().toISOString(),
              projectId
            });
          }
        });
    }
  }, [profile, supabase]);

  // Get presence for a project
  const getPresence = useCallback((projectId: string): UserPresence[] => {
    return presence.get(projectId) || [];
  }, [presence]);

  // Broadcast project update
  const broadcastProjectUpdate = useCallback((projectId: string, update: any) => {
    if (!profile) return;

    const channelName = `project-broadcast:${projectId}`;
    const channel = supabase.channel(channelName);
    
    channel.send({
      type: 'broadcast',
      event: 'project-update',
      payload: {
        projectId,
        update,
        userId: profile.id,
        userName: `${profile.first_name} ${profile.last_name}`,
        timestamp: new Date().toISOString()
      }
    });
  }, [profile, supabase]);

  // Broadcast task update
  const broadcastTaskUpdate = useCallback((taskId: string, update: any) => {
    if (!profile) return;

    const channelName = `task-broadcast:${taskId}`;
    const channel = supabase.channel(channelName);
    
    channel.send({
      type: 'broadcast',
      event: 'task-update',
      payload: {
        taskId,
        update,
        userId: profile.id,
        userName: `${profile.first_name} ${profile.last_name}`,
        timestamp: new Date().toISOString()
      }
    });
  }, [profile, supabase]);

  const value: RealtimeContextType = {
    isConnected,
    connectionStatus,
    subscribeToProject,
    subscribeToProjectTasks,
    subscribeToProjectScope,
    subscribeToActivity,
    updatePresence,
    getPresence,
    broadcastProjectUpdate,
    broadcastTaskUpdate
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}