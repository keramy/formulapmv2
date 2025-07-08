'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Clock,
  Users,
  FileText,
  Calendar,
  MessageSquare,
  Settings,
  Filter,
  MoreVertical,
  X
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  category: 'project' | 'task' | 'client' | 'system' | 'approval';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
  priority: 'low' | 'medium' | 'high';
  from?: {
    name: string;
    role: string;
  };
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'warning',
    category: 'project',
    title: 'Project Milestone Overdue',
    message: 'The foundation milestone for Riverside Construction project is 3 days overdue.',
    timestamp: '2024-01-15T10:30:00Z',
    read: false,
    priority: 'high',
    actionUrl: '/projects/1',
    actionText: 'View Project',
    from: {
      name: 'System',
      role: 'Automated'
    }
  },
  {
    id: '2',
    type: 'info',
    category: 'approval',
    title: 'Document Approval Required',
    message: 'Shop drawings for steel beams require your approval.',
    timestamp: '2024-01-15T09:15:00Z',
    read: false,
    priority: 'medium',
    actionUrl: '/documents/pending',
    actionText: 'Review Documents',
    from: {
      name: 'John Smith',
      role: 'Project Manager'
    }
  },
  {
    id: '3',
    type: 'success',
    category: 'task',
    title: 'Task Completed',
    message: 'Electrical inspection has been completed successfully.',
    timestamp: '2024-01-15T08:45:00Z',
    read: true,
    priority: 'low',
    actionUrl: '/scope/123',
    actionText: 'View Task',
    from: {
      name: 'Sarah Johnson',
      role: 'Site Supervisor'
    }
  },
  {
    id: '4',
    type: 'info',
    category: 'client',
    title: 'New Client Message',
    message: 'You have a new message from Premium Build Co regarding the timeline.',
    timestamp: '2024-01-14T16:20:00Z',
    read: false,
    priority: 'medium',
    actionUrl: '/client-portal/messages',
    actionText: 'View Message',
    from: {
      name: 'Mike Brown',
      role: 'Client'
    }
  },
  {
    id: '5',
    type: 'warning',
    category: 'system',
    title: 'System Maintenance Scheduled',
    message: 'System maintenance is scheduled for tonight at 11 PM EST.',
    timestamp: '2024-01-14T14:00:00Z',
    read: true,
    priority: 'low',
    from: {
      name: 'System Admin',
      role: 'Administrator'
    }
  }
];

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || notification.category === filter;
    const matchesReadStatus = !showUnreadOnly || !notification.read;
    return matchesFilter && matchesReadStatus;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'error': return AlertTriangle;
      case 'info': return Info;
      default: return Bell;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'project': return Calendar;
      case 'task': return CheckCircle;
      case 'client': return Users;
      case 'approval': return FileText;
      case 'system': return Settings;
      default: return Bell;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMs = now.getTime() - time.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600">Please log in to view notifications.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-8 h-8" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </h1>
          <p className="text-gray-600">Stay updated with your project activities</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowUnreadOnly(!showUnreadOnly)}>
            {showUnreadOnly ? 'Show All' : 'Show Unread'}
          </Button>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead}>
              Mark All as Read
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 pb-4 border-b">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter by:</span>
        </div>
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'All', icon: Bell },
            { id: 'project', label: 'Projects', icon: Calendar },
            { id: 'task', label: 'Tasks', icon: CheckCircle },
            { id: 'client', label: 'Clients', icon: Users },
            { id: 'approval', label: 'Approvals', icon: FileText },
            { id: 'system', label: 'System', icon: Settings }
          ].map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={filter === id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(id)}
              className="flex items-center gap-2"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-600">
                {showUnreadOnly 
                  ? "You're all caught up! No unread notifications." 
                  : "No notifications found for the selected filter."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => {
            const Icon = getIcon(notification.type);
            const CategoryIcon = getCategoryIcon(notification.category);
            
            return (
              <Card 
                key={notification.id} 
                className={`transition-all duration-200 hover:shadow-md ${
                  !notification.read ? 'border-blue-200 bg-blue-50/30' : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getTypeColor(notification.type)}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className={`text-lg font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h3>
                        <Badge className={getPriorityColor(notification.priority)}>
                          {notification.priority}
                        </Badge>
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <CategoryIcon className="w-4 h-4" />
                          <span>{notification.category}</span>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>

                      <p className="text-gray-600 mb-3">{notification.message}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>{formatTimeAgo(notification.timestamp)}</span>
                          </div>
                          {notification.from && (
                            <div className="flex items-center space-x-2">
                              <Avatar className="w-5 h-5">
                                <AvatarFallback className="text-xs">
                                  {notification.from.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span>{notification.from.name}</span>
                              <span className="text-gray-400">•</span>
                              <span>{notification.from.role}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          {notification.actionUrl && (
                            <Button size="sm" variant="outline">
                              {notification.actionText || 'View'}
                            </Button>
                          )}
                          {!notification.read && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Mark as Read
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}