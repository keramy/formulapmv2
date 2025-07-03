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

  const getStatusColor = (status: string) => {
    const colors = {
      planning: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      on_hold: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      completed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    }
    return colors[status as keyof typeof colors] || colors.planning
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'text-green-600 dark:text-green-400',
      medium: 'text-yellow-600 dark:text-yellow-400',
      high: 'text-orange-600 dark:text-orange-400',
      urgent: 'text-red-600 dark:text-red-400'
    }
    return colors[priority as keyof typeof colors] || colors.medium
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500'
    if (progress >= 50) return 'bg-blue-500'
    if (progress >= 25) return 'bg-yellow-500'
    return 'bg-red-500'
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
            <Badge className={cn("text-xs font-medium", getStatusColor(project.status))}>
              {project.status.replace('_', ' ')}
            </Badge>
            <div className={cn("flex items-center text-xs font-medium", getPriorityColor(project.priority))}>
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
              className={cn("absolute top-0 left-0 h-2 rounded-full transition-all", getProgressColor(project.progress))}
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