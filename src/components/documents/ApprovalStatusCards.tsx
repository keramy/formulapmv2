'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  RefreshCw,
  Zap,
  Timer
} from 'lucide-react'

interface ApprovalStats {
  totalPending: number
  priorityBreakdown: {
    urgent: number
    high: number
    medium: number
    low: number
  }
  avgAge: number
}

interface ApprovalStatusCardsProps {
  stats: ApprovalStats | null
  onRefresh: () => void
}

const ApprovalStatusCards: React.FC<ApprovalStatusCardsProps> = ({ stats, onRefresh }) => {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const totalItems = Object.values(stats.priorityBreakdown).reduce((sum, count) => sum + count, 0)
  const urgentPercentage = totalItems > 0 ? (stats.priorityBreakdown.urgent / totalItems) * 100 : 0
  const highPercentage = totalItems > 0 ? (stats.priorityBreakdown.high / totalItems) * 100 : 0

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Total Pending */}
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalPending}</div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground">
              Require your approval
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onRefresh}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Priority Breakdown */}
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Priority Distribution</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="w-2 h-2 p-0 rounded-full">
                  <span className="sr-only">Urgent</span>
                </Badge>
                <span className="text-sm">Urgent</span>
              </div>
              <span className="text-sm font-medium">{stats.priorityBreakdown.urgent}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="w-2 h-2 p-0 rounded-full bg-orange-500">
                  <span className="sr-only">High</span>
                </Badge>
                <span className="text-sm">High</span>
              </div>
              <span className="text-sm font-medium">{stats.priorityBreakdown.high}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="w-2 h-2 p-0 rounded-full bg-yellow-500">
                  <span className="sr-only">Medium</span>
                </Badge>
                <span className="text-sm">Medium</span>
              </div>
              <span className="text-sm font-medium">{stats.priorityBreakdown.medium}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="w-2 h-2 p-0 rounded-full bg-blue-500">
                  <span className="sr-only">Low</span>
                </Badge>
                <span className="text-sm">Low</span>
              </div>
              <span className="text-sm font-medium">{stats.priorityBreakdown.low}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Items */}
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Critical Items</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {stats.priorityBreakdown.urgent + stats.priorityBreakdown.high}
          </div>
          <div className="mt-2 space-y-1">
            <Progress 
              value={urgentPercentage + highPercentage} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              {urgentPercentage + highPercentage > 0 
                ? `${Math.round(urgentPercentage + highPercentage)}% of pending items`
                : 'No critical items'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Average Age */}
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Age</CardTitle>
          <Timer className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Math.round(stats.avgAge)}
            <span className="text-sm font-normal text-muted-foreground ml-1">days</span>
          </div>
          <div className="mt-2">
            <div className="flex items-center gap-1">
              {stats.avgAge > 7 ? (
                <TrendingUp className="h-3 w-3 text-red-500" />
              ) : (
                <CheckCircle className="h-3 w-3 text-green-500" />
              )}
              <p className="text-xs text-muted-foreground">
                {stats.avgAge > 7 ? 'Above target' : 'Within target'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ApprovalStatusCards