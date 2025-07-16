// ============================================================================
// V3 PM Dashboard - Recent Project Activity Component
// ============================================================================
// Built with optimization patterns: DataStateWrapper, real-time updates
// Features: Activity feed, filtering, project-specific updates
// ============================================================================

'use client'

import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DataStateWrapper } from '@/components/ui/loading-states'
import { 
  Activity, 
  FileText, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  MessageSquare,
  Upload,
  Download,
  Calendar,
  Clock,
  Filter,
  Eye
} from 'lucide-react'
import { useRouter } from 'next/navigation'

// Mock data hook - will be replaced with real API integration
function useRecentProjectActivity() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Mock activity data
  const mockActivities = [
    {
      id: 'act1',
      type: 'task_completed',
      title: 'Foundation inspection completed',
      description: 'Structural engineer approved foundation Phase 1',
      project: { id: 'proj1', name: 'Downtown Office Complex' },
      user: { name: 'Sarah Johnson', role: 'Technical Engineer' },
      timestamp: '2024-01-15T14:30:00Z',
      priority: 'high',
      metadata: { task_id: 'task_123', completion_rate: 100 }
    },
    {
      id: 'act2',
      type: 'document_uploaded',
      title: 'Material specifications updated',
      description: 'New steel specifications document uploaded',
      project: { id: 'proj2', name: 'Residential Complex Phase 2' },
      user: { name: 'Michael Chen', role: 'Architect' },
      timestamp: '2024-01-15T13:45:00Z',
      priority: 'medium',
      metadata: { document_type: 'material_spec', file_name: 'steel_specs_v2.pdf' }
    },
    {
      id: 'act3',
      type: 'milestone_achieved',
      title: 'Design phase completed',
      description: 'All design deliverables approved by client',
      project: { id: 'proj3', name: 'Industrial Warehouse Renovation' },
      user: { name: 'Lisa Garcia', role: 'Project Manager' },
      timestamp: '2024-01-15T12:15:00Z',
      priority: 'high',
      metadata: { milestone_id: 'mile_456', progress: 25 }
    },
    {
      id: 'act4',
      type: 'team_assignment',
      title: 'New team member assigned',
      description: 'David Wilson joined as Field Supervisor',
      project: { id: 'proj1', name: 'Downtown Office Complex' },
      user: { name: 'John Smith', role: 'Project Manager' },
      timestamp: '2024-01-15T11:00:00Z',
      priority: 'low',
      metadata: { new_member: 'David Wilson', role: 'Field Supervisor' }
    },
    {
      id: 'act5',
      type: 'issue_reported',
      title: 'Quality concern raised',
      description: 'Concrete quality issues in Section B',
      project: { id: 'proj2', name: 'Residential Complex Phase 2' },
      user: { name: 'Robert Davis', role: 'Quality Inspector' },
      timestamp: '2024-01-15T10:30:00Z',
      priority: 'urgent',
      metadata: { issue_type: 'quality', severity: 'medium' }
    },
    {
      id: 'act6',
      type: 'budget_update',
      title: 'Budget variance reported',
      description: 'Monthly budget review shows 5% variance',
      project: { id: 'proj3', name: 'Industrial Warehouse Renovation' },
      user: { name: 'Finance System', role: 'System' },
      timestamp: '2024-01-15T09:00:00Z',
      priority: 'medium',
      metadata: { variance_percent: 5, category: 'materials' }
    },
    {
      id: 'act7',
      type: 'client_feedback',
      title: 'Client approval received',
      description: 'Client approved Phase 1 design changes',
      project: { id: 'proj1', name: 'Downtown Office Complex' },
      user: { name: 'ABC Corporation', role: 'Client' },
      timestamp: '2024-01-14T16:20:00Z',
      priority: 'high',
      metadata: { approval_type: 'design_change', phase: 1 }
    }
  ]

  const refetch = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 500)
  }

  return { 
    data: mockActivities, 
    loading, 
    error, 
    refetch 
  }
}

// ============================================================================
// TYPES
// ============================================================================

interface ProjectActivity {
  id: string
  type: string
  title: string
  description: string
  project: { id: string; name: string }
  user: { name: string; role: string }
  timestamp: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
  metadata: Record<string, any>
}

interface RecentProjectActivityProps {
  userId?: string
  projectId?: string
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const RecentProjectActivity: React.FC<RecentProjectActivityProps> = ({ 
  userId, 
  projectId 
}) => {
  const { profile } = useAuth()
  const router = useRouter()
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [selectedProject, setSelectedProject] = useState<string>('all')

  // Data fetching
  const { data: activities, loading, error, refetch } = useRecentProjectActivity()

  // Filter activities
  const filteredActivities = activities?.filter(activity => {
    const typeMatch = selectedFilter === 'all' || activity.type === selectedFilter
    const projectMatch = selectedProject === 'all' || activity.project.id === selectedProject
    return typeMatch && projectMatch
  }) || []

  // Get unique projects for filter
  const projects = Array.from(new Set(activities?.map(a => a.project.id) || []))
    .map(id => activities?.find(a => a.project.id === id)?.project)
    .filter(Boolean) as Array<{ id: string; name: string }>

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleViewProject = (projectId: string) => {
    router.push(`/projects/${projectId}`)
  }

  const handleViewActivity = (activity: ProjectActivity) => {
    // Navigate to specific activity context
    switch (activity.type) {
      case 'task_completed':
        router.push(`/projects/${activity.project.id}?tab=tasks&task=${activity.metadata.task_id}`)
        break
      case 'milestone_achieved':
        router.push(`/projects/${activity.project.id}?tab=milestones&milestone=${activity.metadata.milestone_id}`)
        break
      case 'document_uploaded':
        router.push(`/projects/${activity.project.id}?tab=documents`)
        break
      default:
        router.push(`/projects/${activity.project.id}`)
    }
  }

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_completed': return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'document_uploaded': return <Upload className="h-4 w-4 text-blue-600" />
      case 'milestone_achieved': return <Calendar className="h-4 w-4 text-purple-600" />
      case 'team_assignment': return <Users className="h-4 w-4 text-indigo-600" />
      case 'issue_reported': return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'budget_update': return <FileText className="h-4 w-4 text-orange-600" />
      case 'client_feedback': return <MessageSquare className="h-4 w-4 text-emerald-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return time.toLocaleDateString()
  }

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  // ============================================================================
  // ACTIVITY ITEM COMPONENT
  // ============================================================================

  const ActivityItem: React.FC<{ activity: ProjectActivity }> = ({ activity }) => (
    <div className="group flex items-start gap-3 p-4 border rounded-lg hover:shadow-md transition-all duration-200 bg-white">
      {/* Icon */}
      <div className="flex-shrink-0 mt-1">
        {getActivityIcon(activity.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                {activity.title}
              </h4>
              <Badge className={getPriorityColor(activity.priority)} variant="secondary" size="sm">
                {activity.priority.toUpperCase()}
              </Badge>
            </div>
            
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {activity.description}
            </p>
            
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Avatar className="h-4 w-4">
                  <AvatarFallback className="text-xs">
                    {getUserInitials(activity.user.name)}
                  </AvatarFallback>
                </Avatar>
                <span>{activity.user.name}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatTimeAgo(activity.timestamp)}</span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewProject(activity.project.id)}
                className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800"
              >
                {activity.project.name}
              </Button>
            </div>
          </div>
          
          {/* Action */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewActivity(activity)}
            className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
          >
            <Eye className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
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
              <Activity className="h-5 w-5" />
              Recent Project Activity
            </CardTitle>
            <CardDescription>
              Latest updates from your projects
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            {/* Activity Type Filter */}
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="all">All Types</option>
              <option value="task_completed">Tasks</option>
              <option value="milestone_achieved">Milestones</option>
              <option value="document_uploaded">Documents</option>
              <option value="issue_reported">Issues</option>
              <option value="team_assignment">Team</option>
            </select>
            
            {/* Project Filter */}
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="all">All Projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <DataStateWrapper
          loading={loading}
          error={error}
          data={filteredActivities}
          onRetry={refetch}
          emptyMessage="No recent activity"
          emptyDescription="Activity will appear here as your projects progress"
          loadingComponent={
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-start gap-3 animate-pulse">
                  <div className="w-4 h-4 bg-gray-200 rounded mt-1"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          }
        >
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredActivities.map(activity => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </DataStateWrapper>
      </CardContent>
    </Card>
  )
}

export default RecentProjectActivity