'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/lib/supabase';
import { ScopeItem } from '@/types/database';
import { CheckSquare, Clock, AlertTriangle, User, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface TaskSummaryData extends ScopeItem {
  project_name?: string;
  assigned_user_names?: string[];
}

export function TaskSummary() {
  const { user } = useAuth();
  const { hasPermission, canAccess, isManagement, isProject, isField } = usePermissions();
  const [tasks, setTasks] = useState<TaskSummaryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTasks() {
      if (!user) return;

      try {
        setLoading(true);

        let query = supabase
          .from('scope_items')
          .select(`
            *,
            projects!inner(name)
          `)
          .order('updated_at', { ascending: false })
          .limit(5);

        // Apply role-based filtering for tasks
        if (!canAccess(['admin', 'project_manager', 'general_manager', 'company_owner'])) {
          // For non-management roles, show only assigned tasks
          query = query.contains('assigned_to', [user.id]);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching tasks:', error);
          return;
        }

        // Transform data to include project names
        const transformedTasks: TaskSummaryData[] = (data || []).map(item => ({
          ...item,
          project_name: (item.projects as any)?.name || 'Unknown Project'
        }));

        setTasks(transformedTasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, [user, canAccess]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'outline';
      case 'in_progress':
        return 'default';
      case 'review':
        return 'secondary';
      case 'completed':
        return 'secondary';
      case 'blocked':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'text-red-600';
    if (priority >= 5) return 'text-orange-600';
    return 'text-gray-600';
  };

  const isOverdue = (endDate?: string) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
              <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">
          {isManagement() ? 'Recent Tasks' : 'My Tasks'}
        </CardTitle>
        <div className="flex items-center space-x-2">
          {hasPermission('tasks.create') && (
            <Button size="sm" asChild>
              <Link href="/tasks/new">
                <Plus className="h-4 w-4 mr-1" />
                New Task
              </Link>
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href="/tasks">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <CheckSquare className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">No Tasks</h3>
            <p className="text-sm text-gray-500">
              {hasPermission('tasks.create') 
                ? "Get started by creating your first task." 
                : "No tasks assigned to you yet."
              }
            </p>
            {hasPermission('tasks.create') && (
              <Button className="mt-4" size="sm" asChild>
                <Link href="/tasks/new">
                  <Plus className="h-4 w-4 mr-1" />
                  Create Task
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {/* Task Icon */}
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <CheckSquare className="h-5 w-5 text-blue-600" />
                </div>

                {/* Task Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {task.description}
                    </h3>
                    <Badge variant={getStatusVariant(task.status)} className="text-xs">
                      {task.status.replace('_', ' ')}
                    </Badge>
                    {isOverdue(task.timeline_end) && task.status !== 'completed' && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      {task.project_name}
                    </div>
                    {task.timeline_end && (
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Due {new Date(task.timeline_end).toLocaleDateString()}
                      </div>
                    )}
                    <div className={`flex items-center font-medium ${getPriorityColor(task.priority)}`}>
                      Priority: {task.priority}/10
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${task.progress_percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {task.progress_percentage}% complete
                    </div>
                  </div>
                </div>

                {/* Task Actions */}
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/scope/${task.id}`}>
                      View
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}