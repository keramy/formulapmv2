'use client';

import { useProject } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar, 
  MapPin, 
  DollarSign,
  Users,
  Clock,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface OverviewTabProps {
  projectId: string;
}

export function OverviewTab({ projectId }: OverviewTabProps) {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const { project, loading, error } = useProject(projectId);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !project) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Project Overview</h3>
          <p className="text-gray-600">{error || 'Project not found'}</p>
        </CardContent>
      </Card>
    );
  }

  // Mock data for demonstration - in real app, this would come from API
  const mockStats = {
    totalTasks: 42,
    completedTasks: 28,
    teamMembers: 8,
    documents: 15,
    budgetSpent: project.budget ? project.budget * 0.65 : 0,
    budgetRemaining: project.budget ? project.budget * 0.35 : 0,
    riskLevel: 'medium',
    nextMilestone: 'Foundation Complete',
    milestoneDate: '2024-08-15'
  };

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
          </CardContent>
        </Card>

        {/* Budget Summary */}
        {project.budget && hasPermission('projects.view.budget') && (
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
              <Calendar className="w-5 h-5" />
              Next Milestone
            </CardTitle>
            <CardDescription>Upcoming project milestone and deadline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="font-medium text-lg">{mockStats.nextMilestone}</div>
                <div className="text-sm text-gray-600">Target Date: {new Date(mockStats.milestoneDate).toLocaleDateString()}</div>
              </div>
              <div className="text-sm text-gray-600">
                {Math.ceil((new Date(mockStats.milestoneDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining
              </div>
            </div>
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
  );
}