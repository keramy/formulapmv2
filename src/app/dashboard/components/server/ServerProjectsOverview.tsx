/**
 * Server Projects Overview Component
 * 
 * Fetches project data on the server for immediate rendering
 * Shows recent projects with progress and status information
 */

import Link from 'next/link';
import { createServerClient } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, DollarSign, MapPin } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  status: string;
  progress_percentage: number;
  budget: number;
  actual_cost: number;
  start_date: string;
  end_date: string;
  location: string;
  project_type: string;
}

async function getRecentProjects(userId: string, role: string): Promise<Project[]> {
  const supabase = createServerClient();
  
  try {
    let query = supabase
      .from('projects')
      .select(`
        id,
        name,
        status,
        progress_percentage,
        budget,
        actual_cost,
        start_date,
        end_date,
        location,
        project_type
      `)
      .order('updated_at', { ascending: false })
      .limit(8);

    // Filter based on user role and permissions
    if (role !== 'management' && role !== 'admin') {
      // For non-admin users, only show projects they're assigned to
      query = query.in('status', ['active', 'planning', 'bidding']);
    }

    const { data: projects, error } = await query;

    if (error) {
      console.error('❌ [ServerProjectsOverview] Error fetching projects:', error);
      return [];
    }

    return projects || [];
  } catch (error) {
    console.error('❌ [ServerProjectsOverview] Unexpected error:', error);
    return [];
  }
}

interface ServerProjectsOverviewProps {
  userId: string;
  role: string;
}

export async function ServerProjectsOverview({ userId, role }: ServerProjectsOverviewProps) {
  const projects = await getRecentProjects(userId, role);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'active' as const;
      case 'planning': return 'planning' as const;
      case 'bidding': return 'bidding' as const;
      case 'completed': return 'completed' as const;
      case 'on_hold': return 'on-hold' as const;
      case 'cancelled': return 'cancelled' as const;
      default: return 'secondary' as const;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <p>No projects found</p>
            <p className="text-sm">Create your first project to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Projects</CardTitle>
        <Link
          href="/projects"
          className="text-sm text-blue-600 hover:text-blue-500"
        >
          View all →
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      {project.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{project.location}</span>
                        </div>
                      )}
                      {project.end_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Due {formatDate(project.end_date)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant={getStatusBadgeVariant(project.status)}>
                    {project.status.replace('_', ' ')}
                  </Badge>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{project.progress_percentage}%</span>
                  </div>
                  <Progress value={project.progress_percentage} className="h-2" />
                </div>

                {/* Budget Information */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <DollarSign className="h-3 w-3" />
                    <span>Budget</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-medium">
                      {formatCurrency(project.actual_cost || 0)}
                    </span>
                    <span className="text-gray-500">
                      / {formatCurrency(project.budget)}
                    </span>
                  </div>
                </div>

                {/* Budget utilization indicator */}
                {project.budget > 0 && (
                  <div className="mt-2">
                    <Progress 
                      value={(project.actual_cost || 0) / project.budget * 100} 
                      className="h-1"
                    />
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}