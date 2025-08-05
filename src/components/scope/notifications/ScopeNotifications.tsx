/**
 * Scope Change Notifications System
 * Real-time notifications for scope item changes
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bell,
  BellOff,
  Check,
  X,
  User,
  Clock,
  Tag,
  Building,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Edit,
  Trash2,
  Plus,
  Settings,
  Filter,
  MarkAsRead
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface ScopeNotification {
  id: string;
  type: 'item_created' | 'item_updated' | 'item_deleted' | 'status_changed' | 'assigned' | 'supplier_changed' | 'cost_updated' | 'due_date_approaching' | 'overdue';
  scope_item: {
    id: string;
    item_code?: string;
    item_no: number;
    description: string;
  };
  project: {
    id: string;
    name: string;
  };
  actor: {
    id: string;
    name: string;
    avatar?: string;
  };
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface NotificationPreferences {
  enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  notification_types: {
    item_created: boolean;
    item_updated: boolean;
    item_deleted: boolean;
    status_changed: boolean;
    assigned: boolean;
    supplier_changed: boolean;
    cost_updated: boolean;
    due_date_approaching: boolean;
    overdue: boolean;
  };
  frequency: 'immediate' | 'hourly' | 'daily';
}

interface ScopeNotificationsProps {
  projectId?: string;
  maxNotifications?: number;
  showSettings?: boolean;
}

const NOTIFICATION_ICONS = {
  item_created: Plus,
  item_updated: Edit,
  item_deleted: Trash2,
  status_changed: Tag,
  assigned: User,
  supplier_changed: Building,
  cost_updated: DollarSign,
  due_date_approaching: Clock,
  overdue: AlertCircle
};

const NOTIFICATION_COLORS = {
  item_created: 'text-green-500',
  item_updated: 'text-blue-500',
  item_deleted: 'text-red-500',
  status_changed: 'text-purple-500',
  assigned: 'text-orange-500',
  supplier_changed: 'text-cyan-500',
  cost_updated: 'text-yellow-500',
  due_date_approaching: 'text-amber-500',
  overdue: 'text-red-600'
};

const PRIORITY_COLORS = {
  low: 'bg-gray-500',
  medium: 'bg-blue-500',
  high: 'bg-red-500'
};

export function ScopeNotifications({
  projectId,
  maxNotifications = 50,
  showSettings = true
}: ScopeNotificationsProps) {
  const { profile, getAccessToken } = useAuth();
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState<ScopeNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: true,
    email_notifications: true,
    push_notifications: false,
    notification_types: {
      item_created: true,
      item_updated: true,
      item_deleted: true,
      status_changed: true,
      assigned: true,
      supplier_changed: true,
      cost_updated: true,
      due_date_approaching: true,
      overdue: true
    },
    frequency: 'immediate'
  });
  
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');
  const [showPreferences, setShowPreferences] = useState(false);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) return;

      const params = new URLSearchParams();
      if (projectId) params.set('project_id', projectId);
      params.set('limit', maxNotifications.toString());

      const response = await fetch(`/api/notifications/scope?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [profile, projectId, maxNotifications, getAccessToken]);

  // Fetch preferences
  const fetchPreferences = useCallback(async () => {
    if (!profile) return;

    try {
      const token = await getAccessToken();
      if (!token) return;

      const response = await fetch('/api/notifications/preferences', {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data.data || preferences);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  }, [profile, getAccessToken, preferences]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true }
              : notification
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, read: true }))
        );
        
        toast({
          title: "All notifications marked as read",
          description: "Your notification list has been cleared",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to mark all as read",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  // Update preferences
  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newPreferences)
      });

      if (response.ok) {
        setPreferences(prev => ({ ...prev, ...newPreferences }));
        
        toast({
          title: "Preferences updated",
          description: "Your notification preferences have been saved",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to update preferences",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'high':
        return notification.priority === 'high';
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  // Load data on mount
  useEffect(() => {
    fetchNotifications();
    fetchPreferences();
  }, [fetchNotifications, fetchPreferences]);

  const renderNotification = (notification: ScopeNotification) => {
    const Icon = NOTIFICATION_ICONS[notification.type];
    const iconColor = NOTIFICATION_COLORS[notification.type];
    
    return (
      <Card 
        key={notification.id} 
        className={`cursor-pointer transition-colors hover:bg-muted/50 ${
          !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
        }`}
        onClick={() => !notification.read && markAsRead(notification.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-full bg-muted ${iconColor}`}>
              <Icon className="h-4 w-4" />
            </div>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {notification.scope_item.item_code || `Item ${notification.scope_item.item_no}`}
                  </span>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${PRIORITY_COLORS[notification.priority]} text-white`}
                  >
                    {notification.priority}
                  </Badge>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                </span>
              </div>
              
              <p className="text-sm text-muted-foreground">
                {notification.message}
              </p>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Avatar className="w-4 h-4">
                    <AvatarImage src={notification.actor.avatar} />
                    <AvatarFallback className="text-xs">
                      {notification.actor.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {notification.actor.name}
                </div>
                <span>•</span>
                <span>{notification.project.name}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Scope Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                </SelectContent>
              </Select>
              
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <Check className="h-4 w-4 mr-2" />
                  Mark All Read
                </Button>
              )}
              
              {showSettings && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowPreferences(!showPreferences)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Notification Preferences */}
      {showPreferences && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Enable notifications</Label>
              <Switch
                checked={preferences.enabled}
                onCheckedChange={(checked) => updatePreferences({ enabled: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Email notifications</Label>
              <Switch
                checked={preferences.email_notifications}
                onCheckedChange={(checked) => updatePreferences({ email_notifications: checked })}
                disabled={!preferences.enabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Push notifications</Label>
              <Switch
                checked={preferences.push_notifications}
                onCheckedChange={(checked) => updatePreferences({ push_notifications: checked })}
                disabled={!preferences.enabled}
              />
            </div>

            <div className="space-y-2">
              <Label>Notification frequency</Label>
              <Select 
                value={preferences.frequency} 
                onValueChange={(value: any) => updatePreferences({ frequency: value })}
                disabled={!preferences.enabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="hourly">Hourly digest</SelectItem>
                  <SelectItem value="daily">Daily digest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Notification types</Label>
              {Object.entries(preferences.notification_types).map(([type, enabled]) => (
                <div key={type} className="flex items-center justify-between">
                  <Label className="text-sm capitalize">
                    {type.replace('_', ' ')}
                  </Label>
                  <Switch
                    checked={enabled}
                    onCheckedChange={(checked) => 
                      updatePreferences({
                        notification_types: {
                          ...preferences.notification_types,
                          [type]: checked
                        }
                      })
                    }
                    disabled={!preferences.enabled}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BellOff className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notifications</h3>
              <p className="text-muted-foreground">
                {filter === 'unread' 
                  ? "You're all caught up! No unread notifications."
                  : filter === 'high'
                  ? "No high priority notifications at the moment."
                  : "You don't have any notifications yet."
                }
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-1 p-4">
                {filteredNotifications.map(renderNotification)}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}