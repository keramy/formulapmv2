/**
 * Formula PM 2.0 Milestone Card Component
 * V3 Phase 1 Implementation
 * 
 * Individual milestone display card with status and actions
 */

'use client'

import { useState } from 'react'
import { format, isPast, isToday, differenceInDays } from 'date-fns'
import { Milestone, MilestoneStatus, MilestonePermissions } from '@/types/milestones'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataStateWrapper } from '@/components/ui/loading-states'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  Circle, 
  AlertTriangle,
  XCircle,
  PlayCircle,
  Edit,
  Trash2,
  User
} from 'lucide-react'

interface MilestoneCardProps {
  milestone: Milestone
  onEdit?: (milestone: Milestone) => void
  onDelete?: (milestone: Milestone) => void
  onStatusChange?: (milestoneId: string, status: MilestoneStatus) => void
  onSelect?: (selected: boolean) => void
  selected?: boolean
  permissions: MilestonePermissions
  compact?: boolean
}

export const MilestoneCard: React.FC<MilestoneCardProps> = ({
  milestone,
  onEdit,
  onDelete,
  onStatusChange,
  onSelect,
  selected = false,
  permissions,
  compact = false
}) => {
  const [isLoading, setIsLoading] = useState(false)

  const targetDate = new Date(milestone.target_date)
  const actualDate = milestone.actual_date ? new Date(milestone.actual_date) : null
  const isOverdue = milestone.status !== 'completed' && milestone.status !== 'cancelled' && isPast(targetDate)
  const isDueToday = isToday(targetDate)
  const daysUntilDue = differenceInDays(targetDate, new Date())

  const handleStatusChange = async (newStatus: MilestoneStatus) => {
    if (!onStatusChange || isLoading) return

    setIsLoading(true)
    try {
      await onStatusChange(milestone.id, newStatus)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: MilestoneStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'in_progress':
        return <PlayCircle className="h-4 w-4 text-blue-600" />
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-600" />
      default:
        return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: MilestoneStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'in_progress':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'overdue':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'cancelled':
        return 'bg-gray-50 border-gray-200 text-gray-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getStatusBadge = (status: Milestone['status']) => {
    const variants = {
      upcoming: 'secondary',
      in_progress: 'default',
      completed: 'default',
      overdue: 'destructive',
      cancelled: 'secondary'
    } as const

    return (
      <Badge variant={variants[status]} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getDateInfo = () => {
    if (milestone.status === 'completed' && actualDate) {
      return (
        <div className="flex items-center gap-1 text-sm text-green-600">
          <CheckCircle className="h-3 w-3" />
          Completed {format(actualDate, 'MMM d, yyyy')}
        </div>
      )
    }

    if (isOverdue) {
      return (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <AlertTriangle className="h-3 w-3" />
          Overdue by {Math.abs(daysUntilDue)} day{Math.abs(daysUntilDue) === 1 ? '' : 's'}
        </div>
      )
    }

    if (isDueToday) {
      return (
        <div className="flex items-center gap-1 text-sm text-yellow-600">
          <Clock className="h-3 w-3" />
          Due today
        </div>
      )
    }

    return (
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Calendar className="h-3 w-3" />
        Due {format(targetDate, 'MMM d, yyyy')}
        {daysUntilDue > 0 && (
          <span className="text-xs">
            ({daysUntilDue} day{daysUntilDue === 1 ? '' : 's'})
          </span>
        )}
      </div>
    )
  }

  if (compact) {
    return (
      <Card className={cn(
        'transition-all duration-200',
        selected && 'ring-2 ring-primary',
        isOverdue && 'border-red-200 bg-red-50/50',
        isDueToday && 'border-yellow-200 bg-yellow-50/50'
      )}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              {onSelect && (
                <Checkbox
                  checked={selected}
                  onCheckedChange={onSelect}
                />
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium truncate">{milestone.name}</h4>
                  {getStatusBadge(milestone.status)}
                </div>
                <div className="mt-1">
                  {getDateInfo()}
                </div>
              </div>
            </div>

            {(permissions.canEdit || permissions.canDelete) && (
              <div className="flex items-center gap-1">
                {permissions.canEdit && onEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(milestone)}
                    disabled={isLoading}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {permissions.canDelete && onDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(milestone)}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md',
      selected && 'ring-2 ring-primary',
      isOverdue && 'border-red-200 bg-red-50/50',
      isDueToday && 'border-yellow-200 bg-yellow-50/50',
      getStatusColor(milestone.status)
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            {onSelect && (
              <Checkbox
                checked={selected}
                onCheckedChange={onSelect}
              />
            )}
            
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg leading-6 mb-1">
                {milestone.name}
              </CardTitle>
              {getStatusBadge(milestone.status)}
            </div>
          </div>

          {(permissions.canEdit || permissions.canDelete) && (
            <div className="flex items-center gap-1">
              {permissions.canEdit && onEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(milestone)}
                  disabled={isLoading}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {permissions.canDelete && onDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(milestone)}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {milestone.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {milestone.description}
          </p>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>{getDateInfo()}</div>
            {milestone.creator && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                {milestone.creator.full_name}
              </div>
            )}
          </div>

          {permissions.canChangeStatus && onStatusChange && milestone.status !== 'completed' && (
            <>
              <Separator />
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Quick Actions:</span>
                <div className="flex gap-2">
                  {milestone.status === 'upcoming' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange('in_progress')}
                      disabled={isLoading}
                    >
                      <PlayCircle className="h-3 w-3 mr-1" />
                      Start
                    </Button>
                  )}
                  {milestone.status === 'in_progress' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange('completed')}
                      disabled={isLoading}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Complete
                    </Button>
                  )}
                  {milestone.status !== 'cancelled' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange('cancelled')}
                      disabled={isLoading}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Enhanced MilestoneCard with DataStateWrapper integration
 * This provides consistent loading states for milestone operations
 */
export const MilestoneCardEnhanced = (props: MilestoneCardProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStatusChange = async (milestoneId: string, newStatus: MilestoneStatus) => {
    if (!props.onStatusChange) return

    setIsLoading(true)
    setError(null)

    try {
      await props.onStatusChange(milestoneId, newStatus)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update milestone status')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (milestone: Milestone) => {
    if (!props.onEdit || isLoading) return
    props.onEdit(milestone)
  }

  const handleDelete = (milestone: Milestone) => {
    if (!props.onDelete || isLoading) return
    props.onDelete(milestone)
  }

  return (
    <DataStateWrapper
      loading={isLoading}
      error={error}
      data={props.milestone}
      onRetry={() => setError(null)}
      emptyComponent={
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No milestone data</p>
          </CardContent>
        </Card>
      }
    >
      <MilestoneCard
        {...props}
        onStatusChange={handleStatusChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </DataStateWrapper>
  )
}