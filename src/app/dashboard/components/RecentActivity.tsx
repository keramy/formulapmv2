'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

  useEffect(() => {
    async function fetchRecentActivity() {
      if (!isAuthenticated) return;

      try {
        setLoading(true);

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
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const activitiesData = await response.json();
        setActivities(activitiesData);
      } catch (error) {
        console.error('Error fetching recent activity:', error);
      } finally {
        setLoading(false);
      }
    }

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

  if (loading) {
    return (
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
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-6">
            <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">No recent activity</p>
          </div>
        ) : (
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
        )}
      </CardContent>
    </Card>
  );
}