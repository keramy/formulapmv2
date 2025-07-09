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
  badgeClass: string
}> = {
  low: {
    label: 'Low',
    icon: TrendingDown,
    color: 'text-blue-600',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
  },
  medium: {
    label: 'Medium',
    icon: Minus,
    color: 'text-yellow-600',
    badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
  },
  high: {
    label: 'High',
    icon: TrendingUp,
    color: 'text-orange-600',
    badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
  },
  urgent: {
    label: 'Urgent',
    icon: AlertTriangle,
    color: 'text-red-600',
    badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
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
      <Badge className={cn('gap-1', config.badgeClass)}>
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