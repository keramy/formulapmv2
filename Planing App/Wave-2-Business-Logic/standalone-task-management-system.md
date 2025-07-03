# Standalone Task Management System - Wave 2 Business Logic
## Enhanced Coordinator Agent Implementation

### **🎯 OBJECTIVE**
Implement a comprehensive standalone task management system with intelligent @mention functionality, collaborative comments, and seamless integration with Formula PM's project ecosystem.

### **📋 TASK BREAKDOWN FOR COORDINATOR**

**FOUNDATION TASKS (Wait for Wave 1 approval - spawn after database, auth, and project creation ready):**
1. **Standalone Task Entity System**: Independent task management beyond scope items
2. **@Mention Intelligence Engine**: Smart linking to projects, scope items, documents, users
3. **Collaborative Comments System**: Threaded discussions with real-time features
4. **Task Navigation Dashboard**: Integrated UI with contextual navigation
5. **Real-time Collaboration**: Live updates and notifications

**DEPENDENT TASKS (Wait for foundation approval):**
6. **Advanced Task Features**: Dependencies, templates, automation
7. **Mobile Task Interface**: Field-optimized task management
8. **Analytics & Reporting**: Task performance and productivity metrics

---

## **📊 Enhanced Task Management Data Structure**

### **Core Task Schema with @Mention Support**
```typescript
// types/tasks.ts
export interface Task {
  id: string
  project_id: string
  
  // Core Task Fields
  title: string
  description: string // Rich text with @mention support
  status: TaskStatus
  priority: TaskPriority
  
  // Assignment & Timeline
  assigned_to: string[] // User IDs
  created_by: string
  due_date?: string
  estimated_hours?: number
  actual_hours?: number
  
  // @Mention References (Smart Linking)
  mentioned_projects: string[] // Project IDs referenced with @project
  mentioned_scope_items: string[] // Scope item IDs referenced with @scope
  mentioned_documents: string[] // Document IDs referenced with @document/@shopdrawing
  mentioned_users: string[] // User IDs referenced with @user
  mentioned_tasks: string[] // Task IDs referenced with @task
  
  // Task Dependencies (Enhanced from MCP patterns)
  depends_on: string[] // Task IDs this task depends on
  blocks: string[] // Task IDs this task blocks
  parent_task_id?: string // For subtasks
  
  // Collaboration & Tracking
  comments_count: number
  attachments: TaskAttachment[]
  tags: string[]
  
  // Metadata
  created_at: string
  updated_at: string
  completed_at?: string
  last_activity_at: string
}

export type TaskStatus = 
  | 'todo'
  | 'in_progress' 
  | 'review'
  | 'blocked'
  | 'done'
  | 'cancelled'

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface TaskComment {
  id: string
  task_id: string
  user_id: string
  content: string // Rich text with @mention support
  mentioned_users: string[] // Users mentioned in this comment
  parent_comment_id?: string // For threaded comments
  attachments: CommentAttachment[]
  reactions: CommentReaction[]
  created_at: string
  updated_at: string
  is_edited: boolean
}

export interface TaskAttachment {
  id: string
  task_id: string
  filename: string
  file_url: string
  file_size: number
  mime_type: string
  uploaded_by: string
  uploaded_at: string
}

export interface CommentReaction {
  id: string
  comment_id: string
  user_id: string
  emoji: string
  created_at: string
}

export interface MentionReference {
  id: string
  type: 'project' | 'scope' | 'document' | 'user' | 'task'
  entity_id: string
  entity_title: string
  mentioned_in: 'task_description' | 'comment'
  mentioned_at: string
}
```

---

## **🧠 @Mention Intelligence System**

### **Smart Mention Parser**
```typescript
// lib/mentions/mentionParser.ts
'use client'

import { supabase } from '@/lib/supabase'

export interface MentionMatch {
  type: 'project' | 'scope' | 'document' | 'user' | 'task'
  id: string
  title: string
  startIndex: number
  endIndex: number
  url: string
}

export interface MentionSuggestion {
  type: 'project' | 'scope' | 'document' | 'user' | 'task'
  id: string
  title: string
  subtitle?: string
  avatar?: string
  url: string
  icon: string
}

export class MentionParser {
  private static readonly MENTION_REGEX = /@(\w+):(\w+)/g
  private static readonly MENTION_PATTERNS = {
    project: /@project:([a-zA-Z0-9-_]+)/g,
    scope: /@scope:([a-zA-Z0-9-_]+)/g,
    document: /@(?:document|shopdrawing):([a-zA-Z0-9-_]+)/g,
    user: /@user:([a-zA-Z0-9-_]+)/g,
    task: /@task:([a-zA-Z0-9-_]+)/g
  }

  // Parse @mentions in text and return structured data
  static async parseMentions(text: string, projectId: string): Promise<MentionMatch[]> {
    const mentions: MentionMatch[] = []
    
    for (const [type, regex] of Object.entries(this.MENTION_PATTERNS)) {
      let match
      while ((match = regex.exec(text)) !== null) {
        const entityId = match[1]
        const entity = await this.resolveEntity(type as any, entityId, projectId)
        
        if (entity) {
          mentions.push({
            type: type as any,
            id: entityId,
            title: entity.title,
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            url: this.generateEntityUrl(type as any, entityId, projectId)
          })
        }
      }
    }
    
    return mentions.sort((a, b) => a.startIndex - b.startIndex)
  }

  // Get suggestions for @mention autocomplete
  static async getSuggestions(
    query: string, 
    type: string, 
    projectId: string,
    limit: number = 10
  ): Promise<MentionSuggestion[]> {
    switch (type) {
      case 'project':
        return this.getProjectSuggestions(query, limit)
      case 'scope':
        return this.getScopeSuggestions(query, projectId, limit)
      case 'document':
        return this.getDocumentSuggestions(query, projectId, limit)
      case 'user':
        return this.getUserSuggestions(query, projectId, limit)
      case 'task':
        return this.getTaskSuggestions(query, projectId, limit)
      default:
        return []
    }
  }

  private static async resolveEntity(type: string, id: string, projectId: string) {
    try {
      switch (type) {
        case 'project':
          const { data: project } = await supabase
            .from('projects')
            .select('id, name')
            .eq('id', id)
            .single()
          return { title: project?.name }

        case 'scope':
          const { data: scope } = await supabase
            .from('scope_items')
            .select('id, description, item_no')
            .eq('project_id', projectId)
            .eq('item_no', parseInt(id))
            .single()
          return { title: `#${scope?.item_no}: ${scope?.description}` }

        case 'document':
          const { data: doc } = await supabase
            .from('documents')
            .select('id, title')
            .eq('project_id', projectId)
            .eq('id', id)
            .single()
          return { title: doc?.title }

        case 'user':
          const { data: user } = await supabase
            .from('user_profiles')
            .select('id, first_name, last_name')
            .eq('id', id)
            .single()
          return { title: `${user?.first_name} ${user?.last_name}` }

        case 'task':
          const { data: task } = await supabase
            .from('tasks')
            .select('id, title')
            .eq('project_id', projectId)
            .eq('id', id)
            .single()
          return { title: task?.title }

        default:
          return null
      }
    } catch (error) {
      console.error(`Failed to resolve ${type}:${id}`, error)
      return null
    }
  }

  private static generateEntityUrl(type: string, id: string, projectId: string): string {
    const baseUrl = `/projects/${projectId}`
    
    switch (type) {
      case 'project':
        return `/projects/${id}`
      case 'scope':
        return `${baseUrl}/scope?item=${id}`
      case 'document':
        return `${baseUrl}/documents/${id}`
      case 'user':
        return `/team/${id}`
      case 'task':
        return `${baseUrl}/tasks/${id}`
      default:
        return '#'
    }
  }

  private static async getProjectSuggestions(query: string, limit: number): Promise<MentionSuggestion[]> {
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, client_id')
      .ilike('name', `%${query}%`)
      .limit(limit)

    return projects?.map(p => ({
      type: 'project',
      id: p.id,
      title: p.name,
      subtitle: 'Project',
      url: `/projects/${p.id}`,
      icon: 'FolderOpen'
    })) || []
  }

  private static async getScopeSuggestions(query: string, projectId: string, limit: number): Promise<MentionSuggestion[]> {
    const { data: items } = await supabase
      .from('scope_items')
      .select('id, item_no, description, category')
      .eq('project_id', projectId)
      .or(`description.ilike.%${query}%,item_no.eq.${parseInt(query) || -1}`)
      .limit(limit)

    return items?.map(item => ({
      type: 'scope',
      id: item.item_no.toString(),
      title: `#${item.item_no}: ${item.description}`,
      subtitle: `${item.category} scope item`,
      url: `/projects/${projectId}/scope?item=${item.item_no}`,
      icon: 'Package'
    })) || []
  }

  private static async getDocumentSuggestions(query: string, projectId: string, limit: number): Promise<MentionSuggestion[]> {
    const { data: docs } = await supabase
      .from('documents')
      .select('id, title, document_type')
      .eq('project_id', projectId)
      .ilike('title', `%${query}%`)
      .limit(limit)

    return docs?.map(doc => ({
      type: 'document',
      id: doc.id,
      title: doc.title,
      subtitle: doc.document_type.replace('_', ' '),
      url: `/projects/${projectId}/documents/${doc.id}`,
      icon: doc.document_type === 'shop_drawing' ? 'FileText' : 'File'
    })) || []
  }

  private static async getUserSuggestions(query: string, projectId: string, limit: number): Promise<MentionSuggestion[]> {
    const { data: users } = await supabase
      .from('project_assignments')
      .select(`
        user_id,
        user_profiles!inner(id, first_name, last_name, role)
      `)
      .eq('project_id', projectId)
      .eq('is_active', true)
      .or(`user_profiles.first_name.ilike.%${query}%,user_profiles.last_name.ilike.%${query}%`)
      .limit(limit)

    return users?.map(assignment => {
      const user = assignment.user_profiles
      return {
        type: 'user',
        id: user.id,
        title: `${user.first_name} ${user.last_name}`,
        subtitle: user.role.replace('_', ' '),
        url: `/team/${user.id}`,
        icon: 'User'
      }
    }) || []
  }

  private static async getTaskSuggestions(query: string, projectId: string, limit: number): Promise<MentionSuggestion[]> {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, status, priority')
      .eq('project_id', projectId)
      .ilike('title', `%${query}%`)
      .limit(limit)

    return tasks?.map(task => ({
      type: 'task',
      id: task.id,
      title: task.title,
      subtitle: `${task.status} • ${task.priority} priority`,
      url: `/projects/${projectId}/tasks/${task.id}`,
      icon: 'CheckSquare'
    })) || []
  }
}
```

---

## **💬 Collaborative Comments System**

### **Real-time Comment Interface**
```typescript
// components/tasks/TaskComments.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  MessageCircle, 
  Reply, 
  MoreHorizontal, 
  Heart, 
  ThumbsUp,
  Edit,
  Trash,
  Paperclip
} from 'lucide-react'
import { TaskComment, Task } from '@/types/tasks'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { MentionEditor } from './MentionEditor'
import { CommentThread } from './CommentThread'
import { supabase } from '@/lib/supabase'

interface TaskCommentsProps {
  task: Task
  projectId: string
}

export const TaskComments: React.FC<TaskCommentsProps> = ({ task, projectId }) => {
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  const { canComment } = usePermissions()
  
  // Fetch comments with real-time subscription
  const { data: comments, isLoading } = useQuery({
    queryKey: ['task-comments', task.id],
    queryFn: () => fetchTaskComments(task.id),
  })

  // Set up real-time subscription for comments
  useEffect(() => {
    const subscription = supabase
      .channel(`task-comments-${task.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_comments',
          filter: `task_id=eq.${task.id}`
        },
        () => {
          queryClient.invalidateQueries(['task-comments', task.id])
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [task.id, queryClient])

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !profile) return
    
    setIsSubmitting(true)
    try {
      await createTaskComment({
        task_id: task.id,
        content: newComment,
        parent_comment_id: replyingTo,
        user_id: profile.id
      })
      
      setNewComment('')
      setReplyingTo(null)
      queryClient.invalidateQueries(['task-comments', task.id])
    } catch (error) {
      console.error('Failed to create comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Group comments into threads
  const commentThreads = groupCommentsIntoThreads(comments || [])

  if (!canComment()) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          You don't have permission to view comments on this task.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5" />
          <span>Comments</span>
          <Badge variant="secondary">{task.comments_count}</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* New Comment Editor */}
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {profile?.first_name?.[0]}{profile?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <MentionEditor
                value={newComment}
                onChange={setNewComment}
                placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
                projectId={projectId}
                className="min-h-[80px]"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Paperclip className="h-4 w-4 mr-2" />
                Attach File
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              {replyingTo && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(null)}
                >
                  Cancel Reply
                </Button>
              )}
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
                size="sm"
              >
                {isSubmitting ? 'Posting...' : replyingTo ? 'Reply' : 'Comment'}
              </Button>
            </div>
          </div>
        </div>

        {/* Comment Threads */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="flex space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {commentThreads.map(thread => (
              <CommentThread
                key={thread.id}
                comment={thread}
                taskId={task.id}
                projectId={projectId}
                onReply={setReplyingTo}
              />
            ))}
            
            {commentThreads.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No comments yet. Be the first to start the discussion!</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Helper functions for comment management
async function fetchTaskComments(taskId: string): Promise<TaskComment[]> {
  const { data, error } = await supabase
    .from('task_comments')
    .select(`
      *,
      user_profiles!inner(id, first_name, last_name, role)
    `)
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

async function createTaskComment(comment: Partial<TaskComment>): Promise<TaskComment> {
  const { data, error } = await supabase
    .from('task_comments')
    .insert(comment)
    .select()
    .single()

  if (error) throw error
  return data
}

function groupCommentsIntoThreads(comments: TaskComment[]): TaskComment[] {
  const threadsMap = new Map<string, TaskComment>()
  const threads: TaskComment[] = []

  // First pass: identify top-level comments
  comments.forEach(comment => {
    if (!comment.parent_comment_id) {
      threadsMap.set(comment.id, { ...comment, replies: [] })
      threads.push(threadsMap.get(comment.id)!)
    }
  })

  // Second pass: attach replies to their parents
  comments.forEach(comment => {
    if (comment.parent_comment_id) {
      const parent = threadsMap.get(comment.parent_comment_id)
      if (parent) {
        parent.replies = parent.replies || []
        parent.replies.push(comment)
      }
    }
  })

  return threads
}
```

---

## **🎨 Task Management UI Components**

### **Enhanced Task Creator with @Mentions**
```typescript
// components/tasks/TaskCreator.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, Plus, X, Users, Link } from 'lucide-react'
import { Task, TaskPriority, TaskStatus } from '@/types/tasks'
import { MentionEditor } from './MentionEditor'
import { UserSelector } from './UserSelector'
import { DatePicker } from '@/components/ui/date-picker'
import { MentionParser } from '@/lib/mentions/mentionParser'

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assigned_to: z.array(z.string()).optional(),
  due_date: z.string().optional(),
  estimated_hours: z.number().min(0).optional(),
  tags: z.array(z.string()).optional(),
})

interface TaskCreatorProps {
  projectId: string
  onTaskCreated: (task: Task) => void
  onCancel: () => void
  parentTaskId?: string
}

export const TaskCreator: React.FC<TaskCreatorProps> = ({
  projectId,
  onTaskCreated,
  onCancel,
  parentTaskId
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mentionedEntities, setMentionedEntities] = useState<any[]>([])
  const [customTags, setCustomTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: 'medium' as TaskPriority,
      assigned_to: [],
      tags: []
    }
  })

  const description = watch('description') || ''

  const handleDescriptionChange = async (value: string) => {
    setValue('description', value)
    
    // Parse @mentions in real-time
    try {
      const mentions = await MentionParser.parseMentions(value, projectId)
      setMentionedEntities(mentions)
    } catch (error) {
      console.error('Failed to parse mentions:', error)
    }
  }

  const handleAddTag = () => {
    if (newTag.trim() && !customTags.includes(newTag.trim())) {
      const updatedTags = [...customTags, newTag.trim()]
      setCustomTags(updatedTags)
      setValue('tags', updatedTags)
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = customTags.filter(tag => tag !== tagToRemove)
    setCustomTags(updatedTags)
    setValue('tags', updatedTags)
  }

  const onSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      // Extract mention references from description
      const mentions = await MentionParser.parseMentions(data.description || '', projectId)
      
      const newTask: Partial<Task> = {
        ...data,
        project_id: projectId,
        parent_task_id: parentTaskId,
        status: 'todo' as TaskStatus,
        mentioned_projects: mentions.filter(m => m.type === 'project').map(m => m.id),
        mentioned_scope_items: mentions.filter(m => m.type === 'scope').map(m => m.id),
        mentioned_documents: mentions.filter(m => m.type === 'document').map(m => m.id),
        mentioned_users: mentions.filter(m => m.type === 'user').map(m => m.id),
        mentioned_tasks: mentions.filter(m => m.type === 'task').map(m => m.id),
      }

      const createdTask = await createTask(newTask)
      onTaskCreated(createdTask)
    } catch (error) {
      console.error('Failed to create task:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>{parentTaskId ? 'Create Subtask' : 'Create New Task'}</span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Enter task title..."
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Description with @Mention Support */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <MentionEditor
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Describe the task... Use @project, @scope, @user, @task, @document to link to other items"
              projectId={projectId}
              className="min-h-[120px]"
            />
            
            {/* Show mentioned entities */}
            {mentionedEntities.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-gray-600">Referenced Items:</Label>
                <div className="flex flex-wrap gap-2">
                  {mentionedEntities.map((mention, index) => (
                    <Badge key={index} variant="outline" className="flex items-center space-x-1">
                      <Link className="h-3 w-3" />
                      <span>{mention.type}: {mention.title}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Priority and Assignment Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={watch('priority')}
                onValueChange={(value) => setValue('priority', value as TaskPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assign To</Label>
              <UserSelector
                projectId={projectId}
                selectedUsers={watch('assigned_to') || []}
                onSelectionChange={(users) => setValue('assigned_to', users)}
              />
            </div>
          </div>

          {/* Due Date and Estimation Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Due Date</Label>
              <DatePicker
                value={watch('due_date')}
                onChange={(date) => setValue('due_date', date)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_hours">Estimated Hours</Label>
              <Input
                id="estimated_hours"
                type="number"
                min="0"
                step="0.5"
                {...register('estimated_hours', { valueAsNumber: true })}
                placeholder="e.g., 4.5"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex items-center space-x-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" variant="outline" onClick={handleAddTag} size="sm">
                Add
              </Button>
            </div>
            
            {customTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {customTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// Helper function to create task via API
async function createTask(taskData: Partial<Task>): Promise<Task> {
  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData)
  })
  
  if (!response.ok) {
    throw new Error('Failed to create task')
  }
  
  return response.json()
}
```

---

## **🗄️ Enhanced Database Schema**

### **Task Tables with @Mention Support**
```sql
-- Enhanced task status and priority enums
CREATE TYPE task_status AS ENUM (
  'todo',
  'in_progress',
  'review', 
  'blocked',
  'done',
  'cancelled'
);

CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Main tasks table (standalone from scope)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  
  -- Core Task Fields
  title TEXT NOT NULL,
  description TEXT, -- Rich text with @mention support
  status task_status DEFAULT 'todo',
  priority task_priority DEFAULT 'medium',
  
  -- Assignment & Timeline
  assigned_to UUID[] DEFAULT '{}', -- User IDs
  created_by UUID REFERENCES user_profiles(id),
  due_date DATE,
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2) DEFAULT 0,
  
  -- @Mention References (Smart Linking)
  mentioned_projects UUID[] DEFAULT '{}', -- Project IDs referenced with @project
  mentioned_scope_items UUID[] DEFAULT '{}', -- Scope item IDs referenced with @scope
  mentioned_documents UUID[] DEFAULT '{}', -- Document IDs referenced with @document
  mentioned_users UUID[] DEFAULT '{}', -- User IDs referenced with @user
  mentioned_tasks UUID[] DEFAULT '{}', -- Task IDs referenced with @task
  
  -- Task Dependencies (Enhanced from MCP patterns)
  depends_on UUID[] DEFAULT '{}', -- Task IDs this task depends on
  blocks UUID[] DEFAULT '{}', -- Task IDs this task blocks
  
  -- Collaboration & Tracking
  comments_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task comments with threading support
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id),
  parent_comment_id UUID REFERENCES task_comments(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL, -- Rich text with @mention support
  mentioned_users UUID[] DEFAULT '{}', -- Users mentioned in this comment
  
  is_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task attachments
CREATE TABLE task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES user_profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comment attachments
CREATE TABLE comment_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES task_comments(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES user_profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comment reactions (emoji responses)
CREATE TABLE comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES task_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id),
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id, emoji)
);

-- Task activity log for notifications and history
CREATE TABLE task_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id),
  activity_type TEXT NOT NULL, -- 'created', 'updated', 'commented', 'assigned', 'completed'
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_assigned ON tasks USING gin(assigned_to);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_mentions_projects ON tasks USING gin(mentioned_projects);
CREATE INDEX idx_tasks_mentions_scope ON tasks USING gin(mentioned_scope_items);
CREATE INDEX idx_tasks_mentions_users ON tasks USING gin(mentioned_users);
CREATE INDEX idx_tasks_depends_on ON tasks USING gin(depends_on);
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);

CREATE INDEX idx_task_comments_task ON task_comments(task_id);
CREATE INDEX idx_task_comments_user ON task_comments(user_id);
CREATE INDEX idx_task_comments_parent ON task_comments(parent_comment_id);
CREATE INDEX idx_task_comments_mentioned ON task_comments USING gin(mentioned_users);

-- Triggers for auto-updating timestamps and activity tracking
CREATE OR REPLACE FUNCTION update_task_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_activity_at = NOW();
  
  -- Log activity
  INSERT INTO task_activities (task_id, user_id, activity_type, details)
  VALUES (NEW.id, NEW.created_by, 'updated', 
    json_build_object('old_status', OLD.status, 'new_status', NEW.status));
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_task_activity_trigger
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE PROCEDURE update_task_activity();

-- Trigger to update comment count on tasks
CREATE OR REPLACE FUNCTION update_task_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tasks 
    SET comments_count = comments_count + 1,
        last_activity_at = NOW()
    WHERE id = NEW.task_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tasks 
    SET comments_count = comments_count - 1,
        last_activity_at = NOW()
    WHERE id = OLD.task_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER task_comment_count_trigger
  AFTER INSERT OR DELETE ON task_comments
  FOR EACH ROW EXECUTE PROCEDURE update_task_comment_count();
```

---

## **🔧 COORDINATOR IMPLEMENTATION INSTRUCTIONS**

### **Subagent Spawning Strategy**
```
TASK: Standalone Task Management System Implementation
OBJECTIVE: Deploy comprehensive task management with @mention intelligence and collaborative features
CONTEXT: Advanced task system beyond scope-centric workflows for Formula PM 2.0

REQUIRED READING:
- Patterns: @Patterns/optimized-coordinator-v1.md
- Database: @Planing App/Wave-1-Foundation/database-schema-design.md
- UI Framework: @Planing App/Wave-1-Foundation/core-ui-framework.md
- MCP Integration: Context7 findings on task management patterns
- Templates: @Patterns/templates/subagent-template.md

IMPLEMENTATION REQUIREMENTS:
1. Implement standalone task entity system with full CRUD operations
2. Build intelligent @mention parser with autocomplete for 5 entity types
3. Create real-time collaborative comment system with threading
4. Implement rich text editor with @mention highlighting and navigation
5. Build task dashboard with contextual filtering and cross-references
6. Create notification system for @mentions and task updates

DELIVERABLES:
1. Complete task management interface with @mention intelligence
2. Real-time comment system with file attachments and reactions
3. Smart autocomplete system for projects, scope, documents, users, tasks
4. Clickable @mention navigation with context previews
5. Task analytics and productivity insights
6. Mobile-optimized task interface for field users
```

### **Quality Gates**
- ✅ @Mention parsing works across all 5 entity types with smart suggestions
- ✅ Real-time collaboration updates instantly across all connected users
- ✅ Comment threading supports unlimited nested levels with performance
- ✅ Task dependencies prevent circular references and maintain integrity
- ✅ Navigation from @mentions opens correct entities with context
- ✅ Permission system respects role-based access for all task operations

### **Dependencies for Next Wave**
- Task management system must integrate seamlessly with scope workflow
- @Mention system must extend to Wave 3 document approval workflows
- Comment system ready for client/subcontractor external access
- Analytics foundation prepared for Wave 4 AI optimization features

---

## **🎯 SUCCESS CRITERIA**
1. **@Mention Intelligence**: Smart linking across projects, scope, documents, users, tasks
2. **Real-time Collaboration**: Live comments, notifications, and activity updates
3. **Contextual Navigation**: Seamless navigation between mentioned entities
4. **Performance**: Sub-200ms @mention suggestions, real-time updates < 100ms
5. **User Experience**: Intuitive task creation with rich formatting and attachments

**Evaluation Score Target**: 90+ using @Patterns/templates/evaluator-prompt.md