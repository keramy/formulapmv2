/**
 * Formula PM 2.0 Task Comment API Routes
 * Threaded comments with @mention support and real-time features
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAuth } from '@/lib/middleware'
import { hasPermission } from '@/lib/permissions'
import { CommentFormData, CommentUpdateData } from '@/types/tasks'
import { MentionParser } from '@/lib/mentions'

// ============================================================================
// GET /api/tasks/[id]/comments - Get task comments with threading
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth(request)
    if (auth.error || !auth.user || !auth.profile) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const taskId = params.id

    // Check if user can view this task
    const { data: task } = await supabase
      .from('tasks')
      .select('id, project_id, created_by, assigned_to')
      .eq('id', taskId)
      .single()

    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 })
    }

    // Check access permissions
    if (!hasPermission(auth.profile.role, 'tasks.view')) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 })
    }

    // Fetch comments with threading structure
    const { data: comments, error } = await supabase
      .from('task_comments')
      .select(`
        *,
        user_profiles!user_id(id, first_name, last_name, role),
        reactions:comment_reactions(
          *,
          user_profiles!user_id(first_name, last_name)
        ),
        attachments:comment_attachments(
          *,
          user_profiles!uploaded_by(first_name, last_name)
        )
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch comments' }, { status: 500 })
    }

    // Structure comments into threads
    const threaded = structureCommentsIntoThreads(comments || [])

    return NextResponse.json({
      success: true,
      data: { 
        comments: threaded,
        total_count: comments?.length || 0
      }
    })

  } catch (error) {
    console.error('Comments fetch error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// POST /api/tasks/[id]/comments - Create new comment
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth(request)
    if (auth.error || !auth.user || !auth.profile) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const taskId = params.id
    const body: CommentFormData = await request.json()

    // Validate required fields
    if (!body.content?.trim()) {
      return NextResponse.json({ 
        success: false, 
        error: 'Comment content is required' 
      }, { status: 400 })
    }

    // Check if user can comment on this task
    const { data: task } = await supabase
      .from('tasks')
      .select('id, project_id, created_by, assigned_to')
      .eq('id', taskId)
      .single()

    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 })
    }

    // Check permissions
    if (!hasPermission(auth.profile.role, 'tasks.comment')) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions to comment' }, { status: 403 })
    }

    // Parse @mentions in comment content
    const parseResult = await MentionParser.parseMentions(body.content, task.project_id)
    
    // Validate parent comment if this is a reply
    if (body.parent_comment_id) {
      const { data: parentComment } = await supabase
        .from('task_comments')
        .select('id, task_id')
        .eq('id', body.parent_comment_id)
        .eq('task_id', taskId)
        .single()

      if (!parentComment) {
        return NextResponse.json({ 
          success: false, 
          error: 'Parent comment not found' 
        }, { status: 400 })
      }
    }

    // Create comment
    const commentData = {
      task_id: taskId,
      user_id: auth.profile.id,
      content: body.content,
      parent_comment_id: body.parent_comment_id || null,
      mentioned_users: parseResult.extractedReferences.users,
      mentioned_projects: parseResult.extractedReferences.projects,
      mentioned_scope_items: parseResult.extractedReferences.scope_items,
      mentioned_documents: parseResult.extractedReferences.documents,
      mentioned_tasks: parseResult.extractedReferences.tasks
    }

    const { data: comment, error } = await supabase
      .from('task_comments')
      .insert(commentData)
      .select(`
        *,
        user_profiles!user_id(id, first_name, last_name, role)
      `)
      .single()

    if (error) {
      console.error('Error creating comment:', error)
      return NextResponse.json({ success: false, error: 'Failed to create comment' }, { status: 500 })
    }

    // Send notifications for mentions
    for (const userId of parseResult.extractedReferences.users) {
      if (userId !== auth.profile.id) { // Don't notify self
        await supabase
          .from('task_activities')
          .insert({
            task_id: taskId,
            user_id: auth.profile.id,
            activity_type: 'mentioned',
            mentioned_user_id: userId,
            details: { 
              context: 'comment',
              comment_id: comment.id,
              is_reply: !!body.parent_comment_id
            }
          })
      }
    }

    // Notify task assignees and creator (if not already mentioned)
    const notifyUsers = [task.created_by, ...task.assigned_to]
      .filter(userId => userId !== auth.profile.id && !parseResult.extractedReferences.users.includes(userId))

    for (const userId of notifyUsers) {
      await supabase
        .from('task_activities')
        .insert({
          task_id: taskId,
          user_id: auth.profile.id,
          activity_type: 'commented',
          mentioned_user_id: userId,
          details: { 
            comment_id: comment.id,
            is_reply: !!body.parent_comment_id
          }
        })
    }

    return NextResponse.json({
      success: true,
      data: { comment }
    }, { status: 201 })

  } catch (error) {
    console.error('Comment creation error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function structureCommentsIntoThreads(comments: any[]): any[] {
  const commentMap = new Map()
  const threads: any[] = []

  // First pass: create map of all comments
  comments.forEach(comment => {
    comment.replies = []
    commentMap.set(comment.id, comment)
  })

  // Second pass: build thread structure
  comments.forEach(comment => {
    if (comment.parent_comment_id) {
      // This is a reply
      const parent = commentMap.get(comment.parent_comment_id)
      if (parent) {
        parent.replies.push(comment)
      }
    } else {
      // This is a top-level comment
      threads.push(comment)
    }
  })

  // Sort threads by creation date
  threads.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  // Sort replies within each thread
  threads.forEach(thread => {
    if (thread.replies.length > 0) {
      thread.replies.sort((a: any, b: any) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    }
  })

  return threads
}