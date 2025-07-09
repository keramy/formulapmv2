/**
 * Formula PM 2.0 Global Scope Management Page
 * Wave 2B Business Logic Implementation
 * 
 * Global scope management interface accessible via navigation sidebar
 */

'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { useScope, useScopeStatistics } from '@/hooks/useScope'
// import { ScopeCoordinator } from '@/components/scope/ScopeCoordinator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { 
  Construction, 
  Hammer, 
  Zap, 
  Wrench, 
  Plus, 
  Filter,
  BarChart3,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Users,
  Building
} from 'lucide-react'
import { ScopeCategory } from '@/types/scope'

interface ScopeOverview {
  total_items: number
  total_projects: number
  categories: {
    construction: { count: number; completion: number; projects: number }
    millwork: { count: number; completion: number; projects: number }
    electrical: { count: number; completion: number; projects: number }
    mechanical: { count: number; completion: number; projects: number }
  }
  pending_approvals: number
  overdue_items: number
  user_assignments: number
  recent_activity: Array<{
    project_name: string
    item_title: string
    action: string
    timestamp: string
  }>
}

const CATEGORY_CONFIG = {
  construction: {
    label: 'Construction',
    description: 'Structural and general construction items',
    color: 'bg-blue-500',
    lightColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    icon: Construction
  },
  millwork: {
    label: 'Millwork', 
    description: 'Custom woodwork and cabinetry',
    color: 'bg-amber-500',
    lightColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    icon: Hammer
  },
  electrical: {
    label: 'Electrical',
    description: 'Electrical systems and installations', 
    color: 'bg-yellow-500',
    lightColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    icon: Zap
  },
  mechanical: {
    label: 'Mechanical',
    description: 'HVAC and mechanical systems',
    color: 'bg-green-500',
    lightColor: 'bg-green-100',
    textColor: 'text-green-700',
    icon: Wrench
  }
}

export default function GlobalScopePage() {
  const { profile } = useAuth()
  const { 
    canViewScope, 
    canCreateScope, 
    checkPermission,
    isManagement 
  } = usePermissions()
  
  const [overview, setOverview] = useState<ScopeOverview | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<ScopeCategory | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch overview data
  useEffect(() => {
    fetchScopeOverview()
  }, [])

  const fetchScopeOverview = async () => {
    if (!profile) return

    try {
      setLoading(true)
      const response = await fetch('/api/scope/overview', {
        headers: {
          'Authorization': `Bearer ${profile.id}`,
        }
      })

      if (response.ok) {
        const data = await response.json()
        setOverview(data.overview)
      } else {
        throw new Error('Failed to fetch scope overview')
      }
    } catch (err) {
      console.error('Failed to fetch scope overview:', err)
      setError(err instanceof Error ? err.message : 'Failed to load overview')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-muted-foreground">Loading scope overview...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load Scope Data</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchScopeOverview}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <AuthGuard requiredPermission="scope.view">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Scope Management</h1>
            <p className="text-muted-foreground">
              {isManagement() 
                ? 'Manage scope items across all projects in your organization'
                : 'Manage scope items for projects you have access to'
              }
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
            </Button>
            {canCreateScope() && (
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Scope Item
              </Button>
            )}
          </div>
        </div>

        {/* Overview Stats */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Items */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.total_items}</div>
                <p className="text-xs text-muted-foreground">
                  Across {overview.total_projects} projects
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <Building className="h-3 w-3" />
                  <span className="text-xs text-muted-foreground">
                    {overview.total_projects} active projects
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* User Assignments */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Your Assignments</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {overview.user_assignments}
                </div>
                <p className="text-xs text-muted-foreground">
                  Items assigned to you
                </p>
                <div className="flex items-center space-x-1 mt-2">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs text-muted-foreground">
                    Active assignments
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Pending Approvals */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {overview.pending_approvals}
                </div>
                <p className="text-xs text-muted-foreground">
                  Awaiting your approval
                </p>
                {overview.pending_approvals > 0 && (
                  <Badge variant="secondary" className="text-xs mt-2">
                    Action Required
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Overdue Items */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {overview.overdue_items}
                </div>
                <p className="text-xs text-muted-foreground">
                  Past due date
                </p>
                {overview.overdue_items > 0 && (
                  <Badge variant="destructive" className="text-xs mt-2">
                    Attention Needed
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Category Overview */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
              const categoryData = overview.categories[key as keyof typeof overview.categories]
              const Icon = config.icon
              
              return (
                <Card 
                  key={key} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedCategory(key as ScopeCategory)}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {config.label}
                    </CardTitle>
                    <div className={`p-1.5 rounded ${config.color} text-white`}>
                      <Icon className="h-3 w-3" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{categoryData?.count || 0}</div>
                    <div className="space-y-2">
                      <Progress value={categoryData?.completion || 0} className="h-1" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{categoryData?.completion || 0}% complete</span>
                        <span>{categoryData?.projects || 0} projects</span>
                      </div>
                    </div>
                    <div className={`text-xs ${config.textColor} font-medium mt-1`}>
                      {config.description}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Recent Activity */}
        {overview?.recent_activity && overview.recent_activity.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Recent Activity</span>
              </CardTitle>
              <CardDescription>
                Latest updates across your accessible projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {overview.recent_activity.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="space-y-1">
                      <div className="font-medium">{activity.item_title}</div>
                      <div className="text-sm text-muted-foreground">
                        {activity.project_name} • {activity.action}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Scope Management Interface */}
        <Card>
          <CardHeader>
            <CardTitle>Scope Management Interface</CardTitle>
            <CardDescription>
              Scope management interface will be implemented here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The scope management interface is being developed. This placeholder ensures compilation succeeds.
            </p>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  )
}