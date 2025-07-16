/**
 * Optimized Project Dashboard Component
 * High-performance project overview with real-time updates
 */

'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { DataStateWrapper } from '@/components/ui/loading-states'
import { useProjectDashboardOptimized } from '@/hooks/useDashboardOptimized'
import { useProjectRealtimeUpdates } from '@/hooks/useRealtimeUpdates'
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Calendar,
  Activity,
  RefreshCw,
  DollarSign,
  Target,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface OptimizedProjectDashboardProps {
  projectId: string
  className?: string
}

export function OptimizedProjectDashboard({ projectId, className }: OptimizedProjectDashboardProps) {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [realtimeEnabled, setRealtimeEnabled] = useState(true)

  // Use optimized project dashboard hook
  const {
    project,
    tasks,
    scopeItems,
    milestones,
    scopeStats,
    loading,
    error,
    refreshAll,
    loadingStates
  } = useProjectDashboardOptimized(projectId)

  // Real-time updates for this project
  useProjectRealtimeUpdates({
    projectId,
    onTaskUpdate: useCallback((payload) => {
      console.log('Task updated in project:', payload)
      setLastUpdate(new Date())
    }, []),
    
    onScopeUpdate: useCallback((payload) => {
      console.log('Scope updated in project:', payload)
      setLastUpdate(new Date())
    }, []),
    
    onMilestoneUpdate: useCallback((payload) => {
      console.log('Milestone updated in project:', payload)
      setLastUpdate(new Date())
    }, []),
    
    onProjectUpdate: useCallback((payload) => {
      console.log('Project updated:', payload)
      setLastUpdate(new Date())
    }, [])
  })

  // Calculate project progress
  const projectProgress = project ? {
    tasks: {
      total: tasks?.length || 0,
      completed: tasks?.filter(t => t.status === 'completed').length || 0,
      percentage: tasks?.length ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0
    },
    scope: {
      total: scopeItems?.length || 0,
      completed: scopeItems?.filter(s => s.status === 'completed').length || 0,
      percentage: scopeItems?.length ? Math.round((scopeItems.filter(s => s.status === 'completed').length / scopeItems.length) * 100) : 0
    },
    milestones: {
      total: milestones?.length || 0,
      completed: milestones?.filter(m => m.status === 'completed').length || 0,
      percentage: milestones?.length ? Math.round((milestones.filter(m => m.status === 'completed').length / milestones.length) * 100) : 0
    }
  } : null

  return (
    <DataStateWrapper
      loading={loading}
      error={error}
      data={project}
      className={className}
    >
      <div className="space-y-6">
        {/* Project Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{project?.name}</h1>
            <div className="flex items-center gap-4 mt-2">
              <Badge variant={project?.status === 'completed' ? 'default' : 'secondary'}>
                {project?.status?.replace('_', ' ')}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRealtimeEnabled(!realtimeEnabled)}
              className={cn(
                'transition-colors',
                realtimeEnabled ? 'bg-green-50 border-green-200' : 'bg-gray-50'
              )}
            >
              <Activity className={cn(
                'h-4 w-4 mr-2',
                realtimeEnabled ? 'text-green-600' : 'text-gray-400'
              )} />
              {realtimeEnabled ? 'Live' : 'Paused'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={refreshAll}
              disabled={loading}
            >
              <RefreshCw className={cn(
                'h-4 w-4 mr-2',
                loading && 'animate-spin'
              )} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                Tasks Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {projectProgress?.tasks.completed || 0}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    of {projectProgress?.tasks.total || 0}
                  </span>
                </div>
                <Progress value={projectProgress?.tasks.percentage || 0} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {projectProgress?.tasks.percentage || 0}% complete
                </div>
              </div>
              {loadingStates.tasks && (
                <div className="absolute top-2 right-2">
                  <RefreshCw className="h-3 w-3 animate-spin text-blue-600" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Target className="h-4 w-4 mr-2 text-green-600" />
                Scope Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {projectProgress?.scope.completed || 0}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    of {projectProgress?.scope.total || 0}
                  </span>
                </div>
                <Progress value={projectProgress?.scope.percentage || 0} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {projectProgress?.scope.percentage || 0}% complete
                </div>
              </div>
              {loadingStates.scope && (
                <div className="absolute top-2 right-2">
                  <RefreshCw className="h-3 w-3 animate-spin text-green-600" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-purple-600" />
                Milestones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {projectProgress?.milestones.completed || 0}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    of {projectProgress?.milestones.total || 0}
                  </span>
                </div>
                <Progress value={projectProgress?.milestones.percentage || 0} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {projectProgress?.milestones.percentage || 0}% complete
                </div>
              </div>
              {loadingStates.milestones && (
                <div className="absolute top-2 right-2">
                  <RefreshCw className="h-3 w-3 animate-spin text-purple-600" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Financial Overview (if user has access) */}
        {scopeStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                  Budget Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Value</span>
                    <span className="font-semibold">
                      ${scopeStats.totalValue?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Completed Value</span>
                    <span className="font-semibold text-green-600">
                      ${scopeStats.completedValue?.toLocaleString() || 0}
                    </span>
                  </div>
                  <Progress 
                    value={scopeStats.totalValue ? (scopeStats.completedValue / scopeStats.totalValue) * 100 : 0} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-blue-600" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">On Schedule</span>
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(((milestones?.filter(m => !m.is_overdue).length || 0) / (milestones?.length || 1)) * 100)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Quality Score</span>
                    <Badge variant="default" className="text-xs">
                      95%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline">
                <CheckCircle className="h-4 w-4 mr-2" />
                Add Task
              </Button>
              <Button size="sm" variant="outline">
                <Target className="h-4 w-4 mr-2" />
                Add Scope Item
              </Button>
              <Button size="sm" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Add Milestone
              </Button>
              <Button size="sm" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Manage Team
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DataStateWrapper>
  )
}
