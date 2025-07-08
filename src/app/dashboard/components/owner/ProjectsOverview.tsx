'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
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

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          status,
          project_manager_id,
          start_date,
          end_date,
          budget,
          actual_cost,
          project_manager:user_profiles!projects_project_manager_id_fkey(
            first_name,
            last_name
          )
        `)
        .in('status', ['active', 'planning', 'bidding'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Calculate progress for each project
      const projectsWithProgress = data?.map(project => {
        let progress = 0;
        
        // Simple progress calculation based on date range
        if (project.start_date && project.end_date) {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'planning':
        return 'bg-blue-500';
      case 'bidding':
        return 'bg-yellow-500';
      case 'on_hold':
        return 'bg-orange-500';
      case 'completed':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
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
                    <Badge className={`${getStatusColor(project.status)} text-white`}>
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