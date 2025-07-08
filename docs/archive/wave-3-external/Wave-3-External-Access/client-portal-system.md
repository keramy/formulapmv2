# Client Portal System - Wave 3 External Access
## Enhanced Coordinator Agent Implementation

### **🎯 OBJECTIVE**
Implement a comprehensive client portal system providing secure external access for project review, document approval, progress monitoring, and communication for construction project clients.

### **📋 TASK BREAKDOWN FOR COORDINATOR**

**FOUNDATION TASKS (Wait for Wave 2 Business Logic complete - spawn after all Wave 2 systems ready):**
1. **Client Authentication & Security**: Secure external access with client-specific permissions
2. **Project Dashboard for Clients**: Client-focused project overview and status
3. **Document Review Interface**: External document approval and feedback system
4. **Communication Hub**: Client-project team messaging and notifications

**DEPENDENT TASKS (Wait for foundation approval):**
5. **Mobile Client App**: Responsive mobile interface for client access
6. **Client Analytics**: Project insights and reporting for clients

---

## **👥 Client Portal Data Structure**

### **Enhanced Client Access Schema**
```typescript
// types/clientPortal.ts
export interface ClientUser {
  id: string
  user_profile_id: string
  
  // Client Information
  client_company_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  title: string
  department?: string
  
  // Access Control
  access_level: ClientAccessLevel
  assigned_projects: string[]
  permissions: ClientPermission[]
  portal_access_enabled: boolean
  
  // Authentication
  last_login: string
  login_attempts: number
  account_locked: boolean
  password_reset_required: boolean
  two_factor_enabled: boolean
  
  // Preferences
  notification_preferences: NotificationPreferences
  language: string
  timezone: string
  theme: 'light' | 'dark' | 'auto'
  
  // Tracking
  created_by: string
  created_at: string
  updated_at: string
  last_activity: string
}

export type ClientAccessLevel = 
  | 'view_only'
  | 'reviewer'
  | 'approver'
  | 'project_owner'

export interface ClientPermission {
  resource: string
  actions: string[]
  project_specific: boolean
  granted_by: string
  granted_at: string
  expires_at?: string
}

export interface NotificationPreferences {
  email_notifications: boolean
  sms_notifications: boolean
  in_app_notifications: boolean
  notification_types: NotificationType[]
  digest_frequency: 'real_time' | 'daily' | 'weekly'
  quiet_hours: QuietHours
}

export interface QuietHours {
  enabled: boolean
  start_time: string
  end_time: string
  timezone: string
}

export type NotificationType = 
  | 'document_submitted'
  | 'approval_required'
  | 'project_milestone'
  | 'schedule_change'
  | 'budget_update'
  | 'quality_issue'
  | 'delivery_notification'

export interface ClientProjectView {
  id: string
  project_id: string
  client_user_id: string
  
  // Project Overview
  project_name: string
  project_description: string
  project_status: string
  project_progress: number
  
  // Timeline
  start_date: string
  scheduled_completion: string
  current_phase: string
  next_milestone: ProjectMilestone
  
  // Financial (if permitted)
  budget_total?: number
  spent_to_date?: number
  remaining_budget?: number
  budget_variance?: number
  
  // Team
  project_manager: TeamMember
  key_contacts: TeamMember[]
  
  // Recent Activity
  recent_activities: ProjectActivity[]
  pending_approvals: PendingApproval[]
  
  // Documents
  accessible_documents: ClientDocument[]
  recent_uploads: ClientDocument[]
  
  // Communication
  unread_messages: number
  announcement_count: number
  
  // Custom Fields
  custom_data: Record<string, any>
  
  // Access Control
  last_accessed: string
  access_restrictions: string[]
}

export interface ProjectMilestone {
  id: string
  name: string
  description: string
  due_date: string
  status: 'upcoming' | 'in_progress' | 'completed' | 'delayed'
  completion_percentage: number
}

export interface TeamMember {
  id: string
  name: string
  title: string
  email: string
  phone?: string
  role: string
  avatar_url?: string
}

export interface ProjectActivity {
  id: string
  activity_type: ActivityType
  description: string
  details: string
  timestamp: string
  created_by: TeamMember
  visible_to_client: boolean
  priority: 'low' | 'medium' | 'high'
}

export type ActivityType = 
  | 'document_upload'
  | 'approval_request'
  | 'milestone_completion'
  | 'schedule_update'
  | 'team_communication'
  | 'quality_inspection'
  | 'delivery_notification'

export interface PendingApproval {
  id: string
  document_id: string
  document_title: string
  document_type: string
  submitted_date: string
  due_date?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  current_version: number
  approval_stage: string
  estimated_review_time: number
}

export interface ClientDocument {
  id: string
  document_id: string
  title: string
  description: string
  document_type: string
  category: string
  
  // File Information
  file_name: string
  file_size: number
  file_extension: string
  preview_available: boolean
  download_allowed: boolean
  
  // Version Information
  version: number
  revision_letter: string
  is_latest: boolean
  
  // Status
  status: string
  approval_required: boolean
  client_approved?: boolean
  
  // Timestamps
  uploaded_date: string
  last_modified: string
  approval_deadline?: string
  
  // Access Control
  confidentiality_level: 'public' | 'confidential' | 'restricted'
  view_only: boolean
  watermarked: boolean
  
  // Client Interaction
  client_comments: ClientDocumentComment[]
  markup_data?: any
  download_count: number
  last_viewed?: string
}

export interface ClientDocumentComment {
  id: string
  comment_text: string
  comment_type: 'general' | 'revision_request' | 'question' | 'approval_condition'
  priority: 'low' | 'medium' | 'high'
  
  // Positioning (for drawings/documents)
  page_number?: number
  x_coordinate?: number
  y_coordinate?: number
  markup_annotation?: any
  
  // Status
  status: 'open' | 'addressed' | 'resolved'
  
  // Threading
  parent_comment_id?: string
  replies: ClientDocumentComment[]
  
  // Tracking
  created_by: string
  created_at: string
  updated_at: string
  resolved_at?: string
  resolved_by?: string
}

export interface ClientMessage {
  id: string
  project_id: string
  client_user_id: string
  
  // Message Content
  subject: string
  message_body: string
  message_type: 'general' | 'question' | 'concern' | 'request' | 'approval'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  
  // Recipients
  recipients: MessageRecipient[]
  cc_recipients: MessageRecipient[]
  
  // Attachments
  attachments: MessageAttachment[]
  
  // Threading
  thread_id?: string
  parent_message_id?: string
  replies: ClientMessage[]
  
  // Status
  status: 'draft' | 'sent' | 'delivered' | 'read' | 'replied'
  requires_response: boolean
  response_deadline?: string
  
  // Tracking
  sent_at: string
  read_at?: string
  replied_at?: string
  
  // Client Portal Specific
  portal_visible: boolean
  client_initiated: boolean
  escalation_level: number
}

export interface MessageRecipient {
  user_id: string
  name: string
  email: string
  role: string
  delivery_status: 'pending' | 'delivered' | 'read' | 'failed'
  read_at?: string
}

export interface MessageAttachment {
  id: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  uploaded_by: string
  uploaded_at: string
}
```

---

## **👥 Client Portal Interface**

### **Client Dashboard Component**
```typescript
// components/clientPortal/ClientDashboard.tsx
'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Home, 
  FileText, 
  Calendar, 
  MessageSquare,
  Bell,
  Download,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  Camera
} from 'lucide-react'
import { ClientProjectView, PendingApproval, ProjectActivity } from '@/types/clientPortal'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/use-toast'

export const ClientDashboard = () => {
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const { profile } = useAuth()
  const { toast } = useToast()

  // Fetch client projects
  const { data: clientProjects, isLoading } = useQuery({
    queryKey: ['client-projects', profile?.id],
    queryFn: () => fetchClientProjects(profile?.id),
    enabled: !!profile?.id
  })

  // Fetch pending approvals
  const { data: pendingApprovals } = useQuery({
    queryKey: ['client-pending-approvals', profile?.id],
    queryFn: () => fetchPendingApprovals(profile?.id),
    enabled: !!profile?.id
  })

  // Fetch recent activities
  const { data: recentActivities } = useQuery({
    queryKey: ['client-activities', profile?.id],
    queryFn: () => fetchClientActivities(profile?.id),
    enabled: !!profile?.id
  })

  if (isLoading) {
    return <div>Loading your projects...</div>
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {profile?.first_name}!</h1>
            <p className="text-blue-100 mt-1">
              Here's what's happening with your projects
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{clientProjects?.length || 0}</div>
            <div className="text-blue-200 text-sm">Active Projects</div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApprovals?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Require your review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clientProjects?.reduce((acc, p) => acc + p.accessible_documents.length, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Available for review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clientProjects?.reduce((acc, p) => acc + p.unread_messages, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Unread messages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clientProjects?.length 
                ? Math.round(clientProjects.reduce((acc, p) => acc + p.project_progress, 0) / clientProjects.length)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects Overview */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Projects</CardTitle>
              <CardDescription>
                Current status and progress of your active projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clientProjects?.map((project) => (
                  <ProjectCard 
                    key={project.id}
                    project={project}
                    onSelect={() => setSelectedProject(project.project_id)}
                  />
                ))}
              </div>
              
              {(!clientProjects || clientProjects.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  No active projects at this time.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Approvals */}
          {pendingApprovals && pendingApprovals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                  Pending Your Approval
                </CardTitle>
                <CardDescription>
                  Documents requiring your review and approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingApprovals.slice(0, 5).map((approval) => (
                    <PendingApprovalCard 
                      key={approval.id}
                      approval={approval}
                    />
                  ))}
                </div>
                
                {pendingApprovals.length > 5 && (
                  <Button variant="outline" className="w-full mt-4">
                    View All {pendingApprovals.length} Pending Approvals
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities?.slice(0, 6).map((activity) => (
                  <ActivityItem 
                    key={activity.id}
                    activity={activity}
                  />
                ))}
              </div>
              
              {(!recentActivities || recentActivities.length === 0) && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No recent activity
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                View All Documents
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Download Reports
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Project Card Component
const ProjectCard: React.FC<{ 
  project: ClientProjectView
  onSelect: () => void 
}> = ({ project, onSelect }) => {
  const getStatusColor = (status: string) => {
    const colors = {
      'planning': 'bg-blue-100 text-blue-800',
      'active': 'bg-green-100 text-green-800',
      'on_hold': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-gray-100 text-gray-800',
      'delayed': 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || colors['planning']
  }

  const isDelayed = project.next_milestone?.status === 'delayed'
  
  return (
    <Card className={`cursor-pointer hover:shadow-md transition-shadow ${isDelayed ? 'border-red-200' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{project.project_name}</h3>
            <p className="text-muted-foreground text-sm line-clamp-1">
              {project.project_description}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(project.project_status)}>
              {project.project_status.replace('_', ' ')}
            </Badge>
            {isDelayed && (
              <Badge variant="destructive">Delayed</Badge>
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Overall Progress</span>
              <span>{project.project_progress}%</span>
            </div>
            <Progress value={project.project_progress} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Phase</div>
              <div className="font-medium">{project.current_phase}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Completion</div>
              <div className="font-medium">
                {new Date(project.scheduled_completion).toLocaleDateString()}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              {project.pending_approvals.length > 0 && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{project.pending_approvals.length} pending</span>
                </div>
              )}
              {project.unread_messages > 0 && (
                <div className="flex items-center space-x-1">
                  <MessageSquare className="h-3 w-3" />
                  <span>{project.unread_messages} unread</span>
                </div>
              )}
            </div>
            
            <Button size="sm" onClick={onSelect}>
              View Project
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Pending Approval Card Component
const PendingApprovalCard: React.FC<{ approval: PendingApproval }> = ({ approval }) => {
  const isUrgent = approval.priority === 'urgent' || approval.priority === 'high'
  const isOverdue = approval.due_date && new Date(approval.due_date) < new Date()
  
  return (
    <div className={`p-3 border rounded-lg ${isOverdue ? 'border-red-200 bg-red-50' : isUrgent ? 'border-orange-200 bg-orange-50' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-sm">{approval.document_title}</h4>
          <p className="text-xs text-muted-foreground">
            {approval.document_type} • Submitted {new Date(approval.submitted_date).toLocaleDateString()}
          </p>
          {approval.due_date && (
            <p className={`text-xs ${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
              Due: {new Date(approval.due_date).toLocaleDateString()}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {isUrgent && (
            <Badge variant="outline" className="bg-orange-50 text-orange-700 text-xs">
              {approval.priority}
            </Badge>
          )}
          
          <Button size="sm">
            <Eye className="h-3 w-3 mr-1" />
            Review
          </Button>
        </div>
      </div>
    </div>
  )
}

// Activity Item Component
const ActivityItem: React.FC<{ activity: ProjectActivity }> = ({ activity }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'document_upload':
        return <FileText className="h-3 w-3" />
      case 'approval_request':
        return <Clock className="h-3 w-3" />
      case 'milestone_completion':
        return <CheckCircle className="h-3 w-3" />
      case 'team_communication':
        return <MessageSquare className="h-3 w-3" />
      default:
        return <Bell className="h-3 w-3" />
    }
  }

  return (
    <div className="flex space-x-3">
      <div className="flex-shrink-0 w-6 h-6 bg-muted rounded-full flex items-center justify-center">
        {getActivityIcon(activity.activity_type)}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm">{activity.description}</p>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <span>{activity.created_by.name}</span>
          <span>•</span>
          <span>{new Date(activity.timestamp).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  )
}
```

---

## **📋 Client Document Review Interface**

### **Client Document Approval Component**
```typescript
// components/clientPortal/ClientDocumentReview.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  FileText, 
  Download, 
  Eye, 
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  User,
  Clock,
  Paperclip
} from 'lucide-react'
import { ClientDocument, ClientDocumentComment } from '@/types/clientPortal'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/use-toast'

interface ClientDocumentReviewProps {
  projectId: string
}

export const ClientDocumentReview: React.FC<ClientDocumentReviewProps> = ({ 
  projectId 
}) => {
  const [selectedDocument, setSelectedDocument] = useState<ClientDocument | null>(null)
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all'>('pending')
  const [approvalComments, setApprovalComments] = useState('')
  const [approvalConditions, setApprovalConditions] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { profile } = useAuth()
  const { toast } = useToast()

  // Fetch client documents
  const [documents, setDocuments] = useState<ClientDocument[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClientDocuments()
  }, [projectId, activeTab])

  const fetchClientDocuments = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/client-documents?status=${activeTab}`)
      const data = await response.json()
      setDocuments(data)
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDocumentApproval = async (
    document: ClientDocument,
    decision: 'approved' | 'rejected' | 'conditional',
    comments?: string,
    conditions?: string[]
  ) => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/documents/${document.document_id}/client-approval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          decision,
          comments,
          conditions,
          client_id: profile?.id,
          approval_date: new Date().toISOString()
        })
      })

      if (response.ok) {
        toast({
          title: "Approval Submitted",
          description: `Document ${decision} successfully.`,
        })
        
        // Refresh documents
        await fetchClientDocuments()
        setSelectedDocument(null)
        setApprovalComments('')
        setApprovalConditions([])
      } else {
        throw new Error('Failed to submit approval')
      }
    } catch (error) {
      toast({
        title: "Approval Failed",
        description: "Failed to submit approval. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddComment = async (
    document: ClientDocument,
    commentText: string,
    commentType: 'general' | 'revision_request' | 'question'
  ) => {
    try {
      const response = await fetch(`/api/documents/${document.document_id}/client-comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          comment_text: commentText,
          comment_type: commentType,
          client_user_id: profile?.id,
          document_version: document.version
        })
      })

      if (response.ok) {
        toast({
          title: "Comment Added",
          description: "Your comment has been added to the document.",
        })
        
        await fetchClientDocuments()
      }
    } catch (error) {
      toast({
        title: "Comment Failed",
        description: "Failed to add comment. Please try again.",
        variant: "destructive"
      })
    }
  }

  const getDocumentStatusColor = (document: ClientDocument) => {
    if (document.approval_required && !document.client_approved) {
      return 'bg-yellow-100 text-yellow-800'
    }
    if (document.client_approved) {
      return 'bg-green-100 text-green-800'
    }
    return 'bg-gray-100 text-gray-800'
  }

  const pendingDocuments = documents.filter(doc => 
    doc.approval_required && !doc.client_approved
  )
  
  const approvedDocuments = documents.filter(doc => 
    doc.client_approved
  )

  if (loading) {
    return <div>Loading documents...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Document Review</h2>
        <p className="text-muted-foreground">
          Review and approve project documents submitted for your approval
        </p>
      </div>

      {/* Document Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Pending Review ({pendingDocuments.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedDocuments.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All Documents ({documents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingDocuments.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <div className="text-muted-foreground">
                  No documents pending your review.
                </div>
              </CardContent>
            </Card>
          ) : (
            <DocumentList
              documents={pendingDocuments}
              onSelect={setSelectedDocument}
              onApprove={handleDocumentApproval}
              onComment={handleAddComment}
              showApprovalActions={true}
            />
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <DocumentList
            documents={approvedDocuments}
            onSelect={setSelectedDocument}
            showApprovalActions={false}
          />
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <DocumentList
            documents={documents}
            onSelect={setSelectedDocument}
            showApprovalActions={false}
          />
        </TabsContent>
      </Tabs>

      {/* Document Detail Modal */}
      {selectedDocument && (
        <ClientDocumentDetailModal
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onApprove={handleDocumentApproval}
          onComment={handleAddComment}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  )
}

// Document List Component
const DocumentList: React.FC<{
  documents: ClientDocument[]
  onSelect: (document: ClientDocument) => void
  onApprove?: (document: ClientDocument, decision: any, comments?: string) => void
  onComment?: (document: ClientDocument, text: string, type: any) => void
  showApprovalActions: boolean
}> = ({ documents, onSelect, onApprove, onComment, showApprovalActions }) => {
  const getFileIcon = (extension: string) => {
    // Return appropriate icon based on file type
    return <FileText className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      {documents.map((document) => (
        <Card key={document.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                <div className="flex-shrink-0">
                  {getFileIcon(document.file_extension)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold truncate">
                      {document.title}
                    </h3>
                    <Badge className={getDocumentStatusColor(document)}>
                      {document.approval_required && !document.client_approved
                        ? 'Pending Review'
                        : document.client_approved
                        ? 'Approved'
                        : 'View Only'
                      }
                    </Badge>
                    {document.version > 1 && (
                      <Badge variant="outline">
                        v{document.version}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                    {document.description}
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <span className="capitalize">{document.document_type.replace('_', ' ')}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span>{new Date(document.uploaded_date).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Paperclip className="h-3 w-3 text-muted-foreground" />
                      <span>{formatFileSize(document.file_size)}</span>
                    </div>
                    
                    {document.approval_deadline && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>Due {new Date(document.approval_deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Comments Summary */}
                  {document.client_comments.length > 0 && (
                    <div className="mt-3 p-2 bg-muted rounded-md">
                      <div className="flex items-center space-x-2 text-sm">
                        <MessageSquare className="h-3 w-3" />
                        <span>{document.client_comments.length} comment(s)</span>
                        <span>•</span>
                        <span>{document.client_comments.filter(c => c.status === 'open').length} open</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Urgent Review Alert */}
                  {document.approval_deadline && new Date(document.approval_deadline) <= new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-center space-x-2 text-red-800 text-sm">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Review deadline approaching: {new Date(document.approval_deadline).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelect(document)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                
                {document.download_allowed && (
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}
                
                {showApprovalActions && document.approval_required && !document.client_approved && onApprove && (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => onApprove(document, 'approved')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onApprove(document, 'rejected')}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Request Changes
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

---

## **🔧 COORDINATOR IMPLEMENTATION INSTRUCTIONS**

### **Subagent Spawning Strategy**
```
TASK: Client Portal System Implementation
OBJECTIVE: Deploy secure external client portal with project access, document review, and communication capabilities
CONTEXT: External-facing system for construction project clients with role-based access, document approval workflows, and real-time communication

REQUIRED READING:
- Patterns: @Patterns/optimized-coordinator-v1.md
- Document Approval: @Planing App/Wave-2-Business-Logic/document-approval-workflow.md
- Shop Drawings: @Planing App/Wave-2-Business-Logic/shop-drawings-integration.md
- Authentication: @Planing App/Wave-1-Foundation/authentication-system.md
- Templates: @Patterns/templates/subagent-template.md

IMPLEMENTATION REQUIREMENTS:
1. Implement secure client authentication with external access controls
2. Build client-focused project dashboard with progress tracking
3. Create document review and approval interface for external users
4. Develop client-project team communication hub
5. Implement client-specific permissions and access restrictions
6. Build responsive mobile interface for client access
7. Create client notification system with preferences
8. Implement audit trail for client interactions

DELIVERABLES:
1. Complete client portal authentication and access control system
2. Client dashboard with project overview and status tracking
3. Document review interface with markup and approval capabilities
4. Communication hub with messaging and notification system
5. Mobile-responsive client interface
6. Client permission management system
7. Client activity audit and reporting
8. Client onboarding and support documentation
```

### **Quality Gates**
- ✅ Client authentication provides secure external access
- ✅ Dashboard displays appropriate project information for client role
- ✅ Document review system enables markup and approval workflows
- ✅ Communication hub facilitates project team collaboration
- ✅ Mobile interface provides full functionality on mobile devices
- ✅ Permission system restricts access to client-appropriate content
- ✅ Audit trail tracks all client interactions and decisions
- ✅ System handles concurrent client access securely

### **Dependencies for Next Wave**
- Client portal system must be fully secure and functional
- Document review integration tested with real approval workflows
- Communication system validated for project team collaboration
- Mobile interface tested across devices and browsers
- Permission system verified for data security compliance

---

## **🎯 SUCCESS CRITERIA**
1. **Secure Access**: Robust external authentication with client-specific permissions
2. **Project Visibility**: Comprehensive project status and progress tracking for clients
3. **Document Collaboration**: Efficient review and approval process with markup capabilities
4. **Communication**: Real-time messaging and notification system
5. **Mobile Experience**: Full-featured mobile interface for client access

**Evaluation Score Target**: 90+ using @Patterns/templates/evaluator-prompt.md