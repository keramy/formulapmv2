/**
 * Optimized Construction Project Management Dashboard
 * 
 * Performance optimizations applied:
 * - Component code splitting with dynamic imports
 * - Lazy loading with Suspense boundaries
 * - Optimized icon imports for better tree-shaking
 * - Separated concerns into smaller components
 */

'use client';

import { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import dynamic from 'next/dynamic';

// Lazy load components for better performance
const DashboardStatsCards = dynamic(() => 
  import('./components/DashboardStatsCards').then(mod => ({ default: mod.DashboardStatsCards })),
  {
    loading: () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse bg-gray-100 rounded-lg" />
        ))}
      </div>
    ),
    ssr: false
  }
);

const ProjectsTable = dynamic(() => 
  import('./components/ProjectsTable').then(mod => ({ default: mod.ProjectsTable })),
  {
    loading: () => (
      <div className="h-96 animate-pulse bg-gray-100 rounded-lg" />
    ),
    ssr: false
  }
);

interface DashboardStats {
  totalPortfolioValue: number;
  activeProjectValue: number;
  revenueGenerated: number;
  taskCompletion: number;
  overallProgress: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  onHoldProjects: number;
}

interface Project {
  id: string;
  name: string;
  status: string;
  project_type?: string;
  budget_amount: number;
  actual_cost: number;
  start_date: string;
  end_date?: string;
  progress_percentage: number;
  location?: string;
  project_manager?: {
    first_name: string;
    last_name: string;
  };
}

export function ConstructionDashboardOptimized() {
  const { getAccessToken, profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [sortField, setSortField] = useState<string>('updated_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Load dashboard stats function
  const loadDashboardStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const token = await getAccessToken();
      
      if (!token) {
        console.warn('No auth token available');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const statsResponse = await fetch('/api/dashboard/comprehensive-stats', { headers });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('📊 Dashboard stats API response:', statsData);
        
        const dashboardStats: DashboardStats = {
          totalPortfolioValue: statsData.data?.totalPortfolioValue || statsData.data?.budget || 0,
          activeProjectValue: statsData.data?.activeProjectValue || 0,
          revenueGenerated: statsData.data?.revenueGenerated || 0,
          taskCompletion: statsData.data?.taskCompletion || 0,
          overallProgress: statsData.data?.overallProgress || 0,
          totalProjects: statsData.data?.totalProjects || 0,
          activeProjects: statsData.data?.activeProjects || 0,
          completedProjects: 0,
          onHoldProjects: 0
        };
        
        setStats(dashboardStats);
      } else {
        console.error('❌ Dashboard stats API failed:', statsResponse.status, statsResponse.statusText);
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, [getAccessToken]);

  // Load all projects function
  const loadAllProjects = useCallback(async () => {
    try {
      setProjectsLoading(true);
      const token = await getAccessToken();
      
      if (!token) {
        console.warn('No auth token available');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const projectsResponse = await fetch(`/api/projects?limit=100`, { headers });
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        console.log('📋 Projects API response:', projectsData);
        
        if (projectsData.success && projectsData.data?.projects) {
          const projectList = projectsData.data.projects;
          setAllProjects(projectList);
          
          // Calculate accurate stats from all project data
          if (projectList.length > 0) {
            const totalPortfolio = projectList.reduce((sum: number, p: Project) => sum + (p.budget_amount || 0), 0);
            const activeValue = projectList
              .filter((p: Project) => p.status === 'active')
              .reduce((sum: number, p: Project) => sum + (p.budget_amount || 0), 0);
            const revenue = projectList.reduce((sum: number, p: Project) => sum + (p.actual_cost || 0), 0);
            const avgProgress = projectList.reduce((sum: number, p: Project) => sum + (p.progress_percentage || 0), 0) / projectList.length;
            
            setStats(prev => prev ? {
              ...prev,
              totalPortfolioValue: totalPortfolio,
              activeProjectValue: activeValue,
              revenueGenerated: revenue,
              overallProgress: Math.round(avgProgress),
              completedProjects: projectList.filter((p: Project) => p.status === 'completed').length,
              onHoldProjects: projectList.filter((p: Project) => p.status === 'on_hold').length
            } : null);
          }
        }
      } else {
        console.error('❌ Projects API failed:', projectsResponse.status, projectsResponse.statusText);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setProjectsLoading(false);
    }
  }, [getAccessToken]);

  // Load initial data function
  const loadInitialData = useCallback(async () => {
    console.log('🔄 [Dashboard] Loading initial data');
    await Promise.all([
      loadDashboardStats(),
      loadAllProjects()
    ]);
  }, [loadDashboardStats, loadAllProjects]);

  // Load initial data once
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Auto-refresh data periodically and on page visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 [Dashboard] Page became visible - refreshing data');
        loadInitialData();
      }
    };

    const refreshInterval = setInterval(() => {
      if (!document.hidden) {
        console.log('🔄 [Dashboard] Periodic refresh');
        loadInitialData();
      }
    }, 30000); // 30 seconds

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(refreshInterval);
    };
  }, [loadInitialData]);

  // Sort projects client-side when sort changes
  useEffect(() => {
    if (allProjects.length > 0) {
      sortProjectsClientSide();
    }
  }, [sortField, sortDirection, allProjects]);

  // Memoized client-side sorting function
  const sortProjectsClientSide = useCallback(() => {
    const sorted = [...allProjects].sort((a, b) => {
      let aValue: any = a[sortField as keyof Project];
      let bValue: any = b[sortField as keyof Project];
      
      if (sortField === 'budget_amount' || sortField === 'actual_cost' || sortField === 'progress_percentage') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      } else if (sortField === 'start_date' || sortField === 'end_date') {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue || '').toLowerCase();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    setProjects(sorted);
  }, [allProjects, sortField, sortDirection]);

  const handleSort = useCallback((field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  // Show loading only if both stats and projects are loading
  if (statsLoading && projectsLoading) {
    return (
      <div className="space-y-6">
        {/* Loading Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse bg-gray-100 rounded-lg" />
          ))}
        </div>
        {/* Loading Table */}
        <div className="h-96 animate-pulse bg-gray-100 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {profile?.first_name}
          </h1>
          <p className="text-gray-600">
            Project Control Center • Formula PM Dashboard
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <Badge variant="outline" className="text-green-700 border-green-300">
            System Online
          </Badge>
        </div>
      </div>

      {/* Stats Cards with Suspense */}
      <Suspense fallback={
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse bg-gray-100 rounded-lg" />
          ))}
        </div>
      }>
        <DashboardStatsCards stats={stats} loading={statsLoading} />
      </Suspense>

      {/* Projects Table with Suspense */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100 rounded-lg" />}>
        <ProjectsTable 
          projects={projects}
          loading={projectsLoading}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          totalProjects={stats?.totalProjects || 0}
        />
      </Suspense>
    </div>
  );
}