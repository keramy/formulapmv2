/**
 * Formula PM 2.0 Milestone Progress Bar Component
 * V3 Phase 1 Implementation
 * 
 * Visual progress indicators for milestone tracking
 */

'use client'

import { useMemo } from 'react'
import { Milestone, MilestoneProgress } from '@/types/milestones'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  CheckCircle, 
  Circle, 
  AlertTriangle,
  XCircle,
  PlayCircle,
  Target,
  TrendingUp,
  TrendingDown,
  Clock
} from 'lucide-react'

interface MilestoneProgressBarProps {
  milestones: Milestone[]
  className?: string
  showDetails?: boolean
  showLabels?: boolean
  variant?: 'default' | 'compact' | 'detailed'
}

export const MilestoneProgressBar: React.FC<MilestoneProgressBarProps> = ({
  milestones,
  className,
  showDetails = true,
  showLabels = true,
  variant = 'default'
}) => {
  const progress = useMemo((): MilestoneProgress => {
    const total = milestones.length
    const completed = milestones.filter(m => m.status === 'completed').length
    const overdue = milestones.filter(m => m.status === 'overdue').length
    const upcoming = milestones.filter(m => m.status === 'upcoming').length
    const inProgress = milestones.filter(m => m.status === 'in_progress').length
    const cancelled = milestones.filter(m => m.status === 'cancelled').length
    
    return {
      total,
      completed,
      overdue,
      upcoming,
      inProgress,
      cancelled,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  }, [milestones])

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-blue-600'
    if (percentage >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500'
    if (percentage >= 60) return 'bg-blue-500'
    if (percentage >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-4', className)}>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className={cn('text-sm font-semibold', getProgressColor(progress.percentage))}>
              {progress.percentage}%
            </span>
          </div>
          <Progress 
            value={progress.percentage} 
            className="h-2"
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {progress.completed}/{progress.total}
          </Badge>
          {progress.overdue > 0 && (
            <Badge variant="destructive" className="text-xs">
              {progress.overdue} overdue
            </Badge>
          )}
        </div>
      </div>
    )
  }

  if (variant === 'detailed') {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Milestone Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Progress</span>
            <div className="flex items-center gap-2">
              <span className={cn('text-lg font-bold', getProgressColor(progress.percentage))}>
                {progress.percentage}%
              </span>
              {progress.percentage >= 50 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>
          
          <Progress 
            value={progress.percentage} 
            className="h-3"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Completed</span>
                <Badge variant="secondary">{progress.completed}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <PlayCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm">In Progress</span>
                <Badge variant="secondary">{progress.inProgress}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Circle className="h-4 w-4 text-gray-400" />
                <span className="text-sm">Upcoming</span>
                <Badge variant="secondary">{progress.upcoming}</Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm">Overdue</span>
                <Badge variant="destructive">{progress.overdue}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-gray-600" />
                <span className="text-sm">Cancelled</span>
                <Badge variant="secondary">{progress.cancelled}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-gray-600" />
                <span className="text-sm">Total</span>
                <Badge variant="outline">{progress.total}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default variant
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          <span className="font-medium">Milestone Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('text-lg font-bold', getProgressColor(progress.percentage))}>
            {progress.percentage}%
          </span>
          <span className="text-sm text-muted-foreground">
            ({progress.completed}/{progress.total})
          </span>
        </div>
      </div>
      
      <Progress 
        value={progress.percentage} 
        className="h-3"
      />
      
      {showDetails && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>{progress.completed} completed</span>
            </div>
            <div className="flex items-center gap-1">
              <PlayCircle className="h-3 w-3 text-blue-600" />
              <span>{progress.inProgress} in progress</span>
            </div>
            <div className="flex items-center gap-1">
              <Circle className="h-3 w-3 text-gray-400" />
              <span>{progress.upcoming} upcoming</span>
            </div>
          </div>
          
          {progress.overdue > 0 && (
            <div className="flex items-center gap-1 text-red-600">
              <AlertTriangle className="h-3 w-3" />
              <span>{progress.overdue} overdue</span>
            </div>
          )}
        </div>
      )}
      
      {showLabels && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {progress.total} total milestones
          </Badge>
          {progress.percentage === 100 && (
            <Badge variant="default" className="text-xs bg-green-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              Project Complete
            </Badge>
          )}
          {progress.overdue > 0 && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {progress.overdue} overdue
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}