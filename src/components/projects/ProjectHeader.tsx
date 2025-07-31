'use client';

import { useProjectDirect } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DataStateWrapper } from '@/components/ui/loading-states';
import { 
  ArrowLeft, 
  Edit, 
  Calendar, 
  MapPin, 
  DollarSign,
  Users,
  Clock,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

interface ProjectHeaderProps {
  projectId: string;
}

export function ProjectHeader({ projectId }: ProjectHeaderProps) {
  const { user } = useAuth();
  const { data: project, loading, error, refetch } = useProjectDirect(projectId);
  const accessLevel = 'full'; // // Implemented Implement access level logic
  
  console.log('🏗️ [ProjectHeader] Component state:', {
    projectId,
    hasUser: !!user,
    hasProject: !!project,
    loading,
    error,
    projectName: project?.name
  });

  // Map project status to semantic Badge variants
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'active' as const;
      case 'completed': return 'completed' as const;
      case 'on_hold': return 'on-hold' as const;
      case 'cancelled': return 'cancelled' as const;
      case 'planning': return 'planning' as const;
      default: return 'planning' as const;
    }
  };

  // Map priority to semantic Badge variants
  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'high': return 'priority-high' as const;
      case 'medium': return 'priority-medium' as const;
      case 'low': return 'priority-low' as const;
      case 'urgent': return 'priority-urgent' as const;
      default: return 'priority-medium' as const;
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
            <p className="text-gray-600">Please log in to view project details.</p>
          </div>
        </CardContent>
      </Card>
    );
  }



  return (
    <DataStateWrapper
      loading={loading}
      error={error}
      data={project}
      onRetry={refetch}
      emptyComponent={
        <Card>
          <CardContent className="text-center py-8">
            <h1 className="text-2xl font-bold text-gray-900">Project Not Found</h1>
            <p className="text-gray-600">The requested project could not be found or you don't have access to it.</p>
            <div className="mt-4 space-x-2">
              <Button onClick={refetch} variant="outline">
                Try Again
              </Button>
              <Button asChild>
                <Link href="/projects">Back to Projects</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      }
    >
      {project && (
        <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/projects">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Projects
                </Link>
              </Button>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <Badge variant={getStatusBadgeVariant(project.status)}>
                  {project.status.replace('_', ' ')}
                </Badge>
                <Badge variant={getPriorityBadgeVariant(String(project.priority))}>
                  {project.priority}
                </Badge>
              </div>
              <CardDescription>{project.description}</CardDescription>
            </div>
          </div>
          {(accessLevel === 'full' || accessLevel === 'limited') && (
            <Button asChild>
              <Link href={`/projects/${project.id}/edit`}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Project
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {project.location && (
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm">{project.location}</span>
            </div>
          )}
          {project.start_date && (
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm">Started {new Date(project.start_date).toLocaleDateString()}</span>
            </div>
          )}
          {project.end_date && (
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm">Due {new Date(project.end_date).toLocaleDateString()}</span>
            </div>
          )}
          {project.budget && (
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <span className="text-sm">${project.budget.toLocaleString()}</span>
            </div>
          )}
        </div>
        
        {/* Progress Bar */}
        {project.progress_percentage !== undefined && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm text-gray-600">{project.progress_percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-status-info h-3 rounded-full transition-all duration-300"
                style={{ width: `${project.progress_percentage}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
      </Card>
      )}
    </DataStateWrapper>
  );
}