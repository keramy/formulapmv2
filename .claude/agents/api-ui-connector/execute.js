const fs = require('fs').promises;
const path = require('path');

// Simple implementation of the agent without TypeScript compilation
class ApiUiConnectorAgent {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
  }

  async execute(options) {
    console.log('🔧 API-UI Connection Agent Starting...');
    console.log(`📊 Connecting ${options.api} to UI...`);
    
    const resourceName = 'task';
    const capitalizedResource = 'Task';
    const pluralResource = 'tasks';
    
    // Create directories
    const dirs = [
      path.join(this.projectRoot, 'src/types/api'),
      path.join(this.projectRoot, 'src/hooks/api'),
      path.join(this.projectRoot, 'src/components/tasks')
    ];
    
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
    
    // Generate files
    await this.generateTypes();
    await this.generateHook();
    await this.generateListComponent();
    await this.generateFormComponent();
    await this.updatePageComponent();
    
    console.log(`✅ API-UI Connection completed successfully!`);
  }
  
  async generateTypes() {
    const content = `// Auto-generated types for tasks

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  project_id: string
  created_by: string
  assigned_to?: string
  due_date?: string
  estimated_hours?: number
  actual_hours?: number
  progress_percentage?: number
  tags?: string[]
  created_at: string
  updated_at: string
  
  // Relations
  project?: {
    id: string
    name: string
    code: string
  }
  created_by_user?: {
    id: string
    full_name: string
    email: string
  }
  assigned_to_user?: {
    id: string
    full_name: string
    email: string
  }
}

export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'done' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface CreateTaskData {
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  project_id: string
  assigned_to?: string
  due_date?: string
  estimated_hours?: number
  tags?: string[]
}

export interface UpdateTaskData {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  assigned_to?: string
  due_date?: string
  estimated_hours?: number
  actual_hours?: number
  progress_percentage?: number
  tags?: string[]
}

export interface TaskFilters {
  project_id?: string
  status?: TaskStatus
  priority?: TaskPriority
  assigned_to?: string
  created_by?: string
  search?: string
  date_from?: string
  date_to?: string
}

export interface TaskResponse {
  success: boolean
  data: Task
  error?: string
}

export interface TaskListResponse {
  success: boolean
  data: Task[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  error?: string
}

export interface TaskComment {
  id: string
  task_id: string
  user_id: string
  comment: string
  created_at: string
  updated_at: string
  user?: {
    id: string
    full_name: string
    email: string
  }
}

export interface CreateTaskCommentData {
  comment: string
}`;
    
    await fs.writeFile(
      path.join(this.projectRoot, 'src/types/api/tasks.ts'),
      content,
      'utf-8'
    );
    console.log('✅ Generated types');
  }
  
  async generateHook() {
    const content = `import { useCallback, useState } from 'react'
import { useApiQuery } from '@/hooks/useApiQuery'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import type { Task, CreateTaskData, UpdateTaskData } from '@/types/api/tasks'

interface UseTaskApiOptions {
  enabled?: boolean
  filters?: Record<string, any>
  sortField?: string
  sortDirection?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export function useTasksApi(options: UseTaskApiOptions = {}) {
  const { getAccessToken } = useAuth()
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch tasks list
  const {
    data: tasks,
    loading,
    error,
    refetch
  } = useApiQuery<Task[]>({
    endpoint: '/api/tasks',
    params: {
      ...options.filters,
      sort_field: options.sortField,
      sort_direction: options.sortDirection,
      page: options.page,
      limit: options.limit
    },
    cacheKey: 'tasks-list',
    enabled: options.enabled !== false,
    cacheTTL: 30000
  })

  // Create task
  const createTask = useCallback(async (data: CreateTaskData) => {
    setIsCreating(true)
    try {
      const token = await getAccessToken()
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create task')
      }

      const result = await response.json()
      toast.success('Task created successfully')
      refetch() // Refresh the list
      return result.data
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create task')
      throw error
    } finally {
      setIsCreating(false)
    }
  }, [getAccessToken, refetch])

  // Update task
  const updateTask = useCallback(async (id: string, data: UpdateTaskData) => {
    setIsUpdating(true)
    try {
      const token = await getAccessToken()
      const response = await fetch(\`/api/tasks/\${id}\`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update task')
      }

      const result = await response.json()
      toast.success('Task updated successfully')
      refetch() // Refresh the list
      return result.data
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update task')
      throw error
    } finally {
      setIsUpdating(false)
    }
  }, [getAccessToken, refetch])

  // Delete task
  const deleteTask = useCallback(async (id: string) => {
    setIsDeleting(true)
    try {
      const token = await getAccessToken()
      const response = await fetch(\`/api/tasks/\${id}\`, {
        method: 'DELETE',
        headers: {
          'Authorization': \`Bearer \${token}\`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete task')
      }

      toast.success('Task deleted successfully')
      refetch() // Refresh the list
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete task')
      throw error
    } finally {
      setIsDeleting(false)
    }
  }, [getAccessToken, refetch])

  // Get single task
  const getTask = useCallback(async (id: string) => {
    try {
      const token = await getAccessToken()
      const response = await fetch(\`/api/tasks/\${id}\`, {
        headers: {
          'Authorization': \`Bearer \${token}\`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch task')
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch task')
      throw error
    }
  }, [getAccessToken])

  return {
    // Data
    tasks: tasks || [],
    loading,
    error,
    
    // Actions
    createTask,
    updateTask,
    deleteTask,
    getTask,
    refetch,
    
    // Loading states
    isCreating,
    isUpdating,
    isDeleting
  }
}`;

    await fs.writeFile(
      path.join(this.projectRoot, 'src/hooks/api/useTasksApi.ts'),
      content,
      'utf-8'
    );
    console.log('✅ Generated hook');
  }
  
  async generateListComponent() {
    const content = `'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataStateWrapper } from '@/components/ui/loading-states'
import { Plus, MoreHorizontal, Pencil, Trash, Search, Filter } from 'lucide-react'
import { useTasksApi } from '@/hooks/api/useTasksApi'
import { TaskForm } from './TaskForm'
import type { Task, TaskStatus, TaskPriority } from '@/types/api/tasks'

interface TasksListProps {
  projectId?: string
}

export function TasksList({ projectId }: TasksListProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingItem, setEditingItem] = useState<Task | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all')

  const {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    isCreating,
    isUpdating,
    isDeleting,
    refetch
  } = useTasksApi({
    filters: {
      ...(projectId && { project_id: projectId }),
      ...(searchTerm && { search: searchTerm }),
      ...(statusFilter !== 'all' && { status: statusFilter }),
      ...(priorityFilter !== 'all' && { priority: priorityFilter })
    }
  })

  const handleCreate = async (data: any) => {
    try {
      await createTask(data)
      setShowCreateForm(false)
    } catch (error) {
      // Error handled by hook
    }
  }

  const handleUpdate = async (data: any) => {
    if (!editingItem) return
    try {
      await updateTask(editingItem.id, data)
      setEditingItem(null)
    } catch (error) {
      // Error handled by hook
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTask(id)
    }
  }

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'done': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'review': return 'bg-purple-100 text-purple-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Tasks</CardTitle>
          <Button 
            onClick={() => setShowCreateForm(true)}
            disabled={isCreating}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('pending')}>
                Pending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('in_progress')}>
                In Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('done')}>
                Done
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Priority</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setPriorityFilter('all')}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPriorityFilter('urgent')}>
                Urgent
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPriorityFilter('high')}>
                High
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPriorityFilter('medium')}>
                Medium
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPriorityFilter('low')}>
                Low
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* List */}
        <DataStateWrapper 
          loading={loading} 
          error={error} 
          data={tasks} 
          onRetry={refetch}
          emptyMessage="No tasks found"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.title}
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(item.status)}>
                      {item.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(item.priority)}>
                      {item.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.assigned_to_user?.full_name || '-'}
                  </TableCell>
                  <TableCell>
                    {item.due_date 
                      ? new Date(item.due_date).toLocaleDateString()
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                          disabled={isUpdating || isDeleting}
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => setEditingItem(item)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataStateWrapper>

        {/* Create/Edit Form Dialog */}
        {(showCreateForm || editingItem) && (
          <TaskForm
            task={editingItem}
            projectId={projectId}
            onSubmit={editingItem ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowCreateForm(false)
              setEditingItem(null)
            }}
            isSubmitting={isCreating || isUpdating}
          />
        )}
      </CardContent>
    </Card>
  )
}`;

    await fs.writeFile(
      path.join(this.projectRoot, 'src/components/tasks/TasksList.tsx'),
      content,
      'utf-8'
    );
    console.log('✅ Generated list component');
  }
  
  async generateFormComponent() {
    const content = `'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useProjects } from '@/hooks/useProjects'
import type { Task, CreateTaskData, UpdateTaskData } from '@/types/api/tasks'

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'review', 'done', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  project_id: z.string().uuid('Invalid project ID'),
  assigned_to: z.string().optional(),
  due_date: z.date().optional(),
  estimated_hours: z.number().min(0).optional(),
  tags: z.array(z.string()).optional()
})

type TaskFormData = z.infer<typeof taskSchema>

interface TaskFormProps {
  task?: Task | null
  projectId?: string
  onSubmit: (data: CreateTaskData | UpdateTaskData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function TaskForm({
  task,
  projectId,
  onSubmit,
  onCancel,
  isSubmitting = false
}: TaskFormProps) {
  const [open, setOpen] = useState(true)
  const { projects } = useProjects()
  
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      status: task?.status || 'pending',
      priority: task?.priority || 'medium',
      project_id: task?.project_id || projectId || '',
      assigned_to: task?.assigned_to || '',
      due_date: task?.due_date ? new Date(task.due_date) : undefined,
      estimated_hours: task?.estimated_hours || undefined,
      tags: task?.tags || []
    }
  })

  const handleSubmit = async (data: TaskFormData) => {
    try {
      const submitData = {
        ...data,
        due_date: data.due_date?.toISOString(),
        assigned_to: data.assigned_to || undefined
      }
      
      await onSubmit(submitData as any)
      setOpen(false)
    } catch (error) {
      // Error handled by parent
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onCancel()
    }
    setOpen(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {task ? 'Edit Task' : 'Create Task'}
          </DialogTitle>
          <DialogDescription>
            {task 
              ? 'Update the task details below.'
              : 'Fill in the details to create a new task.'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter task title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Enter task description"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="project_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimated_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Hours</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        placeholder="0"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : task ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}`;

    await fs.writeFile(
      path.join(this.projectRoot, 'src/components/tasks/TaskForm.tsx'),
      content,
      'utf-8'
    );
    console.log('✅ Generated form component');
  }
  
  async updatePageComponent() {
    const content = `'use client'

import { useSearchParams } from 'next/navigation'
import { TasksList } from '@/components/tasks/TasksList'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckSquare, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import { useTasksApi } from '@/hooks/api/useTasksApi'

export default function TasksPage() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project_id')
  
  const { tasks, loading } = useTasksApi({
    filters: projectId ? { project_id: projectId } : undefined
  })

  // Calculate statistics
  const stats = {
    total: tasks?.length || 0,
    pending: tasks?.filter(t => t.status === 'pending').length || 0,
    inProgress: tasks?.filter(t => t.status === 'in_progress').length || 0,
    completed: tasks?.filter(t => t.status === 'done').length || 0,
    overdue: tasks?.filter(t => {
      if (!t.due_date || t.status === 'done' || t.status === 'cancelled') return false
      return new Date(t.due_date) < new Date()
    }).length || 0
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Task Management</h1>
        <p className="text-gray-600">
          Manage tasks and track progress across your projects
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All tasks in the system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              Currently being worked on
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">
              Past their due date
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              Successfully completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      <TasksList projectId={projectId || undefined} />
    </div>
  )
}`;

    await fs.writeFile(
      path.join(this.projectRoot, 'src/app/tasks/page.tsx'),
      content,
      'utf-8'
    );
    console.log('✅ Updated page component');
  }
}

// Execute the agent
const projectRoot = 'C:\\Users\\Kerem\\Desktop\\formulapmv2';
const agent = new ApiUiConnectorAgent(projectRoot);

agent.execute({
  api: '/api/tasks',
  page: '/tasks',
  operations: 'crud'
}).then(() => {
  console.log('✨ Done!');
}).catch(error => {
  console.error('❌ Error:', error);
});