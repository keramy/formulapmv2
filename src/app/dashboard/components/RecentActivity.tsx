'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataStateWrapper } from '@/components/ui/loading-states';
import { useAuth } from '@/hooks/useAuth';
import { User, FileText, CheckSquare, FolderOpen, Clock } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'project' | 'document' | 'scope_item' | 'user';
  title: string;
  description: string;
  timestamp: string;
  user_name?: string;
  project_name?: string;
  status?: string;
}

export function RecentActivity() {
  const { getAccessToken, isAuthenticated } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentActivity = async () => {
    if (!isAuthenticated) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get access token for authenticated API call
      const token = await getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      // Fetch recent activity from authenticated API endpoint
      const response = await fetch('/api/dashboard/recent-activity', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Get detailed error from server response
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = `${errorMessage} - ${errorData.error}`;
          }
          console.error('📈 [RecentActivity] API Error Details:', errorData);
        } catch (parseError) {
          console.error('📈 [RecentActivity] Failed to parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const activitiesData = await response.json();
      setActivities(activitiesData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch recent activity';
      setError(errorMessage);
      console.error('Error fetching recent activity:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentActivity();
  }, [isAuthenticated, getAccessToken]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project':
        return FolderOpen;
      case 'document':
        return FileText;
      case 'scope_item':
        return CheckSquare;
      case 'user':
        return User;
      default:
        return Clock;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'project':
        return 'text-blue-600 bg-blue-100';
      case 'document':
        return 'text-green-600 bg-green-100';
      case 'scope_item':
        return 'text-orange-600 bg-orange-100';
      case 'user':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusVariant = (status?: string) => {
    if (!status) return 'outline';
    
    switch (status) {
      case 'active':
      case 'completed':
      case 'approved':
        return 'secondary';
      case 'in_progress':
      case 'review':
        return 'default';
      case 'on_hold':
      case 'pending':
        return 'outline';
      case 'cancelled':
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <DataStateWrapper
      loading={loading}
      error={error}
      data={activities}
      onRetry={fetchRecentActivity}
      emptyComponent={
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">No Recent Activity</h3>
              <p className="text-sm text-gray-500">
                Activity will appear here as you work on projects and tasks.
              </p>
            </div>
          </CardContent>
        </Card>
      }
      loadingComponent={
        <Card>
          <CardHeader>
            <div className="h-5 w-28 bg-gray-200 rounded animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      }
    >
      <Card>
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              const colorClasses = getActivityColor(activity.type);
              
              return (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full ${colorClasses}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 leading-tight">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.description}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">
                        {formatTimestamp(activity.timestamp)}
                      </span>
                      {activity.status && (
                        <Badge variant={getStatusVariant(activity.status)} className="text-xs">
                          {activity.status.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
    </DataStateWrapper>
  );
}

/**
 * Enhanced RecentActivity using DataStateWrapper pattern (claude.md aligned)
 * Following the proven UI component optimization pattern from claude.md
 */
export function RecentActivityEnhanced() {
  const { getAccessToken, isAuthenticated } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentActivity = async () => {
    if (!isAuthenticated) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = await getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const response = await fetch('/api/dashboard/recent-activity', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const activitiesData = await response.json();
      setActivities(activitiesData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch recent activity';
      setError(errorMessage);
      console.error('Error fetching recent activity:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentActivity();
  }, [isAuthenticated]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project_created': return '🏗️';
      case 'task_completed': return '✅';
      case 'milestone_reached': return '🎯';
      case 'document_uploaded': return '📄';
      case 'user_joined': return '👤';
      default: return '📝';
    }
  };

  const getStatusVariant = (status?: string) => {
    if (!status) return 'outline';

    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <DataStateWrapper
      loading={loading}
      error={error}
      data={activities}
      onRetry={fetchRecentActivity}
      emptyComponent={
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-muted-foreground">No recent activity</div>
              <p className="text-sm text-muted-foreground mt-2">
                Activity will appear here as you work on projects.
              </p>
            </div>
          </CardContent>
        </Card>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                <div className="text-lg">{getActivityIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {activity.description}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-400">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                    {activity.status && (
                      <Badge variant={getStatusVariant(activity.status)} className="text-xs">
                        {activity.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DataStateWrapper>
  );
}