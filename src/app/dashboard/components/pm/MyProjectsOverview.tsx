// ============================================================================
// V3 PM Dashboard - My Projects Overview Component
// ============================================================================
// Built with optimization patterns: DataStateWrapper, server components
// Features: PM-specific project view, progress tracking, team insights
// ============================================================================

'use client'

import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { DataStateWrapper } from '@/components/ui/loading-states'
import { 
  Building2, 
  Users, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  TrendingDown,
  Eye,
  Settings
} from 'lucide-react'
import { useRouter } from 'next/navigation'

// Mock data hook - will be replaced with real API integration
function useMyProjects() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Mock data for PM dashboard
  const mockProjects = [
    {
      id: 'proj1',
      name: 'Downtown Office Complex',
      status: 'active',
      progress: 65,
      start_date: '2024-01-15',
      target_completion: '2024-08-30',
      budget: 2500000,
      spent: 1625000,
      team_size: 12,
      active_tasks: 23,
      completed_tasks: 67,
      critical_issues: 2,
      client: { name: 'ABC Corporation' },
      health_score: 85,
      next_milestone: 'Foundation Complete',
      milestone_date: '2024-03-15'
    },
    {
      id: 'proj2',
      name: 'Residential Complex Phase 2',
      status: 'active',
      progress: 42,
      start_date: '2024-02-01',
      target_completion: '2024-12-15',
      budget: 3200000,
      spent: 1344000,
      team_size: 18,
      active_tasks: 31,
      completed_tasks: 45,
      critical_issues: 0,
      client: { name: 'Housing Development Corp' },
      health_score: 92,
      next_milestone: 'Structural Framework',
      milestone_date: '2024-04-20'
    },
    {
      id: 'proj3',
      name: 'Industrial Warehouse Renovation',
      status: 'planning',
      progress: 15,
      start_date: '2024-03-01',
      target_completion: '2024-10-31',
      budget: 1800000,
      spent: 270000,
      team_size: 8,
      active_tasks: 12,
      completed_tasks: 8,
      critical_issues: 1,
      client: { name: 'Logistics Inc' },
      health_score: 78,
      next_milestone: 'Design Approval',
      milestone_date: '2024-03-25'
    }
  ]

  const refetch = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 500)
  }

  return { 
    data: mockProjects, 
    loading, 
    error, 
    refetch 
  }
}

// ============================================================================
// TYPES
// ============================================================================

interface Project {
  id: string
  name: string
  status: string
  progress: number
  start_date: string
  target_completion: string
  budget: number
  spent: number
  team_size: number
  active_tasks: number
  completed_tasks: number
  critical_issues: number
  client: { name: string }
  health_score: number
  next_milestone: string
  milestone_date: string
}

interface MyProjectsOverviewProps {
  userId?: string
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const MyProjectsOverview: React.FC<MyProjectsOverviewProps> = ({ userId }) => {
  const { profile } = useAuth()
  const router = useRouter()
  const [selectedFilter, setSelectedFilter] = useState<string>('all')

  // Data fetching
  const { data: projects, loading, error, refetch } = useMyProjects()

  // Filter projects
  const filteredProjects = projects?.filter(project => {
    switch (selectedFilter) {
      case 'active': return project.status === 'active'
      case 'critical': return project.critical_issues > 0
      case 'behind': return project.health_score < 80
      default: return true
    }
  }) || []

  // Calculate summary stats
  const totalProjects = projects?.length || 0
  const activeProjects = projects?.filter(p => p.status === 'active').length || 0
  const totalBudget = projects?.reduce((sum, p) => sum + p.budget, 0) || 0
  const totalSpent = projects?.reduce((sum, p) => sum + p.spent, 0) || 0
  const averageProgress = projects?.length ? 
    Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length) : 0

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleViewProject = (projectId: string) => {
    router.push(`/projects/${projectId}`)
  }

  const handleManageProject = (projectId: string) => {
    router.push(`/projects/${projectId}?tab=overview`)
  }

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'planning': return 'bg-blue-100 text-blue-800'
      case 'on_hold': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // ============================================================================
  // PROJECT CARD COMPONENT
  // ============================================================================

  const ProjectCard: React.FC<{ project: Project }> = ({ project }) => (
    <Card className="group hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold group-hover:text-blue-600 transition-colors">
              {project.name}
            </CardTitle>
            <CardDescription className="mt-1">
              {project.client.name}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(project.status)} variant="secondary">
              {project.status.toUpperCase()}
            </Badge>
            {project.critical_issues > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {project.critical_issues}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className="font-semibold">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-gray-600">
              <Users className="h-3 w-3" />
              <span>Team</span>
            </div>
            <div className="font-semibold">{project.team_size} members</div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-gray-600">
              <CheckCircle2 className="h-3 w-3" />
              <span>Tasks</span>
            </div>
            <div className="font-semibold">
              {project.completed_tasks}/{project.completed_tasks + project.active_tasks}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-gray-600">
              <Calendar className="h-3 w-3" />
              <span>Next Milestone</span>
            </div>
            <div className="font-semibold text-xs">{project.next_milestone}</div>
            <div className="text-xs text-gray-500">{formatDate(project.milestone_date)}</div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-gray-600">
              <TrendingUp className="h-3 w-3" />
              <span>Health</span>
            </div>
            <div className={`font-semibold ${getHealthColor(project.health_score)}`}>
              {project.health_score}%
            </div>
          </div>
        </div>

        {/* Budget Overview */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Budget Utilization</span>
            <span className="font-semibold">
              {Math.round((project.spent / project.budget) * 100)}%
            </span>
          </div>
          <div className="mt-1 text-xs text-gray-600">
            {formatCurrency(project.spent)} of {formatCurrency(project.budget)}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleViewProject(project.id)}
            className="flex items-center gap-1 flex-1"
          >
            <Eye className="h-3 w-3" />
            View
          </Button>
          <Button 
            variant="default" 
            size="sm"
            onClick={() => handleManageProject(project.id)}
            className="flex items-center gap-1 flex-1"
          >
            <Settings className="h-3 w-3" />
            Manage
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              My Projects
            </CardTitle>
            <CardDescription>
              Projects you're managing ({totalProjects} total)
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            {['all', 'active', 'critical', 'behind'].map((filter) => (
              <Button
                key={filter}
                variant={selectedFilter === filter ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter(filter)}
                className="capitalize"
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{activeProjects}</div>
            <div className="text-sm text-blue-700">Active Projects</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{averageProgress}%</div>
            <div className="text-sm text-green-700">Avg Progress</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(totalBudget)}</div>
            <div className="text-sm text-purple-700">Total Budget</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round((totalSpent / totalBudget) * 100)}%
            </div>
            <div className="text-sm text-orange-700">Budget Used</div>
          </div>
        </div>

        {/* Projects Grid */}
        <DataStateWrapper
          loading={loading}
          error={error}
          data={filteredProjects}
          onRetry={refetch}
          emptyMessage="No projects found"
          emptyDescription="You're not managing any projects yet"
          loadingComponent={
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-lg h-64"></div>
                </div>
              ))}
            </div>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredProjects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </DataStateWrapper>
      </CardContent>
    </Card>
  )
}

export default MyProjectsOverview