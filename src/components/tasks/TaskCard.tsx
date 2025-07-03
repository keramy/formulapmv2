/**
 * Formula PM 2.0 Task Card Component
 * Individual task display with @mention rendering and quick actions
 */

'use client'

import React, { useState } from 'react'
import { Task, TaskStatus, TaskPriority } from '@/types/tasks'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  MoreVertical, 
  MessageCircle, 
  Paperclip, 
  Calendar, 
  User, 
  Clock,
  CheckCircle,
  Circle,
  Pause,
  AlertTriangle,
  XCircle,
  Edit,
  Trash,
  Eye,
  Link
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '@/hooks/useAuth'
import { MentionParser } from '@/lib/mentions'

interface TaskCardProps {
  task: Task
  onEdit?: (task: Task) => void
  onDelete?: (task: Task) => void
  onStatusChange?: (task: Task, newStatus: TaskStatus) => void
  onView?: (task: Task) => void
  showProject?: boolean
  compact?: boolean
}

const STATUS_ICONS: Record<TaskStatus, React.ComponentType<any>> = {
  todo: Circle,
  in_progress: Clock,
  review: Pause,
  blocked: AlertTriangle,
  done: CheckCircle,
  cancelled: XCircle
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: 'text-gray-500',
  in_progress: 'text-blue-500',
  review: 'text-yellow-500',
  blocked: 'text-red-500',
  done: 'text-green-500',
  cancelled: 'text-gray-400'
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-yellow-100 text-yellow-800',
  urgent: 'bg-red-100 text-red-800'
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onView,
  showProject = false,
  compact = false
}) => {
  const { profile } = useAuth()
  const [showActions, setShowActions] = useState(false)
  
  const StatusIcon = STATUS_ICONS[task.status]
  
  // Check if current user can edit this task
  const canEdit = task.created_by === profile?.id || task.assigned_to.includes(profile?.id || '')
  const canDelete = task.created_by === profile?.id

  // Format due date
  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null
    const date = new Date(dateString)
    const now = new Date()
    const isOverdue = date < now && task.status !== 'done'
    
    return {
      formatted: formatDistanceToNow(date, { addSuffix: true }),
      isOverdue
    }
  }

  const dueDate = formatDueDate(task.due_date)

  // Render @mentions in description
  const renderDescription = (description?: string) => {
    if (!description) return null

    // For now, just display the description as-is
    // In a full implementation, you would parse mentions and make them clickable
    return (
      <p className="text-gray-600 text-sm line-clamp-2">
        {description}
      </p>
    )
  }

  // Handle status change
  const handleStatusChange = (newStatus: TaskStatus) => {
    if (onStatusChange) {
      onStatusChange(task, newStatus)
    }
  }

  return (
    <Card className={`hover:shadow-md transition-shadow ${compact ? 'p-3' : ''}`}>
      <CardHeader className={`${compact ? 'pb-2' : 'pb-3'}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <button
              onClick={() => handleStatusChange(
                task.status === 'done' ? 'todo' : 'done'
              )}
              className={`mt-1 ${STATUS_COLORS[task.status]} hover:scale-110 transition-transform`}
            >
              <StatusIcon className="h-5 w-5" />
            </button>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 
                  className={`font-medium text-gray-900 cursor-pointer hover:text-blue-600 ${
                    task.status === 'done' ? 'line-through text-gray-500' : ''
                  }`}
                  onClick={() => onView?.(task)}
                >
                  {task.title}
                </h3>
                <Badge className={PRIORITY_COLORS[task.priority]} variant="secondary">
                  {task.priority}
                </Badge>
              </div>
              
              {task.parent_task && (
                <div className="flex items-center space-x-1 mt-1">
                  <Link className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    Subtask of: {task.parent_task.title}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Project badge */}
            {showProject && task.project && (
              <Badge variant="outline" className="text-xs">
                {task.project.name}
              </Badge>
            )}
            
            {/* Actions dropdown */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowActions(!showActions)}
                className="h-8 w-8 p-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
              
              {showActions && (
                <div className="absolute right-0 top-8 z-10 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-32">
                  <button
                    onClick={() => {
                      onView?.(task)
                      setShowActions(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View</span>
                  </button>
                  
                  {canEdit && (
                    <button
                      onClick={() => {
                        onEdit?.(task)
                        setShowActions(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit</span>
                    </button>
                  )}
                  
                  {canDelete && (
                    <button
                      onClick={() => {
                        onDelete?.(task)
                        setShowActions(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center space-x-2"
                    >
                      <Trash className="h-4 w-4" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className={compact ? 'pt-0' : ''}>
        {/* Description with mentions */}
        {task.description && !compact && (
          <div className="mb-3">
            {renderDescription(task.description)}
          </div>
        )}

        {/* Metadata row */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            {/* Assignees */}
            {task.assignees && task.assignees.length > 0 && (
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <div className="flex -space-x-1">
                  {task.assignees.slice(0, 3).map((assignee) => (
                    <Avatar key={assignee.id} className="h-6 w-6 border-2 border-white">
                      <AvatarFallback className="text-xs">
                        {assignee.first_name[0]}{assignee.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {task.assignees.length > 3 && (
                    <div className="h-6 w-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs">
                      +{task.assignees.length - 3}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Due date */}
            {dueDate && (
              <div className={`flex items-center space-x-1 ${
                dueDate.isOverdue ? 'text-red-500' : ''
              }`}>
                <Calendar className="h-4 w-4" />
                <span>{dueDate.formatted}</span>
              </div>
            )}

            {/* Time estimate */}
            {task.estimated_hours && (
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{task.estimated_hours}h</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {/* Comments count */}
            {task.comments_count > 0 && (
              <div className="flex items-center space-x-1">
                <MessageCircle className="h-4 w-4" />
                <span>{task.comments_count}</span>
              </div>
            )}

            {/* Attachments count */}
            {task.attachments_count > 0 && (
              <div className="flex items-center space-x-1">
                <Paperclip className="h-4 w-4" />
                <span>{task.attachments_count}</span>
              </div>
            )}

            {/* Subtasks indicator */}
            {task.subtasks && task.subtasks.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {task.subtasks.filter(st => st.status === 'done').length}/{task.subtasks.length} subtasks
              </Badge>
            )}
          </div>
        </div>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && !compact && (
          <div className="mt-3 flex flex-wrap gap-1">
            {task.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Status indicator bar */}
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>
            Created {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
            {task.creator && ` by ${task.creator.first_name} ${task.creator.last_name}`}
          </span>
          
          {task.status === 'done' && task.completed_at && (
            <span className="text-green-600">
              Completed {formatDistanceToNow(new Date(task.completed_at), { addSuffix: true })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}