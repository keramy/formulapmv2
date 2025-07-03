/**
 * Client Portal Dashboard Card
 * Integration card for internal Formula PM dashboard showing client portal metrics
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Users, 
  FileText, 
  MessageSquare, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Settings,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'
import { usePermissions } from '@/hooks/usePermissions'

interface ClientPortalMetrics {
  active_clients: number
  pending_approvals: number
  unread_messages: number
  recent_activities: Array<{
    id: string
    client_name: string
    action: string
    timestamp: Date
    type: 'approval' | 'message' | 'login' | 'document_view'
  }>
  client_satisfaction: {
    score: number
    trend: 'up' | 'down' | 'stable'
  }
}

export const ClientPortalCard = () => {
  const { canViewClientPortalAdmin, canViewClientPortalAnalytics } = usePermissions()
  const [metrics, setMetrics] = useState<ClientPortalMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch client portal metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        if (!canViewClientPortalAdmin()) {
          setLoading(false)
          return
        }

        const response = await fetch('/api/client-portal/admin/metrics', {
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error('Failed to fetch client portal metrics')
        }

        const data = await response.json()
        if (data.success) {
          setMetrics(data.data)
        } else {
          throw new Error(data.error || 'Failed to load metrics')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load metrics')
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [canViewClientPortalAdmin])

  // Don't render if user doesn't have permissions
  if (!canViewClientPortalAdmin()) {
    return null
  }

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-4 h-4" />
            Client Portal Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Client Portal
          </CardTitle>
          <CardDescription>External client access system</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No client portal data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Client Portal
            </CardTitle>
            <CardDescription>External client access & collaboration</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {canViewClientPortalAnalytics() && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/client-portal/admin/analytics">
                  <TrendingUp className="w-4 h-4" />
                  Analytics
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" asChild>
              <Link href="/client-portal/admin">
                <Settings className="w-4 h-4" />
                Admin
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium">{metrics.active_clients}</p>
              <p className="text-xs text-muted-foreground">Active Clients</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium">{metrics.pending_approvals}</p>
              <p className="text-xs text-muted-foreground">Pending Approvals</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium">{metrics.unread_messages}</p>
              <p className="text-xs text-muted-foreground">New Messages</p>
            </div>
          </div>
        </div>

        {/* Client Satisfaction */}
        {canViewClientPortalAnalytics() && (
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">Client Satisfaction</p>
                <p className="text-xs text-blue-700">Based on recent feedback</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-blue-900">
                {metrics.client_satisfaction.score}%
              </span>
              <Badge 
                variant={metrics.client_satisfaction.trend === 'up' ? 'default' : 'secondary'}
                className={
                  metrics.client_satisfaction.trend === 'up' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }
              >
                {metrics.client_satisfaction.trend === 'up' ? '↗' : 
                 metrics.client_satisfaction.trend === 'down' ? '↘' : '→'}
              </Badge>
            </div>
          </div>
        )}

        {/* Recent Activities */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Recent Client Activity</h4>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/client-portal/admin/activities">
                <Activity className="w-3 h-3 mr-1" />
                View All
              </Link>
            </Button>
          </div>
          
          <div className="space-y-2">
            {metrics.recent_activities.slice(0, 3).map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs">
                    {activity.client_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate">
                    <span className="font-medium">{activity.client_name}</span>
                    {' '}
                    {activity.action}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    activity.type === 'approval' ? 'border-orange-200 text-orange-700' :
                    activity.type === 'message' ? 'border-blue-200 text-blue-700' :
                    activity.type === 'login' ? 'border-green-200 text-green-700' :
                    'border-gray-200 text-gray-700'
                  }`}
                >
                  {activity.type === 'approval' && <Clock className="w-2 h-2 mr-1" />}
                  {activity.type === 'message' && <MessageSquare className="w-2 h-2 mr-1" />}
                  {activity.type === 'login' && <Users className="w-2 h-2 mr-1" />}
                  {activity.type === 'document_view' && <FileText className="w-2 h-2 mr-1" />}
                  {activity.type}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href="/client-portal/admin/users">
              <Users className="w-3 h-3 mr-1" />
              Manage Users
            </Link>
          </Button>
          
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href="/client-portal/admin/access">
              <ExternalLink className="w-3 h-3 mr-1" />
              Access Control
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}