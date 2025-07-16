// ============================================================================
// V3 PM Dashboard - Critical Alerts Component
// ============================================================================
// Built with optimization patterns: DataStateWrapper, real-time monitoring
// Features: Critical issues tracking, priority alerts, action-oriented
// ============================================================================

'use client'

import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataStateWrapper } from '@/components/ui/loading-states'
import { 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Users, 
  FileX, 
  Calendar,
  TrendingDown,
  Bell,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'

// Mock data hook - will be replaced with real API integration
function useCriticalAlerts() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Mock critical alerts data
  const mockAlerts = [
    {
      id: 'alert1',
      type: 'budget_overrun',
      severity: 'urgent',
      title: 'Budget overrun detected',
      description: 'Downtown Office Complex exceeds budget by 12%',
      project: { id: 'proj1', name: 'Downtown Office Complex' },
      amount: 300000,
      threshold: 2500000,
      timestamp: '2024-01-15T14:30:00Z',
      action_required: true,
      estimated_resolution: '2h'
    },
    {
      id: 'alert2',
      type: 'schedule_delay',
      severity: 'high',
      title: 'Critical path delay',
      description: 'Foundation milestone delayed by 5 days',
      project: { id: 'proj2', name: 'Residential Complex Phase 2' },
      delay_days: 5,
      impact_cost: 50000,
      timestamp: '2024-01-15T13:45:00Z',
      action_required: true,
      estimated_resolution: '1 day'
    },
    {
      id: 'alert3',
      type: 'safety_incident',
      severity: 'urgent',
      title: 'Safety incident reported',
      description: 'Minor injury in Section B - requires immediate attention',
      project: { id: 'proj1', name: 'Downtown Office Complex' },
      incident_type: 'minor_injury',
      requires_reporting: true,
      timestamp: '2024-01-15T12:15:00Z',
      action_required: true,
      estimated_resolution: '4h'
    },
    {
      id: 'alert4',
      type: 'quality_issue',
      severity: 'high',
      title: 'Quality standards not met',
      description: 'Concrete quality issues in Phase 1 foundation',
      project: { id: 'proj3', name: 'Industrial Warehouse Renovation' },
      inspection_failed: true,
      rework_required: true,
      timestamp: '2024-01-15T11:00:00Z',
      action_required: true,
      estimated_resolution: '3 days'
    },
    {
      id: 'alert5',
      type: 'resource_shortage',
      severity: 'medium',
      title: 'Critical resource shortage',
      description: 'Steel delivery delayed - affects construction timeline',
      project: { id: 'proj2', name: 'Residential Complex Phase 2' },
      resource_type: 'materials',
      supplier: 'Steel Corp Inc',
      timestamp: '2024-01-15T10:30:00Z',
      action_required: true,
      estimated_resolution: '1 week'
    },
    {
      id: 'alert6',
      type: 'team_availability',
      severity: 'medium',
      title: 'Key team member unavailable',
      description: 'Lead architect on sick leave - backup required',
      project: { id: 'proj1', name: 'Downtown Office Complex' },
      team_member: 'Sarah Johnson',
      role: 'Lead Architect',
      timestamp: '2024-01-15T09:00:00Z',
      action_required: false,
      estimated_resolution: '1 week'
    }
  ]

  const refetch = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 500)
  }

  return { 
    data: mockAlerts, 
    loading, 
    error, 
    refetch 
  }
}

// ============================================================================
// TYPES
// ============================================================================

interface CriticalAlert {
  id: string
  type: string
  severity: 'urgent' | 'high' | 'medium' | 'low'
  title: string
  description: string
  project: { id: string; name: string }
  timestamp: string
  action_required: boolean
  estimated_resolution: string
  [key: string]: any // For type-specific properties
}

interface CriticalAlertsProps {
  userId?: string
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const CriticalAlerts: React.FC<CriticalAlertsProps> = ({ userId }) => {
  const { profile } = useAuth()
  const router = useRouter()
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
  const [showActionRequired, setShowActionRequired] = useState(false)

  // Data fetching
  const { data: alerts, loading, error, refetch } = useCriticalAlerts()

  // Filter alerts
  const filteredAlerts = alerts?.filter(alert => {
    const severityMatch = selectedSeverity === 'all' || alert.severity === selectedSeverity
    const actionMatch = !showActionRequired || alert.action_required
    return severityMatch && actionMatch
  }) || []

  // Sort by severity and timestamp
  const sortedAlerts = filteredAlerts.sort((a, b) => {
    const severityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity]
    if (severityDiff !== 0) return severityDiff
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })

  // Calculate summary stats
  const urgentAlerts = alerts?.filter(a => a.severity === 'urgent').length || 0
  const actionRequiredAlerts = alerts?.filter(a => a.action_required).length || 0
  const totalAlerts = alerts?.length || 0

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleViewProject = (projectId: string) => {
    router.push(`/projects/${projectId}`)
  }

  const handleTakeAction = (alert: CriticalAlert) => {
    // Navigate to appropriate action page based on alert type
    switch (alert.type) {
      case 'budget_overrun':
        router.push(`/projects/${alert.project.id}?tab=financial`)
        break
      case 'schedule_delay':
        router.push(`/projects/${alert.project.id}?tab=milestones`)
        break
      case 'safety_incident':
        router.push(`/projects/${alert.project.id}?tab=safety`)
        break
      case 'quality_issue':
        router.push(`/projects/${alert.project.id}?tab=quality`)
        break
      case 'resource_shortage':
        router.push(`/projects/${alert.project.id}?tab=procurement`)
        break
      case 'team_availability':
        router.push(`/projects/${alert.project.id}?tab=team`)
        break
      default:
        router.push(`/projects/${alert.project.id}`)
    }
  }

  const handleDismissAlert = (alertId: string) => {
    // TODO: Implement alert dismissal API call
    console.log('Dismissing alert:', alertId)
    refetch()
  }

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'budget_overrun': return <DollarSign className="h-4 w-4 text-red-600" />
      case 'schedule_delay': return <Calendar className="h-4 w-4 text-orange-600" />
      case 'safety_incident': return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'quality_issue': return <FileX className="h-4 w-4 text-orange-600" />
      case 'resource_shortage': return <TrendingDown className="h-4 w-4 text-yellow-600" />
      case 'team_availability': return <Users className="h-4 w-4 text-blue-600" />
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />
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

  const getTypeLabel = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // ============================================================================
  // ALERT ITEM COMPONENT
  // ============================================================================

  const AlertItem: React.FC<{ alert: CriticalAlert }> = ({ alert }) => (
    <div className={`group p-4 border-l-4 rounded-lg hover:shadow-md transition-all duration-200 bg-white ${
      alert.severity === 'urgent' ? 'border-l-red-500' : 
      alert.severity === 'high' ? 'border-l-orange-500' : 
      alert.severity === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {/* Icon */}
          <div className="flex-shrink-0 mt-1">
            {getAlertIcon(alert.type)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                {alert.title}
              </h4>
              <Badge className={getSeverityColor(alert.severity)} variant="secondary">
                {alert.severity.toUpperCase()}
              </Badge>
              {alert.action_required && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <Bell className="h-3 w-3" />
                  Action Required
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {alert.description}
            </p>
            
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatTimeAgo(alert.timestamp)}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <span className="font-medium">{getTypeLabel(alert.type)}</span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewProject(alert.project.id)}
                className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800"
              >
                {alert.project.name}
              </Button>
              
              {alert.estimated_resolution && (
                <div className="flex items-center gap-1">
                  <span>Est: {alert.estimated_resolution}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="ml-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {alert.action_required && (
            <Button
              variant="default"
              size="sm"
              onClick={() => handleTakeAction(alert)}
              className="h-8 px-3 text-xs"
            >
              Take Action
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDismissAlert(alert.id)}
            className="h-8 w-8 p-0"
          >
            <CheckCircle2 className="h-3 w-3" />
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
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Critical Alerts
            </CardTitle>
            <CardDescription>
              Issues requiring immediate attention ({totalAlerts} total)
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            {['all', 'urgent', 'high', 'medium'].map((severity) => (
              <Button
                key={severity}
                variant={selectedSeverity === severity ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSeverity(severity)}
                className="capitalize"
              >
                {severity}
              </Button>
            ))}
            
            <Button
              variant={showActionRequired ? "default" : "outline"}
              size="sm"
              onClick={() => setShowActionRequired(!showActionRequired)}
              className="flex items-center gap-1"
            >
              <Bell className="h-3 w-3" />
              Action Required
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{urgentAlerts}</div>
            <div className="text-sm text-red-700">Urgent</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{actionRequiredAlerts}</div>
            <div className="text-sm text-orange-700">Action Required</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalAlerts}</div>
            <div className="text-sm text-blue-700">Total Alerts</div>
          </div>
        </div>

        {/* Alerts List */}
        <DataStateWrapper
          loading={loading}
          error={error}
          data={sortedAlerts}
          onRetry={refetch}
          emptyMessage="No critical alerts"
          emptyDescription="All systems running smoothly!"
          loadingComponent={
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
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
            {sortedAlerts.map(alert => (
              <AlertItem key={alert.id} alert={alert} />
            ))}
          </div>
        </DataStateWrapper>
      </CardContent>
    </Card>
  )
}

export default CriticalAlerts