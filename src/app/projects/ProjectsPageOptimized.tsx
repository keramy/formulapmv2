/**
 * Optimized Projects Page
 * 
 * Performance optimizations applied:
 * - Component code splitting with dynamic imports
 * - Lazy loading with Suspense boundaries
 * - Optimized icon imports for better tree-shaking
 * - Separated table, edit dialog, and delete dialog into smaller components
 */

'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { HoverPrefetchLink } from '@/components/ui/HoverPrefetchLink';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useProjects } from '@/hooks/useProjects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
// Optimized icon imports for better tree-shaking
import Plus from 'lucide-react/dist/esm/icons/plus';
import Search from 'lucide-react/dist/esm/icons/search';
import Filter from 'lucide-react/dist/esm/icons/filter';
import Calendar from 'lucide-react/dist/esm/icons/calendar';

// Lazy load components for better performance
const ProjectsTable = dynamic(() => 
  import('@/components/projects/ProjectsTable').then(mod => ({ default: mod.ProjectsTable })),
  {
    loading: () => (
      <Card>
        <CardContent className="p-0">
          <div className="h-96 animate-pulse bg-gray-100 rounded-lg" />
        </CardContent>
      </Card>
    ),
    ssr: false
  }
);

const EditProjectDialog = dynamic(() => 
  import('@/components/projects/EditProjectDialog').then(mod => ({ default: mod.EditProjectDialog })),
  {
    loading: () => null,
    ssr: false
  }
);

const DeleteProjectDialog = dynamic(() => 
  import('@/components/projects/DeleteProjectDialog').then(mod => ({ default: mod.DeleteProjectDialog })),
  {
    loading: () => null,
    ssr: false
  }
);

interface Project {
  id: string;
  name: string;
  code?: string;
  description?: string;
  status: string;
  project_type?: string;
  budget_amount?: number;
  start_date?: string;
  end_date?: string;
  progress_percentage?: number;
  location?: string;
}

export default function ProjectsPageOptimized() {
  const { user, profile, authState, isAuthenticated, loading: authLoading } = useAuth();
  const { hasPermission } = usePermissions();
  const { projects, loading: projectsLoading, error, fetchProjects, refreshProjects } = useProjects();
  
  // Combined loading state to prevent flickering
  const isInitialLoading = authLoading || (isAuthenticated && !profile) || (!projects.length && projectsLoading && !error);

  // Debug authentication state (reduced frequency)
  useEffect(() => {
    if (profile) {
      console.log('🔗 [ProjectsPageOptimized] Auth Ready:', {
        userEmail: user?.email,
        profileRole: profile?.role,
        authState,
        hasDeletePermission: hasPermission('projects.delete'),
        hasCreatePermission: hasPermission('projects.create'),
        hasUpdatePermission: hasPermission('projects.update')
      });
    }
  }, [profile?.role]); // Only log when role changes, not on every render

  // Load projects once profile is ready
  useEffect(() => {
    if (profile) {
      console.log('📋 [ProjectsPageOptimized] Loading projects for profile:', profile.role);
      fetchProjects();
    }
  }, [profile, fetchProjects]); // Load projects when profile is available

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Memoize filtered projects to prevent unnecessary re-calculations
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchTerm, filterStatus]);

  // Handle edit project
  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setEditDialogOpen(true);
  };

  // Handle delete project
  const handleDeleteProject = (project: Project) => {
    setSelectedProject(project);
    setDeleteDialogOpen(true);
  };

  // Handle project updated
  const handleProjectUpdated = () => {
    refreshProjects();
  };

  // Handle project deleted
  const handleProjectDeleted = () => {
    refreshProjects();
  };

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600">Please log in to view projects.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">Manage and track all your construction projects</p>
        </div>
        {hasPermission('projects.create') && (
          <Button asChild>
            <HoverPrefetchLink 
              href="/projects/new"
              delay={100}
              priority={true}
              prefetchData={['/api/clients', '/api/users']}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </HoverPrefetchLink>
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            More Filters
          </Button>
        </div>
      </div>

      {/* Projects List */}
      {isInitialLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-red-500 mb-4">
              <h3 className="text-lg font-semibold">Error Loading Projects</h3>
              <p className="text-sm">{error}</p>
            </div>
            <Button onClick={() => refreshProjects()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || filterStatus !== 'all' 
                ? 'No projects found' 
                : projects.length === 0 
                  ? 'No projects yet' 
                  : 'No projects match your filters'
              }
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : projects.length === 0
                  ? 'Get started by creating your first project.'
                  : 'Try different filters to see more projects.'
              }
            </p>
            {hasPermission('projects.create') && projects.length === 0 && !searchTerm && filterStatus === 'all' && (
              <Button asChild>
                <HoverPrefetchLink 
                  href="/projects/new"
                  delay={50}
                  priority={true}
                  prefetchData={['/api/clients', '/api/users']}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </HoverPrefetchLink>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Projects Table with Suspense */
        <Suspense fallback={
          <Card>
            <CardContent className="p-0">
              <div className="h-96 animate-pulse bg-gray-100 rounded-lg" />
            </CardContent>
          </Card>
        }>
          <ProjectsTable 
            projects={filteredProjects}
            loading={projectsLoading}
            onEditProject={handleEditProject}
            onDeleteProject={handleDeleteProject}
          />
        </Suspense>
      )}

      {/* Edit Project Dialog with Suspense */}
      <Suspense fallback={null}>
        <EditProjectDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          project={selectedProject}
          onProjectUpdated={handleProjectUpdated}
          onDeleteProject={handleDeleteProject}
        />
      </Suspense>

      {/* Delete Confirmation Dialog with Suspense */}
      <Suspense fallback={null}>
        <DeleteProjectDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          project={selectedProject}
          onProjectDeleted={handleProjectDeleted}
        />
      </Suspense>
    </div>
  );
}