'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/lib/supabase';
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
  const { user } = useAuth();
  const { canAccess } = usePermissions();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecentActivity() {
      if (!user) return;

      try {
        setLoading(true);
        const activities: ActivityItem[] = [];

        // Fetch recent projects (limited based on access)
        let projectQuery = supabase
          .from('projects')
          .select('id, name, status, updated_at')
          .order('updated_at', { ascending: false })
          .limit(3);

        if (!canAccess(['admin', 'project_manager', 'general_manager', 'company_owner'])) {
          // For non-management, only show projects they're assigned to
          const { data: memberProjects } = await supabase
            .from('project_members')
            .select('project_id')
            .eq('user_id', user.id);
          
          const projectIds = memberProjects?.map(pm => pm.project_id) || [];
          if (projectIds.length > 0) {
            projectQuery = projectQuery.in('id', projectIds);
          } else {
            projectQuery = projectQuery.eq('id', 'none'); // No projects
          }
        }

        const { data: projects } = await projectQuery;

        // Add project activities
        projects?.forEach(project => {
          activities.push({
            id: `project-${project.id}`,
            type: 'project',
            title: `Project updated: ${project.name}`,
            description: `Status: ${project.status}`,
            timestamp: project.updated_at,
            status: project.status
          });
        });

        // Fetch recent scope items (tasks)
        let scopeQuery = supabase
          .from('scope_items')
          .select(`
            id, description, status, updated_at,
            projects!inner(name)
          `)
          .order('updated_at', { ascending: false })
          .limit(3);

        if (!canAccess(['admin', 'project_manager', 'general_manager', 'company_owner'])) {
          scopeQuery = scopeQuery.contains('assigned_to', [user.id]);
        }

        const { data: scopeItems } = await scopeQuery;

        // Add scope item activities
        scopeItems?.forEach(item => {
          activities.push({
            id: `scope-${item.id}`,
            type: 'scope_item',
            title: `Task updated: ${item.description.substring(0, 50)}...`,
            description: `Project: ${(item.projects as any)?.name || 'Unknown'}`,
            timestamp: item.updated_at,
            status: item.status
          });
        });

        // Fetch recent documents
        let documentQuery = supabase
          .from('documents')
          .select(`
            id, title, status, updated_at,
            projects!inner(name)
          `)
          .order('updated_at', { ascending: false })
          .limit(3);

        const { data: documents } = await documentQuery;

        // Add document activities
        documents?.forEach(doc => {
          activities.push({
            id: `doc-${doc.id}`,
            type: 'document',
            title: `Document updated: ${doc.title}`,
            description: `Project: ${(doc.projects as any)?.name || 'Unknown'}`,
            timestamp: doc.updated_at,
            status: doc.status
          });
        });

        // Sort all activities by timestamp and take the 5 most recent
        const sortedActivities = activities
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 5);

        setActivities(sortedActivities);
      } catch (error) {
        console.error('Error fetching recent activity:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRecentActivity();
  }, [user, canAccess]);

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