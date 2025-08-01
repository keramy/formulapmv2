'use client';

import { useProjectDirect } from '@/hooks/useProjects';
import { useMilestones } from '@/hooks/useMilestones';
import { useProjectStats } from '@/hooks/useProjectStats';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardWidget, ProjectStatusWidget, TeamWidget, ProgressRing } from '@/components/ui/dashboard-widgets';
import Calendar from 'lucide-react/dist/esm/icons/calendar'
import MapPin from 'lucide-react/dist/esm/icons/map-pin'
import DollarSign from 'lucide-react/dist/esm/icons/dollar-sign'
import Users from 'lucide-react/dist/esm/icons/users'
import Clock from 'lucide-react/dist/esm/icons/clock'
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3'
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle'
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle'
import XCircle from 'lucide-react/dist/esm/icons/x-circle'
import Target from 'lucide-react/dist/esm/icons/target'

interface OverviewTabProps {
  projectId: string;
}

export function OverviewTab({ projectId }: OverviewTabProps) {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const { data: project, loading, error } = useProjectDirect(projectId);
  const { milestones, statistics: milestoneStats, loading: milestonesLoading } = useMilestones(projectId);
  
  // Use real project statistics API
  const { stats, loading: statsLoading, error: statsError } = useProjectStats(projectId);

  // Get next milestone from real data
  const nextMilestone = milestones
    .filter(m => m.status === 'upcoming' || m.status === 'in_progress')
    .sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime())[0];

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'high': return 'status-danger' as const;
      case 'medium': return 'status-warning' as const;
      case 'low': return 'status-success' as const;
      default: return 'secondary' as const;
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'high': return <XCircle className="w-5 h-5 text-status-danger" />;
      case 'medium': return <AlertTriangle className="w-5 h-5 text-status-warning" />;
      case 'low': return <CheckCircle className="w-5 h-5 text-status-success" />;
      default: return <AlertTriangle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  // Show loading state while project or stats are loading
  if (loading || statsLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error || statsError) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Project</h3>
          <p className="text-gray-600">{error || statsError}</p>
        </CardContent>
      </Card>
    );
  }

  // Show empty state if no project found
  if (!project) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Project Not Found</h3>
          <p className="text-gray-600">The requested project could not be found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
      <div className="space-y-6">
      {/* Key Project Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Project Details
          </CardTitle>
          <CardDescription>Essential project information and current status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.location && (
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">Location:</span>
                <span className="text-sm">{project.location}</span>
              </div>
            )}
            {project.start_date && (
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">Start Date:</span>
                <span className="text-sm">{new Date(project.start_date).toLocaleDateString()}</span>
              </div>
            )}
            {project.end_date && (
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">End Date:</span>
                <span className="text-sm">{new Date(project.end_date).toLocaleDateString()}</span>
              </div>
            )}
            {project.budget && hasPermission('financials.view') && (
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">Budget:</span>
                <span className="text-sm">${project.budget.toLocaleString()}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Team Size:</span>
              <span className="text-sm">{stats?.teamMembers || 0} members</span>
            </div>
            <div className="flex items-center space-x-2">
              {getRiskIcon(stats?.riskLevel || 'low')}
              <span className="text-sm font-medium">Risk Level:</span>
              <Badge variant={getRiskBadgeVariant(stats?.riskLevel || 'low')}>
                {(stats?.riskLevel || 'low').charAt(0).toUpperCase() + (stats?.riskLevel || 'low').slice(1)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress & Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Progress & Statistics</CardTitle>
            <CardDescription>Current project progress and key metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Enhanced Overall Progress */}
            {project.progress_percentage !== undefined && (
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-semibold text-gray-700">Overall Progress</span>
                    <span className="text-lg font-bold text-gray-900">{project.progress_percentage}%</span>
                  </div>
                  <div className="w-full bg-white rounded-full h-4 shadow-inner border">
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
                    <div className="text-xs text-gray-500 mt-2">Ready to begin project work</div>
                  )}
                </div>
                <div className="ml-6">
                  <ProgressRing progress={project.progress_percentage} size={80} strokeWidth={6} />
                </div>
              </div>
            )}

            {/* Key Metrics with Enhanced Empty States */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg border border-dashed border-gray-200 hover:border-status-info hover:bg-status-info/5 transition-colors">
                <div className="text-2xl font-bold text-status-info">{stats?.completedTasks || 0}</div>
                <div className="text-sm text-gray-600">Completed Tasks</div>
                {(stats?.completedTasks || 0) === 0 && (
                  <div className="text-xs text-gray-400 mt-1">Ready to start tracking</div>
                )}
              </div>
              <div className="text-center p-3 rounded-lg border border-dashed border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-colors">
                <div className="text-2xl font-bold text-gray-700">{stats?.totalTasks || 0}</div>
                <div className="text-sm text-gray-600">Total Tasks</div>
                {(stats?.totalTasks || 0) === 0 && (
                  <div className="text-xs text-gray-400 mt-1">Create your first task</div>
                )}
              </div>
              <div className="text-center p-3 rounded-lg border border-dashed border-gray-200 hover:border-status-success hover:bg-status-success/5 transition-colors">
                <div className="text-2xl font-bold text-status-success">{stats?.teamMembers || 0}</div>
                <div className="text-sm text-gray-600">Team Members</div>
                {(stats?.teamMembers || 0) === 0 && (
                  <div className="text-xs text-gray-400 mt-1">Invite team members</div>
                )}
              </div>
              <div className="text-center p-3 rounded-lg border border-dashed border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors">
                <div className="text-2xl font-bold text-primary">{stats?.documents || 0}</div>
                <div className="text-sm text-gray-600">Documents</div>
                {(stats?.documents || 0) === 0 && (
                  <div className="text-xs text-gray-400 mt-1">Upload project files</div>
                )}
              </div>
            </div>

            {/* Milestone Summary */}
            {milestoneStats && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Milestone Progress
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="text-xl font-bold text-status-success">{milestoneStats.completed}</div>
                    <div className="text-xs text-gray-600">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-status-info">{milestoneStats.byStatus.in_progress}</div>
                    <div className="text-xs text-gray-600">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-status-danger">{milestoneStats.overdue}</div>
                    <div className="text-xs text-gray-600">Overdue</div>
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <div className="text-sm text-gray-600">
                    {milestoneStats.completionRate}% milestone completion rate
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budget Summary */}
        {project.budget && hasPermission('projects.read.all') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Budget Summary
              </CardTitle>
              <CardDescription>Financial overview and budget tracking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-semibold text-gray-700">Total Budget</span>
                  <span className="text-lg font-bold text-gray-900">${project.budget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                  <span className="text-sm font-medium text-red-700">Budget Spent</span>
                  <span className="text-sm font-bold text-red-600">${(stats?.budgetSpent || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100">
                  <span className="text-sm font-medium text-green-700">Remaining</span>
                  <span className="text-sm font-bold text-green-600">${(project.budget - (stats?.budgetSpent || 0)).toLocaleString()}</span>
                </div>
              </div>
              
              {/* Budget Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Budget Utilization</span>
                  <span className="text-sm text-gray-600">{project.budget > 0 ? Math.round(((stats?.budgetSpent || 0) / project.budget) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-status-warning h-3 rounded-full transition-all duration-300"
                    style={{ width: `${project.budget > 0 ? ((stats?.budgetSpent || 0) / project.budget) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Milestone */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Next Milestone
            </CardTitle>
            <CardDescription>Upcoming project milestone and deadline</CardDescription>
          </CardHeader>
          <CardContent>
            {milestonesLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ) : nextMilestone ? (
              <div className="space-y-3">
                <div>
                  <div className="font-medium text-lg">{nextMilestone.name}</div>
                  <div className="text-sm text-gray-600">
                    Target Date: {new Date(nextMilestone.target_date).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={nextMilestone.status === 'in_progress' ? 'default' : 'secondary'}>
                    {nextMilestone.status === 'in_progress' ? 'In Progress' : 'Upcoming'}
                  </Badge>
                  <div className="text-sm text-gray-600">
                    {Math.ceil((new Date(nextMilestone.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining
                  </div>
                </div>
                {nextMilestone.description && (
                  <p className="text-sm text-gray-600 mt-2">{nextMilestone.description}</p>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <Target className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No upcoming milestones</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Team Summary with Widgets */}
        <div className="space-y-4">
          <TeamWidget
            memberCount={stats?.teamMembers || 0}
            activeMembers={stats?.teamMembers || 0}
            onClick={() => {}}
          />
          
          <ProjectStatusWidget
            status={project.status as any}
            tasksCompleted={stats?.completedTasks || 0}
            totalTasks={stats?.totalTasks || 0}
            daysRemaining={project.end_date ? Math.ceil((new Date(project.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : undefined}
            onClick={() => {}}
          />
        </div>
      </div>
      </div>
  );
}