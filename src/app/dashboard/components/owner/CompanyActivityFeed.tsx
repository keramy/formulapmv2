'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import {
  FileText,
  UserPlus,
  CheckCircle,
  XCircle,
  Upload,
  Building,
  Clock,
  Activity
} from 'lucide-react';

interface ActivityItem {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_name?: string;
  created_at: string;
  user?: {
    first_name: string;
    last_name: string;
  } | null;
  metadata?: any;
}

export function CompanyActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivities();

    // Set up real-time subscription
    const channel = supabase
      .channel('activity-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs'
        },
        (payload) => {
          fetchRecentActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRecentActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          id,
          user_id,
          action,
          entity_type,
          entity_name,
          created_at,
          metadata,
          user:user_profiles!audit_logs_user_id_fkey(
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const formattedActivities = (data || []).map(item => ({
        ...item,
        user: item.user ? item.user : null
      }));
      setActivities(formattedActivities as ActivityItem[]);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (action: string, entityType: string) => {
    if (action === 'create' && entityType === 'project') return <Building className="h-4 w-4" />;
    if (action === 'create' && entityType === 'user') return <UserPlus className="h-4 w-4" />;
    if (action === 'approve') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (action === 'reject') return <XCircle className="h-4 w-4 text-red-500" />;
    if (action === 'upload') return <Upload className="h-4 w-4" />;
    if (entityType === 'document') return <FileText className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getActivityMessage = (activity: ActivityItem) => {
    const userName = activity.user 
      ? `${activity.user.first_name} ${activity.user.last_name}`
      : 'System';

    switch (activity.action) {
      case 'create':
        if (activity.entity_type === 'project') {
          return `${userName} created new project "${activity.entity_name}"`;
        }
        if (activity.entity_type === 'user') {
          return `${userName} added new user to the system`;
        }
        return `${userName} created ${activity.entity_type} "${activity.entity_name}"`;
      
      case 'approve':
        return `${userName} approved ${activity.entity_type} "${activity.entity_name}"`;
      
      case 'reject':
        return `${userName} rejected ${activity.entity_type} "${activity.entity_name}"`;
      
      case 'upload':
        return `${userName} uploaded ${activity.entity_type} "${activity.entity_name}"`;
      
      case 'update':
        return `${userName} updated ${activity.entity_type} "${activity.entity_name}"`;
      
      case 'delete':
        return `${userName} deleted ${activity.entity_type} "${activity.entity_name}"`;
      
      case 'login':
        return `${userName} logged into the system`;
      
      default:
        return `${userName} performed ${activity.action} on ${activity.entity_type}`;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-blue-100 text-blue-700';
      case 'approve':
        return 'bg-green-100 text-green-700';
      case 'reject':
        return 'bg-red-100 text-red-700';
      case 'upload':
        return 'bg-purple-100 text-purple-700';
      case 'update':
        return 'bg-yellow-100 text-yellow-700';
      case 'delete':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Company Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Company Activity
          <Badge variant="secondary" className="text-xs">
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {activities.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No recent activities</p>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getActivityIcon(activity.action, activity.entity_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 break-words">
                    {getActivityMessage(activity)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getActionColor(activity.action)}`}
                    >
                      {activity.action}
                    </Badge>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(activity.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}