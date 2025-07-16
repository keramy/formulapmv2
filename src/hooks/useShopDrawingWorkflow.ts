import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'
import { useAdvancedApiQuery } from './useAdvancedApiQuery'

export interface WorkflowAction {
  id: string
  type: 'submit' | 'approve' | 'reject' | 'request_revision' | 'ready_for_client'
  label: string
  description: string
  requiresComments: boolean
  requiresFile?: boolean
  nextStatus: string
  permissions: string[]
}

export interface WorkflowStatus {
  status: string
  label: string
  description: string
  color: 'gray' | 'blue' | 'yellow' | 'green' | 'red'
  icon: string
  availableActions: WorkflowAction[]
}

export interface WorkflowTransition {
  from: string
  to: string
  action: string
  requiredRole: string[]
  requiresComments: boolean
  requiresFile?: boolean
}

const WORKFLOW_STATUSES: Record<string, WorkflowStatus> = {
  draft: {
    status: 'draft',
    label: 'Draft',
    description: 'Drawing is being prepared',
    color: 'gray',
    icon: 'FileText',
    availableActions: [
      {
        id: 'submit_for_review',
        type: 'submit',
        label: 'Submit for Review',
        description: 'Submit drawing for internal review',
        requiresComments: false,
        requiresFile: true,
        nextStatus: 'pending_internal_review',
        permissions: ['create', 'edit']
      }
    ]
  },
  pending_internal_review: {
    status: 'pending_internal_review',
    label: 'Pending Internal Review',
    description: 'Waiting for internal team review',
    color: 'yellow',
    icon: 'Clock',
    availableActions: [
      {
        id: 'approve_internal',
        type: 'approve',
        label: 'Approve',
        description: 'Approve drawing for client review',
        requiresComments: false,
        nextStatus: 'ready_for_client_review',
        permissions: ['approve']
      },
      {
        id: 'reject_internal',
        type: 'reject',
        label: 'Reject',
        description: 'Reject drawing with comments',
        requiresComments: true,
        nextStatus: 'rejected',
        permissions: ['approve']
      },
      {
        id: 'request_revision',
        type: 'request_revision',
        label: 'Request Revision',
        description: 'Request changes to the drawing',
        requiresComments: true,
        nextStatus: 'revision_requested',
        permissions: ['approve']
      }
    ]
  },
  ready_for_client_review: {
    status: 'ready_for_client_review',
    label: 'Ready for Client Review',
    description: 'Approved internally, ready to send to client',
    color: 'blue',
    icon: 'Send',
    availableActions: [
      {
        id: 'send_to_client',
        type: 'ready_for_client',
        label: 'Send to Client',
        description: 'Send drawing to client for review',
        requiresComments: false,
        nextStatus: 'client_reviewing',
        permissions: ['send_to_client']
      }
    ]
  },
  client_reviewing: {
    status: 'client_reviewing',
    label: 'Client Reviewing',
    description: 'Drawing is being reviewed by client',
    color: 'blue',
    icon: 'Eye',
    availableActions: [
      {
        id: 'client_approve',
        type: 'approve',
        label: 'Client Approve',
        description: 'Mark as approved by client',
        requiresComments: false,
        nextStatus: 'approved',
        permissions: ['client_approve']
      },
      {
        id: 'client_reject',
        type: 'reject',
        label: 'Client Reject',
        description: 'Mark as rejected by client',
        requiresComments: true,
        nextStatus: 'rejected',
        permissions: ['client_approve']
      }
    ]
  },
  approved: {
    status: 'approved',
    label: 'Approved',
    description: 'Drawing has been approved',
    color: 'green',
    icon: 'CheckCircle',
    availableActions: []
  },
  rejected: {
    status: 'rejected',
    label: 'Rejected',
    description: 'Drawing has been rejected',
    color: 'red',
    icon: 'XCircle',
    availableActions: [
      {
        id: 'resubmit',
        type: 'submit',
        label: 'Resubmit',
        description: 'Resubmit drawing for review',
        requiresComments: false,
        requiresFile: true,
        nextStatus: 'pending_internal_review',
        permissions: ['create', 'edit']
      }
    ]
  },
  revision_requested: {
    status: 'revision_requested',
    label: 'Revision Requested',
    description: 'Changes have been requested',
    color: 'yellow',
    icon: 'Edit',
    availableActions: [
      {
        id: 'resubmit_revision',
        type: 'submit',
        label: 'Resubmit with Changes',
        description: 'Resubmit drawing with requested changes',
        requiresComments: false,
        requiresFile: true,
        nextStatus: 'pending_internal_review',
        permissions: ['create', 'edit']
      }
    ]
  }
}

const WORKFLOW_TRANSITIONS: WorkflowTransition[] = [
  {
    from: 'draft',
    to: 'pending_internal_review',
    action: 'submit_for_review',
    requiredRole: ['architect', 'project_manager', 'general_manager'],
    requiresComments: false,
    requiresFile: true
  },
  {
    from: 'pending_internal_review',
    to: 'ready_for_client_review',
    action: 'approve_internal',
    requiredRole: ['project_manager', 'general_manager', 'owner'],
    requiresComments: false
  },
  {
    from: 'pending_internal_review',
    to: 'rejected',
    action: 'reject_internal',
    requiredRole: ['project_manager', 'general_manager', 'owner'],
    requiresComments: true
  },
  {
    from: 'pending_internal_review',
    to: 'revision_requested',
    action: 'request_revision',
    requiredRole: ['project_manager', 'general_manager', 'owner'],
    requiresComments: true
  },
  {
    from: 'ready_for_client_review',
    to: 'client_reviewing',
    action: 'send_to_client',
    requiredRole: ['project_manager', 'general_manager', 'owner'],
    requiresComments: false
  },
  {
    from: 'client_reviewing',
    to: 'approved',
    action: 'client_approve',
    requiredRole: ['project_manager', 'general_manager', 'owner', 'client'],
    requiresComments: false
  },
  {
    from: 'client_reviewing',
    to: 'rejected',
    action: 'client_reject',
    requiredRole: ['project_manager', 'general_manager', 'owner', 'client'],
    requiresComments: true
  },
  {
    from: 'rejected',
    to: 'pending_internal_review',
    action: 'resubmit',
    requiredRole: ['architect', 'project_manager', 'general_manager'],
    requiresComments: false,
    requiresFile: true
  },
  {
    from: 'revision_requested',
    to: 'pending_internal_review',
    action: 'resubmit_revision',
    requiredRole: ['architect', 'project_manager', 'general_manager'],
    requiresComments: false,
    requiresFile: true
  }
]

export interface WorkflowActionData {
  action: string
  comments?: string
  file?: File
}

export function useShopDrawingWorkflow() {
  const { profile, getAccessToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionHistory, setActionHistory] = useState<Record<string, any>>({})

  // Clear error when starting new action
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const getWorkflowStatus = useCallback((status: string): WorkflowStatus | null => {
    return WORKFLOW_STATUSES[status] || null
  }, [])

  const getAvailableActions = useCallback((status: string, userRole: string): WorkflowAction[] => {
    const workflowStatus = WORKFLOW_STATUSES[status]
    if (!workflowStatus) return []

    return workflowStatus.availableActions.filter(action => {
      const transition = WORKFLOW_TRANSITIONS.find(t => 
        t.from === status && t.action === action.id
      )
      return transition && transition.requiredRole.includes(userRole)
    })
  }, [])

  const canPerformAction = useCallback((
    currentStatus: string, 
    action: string, 
    userRole: string
  ): boolean => {
    const transition = WORKFLOW_TRANSITIONS.find(t => 
      t.from === currentStatus && t.action === action
    )
    return transition ? transition.requiredRole.includes(userRole) : false
  }, [])

  const executeWorkflowAction = useCallback(async (
    drawingId: string,
    submissionId: string,
    actionData: WorkflowActionData
  ) => {
    try {
      setLoading(true)
      setError(null)

      // Validate action data first
      const validation = validateActionData(actionData.action, actionData.action, actionData)
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
      }

      const token = await getAccessToken()
      if (!token) {
        throw new Error('No authentication token available')
      }

      let endpoint = ''
      let method = 'POST'
      let body: FormData | string

      switch (actionData.action) {
        case 'submit_for_review':
        case 'resubmit':
        case 'resubmit_revision':
          endpoint = `/api/shop-drawings/${drawingId}/submit`
          body = new FormData()
          if (actionData.comments) {
            (body as FormData).append('comments', actionData.comments)
          }
          if (actionData.file) {
            (body as FormData).append('file', actionData.file)
          }
          break

        case 'approve_internal':
          endpoint = `/api/shop-drawings/${drawingId}/approve`
          body = JSON.stringify({
            comments: actionData.comments,
            review_type: 'internal'
          })
          break

        case 'client_approve':
          endpoint = `/api/shop-drawings/${drawingId}/approve`
          body = JSON.stringify({
            comments: actionData.comments,
            review_type: 'client'
          })
          break

        case 'reject_internal':
          endpoint = `/api/shop-drawings/${drawingId}/reject`
          body = JSON.stringify({
            comments: actionData.comments,
            review_type: 'internal'
          })
          break

        case 'client_reject':
          endpoint = `/api/shop-drawings/${drawingId}/reject`
          body = JSON.stringify({
            comments: actionData.comments,
            review_type: 'client'
          })
          break

        case 'request_revision':
          endpoint = `/api/shop-drawings/${drawingId}/request-revision`
          body = JSON.stringify({
            comments: actionData.comments,
            review_type: 'internal'
          })
          break

        case 'send_to_client':
          endpoint = `/api/shop-drawings/${drawingId}/status`
          method = 'PATCH'
          body = JSON.stringify({
            status: 'client_reviewing',
            comments: actionData.comments
          })
          break

        default:
          throw new Error(`Unknown action: ${actionData.action}`)
      }

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`
      }

      if (typeof body === 'string') {
        headers['Content-Type'] = 'application/json'
      }

      const response = await fetch(endpoint, {
        method,
        headers,
        body
      })

      if (!response.ok) {
        // Try to get detailed error from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = `${errorMessage} - ${errorData.error}`;
          }
          console.error('🔄 [ShopDrawingWorkflow] API Error Details:', errorData);
        } catch (parseError) {
          console.error('🔄 [ShopDrawingWorkflow] Failed to parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to execute workflow action')
      }

      // Track successful action in history
      setActionHistory(prev => ({
        ...prev,
        [`${drawingId}-${actionData.action}`]: {
          timestamp: new Date().toISOString(),
          result: result.data
        }
      }))

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute workflow action'
      console.error('🔄 [ShopDrawingWorkflow] Action Error:', errorMessage)
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [getAccessToken])

  const getWorkflowHistory = useCallback((submissions: any[]) => {
    const history: Array<{
      date: string
      action: string
      user: string
      status: string
      comments?: string
    }> = []

    submissions.forEach(submission => {
      history.push({
        date: submission.submitted_at,
        action: 'submitted',
        user: submission.submitted_by,
        status: submission.status,
        comments: submission.notes
      })

      submission.reviews?.forEach((review: any) => {
        history.push({
          date: review.reviewed_at,
          action: review.status,
          user: review.reviewer?.name || review.reviewer_id,
          status: review.status,
          comments: review.comments
        })
      })
    })

    return history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [])

  const getStatusColor = useCallback((status: string) => {
    const workflowStatus = WORKFLOW_STATUSES[status]
    return workflowStatus?.color || 'gray'
  }, [])

  const getStatusIcon = useCallback((status: string) => {
    const workflowStatus = WORKFLOW_STATUSES[status]
    return workflowStatus?.icon || 'FileText'
  }, [])

  const getStatusLabel = useCallback((status: string) => {
    const workflowStatus = WORKFLOW_STATUSES[status]
    return workflowStatus?.label || status
  }, [])

  const getStatusDescription = useCallback((status: string) => {
    const workflowStatus = WORKFLOW_STATUSES[status]
    return workflowStatus?.description || ''
  }, [])

  const validateActionData = useCallback((
    currentStatus: string,
    action: string,
    data: WorkflowActionData
  ): { valid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    const transition = WORKFLOW_TRANSITIONS.find(t => 
      t.from === currentStatus && t.action === action
    )

    if (!transition) {
      errors.push('Invalid action for current status')
      return { valid: false, errors }
    }

    if (transition.requiresComments && !data.comments?.trim()) {
      errors.push('Comments are required for this action')
    }

    if (transition.requiresFile && !data.file) {
      errors.push('File upload is required for this action')
    }

    return { valid: errors.length === 0, errors }
  }, [])

  return {
    loading,
    error,
    actionHistory,
    clearError,
    getWorkflowStatus,
    getAvailableActions,
    canPerformAction,
    executeWorkflowAction,
    getWorkflowHistory,
    getStatusColor,
    getStatusIcon,
    getStatusLabel,
    getStatusDescription,
    validateActionData,
    workflowStatuses: WORKFLOW_STATUSES,
    workflowTransitions: WORKFLOW_TRANSITIONS
  }
}