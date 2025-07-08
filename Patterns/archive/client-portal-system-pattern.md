# Client Portal System Pattern

## Overview
The Client Portal System pattern provides secure external access for project clients to view progress, review documents, approve submissions, and communicate with project teams. This pattern ensures controlled access with client-specific permissions while maintaining security boundaries between internal and external users.

## Pattern Classification
**Type**: External Access Pattern  
**Complexity**: High  
**Dependencies**: Authentication, Project Management, Document Approval Workflow, Communication System  
**User Roles**: client, project_manager, technical_director, architect, admin

## Core Components

### Database Schema
```sql
-- Core tables for client portal system
CREATE TABLE client_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id UUID NOT NULL REFERENCES user_profiles(user_id),
  
  -- Client Information
  client_company_id UUID NOT NULL REFERENCES client_companies(id),
  access_level client_access_level NOT NULL DEFAULT 'view_only',
  portal_access_enabled BOOLEAN DEFAULT true,
  
  -- Security & Authentication
  last_login TIMESTAMP WITH TIME ZONE,
  login_attempts INTEGER DEFAULT 0,
  account_locked BOOLEAN DEFAULT false,
  password_reset_required BOOLEAN DEFAULT false,
  two_factor_enabled BOOLEAN DEFAULT false,
  
  -- Preferences
  notification_preferences JSONB DEFAULT '{}',
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'UTC',
  theme VARCHAR(20) DEFAULT 'light',
  
  -- Tracking
  created_by UUID NOT NULL REFERENCES user_profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE
);

CREATE TABLE client_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(200) NOT NULL,
  company_type client_company_type NOT NULL,
  contact_person VARCHAR(100),
  primary_email VARCHAR(100),
  primary_phone VARCHAR(20),
  address TEXT,
  billing_address TEXT,
  tax_id VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  
  -- Portal Branding
  logo_url TEXT,
  brand_colors JSONB,
  custom_domain VARCHAR(100),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE client_project_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID NOT NULL REFERENCES client_users(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  access_level client_project_access_level NOT NULL DEFAULT 'viewer',
  
  -- Access Control
  can_view_financials BOOLEAN DEFAULT false,
  can_approve_documents BOOLEAN DEFAULT false,
  can_view_schedules BOOLEAN DEFAULT true,
  can_access_reports BOOLEAN DEFAULT true,
  
  -- Restrictions
  restricted_areas TEXT[], -- Array of restricted project areas
  access_start_date DATE,
  access_end_date DATE,
  
  -- Tracking
  granted_by UUID NOT NULL REFERENCES user_profiles(user_id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(client_user_id, project_id)
);

CREATE TABLE client_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID NOT NULL REFERENCES client_users(id),
  permission_type client_permission_type NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  project_specific BOOLEAN DEFAULT true,
  
  -- Permission Details
  allowed_actions TEXT[] NOT NULL,
  conditions JSONB DEFAULT '{}',
  
  -- Validity
  granted_by UUID NOT NULL REFERENCES user_profiles(user_id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE client_document_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID NOT NULL REFERENCES client_users(id),
  document_id UUID NOT NULL REFERENCES documents(id),
  access_type client_document_access_type NOT NULL DEFAULT 'view',
  
  -- Access Control
  can_download BOOLEAN DEFAULT true,
  can_comment BOOLEAN DEFAULT true,
  can_approve BOOLEAN DEFAULT false,
  watermarked BOOLEAN DEFAULT false,
  
  -- Tracking
  first_accessed TIMESTAMP WITH TIME ZONE,
  last_accessed TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  
  granted_by UUID NOT NULL REFERENCES user_profiles(user_id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(client_user_id, document_id)
);

CREATE TABLE client_document_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID NOT NULL REFERENCES client_users(id),
  document_id UUID NOT NULL REFERENCES documents(id),
  approval_decision client_approval_decision NOT NULL,
  
  -- Approval Details
  approval_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approval_comments TEXT,
  approval_conditions TEXT[],
  digital_signature JSONB,
  
  -- Document Version Tracking
  document_version INTEGER NOT NULL,
  revision_letter VARCHAR(5),
  
  -- Status
  is_final BOOLEAN DEFAULT true,
  superseded_by UUID REFERENCES client_document_approvals(id),
  
  -- Tracking
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(100)
);

CREATE TABLE client_document_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID NOT NULL REFERENCES client_users(id),
  document_id UUID NOT NULL REFERENCES documents(id),
  
  -- Comment Content
  comment_text TEXT NOT NULL,
  comment_type client_comment_type NOT NULL DEFAULT 'general',
  priority client_priority DEFAULT 'medium',
  
  -- Document Positioning (for markups)
  page_number INTEGER,
  x_coordinate DECIMAL(10,3),
  y_coordinate DECIMAL(10,3),
  markup_data JSONB,
  
  -- Status and Threading
  status client_comment_status DEFAULT 'open',
  parent_comment_id UUID REFERENCES client_document_comments(id),
  
  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES user_profiles(user_id)
);

CREATE TABLE client_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID NOT NULL REFERENCES client_users(id),
  project_id UUID REFERENCES projects(id),
  
  -- Notification Content
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  notification_type client_notification_type NOT NULL,
  priority client_priority DEFAULT 'medium',
  
  -- Delivery
  delivery_method client_delivery_method[] DEFAULT ARRAY['in_app'],
  email_sent BOOLEAN DEFAULT false,
  sms_sent BOOLEAN DEFAULT false,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  
  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE client_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID NOT NULL REFERENCES client_users(id),
  project_id UUID REFERENCES projects(id),
  
  -- Activity Details
  activity_type client_activity_type NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  action_taken VARCHAR(100) NOT NULL,
  
  -- Context
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Session Information
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(100),
  
  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE client_communication_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  client_user_id UUID NOT NULL REFERENCES client_users(id),
  
  -- Thread Details
  subject VARCHAR(300) NOT NULL,
  thread_type client_thread_type DEFAULT 'general',
  priority client_priority DEFAULT 'medium',
  status client_thread_status DEFAULT 'open',
  
  -- Participants
  internal_participants UUID[] DEFAULT '{}',
  client_participants UUID[] DEFAULT '{}',
  
  -- Settings
  auto_close_after_days INTEGER,
  requires_response BOOLEAN DEFAULT false,
  response_deadline TIMESTAMP WITH TIME ZONE,
  
  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  closed_by UUID REFERENCES user_profiles(user_id)
);

CREATE TABLE client_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES client_communication_threads(id),
  sender_id UUID NOT NULL REFERENCES user_profiles(user_id),
  
  -- Message Content
  message_body TEXT NOT NULL,
  message_type client_message_type DEFAULT 'text',
  
  -- Attachments
  attachments JSONB DEFAULT '[]',
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Enums
CREATE TYPE client_access_level AS ENUM ('view_only', 'reviewer', 'approver', 'project_owner');
CREATE TYPE client_company_type AS ENUM ('individual', 'corporation', 'partnership', 'government', 'non_profit');
CREATE TYPE client_project_access_level AS ENUM ('viewer', 'reviewer', 'approver', 'stakeholder');
CREATE TYPE client_permission_type AS ENUM ('document_access', 'project_access', 'communication', 'reporting', 'financial');
CREATE TYPE client_document_access_type AS ENUM ('view', 'download', 'comment', 'approve');
CREATE TYPE client_approval_decision AS ENUM ('approved', 'approved_with_conditions', 'rejected', 'requires_revision');
CREATE TYPE client_comment_type AS ENUM ('general', 'revision_request', 'question', 'approval_condition', 'concern');
CREATE TYPE client_comment_status AS ENUM ('open', 'addressed', 'resolved', 'closed');
CREATE TYPE client_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE client_notification_type AS ENUM (
  'document_submitted', 'approval_required', 'approval_received', 'project_milestone',
  'schedule_change', 'budget_update', 'quality_issue', 'delivery_notification',
  'message_received', 'system_announcement'
);
CREATE TYPE client_delivery_method AS ENUM ('in_app', 'email', 'sms', 'push');
CREATE TYPE client_activity_type AS ENUM (
  'login', 'logout', 'document_view', 'document_download', 'document_approve',
  'comment_add', 'message_send', 'project_access', 'profile_update'
);
CREATE TYPE client_thread_type AS ENUM ('general', 'technical', 'commercial', 'quality', 'schedule', 'support');
CREATE TYPE client_thread_status AS ENUM ('open', 'pending_response', 'resolved', 'closed');
CREATE TYPE client_message_type AS ENUM ('text', 'file', 'image', 'system');

-- Indexes for performance
CREATE INDEX idx_client_users_company ON client_users(client_company_id);
CREATE INDEX idx_client_users_access_level ON client_users(access_level);
CREATE INDEX idx_client_users_last_activity ON client_users(last_activity);
CREATE INDEX idx_client_project_access_client ON client_project_access(client_user_id);
CREATE INDEX idx_client_project_access_project ON client_project_access(project_id);
CREATE INDEX idx_client_document_access_client ON client_document_access(client_user_id);
CREATE INDEX idx_client_document_access_document ON client_document_access(document_id);
CREATE INDEX idx_client_notifications_unread ON client_notifications(client_user_id, is_read);
CREATE INDEX idx_client_activity_log_client_time ON client_activity_log(client_user_id, created_at);
CREATE INDEX idx_client_messages_thread ON client_messages(thread_id, created_at);
```

### API Routes Structure
```
/api/client-portal/
  ├── auth/
  │   ├── POST   /login        # Client portal login
  │   ├── POST   /logout       # Client portal logout
  │   ├── POST   /reset        # Password reset
  │   └── GET    /profile      # Get client profile
  ├── dashboard/
  │   ├── GET    /             # Client dashboard data
  │   ├── GET    /projects     # Client's accessible projects
  │   ├── GET    /activities   # Recent activities
  │   └── GET    /notifications # Client notifications
  ├── projects/
  │   ├── GET    /[id]         # Project details for client
  │   ├── GET    /[id]/progress # Project progress
  │   ├── GET    /[id]/milestones # Project milestones
  │   ├── GET    /[id]/team    # Project team contacts
  │   └── GET    /[id]/documents # Project documents for client
  ├── documents/
  │   ├── GET    /             # List accessible documents
  │   ├── GET    /[id]         # Get document details
  │   ├── GET    /[id]/download # Download document
  │   ├── POST   /[id]/approve # Submit approval decision
  │   ├── POST   /[id]/comment # Add comment to document
  │   ├── GET    /[id]/comments # Get document comments
  │   └── PUT    /[id]/comments/[commentId] # Update comment
  ├── communications/
  │   ├── GET    /threads      # Get communication threads
  │   ├── POST   /threads      # Create new thread
  │   ├── GET    /threads/[id] # Get thread messages
  │   ├── POST   /threads/[id]/messages # Send message
  │   └── PUT    /threads/[id]/read # Mark thread as read
  ├── notifications/
  │   ├── GET    /             # Get notifications
  │   ├── PUT    /[id]/read    # Mark notification as read
  │   ├── PUT    /bulk/read    # Mark multiple as read
  │   └── PUT    /preferences  # Update notification preferences
  └── reports/
      ├── GET    /project/[id]/summary # Project summary report
      ├── GET    /project/[id]/progress # Progress report
      └── GET    /documents/approvals # Document approval history
```

### Component Architecture
```
ClientPortalCoordinator (Main orchestrator)
├── ClientAuthenticationManager
│   ├── ClientLoginForm
│   ├── ClientPasswordReset
│   └── ClientSessionManager
├── ClientDashboard
│   ├── ProjectOverviewCards
│   ├── PendingApprovalsWidget
│   ├── RecentActivityFeed
│   └── NotificationCenter
├── ClientProjectManager
│   ├── ProjectDetailView
│   ├── ProjectProgressTracker
│   ├── ProjectMilestoneTimeline
│   └── ProjectTeamDirectory
├── ClientDocumentManager
│   ├── DocumentLibrary
│   ├── DocumentViewer
│   ├── DocumentApprovalInterface
│   ├── DocumentCommentSystem
│   └── DocumentDownloadManager
├── ClientCommunicationHub
│   ├── MessageThreadList
│   ├── MessageComposer
│   ├── MessageThread
│   └── CommunicationHistory
├── ClientNotificationSystem
│   ├── NotificationPanel
│   ├── NotificationPreferences
│   └── NotificationDeliveryManager
└── ClientReportingCenter
    ├── ProjectSummaryReport
    ├── DocumentApprovalReport
    └── ActivityReport
```

## Implementation Requirements

### Authentication & Authorization
- **External Authentication**: Separate client portal authentication system
- **Role-based Access**: client access level with project-specific permissions
- **Multi-factor Authentication**: Optional 2FA for enhanced security
- **Session Management**: Secure session handling with timeout controls
- **Access Restrictions**: Time-based and resource-specific access controls

### Business Rules
1. **Project Access Control**:
   - Clients only see projects they're explicitly granted access to
   - Access levels determine available functionality (view/review/approve)
   - Financial data visibility controlled by specific permissions
   - Project phases may have different access requirements

2. **Document Management**:
   - Document access controlled by confidentiality level
   - Approval workflows specific to client role and document type
   - Version control ensures clients see appropriate document versions
   - Watermarking for sensitive documents

3. **Communication Control**:
   - Client-initiated threads require internal team routing
   - Priority-based message handling and escalation
   - Auto-close inactive threads after configurable periods
   - Message archiving for compliance

4. **Security & Compliance**:
   - Complete audit trail for all client activities
   - IP-based access restrictions if required
   - Data retention policies for client communications
   - GDPR compliance for client data handling

### Performance Requirements
- **API Response**: <300ms for client portal endpoints
- **Document Loading**: <2s for document previews
- **Mobile Responsive**: Full functionality on mobile devices
- **Offline Capability**: View cached documents when offline
- **Concurrent Users**: Support 100+ simultaneous client connections

### Security Requirements
- **External Access**: Strict RLS policies for client data isolation
- **Input Validation**: Comprehensive validation for all client inputs
- **File Security**: Secure document access with anti-leaking measures
- **Activity Monitoring**: Real-time monitoring of suspicious activities
- **Data Encryption**: Encryption at rest and in transit for sensitive data

## Integration Points

### Existing Systems
- **Project Management**: Read-only access to project data and progress
- **Document Approval Workflow**: Integration with existing approval processes
- **Authentication System**: Separate but integrated authentication flow
- **Notification System**: Client-specific notification preferences and delivery
- **Communication System**: Bridged with internal team communication

### External Communications
- **Email Integration**: Automated notifications and document sharing
- **SMS Integration**: Critical notification delivery
- **Calendar Integration**: Meeting scheduling and milestone notifications
- **Document Storage**: Secure access to project documents

## Mobile Considerations
- **Progressive Web App**: Full PWA implementation for mobile access
- **Touch-Optimized Interface**: Gesture-based navigation and interactions
- **Offline Document Access**: Cached document viewing capabilities
- **Push Notifications**: Mobile push notification support
- **Camera Integration**: Photo capture for approval processes

## Security-First Design
- **Zero Trust Architecture**: Every request validated and authorized
- **Client Data Isolation**: Complete separation between client accounts
- **Audit Everything**: Comprehensive logging of all client interactions
- **Minimal Access Principle**: Clients see only what they need to see
- **Secure by Default**: All features require explicit permission grants

## Quality Metrics
- **Evaluation Target**: 90+ score required
- **Pattern Compliance**: Must follow Formula PM conventions exactly
- **TypeScript Coverage**: 100% type safety for client portal
- **Security Testing**: Penetration testing for external access
- **Performance**: Sub-300ms response times for client endpoints

## Success Indicators
- Secure external client access with granular permissions
- Streamlined document review and approval process
- Effective client-team communication channels
- Comprehensive audit trail for compliance
- Mobile-first responsive design for field access
- Integration with existing Formula PM systems without security compromise

## Implementation Notes
- Follow existing Formula PM patterns exactly
- Use Supabase RLS for client data isolation
- Implement using Next.js 15 App Router with client portal routes
- Use Shadcn/ui for consistent UI components
- Maintain complete separation from internal user interfaces
- Implement comprehensive error handling and graceful degradation
- Create client-specific branding and theming capabilities