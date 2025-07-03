/**
 * Project Overview Cards Component
 * Grid of project cards with progress and milestone information
 * Mobile-optimized layout for client portal
 */

'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Calendar, 
  Users, 
  FileText, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Eye,
  MoreHorizontal
} from 'lucide-react'
import { ClientProjectDetails } from '@/types/client-portal'
import { format, formatDistanceToNow, isBefore, isAfter, addDays } from 'date-fns'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

interface ProjectOverviewCardsProps {
  projects: ClientProjectDetails[]
  onProjectSelect?: (projectId: string) => void
  onViewDocuments?: (projectId: string) => void
  onViewProgress?: (projectId: string) => void
  loading?: boolean
  mobileOptimized?: boolean
}

export const ProjectOverviewCards: React.FC<ProjectOverviewCardsProps> = ({
  projects,
  onProjectSelect,
  onViewDocuments,
  onViewProgress,
  loading = false,
  mobileOptimized = true
}) => {
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'status' | 'next_milestone'>('name')
  const [filterStatus, setFilterStatus] = useState<string | null>(null)

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'planning': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'on-hold': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'delayed': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Get progress color
  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'bg-green-500'
    if (progress >= 70) return 'bg-blue-500'
    if (progress >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  // Get next milestone urgency
  const getMilestoneUrgency = (date: Date) => {
    const now = new Date()
    const milestone = new Date(date)
    const daysUntil = Math.ceil((milestone.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntil < 0) return { urgency: 'overdue', color: 'text-red-600', days: Math.abs(daysUntil) }
    if (daysUntil <= 7) return { urgency: 'urgent', color: 'text-orange-600', days: daysUntil }
    if (daysUntil <= 30) return { urgency: 'upcoming', color: 'text-blue-600', days: daysUntil }
    return { urgency: 'future', color: 'text-gray-600', days: daysUntil }
  }

  // Sort projects
  const sortedProjects = [...projects].sort((a, b) => {
    switch (sortBy) {
      case 'progress':
        return b.progress - a.progress
      case 'status':
        return a.status.localeCompare(b.status)
      case 'next_milestone':
        const aNext = a.milestones?.find(m => isAfter(new Date(m.date), new Date()))
        const bNext = b.milestones?.find(m => isAfter(new Date(m.date), new Date()))
        if (!aNext && !bNext) return 0
        if (!aNext) return 1
        if (!bNext) return -1
        return new Date(aNext.date).getTime() - new Date(bNext.date).getTime()
      default:
        return a.name.localeCompare(b.name)
    }
  })

  // Filter projects
  const filteredProjects = filterStatus 
    ? sortedProjects.filter(p => p.status === filterStatus)
    : sortedProjects

  // Get unique statuses for filter
  const uniqueStatuses = [...new Set(projects.map(p => p.status))]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-2 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Available</h3>
          <p className="text-gray-600 max-w-md">
            You don't have access to any projects yet. Contact your project manager if you believe this is an error.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterStatus === null ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus(null)}
          >
            All ({projects.length})
          </Button>
          {uniqueStatuses.map(status => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(status)}
            >
              {status} ({projects.filter(p => p.status === status).length})
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border border-gray-200 rounded px-3 py-1"
          >
            <option value="name">Sort by Name</option>
            <option value="progress">Sort by Progress</option>
            <option value="status">Sort by Status</option>
            <option value="next_milestone">Sort by Next Milestone</option>
          </select>
        </div>
      </div>

      {/* Project Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredProjects.map((project) => {
          const nextMilestone = project.milestones?.find(m => isAfter(new Date(m.date), new Date()))
          const milestoneUrgency = nextMilestone ? getMilestoneUrgency(new Date(nextMilestone.date)) : null
          const recentDocuments = project.recent_documents?.slice(0, 3) || []
          const pendingApprovals = recentDocuments.filter(d => d.requires_approval && d.status === 'pending').length

          return (
            <Card 
              key={project.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => onProjectSelect?.(project.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate group-hover:text-blue-600 transition-colors">
                      {project.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                      {pendingApprovals > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {pendingApprovals} approvals
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        onProjectSelect?.(project.id)
                      }}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        onViewDocuments?.(project.id)
                      }}>
                        <FileText className="w-4 h-4 mr-2" />
                        View Documents
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        onViewProgress?.(project.id)
                      }}>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        View Progress
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress 
                    value={project.progress} 
                    className="h-2"
                  />
                </div>

                {/* Description */}
                {project.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {project.description}
                  </p>
                )}

                {/* Next Milestone */}
                {nextMilestone && milestoneUrgency && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {nextMilestone.name}
                      </p>
                      <p className={`text-xs ${milestoneUrgency.color}`}>
                        {milestoneUrgency.urgency === 'overdue' 
                          ? `${milestoneUrgency.days} days overdue`
                          : milestoneUrgency.urgency === 'urgent'
                          ? `${milestoneUrgency.days} days left`
                          : format(new Date(nextMilestone.date), 'MMM d, yyyy')
                        }
                      </p>
                    </div>
                    {milestoneUrgency.urgency === 'overdue' && (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                    {milestoneUrgency.urgency === 'urgent' && (
                      <Clock className="w-4 h-4 text-orange-500" />
                    )}
                  </div>
                )}

                {/* Team and Documents Summary */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{project.team?.length || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      <span>{recentDocuments.length}</span>
                    </div>
                  </div>
                  
                  {project.access_level && (
                    <Badge variant="outline" className="text-xs">
                      {project.access_level}
                    </Badge>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      onViewDocuments?.(project.id)
                    }}
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    Documents
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      onViewProgress?.(project.id)
                    }}
                  >
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Progress
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredProjects.length === 0 && filterStatus && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No {filterStatus} Projects</h3>
            <p className="text-gray-600">No projects match the selected status filter.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setFilterStatus(null)}
            >
              Clear Filter
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}