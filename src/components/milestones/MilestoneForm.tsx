/**
 * Formula PM 2.0 Milestone Form Component
 * V3 Phase 1 Implementation
 * 
 * Create/edit milestone form with validation following task form patterns
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { projectSchemas } from '@/lib/form-validation'
import { format } from 'date-fns'
import { Milestone, MilestoneFormData } from '@/types/milestones'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { 
  Save, 
  X, 
  Calendar as CalendarIcon, 
  Target,
  AlertCircle,
  CheckCircle,
  Circle,
  PlayCircle,
  XCircle
} from 'lucide-react'



interface MilestoneFormProps {
  milestone?: Milestone
  projectId: string
  mode: 'create' | 'edit' | 'view'
  onSave: (data: MilestoneFormData) => Promise<void>
  onCancel: () => void
}

export const MilestoneForm: React.FC<MilestoneFormProps> = ({
  milestone,
  projectId,
  mode,
  onSave,
  onCancel
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<MilestoneFormData>({
    resolver: zodResolver(projectSchemas.milestone),
    defaultValues: {
      name: milestone?.name || '',
      description: milestone?.description || '',
      target_date: milestone?.target_date || '',
      status: milestone?.status || 'upcoming'
    }
  })

  const handleSubmit = async (data: MilestoneFormData) => {
    setIsLoading(true)
    try {
      // Include project_id in the form data
      const formDataWithProject = {
        ...data,
        project_id: projectId
      }
      await onSave(formDataWithProject)
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save milestone",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: Milestone['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'in_progress':
        return <PlayCircle className="h-4 w-4 text-blue-600" />
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-600" />
      default:
        return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: Milestone['status']) => {
    const variants = {
      upcoming: 'secondary',
      in_progress: 'default',
      completed: 'default',
      overdue: 'destructive',
      cancelled: 'secondary'
    } as const

    return (
      <Badge variant={variants[status]} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const isReadOnly = mode === 'view'

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {mode === 'create' ? 'Create New Milestone' : mode === 'edit' ? 'Edit Milestone' : 'View Milestone'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Create a new milestone to track project progress'
              : mode === 'edit'
              ? 'Edit the milestone details'
              : 'View milestone details'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
                <CardDescription>Milestone name and description</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Milestone Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter milestone name (e.g., Foundation Complete)"
                          disabled={isReadOnly}
                        />
                      </FormControl>
                      <FormDescription>
                        Choose a clear, descriptive name for this milestone
                      </FormDescription>
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
                          placeholder="Enter milestone description"
                          rows={3}
                          disabled={isReadOnly}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional details about what this milestone represents
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Status and Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status & Timeline</CardTitle>
                <CardDescription>Milestone status and target completion date</CardDescription>
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
                                {getStatusBadge(field.value)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="upcoming">
                                <div className="flex items-center gap-2">
                                  <Circle className="h-4 w-4 text-gray-400" />
                                  Upcoming
                                </div>
                              </SelectItem>
                              <SelectItem value="in_progress">
                                <div className="flex items-center gap-2">
                                  <PlayCircle className="h-4 w-4 text-blue-600" />
                                  In Progress
                                </div>
                              </SelectItem>
                              <SelectItem value="completed">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  Completed
                                </div>
                              </SelectItem>
                              <SelectItem value="overdue">
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4 text-red-600" />
                                  Overdue
                                </div>
                              </SelectItem>
                              <SelectItem value="cancelled">
                                <div className="flex items-center gap-2">
                                  <XCircle className="h-4 w-4 text-gray-600" />
                                  Cancelled
                                </div>
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
                    name="target_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Date</FormLabel>
                        <FormControl>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                                disabled={isReadOnly}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? (
                                  format(new Date(field.value), "PPP")
                                ) : (
                                  <span>Pick a target date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={(date) => {
                                  if (date) {
                                    field.onChange(format(date, 'yyyy-MM-dd'))
                                  }
                                }}
                                disabled={(date) => date < new Date('2000-01-01')}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </FormControl>
                        <FormDescription>
                          When should this milestone be completed?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Project Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project Information</CardTitle>
                <CardDescription>This milestone belongs to the current project</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Project ID:</span>
                    <span className="text-sm text-muted-foreground">{projectId}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    This milestone will be associated with the current project
                  </p>
                </div>
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
                  {isLoading ? 'Saving...' : mode === 'create' ? 'Create Milestone' : 'Save Changes'}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}