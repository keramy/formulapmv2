/**
 * Formula PM 2.0 Tasks Tab Component
 * V3 Phase 1 Implementation
 * 
 * Task management tab for project workspace
 */

'use client'

import { useState } from 'react'
import { TaskList } from '@/components/tasks/TaskList'
import { TaskForm } from '@/components/tasks/TaskForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plus, 
  CheckSquare, 
  Clock, 
  AlertTriangle,
  Users,
  Target,
  Activity,
  TrendingUp
} from 'lucide-react'
import { Task, TaskFormData, TaskFilters, TaskPermissions } from '@/types/tasks'
import { useTasks, useTasksOptimized } from '@/hooks/useTasks'
import { useProjectMembers } from '@/hooks/useProjectMembers'
import { DataStateWrapper } from '@/components/ui/loading-states'

interface TasksTabProps {
  projectId: string
}

export function TasksTab({ projectId }: TasksTabProps) {
  const [filters, setFilters] = useState<TaskFilters>({})
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const {
    tasks,
    statistics,
    loading,
    error,
    permissions,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    bulkUpdateTasks,
    refetch
  } = useTasks(projectId, filters)

  // Fetch real project members
  const { members: projectMembers, loading: membersLoading } = useProjectMembers(projectId)

  const handleCreateTask = async (data: TaskFormData) => {
    const newTask = await createTask(data)
    if (newTask) {
      setCreateDialogOpen(false)
      // Optionally show success message
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
  }

  const handleUpdateTask = async (data: TaskFormData) => {
    if (!editingTask) return
    
    const updatedTask = await updateTask(editingTask.id, data)
    if (updatedTask) {
      setEditingTask(null)
      // Optionally show success message
    }
  }

  const handleDeleteTask = async (task: Task) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      const success = await deleteTask(task.id)
      if (success) {
        // Optionally show success message
      }
    }
  }

  const handleStatusChange = async (taskId: string, status: Task['status']) => {
    await updateTaskStatus(taskId, status)
  }

  const handleBulkUpdate = async (taskIds: string[], updates: any) => {
    await bulkUpdateTasks(taskIds, updates)
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Key Metrics */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CheckSquare className="h-6 w-6" />
            Project Tasks
          </h2>
          <p className="text-gray-600">Manage and track project tasks and assignments</p>
        </div>
        
        {permissions.canCreate && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <TaskForm
                projectId={projectId}
                mode="create"
                onSave={handleCreateTask}
                onCancel={() => setCreateDialogOpen(false)}
                projectMembers={projectMembers}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Total Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total}</div>
              <div className="text-sm text-gray-600">Project tasks</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{statistics.byStatus.in_progress}</div>
              <div className="text-sm text-gray-600">Currently active</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.completed}</div>
              <div className="text-sm text-gray-600">
                {statistics.total > 0 ? Math.round((statistics.completed / statistics.total) * 100) : 0}% completion rate
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{statistics.overdue}</div>
              <div className="text-sm text-gray-600">Require attention</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Additional Stats */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                My Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{statistics.assignedToMe}</div>
              <div className="text-sm text-gray-600">Assigned to me</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Blocked Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{statistics.byStatus.blocked}</div>
              <div className="text-sm text-gray-600">Need resolution</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Task List */}
      <Card>
        <CardHeader>
          <CardTitle>Task List</CardTitle>
          <CardDescription>
            Manage project tasks and track progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TaskList
            tasks={tasks}
            loading={loading}
            permissions={permissions}
            onCreateTask={permissions.canCreate ? () => setCreateDialogOpen(true) : undefined}
            onEditTask={permissions.canEdit ? handleEditTask : undefined}
            onDeleteTask={permissions.canDelete ? handleDeleteTask : undefined}
            onStatusChange={permissions.canChangeStatus ? handleStatusChange : undefined}
            onBulkUpdate={permissions.canEdit ? handleBulkUpdate : undefined}
            projectMembers={projectMembers}
            initialFilters={filters}
            showBulkActions={permissions.canEdit}
          />
        </CardContent>
      </Card>

      {/* Edit Task Dialog */}
      {editingTask && (
        <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <TaskForm
              task={editingTask}
              projectId={projectId}
              mode="edit"
              onSave={handleUpdateTask}
              onCancel={() => setEditingTask(null)}
              projectMembers={projectMembers}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

/**
 * Optimized TasksTab using new patterns - EXAMPLE FOR AI AGENT
 * This shows how to use DataStateWrapper and optimized hooks
 */
export function TasksTabOptimized({ projectId }: TasksTabProps) {
  const [filters, setFilters] = useState<TaskFilters>({})
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // Use the new optimized hook
  const {
    tasks,
    statistics,
    loading,
    error,
    permissions,
    refetch
  } = useTasksOptimized(projectId, filters)

  return (
    <DataStateWrapper
      loading={loading}
      error={error}
      data={tasks}
      onRetry={refetch}
      emptyComponent={
        <div className="text-center py-12">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first task to get started.
          </p>
          {permissions.canCreate && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckSquare className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Completed</p>
                    <p className="text-2xl font-bold">{statistics.completed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">In Progress</p>
                    <p className="text-2xl font-bold">{statistics.in_progress}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium">Pending</p>
                    <p className="text-2xl font-bold">{statistics.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium">Total</p>
                    <p className="text-2xl font-bold">{statistics.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Task List with optimized loading */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks ({tasks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskList
              tasks={tasks}
              permissions={permissions}
              onEdit={() => {/* Handle edit */}}
              onDelete={() => {/* Handle delete */}}
              onStatusChange={() => {/* Handle status change */}}
            />
          </CardContent>
        </Card>
      </div>
    </DataStateWrapper>
  )
}