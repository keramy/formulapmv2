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
import { useTasks } from '@/hooks/useTasks'

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

  // Mock project members for task form (will be replaced with real data later)
  const mockProjectMembers = [
    { id: 'user-1', full_name: 'John Doe', email: 'john@example.com' },
    { id: 'user-2', full_name: 'Jane Smith', email: 'jane@example.com' },
    { id: 'user-3', full_name: 'Mike Johnson', email: 'mike@example.com' },
    { id: 'user-4', full_name: 'Sarah Wilson', email: 'sarah@example.com' }
  ]

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
                projectMembers={mockProjectMembers}
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
            projectMembers={mockProjectMembers}
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
              projectMembers={mockProjectMembers}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}