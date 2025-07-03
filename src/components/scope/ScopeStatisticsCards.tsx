/**
 * Formula PM 2.0 Scope Statistics Cards Component
 * Wave 2B Business Logic Implementation
 * 
 * Statistics cards for scope management dashboard with financial and progress metrics
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3,
  Clock,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Target
} from 'lucide-react'
import { ScopeStatistics } from '@/types/scope'

interface ScopeStatisticsCardsProps {
  statistics: ScopeStatistics
  progressMetrics?: any
  canViewFinancials?: boolean
}

export const ScopeStatisticsCards: React.FC<ScopeStatisticsCardsProps> = ({
  statistics,
  progressMetrics,
  canViewFinancials = false
}) => {
  // Calculate overall completion percentage
  const overallCompletion = statistics.total_items > 0 
    ? Math.round((statistics.by_status.completed / statistics.total_items) * 100)
    : 0

  // Calculate at-risk items
  const atRiskItems = statistics.by_status.blocked + statistics.by_status.on_hold
  const overdueItems = statistics.timeline.overdue

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Items & Progress */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statistics.total_items}</div>
          <Progress value={overallCompletion} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {overallCompletion}% Complete ({statistics.by_status.completed} of {statistics.total_items})
          </p>
        </CardContent>
      </Card>

      {/* In Progress Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {statistics.by_status.in_progress}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Active work items
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              Planning: {statistics.by_status.planning}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Materials: {statistics.by_status.materials_ordered}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Completed Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {statistics.by_status.completed}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Finished items
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              Quality Check: {statistics.by_status.quality_check}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Client Review: {statistics.by_status.client_review}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Issues & Risks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Issues</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {atRiskItems}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Blocked or on hold
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <Badge variant="destructive" className="text-xs">
              Blocked: {statistics.by_status.blocked}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              On Hold: {statistics.by_status.on_hold}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Timeline Status</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">On Schedule</span>
              <Badge variant="default" className="text-xs">
                {statistics.timeline.on_schedule}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Behind Schedule</span>
              <Badge variant="secondary" className="text-xs">
                {statistics.timeline.behind_schedule}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-600">Overdue</span>
              <Badge variant="destructive" className="text-xs">
                {statistics.timeline.overdue}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quality & Approvals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Quality & Approvals</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Requiring Approval</span>
              <Badge variant="secondary" className="text-xs">
                {statistics.quality.items_requiring_approval}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Pending Quality Check</span>
              <Badge variant="secondary" className="text-xs">
                {statistics.quality.items_pending_quality_check}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-600">Approved</span>
              <Badge variant="default" className="text-xs">
                {statistics.quality.items_approved}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(statistics.by_category).map(([category, stats]) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{category}</span>
                  <Badge variant="outline" className="text-xs">
                    {stats.total} items
                  </Badge>
                </div>
                <Progress value={stats.completion_percentage} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Completed: {stats.completed}</span>
                  <span>{stats.completion_percentage}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>In Progress: {stats.in_progress}</span>
                  <span>Blocked: {stats.blocked}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary (if user has permission) */}
      {canViewFinancials && statistics.financial && (
        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Financial Summary</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  ${statistics.financial.total_budget?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">Total Budget</p>
              </div>
              
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  ${statistics.financial.actual_cost?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">Actual Cost</p>
              </div>
              
              <div className="space-y-2">
                <div className={`text-2xl font-bold ${
                  (statistics.financial.cost_variance || 0) > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {statistics.financial.cost_variance && statistics.financial.cost_variance > 0 ? '+' : ''}
                  ${statistics.financial.cost_variance?.toLocaleString() || 0}
                </div>
                <div className="flex items-center space-x-1">
                  {(statistics.financial.cost_variance || 0) > 0 ? (
                    <TrendingUp className="h-3 w-3 text-red-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-green-600" />
                  )}
                  <p className="text-xs text-muted-foreground">Cost Variance</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-2xl font-bold text-amber-600">
                  {statistics.financial.items_over_budget || 0}
                </div>
                <p className="text-xs text-muted-foreground">Items Over Budget</p>
              </div>
            </div>
            
            {/* Budget utilization progress */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Budget Utilization</span>
                <span>
                  {statistics.financial.total_budget && statistics.financial.actual_cost
                    ? Math.round((statistics.financial.actual_cost / statistics.financial.total_budget) * 100)
                    : 0}%
                </span>
              </div>
              <Progress 
                value={
                  statistics.financial.total_budget && statistics.financial.actual_cost
                    ? Math.min((statistics.financial.actual_cost / statistics.financial.total_budget) * 100, 100)
                    : 0
                } 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}