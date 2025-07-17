/**
 * Realtime Dashboard - OPTIMIZATION PHASE 1.3
 * 
 * Features:
 * - Live project updates
 * - Real-time activity feed
 * - User presence indicators
 * - Instant task status changes
 * - Collaborative editing indicators
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DataStateWrapper } from '@/components/ui/loading-states';
import { useRealtime } from '@/contexts/RealtimeContext';
import { useAuth } from '@/hooks/useAuth';
import { 
  Activity, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  Zap,
  Eye,
  Edit3,
  UserCheck
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  status: string;
  progress: number;
  updated_at: string;
  assigned_users: any[];
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  project_id: string;
  project_name: string;
  updated_at: string;
}

interface ActivityItem {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user_name: string;
  created_at: string;
  details: any;
}

export function RealtimeDashboard() {
  const { profile } = useAuth();
  const { 
    isConnected, 
    connectionStatus, 
    subscribeToActivity, 
    updatePresence, 
    getPresence,
    broadcastProjectUpdate 
  } = useRealtime();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!profile) return;

    console.log('🔴 [RealtimeDashboard] Setting up subscriptions');
    
    // Subscribe to activity feed
    const unsubscribeActivity = subscribeToActivity((payload) => {
      console.log('🔴 [RealtimeDashboard] Activity update received:', payload);
      
      if (payload.eventType === 'INSERT') {
        setActivities(prev => [payload.new, ...prev.slice(0, 9)]);
      } else if (payload.eventType === 'UPDATE') {
        setActivities(prev => prev.map(item => 
          item.id === payload.new.id ? payload.new : item
        ));
      }
    });

    // Update presence for dashboard
    updatePresence('dashboard', 'viewing');

    // Periodic presence updates
    const presenceInterval = setInterval(() => {
      updatePresence('dashboard', 'viewing');
      const presence = getPresence('dashboard');
      setOnlineUsers(presence.filter(p => p.userId !== profile.id));
    }, 30000); // Update every 30 seconds

    return () => {
      unsubscribeActivity();
      clearInterval(presenceInterval);
    };
  }, [profile, subscribeToActivity, updatePresence, getPresence]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load projects
      const projectsResponse = await fetch('/api/projects');
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData.data || []);
      }

      // Load recent tasks
      const tasksResponse = await fetch('/api/dashboard/tasks');
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        setTasks(tasksData.data || []);
      }

      // Load recent activities
      const activitiesResponse = await fetch('/api/dashboard/activity');
      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json();
        setActivities(activitiesData.data || []);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
      case 'error': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'blocked': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityIcon = (entityType: string, action: string) => {
    if (entityType === 'project' && action === 'created') return <TrendingUp className="w-4 h-4 text-blue-500" />;
    if (entityType === 'task' && action === 'updated') return <Edit3 className="w-4 h-4 text-yellow-500" />;
    if (entityType === 'task' && action === 'completed') return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const simulateProjectUpdate = useCallback((projectId: string) => {
    // Simulate a project update for demo purposes
    const update = {
      progress: Math.floor(Math.random() * 100),
      last_updated: new Date().toISOString(),
      updated_by: profile?.id
    };
    
    broadcastProjectUpdate(projectId, update);
    
    // Update local state
    setProjects(prev => prev.map(p => 
      p.id === projectId 
        ? { ...p, progress: update.progress, updated_at: update.last_updated }
        : p
    ));
  }, [profile, broadcastProjectUpdate]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-32 animate-pulse bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status Header */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor(connectionStatus)}`} />
            <span className="text-sm font-medium">
              Realtime: {connectionStatus === 'connected' ? 'Connected' : connectionStatus}
            </span>
          </div>
          <Zap className="w-4 h-4 text-blue-500" />
        </div>
        
        {/* Online Users */}
        {onlineUsers.length > 0 && (
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">{onlineUsers.length} online</span>
            <div className="flex -space-x-2">
              {onlineUsers.slice(0, 3).map((user) => (
                <Avatar key={user.userId} className="w-6 h-6 border-2 border-white">
                  <AvatarFallback className="text-xs">
                    {user.userName.split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Real-time Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Live Projects
              <Badge variant="secondary">{projects.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects.slice(0, 5).map((project) => (
                <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{project.name}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <Badge variant="outline">{project.status}</Badge>
                      <span>•</span>
                      <span>{formatTimeAgo(project.updated_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">{project.progress}%</div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => simulateProjectUpdate(project.id)}
                    >
                      <Zap className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Live Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Recent Tasks
              <Badge variant="secondary">{tasks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {getTaskStatusIcon(task.status)}
                  <div className="flex-1">
                    <div className="font-medium">{task.title}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <span>{task.project_name}</span>
                      <span>•</span>
                      <Badge variant="outline" className="text-xs">
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatTimeAgo(task.updated_at)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Live Activity Feed
            <Badge variant="secondary">{activities.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activities.slice(0, 10).map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {getActivityIcon(activity.entity_type, activity.action)}
                <div className="flex-1">
                  <div className="text-sm">
                    <span className="font-medium">{activity.user_name}</span>
                    <span className="text-gray-600"> {activity.action} </span>
                    <span className="font-medium">{activity.entity_type}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatTimeAgo(activity.created_at)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-green-600">Live</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}