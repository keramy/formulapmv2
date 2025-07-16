// ============================================================================
// V3 PM Dashboard - My Tasks and Actions Component
// ============================================================================
// Built with optimization patterns: DataStateWrapper, real-time updates
// Features: Task management, action items, priority sorting
// ============================================================================

'use client'

import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataStateWrapper } from '@/components/ui/loading-states'
import { 
  CheckSquare, 
  Clock, 
  AlertTriangle, 
  Flag, 
  User,
  Calendar,
  ArrowRight,
  Plus,
  Filter
} from 'lucide-react'
import { useRouter } from 'next/navigation'

// Mock data hook - will be replaced with real API integration
function useMyTasksAndActions() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Mock data for PM tasks
  const mockTasks = [
    {
      id: 'task1',
      title: 'Review Foundation Inspection Report',
      description: 'Evaluate structural compliance and safety standards',
      priority: 'high',
      status: 'pending',
      due_date: '2024-01-18',
      project: { id: 'proj1', name: 'Downtown Office Complex' },
      assigned_by: 'Sarah Johnson',
      type: 'review',
      estimated_hours: 2
    },
    {
      id: 'task2',
      title: 'Approve Material Specification Changes',
      description: 'Review updated steel specifications for Phase 2',
      priority: 'urgent',
      status: 'pending',
      due_date: '2024-01-16',
      project: { id: 'proj2', name: 'Residential Complex Phase 2' },
      assigned_by: 'Michael Chen',
      type: 'approval',
      estimated_hours: 1
    },
    {
      id: 'task3',
      title: 'Team Meeting: Weekly Progress Review',
      description: 'Coordinate with all department leads',
      priority: 'medium',
      status: 'scheduled',
      due_date: '2024-01-19',
      project: { id: 'proj1', name: 'Downtown Office Complex' },
      assigned_by: 'System',
      type: 'meeting',
      estimated_hours: 1.5
    },
    {
      id: 'task4',
      title: 'Budget Variance Analysis',
      description: 'Analyze Q1 budget performance vs actuals',
      priority: 'medium',
      status: 'in_progress',
      due_date: '2024-01-22',
      project: { id: 'proj3', name: 'Industrial Warehouse Renovation' },
      assigned_by: 'Finance Team',
      type: 'analysis',
      estimated_hours: 4
    }
  ]

  const mockActions = [
    {
      id: 'action1',
      title: 'Client Presentation Preparation',
      description: 'Prepare Q1 progress presentation for ABC Corp',
      priority: 'high',
      status: 'pending',
      due_date: '2024-01-20',
      project: { id: 'proj1', name: 'Downtown Office Complex' },
      type: 'presentation',
      estimated_hours: 3
    },
    {
      id: 'action2',
      title: 'Safety Protocol Update',
      description: 'Update safety protocols based on new regulations',
      priority: 'medium',
      status: 'pending',
      due_date: '2024-01-25',
      project: null,
      type: 'documentation',
      estimated_hours: 2
    },
    {
      id: 'action3',
      title: 'Vendor Contract Renewal',
      description: 'Renew contracts with key suppliers',
      priority: 'low',
      status: 'pending',
      due_date: '2024-01-30',
      project: null,
      type: 'contract',
      estimated_hours: 1
    }
  ]

  const refetch = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 500)
  }

  return { 
    data: { tasks: mockTasks, actions: mockActions }, 
    loading, 
    error, 
    refetch 
  }
}

// ============================================================================
// TYPES
// ============================================================================

interface Task {
  id: string
  title: string
  description: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
  status: 'pending' | 'in_progress' | 'scheduled' | 'completed'
  due_date: string
  project: { id: string; name: string } | null
  assigned_by: string
  type: string
  estimated_hours: number
}

interface MyTasksAndActionsProps {
  userId?: string
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const MyTasksAndActions: React.FC<MyTasksAndActionsProps> = ({ userId }) => {
  const { profile } = useAuth()
  const router = useRouter()
  const [selectedPriority, setSelectedPriority] = useState<string>('all')

  // Data fetching
  const { data, loading, error, refetch } = useMyTasksAndActions()
  const tasks = data?.tasks || []
  const actions = data?.actions || []

  // Filter functions
  const filterByPriority = (items: Task[]) => {
    if (selectedPriority === 'all') return items
    return items.filter(item => item.priority === selectedPriority)
  }

  // Sort by priority and due date
  const sortItems = (items: Task[]) => {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
    return items.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    })
  }

  const filteredTasks = sortItems(filterByPriority(tasks))
  const filteredActions = sortItems(filterByPriority(actions))

  // Calculate summary stats
  const urgentItems = [...tasks, ...actions].filter(item => item.priority === 'urgent').length
  const overdueItems = [...tasks, ...actions].filter(item => 
    new Date(item.due_date) < new Date() && item.status !== 'completed'
  ).length
  const todayItems = [...tasks, ...actions].filter(item => {
    const today = new Date().toISOString().split('T')[0]
    return item.due_date === today
  }).length

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleViewTask = (task: Task) => {
    if (task.project) {
      router.push(`/projects/${task.project.id}?tab=tasks&task=${task.id}`)
    }
  }

  const handleMarkComplete = (taskId: string) => {
    // TODO: Implement task completion API call
    console.log('Marking task complete:', taskId)
    refetch()
  }

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'scheduled': return 'bg-purple-100 text-purple-800'
      case 'pending': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays === -1) return 'Yesterday'
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`
    if (diffDays <= 7) return `In ${diffDays} days`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const isOverdue = (dateString: string) => {
    return new Date(dateString) < new Date() && dateString !== new Date().toISOString().split('T')[0]
  }

  // ============================================================================
  // TASK ITEM COMPONENT
  // ============================================================================

  const TaskItem: React.FC<{ item: Task; type: 'task' | 'action' }> = ({ item, type }) => (
    <div className="group p-4 border rounded-lg hover:shadow-md transition-all duration-200 bg-white">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {item.title}
            </h3>
            <Badge className={getPriorityColor(item.priority)} variant="secondary">
              {item.priority.toUpperCase()}
            </Badge>
            {isOverdue(item.due_date) && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Overdue
              </Badge>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Due: {formatDate(item.due_date)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{item.estimated_hours}h estimated</span>
            </div>
            {item.project && (
              <div className="flex items-center gap-1 col-span-2">
                <Flag className="h-3 w-3" />
                <span className="truncate">{item.project.name}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>By {item.assigned_by}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="ml-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Badge className={getStatusColor(item.status)} variant="outline">
            {item.status.replace('_', ' ').toUpperCase()}
          </Badge>
          
          <div className="flex gap-1">
            {item.project && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewTask(item)}
                className="h-8 w-8 p-0"
              >
                <ArrowRight className="h-3 w-3" />
              </Button>
            )}
            
            {item.status !== 'completed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMarkComplete(item.id)}
                className="h-8 w-8 p-0"
              >
                <CheckSquare className="h-3 w-3" />
              </Button>
            )}
          </div>
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
              <CheckSquare className="h-5 w-5" />
              My Tasks & Actions
            </CardTitle>
            <CardDescription>
              Items requiring your attention
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            {['all', 'urgent', 'high', 'medium', 'low'].map((priority) => (
              <Button
                key={priority}
                variant={selectedPriority === priority ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPriority(priority)}
                className="capitalize"
              >
                {priority}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{urgentItems}</div>
            <div className="text-sm text-red-700">Urgent Items</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{overdueItems}</div>
            <div className="text-sm text-orange-700">Overdue</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{todayItems}</div>
            <div className="text-sm text-blue-700">Due Today</div>
          </div>
        </div>

        {/* Tasks and Actions */}
        <DataStateWrapper
          loading={loading}
          error={error}
          data={[...filteredTasks, ...filteredActions]}
          onRetry={refetch}
          emptyMessage="No tasks or actions found"
          emptyDescription="You're all caught up!"
          loadingComponent={
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-lg h-24"></div>
                </div>
              ))}
            </div>
          }
        >
          <Tabs defaultValue="tasks" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tasks">
                Tasks ({filteredTasks.length})
              </TabsTrigger>
              <TabsTrigger value="actions">
                Actions ({filteredActions.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="tasks" className="mt-4">
              <div className="space-y-3">
                {filteredTasks.map(task => (
                  <TaskItem key={task.id} item={task} type="task" />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="actions" className="mt-4">
              <div className="space-y-3">
                {filteredActions.map(action => (
                  <TaskItem key={action.id} item={action} type="action" />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </DataStateWrapper>
      </CardContent>
    </Card>
  )
}

export default MyTasksAndActions