/**
 * Formula PM 2.0 Task Priority Selector Component
 * V3 Phase 1 Implementation
 * 
 * Priority selection component with visual indicators
 */

'use client'

import { TaskPriority } from '@/types/tasks'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingDown, 
  Minus, 
  TrendingUp, 
  AlertTriangle 
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TaskPrioritySelectorProps {
  value: TaskPriority
  onChange: (value: TaskPriority) => void
  disabled?: boolean
  className?: string
  showBadge?: boolean
}

const priorityConfig: Record<TaskPriority, {
  label: string
  icon: React.ElementType
  color: string
  badgeVariant: string
}> = {
  low: {
    label: 'Low',
    icon: TrendingDown,
    color: 'text-priority-low',
    badgeVariant: 'priority-low'
  },
  medium: {
    label: 'Medium',
    icon: Minus,
    color: 'text-priority-medium',
    badgeVariant: 'priority-medium'
  },
  high: {
    label: 'High',
    icon: TrendingUp,
    color: 'text-priority-high',
    badgeVariant: 'priority-high'
  },
  urgent: {
    label: 'Urgent',
    icon: AlertTriangle,
    color: 'text-priority-urgent',
    badgeVariant: 'priority-urgent'
  }
}

export const TaskPrioritySelector: React.FC<TaskPrioritySelectorProps> = ({
  value,
  onChange,
  disabled = false,
  className,
  showBadge = false
}) => {
  const config = priorityConfig[value]
  const Icon = config.icon

  if (showBadge) {
    return (
      <Badge variant={config.badgeVariant as any} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue>
          <div className="flex items-center gap-2">
            <Icon className={cn('h-4 w-4', config.color)} />
            <span>{config.label}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(priorityConfig).map(([priority, cfg]) => {
          const PriorityIcon = cfg.icon
          return (
            <SelectItem key={priority} value={priority}>
              <div className="flex items-center gap-2">
                <PriorityIcon className={cn('h-4 w-4', cfg.color)} />
                <span>{cfg.label}</span>
              </div>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}