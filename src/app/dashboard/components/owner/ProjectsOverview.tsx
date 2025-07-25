'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { 
  Calendar,
  User,
  ArrowRight
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  status: string;
  project_manager_id: string;
  start_date: string;
  end_date: string;
  budget: number;
  actual_cost: number;
  progress_percentage?: number;
  project_manager?: {
    first_name: string;
    last_name: string;
  } | null;
}

export function ProjectsOverview() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { getAccessToken, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated]);

  const fetchProjects = async () => {
    try {
      // Get access token for authenticated API call
      const token = await getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      // Fetch projects from authenticated API endpoint
      const response = await fetch('/api/projects?status=active,planning,bidding&limit=10&include_details=true', {
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
          if (errorData.details) {
            console.error('📊 [ProjectsOverview] API Error Details:', errorData.details);
          }
        } catch (parseError) {
          console.error('📊 [ProjectsOverview] Failed to parse error response:', parseError);
        }
        console.error('📊 [ProjectsOverview] API Request Failed:', {
          url: '/api/projects?status=active,planning,bidding&limit=10&include_details=true',
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });
        throw new Error(errorMessage);
      }

      const apiResponse = await response.json();
      
      if (!apiResponse.success) {
        console.error('📊 [ProjectsOverview] API Response Error:', apiResponse);
        throw new Error(apiResponse.error || 'Failed to fetch projects');
      }

      // Calculate progress for each project
      const projectsWithProgress = apiResponse.data.projects?.map((project: any) => {
        let progress = project.progress_percentage || 0;
        
        // If no progress from API, calculate based on date range
        if (!progress && project.start_date && project.end_date) {
          const start = new Date(project.start_date);
          const end = new Date(project.end_date);
          const today = new Date();
          
          if (today >= start && today <= end) {
            const totalDuration = end.getTime() - start.getTime();
            const elapsed = today.getTime() - start.getTime();
            progress = Math.round((elapsed / totalDuration) * 100);
          } else if (today > end) {
            progress = 100;
          }
        }

        return {
          ...project,
          progress_percentage: progress,
          project_manager: project.project_manager ? project.project_manager : null
        };
      }) || [];

      setProjects(projectsWithProgress as Project[]);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'active' as const;
      case 'planning': return 'planning' as const;
      case 'bidding': return 'bidding' as const;
      case 'on_hold': return 'on-hold' as const;
      case 'completed': return 'completed' as const;
      default: return 'secondary' as const;
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateBudgetHealth = (budget: number, actual: number) => {
    if (!budget) return 'unknown';
    const percentage = (actual / budget) * 100;
    if (percentage > 90) return 'danger';
    if (percentage > 70) return 'warning';
    return 'healthy';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Projects Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Projects Overview</CardTitle>
        <Link 
          href="/projects" 
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          View all projects
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No active projects found</p>
          ) : (
            projects.map((project) => {
              const budgetHealth = calculateBudgetHealth(project.budget, project.actual_cost);
              
              return (
                <div
                  key={project.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{project.name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        {project.project_manager && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>
                              {project.project_manager.first_name} {project.project_manager.last_name}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(project.start_date)} - {formatDate(project.end_date)}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant={getStatusBadgeVariant(project.status)}>
                      {getStatusLabel(project.status)}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{project.progress_percentage}%</span>
                    </div>
                    <Progress value={project.progress_percentage} className="h-2" />
                    
                    <div className="flex justify-between text-sm pt-1">
                      <span className="text-gray-600">Budget Status</span>
                      <span className={`font-medium ${
                        budgetHealth === 'danger' ? 'text-red-600' :
                        budgetHealth === 'warning' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        ${project.actual_cost?.toLocaleString()} / ${project.budget?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}