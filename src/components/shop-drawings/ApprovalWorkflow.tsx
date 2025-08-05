'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/use-toast'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Users,
  FileText,
  Calendar,
  Filter,
  Download,
  Eye,
  MessageSquare,
  ArrowRight,
  Workflow,
  Timer
} from 'lucide-react'

interface ApprovalWorkflowItem {
  id: string
  drawing_id: string
  revision_id: string
  drawing_number: string
  drawing_title: string
  revision_number: string
  project_id: string
  project_name: string
  current_stage: 'internal' | 'client' | 'final'
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'on_hold'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to?: string
  assigned_to_name?: string
  due_date?: string
  submitted_date: string
  submitted_by: string
  submitted_by_name: string
  days_pending: number
  comments_count: number
  last_activity: string
}

interface ApprovalStats {
  total_items: number
  pending_internal: number
  pending_client: number
  approved_today: number
  rejected_today: number
  overdue: number
  avg_approval_time: number
}

interface ApprovalWorkflowProps {
  projectId?: string
  userRole?: 'admin' | 'project_manager' | 'technical' | 'client'
  showClientView?: boolean
}

const STAGE_CONFIG = {
  internal: { 
    label: 'Internal Review', 
    color: 'bg-blue-500', 
    description: 'Technical team review'
  },
  client: { 
    label: 'Client Review', 
    color: 'bg-purple-500', 
    description: 'Client approval required'
  },
  final: { 
    label: 'Final Approval', 
    color: 'bg-green-500', 
    description: 'Ready for production'
  }
}

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-gray-500', icon: Clock },
  in_review: { label: 'In Review', color: 'bg-yellow-500', icon: Eye },
  approved: { label: 'Approved', color: 'bg-green-500', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-500', icon: XCircle },
  on_hold: { label: 'On Hold', color: 'bg-orange-500', icon: AlertTriangle }
}

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'text-blue-600' },
  medium: { label: 'Medium', color: 'text-yellow-600' },
  high: { label: 'High', color: 'text-orange-600' },
  urgent: { label: 'Urgent', color: 'text-red-600' }
}

export function ApprovalWorkflow({ 
  projectId, 
  userRole = 'technical',
  showClientView = false 
}: ApprovalWorkflowProps) {
  const { getAccessToken } = useAuth()
  const { toast } = useToast()
  
  const [workflowItems, setWorkflowItems] = useState<ApprovalWorkflowItem[]>([])
  const [stats, setStats] = useState<ApprovalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState('pending')
  const [filters, setFilters] = useState({
    stage: 'all',
    status: 'all',
    priority: 'all',
    assigned_to: 'all',
    search: ''
  })
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState('')
  const [processingBulk, setProcessingBulk] = useState(false)

  useEffect(() => {
    loadWorkflowData()
  }, [projectId, filters])

  const loadWorkflowData = async () => {
    try {
      const token = await getAccessToken()
      if (!token) return

      const queryParams = new URLSearchParams({
        ...(projectId && { project_id: projectId }),
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value !== 'all' && value !== '') {
            acc[key] = value
          }
          return acc
        }, {} as Record<string, string>)
      })

      const [itemsResponse, statsResponse] = await Promise.all([
        fetch(`/api/shop-drawings/approval-workflow?${queryParams}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`/api/shop-drawings/approval-workflow/stats?${queryParams}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      ])

      if (itemsResponse.ok) {
        const result = await itemsResponse.json()
        if (result.success) {
          setWorkflowItems(result.data)
        }
      }

      if (statsResponse.ok) {
        const result = await statsResponse.json()
        if (result.success) {
          setStats(result.data)
        }
      }
    } catch (error) {
      console.error('Error loading workflow data:', error)
      toast({
        title: "Error",
        description: "Failed to load approval workflow data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleItemAction = async (itemId: string, action: 'approve' | 'reject' | 'assign' | 'prioritize', data?: any) => {
    try {
      const token = await getAccessToken()
      if (!token) throw new Error('No access token')

      const response = await fetch(`/api/shop-drawings/approval-workflow/${itemId}/action`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, ...data }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Failed to ${action} item`)
      }

      toast({
        title: "Action Completed",
        description: `Item ${action}ed successfully`,
      })

      await loadWorkflowData()
    } catch (error) {
      toast({
        title: "Action Failed",
        description: error instanceof Error ? error.message : `Failed to ${action} item`,
        variant: "destructive",
      })
    }
  }

  const handleBulkAction = async () => {
    if (selectedItems.length === 0 || !bulkAction) return

    setProcessingBulk(true)
    try {
      const token = await getAccessToken()
      if (!token) throw new Error('No access token')

      const response = await fetch('/api/shop-drawings/approval-workflow/bulk-action', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_ids: selectedItems,
          action: bulkAction
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to perform bulk action')
      }

      toast({
        title: "Bulk Action Completed",
        description: `Applied ${bulkAction} to ${selectedItems.length} items`,
      })

      setSelectedItems([])
      setBulkAction('')
      await loadWorkflowData()
    } catch (error) {
      toast({
        title: "Bulk Action Failed",
        description: error instanceof Error ? error.message : 'Failed to perform bulk action',
        variant: "destructive",
      })
    } finally {
      setProcessingBulk(false)
    }
  }

  const getFilteredItems = (status?: string) => {
    return workflowItems.filter(item => {
      if (status && status !== 'all' && item.status !== status) return false
      return true
    })
  }

  const getStatusBadge = (status: ApprovalWorkflowItem['status']) => {
    const config = STATUS_CONFIG[status]
    const Icon = config.icon
    
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${config.color}`} />
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getStageBadge = (stage: ApprovalWorkflowItem['current_stage']) => {
    const config = STAGE_CONFIG[stage]
    
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${config.color}`} />
        {config.label}
      </Badge>
    )
  }

  const getPriorityColor = (priority: ApprovalWorkflowItem['priority']) => {
    return PRIORITY_CONFIG[priority].color
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            Loading approval workflow...
          </div>
        </CardContent>
      </Card>
    )
  }

  const pendingItems = getFilteredItems('pending')
  const inReviewItems = getFilteredItems('in_review')
  const approvedItems = getFilteredItems('approved')
  const rejectedItems = getFilteredItems('rejected')

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{stats.total_items}</div>
                  <div className="text-sm text-muted-foreground">Total Items</div>
                </div>
                <Workflow className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{stats.pending_internal + stats.pending_client}</div>
                  <div className="text-sm text-muted-foreground">Pending Review</div>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.approved_today}</div>
                  <div className="text-sm text-muted-foreground">Approved Today</div>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
                  <div className="text-sm text-muted-foreground">Overdue</div>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Approval Stage</Label>
              <Select value={filters.stage} onValueChange={(value) => setFilters(prev => ({ ...prev, stage: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  <SelectItem value="internal">Internal Review</SelectItem>
                  <SelectItem value="client">Client Review</SelectItem>
                  <SelectItem value="final">Final Approval</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Priority</Label>
              <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Search</Label>
              <Input
                placeholder="Drawing number, title..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-medium">{selectedItems.length} items selected</span>
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Choose action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">Approve Selected</SelectItem>
                    <SelectItem value="reject">Reject Selected</SelectItem>
                    <SelectItem value="priority_high">Set Priority: High</SelectItem>
                    <SelectItem value="priority_urgent">Set Priority: Urgent</SelectItem>
                    <SelectItem value="export">Export Selected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setSelectedItems([])}>
                  Clear Selection
                </Button>
                <Button 
                  onClick={handleBulkAction} 
                  disabled={!bulkAction || processingBulk}
                >
                  {processingBulk ? 'Processing...' : 'Apply Action'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflow Items */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            Pending ({pendingItems.length})
          </TabsTrigger>
          <TabsTrigger value="in_review" className="flex items-center gap-2">
            In Review ({inReviewItems.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            Approved ({approvedItems.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            Rejected ({rejectedItems.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingItems.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No pending items</h3>
                <p className="text-muted-foreground">All items are up to date</p>
              </CardContent>
            </Card>
          ) : (
            pendingItems.map(item => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems(prev => [...prev, item.id])
                          } else {
                            setSelectedItems(prev => prev.filter(id => id !== item.id))
                          }
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{item.drawing_number}</h3>
                          <span className="text-sm text-muted-foreground">Rev {item.revision_number}</span>
                          {getStageBadge(item.current_stage)}
                          {getStatusBadge(item.status)}
                          <span className={`text-sm font-medium ${getPriorityColor(item.priority)}`}>
                            {PRIORITY_CONFIG[item.priority].label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{item.drawing_title}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Project: {item.project_name}</span>
                          <span>Submitted: {new Date(item.submitted_date).toLocaleDateString()}</span>
                          <span>Days pending: {item.days_pending}</span>
                          {item.assigned_to_name && <span>Assigned: {item.assigned_to_name}</span>}
                        </div>
                        {item.due_date && (
                          <div className="flex items-center gap-1 mt-2">
                            <Calendar className="h-3 w-3 text-orange-500" />
                            <span className="text-xs text-orange-600">
                              Due: {new Date(item.due_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.comments_count > 0 && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {item.comments_count}
                        </Badge>
                      )}
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleItemAction(item.id, 'approve')}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleItemAction(item.id, 'reject')}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="in_review" className="space-y-4">
          {inReviewItems.map(item => (
            <Card key={item.id} className="border-yellow-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Timer className="h-5 w-5 text-yellow-600 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{item.drawing_number}</h3>
                        <span className="text-sm text-muted-foreground">Rev {item.revision_number}</span>
                        {getStageBadge(item.current_stage)}
                        {getStatusBadge(item.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{item.drawing_title}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Reviewer: {item.assigned_to_name || 'Unassigned'}</span>
                        <span>In review for: {item.days_pending} days</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      Follow Up
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedItems.map(item => (
            <Card key={item.id} className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{item.drawing_number}</h3>
                        <span className="text-sm text-muted-foreground">Rev {item.revision_number}</span>
                        {getStageBadge(item.current_stage)}
                        {getStatusBadge(item.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{item.drawing_title}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Approved by: {item.assigned_to_name}</span>
                        <span>Approved: {new Date(item.last_activity).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedItems.map(item => (
            <Card key={item.id} className="border-red-200 bg-red-50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <XCircle className="h-5 w-5 text-red-600 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{item.drawing_number}</h3>
                        <span className="text-sm text-muted-foreground">Rev {item.revision_number}</span>
                        {getStageBadge(item.current_stage)}
                        {getStatusBadge(item.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{item.drawing_title}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Rejected by: {item.assigned_to_name}</span>
                        <span>Days since rejection: {item.days_pending}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      New Revision
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}