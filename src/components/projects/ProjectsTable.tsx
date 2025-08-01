'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HoverPrefetchLink } from '@/components/ui/HoverPrefetchLink';
import { usePermissions } from '@/hooks/usePermissions';
// Optimized icon imports for better tree-shaking
import Eye from 'lucide-react/dist/esm/icons/eye';
import Edit from 'lucide-react/dist/esm/icons/edit';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';

interface Project {
  id: string;
  name: string;
  code?: string;
  status: string;
  project_type?: string;
  budget_amount?: number;
  start_date?: string;
  end_date?: string;
  progress_percentage?: number;
  location?: string;
}

interface ProjectsTableProps {
  projects: Project[];
  loading: boolean;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
}

const ProjectsTableSkeleton = () => (
  <Card>
    <CardContent className="p-0">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-1" />
                      <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2 mr-2 animate-pulse" />
                    <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
);

export function ProjectsTable({ projects, loading, onEditProject, onDeleteProject }: ProjectsTableProps) {
  const { hasPermission } = usePermissions();

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'active' as const;
      case 'completed': return 'completed' as const;
      case 'on_hold': return 'on-hold' as const;
      case 'cancelled': return 'cancelled' as const;
      default: return 'secondary' as const;
    }
  };

  // Memoize the table rows to prevent unnecessary re-renders
  const tableRows = useMemo(() => {
    return projects.map((project) => (
      <tr key={project.id} className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap">
          <HoverPrefetchLink
            href={`/projects/${project.id}`}
            className="flex items-center cursor-pointer"
            delay={200}
            prefetchData={[
              `/api/projects/${project.id}`,
              `/api/projects/${project.id}/stats`,
              `/api/projects/${project.id}/milestones`
            ]}
            prefetchOnVisible={true}
          >
            <div>
              <div className="text-sm font-medium text-gray-900">{project.name}</div>
              <div className="text-sm text-gray-500">{project.code || 'N/A'}</div>
            </div>
          </HoverPrefetchLink>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <Badge variant={getStatusBadgeVariant(project.status)}>
            {project.status.replace('_', ' ')}
          </Badge>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {project.project_type || 'Construction'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {project.budget_amount && hasPermission('financials.view') 
            ? `$${project.budget_amount.toLocaleString()}`
            : 'N/A'
          }
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'N/A'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'N/A'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {project.end_date ? (
            new Date(project.end_date) < new Date() ? (
              <span className="text-red-600 font-medium">Overdue</span>
            ) : (
              Math.ceil((new Date(project.end_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) + " days"
            )
          ) : 'N/A'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${project.progress_percentage || 0}%` }}
              />
            </div>
            <span className="text-sm text-gray-600 min-w-[3rem]">{project.progress_percentage || 0}%</span>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <HoverPrefetchLink
                href={`/projects/${project.id}`}
                className="flex items-center justify-center"
                delay={150}
                prefetchData={[
                  `/api/projects/${project.id}`,
                  `/api/projects/${project.id}/stats`
                ]}
                priority={true}
              >
                <Eye className="w-4 h-4" />
              </HoverPrefetchLink>
            </Button>
            {hasPermission('projects.update') && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  onEditProject(project);
                }}
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                console.log('🗑️ [Delete Button] Clicked', {
                  hasDeletePermission: hasPermission('projects.delete'),
                  projectId: project.id,
                  projectName: project.name
                });
                onDeleteProject(project);
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              title={`Delete project: ${project.name}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </td>
      </tr>
    ));
  }, [projects, hasPermission, onEditProject, onDeleteProject]);

  if (loading) {
    return <ProjectsTableSkeleton />;
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tableRows}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}