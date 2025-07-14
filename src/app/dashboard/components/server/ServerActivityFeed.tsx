/**
 * Server Activity Feed Component
 * 
 * Fetches recent activity data on the server for immediate rendering
 * Shows recent actions, updates, and notifications
 */

import Link from 'next/link';
import { createServerClient } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  FolderOpen, 
  CheckCircle, 
  AlertCircle, 
  UserPlus, 
  FileText, 
  DollarSign,
  Clock,
  Activity
} from 'lucide-react';

interface ActivityItem {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  user_name: string;
  user_email: string;
  created_at: string;
  details: Record<string, any>;
}

async function getRecentActivity(userId: string, role: string): Promise<ActivityItem[]> {
  const supabase = createServerClient();
  
  try {
    // Get recent audit logs with user information
    const { data: activities, error } = await supabase
      .from('audit_logs')
      .select(`
        id,
        action,
        entity_type,
        entity_id,
        details,
        created_at,
        user_id,
        user_profiles (
          first_name,
          last_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('❌ [ServerActivityFeed] Error fetching activities:', error);
      return [];
    }

    if (!activities) return [];

    // Transform the data for easier rendering
    const transformedActivities: ActivityItem[] = activities.map((activity: any) => {
      const userProfile = activity.user_profiles;
      return {
        id: activity.id,
        action: activity.action,
        entity_type: activity.entity_type,
        entity_id: activity.entity_id,
        entity_name: activity.details?.entity_name || 'Unknown',
        user_name: userProfile ? `${userProfile.first_name} ${userProfile.last_name}` : 'Unknown User',
        user_email: userProfile?.email || '',
        created_at: activity.created_at,
        details: activity.details || {}
      };
    });

    return transformedActivities;
  } catch (error) {
    console.error('❌ [ServerActivityFeed] Unexpected error:', error);
    return [];
  }
}

interface ServerActivityFeedProps {
  userId: string;
  role: string;
}

export async function ServerActivityFeed({ userId, role }: ServerActivityFeedProps) {
  const activities = await getRecentActivity(userId, role);

  const getActivityIcon = (action: string, entityType: string) => {
    const iconClass = "h-4 w-4";
    
    switch (action) {
      case 'CREATE':
        return <UserPlus className={iconClass} />;
      case 'UPDATE':
        return <FileText className={iconClass} />;
      case 'DELETE':
        return <AlertCircle className={iconClass} />;
      case 'COMPLETE':
        return <CheckCircle className={iconClass} />;
      default:
        return <Activity className={iconClass} />;
    }
  };

  const getActivityColor = (action: string) => {
    const colors = {
      'CREATE': 'text-green-600',
      'UPDATE': 'text-blue-600',
      'DELETE': 'text-red-600',
      'COMPLETE': 'text-green-600',
      'ASSIGN': 'text-purple-600'
    };
    return colors[action as keyof typeof colors] || 'text-gray-600';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getEntityLink = (entityType: string, entityId: string) => {
    switch (entityType) {
      case 'projects':
        return `/projects/${entityId}`;
      case 'tasks':
        return `/projects?task=${entityId}`;
      case 'scope_items':
        return `/scope?item=${entityId}`;
      default:
        return '#';
    }
  };

  const formatActionText = (activity: ActivityItem) => {
    const { action, entity_type, entity_name, user_name } = activity;
    
    const actionTexts = {
      'CREATE': 'created',
      'UPDATE': 'updated',
      'DELETE': 'deleted',
      'COMPLETE': 'completed',
      'ASSIGN': 'assigned'
    };

    const entityTexts = {
      'projects': 'project',
      'tasks': 'task',
      'scope_items': 'scope item',
      'documents': 'document',
      'user_profiles': 'user profile'
    };

    const actionText = actionTexts[action as keyof typeof actionTexts] || action.toLowerCase();
    const entityText = entityTexts[entity_type as keyof typeof entityTexts] || entity_type;

    return `${actionText} ${entityText}`;
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Activity className="h-8 w-8 mb-2" />
            <p>No recent activity</p>
            <p className="text-sm">Activity will appear here as your team works</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Activity</CardTitle>
        <Link
          href="/reports"
          className="text-sm text-blue-600 hover:text-blue-500"
        >
          View all →
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.slice(0, 10).map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              {/* User Avatar */}
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {getUserInitials(activity.user_name)}
                </AvatarFallback>
              </Avatar>

              {/* Activity Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`${getActivityColor(activity.action)}`}>
                    {getActivityIcon(activity.action, activity.entity_type)}
                  </div>
                  <span className="text-sm text-gray-900 font-medium">
                    {activity.user_name}
                  </span>
                  <span className="text-sm text-gray-600">
                    {formatActionText(activity)}
                  </span>
                </div>

                {/* Entity Link */}
                <Link
                  href={getEntityLink(activity.entity_type, activity.entity_id)}
                  className="text-sm text-blue-600 hover:text-blue-500 block truncate"
                >
                  {activity.entity_name}
                </Link>

                {/* Timestamp */}
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {formatTimeAgo(activity.created_at)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}