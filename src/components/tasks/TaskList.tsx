/**
 * Formula PM 2.0 Task List Component
 * V3 Phase 1 Implementation
 * 
 * Task list with filtering, sorting, and bulk operations
 */

'use client'

import { useState, useMemo } from 'react'
import { Task, TaskFilters, TaskSortOptions, TaskPermissions } from '@/types/tasks'
import { TaskCard } from './TaskCard'
import { TaskStatusBadge } from './TaskStatusBadge'
import { TaskPrioritySelector } from './TaskPrioritySelector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { DataStateWrapper } from '@/components/ui/loading-states'
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Plus, 
  Users, 
  Calendar, 
  CheckSquare, 
  X,
  LayoutGrid,
  List,
  Clock,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, isPast, isToday, isThisWeek } from 'date-fns'

interface TaskListProps {
  tasks: Task[]
  loading?: boolean
  permissions: TaskPermissions
  onCreateTask?: () => void
  onEditTask?: (task: Task) => void
  onDeleteTask?: (task: Task) => void
  onStatusChange?: (taskId: string, status: Task['status']) => void
  onBulkUpdate?: (taskIds: string[], updates: any) => void
  projectMembers?: Array<{
    id: string
    full_name: string
    email: string
  }>
  initialFilters?: TaskFilters
  viewMode?: 'grid' | 'list'
  showBulkActions?: boolean
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  loading = false,
  permissions,
  onCreateTask,
  onEditTask,
  onDeleteTask,
  onStatusChange,
  onBulkUpdate,
  projectMembers = [],
  initialFilters = {},
  viewMode: initialViewMode = 'grid',
  showBulkActions = false
}) => {
  const [filters, setFilters] = useState<TaskFilters>(initialFilters)
  const [sortOptions, setSortOptions] = useState<TaskSortOptions>({
    field: 'created_at',
    direction: 'desc'
  })
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode)
  const [searchQuery, setSearchQuery] = useState(filters.search || '')

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const titleMatch = task.title.toLowerCase().includes(searchLower)
        const descriptionMatch = task.description?.toLowerCase().includes(searchLower) || false
        const assigneeMatch = task.assignee?.full_name.toLowerCase().includes(searchLower) || false
        if (!titleMatch && !descriptionMatch && !assigneeMatch) return false
      }

      // Status filter
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(task.status)) return false
      }

      // Priority filter
      if (filters.priority && filters.priority.length > 0) {
        if (!filters.priority.includes(task.priority)) return false
      }

      // Assignee filter
      if (filters.assignee && filters.assignee !== task.assigned_to) {
        return false
      }

      // Date filters
      if (filters.due_date_start && task.due_date) {
        if (new Date(task.due_date) < new Date(filters.due_date_start)) return false
      }
      if (filters.due_date_end && task.due_date) {
        if (new Date(task.due_date) > new Date(filters.due_date_end)) return false
      }

      // Scope item filter
      if (filters.scope_item_id && task.scope_item_id !== filters.scope_item_id) {
        return false
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        if (!task.tags || !filters.tags.some(tag => task.tags!.includes(tag))) {
          return false
        }
      }

      return true
    })

    // Sort tasks
    filtered.sort((a, b) => {
      const direction = sortOptions.direction === 'asc' ? 1 : -1
      
      switch (sortOptions.field) {
        case 'title':
          return direction * a.title.localeCompare(b.title)
        case 'priority':
          const priorityOrder = { low: 1, medium: 2, high: 3, urgent: 4 }
          return direction * (priorityOrder[a.priority] - priorityOrder[b.priority])
        case 'status':
          return direction * a.status.localeCompare(b.status)
        case 'due_date':
          if (!a.due_date && !b.due_date) return 0
          if (!a.due_date) return direction
          if (!b.due_date) return -direction
          return direction * (new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
        case 'created_at':
        default:
          return direction * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      }
    })

    return filtered
  }, [tasks, filters, sortOptions])

  // Task statistics
  const statistics = useMemo(() => {
    const overdue = tasks.filter(t => t.due_date && isPast(new Date(t.due_date)) && t.status !== 'completed').length
    const dueToday = tasks.filter(t => t.due_date && isToday(new Date(t.due_date))).length
    const dueThisWeek = tasks.filter(t => t.due_date && isThisWeek(new Date(t.due_date))).length
    const completed = tasks.filter(t => t.status === 'completed').length
    
    return { overdue, dueToday, dueThisWeek, completed }
  }, [tasks])

  const handleFilterChange = (key: keyof TaskFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleClearFilters = () => {
    setFilters({})
    setSearchQuery('')
  }

  const handleSelectTask = (taskId: string, selected: boolean) => {
    const newSelected = new Set(selectedTasks)
    if (selected) {
      newSelected.add(taskId)
    } else {
      newSelected.delete(taskId)
    }
    setSelectedTasks(newSelected)
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedTasks(new Set(filteredAndSortedTasks.map(t => t.id)))
    } else {
      setSelectedTasks(new Set())
    }
  }

  const handleBulkStatusUpdate = (status: Task['status']) => {
    if (selectedTasks.size > 0 && onBulkUpdate) {
      onBulkUpdate(Array.from(selectedTasks), { status })
      setSelectedTasks(new Set())
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters(prev => ({ ...prev, search: searchQuery }))
  }

  return (
    <DataStateWrapper
      loading={loading}
      error={null}
      data={tasks}
      emptyComponent={
        <div className="text-center py-12">
          <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first task to get started.
          </p>
          {permissions.canCreate && onCreateTask && (
            <Button onClick={onCreateTask}>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
      {/* Header with statistics */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tasks</h2>
          <div className="flex items-center gap-4 mt-2">
            <Badge variant="secondary">{tasks.length} total</Badge>
            {statistics.overdue > 0 && (
              <Badge variant="destructive">{statistics.overdue} overdue</Badge>
            )}
            {statistics.dueToday > 0 && (
              <Badge variant="status-warning">
                {statistics.dueToday} due today
              </Badge>
            )}
            <Badge variant="outline">{statistics.completed} completed</Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center rounded-lg border p-1">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {permissions.canCreate && onCreateTask && (
            <Button onClick={onCreateTask}>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          )}
        </div>
      </div>

      {/* Search and filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </form>
          
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(showFilters && 'bg-muted')}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          
          <Select
            value={`${sortOptions.field}-${sortOptions.direction}`}
            onValueChange={(value) => {
              const [field, direction] = value.split('-') as [TaskSortOptions['field'], 'asc' | 'desc']
              setSortOptions({ field, direction })
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at-desc">
                <div className="flex items-center gap-2">
                  <SortDesc className="h-4 w-4" />
                  Newest first
                </div>
              </SelectItem>
              <SelectItem value="created_at-asc">
                <div className="flex items-center gap-2">
                  <SortAsc className="h-4 w-4" />
                  Oldest first
                </div>
              </SelectItem>
              <SelectItem value="due_date-asc">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Due date (earliest)
                </div>
              </SelectItem>
              <SelectItem value="priority-desc">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Priority (highest)
                </div>
              </SelectItem>
              <SelectItem value="title-asc">
                <div className="flex items-center gap-2">
                  <SortAsc className="h-4 w-4" />
                  Title A-Z
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Collapsible filters */}
        {showFilters && (
          <div className="border rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status filter */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status?.[0] || ''}
                  onValueChange={(value) => handleFilterChange('status', value ? [value] : [])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="pending">
                      <TaskStatusBadge status="pending" showIcon />
                    </SelectItem>
                    <SelectItem value="in_progress">
                      <TaskStatusBadge status="in_progress" showIcon />
                    </SelectItem>
                    <SelectItem value="review">
                      <TaskStatusBadge status="review" showIcon />
                    </SelectItem>
                    <SelectItem value="completed">
                      <TaskStatusBadge status="completed" showIcon />
                    </SelectItem>
                    <SelectItem value="cancelled">
                      <TaskStatusBadge status="cancelled" showIcon />
                    </SelectItem>
                    <SelectItem value="blocked">
                      <TaskStatusBadge status="blocked" showIcon />
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority filter */}
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={filters.priority?.[0] || ''}
                  onValueChange={(value) => handleFilterChange('priority', value ? [value] : [])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All priorities</SelectItem>
                    <SelectItem value="low">
                      <TaskPrioritySelector value="low" onChange={() => {}} showBadge disabled />
                    </SelectItem>
                    <SelectItem value="medium">
                      <TaskPrioritySelector value="medium" onChange={() => {}} showBadge disabled />
                    </SelectItem>
                    <SelectItem value="high">
                      <TaskPrioritySelector value="high" onChange={() => {}} showBadge disabled />
                    </SelectItem>
                    <SelectItem value="urgent">
                      <TaskPrioritySelector value="urgent" onChange={() => {}} showBadge disabled />
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Assignee filter */}
              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select
                  value={filters.assignee || ''}
                  onValueChange={(value) => handleFilterChange('assignee', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All assignees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All assignees</SelectItem>
                    {projectMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {member.full_name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Due date filter */}
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={filters.due_date_start || ''}
                  onChange={(e) => handleFilterChange('due_date_start', e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {filteredAndSortedTasks.length} of {tasks.length} tasks
              </div>
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk actions */}
      {showBulkActions && selectedTasks.size > 0 && (
        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
          <CheckSquare className="h-4 w-4" />
          <span className="text-sm font-medium">
            {selectedTasks.size} task{selectedTasks.size === 1 ? '' : 's'} selected
          </span>
          <Separator orientation="vertical" className="h-4" />
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBulkStatusUpdate('completed')}
          >
            Mark Complete
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBulkStatusUpdate('in_progress')}
          >
            Mark In Progress
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedTasks(new Set())}
          >
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      )}

      {/* Task list */}
      <div className={cn(
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
          : 'space-y-2'
      )}>
        {filteredAndSortedTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEditTask ? () => onEditTask(task) : undefined}
            onDelete={onDeleteTask ? () => onDeleteTask(task) : undefined}
            onStatusChange={onStatusChange ? (status) => onStatusChange(task.id, status) : undefined}
            onSelect={showBulkActions ? (selected) => handleSelectTask(task.id, selected) : undefined}
            selected={selectedTasks.has(task.id)}
            permissions={permissions}
            compact={viewMode === 'list'}
          />
        ))}
      </div>

      {/* Empty state */}
      {filteredAndSortedTasks.length === 0 && (
        <div className="text-center py-12">
          <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">
            {tasks.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}
          </h3>
          <p className="mt-2 text-muted-foreground">
            {tasks.length === 0 
              ? 'Get started by creating your first task for this project.'
              : 'Try adjusting your filters to see more tasks.'
            }
          </p>
          {permissions.canCreate && onCreateTask && tasks.length === 0 && (
            <Button onClick={onCreateTask} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Create First Task
            </Button>
          )}
        </div>
      )}
      </div>
    </DataStateWrapper>
  )
}