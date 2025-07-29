import * as fs from 'fs/promises'
import * as path from 'path'
import { ApiAnalysis } from '../analyzers/api-analyzer'

export async function generateFormComponent(
  projectRoot: string,
  resourceName: string,
  analysis: ApiAnalysis
): Promise<string> {
  const capitalizedResource = capitalize(resourceName)
  const pluralResource = pluralize(resourceName)
  const componentPath = path.join(projectRoot, 'src/components', pluralResource, `${capitalizedResource}Form.tsx`)
  
  const componentContent = generateFormContent(resourceName, capitalizedResource, pluralResource)
  await fs.writeFile(componentPath, componentContent, 'utf-8')
  
  return componentPath
}

function generateFormContent(
  resourceName: string,
  capitalizedResource: string,
  pluralResource: string
): string {
  return `'use client'

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
import type { ${capitalizedResource}, Create${capitalizedResource}Data, Update${capitalizedResource}Data } from '@/types/api/${pluralResource}'

const ${resourceName}Schema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'review', 'done', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  project_id: z.string().uuid('Invalid project ID'),
  assigned_to: z.string().uuid('Invalid user ID').optional(),
  due_date: z.date().optional(),
  estimated_hours: z.number().min(0).optional(),
  tags: z.array(z.string()).optional()
})

type ${capitalizedResource}FormData = z.infer<typeof ${resourceName}Schema>

interface ${capitalizedResource}FormProps {
  ${resourceName}?: ${capitalizedResource} | null
  projectId?: string
  onSubmit: (data: Create${capitalizedResource}Data | Update${capitalizedResource}Data) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function ${capitalizedResource}Form({
  ${resourceName},
  projectId,
  onSubmit,
  onCancel,
  isSubmitting = false
}: ${capitalizedResource}FormProps) {
  const [open, setOpen] = useState(true)
  
  const form = useForm<${capitalizedResource}FormData>({
    resolver: zodResolver(${resourceName}Schema),
    defaultValues: {
      title: ${resourceName}?.title || '',
      description: ${resourceName}?.description || '',
      status: ${resourceName}?.status || 'pending',
      priority: ${resourceName}?.priority || 'medium',
      project_id: ${resourceName}?.project_id || projectId || '',
      assigned_to: ${resourceName}?.assigned_to || '',
      due_date: ${resourceName}?.due_date ? new Date(${resourceName}.due_date) : undefined,
      estimated_hours: ${resourceName}?.estimated_hours || undefined,
      tags: ${resourceName}?.tags || []
    }
  })

  const handleSubmit = async (data: ${capitalizedResource}FormData) => {
    try {
      const submitData = {
        ...data,
        due_date: data.due_date?.toISOString()
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
            {${resourceName} ? 'Edit ${capitalizedResource}' : 'Create ${capitalizedResource}'}
          </DialogTitle>
          <DialogDescription>
            {${resourceName} 
              ? 'Update the ${resourceName} details below.'
              : 'Fill in the details to create a new ${resourceName}.'}
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
                    <Input {...field} placeholder="Enter ${resourceName} title" />
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
                      placeholder="Enter ${resourceName} description"
                      rows={3}
                    />
                  </FormControl>
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
                {isSubmitting ? 'Saving...' : ${resourceName} ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
`
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function pluralize(str: string): string {
  if (str.endsWith('y')) {
    return str.slice(0, -1) + 'ies'
  } else if (str.endsWith('s') || str.endsWith('x') || str.endsWith('ch')) {
    return str + 'es'
  }
  return str + 's'
}