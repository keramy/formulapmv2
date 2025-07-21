/**
 * Formula PM 2.0 Task Card Component
 * V3 Phase 1 Implementation
 * 
 * Individual task display card with status, priority, and actions
 */

'use client'

import { useState } from 'react'
import { Task } from '@/types/tasks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TaskStatusBadge } from './TaskStatusBadge'
import { TaskPrioritySelector } from './TaskPrioritySelector'
import { 
  Calendar, 
  Clock, 
  User, 
  MoreVertical, 
  Edit, 
  Trash2,
  Link2,
  MessageSquare,
  CheckCircle2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { format, formatDistanceToNow, isPast, isToday } from 'date-fns'
import { cn } from '@/lib/utils'

interface TaskCardProps {
  task: Task
  onEdit?: () => void
  onDelete?: () => void
  onStatusChange?: (status: Task['status']) => void
  onSelect?: (selected: boolean) => void
  selected?: boolean
  permissions?: {
    canEdit: boolean
    canDelete: boolean
    canChangeStatus: boolean
  }
  showScopeItem?: boolean
  compact?: boolean
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onSelect,
  selected = false,
  permissions = {
    canEdit: true,
    canDelete: true,
    canChangeStatus: true
  },
  showScopeItem = true,
  compact = false
}) => {
  const [isHovered, setIsHovered] = useState(false)
  
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== 'completed'
  const isDueToday = task.due_date && isToday(new Date(task.due_date))

  const handleQuickComplete = () => {
    if (permissions.canChangeStatus && onStatusChange) {
      onStatusChange('completed')
    }
  }

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center justify-between p-3 rounded-lg border transition-colors',
          'hover:bg-muted/50',
          selected && 'bg-muted',
          isOverdue && 'border-status-danger/50'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {onSelect && (
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => onSelect(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{task.title}</p>
              <TaskStatusBadge status={task.status} />
              <TaskPrioritySelector value={task.priority} onChange={() => {}} showBadge disabled />
            </div>
            
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              {task.assignee && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {task.assignee.full_name}
                </span>
              )}
              {task.due_date && (
                <span className={cn(
                  'flex items-center gap-1',
                  isOverdue && 'text-status-danger',
                  isDueToday && 'text-status-warning'
                )}>
                  <Calendar className="h-3 w-3" />
                  {format(new Date(task.due_date), 'MMM d')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {task.status !== 'completed' && permissions.canChangeStatus && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleQuickComplete}
              className={cn('transition-opacity', !isHovered && 'opacity-0')}
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {permissions.canEdit && onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {permissions.canDelete && onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    )
  }

  return (
    <Card className={cn(
      'transition-shadow hover:shadow-md',
      selected && 'ring-2 ring-primary',
      isOverdue && 'border-status-danger/50'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {onSelect && (
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) => onSelect(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 mt-0.5"
                />
              )}
              <CardTitle className="text-base truncate">{task.title}</CardTitle>
            </div>
            {task.description && (
              <CardDescription className="mt-1 line-clamp-2">
                {task.description}
              </CardDescription>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {permissions.canEdit && onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {permissions.canDelete && onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TaskStatusBadge status={task.status} showIcon />
            <TaskPrioritySelector value={task.priority} onChange={() => {}} showBadge disabled />
          </div>
          
          {task.status !== 'completed' && permissions.canChangeStatus && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleQuickComplete}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Complete
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
          {task.assignee && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{task.assignee.full_name}</span>
            </div>
          )}
          
          {task.due_date && (
            <div className={cn(
              'flex items-center gap-2',
              isOverdue && 'text-status-danger font-medium',
              isDueToday && 'text-status-warning font-medium'
            )}>
              <Calendar className="h-4 w-4" />
              <span>
                {isOverdue ? 'Overdue' : isDueToday ? 'Due Today' : format(new Date(task.due_date), 'MMM d, yyyy')}
              </span>
            </div>
          )}
          
          {task.estimated_hours && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{task.estimated_hours}h estimated</span>
            </div>
          )}
          
          {showScopeItem && task.scope_item && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Link2 className="h-4 w-4" />
              <span className="truncate">#{task.scope_item.item_no} {task.scope_item.title}</span>
            </div>
          )}
        </div>
        
        {task.tags && task.tags.length > 0 && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {task.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between mt-4 pt-3 border-t text-xs text-muted-foreground">
          <span>
            Created {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
          </span>
          {task.metadata?.comments_count && (
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {task.metadata.comments_count}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}