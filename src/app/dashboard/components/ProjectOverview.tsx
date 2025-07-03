'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/lib/supabase';
import { Project } from '@/types/database';
import { Calendar, MapPin, User, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function ProjectOverview() {
  const { user } = useAuth();
  const { hasPermission, canAccess } = usePermissions();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      if (!user) return;

      try {
        setLoading(true);

        let query = supabase
          .from('projects')
          .select('*')
          .eq('is_active', true)
          .order('updated_at', { ascending: false })
          .limit(6);

        // Apply role-based filtering
        if (!canAccess(['admin', 'project_manager'])) {
          // For non-admin/PM roles, only show projects they're members of
          const { data: memberProjects } = await supabase
            .from('project_assignments')
            .select('project_id')
            .eq('user_id', user.id);
          
          const projectIds = memberProjects?.map(pm => pm.project_id) || [];
          if (projectIds.length > 0) {
            query = query.in('id', projectIds);
          } else {
            setProjects([]);
            setLoading(false);
            return;
          }
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching projects:', error);
          return;
        }

        setProjects(data || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [user, canAccess]);

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
        {projects.length === 0 ? (
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
        ) : (
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
                    <Badge variant={getPriorityBadgeVariant(project.priority)} className="text-xs">
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
        )}
      </CardContent>
    </Card>
  );
}