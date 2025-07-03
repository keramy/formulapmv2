/**
 * Client Portal Dashboard Component
 * Main dashboard for external clients with project overview and activities
 * Mobile-first responsive design
 */

'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  LayoutDashboard, 
  FolderOpen, 
  FileText, 
  MessageSquare, 
  Bell, 
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Download,
  Eye,
  RefreshCw
} from 'lucide-react'
import { useClientPortal, useClientProjects, useClientNotifications, useClientActivities } from '@/hooks/useClientPortal'
import { ClientDashboardData, ClientProjectDetails, ClientNotification, ClientActivityLog } from '@/types/client-portal'
import { formatDistanceToNow, format } from 'date-fns'

interface ClientDashboardProps {
  onProjectSelect?: (projectId: string) => void
  onDocumentView?: (documentId: string) => void
  onNotificationClick?: (notificationId: string) => void
  mobileOptimized?: boolean
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  onProjectSelect,
  onDocumentView,
  onNotificationClick,
  mobileOptimized = true
}) => {
  const { dashboardData, loading, error, refresh } = useClientPortal()
  const { projects, loading: projectsLoading } = useClientProjects()
  const { notifications, unreadCount } = useClientNotifications()
  const { activities, loading: activitiesLoading } = useClientActivities()

  const [activeTab, setActiveTab] = useState('overview')
  const [refreshing, setRefreshing] = useState(false)

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refresh()
    } finally {
      setRefreshing(false)
    }
  }, [refresh])

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      default: return 'bg-blue-500'
    }
  }

  // Get activity icon
  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'document_view': return <Eye className="w-4 h-4" />
      case 'document_download': return <Download className="w-4 h-4" />
      case 'document_approve': return <CheckCircle className="w-4 h-4" />
      case 'message_send': return <MessageSquare className="w-4 h-4" />
      case 'project_access': return <FolderOpen className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  if (loading && !dashboardData) {
    return (
      <div className="space-y-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const stats = dashboardData ? {
    totalProjects: dashboardData.projects.length,
    activeProjects: dashboardData.projects.filter(p => p.status === 'active').length,
    pendingApprovals: dashboardData.pending_approvals,
    unreadNotifications: dashboardData.notifications.unread_count,
    unreadMessages: dashboardData.messages.unread_count
  } : {
    totalProjects: 0,
    activeProjects: 0,
    pendingApprovals: 0,
    unreadNotifications: 0,
    unreadMessages: 0
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6" />
            Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome to your project portal. Here's your activity overview.
          </p>
        </div>
        
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size={mobileOptimized ? "default" : "sm"}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Projects */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
              </div>
              <FolderOpen className="w-8 h-8 text-blue-600" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-green-600">
                {stats.activeProjects} active
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingApprovals}</p>
              </div>
              <FileText className="w-8 h-8 text-orange-600" />
            </div>
            {stats.pendingApprovals > 0 && (
              <div className="mt-2">
                <Badge variant="destructive" className="text-xs">
                  Action Required
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unread Notifications */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Notifications</p>
                <p className="text-2xl font-bold text-gray-900">{stats.unreadNotifications}</p>
              </div>
              <Bell className="w-8 h-8 text-purple-600" />
            </div>
            {stats.unreadNotifications > 0 && (
              <div className="mt-2">
                <span className="text-sm text-purple-600">
                  {stats.unreadNotifications} unread
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unread Messages */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Messages</p>
                <p className="text-2xl font-bold text-gray-900">{stats.unreadMessages}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-green-600" />
            </div>
            {stats.unreadMessages > 0 && (
              <div className="mt-2">
                <span className="text-sm text-green-600">
                  {stats.unreadMessages} unread
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className={`grid w-full ${mobileOptimized ? 'grid-cols-2' : 'grid-cols-4'}`}>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className={mobileOptimized ? 'hidden sm:inline' : ''}>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            <span className={mobileOptimized ? 'hidden sm:inline' : ''}>Projects</span>
          </TabsTrigger>
          {!mobileOptimized && (
            <>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-1 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Activity
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Projects */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  Recent Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.projects.slice(0, 3).map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{project.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                            {project.status}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {project.progress}% complete
                          </span>
                        </div>
                        {project.next_milestone && (
                          <p className="text-xs text-gray-500 mt-1">
                            Next: {project.next_milestone.name} ({format(new Date(project.next_milestone.date), 'MMM d')})
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={() => onProjectSelect?.(project.id)}
                        variant="ghost"
                        size="sm"
                      >
                        View
                      </Button>
                    </div>
                  ))}
                  
                  {projects.length > 3 && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setActiveTab('projects')}
                    >
                      View All Projects
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.recent_activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        {getActivityIcon(activity.activity_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.description || activity.action_taken}</p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setActiveTab('activity')}
                  >
                    View All Activity
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 justify-start h-auto p-4"
                  onClick={() => setActiveTab('projects')}
                >
                  <FolderOpen className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">View Projects</div>
                    <div className="text-sm text-gray-500">Browse all projects</div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 justify-start h-auto p-4"
                  onClick={() => onDocumentView?.('')}
                >
                  <FileText className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Documents</div>
                    <div className="text-sm text-gray-500">Review & approve</div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 justify-start h-auto p-4"
                  onClick={() => setActiveTab('notifications')}
                >
                  <Bell className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Notifications</div>
                    <div className="text-sm text-gray-500">
                      {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                    </div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 justify-start h-auto p-4"
                >
                  <MessageSquare className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Messages</div>
                    <div className="text-sm text-gray-500">Communicate with team</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onProjectSelect?.(project.id)}>
                <CardHeader>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                      {project.status}
                    </Badge>
                    <span className="text-sm text-gray-500">{project.progress}% complete</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                    
                    {project.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                    )}
                    
                    {project.milestones && project.milestones.length > 0 && (
                      <div className="space-y-1">
                        <h5 className="text-sm font-medium text-gray-700">Next Milestones:</h5>
                        {project.milestones.slice(0, 2).map((milestone) => (
                          <div key={milestone.id} className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {milestone.name} - {format(new Date(milestone.date), 'MMM d')}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Users className="w-3 h-3" />
                        {project.team?.length || 0} team members
                      </div>
                      <Button size="sm" variant="ghost">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {projects.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <FolderOpen className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Available</h3>
                <p className="text-gray-600">You don't have access to any projects yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Mobile-only tabs */}
        {mobileOptimized && (
          <>
            <TabsContent value="notifications" className="space-y-4">
              {/* Notifications content - will be implemented in notification components */}
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Notifications</h3>
                    <p className="text-gray-600">Your notifications will appear here.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              {/* Activity content */}
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Activity</h3>
                    <p className="text-gray-600">Your recent activity will appear here.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}