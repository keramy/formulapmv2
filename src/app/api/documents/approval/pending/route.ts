import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { supabase } from '@/lib/supabase'
import { cache, CacheKeys } from '@/lib/cache'

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const priorityFilter = searchParams.get('priority')
    const projectFilter = searchParams.get('project')
    const offset = (page - 1) * limit

    // Generate cache key
    const cacheKey = CacheKeys.pendingApprovals(
      user.id, 
      projectFilter || undefined
    ) + `:${page}:${limit}:${priorityFilter || 'all'}`

    // Try to get from cache first
    const cached = cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    try {
      let query = supabase
        .from('documents_approval_workflow')
        .select(`
          *,
          documents!inner(
            id,
            document_name,
            document_type,
            document_number,
            version,
            project_id,
            projects!inner(id, name)
          ),
          created_by_user:user_profiles!documents_approval_workflow_created_by_fkey(user_id, email, full_name),
          approval_actions(
            id,
            action_type,
            timestamp,
            user_id,
            comments,
            user:user_profiles!approval_actions_user_id_fkey(user_id, email, full_name)
          )
        `)
        .contains('required_approvers', [user.id])
        .not('completed_approvers', 'cs', [user.id])
        .in('current_status', ['pending', 'in_review'])
        .order('priority_level', { ascending: false })
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1)

      if (priorityFilter) {
        query = query.eq('priority_level', parseInt(priorityFilter))
      }

      if (projectFilter) {
        query = query.eq('documents.project_id', projectFilter)
      }

      const { data: workflows, error, count } = await query

      if (error) {
        console.error('Error fetching pending approvals:', error)
        return NextResponse.json({ error: 'Failed to fetch pending approvals' }, { status: 500 })
      }

      // Filter workflows based on sequential workflow rules
      const filteredWorkflows = workflows?.filter(workflow => {
        if (workflow.workflow_type === 'sequential') {
          // For sequential workflows, check if it's the user's turn
          const approverSequence = workflow.approval_sequence || []
          const currentSequence = workflow.completed_approvers.length + 1
          const expectedApproverIndex = approverSequence.indexOf(currentSequence)
          
          return expectedApproverIndex !== -1 && 
                 workflow.required_approvers[expectedApproverIndex] === user.id
        }
        // For parallel workflows, user can approve anytime
        return true
      }) || []

      const totalPages = Math.ceil((count || 0) / limit)

      // Get additional statistics
      const { data: stats, error: statsError } = await supabase
        .from('documents_approval_workflow')
        .select('priority_level, current_status')
        .contains('required_approvers', [user.id])
        .not('completed_approvers', 'cs', [user.id])
        .in('current_status', ['pending', 'in_review'])

      let priorityStats = { urgent: 0, high: 0, medium: 0, low: 0 }
      if (stats) {
        priorityStats = stats.reduce((acc, item) => {
          const priority = item.priority_level
          if (priority === 4) acc.urgent++
          else if (priority === 3) acc.high++
          else if (priority === 2) acc.medium++
          else acc.low++
          return acc
        }, { urgent: 0, high: 0, medium: 0, low: 0 })
      }

      const result = {
        workflows: filteredWorkflows,
        pagination: {
          page,
          limit,
          total: filteredWorkflows.length,
          totalPages
        },
        statistics: {
          totalPending: filteredWorkflows.length,
          priorityBreakdown: priorityStats,
          avgAge: filteredWorkflows.length > 0 ? 
            filteredWorkflows.reduce((sum, w) => {
              const age = Math.floor((new Date().getTime() - new Date(w.created_at).getTime()) / (1000 * 60 * 60 * 24))
              return sum + age
            }, 0) / filteredWorkflows.length : 0
        }
      }

      // Cache the result for 2 minutes (shorter TTL for real-time data)
      cache.set(cacheKey, result, 2 * 60 * 1000)

      return NextResponse.json(result)
    } catch (error) {
      console.error('Unexpected error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }, { requiredPermission: 'documents.approve' })
}