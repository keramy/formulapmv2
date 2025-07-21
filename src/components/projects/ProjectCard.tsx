'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Calendar, DollarSign, Users, AlertTriangle, MapPin, Clock } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import { cn, formatCurrency, formatDate, formatRelativeTime, getUserInitials } from '@/lib/utils'

interface ProjectCardProps {
  project: {
    id: string
    name: string
    description: string
    status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
    progress: number
    start_date: string
    end_date: string
    budget?: number
    actual_cost?: number
    project_manager: {
      first_name: string
      last_name: string
      avatar?: string
    }
    team_size: number
    priority: 'low' | 'medium' | 'high' | 'urgent'
    client_name: string
    location?: string
    updated_at: string
  }
  onClick?: () => void
  className?: string
  showActions?: boolean
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ 
  project, 
  onClick, 
  className,
  showActions = true
}) => {
  const { canViewPricing } = usePermissions()

  // Map project status to semantic Badge variants
  const getStatusBadgeVariant = (status: string) => {
    const variants = {
      planning: 'planning' as const,
      active: 'active' as const,
      on_hold: 'on-hold' as const,
      completed: 'completed' as const,
      cancelled: 'cancelled' as const
    }
    return variants[status as keyof typeof variants] || 'planning'
  }

  // Map priority to semantic text color classes
  const getPriorityColorClass = (priority: string) => {
    const colors = {
      low: 'text-priority-low',
      medium: 'text-priority-medium',
      high: 'text-priority-high',
      urgent: 'text-priority-urgent'
    }
    return colors[priority as keyof typeof colors] || 'text-priority-medium'
  }

  // Map progress percentage to semantic color classes
  const getProgressColorClass = (progress: number) => {
    if (progress >= 80) return 'bg-status-success'
    if (progress >= 50) return 'bg-status-info'
    if (progress >= 25) return 'bg-status-warning'
    return 'bg-status-danger'
  }

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] group",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
              {project.name}
            </CardTitle>
            <CardDescription className="line-clamp-2 text-sm">
              {project.description}
            </CardDescription>
            {project.location && (
              <div className="flex items-center text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 mr-1" />
                {project.location}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end space-y-2 ml-4">
            <Badge variant={getStatusBadgeVariant(project.status)} className="text-xs font-medium">
              {project.status.replace('_', ' ')}
            </Badge>
            <div className={cn("flex items-center text-xs font-medium", getPriorityColorClass(project.priority))}>
              <AlertTriangle className="h-3 w-3 mr-1" />
              {project.priority}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className="font-semibold">{project.progress}%</span>
          </div>
          <div className="relative">
            <Progress value={project.progress} className="h-2" />
            <div 
              className={cn("absolute top-0 left-0 h-2 rounded-full transition-all", getProgressColorClass(project.progress))}
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {/* Project Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Start</div>
              <div className="font-medium truncate">
                {formatDate(project.start_date)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Due</div>
              <div className="font-medium truncate">
                {formatDate(project.end_date)}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Team</div>
              <div className="font-medium">
                {project.team_size} members
              </div>
            </div>
          </div>

          {canViewPricing() && project.budget && (
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">Budget</div>
                <div className="font-medium truncate">
                  {formatCurrency(project.budget)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Client */}
        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground mb-1">Client</div>
          <div className="font-medium text-sm">{project.client_name}</div>
        </div>

        {/* Project Manager & Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-2">
            <Avatar className="h-7 w-7">
              <AvatarImage src={project.project_manager.avatar} />
              <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                {getUserInitials(project.project_manager.first_name, project.project_manager.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Project Manager</div>
              <div className="text-sm font-medium truncate">
                {project.project_manager.first_name} {project.project_manager.last_name}
              </div>
            </div>
          </div>
          
          {showActions && (
            <Button size="sm" variant="outline" className="ml-2">
              View Details
            </Button>
          )}
        </div>

        {/* Last Updated */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Updated {formatRelativeTime(project.updated_at)}
        </div>
      </CardContent>
    </Card>
  )
}