# Document Approval Workflow Pattern

## Implementation Guide
Formula PM Wave 2C - Document Approval Workflow System

## Pattern Overview
Implements a comprehensive document approval workflow system following Formula PM's established patterns. This system manages document approval chains, status tracking, and notification workflows for construction project documents.

## Core Components

### 1. Coordinator Pattern
```typescript
// DocumentApprovalCoordinator.tsx
interface DocumentApprovalCoordinator {
  // Main orchestrator for document approval workflow
  manageApprovalWorkflow(): void
  coordinateApprovalActions(): void
  handleStatusTransitions(): void
  manageNotifications(): void
}
```

### 2. Database Schema Pattern
```sql
-- Core approval workflow tables
documents_approval_workflow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id),
  workflow_type TEXT NOT NULL, -- 'sequential', 'parallel', 'conditional'
  current_status approval_status NOT NULL DEFAULT 'pending',
  approval_sequence INTEGER[], -- Order of approvers
  required_approvers UUID[], -- User IDs who must approve
  completed_approvers UUID[], -- User IDs who have approved
  rejection_reason TEXT,
  estimated_completion_date TIMESTAMP WITH TIME ZONE,
  actual_completion_date TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Approval actions audit trail
approval_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES documents_approval_workflow(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action_type approval_action NOT NULL, -- 'approve', 'reject', 'delegate', 'comment'
  comments TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata_jsonb JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT
);

-- Status enumeration
CREATE TYPE approval_status AS ENUM (
  'pending', 'in_review', 'approved', 'rejected', 
  'cancelled', 'expired', 'delegated'
);

CREATE TYPE approval_action AS ENUM (
  'approve', 'reject', 'delegate', 'comment', 
  'request_changes', 'escalate'
);
```

### 3. API Route Pattern
```typescript
// /src/app/api/documents/[id]/approval/route.ts
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (user) => {
    // Start approval workflow
    const workflowData = await request.json()
    const workflow = await createApprovalWorkflow(params.id, workflowData, user.id)
    await sendApprovalNotifications(workflow)
    return NextResponse.json(workflow)
  }, { requiredPermission: 'documents.manage' })
}

// /src/app/api/documents/[id]/approve/route.ts
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (user) => {
    // Approve document
    const { comments } = await request.json()
    const result = await approveDocument(params.id, user.id, comments)
    await updateWorkflowStatus(result.workflowId)
    return NextResponse.json(result)
  }, { requiredPermission: 'documents.approve' })
}
```

### 4. Component Architecture
```typescript
// Component hierarchy
/src/components/documents/
├── DocumentApprovalCoordinator.tsx     # Main orchestrator
├── ApprovalWorkflowManager.tsx         # Primary interface
├── ApprovalStatusCards.tsx             # Status indicators
├── workflow/
│   ├── WorkflowSteps.tsx              # Step-by-step progress
│   ├── ApprovalActions.tsx            # Approve/reject buttons
│   ├── WorkflowHistory.tsx            # Audit trail
│   └── ApprovalTimeline.tsx           # Visual timeline
├── forms/
│   ├── StartApprovalForm.tsx          # Initialize workflow
│   ├── ApprovalActionForm.tsx         # Approval/rejection form
│   └── DelegateApprovalForm.tsx       # Delegate approval
└── notifications/
    ├── ApprovalNotifications.tsx       # Real-time notifications
    └── ApprovalEmailTemplates.tsx      # Email templates
```

## Implementation Requirements

### 1. Authentication & Authorization
- **Required Permissions**: `documents.manage`, `documents.approve`, `documents.view`
- **Role-based Access**: Different approval powers based on user role
- **Delegation Support**: Users can delegate approval authority

### 2. Workflow Types
- **Sequential**: Approvers must approve in order
- **Parallel**: All approvers can approve simultaneously
- **Conditional**: Approval path depends on document type/value

### 3. Status Management
- **Automatic Transitions**: Status updates based on approval actions
- **Expiration Handling**: Auto-expire workflows after timeout
- **Escalation Rules**: Auto-escalate to supervisors if delayed

### 4. Notification System
- **Real-time Updates**: WebSocket notifications for status changes
- **Email Notifications**: Configurable email alerts
- **Push Notifications**: Mobile app notifications

## Security Considerations

### 1. Row Level Security
```sql
-- Documents approval workflow RLS
CREATE POLICY "workflow_access" ON documents_approval_workflow
  FOR ALL TO authenticated
  USING (
    -- Project team members can view
    EXISTS (
      SELECT 1 FROM project_assignments pa
      JOIN documents d ON d.project_id = pa.project_id
      WHERE d.id = document_id
      AND pa.user_id = auth.uid()
    )
    OR
    -- Approvers can view workflows they're assigned to
    auth.uid() = ANY(required_approvers)
  );
```

### 2. Audit Trail
- **Complete History**: All actions logged with timestamps
- **User Context**: IP address and user agent tracking
- **Immutable Records**: Audit records cannot be modified

### 3. Input Validation
```typescript
// Zod schemas for validation
const StartApprovalSchema = z.object({
  workflowType: z.enum(['sequential', 'parallel', 'conditional']),
  approvers: z.array(z.string().uuid()),
  dueDate: z.string().datetime().optional(),
  comments: z.string().max(1000).optional()
})
```

## Performance Optimization

### 1. Database Indexes
```sql
-- Performance indexes
CREATE INDEX idx_approval_workflow_document ON documents_approval_workflow(document_id);
CREATE INDEX idx_approval_workflow_status ON documents_approval_workflow(current_status);
CREATE INDEX idx_approval_workflow_approvers ON documents_approval_workflow USING GIN(required_approvers);
CREATE INDEX idx_approval_actions_workflow ON approval_actions(workflow_id);
CREATE INDEX idx_approval_actions_user ON approval_actions(user_id);
```

### 2. Caching Strategy
- **Workflow Status**: Cache current status for quick lookups
- **Pending Approvals**: Cache pending approval lists per user
- **Approval History**: Cache recent history for dashboard

## Real-time Integration

### 1. Supabase Subscriptions
```typescript
// Real-time workflow updates
const subscription = supabase
  .channel('approval-workflows')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'documents_approval_workflow'
  }, (payload) => {
    updateWorkflowStatus(payload.new)
  })
  .subscribe()
```

### 2. Notification Triggers
```sql
-- Database triggers for notifications
CREATE OR REPLACE FUNCTION notify_approval_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Send notification when workflow status changes
  INSERT INTO notifications (user_id, type, title, message, metadata)
  SELECT 
    unnest(NEW.required_approvers),
    'approval_workflow',
    'Document Approval Required',
    'Document approval workflow status changed',
    jsonb_build_object('workflow_id', NEW.id, 'status', NEW.current_status);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER approval_status_change_trigger
  AFTER UPDATE ON documents_approval_workflow
  FOR EACH ROW
  WHEN (OLD.current_status != NEW.current_status)
  EXECUTE FUNCTION notify_approval_status_change();
```

## Testing Strategy

### 1. Unit Tests
- **Workflow Logic**: Test approval status transitions
- **Permission Checks**: Verify role-based access
- **Validation**: Test input validation schemas

### 2. Integration Tests
- **API Endpoints**: Test complete approval workflows
- **Database Operations**: Verify data integrity
- **Notification System**: Test real-time updates

### 3. User Acceptance Tests
- **Approval Workflows**: Test different workflow types
- **Role-based Access**: Verify permissions work correctly
- **Mobile Experience**: Test responsive design

## Deployment Considerations

### 1. Migration Strategy
- **Database Schema**: Deploy approval workflow tables
- **Data Migration**: Migrate existing document statuses
- **Permission Updates**: Update user permissions

### 2. Feature Flags
- **Gradual Rollout**: Enable for specific user groups first
- **Fallback Options**: Maintain legacy approval process
- **Performance Monitoring**: Monitor system impact

## Success Metrics

### 1. Functional Requirements
- **90+ Evaluation Score**: Must meet quality standards
- **Response Time**: <200ms API response times
- **Real-time Updates**: <1 second notification delivery
- **Mobile Support**: Full functionality on mobile devices

### 2. Business Metrics
- **Approval Time**: Reduce average approval time by 50%
- **Process Clarity**: 95% user satisfaction with workflow visibility
- **Error Reduction**: 90% reduction in approval process errors
- **Compliance**: 100% audit trail completeness

## Integration Points

### 1. Existing Systems
- **Project Management**: Link to project milestones
- **Document Management**: Integrate with document storage
- **User Management**: Use existing 13-role system
- **Notification System**: Leverage existing notification infrastructure

### 2. Future Integrations
- **Mobile App**: Native mobile approval interface
- **Email System**: Advanced email template system
- **Analytics**: Approval process analytics dashboard
- **Third-party Tools**: Integration with external approval systems

This pattern ensures the Document Approval Workflow system maintains consistency with Formula PM's established architecture while providing comprehensive approval workflow capabilities for construction project management.