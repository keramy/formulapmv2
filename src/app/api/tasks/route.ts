/**
 * Formula PM 2.0 Task Management API Routes
 * Main CRUD operations for standalone tasks with @mention support
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAuth } from '@/lib/middleware'
import { hasPermission } from '@/lib/permissions'
import { TaskFormData, TaskFilters, TaskListParams } from '@/types/tasks'
import { MentionParser } from '@/lib/mentions'

// ============================================================================
// GET /api/tasks - List tasks with filtering and pagination
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (auth.error || !auth.user || !auth.profile) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!hasPermission(auth.profile.role, 'tasks.view')) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const includeDetails = searchParams.get('include_details') === 'true'
    const includeSubtasks = searchParams.get('include_subtasks') === 'true'
    const includeComments = searchParams.get('include_comments') === 'true'
    
    // Parse filters
    const filters: TaskFilters = {}
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status')!.split(',') as any[]
    }
    if (searchParams.get('priority')) {
      filters.priority = searchParams.get('priority')!.split(',') as any[]
    }
    if (searchParams.get('assigned_to')) {
      filters.assigned_to = searchParams.get('assigned_to')!.split(',')
    }
    if (searchParams.get('project_id')) {
      // Filter by specific project
      const projectId = searchParams.get('project_id')!
    }
    if (searchParams.get('search')) {
      filters.search = searchParams.get('search')!
    }
    if (searchParams.get('due_date_from')) {
      filters.due_date_from = searchParams.get('due_date_from')!
    }
    if (searchParams.get('due_date_to')) {
      filters.due_date_to = searchParams.get('due_date_to')!
    }

    // Parse sorting
    const sortField = searchParams.get('sort_field') || 'created_at'
    const sortDirection = searchParams.get('sort_direction') || 'desc'

    // Build base query
    let query = supabase
      .from('tasks')
      .select(`
        *,
        ${includeDetails ? `
          creator:user_profiles!created_by(id, first_name, last_name, role),
          assignees:user_profiles!inner(id, first_name, last_name, role)
        ` : ''}
        ${includeSubtasks ? ', subtasks:tasks!parent_task_id(id, title, status, priority)' : ''}
        ${includeComments ? ', comments:task_comments(id, content, user_id, created_at, user_profiles!user_id(first_name, last_name))' : ''}
      `)

    // Apply user access restrictions
    if (!hasPermission(auth.user.role, 'tasks.manage_all')) {
      // Non-management users can only see their own tasks or tasks assigned to them
      if (hasPermission(auth.profile.role, 'tasks.view.assigned')) {
        query = query.or(`created_by.eq.${auth.profile.id},assigned_to.cs.{${auth.profile.id}}`)
      } else {
        query = query.eq('created_by', auth.profile.id)
      }
    }

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status)
    }
    if (filters.priority && filters.priority.length > 0) {
      query = query.in('priority', filters.priority)
    }
    if (filters.assigned_to && filters.assigned_to.length > 0) {
      query = query.overlaps('assigned_to', filters.assigned_to)
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }
    if (filters.due_date_from) {
      query = query.gte('due_date', filters.due_date_from)
    }
    if (filters.due_date_to) {
      query = query.lte('due_date', filters.due_date_to)
    }
    if (searchParams.get('project_id')) {
      query = query.eq('project_id', searchParams.get('project_id'))
    }

    // Apply sorting and pagination
    query = query.order(sortField as any, { ascending: sortDirection === 'asc' })
    
    // Get total count for pagination
    const { count } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: tasks, error } = await query

    if (error) {
      console.error('Error fetching tasks:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch tasks' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        tasks: tasks || [],
        total_count: count || 0,
        page,
        limit,
        has_more: (count || 0) > offset + limit,
        filters_applied: filters
      }
    })

  } catch (error) {
    console.error('Tasks API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// POST /api/tasks - Create new task
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (auth.error || !auth.user || !auth.profile) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!hasPermission(auth.profile.role, 'tasks.create')) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 })
    }

    const body: TaskFormData & { project_id: string } = await request.json()

    // Validate required fields
    if (!body.title || !body.project_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: title, project_id' 
      }, { status: 400 })
    }

    // Validate project access
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', body.project_id)
      .single()

    if (!project) {
      return NextResponse.json({ 
        success: false, 
        error: 'Project not found or access denied' 
      }, { status: 404 })
    }

    // Parse @mentions in description
    let mentionReferences = {
      mentioned_projects: [],
      mentioned_scope_items: [],
      mentioned_documents: [],
      mentioned_users: [],
      mentioned_tasks: []
    }

    if (body.description) {
      const parseResult = await MentionParser.parseMentions(body.description, body.project_id)
      mentionReferences = {
        mentioned_projects: parseResult.extractedReferences.projects,
        mentioned_scope_items: parseResult.extractedReferences.scope_items,
        mentioned_documents: parseResult.extractedReferences.documents,
        mentioned_users: parseResult.extractedReferences.users,
        mentioned_tasks: parseResult.extractedReferences.tasks
      }
    }

    // Validate dependencies to prevent circular references
    if (body.depends_on && body.depends_on.length > 0) {
      // This would be implemented with the circular dependency check function from migration
      // For now, basic validation
    }

    // Create task
    const taskData = {
      title: body.title,
      description: body.description || null,
      priority: body.priority || 'medium',
      project_id: body.project_id,
      parent_task_id: body.parent_task_id || null,
      assigned_to: body.assigned_to || [],
      due_date: body.due_date || null,
      estimated_hours: body.estimated_hours || null,
      tags: body.tags || [],
      depends_on: body.depends_on || [],
      created_by: auth.profile.id,
      ...mentionReferences
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .insert(taskData)
      .select(`
        *,
        creator:user_profiles!created_by(id, first_name, last_name, role)
      `)
      .single()

    if (error) {
      console.error('Error creating task:', error)
      return NextResponse.json({ success: false, error: 'Failed to create task' }, { status: 500 })
    }

    // Log task creation activity
    await supabase
      .from('task_activities')
      .insert({
        task_id: task.id,
        user_id: auth.profile.id,
        activity_type: 'created',
        details: { title: task.title }
      })

    // Send notifications for mentions
    if (mentionReferences.mentioned_users.length > 0) {
      for (const userId of mentionReferences.mentioned_users) {
        await supabase
          .from('task_activities')
          .insert({
            task_id: task.id,
            user_id: auth.profile.id,
            activity_type: 'mentioned',
            mentioned_user_id: userId,
            details: { context: 'task_description' }
          })
      }
    }

    return NextResponse.json({
      success: true,
      data: { task }
    }, { status: 201 })

  } catch (error) {
    console.error('Task creation error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}