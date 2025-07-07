/**
 * Client Notification Center Component
 * Centralized notification management for external clients
 * Mobile-first responsive design with real-time updates
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Bell, 
  CheckCircle, 
  X, 
  Search, 
  Filter,
  Check,
  Trash2,
  Eye,
  Calendar,
  FileText,
  MessageSquare,
  AlertTriangle,
  Info,
  CheckSquare,
  Clock,
  Settings
} from 'lucide-react'
import { 
  ClientNotification, 
  ClientNotificationType, 
  ClientPriority,
  ClientNotificationFilters 
} from '@/types/client-portal'
import { useClientNotifications } from '@/hooks/useClientPortal'
import { format, formatDistanceToNow, isToday, isYesterday, startOfDay } from 'date-fns'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ClientNotificationCenterProps {
  onNotificationClick?: (notification: ClientNotification) => void
  onSettingsChange?: (preferences: any) => void
  mobileOptimized?: boolean
}

export const ClientNotificationCenter: React.FC<ClientNotificationCenterProps> = ({
  onNotificationClick,
  onSettingsChange,
  mobileOptimized = true
}) => {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  } = useClientNotifications()

  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<ClientNotificationFilters>({
    page: 1,
    limit: 50,
    sort_field: 'created_at',
    sort_direction: 'desc'
  })
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [notificationPreferences, setNotificationPreferences] = useState({
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    notification_types: {
      document_submitted: { enabled: true, delivery_methods: ['in_app', 'email'] },
      approval_required: { enabled: true, delivery_methods: ['in_app', 'email'] },
      approval_received: { enabled: true, delivery_methods: ['in_app'] },
      project_milestone: { enabled: true, delivery_methods: ['in_app', 'email'] },
      schedule_change: { enabled: true, delivery_methods: ['in_app', 'email'] },
      budget_update: { enabled: false, delivery_methods: ['in_app'] },
      quality_issue: { enabled: true, delivery_methods: ['in_app', 'email'] },
      delivery_notification: { enabled: true, delivery_methods: ['in_app'] },
      message_received: { enabled: true, delivery_methods: ['in_app'] },
      system_announcement: { enabled: true, delivery_methods: ['in_app', 'email'] }
    }
  })

  // Notification type configurations
  const notificationTypeConfig: Record<ClientNotificationType, {
    icon: React.ReactNode
    color: string
    bgColor: string
    label: string
    description: string
  }> = {
    document_submitted: {
      icon: <FileText className="w-4 h-4" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      label: 'Document Submitted',
      description: 'New document available for review'
    },
    approval_required: {
      icon: <AlertTriangle className="w-4 h-4" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      label: 'Approval Required',
      description: 'Document needs your approval'
    },
    approval_received: {
      icon: <CheckCircle className="w-4 h-4" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      label: 'Approval Received',
      description: 'Your approval has been processed'
    },
    project_milestone: {
      icon: <Calendar className="w-4 h-4" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      label: 'Project Milestone',
      description: 'Project milestone update'
    },
    schedule_change: {
      icon: <Clock className="w-4 h-4" />,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      label: 'Schedule Change',
      description: 'Project schedule has been updated'
    },
    budget_update: {
      icon: <Info className="w-4 h-4" />,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      label: 'Budget Update',
      description: 'Project budget information'
    },
    quality_issue: {
      icon: <AlertTriangle className="w-4 h-4" />,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      label: 'Quality Issue',
      description: 'Quality concern reported'
    },
    delivery_notification: {
      icon: <CheckSquare className="w-4 h-4" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      label: 'Delivery Notification',
      description: 'Item delivered or completed'
    },
    message_received: {
      icon: <MessageSquare className="w-4 h-4" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      label: 'Message Received',
      description: 'New message in communication thread'
    },
    system_announcement: {
      icon: <Info className="w-4 h-4" />,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      label: 'System Announcement',
      description: 'System or platform update'
    }
  }

  // Priority configurations
  const priorityConfig: Record<ClientPriority, {
    color: string
    bgColor: string
    label: string
  }> = {
    low: { color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Low' },
    medium: { color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Medium' },
    high: { color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'High' },
    urgent: { color: 'text-red-600', bgColor: 'bg-red-100', label: 'Urgent' }
  }

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = !searchTerm || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = !filters.notification_type?.length || 
      filters.notification_type.includes(notification.notification_type)
    
    const matchesPriority = !filters.priority?.length || 
      filters.priority.includes(notification.priority)
    
    const matchesRead = filters.is_read === undefined || 
      notification.is_read === filters.is_read

    return matchesSearch && matchesType && matchesPriority && matchesRead
  })

  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
    const date = startOfDay(new Date(notification.created_at))
    const key = date.toISOString()
    
    if (!groups[key]) {
      groups[key] = {
        date,
        notifications: []
      }
    }
    
    groups[key].notifications.push(notification)
    return groups
  }, {} as Record<string, { date: Date; notifications: ClientNotification[] }>)

  // Get date label
  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today'
    if (isYesterday(date)) return 'Yesterday'
    return format(date, 'EEEE, MMMM d')
  }

  // Handle notification click
  const handleNotificationClick = useCallback(async (notification: ClientNotification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }
    onNotificationClick?.(notification)
  }, [markAsRead, onNotificationClick])

  // Handle filter change
  const handleFilterChange = useCallback((newFilters: Partial<ClientNotificationFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  // Handle bulk selection
  const handleSelectNotification = useCallback((notificationId: string, selected: boolean) => {
    setSelectedNotifications(prev => 
      selected 
        ? [...prev, notificationId]
        : prev.filter(id => id !== notificationId)
    )
  }, [])

  const handleSelectAll = useCallback((selected: boolean) => {
    setSelectedNotifications(selected ? filteredNotifications.map(n => n.id) : [])
  }, [filteredNotifications])

  // Handle bulk actions
  const handleBulkMarkAsRead = useCallback(async () => {
    const unreadSelected = selectedNotifications.filter(id => 
      notifications.find(n => n.id === id && !n.is_read)
    )
    
    await Promise.all(unreadSelected.map(id => markAsRead(id)))
    setSelectedNotifications([])
  }, [selectedNotifications, notifications, markAsRead])

  // Fetch notifications when filters change
  useEffect(() => {
    fetchNotifications(filters)
  }, [filters, fetchNotifications])

  // Get available types and priorities for filtering
  const availableTypes = [...new Set(notifications.map(n => n.notification_type))]
  const availablePriorities = [...new Set(notifications.map(n => n.priority))]

  if (loading && notifications.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount} unread
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Stay updated on project activities and important information
              </p>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark All Read
                </Button>
              )}

              <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Notification Preferences</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    {/* Global Settings */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Delivery Methods</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="email-notifications">Email Notifications</Label>
                          <Switch
                            id="email-notifications"
                            checked={notificationPreferences.email_notifications}
                            onCheckedChange={(checked) => 
                              setNotificationPreferences(prev => ({ ...prev, email_notifications: checked }))
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="push-notifications">Push Notifications</Label>
                          <Switch
                            id="push-notifications"
                            checked={notificationPreferences.push_notifications}
                            onCheckedChange={(checked) => 
                              setNotificationPreferences(prev => ({ ...prev, push_notifications: checked }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Type-specific Settings */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Notification Types</h4>
                      <div className="space-y-3">
                        {Object.entries(notificationTypeConfig).map(([type, config]) => (
                          <div key={type} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 ${config.color}`}>
                                  {config.icon}
                                </div>
                                <Label className="text-sm">{config.label}</Label>
                              </div>
                              <Switch
                                checked={notificationPreferences.notification_types[type as ClientNotificationType]?.enabled || false}
                                onCheckedChange={(checked) => 
                                  setNotificationPreferences(prev => ({
                                    ...prev,
                                    notification_types: {
                                      ...prev.notification_types,
                                      [type]: {
                                        ...prev.notification_types[type as ClientNotificationType],
                                        enabled: checked
                                      }
                                    }
                                  }))
                                }
                              />
                            </div>
                            <p className="text-xs text-gray-600 ml-6">{config.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => {
                          onSettingsChange?.(notificationPreferences)
                          setSettingsDialogOpen(false)
                        }}
                        className="flex-1"
                      >
                        Save Preferences
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setSettingsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        {/* Search and Filters */}
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              {/* Filters Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                    {(filters.notification_type?.length || filters.priority?.length || filters.is_read !== undefined) && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Active
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {/* Read Status */}
                  <div className="px-2 py-1 text-sm font-medium text-gray-700">Status</div>
                  <DropdownMenuCheckboxItem
                    checked={filters.is_read === false}
                    onCheckedChange={(checked) => {
                      handleFilterChange({ is_read: checked ? false : undefined })
                    }}
                  >
                    Unread Only
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.is_read === true}
                    onCheckedChange={(checked) => {
                      handleFilterChange({ is_read: checked ? true : undefined })
                    }}
                  >
                    Read Only
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuSeparator />

                  {/* Notification Types */}
                  <div className="px-2 py-1 text-sm font-medium text-gray-700">Type</div>
                  {availableTypes.map(type => {
                    const config = notificationTypeConfig[type]
                    return (
                      <DropdownMenuCheckboxItem
                        key={type}
                        checked={filters.notification_type?.includes(type) || false}
                        onCheckedChange={(checked) => {
                          const types = filters.notification_type || []
                          handleFilterChange({
                            notification_type: checked 
                              ? [...types, type]
                              : types.filter(t => t !== type)
                          })
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {config.icon}
                          {config.label}
                        </div>
                      </DropdownMenuCheckboxItem>
                    )
                  })}

                  <DropdownMenuSeparator />

                  {/* Priority */}
                  <div className="px-2 py-1 text-sm font-medium text-gray-700">Priority</div>
                  {availablePriorities.map(priority => (
                    <DropdownMenuCheckboxItem
                      key={priority}
                      checked={filters.priority?.includes(priority) || false}
                      onCheckedChange={(checked) => {
                        const priorities = filters.priority || []
                        handleFilterChange({
                          priority: checked 
                            ? [...priorities, priority]
                            : priorities.filter(p => p !== priority)
                        })
                      }}
                    >
                      {priorityConfig[priority].label}
                    </DropdownMenuCheckboxItem>
                  ))}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => handleFilterChange({
                      notification_type: undefined,
                      priority: undefined,
                      is_read: undefined
                    })}
                    className="text-red-600"
                  >
                    Clear Filters
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedNotifications.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-blue-700">
                {selectedNotifications.length} notification{selectedNotifications.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleBulkMarkAsRead}>
                  <Check className="w-4 h-4 mr-2" />
                  Mark as Read
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedNotifications([])}>
                  Clear Selection
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications List */}
      {Object.keys(groupedNotifications).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedNotifications)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([dateKey, { date, notifications: dayNotifications }]) => (
            <Card key={dateKey}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {getDateLabel(date)}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {dayNotifications.length} notification{dayNotifications.length > 1 ? 's' : ''}
                    </span>
                    <input
                      type="checkbox"
                      checked={dayNotifications.every(n => selectedNotifications.includes(n.id))}
                      onChange={(e) => {
                        const dayIds = dayNotifications.map(n => n.id)
                        if (e.target.checked) {
                          setSelectedNotifications(prev => [...new Set([...prev, ...dayIds])])
                        } else {
                          setSelectedNotifications(prev => prev.filter(id => !dayIds.includes(id)))
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-0">
                {dayNotifications.map((notification, index) => {
                  const config = notificationTypeConfig[notification.notification_type]
                  const priorityConfig_ = priorityConfig[notification.priority]
                  const isSelected = selectedNotifications.includes(notification.id)

                  return (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-4 p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !notification.is_read ? 'bg-blue-50' : ''
                      } ${isSelected ? 'bg-blue-100' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      {/* Selection Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation()
                          handleSelectNotification(notification.id, e.target.checked)
                        }}
                        className="w-4 h-4 text-blue-600 rounded mt-1"
                      />

                      {/* Notification Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.bgColor} mt-1`}>
                        <div className={config.color}>
                          {config.icon}
                        </div>
                      </div>

                      {/* Notification Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`font-medium text-sm ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                              </h4>
                              {!notification.is_read && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className={`${config.bgColor} ${config.color} border-0 text-xs`}>
                                {config.label}
                              </Badge>
                              {notification.priority !== 'medium' && (
                                <Badge className={`${priorityConfig_.bgColor} ${priorityConfig_.color} border-0 text-xs`}>
                                  {priorityConfig_.label}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <time className="text-xs text-gray-500">
                              {format(new Date(notification.created_at), 'h:mm a')}
                            </time>
                            {!notification.is_read && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  markAsRead(notification.id)
                                }}
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filteredNotifications.length === 0 && notifications.length > 0 
                ? 'No Matching Notifications'
                : 'No Notifications'
              }
            </h3>
            <p className="text-gray-600 max-w-md">
              {filteredNotifications.length === 0 && notifications.length > 0
                ? 'No notifications match your current search and filter criteria.'
                : 'You\'re all caught up! New notifications will appear here when you receive them.'
              }
            </p>
            {filteredNotifications.length === 0 && notifications.length > 0 && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchTerm('')
                  setFilters({ page: 1, limit: 50, sort_field: 'created_at', sort_direction: 'desc' })
                }}
              >
                Clear Search and Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}