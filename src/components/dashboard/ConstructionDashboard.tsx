/**
 * Construction Project Management Dashboard
 * 
 * Professional construction industry dashboard inspired by modern PM interfaces
 * Features portfolio overview, project tracking, and comprehensive project management
 */

'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
// Optimized icon imports for better tree-shaking
import Building from 'lucide-react/dist/esm/icons/building';
import DollarSign from 'lucide-react/dist/esm/icons/dollar-sign';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import User from 'lucide-react/dist/esm/icons/user';
import ArrowUp from 'lucide-react/dist/esm/icons/arrow-up';
import ArrowDown from 'lucide-react/dist/esm/icons/arrow-down';
import Clock from 'lucide-react/dist/esm/icons/clock';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import ArrowUpDown from 'lucide-react/dist/esm/icons/arrow-up-down';

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

export function ConstructionDashboard() {
  const { getAccessToken, profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]); // Cache all projects for client-side sorting
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
        
        // Use stats directly from API response
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

      // Load all projects (no limit for client-side sorting)
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
            
            console.log('💰 Calculated values:', {
              totalPortfolio,
              activeValue,
              revenue,
              avgProgress
            });
            
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

  // Load initial data function (now with proper dependencies)
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

  // Auto-refresh data periodically and on page visibility change (better UX)
  useEffect(() => {
    // Refresh when page becomes visible (user navigates back)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 [Dashboard] Page became visible - refreshing data');
        loadInitialData();
      }
    };

    // Set up periodic refresh every 30 seconds for real-time updates
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

  // Memoized client-side sorting function (INSTANT!)
  const sortProjectsClientSide = useCallback(() => {
    const sorted = [...allProjects].sort((a, b) => {
      let aValue: any = a[sortField as keyof Project];
      let bValue: any = b[sortField as keyof Project];
      
      // Handle different data types
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
    // Note: sortProjectsClientSide() will be called by useEffect
  }, [sortField, sortDirection]);

  // Memoized helper functions for performance
  const formatCurrency = useCallback((amount: number) => {
    if (amount >= 1000000) {
      return `₺${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `₺${(amount / 1000).toFixed(0)}K`;
    }
    return `₺${amount.toLocaleString()}`;
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'on-tender': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  const getProgressColor = useCallback((progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  }, []);

  const getDaysRemaining = useCallback((endDate: string) => {
    if (!endDate) return null;
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, []);

  // Show loading only if both stats and projects are loading
  if (statsLoading && projectsLoading) {
    return (
      <div className="space-y-6">
        {/* Loading Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="h-32 animate-pulse bg-gray-100" />
          ))}
        </div>
        {/* Loading Table */}
        <Card className="h-96 animate-pulse bg-gray-100" />
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

      {/* Stats Cards - Professional Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statsLoading ? (
          // Loading state for stats cards only
          <>
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="h-32 animate-pulse bg-gray-100" />
            ))}
          </>
        ) : (
          <>
            {/* Total Portfolio Value */}
            <Card className="border-l-4 border-l-slate-600 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Portfolio Value</CardTitle>
            <Building className="h-5 w-5 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats?.totalPortfolioValue || 0)}
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
              <ArrowUp className="h-3 w-3" />
              {stats?.totalProjects || 0} total projects
            </p>
          </CardContent>
        </Card>

        {/* Active Project Value */}
        <Card className="border-l-4 border-l-blue-600 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Project Value</CardTitle>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats?.activeProjectValue || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.activeProjects || 0} projects in progress
            </p>
          </CardContent>
        </Card>

        {/* Revenue Generated */}
        <Card className="border-l-4 border-l-green-600 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Revenue Generated</CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats?.revenueGenerated || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              From completed work
            </p>
          </CardContent>
        </Card>

        {/* Task Completion */}
        <Card className="border-l-4 border-l-orange-600 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Task Completion</CardTitle>
            <CheckCircle className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats?.taskCompletion || 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Work orders completed
            </p>
          </CardContent>
        </Card>

        {/* Overall Progress */}
        <Card className="border-l-4 border-l-purple-600 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overall Progress</CardTitle>
            <BarChart3 className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats?.overallProgress || 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Average completion rate
            </p>
          </CardContent>
        </Card>
          </>
        )}
      </div>

      {/* Projects Summary Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Projects Summary ({stats?.totalProjects || 0})
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Overview of all construction projects
              </p>
            </div>
            <div className="flex items-center gap-2 mt-4 sm:mt-0">
              <Badge variant="secondary">All</Badge>
              <Badge variant="outline">Active</Badge>
              <Badge variant="outline">Completed</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th 
                    className="text-left py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      Project Name
                      {sortField === 'name' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      {sortField === 'status' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                  <th 
                    className="text-left py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('budget_amount')}
                  >
                    <div className="flex items-center gap-2">
                      Budget
                      {sortField === 'budget_amount' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('start_date')}
                  >
                    <div className="flex items-center gap-2">
                      Start Date
                      {sortField === 'start_date' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('end_date')}
                  >
                    <div className="flex items-center gap-2">
                      Deadline
                      {sortField === 'end_date' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Due</th>
                  <th 
                    className="text-left py-3 px-4 font-medium text-gray-900 cursor-pointer hover:bg-gray-50 select-none"
                    onClick={() => handleSort('progress_percentage')}
                  >
                    <div className="flex items-center gap-2">
                      Progress
                      {sortField === 'progress_percentage' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {projectsLoading ? (
                  // Loading rows for table
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                          <div>
                            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
                            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4"><div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div></td>
                      <td className="py-4 px-4"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></td>
                      <td className="py-4 px-4"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div></td>
                      <td className="py-4 px-4"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></td>
                      <td className="py-4 px-4"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></td>
                      <td className="py-4 px-4"><div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div></td>
                      <td className="py-4 px-4"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
                    </tr>
                  ))
                ) : (
                  projects.map((project) => {
                  const daysRemaining = getDaysRemaining(project.end_date || '');
                  const isOverdue = daysRemaining !== null && daysRemaining < 0;
                  const isNearDeadline = daysRemaining !== null && daysRemaining <= 30 && daysRemaining > 0;
                  
                  return (
                    <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Building className="w-4 h-4 text-orange-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{project.name}</div>
                            {project.location && (
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {project.location}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge 
                          variant="outline" 
                          className={`${getStatusColor(project.status)} text-xs font-medium`}
                        >
                          {project.status?.replace('_', ' ') || 'Unknown'}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600">
                          {project.project_type || 'Management'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-medium text-gray-900">
                          {formatCurrency(project.budget_amount || 0)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600">
                          {new Date(project.start_date).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600">
                          {project.end_date ? new Date(project.end_date).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          }) : 'TBD'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {daysRemaining !== null && (
                          <div className={`text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 ${
                            isOverdue 
                              ? 'bg-red-100 text-red-700'
                              : isNearDeadline 
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {isOverdue ? (
                              <>
                                <AlertTriangle className="w-3 h-3" />
                                Overdue by {Math.abs(daysRemaining)} days
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3" />
                                {daysRemaining} days left
                              </>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <Progress 
                              value={project.progress_percentage || 0} 
                              className="h-2"
                              style={{
                                backgroundColor: '#f3f4f6',
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 min-w-[3rem]">
                            {project.progress_percentage || 0}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {Math.floor((project.progress_percentage || 0) / 20)} / 5 tasks
                        </div>
                      </td>
                    </tr>
                  );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {!projectsLoading && projects.length === 0 && (
            <div className="text-center py-12">
              <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Found</h3>
              <p className="text-gray-600">
                Start by creating your first construction project.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}