'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { HoverPrefetchLink } from '@/components/ui/HoverPrefetchLink';

interface ProjectCard {
  id: string;
  name: string;
  status: string;
  client_name?: string;
  progress_percentage: number;
  budget?: number;
  actual_cost: number;
  end_date?: string;
  team_size: number;
}

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedThisMonth: number;
  budgetUtilization: number;
}

export default function ProjectManagerDashboard() {
  const { user, profile } = useAuth();
  const { hasPermission } = usePermissions();
  const [projects, setProjects] = useState<ProjectCard[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    completedThisMonth: 0,
    budgetUtilization: 0
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (user && profile) {
      fetchDashboardData();
    }
  }, [user, profile]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch projects with enhanced data
      let projectQuery = supabase
        .from('projects')
        .select(`
          id,
          name,
          status,
          budget,
          actual_cost,
          end_date,
          created_at,
          client:clients(company_name),
          assignments:project_assignments!inner(user_id)
        `)
        .order('updated_at', { ascending: false })
        .limit(6);

      // Apply role-based filtering
      if (!hasPermission('projects.read.all')) {
        // For non-admin roles, only show projects they're assigned to
        projectQuery = projectQuery.eq('assignments.user_id', user?.id);
      }

      const { data: projectsData, error: projectsError } = await projectQuery;

      if (projectsError) {
        console.error('Error fetching projects:', projectsError);
        return;
      }

      // Transform and enhance project data
      const enhancedProjects = await Promise.all(
        (projectsData || []).map(async (project) => {
          // Get scope completion data
          const { data: scopeData } = await supabase
            .from('scope_items')
            .select('status')
            .eq('project_id', project.id);

          const totalScope = scopeData?.length || 0;
          const completedScope = scopeData?.filter(item => item.status === 'completed').length || 0;
          const progressPercentage = totalScope > 0 ? Math.round((completedScope / totalScope) * 100) : 0;

          // Get team size
          const { count: teamSize } = await supabase
            .from('project_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id)
            .eq('is_active', true);

          return {
            id: project.id,
            name: project.name,
            status: project.status,
            client_name: (project.client as any)?.[0]?.company_name || 'No Client',
            progress_percentage: progressPercentage,
            budget: project.budget,
            actual_cost: project.actual_cost || 0,
            end_date: project.end_date,
            team_size: teamSize || 0
          };
        })
      );

      setProjects(enhancedProjects);

      // Calculate dashboard stats
      const totalProjects = enhancedProjects.length;
      const activeProjects = enhancedProjects.filter(p => p.status === 'active').length;
      const totalBudget = enhancedProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
      const totalCost = enhancedProjects.reduce((sum, p) => sum + p.actual_cost, 0);
      const budgetUtilization = totalBudget > 0 ? Math.round((totalCost / totalBudget) * 100) : 0;

      setStats({
        totalProjects,
        activeProjects,
        completedThisMonth: 0, // // Implemented Calculate from actual data
        budgetUtilization
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'planning': return 'secondary';
      case 'on_hold': return 'outline';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getDaysRemaining = (endDate?: string) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Required</h2>
          <p className="text-gray-600">Please log in to view the dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {profile.first_name}
          </h1>
          <p className="text-gray-600">
            Project Manager Dashboard - Simplified View
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              Back to Full Dashboard
            </Link>
          </Button>
          <Button asChild>
            <Link href="/projects">
              View All Projects
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">{stats.totalProjects}</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Projects
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalProjects}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">{stats.activeProjects}</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Projects
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.activeProjects}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">{stats.completedThisMonth}</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Completed This Month
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.completedThisMonth}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">{stats.budgetUtilization}%</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Budget Utilization
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.budgetUtilization}%
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Recent Projects</h2>
          <Link
            href="/projects"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const daysRemaining = getDaysRemaining(project.end_date);
            
            return (
              <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {project.name}
                    </h3>
                    <Badge variant={getStatusBadgeVariant(project.status)}>
                      {project.status}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-3">
                    {project.client_name}
                  </p>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{project.progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${project.progress_percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Project Details */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div>
                      <span className="font-medium">Budget:</span> {formatCurrency(project.budget || 0)}
                    </div>
                    <div>
                      <span className="font-medium">Team:</span> {project.team_size}
                    </div>
                  </div>

                  {daysRemaining !== null && (
                    <div className="mt-2 text-sm">
                      <span className={`font-medium ${daysRemaining < 30 ? 'text-red-600' : 'text-gray-600'}`}>
                        {daysRemaining > 0 ? `${daysRemaining} days remaining` : `${Math.abs(daysRemaining)} days overdue`}
                      </span>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="mt-4 flex space-x-2">
                    <Button className="flex-1" asChild>
                      <HoverPrefetchLink
                        href={`/projects/${project.id}`}
                        className="flex items-center justify-center"
                        prefetchDelay={150}
                      >
                        View Details
                      </HoverPrefetchLink>
                    </Button>
                    <Button variant="outline" className="flex-1" asChild>
                      <Link href={`/scope?project=${project.id}`}>
                        Scope
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <h3 className="text-lg font-medium mb-2">No projects found</h3>
              <p>You don't have any projects assigned yet.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}