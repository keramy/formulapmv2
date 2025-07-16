'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataStateWrapper } from '@/components/ui/loading-states';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { ScopeItem } from '@/types/database';
import { CheckSquare, Clock, AlertTriangle, User, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface TaskSummaryData extends ScopeItem {
  project_name?: string;
  assigned_user_names?: string[];
}

export function TaskSummary() {
  const { getAccessToken, isAuthenticated } = useAuth();
  const { hasPermission, isManagement } = usePermissions();
  const [tasks, setTasks] = useState<TaskSummaryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
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

      // Fetch tasks from authenticated API endpoint
      const response = await fetch('/api/dashboard/tasks?limit=5', {
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
          console.error('📋 [TaskSummary] API Error Details:', errorData);
        } catch (parseError) {
          console.error('📋 [TaskSummary] Failed to parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const tasksData = await response.json();
      setTasks(tasksData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tasks';
      setError(errorMessage);
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [isAuthenticated, getAccessToken]);

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

  return (
    <DataStateWrapper
      loading={loading}
      error={error}
      data={tasks}
      onRetry={fetchTasks}
      emptyComponent={
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
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <CheckSquare className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">No Tasks</h3>
              <p className="text-sm text-gray-500">
                {hasPermission('tasks.create')
                  ? "Create your first task to get started."
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
          </CardContent>
        </Card>
      }
      loadingComponent={
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
      }
    >
      <Card>
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
        </div>
      </CardContent>
    </Card>
    </DataStateWrapper>
  );
}

/**
 * Enhanced TaskSummary using DataStateWrapper pattern (claude.md aligned)
 * Following the proven UI component optimization pattern from claude.md
 */
export function TaskSummaryEnhanced() {
  const { getAccessToken, isAuthenticated } = useAuth();
  const { hasPermission, isManagement } = usePermissions();
  const [tasks, setTasks] = useState<TaskSummaryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
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

      const response = await fetch('/api/dashboard/tasks', {
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

      const tasksData = await response.json();
      setTasks(tasksData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tasks';
      setError(errorMessage);
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [isAuthenticated]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  return (
    <DataStateWrapper
      loading={loading}
      error={error}
      data={tasks}
      onRetry={fetchTasks}
      emptyComponent={
        <Card>
          <CardHeader>
            <CardTitle>Task Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-muted-foreground">No tasks assigned</div>
              <p className="text-sm text-muted-foreground mt-2">
                Tasks will appear here when they are assigned to you.
              </p>
            </div>
          </CardContent>
        </Card>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Task Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{task.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{task.project_name}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge className={getStatusColor(task.status)}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                    {task.priority && (
                      <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        Priority: {task.priority}
                      </span>
                    )}
                    {isOverdue(task.end_date) && (
                      <Badge variant="destructive" className="text-xs">
                        Overdue
                      </Badge>
                    )}
                  </div>
                </div>
                {task.end_date && (
                  <div className="text-xs text-gray-500 ml-4">
                    Due: {new Date(task.end_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DataStateWrapper>
  );
}