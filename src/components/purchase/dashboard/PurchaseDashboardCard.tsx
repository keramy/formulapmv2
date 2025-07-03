/**
 * Formula PM 2.0 Purchase Dashboard Card
 * Purchase Department Workflow Implementation
 * 
 * Dashboard card component for purchase overview and quick actions
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  ShoppingCart, 
  Package, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  AlertTriangle,
  Plus,
  Eye,
  DollarSign
} from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import { usePurchase } from '@/hooks/usePurchase'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface PurchaseDashboardCardProps {
  projectId?: string
  className?: string
}

export const PurchaseDashboardCard = ({ projectId, className }: PurchaseDashboardCardProps) => {
  const { 
    canViewPurchaseRequests,
    canCreatePurchaseRequests,
    canViewPurchaseFinancials,
    isPurchase,
    isManagement
  } = usePermissions()
  
  const { statistics, loading, requests, orders } = usePurchase()

  if (!canViewPurchaseRequests()) {
    return null
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getUrgentRequestsCount = () => {
    return requests.filter(r => r.urgency_level === 'high' || r.urgency_level === 'emergency').length
  }

  const getPendingApprovalsCount = () => {
    return requests.filter(r => r.status === 'pending_approval').length
  }

  const getActiveOrdersCount = () => {
    return orders.filter(o => o.status === 'sent' || o.status === 'confirmed').length
  }

  const urgentCount = getUrgentRequestsCount()
  const pendingCount = getPendingApprovalsCount()
  const activeOrdersCount = getActiveOrdersCount()

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Purchase Management
        </CardTitle>
        <div className="flex items-center space-x-2">
          {urgentCount > 0 && (
            <Badge variant="destructive" className="h-5">
              {urgentCount} urgent
            </Badge>
          )}
          <Link href="/purchase">
            <Button variant="ghost" size="sm">
              <Eye className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Package className="h-3 w-3 mr-1" />
                  Requests
                </div>
                <div className="text-lg font-semibold">
                  {statistics?.total_requests || requests.length}
                </div>
                {pendingCount > 0 && (
                  <div className="flex items-center text-xs text-orange-600">
                    <Clock className="h-3 w-3 mr-1" />
                    {pendingCount} pending
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center text-xs text-muted-foreground">
                  <ShoppingCart className="h-3 w-3 mr-1" />
                  Orders
                </div>
                <div className="text-lg font-semibold text-blue-600">
                  {statistics?.active_orders || activeOrdersCount}
                </div>
                {statistics?.pending_deliveries && (
                  <div className="flex items-center text-xs text-blue-600">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {statistics.pending_deliveries} pending
                  </div>
                )}
              </div>
            </div>

            {/* Financial Summary */}
            {canViewPurchaseFinancials() && statistics && (
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <DollarSign className="h-3 w-3 mr-1" />
                    Total Spent
                  </div>
                  <div className="text-sm font-semibold text-green-600">
                    {formatCurrency(statistics.total_spent)}
                  </div>
                </div>
                {statistics.average_approval_time && (
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      Avg Approval
                    </div>
                    <div className="text-sm font-medium">
                      {statistics.average_approval_time}h
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Quick Actions</span>
                {urgentCount > 0 && (
                  <div className="flex items-center text-xs text-red-600">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {urgentCount} urgent items
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-2">
                {canCreatePurchaseRequests() && (
                  <Link href="/purchase?tab=requests&action=create">
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                      <Plus className="h-3 w-3 mr-1" />
                      New Request
                    </Button>
                  </Link>
                )}
                
                {(isPurchase() || isManagement()) && pendingCount > 0 && (
                  <Link href="/purchase?tab=approvals">
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approvals ({pendingCount})
                    </Button>
                  </Link>
                )}
                
                {!canCreatePurchaseRequests() && !pendingCount && (
                  <Link href="/purchase">
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                      <Eye className="h-3 w-3 mr-1" />
                      View All
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Progress Indicator */}
            {statistics && (
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Request Completion</span>
                  <span className="text-xs text-muted-foreground">
                    {statistics.total_requests > 0 
                      ? Math.round(((statistics.total_requests - pendingCount) / statistics.total_requests) * 100)
                      : 0}%
                  </span>
                </div>
                <Progress 
                  value={statistics.total_requests > 0 
                    ? ((statistics.total_requests - pendingCount) / statistics.total_requests) * 100
                    : 0} 
                  className="h-2"
                />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}