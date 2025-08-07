# Formula PM 3.0 - Approval Workflows

## 🔄 Overview

Two main features require approval workflows:
1. **Shop Drawings** - Technical drawings requiring review and approval
2. **Change Orders** - Project changes requiring authorization

Both follow a similar pattern: Internal Review → Client Approval

## 📊 Workflow States

### Shop Drawings Workflow
```typescript
enum ShopDrawingStatus {
  DRAFT = 'draft',
  INTERNAL_REVIEW = 'internal_review',
  INTERNAL_APPROVED = 'internal_approved',
  INTERNAL_REJECTED = 'internal_rejected',
  SUBMITTED_TO_CLIENT = 'submitted_to_client',
  CLIENT_APPROVED = 'client_approved',
  CLIENT_REJECTED = 'client_rejected',
  REVISION_REQUESTED = 'revision_requested'
}
```

### Change Orders Workflow
```typescript
enum ChangeOrderStatus {
  DRAFT = 'draft',
  INTERNAL_REVIEW = 'internal_review',
  COSTING_REVIEW = 'costing_review',
  INTERNAL_APPROVED = 'internal_approved',
  INTERNAL_REJECTED = 'internal_rejected',
  SUBMITTED_TO_CLIENT = 'submitted_to_client',
  CLIENT_APPROVED = 'client_approved',
  CLIENT_REJECTED = 'client_rejected',
  IMPLEMENTED = 'implemented'
}
```

## 🗄️ Database Schema

### Shop Drawings Table
```sql
CREATE TABLE shop_drawings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  drawing_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  file_url TEXT,
  
  -- Tracking fields
  created_by UUID REFERENCES auth.users(id),
  internal_reviewed_by UUID REFERENCES auth.users(id),
  internal_reviewed_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ,
  client_reviewed_by UUID REFERENCES auth.users(id),
  client_reviewed_at TIMESTAMPTZ,
  
  -- Comments
  internal_comments TEXT,
  client_comments TEXT,
  revision_comments TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Change Orders Table
```sql
CREATE TABLE change_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  change_order_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  
  -- Financial impact
  cost_impact DECIMAL(10,2),
  time_impact_days INTEGER,
  
  -- Tracking fields
  created_by UUID REFERENCES auth.users(id),
  internal_reviewed_by UUID REFERENCES auth.users(id),
  internal_reviewed_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ,
  client_reviewed_by UUID REFERENCES auth.users(id),
  client_reviewed_at TIMESTAMPTZ,
  
  -- Comments
  internal_comments TEXT,
  client_comments TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Workflow History Table (Audit Trail)
```sql
CREATE TABLE workflow_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'shop_drawing' or 'change_order'
  entity_id UUID NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🎨 UI Components

### Shop Drawing Card Component
```tsx
function ShopDrawingCard({ drawing }: { drawing: ShopDrawing }) {
  const { hasPermission } = usePermissions()
  const { mutate: updateStatus } = useUpdateDrawingStatus()
  
  const handleStatusUpdate = async (newStatus: string, comments?: string) => {
    await updateStatus({
      id: drawing.id,
      status: newStatus,
      comments
    })
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{drawing.drawing_number}</CardTitle>
            <CardDescription>{drawing.title}</CardDescription>
          </div>
          <StatusBadge status={drawing.status} />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Drawing preview */}
          <div className="aspect-video bg-gray-100 rounded">
            <img src={drawing.file_url} alt={drawing.title} />
          </div>
          
          {/* Action buttons based on status and permissions */}
          <WorkflowActions 
            status={drawing.status}
            onStatusUpdate={handleStatusUpdate}
          />
        </div>
      </CardContent>
    </Card>
  )
}
```

### Workflow Actions Component
```tsx
function WorkflowActions({ status, onStatusUpdate }) {
  const { hasPermission } = usePermissions()
  const [showCommentDialog, setShowCommentDialog] = useState(false)
  const [comments, setComments] = useState('')
  
  // Define available actions based on status and permissions
  const getAvailableActions = () => {
    const actions = []
    
    switch (status) {
      case 'draft':
        if (hasPermission('submit_for_internal_review')) {
          actions.push({
            label: 'Submit for Internal Review',
            status: 'internal_review',
            variant: 'default'
          })
        }
        break
        
      case 'internal_review':
        if (hasPermission('internal_review_drawings')) {
          actions.push({
            label: 'Approve Internally',
            status: 'internal_approved',
            variant: 'success'
          })
          actions.push({
            label: 'Request Revision',
            status: 'revision_requested',
            variant: 'warning',
            requiresComment: true
          })
          actions.push({
            label: 'Reject',
            status: 'internal_rejected',
            variant: 'destructive',
            requiresComment: true
          })
        }
        break
        
      case 'internal_approved':
        if (hasPermission('submit_to_client')) {
          actions.push({
            label: 'Submit to Client',
            status: 'submitted_to_client',
            variant: 'default'
          })
        }
        break
        
      case 'submitted_to_client':
        if (hasPermission('client_review_drawings')) {
          actions.push({
            label: 'Client Approve',
            status: 'client_approved',
            variant: 'success'
          })
          actions.push({
            label: 'Client Request Revision',
            status: 'revision_requested',
            variant: 'warning',
            requiresComment: true
          })
          actions.push({
            label: 'Client Reject',
            status: 'client_rejected',
            variant: 'destructive',
            requiresComment: true
          })
        }
        break
    }
    
    return actions
  }
  
  const actions = getAvailableActions()
  
  if (actions.length === 0) {
    return null
  }
  
  return (
    <div className="flex gap-2 flex-wrap">
      {actions.map((action) => (
        <Button
          key={action.status}
          variant={action.variant}
          onClick={() => {
            if (action.requiresComment) {
              setShowCommentDialog(true)
            } else {
              onStatusUpdate(action.status)
            }
          }}
        >
          {action.label}
        </Button>
      ))}
    </div>
  )
}
```

## 📋 Permission Definitions

### Shop Drawing Permissions
```typescript
const shopDrawingPermissions = {
  'create_shop_drawings': 'Can create new shop drawings',
  'edit_shop_drawings': 'Can edit existing shop drawings',
  'delete_shop_drawings': 'Can delete shop drawings',
  'submit_for_internal_review': 'Can submit drawings for internal review',
  'internal_review_drawings': 'Can review drawings internally',
  'submit_to_client': 'Can submit drawings to client',
  'client_review_drawings': 'Can review drawings as client',
  'view_all_drawings': 'Can view all project drawings'
}
```

### Change Order Permissions
```typescript
const changeOrderPermissions = {
  'create_change_orders': 'Can create change orders',
  'edit_change_orders': 'Can edit change orders',
  'delete_change_orders': 'Can delete change orders',
  'review_change_order_costs': 'Can review financial impact',
  'internal_approve_change_orders': 'Can approve internally',
  'submit_change_order_to_client': 'Can submit to client',
  'client_approve_change_orders': 'Can approve as client',
  'implement_change_orders': 'Can mark as implemented'
}
```

## 🔄 Workflow Visualization

### Status Flow Component
```tsx
function WorkflowProgress({ currentStatus, workflowType }) {
  const steps = workflowType === 'shop_drawing' 
    ? ['Draft', 'Internal Review', 'Client Review', 'Approved']
    : ['Draft', 'Internal Review', 'Costing', 'Client Review', 'Approved', 'Implemented']
  
  const currentStep = getStepFromStatus(currentStatus)
  
  return (
    <div className="flex items-center space-x-2">
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full text-sm",
            index <= currentStep 
              ? "bg-primary text-white" 
              : "bg-gray-200 text-gray-500"
          )}>
            {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
          </div>
          {index < steps.length - 1 && (
            <div className={cn(
              "flex-1 h-1",
              index < currentStep ? "bg-primary" : "bg-gray-200"
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
```

## 📊 Workflow Analytics

Track workflow performance:
- Average time in each stage
- Bottleneck identification
- Rejection rates
- Revision cycles

```typescript
interface WorkflowMetrics {
  averageApprovalTime: number // days
  rejectionRate: number // percentage
  averageRevisionCycles: number
  bottleneckStage: string
}
```

## 🎯 Key Benefits

1. **Clear Visibility** - Everyone knows the current status
2. **Permission-Based** - Only see actions you can perform
3. **Audit Trail** - Complete history of all changes
4. **Flexible** - Easy to add new workflow stages
5. **Client Transparency** - Clients see their items clearly

---

*Last Updated: January 2025*
*Status: Workflow Pattern Defined*
*Next Step: Admin Panel Implementation*