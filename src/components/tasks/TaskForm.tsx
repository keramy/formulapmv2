/**
 * Formula PM 2.0 Task Form Component
 * V3 Phase 1 Implementation
 * 
 * Create/edit task form with validation following scope item editor patterns
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { projectSchemas, validateData, FormValidator } from '@/lib/form-validation'
import { Task, TaskFormData } from '@/types/tasks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { TaskPrioritySelector } from './TaskPrioritySelector'
import { TaskStatusBadge } from './TaskStatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { Save, X, User, Calendar, Clock, Link2, Tag } from 'lucide-react'

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'review', 'completed', 'cancelled', 'blocked']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assigned_to: z.string().optional(),
  due_date: z.string().optional(),
  estimated_hours: z.number().min(0, 'Estimated hours must be positive').optional(),
  scope_item_id: z.string().optional(),
  tags: z.array(z.string()).optional()
})

interface TaskFormProps {
  task?: Task
  projectId: string
  mode: 'create' | 'edit' | 'view'
  onSave: (data: TaskFormData) => Promise<void>
  onCancel: () => void
  scopeItems?: Array<{
    id: string
    item_no: number
    title: string
    description: string
  }>
  projectMembers?: Array<{
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }>
}

export const TaskForm: React.FC<TaskFormProps> = ({
  task,
  projectId,
  mode,
  onSave,
  onCancel,
  scopeItems = [],
  projectMembers = []
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const { toast } = useToast()

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      status: task?.status || 'pending',
      priority: task?.priority || 'medium',
      assigned_to: task?.assigned_to || '',
      due_date: task?.due_date || '',
      estimated_hours: task?.estimated_hours || undefined,
      scope_item_id: task?.scope_item_id || '',
      tags: task?.tags || []
    }
  })

  const { watch, setValue, getValues } = form
  const watchedTags = watch('tags') || []

  const handleSubmit = async (data: TaskFormData) => {
    setIsLoading(true)
    try {
      await onSave(data)
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save task",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      const currentTags = getValues('tags') || []
      if (!currentTags.includes(tagInput.trim())) {
        setValue('tags', [...currentTags, tagInput.trim()])
      }
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = getValues('tags') || []
    setValue('tags', currentTags.filter(tag => tag !== tagToRemove))
  }

  const isReadOnly = mode === 'view'

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Task' : mode === 'edit' ? 'Edit Task' : 'View Task'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Create a new task for this project'
              : mode === 'edit'
              ? 'Edit the task details'
              : 'View task details'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
                <CardDescription>Task title and description</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter task title"
                          disabled={isReadOnly}
                        />
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
                          disabled={isReadOnly}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Status and Priority */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status & Priority</CardTitle>
                <CardDescription>Task status and priority level</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <FormControl>
                          <Select 
                            value={field.value} 
                            onValueChange={field.onChange}
                            disabled={isReadOnly}
                          >
                            <SelectTrigger>
                              <SelectValue>
                                <TaskStatusBadge status={field.value} showIcon />
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
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
                        </FormControl>
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
                        <FormControl>
                          <TaskPrioritySelector
                            value={field.value}
                            onChange={field.onChange}
                            disabled={isReadOnly}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Assignment and Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assignment & Timeline</CardTitle>
                <CardDescription>Task assignment and scheduling</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="assigned_to"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assigned To</FormLabel>
                        <FormControl>
                          <Select 
                            value={field.value} 
                            onValueChange={field.onChange}
                            disabled={isReadOnly}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select assignee">
                                {field.value && (
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    {projectMembers.find(m => m.id === field.value)?.full_name}
                                  </div>
                                )}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Unassigned</SelectItem>
                              {projectMembers.map((member) => (
                                <SelectItem key={member.id} value={member.id}>
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    {member.full_name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="due_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="date"
                            disabled={isReadOnly}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                            step="0.5"
                            min="0"
                            placeholder="0.0"
                            disabled={isReadOnly}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scope_item_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Related Scope Item</FormLabel>
                        <FormControl>
                          <Select 
                            value={field.value} 
                            onValueChange={field.onChange}
                            disabled={isReadOnly}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select scope item">
                                {field.value && (
                                  <div className="flex items-center gap-2">
                                    <Link2 className="h-4 w-4" />
                                    {scopeItems.find(s => s.id === field.value)?.title}
                                  </div>
                                )}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">No scope item</SelectItem>
                              {scopeItems.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  <div className="flex items-center gap-2">
                                    <Link2 className="h-4 w-4" />
                                    #{item.item_no} {item.title}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tags</CardTitle>
                <CardDescription>Add tags to categorize and organize tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isReadOnly && (
                  <div>
                    <Label htmlFor="tag-input">Add Tags</Label>
                    <Input
                      id="tag-input"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder="Type a tag and press Enter"
                      className="mt-2"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Press Enter to add tags
                    </p>
                  </div>
                )}

                {watchedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {watchedTags.map((tag) => (
                      <div
                        key={tag}
                        className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm"
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              
              {!isReadOnly && (
                <Button
                  type="submit"
                  disabled={isLoading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Saving...' : mode === 'create' ? 'Create Task' : 'Save Changes'}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Optimized TaskForm using centralized validation - EXAMPLE FOR AI AGENT
 * This shows how to use the centralized form validation patterns
 */
export function TaskFormOptimized({
  task,
  projectId,
  mode = 'create',
  onSave,
  onCancel
}: TaskFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Use centralized validation schema
  const form = useForm<TaskFormData>({
    resolver: zodResolver(projectSchemas.task),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      status: task?.status || 'pending',
      priority: task?.priority || 'medium',
      assigned_to: task?.assigned_to || '',
      due_date: task?.due_date || '',
      scope_item_id: task?.scope_item_id || ''
    }
  })

  // Alternative: Use FormValidator class for more control
  const validator = new FormValidator(projectSchemas.task)

  const handleSubmit = async (data: TaskFormData) => {
    setIsLoading(true)

    try {
      // Validate using centralized validation
      const validationResult = validateData(projectSchemas.task, data)

      if (!validationResult.success) {
        // Handle validation errors
        Object.entries(validationResult.fieldErrors || {}).forEach(([field, error]) => {
          form.setError(field as keyof TaskFormData, { message: error })
        })
        return
      }

      await onSave(data)

      toast({
        title: mode === 'create' ? 'Task created' : 'Task updated',
        description: `Task "${data.title}" has been ${mode === 'create' ? 'created' : 'updated'} successfully.`
      })

    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Task Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter task title..."
                    {...field}
                    disabled={mode === 'view'}
                  />
                </FormControl>
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
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={mode === 'view'}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={mode === 'view'}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter task description..."
                    className="min-h-[100px]"
                    {...field}
                    disabled={mode === 'view'}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {mode !== 'view' && (
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : mode === 'create' ? 'Create Task' : 'Save Changes'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  )
}