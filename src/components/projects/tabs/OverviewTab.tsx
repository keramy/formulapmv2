'use client';

import { useProject } from '@/hooks/useProjects';
import { useMilestones } from '@/hooks/useMilestones';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DataStateWrapper } from '@/components/ui/loading-states';
import { 
  Calendar, 
  MapPin, 
  DollarSign,
  Users,
  Clock,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Target
} from 'lucide-react';

interface OverviewTabProps {
  projectId: string;
}

export function OverviewTab({ projectId }: OverviewTabProps) {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const { project, loading, error } = useProject(projectId);
  const { milestones, statistics: milestoneStats, loading: milestonesLoading } = useMilestones(projectId);



  // Mock data for tasks and other metrics - will be replaced with real data as APIs are implemented
  const mockStats = {
    totalTasks: 42,
    completedTasks: 28,
    teamMembers: 8,
    documents: 15,
    budgetSpent: project.budget ? project.budget * 0.65 : 0,
    budgetRemaining: project.budget ? project.budget * 0.35 : 0,
    riskLevel: 'medium'
  };

  // Get next milestone from real data
  const nextMilestone = milestones
    .filter(m => m.status === 'upcoming' || m.status === 'in_progress')
    .sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime())[0];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'high': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'medium': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'low': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <DataStateWrapper
      loading={loading}
      error={error}
      data={project}
      emptyComponent={
        <Card>
          <CardContent className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Project Not Found</h3>
            <p className="text-gray-600">The requested project could not be found.</p>
          </CardContent>
        </Card>
      }
    >
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
              <span className="text-sm">{mockStats.teamMembers} members</span>
            </div>
            <div className="flex items-center space-x-2">
              {getRiskIcon(mockStats.riskLevel)}
              <span className="text-sm font-medium">Risk Level:</span>
              <Badge className={getRiskColor(mockStats.riskLevel)}>
                {mockStats.riskLevel}
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
            {/* Overall Progress */}
            {project.progress_percentage !== undefined && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                  <span className="text-sm text-gray-600">{project.progress_percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${project.progress_percentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{mockStats.completedTasks}</div>
                <div className="text-sm text-gray-600">Completed Tasks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-700">{mockStats.totalTasks}</div>
                <div className="text-sm text-gray-600">Total Tasks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{mockStats.teamMembers}</div>
                <div className="text-sm text-gray-600">Team Members</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{mockStats.documents}</div>
                <div className="text-sm text-gray-600">Documents</div>
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
                    <div className="text-xl font-bold text-green-600">{milestoneStats.completed}</div>
                    <div className="text-xs text-gray-600">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">{milestoneStats.byStatus.in_progress}</div>
                    <div className="text-xs text-gray-600">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-red-600">{milestoneStats.overdue}</div>
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
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Budget</span>
                  <span className="text-sm font-bold">${project.budget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Budget Spent</span>
                  <span className="text-sm text-red-600">${mockStats.budgetSpent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Remaining</span>
                  <span className="text-sm text-green-600">${mockStats.budgetRemaining.toLocaleString()}</span>
                </div>
              </div>
              
              {/* Budget Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Budget Utilization</span>
                  <span className="text-sm text-gray-600">{Math.round((mockStats.budgetSpent / project.budget) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-orange-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(mockStats.budgetSpent / project.budget) * 100}%` }}
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

        {/* Team Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Summary
            </CardTitle>
            <CardDescription>Project team overview and assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center py-4">
                <div className="text-2xl font-bold text-blue-600">{mockStats.teamMembers}</div>
                <div className="text-sm text-gray-600">Active Team Members</div>
              </div>
              <div className="text-sm text-gray-600">
                Team members are assigned to various roles including project management, 
                engineering, and field operations. Detailed team information is available 
                in the project management system.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </DataStateWrapper>
  );
}