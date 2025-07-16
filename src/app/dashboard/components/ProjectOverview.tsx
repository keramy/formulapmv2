'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataStateWrapper } from '@/components/ui/loading-states';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { Project } from '@/types/database';
import { Calendar, MapPin, User, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function ProjectOverview() {
  const { getAccessToken, isAuthenticated } = useAuth();
  const { hasPermission } = usePermissions();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
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

      // Fetch projects from authenticated API endpoint
      const response = await fetch('/api/projects?limit=6&sort_field=updated_at&sort_direction=desc', {
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
          console.error('📊 [ProjectOverview] API Error Details:', errorData);
        } catch (parseError) {
          console.error('📊 [ProjectOverview] Failed to parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const apiResponse = await response.json();

      if (!apiResponse.success) {
        throw new Error(apiResponse.error || 'Failed to fetch projects');
      }

      setProjects(apiResponse.data?.projects || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch projects';
      setError(errorMessage);
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [isAuthenticated, getAccessToken]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'on_hold':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <DataStateWrapper
      loading={loading}
      error={error}
      data={projects}
      onRetry={fetchProjects}
      emptyComponent={
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Recent Projects</CardTitle>
            <div className="flex items-center space-x-2">
              {hasPermission('projects.create') && (
                <Button size="sm" asChild>
                  <Link href="/projects/new">
                    <Plus className="h-4 w-4 mr-1" />
                    New Project
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">No Projects</h3>
              <p className="text-sm text-gray-500">
                {hasPermission('projects.create')
                  ? "Get started by creating your first project."
                  : "No projects assigned to you yet."
                }
              </p>
              {hasPermission('projects.create') && (
                <Button className="mt-4" size="sm" asChild>
                  <Link href="/projects/new">
                    <Plus className="h-4 w-4 mr-1" />
                    Create Project
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
        <CardTitle className="text-lg font-semibold">Recent Projects</CardTitle>
        <div className="flex items-center space-x-2">
          {hasPermission('projects.create') && (
            <Button size="sm" asChild>
              <Link href="/projects/new">
                <Plus className="h-4 w-4 mr-1" />
                New Project
              </Link>
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href="/projects">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.map((project) => (
              <div
                key={project.id}
                className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {/* Project Icon */}
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>

                {/* Project Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {project.name}
                    </h3>
                    <Badge variant={getStatusBadgeVariant(project.status)} className="text-xs">
                      {project.status.replace('_', ' ')}
                    </Badge>
                    <Badge variant={getPriorityBadgeVariant(String(project.priority))} className="text-xs">
                      {project.priority}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    {project.location && (
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {project.location}
                      </div>
                    )}
                    {project.start_date && (
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(project.start_date).toLocaleDateString()}
                      </div>
                    )}
                    {project.budget && (
                      <div className="flex items-center">
                        ${project.budget.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Project Actions */}
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/projects/${project.id}`}>
                      View
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
    </DataStateWrapper>
  );
}

/**
 * Enhanced ProjectOverview with DataStateWrapper integration
 * This provides consistent loading states and error handling for project overview
 */
export function ProjectOverviewEnhanced() {
  const { getAccessToken, isAuthenticated } = useAuth();
  const { hasPermission } = usePermissions();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
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

      const response = await fetch('/api/projects?limit=5&include_stats=true', {
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

      const apiResponse = await response.json();

      if (!apiResponse.success) {
        throw new Error(apiResponse.error || 'Failed to fetch projects');
      }

      setProjects(apiResponse.data?.projects || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch projects';
      setError(errorMessage);
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [isAuthenticated]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DataStateWrapper
      loading={loading}
      error={error}
      data={projects}
      onRetry={fetchProjects}
      emptyComponent={
        <Card>
          <CardHeader>
            <CardTitle>Project Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-muted-foreground">No projects found</div>
              <p className="text-sm text-muted-foreground mt-2">
                Create your first project to get started.
              </p>
            </div>
          </CardContent>
        </Card>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Project Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projects.map((project) => (
              <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold">{project.name}</h3>
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(project.status)}>
                    {project.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DataStateWrapper>
  );
}