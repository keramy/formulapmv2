/**
 * Recent Activity Feed Component
 * Shows client's recent activities and system events
 * Mobile-optimized timeline view
 */

'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Clock, 
  Eye, 
  Download, 
  CheckCircle, 
  MessageSquare, 
  FolderOpen,
  FileText,
  Bell,
  User,
  Calendar,
  Zap,
  Filter,
  RefreshCw
} from 'lucide-react'
import { ClientActivityLog, ClientActivityType } from '@/types/client-portal'
import { formatDistanceToNow, format, isToday, isYesterday, startOfDay } from 'date-fns'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu'

interface RecentActivityFeedProps {
  activities: ClientActivityLog[]
  loading?: boolean
  onRefresh?: () => void
  onActivityClick?: (activity: ClientActivityLog) => void
  maxItems?: number
  showFilters?: boolean
  mobileOptimized?: boolean
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  activities,
  loading = false,
  onRefresh,
  onActivityClick,
  maxItems = 50,
  showFilters = true,
  mobileOptimized = true
}) => {
  const [selectedTypes, setSelectedTypes] = useState<ClientActivityType[]>([])
  const [showAllTime, setShowAllTime] = useState(false)

  // Activity type configurations
  const activityTypeConfig: Record<ClientActivityType, {
    icon: React.ReactNode
    color: string
    label: string
    description: string
  }> = {
    login: {
      icon: <User className="w-4 h-4" />,
      color: 'bg-green-500',
      label: 'Logged In',
      description: 'Signed into the portal'
    },
    logout: {
      icon: <User className="w-4 h-4" />,
      color: 'bg-gray-500',
      label: 'Logged Out',
      description: 'Signed out of the portal'
    },
    document_view: {
      icon: <Eye className="w-4 h-4" />,
      color: 'bg-blue-500',
      label: 'Viewed Document',
      description: 'Opened a document'
    },
    document_download: {
      icon: <Download className="w-4 h-4" />,
      color: 'bg-purple-500',
      label: 'Downloaded Document',
      description: 'Downloaded a document'
    },
    document_approve: {
      icon: <CheckCircle className="w-4 h-4" />,
      color: 'bg-green-600',
      label: 'Approved Document',
      description: 'Approved a document'
    },
    comment_add: {
      icon: <MessageSquare className="w-4 h-4" />,
      color: 'bg-orange-500',
      label: 'Added Comment',
      description: 'Added a comment'
    },
    message_send: {
      icon: <MessageSquare className="w-4 h-4" />,
      color: 'bg-blue-600',
      label: 'Sent Message',
      description: 'Sent a message'
    },
    project_access: {
      icon: <FolderOpen className="w-4 h-4" />,
      color: 'bg-indigo-500',
      label: 'Accessed Project',
      description: 'Viewed project details'
    },
    profile_update: {
      icon: <User className="w-4 h-4" />,
      color: 'bg-teal-500',
      label: 'Updated Profile',
      description: 'Modified profile settings'
    }
  }

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    // Filter by type
    if (selectedTypes.length > 0 && !selectedTypes.includes(activity.activity_type)) {
      return false
    }
    
    // Filter by time
    if (!showAllTime) {
      const activityDate = new Date(activity.created_at)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return activityDate >= weekAgo
    }
    
    return true
  }).slice(0, maxItems)

  // Group activities by date
  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const date = startOfDay(new Date(activity.created_at))
    const key = date.toISOString()
    
    if (!groups[key]) {
      groups[key] = {
        date,
        activities: []
      }
    }
    
    groups[key].activities.push(activity)
    return groups
  }, {} as Record<string, { date: Date; activities: ClientActivityLog[] }>)

  // Get date label
  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'EEEE, MMMM d')
  }

  // Toggle activity type filter
  const toggleActivityType = useCallback((type: ClientActivityType) => {
    setSelectedTypes(prev => 
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }, [])

  // Get unique activity types from current activities
  const availableTypes = [...new Set(activities.map(a => a.activity_type))]

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity Yet</h3>
            <p className="text-gray-600">Your recent activity will appear here as you use the portal.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Activity
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {showFilters && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                    {selectedTypes.length > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {selectedTypes.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuCheckboxItem
                    checked={showAllTime}
                    onCheckedChange={setShowAllTime}
                  >
                    Show all time
                  </DropdownMenuCheckboxItem>
                  
                  <div className="border-t my-1" />
                  
                  {availableTypes.map(type => {
                    const config = activityTypeConfig[type]
                    return (
                      <DropdownMenuCheckboxItem
                        key={type}
                        checked={selectedTypes.includes(type)}
                        onCheckedChange={() => toggleActivityType(type)}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${config.color}`} />
                          {config.label}
                        </div>
                      </DropdownMenuCheckboxItem>
                    )
                  })}
                  
                  {selectedTypes.length > 0 && (
                    <>
                      <div className="border-t my-1" />
                      <DropdownMenuItem
                        onClick={() => setSelectedTypes([])}
                        className="text-red-600"
                      >
                        Clear filters
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {Object.entries(groupedActivities)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([dateKey, { date, activities: dayActivities }]) => (
            <div key={dateKey} className="space-y-3">
              {/* Date Header */}
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium text-gray-700">
                  {getDateLabel(date)}
                </h4>
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-500">
                  {dayActivities.length} {dayActivities.length === 1 ? 'activity' : 'activities'}
                </span>
              </div>

              {/* Activities */}
              <div className="space-y-3">
                {dayActivities.map((activity, index) => {
                  const config = activityTypeConfig[activity.activity_type]
                  const isClickable = !!onActivityClick

                  return (
                    <div
                      key={activity.id}
                      className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                        isClickable 
                          ? 'hover:bg-gray-50 cursor-pointer' 
                          : ''
                      }`}
                      onClick={() => isClickable && onActivityClick?.(activity)}
                    >
                      {/* Activity Icon */}
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${config.color}`}>
                          {config.icon}
                        </div>
                      </div>

                      {/* Activity Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {activity.description || activity.action_taken}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {config.description}
                              {activity.resource_type && (
                                <span> • {activity.resource_type}</span>
                              )}
                            </p>
                          </div>
                          
                          <time className="text-xs text-gray-500 whitespace-nowrap">
                            {format(new Date(activity.created_at), 'h:mm a')}
                          </time>
                        </div>

                        {/* Metadata */}
                        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                          <div className="mt-2 text-xs text-gray-600">
                            {activity.metadata.document_name && (
                              <span className="font-medium">{activity.metadata.document_name}</span>
                            )}
                            {activity.metadata.project_name && (
                              <span className="text-gray-500"> in {activity.metadata.project_name}</span>
                            )}
                          </div>
                        )}

                        {/* Project Context */}
                        {activity.project_id && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs">
                              <FolderOpen className="w-3 h-3 mr-1" />
                              Project Activity
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Show More Button */}
          {filteredActivities.length === maxItems && activities.length > maxItems && (
            <div className="text-center pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowAllTime(true)}
              >
                View All Activity
              </Button>
            </div>
          )}

          {/* No Results */}
          {filteredActivities.length === 0 && (selectedTypes.length > 0 || !showAllTime) && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Matching Activity</h3>
              <p className="text-gray-600 mb-4">
                No activity found matching the selected filters.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedTypes([])
                  setShowAllTime(true)
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}