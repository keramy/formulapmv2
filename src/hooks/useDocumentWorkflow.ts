'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useAdvancedApiQuery } from './useAdvancedApiQuery'

interface WorkflowSubscription {
  id: string
  document_id: string
  current_status: string
  priority_level: number
  required_approvers: string[]
  completed_approvers: string[]
  updated_at: string
}

interface ApprovalAction {
  id: string
  workflow_id: string
  user_id: string
  action_type: string
  comments?: string
  timestamp: string
}

interface UseDocumentWorkflowProps {
  projectId?: string
  autoRefresh?: boolean
}

export const useDocumentWorkflow = ({ 
  projectId, 
  autoRefresh = true 
}: UseDocumentWorkflowProps = {}) => {
  const { user } = useAuth()
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([])
  const [workflowStats, setWorkflowStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch pending approvals
  const fetchPendingApprovals = useCallback(async () => {
    if (!user) return

    try {
      const params = new URLSearchParams()
      if (projectId) params.append('project', projectId)
      
      const response = await fetch(`/api/documents/approval/pending?${params}`)
      if (!response.ok) throw new Error('Failed to fetch pending approvals')
      
      const data = await response.json()
      setPendingApprovals(data.workflows || [])
      setWorkflowStats(data.statistics || null)
      setError(null)
    } catch (err) {
      console.error('Error fetching pending approvals:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [user, projectId])

  // Real-time subscription for workflow changes
  useEffect(() => {
    if (!user || !autoRefresh) return

    const channel = supabase
      .channel('document-workflows')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents_approval_workflow',
          filter: `required_approvers.cs.{${user.id}}`
        },
        (payload) => {
          console.log('Workflow updated:', payload)
          
          if (payload.eventType === 'UPDATE') {
            const updatedWorkflow = payload.new as WorkflowSubscription
            
            setPendingApprovals(prev => 
              prev.map(workflow => 
                workflow.id === updatedWorkflow.id 
                  ? { ...workflow, ...updatedWorkflow }
                  : workflow
              )
            )
          } else if (payload.eventType === 'INSERT') {
            const newWorkflow = payload.new as WorkflowSubscription
            
            // Only add if user is a required approver
            if (newWorkflow.required_approvers.includes(user.id)) {
              fetchPendingApprovals() // Refresh to get full data
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'approval_actions'
        },
        (payload) => {
          console.log('New approval action:', payload)
          const newAction = payload.new as ApprovalAction
          
          // Update specific workflow if it affects user's pending approvals
          setPendingApprovals(prev => 
            prev.map(workflow => {
              if (workflow.id === newAction.workflow_id) {
                // Add action to workflow's action list
                const updatedWorkflow = { ...workflow }
                if (!updatedWorkflow.approval_actions) {
                  updatedWorkflow.approval_actions = []
                }
                updatedWorkflow.approval_actions.push(newAction)
                return updatedWorkflow
              }
              return workflow
            })
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, autoRefresh, fetchPendingApprovals])

  // Real-time subscription for document changes
  useEffect(() => {
    if (!user || !autoRefresh) return

    const documentChannel = supabase
      .channel('documents')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents'
        },
        (payload) => {
          console.log('Document updated:', payload)
          
          // Refresh pending approvals if document metadata changes
          if (payload.eventType === 'UPDATE') {
            fetchPendingApprovals()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(documentChannel)
    }
  }, [user, autoRefresh, fetchPendingApprovals])

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await fetchPendingApprovals()
      setIsLoading(false)
    }

    if (user) {
      loadData()
    }
  }, [user, fetchPendingApprovals])

  // Approve document
  const approveDocument = useCallback(async (workflowId: string, data: { comments?: string, delegateTo?: string }) => {
    const workflow = pendingApprovals.find(w => w.id === workflowId)
    if (!workflow) throw new Error('Workflow not found')

    const response = await fetch(`/api/documents/${workflow.document_id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to approve document')
    }

    const result = await response.json()
    
    // Optimistic update - remove from pending if fully approved
    if (result.workflow?.current_status === 'approved') {
      setPendingApprovals(prev => prev.filter(w => w.id !== workflowId))
    }

    return result
  }, [pendingApprovals])

  // Reject document
  const rejectDocument = useCallback(async (workflowId: string, data: { comments: string }) => {
    const workflow = pendingApprovals.find(w => w.id === workflowId)
    if (!workflow) throw new Error('Workflow not found')

    const response = await fetch(`/api/documents/${workflow.document_id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to reject document')
    }

    const result = await response.json()
    
    // Optimistic update - remove from pending
    setPendingApprovals(prev => prev.filter(w => w.id !== workflowId))

    return result
  }, [pendingApprovals])

  // Create workflow
  const createWorkflow = useCallback(async (documentId: string, workflowData: any) => {
    const response = await fetch(`/api/documents/${documentId}/approval`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workflowData)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create workflow')
    }

    const result = await response.json()
    
    // Refresh pending approvals to include new workflow
    await fetchPendingApprovals()

    return result
  }, [fetchPendingApprovals])

  return {
    // Data
    pendingApprovals,
    workflowStats,
    isLoading,
    error,
    
    // Actions
    approveDocument,
    rejectDocument,
    createWorkflow,
    refreshData: fetchPendingApprovals,
    
    // Computed values
    hasPendingApprovals: pendingApprovals.length > 0,
    urgentApprovals: pendingApprovals.filter(w => w.priority_level === 4),
    overdueApprovals: pendingApprovals.filter(w => {
      if (!w.estimated_completion_date) return false
      return new Date(w.estimated_completion_date) < new Date()
    })
  }
}

/**
 * Enhanced Document Workflow hook using advanced API query patterns
 * This demonstrates the optimized approach with caching and real-time updates
 */
export function useDocumentWorkflowAdvanced(props: UseDocumentWorkflowProps = {}) {
  const { projectId, autoRefresh = true } = props
  const { user } = useAuth()

  // Use advanced API query for pending approvals
  const {
    data: pendingApprovals = [],
    loading: approvalsLoading,
    error: approvalsError,
    refetch: refetchApprovals,
    mutate: mutateApprovals
  } = useAdvancedApiQuery<WorkflowSubscription[]>({
    endpoint: `/api/documents/approval/pending`,
    params: projectId ? { project: projectId } : {},
    cacheKey: `pending-approvals-${projectId}-${user?.id}`,
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchInterval: autoRefresh ? 30 * 1000 : undefined // 30 seconds if auto-refresh enabled
  })

  // Use advanced API query for workflow history
  const {
    data: workflowHistory = [],
    loading: historyLoading,
    error: historyError,
    refetch: refetchHistory
  } = useAdvancedApiQuery<ApprovalAction[]>({
    endpoint: `/api/documents/approval/history`,
    params: projectId ? { project: projectId } : {},
    cacheKey: `workflow-history-${projectId}-${user?.id}`,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchInterval: autoRefresh ? 2 * 60 * 1000 : undefined // 2 minutes if auto-refresh enabled
  })

  // Optimized approval action with cache invalidation
  const submitApproval = useCallback(async (workflowId: string, action: string, comments?: string) => {
    if (!user) throw new Error('User not authenticated')

    try {
      const response = await fetch('/api/documents/approval/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_id: workflowId,
          action,
          comments,
          user_id: user.id
        })
      })

      if (!response.ok) throw new Error('Failed to submit approval')

      const result = await response.json()

      // Invalidate and refetch related queries
      await Promise.all([
        refetchApprovals(),
        refetchHistory()
      ])

      return result
    } catch (error) {
      console.error('Error submitting approval:', error)
      throw error
    }
  }, [user, refetchApprovals, refetchHistory])

  return {
    // Data
    pendingApprovals,
    workflowHistory,

    // Loading states
    loading: approvalsLoading || historyLoading,
    approvalsLoading,
    historyLoading,

    // Errors
    error: approvalsError || historyError,
    approvalsError,
    historyError,

    // Actions
    submitApproval,
    refetchApprovals,
    refetchHistory,

    // Computed values
    hasPendingApprovals: (pendingApprovals?.length ?? 0) > 0,
    urgentApprovals: pendingApprovals?.filter(w => w.priority_level === 4) ?? [],
    overdueApprovals: [] // No due_date field available in WorkflowSubscription
  }
}