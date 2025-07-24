/**
 * Formula PM 2.0 Task Status Badge Component
 * V3 Phase 1 Implementation
 * 
 * Visual status indicator for tasks with consistent color coding
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { TaskStatus } from '@/types/tasks'
import { 
  Clock, 
  PlayCircle, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  AlertCircle 
} from 'lucide-react'

interface TaskStatusBadgeProps {
  status: TaskStatus
  showIcon?: boolean
  className?: string
}

const statusConfig: Record<TaskStatus, {
  label: string
  variant: 'pending' | 'in-progress' | 'review' | 'completed' | 'cancelled' | 'destructive'
  icon: React.ElementType
}> = {
  pending: {
    label: 'Pending',
    variant: 'pending',
    icon: Clock
  },
  in_progress: {
    label: 'In Progress',
    variant: 'in-progress',
    icon: PlayCircle
  },
  review: {
    label: 'Review',
    variant: 'review',
    icon: Eye
  },
  completed: {
    label: 'Completed',
    variant: 'completed',
    icon: CheckCircle2
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'cancelled',
    icon: XCircle
  },
  blocked: {
    label: 'Blocked',
    variant: 'destructive',
    icon: AlertCircle
  }
}

export const TaskStatusBadge: React.FC<TaskStatusBadgeProps> = ({
  status,
  showIcon = false,
  className
}) => {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className={className}>
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {config.label}
    </Badge>
  )
}