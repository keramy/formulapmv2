/**
 * Formula PM 2.0 Client Portal Coordinator Component
 * External Client Portal System Implementation
 * 
 * Coordinator pattern implementation following Formula PM optimized-coordinator-v1.md
 * Orchestrates client portal operations with maximum efficiency and parallel processing
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useClientPortal, useClientAuth, useClientProjects, useClientDocuments, useClientNotifications, useClientCommunications } from '@/hooks/useClientPortal'
import { useToast } from '@/components/ui/use-toast'
import { 
  ClientDashboardData, 
  ClientProjectDetails,
  ClientDocumentFilters,
  ClientNotificationFilters,
  ClientThreadFilters,
  ClientActivityFilters
} from '@/types/client-portal'

interface ClientPortalCoordinatorProps {
  projectId?: string
  initialView?: 'dashboard' | 'projects' | 'documents' | 'communications' | 'notifications'
  theme?: 'light' | 'dark'
  language?: string
  mobileOptimized?: boolean
}

interface ClientPortalCoordinatorState {
  activeView: 'dashboard' | 'projects' | 'documents' | 'communications' | 'notifications'
  selectedProjectId: string | null
  documentFilters: ClientDocumentFilters
  notificationFilters: ClientNotificationFilters
  threadFilters: ClientThreadFilters
  activityFilters: ClientActivityFilters
  searchTerm: string
  sortField: string
  sortDirection: 'asc' | 'desc'
  showMobileMenu: boolean
  showNotificationPanel: boolean
  showCommunicationPanel: boolean
  selectedDocumentId: string | null
  selectedThreadId: string | null
  operationInProgress: boolean
  lastActivity: Date
}

/**
 * Coordinator hook following optimized-coordinator-v1.md patterns
 * Manages complex client portal operations through delegation and parallel processing
 */
export const useClientPortalCoordinator = ({ 
  projectId,
  initialView = 'dashboard',
  theme = 'light',
  language = 'en',
  mobileOptimized = true
}: ClientPortalCoordinatorProps) => {
  const { toast } = useToast()

  // === STATE MANAGEMENT (Foundation) ===
  const [state, setState] = useState<ClientPortalCoordinatorState>({
    activeView: initialView,
    selectedProjectId: projectId || null,
    documentFilters: {},
    notificationFilters: { is_read: false },
    threadFilters: { status: ['open', 'pending_response'] },
    activityFilters: {},
    searchTerm: '',
    sortField: 'created_at',
    sortDirection: 'desc',
    showMobileMenu: false,
    showNotificationPanel: false,
    showCommunicationPanel: false,
    selectedDocumentId: null,
    selectedThreadId: null,
    operationInProgress: false,
    lastActivity: new Date()
  })

  // === PARALLEL PROCESSING (Wave 1 - Core Dependencies) ===
  const {
    user,
    loading: authLoading,
    error: authError,
    login,
    logout,
    resetPassword,
    checkAuth,
    isAuthenticated
  } = useClientAuth()

  const {
    dashboardData,
    loading: dashboardLoading,
    error: dashboardError,
    lastRefresh: dashboardLastRefresh,
    refresh: refreshDashboard
  } = useClientPortal({
    projectId: state.selectedProjectId || undefined,
    autoRefresh: isAuthenticated && state.activeView === 'dashboard',
    refreshInterval: 30000
  })

  const {
    projects,
    loading: projectsLoading,
    error: projectsError,
    fetchProjects,
    getProject
  } = useClientProjects()

  const {
    documents,
    loading: documentsLoading,
    error: documentsError,
    totalCount: documentsCount,
    fetchDocuments,
    downloadDocument,
    approveDocument,
    addComment: addDocumentComment
  } = useClientDocuments(state.selectedProjectId || undefined)

  const {
    notifications,
    unreadCount: notificationsUnreadCount,
    loading: notificationsLoading,
    error: notificationsError,
    fetchNotifications,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead
  } = useClientNotifications()

  const {
    threads,
    loading: communicationsLoading,
    error: communicationsError,
    fetchThreads,
    createThread,
    sendMessage,
    markThreadAsRead
  } = useClientCommunications(state.selectedProjectId || undefined)

  // === COORDINATION WORKFLOW PROTOCOL ===

  /**
   * WAVE 1: Authentication Operations (Execute Immediately)
   * Core authentication and session management
   */
  const coordinateLogin = useCallback(async (email: string, password: string, companyCode?: string) => {
    setState(prev => ({ ...prev, operationInProgress: true }))
    
    try {
      const result = await login(email, password, companyCode)
      
      if (result.success) {
        toast({
          title: "Welcome to Client Portal",
          description: "You have successfully logged in",
        })
        
        // Trigger dashboard data load
        await refreshDashboard()
      } else {
        toast({
          title: "Login Failed",
          description: result.error || "Please check your credentials",
          variant: "destructive"
        })
      }
      
      return result
    } catch (error) {
      toast({
        title: "Login Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      })
      return { success: false, error: error instanceof Error ? error.message : "Login failed" }
    } finally {
      setState(prev => ({ ...prev, operationInProgress: false }))
    }
  }, [login, refreshDashboard, toast])

  const coordinateLogout = useCallback(async () => {
    try {
      await logout()
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
  }, [logout, toast])

  const coordinatePasswordReset = useCallback(async (email: string, companyCode?: string) => {
    setState(prev => ({ ...prev, operationInProgress: true }))
    
    try {
      const result = await resetPassword(email, companyCode)
      
      if (result.success) {
        toast({
          title: "Password Reset Sent",
          description: "Please check your email for reset instructions",
        })
      } else {
        toast({
          title: "Reset Failed",
          description: result.error || "Failed to send password reset",
          variant: "destructive"
        })
      }
      
      return result
    } catch (error) {
      toast({
        title: "Reset Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      })
      return { success: false, error: error instanceof Error ? error.message : "Reset failed" }
    } finally {
      setState(prev => ({ ...prev, operationInProgress: false }))
    }
  }, [resetPassword, toast])

  /**
   * WAVE 2: Data Operations (Execute After Authentication)
   * Project and document data management
   */
  const coordinateProjectSelection = useCallback(async (projectId: string) => {
    setState(prev => ({ 
      ...prev, 
      selectedProjectId: projectId,
      operationInProgress: true 
    }))
    
    try {
      // Parallel fetch project details and related data
      const [projectDetails] = await Promise.all([
        getProject(projectId),
        fetchDocuments({ project_id: projectId }),
        fetchThreads({ project_id: projectId })
      ])
      
      if (projectDetails) {
        toast({
          title: "Project Selected",
          description: `Viewing ${projectDetails.name}`,
        })
      }
    } catch (error) {
      toast({
        title: "Project Load Failed",
        description: error instanceof Error ? error.message : "Failed to load project data",
        variant: "destructive"
      })
    } finally {
      setState(prev => ({ ...prev, operationInProgress: false }))
    }
  }, [getProject, fetchDocuments, fetchThreads, toast])

  const coordinateDocumentDownload = useCallback(async (documentId: string, documentName: string) => {
    setState(prev => ({ ...prev, operationInProgress: true }))
    
    try {
      const result = await downloadDocument(documentId)
      
      if (result.success) {
        toast({
          title: "Download Started",
          description: `Downloading ${documentName}`,
        })
      } else {
        toast({
          title: "Download Failed",
          description: result.error || "Failed to download document",
          variant: "destructive"
        })
      }
      
      return result
    } catch (error) {
      toast({
        title: "Download Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      })
      return { success: false, error: error instanceof Error ? error.message : "Download failed" }
    } finally {
      setState(prev => ({ ...prev, operationInProgress: false }))
    }
  }, [downloadDocument, toast])

  const coordinateDocumentApproval = useCallback(async (documentId: string, approvalData: any) => {
    setState(prev => ({ ...prev, operationInProgress: true }))
    
    try {
      const result = await approveDocument(documentId, approvalData)
      
      if (result.success) {
        toast({
          title: approvalData.approval_decision === 'approved' ? "Document Approved" : "Document Rejected",
          description: `Document ${approvalData.approval_decision} successfully`,
        })
        
        // Refresh dashboard and documents
        await Promise.all([
          refreshDashboard(),
          fetchDocuments()
        ])
      } else {
        toast({
          title: "Approval Failed",
          description: result.error || "Failed to process approval",
          variant: "destructive"
        })
      }
      
      return result
    } catch (error) {
      toast({
        title: "Approval Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      })
      return { success: false, error: error instanceof Error ? error.message : "Approval failed" }
    } finally {
      setState(prev => ({ ...prev, operationInProgress: false }))
    }
  }, [approveDocument, refreshDashboard, fetchDocuments, toast])

  /**
   * WAVE 3: Communication Operations (Execute After Wave 2)
   * Message and thread management
   */
  const coordinateThreadCreation = useCallback(async (threadData: any) => {
    setState(prev => ({ ...prev, operationInProgress: true }))
    
    try {
      const result = await createThread(threadData)
      
      if (result.success) {
        toast({
          title: "Thread Created",
          description: `New thread "${threadData.subject}" created`,
        })
        
        setState(prev => ({ 
          ...prev, 
          selectedThreadId: result.data?.id || null,
          activeView: 'communications'
        }))
      } else {
        toast({
          title: "Thread Creation Failed",
          description: result.error || "Failed to create thread",
          variant: "destructive"
        })
      }
      
      return result
    } catch (error) {
      toast({
        title: "Thread Creation Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      })
      return { success: false, error: error instanceof Error ? error.message : "Thread creation failed" }
    } finally {
      setState(prev => ({ ...prev, operationInProgress: false }))
    }
  }, [createThread, toast])

  const coordinateMessageSend = useCallback(async (threadId: string, messageBody: string, attachments: any[] = []) => {
    setState(prev => ({ ...prev, operationInProgress: true }))
    
    try {
      const result = await sendMessage(threadId, messageBody, attachments)
      
      if (result.success) {
        toast({
          title: "Message Sent",
          description: "Your message has been sent successfully",
        })
      } else {
        toast({
          title: "Send Failed",
          description: result.error || "Failed to send message",
          variant: "destructive"
        })
      }
      
      return result
    } catch (error) {
      toast({
        title: "Send Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      })
      return { success: false, error: error instanceof Error ? error.message : "Send failed" }
    } finally {
      setState(prev => ({ ...prev, operationInProgress: false }))
    }
  }, [sendMessage, toast])

  /**
   * WAVE 4: Notification Operations (Execute After Wave 3)
   * Notification and activity management
   */
  const coordinateNotificationManagement = useCallback(async (action: 'mark_read' | 'mark_all_read', notificationId?: string) => {
    try {
      if (action === 'mark_read' && notificationId) {
        await markNotificationAsRead(notificationId)
      } else if (action === 'mark_all_read') {
        await markAllNotificationsAsRead()
        toast({
          title: "Notifications Cleared",
          description: "All notifications marked as read",
        })
      }
    } catch (error) {
      toast({
        title: "Notification Error",
        description: error instanceof Error ? error.message : "Failed to update notifications",
        variant: "destructive"
      })
    }
  }, [markNotificationAsRead, markAllNotificationsAsRead, toast])

  // === STATE UPDATE COORDINATORS ===
  const updateState = useCallback((updates: Partial<ClientPortalCoordinatorState>) => {
    setState(prev => ({ 
      ...prev, 
      ...updates,
      lastActivity: new Date()
    }))
  }, [])

  const setActiveView = useCallback((view: typeof state.activeView) => {
    setState(prev => ({ 
      ...prev, 
      activeView: view,
      showMobileMenu: false, // Close mobile menu on view change
      lastActivity: new Date()
    }))
  }, [])

  const toggleMobileMenu = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      showMobileMenu: !prev.showMobileMenu 
    }))
  }, [])

  const toggleNotificationPanel = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      showNotificationPanel: !prev.showNotificationPanel 
    }))
  }, [])

  const resetFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      documentFilters: {},
      notificationFilters: { is_read: false },
      threadFilters: { status: ['open', 'pending_response'] },
      activityFilters: {},
      searchTerm: '',
      sortField: 'created_at',
      sortDirection: 'desc'
    }))
  }, [])

  // === EFFECTIVE PERMISSIONS (Quality Gate) ===
  const effectivePermissions = {
    canViewProjects: isAuthenticated && !!user,
    canViewDocuments: isAuthenticated && !!user,
    canDownloadDocuments: isAuthenticated && !!user,
    canApproveDocuments: isAuthenticated && user?.access_level !== 'view_only',
    canCommentDocuments: isAuthenticated && !!user,
    canCreateThreads: isAuthenticated && !!user,
    canSendMessages: isAuthenticated && !!user,
    canViewNotifications: isAuthenticated && !!user,
    canViewActivities: isAuthenticated && !!user
  }

  // === QUALITY CONTROL (Execute on authentication change) ===
  useEffect(() => {
    if (isAuthenticated && user) {
      // Apply user preferences
      if (user.theme !== theme) {
        document.documentElement.setAttribute('data-theme', user.theme)
      }
    }
  }, [isAuthenticated, user, theme])

  // === COORDINATOR INTERFACE ===
  return {
    // Authentication state
    user,
    isAuthenticated,
    authLoading,
    authError,
    
    // Application state
    state,
    updateState,
    setActiveView,
    toggleMobileMenu,
    toggleNotificationPanel,
    resetFilters,
    
    // Data
    dashboardData,
    projects,
    documents,
    notifications,
    threads,
    
    // Counts and metrics
    documentsCount,
    notificationsUnreadCount,
    dashboardLastRefresh,
    
    // Loading states
    loading: authLoading || dashboardLoading || projectsLoading || documentsLoading || notificationsLoading || communicationsLoading || state.operationInProgress,
    dashboardLoading,
    projectsLoading,
    documentsLoading,
    notificationsLoading,
    communicationsLoading,
    
    // Error states
    error: authError || dashboardError || projectsError || documentsError || notificationsError || communicationsError,
    authError,
    dashboardError,
    projectsError,
    documentsError,
    notificationsError,
    communicationsError,
    
    // Coordinated operations
    coordinateLogin,
    coordinateLogout,
    coordinatePasswordReset,
    coordinateProjectSelection,
    coordinateDocumentDownload,
    coordinateDocumentApproval,
    coordinateThreadCreation,
    coordinateMessageSend,
    coordinateNotificationManagement,
    
    // Direct operations (for components)
    fetchProjects,
    getProject,
    fetchDocuments,
    addDocumentComment,
    fetchNotifications,
    fetchThreads,
    markThreadAsRead,
    
    // Permissions
    effectivePermissions,
    
    // Utilities
    refreshDashboard,
    checkAuth
  }
}

export type ClientPortalCoordinatorReturn = ReturnType<typeof useClientPortalCoordinator>