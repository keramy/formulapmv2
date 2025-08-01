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
  AlertTriangle,
  BarChart3
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
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getStatusBadgeVariant(project.status)} className="px-3 py-1 text-sm font-medium">
                      {project.status.replace('_', ' ')}
                    </Badge>
                    <Badge variant={getPriorityBadgeVariant(String(project.priority))} className="px-3 py-1 text-sm font-medium">
                      {project.priority} priority
                    </Badge>
                  </div>
                </div>
                {project.description && (
                  <CardDescription className="text-base text-gray-600 max-w-3xl">
                    {project.description}
                  </CardDescription>
                )}
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
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border">
              <MapPin className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Location</div>
                <div className="text-sm font-medium text-gray-900">{project.location}</div>
              </div>
            </div>
          )}
          {project.start_date && (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border">
              <Calendar className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Started</div>
                <div className="text-sm font-medium text-gray-900">{new Date(project.start_date).toLocaleDateString()}</div>
              </div>
            </div>
          )}
          {project.end_date && (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border">
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Due Date</div>
                <div className="text-sm font-medium text-gray-900">{new Date(project.end_date).toLocaleDateString()}</div>
              </div>
            </div>
          )}
          {project.budget && (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border">
              <DollarSign className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Budget</div>
                <div className="text-sm font-medium text-gray-900">${project.budget.toLocaleString()}</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Enhanced Progress Bar */}
        {project.progress_percentage !== undefined && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-semibold text-gray-700">Project Progress</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-gray-900">{project.progress_percentage}%</span>
                <span className="text-sm text-gray-500">complete</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
              <div 
                className={`h-4 rounded-full transition-all duration-500 ${
                  project.progress_percentage < 25 ? 'bg-gradient-to-r from-red-400 to-red-500' :
                  project.progress_percentage < 50 ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                  project.progress_percentage < 75 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                  project.progress_percentage < 100 ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                  'bg-gradient-to-r from-green-400 to-green-500'
                }`}
                style={{ width: `${project.progress_percentage}%` }}
              />
            </div>
            {project.progress_percentage === 0 && (
              <div className="text-xs text-gray-500 mt-2 text-center">Project ready to begin</div>
            )}
          </div>
        )}
      </CardContent>
      </Card>
      )}
    </DataStateWrapper>
  );
}