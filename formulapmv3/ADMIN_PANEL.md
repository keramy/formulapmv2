# Formula PM 3.0 - Admin Panel Implementation

## 🛡️ Overview

The Admin Panel is where company administrators manage users, permissions, and system settings without touching code. Keeping it simple and focused on essential features.

## 🎯 Core Features (v3.0)

### 1. User Management

#### User List Table
```tsx
interface UserTableColumns {
  name: string
  email: string
  jobTitle: string           // Descriptive text
  department: string         // Descriptive text
  permissionCount: number    // e.g., "12 permissions"
  lastLogin: Date
  status: 'active' | 'inactive'
  actions: 'edit' | 'permissions' | 'deactivate'
}
```

#### User Actions
- **Add New User** - Create account and send invite email
- **Edit User** - Update profile info (name, job title, department)
- **Manage Permissions** - Visual permission editor
- **Reset Password** - Send password reset email
- **Deactivate/Activate** - Soft delete, preserves data

### 2. Permission Management

#### Visual Permission Editor
```tsx
function PermissionEditor({ userId }: { userId: string }) {
  const { data: user } = useUser(userId)
  const [permissions, setPermissions] = useState(user.permissions)
  
  const permissionCategories = {
    'Project Management': [
      { key: 'create_projects', label: 'Create Projects' },
      { key: 'edit_projects', label: 'Edit Projects' },
      { key: 'delete_projects', label: 'Delete Projects' },
      { key: 'view_all_projects', label: 'View All Projects' }
    ],
    'Financial': [
      { key: 'view_project_costs', label: 'View Project Costs' },
      { key: 'view_profit_margins', label: 'View Profit Margins' },
      { key: 'approve_expenses', label: 'Approve Expenses' }
    ],
    'Shop Drawings': [
      { key: 'create_shop_drawings', label: 'Create Drawings' },
      { key: 'internal_review_drawings', label: 'Internal Review' },
      { key: 'submit_to_client', label: 'Submit to Client' }
    ],
    'Administration': [
      { key: 'admin_panel_access', label: 'Access Admin Panel' },
      { key: 'manage_users', label: 'Manage Users' },
      { key: 'manage_permissions', label: 'Manage Permissions' }
    ]
  }
  
  return (
    <div className="space-y-6">
      {Object.entries(permissionCategories).map(([category, perms]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle>{category}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {perms.map(perm => (
                <div key={perm.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={perm.key}
                    checked={permissions.includes(perm.key)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setPermissions([...permissions, perm.key])
                      } else {
                        setPermissions(permissions.filter(p => p !== perm.key))
                      }
                    }}
                  />
                  <label htmlFor={perm.key}>{perm.label}</label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
      
      <div className="flex gap-2">
        <Button onClick={() => savePermissions(userId, permissions)}>
          Save Permissions
        </Button>
        <Button variant="outline" onClick={() => setPermissions(user.permissions)}>
          Reset
        </Button>
      </div>
    </div>
  )
}
```

#### Permission Templates
```tsx
const permissionTemplates = [
  {
    name: 'Project Manager',
    description: 'Full project control with financial visibility',
    permissions: [
      'create_projects', 'edit_projects', 'view_all_projects',
      'view_project_costs', 'approve_expenses', 'assign_team_members',
      'create_tasks', 'manage_milestones'
    ]
  },
  {
    name: 'Site Supervisor',
    description: 'Field management and task coordination',
    permissions: [
      'view_all_projects', 'create_tasks', 'edit_tasks',
      'manage_scope_items', 'assign_subcontractors', 'create_punch_lists'
    ]
  },
  {
    name: 'Architect',
    description: 'Drawing and material specification management',
    permissions: [
      'create_shop_drawings', 'internal_review_drawings',
      'create_material_specs', 'submit_to_client'
    ]
  },
  {
    name: 'Client Access',
    description: 'View-only access for clients',
    permissions: [
      'view_assigned_projects', 'review_submitted_drawings',
      'view_milestones', 'view_reports'
    ]
  },
  {
    name: 'Subcontractor',
    description: 'Limited access for subcontractors',
    permissions: [
      'view_assigned_scope', 'update_task_status',
      'upload_documents'
    ]
  }
]
```

#### Quick Actions
- **Copy Permissions** - Copy from another user
- **Apply Template** - Apply pre-built permission set
- **Clear All** - Remove all permissions
- **Select All in Category** - Quick category selection

### 3. Company Settings

```tsx
interface CompanySettings {
  // Basic Info
  companyName: string
  logo: string
  address: string
  phone: string
  email: string
  
  // Preferences
  defaultCurrency: 'USD' | 'EUR' | 'GBP'
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY'
  timeZone: string
  
  // Project Defaults
  defaultProjectDuration: number // days
  requireApprovalForCosts: boolean
  autoArchiveAfterDays: number
}
```

### 4. Audit Log

#### Track Important Events
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- 'permission_change', 'user_login', 'user_created', etc.
  user_id UUID REFERENCES auth.users(id),
  performed_by UUID REFERENCES auth.users(id),
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example audit log entry
{
  "event_type": "permission_change",
  "user_id": "user-123",
  "performed_by": "admin-456",
  "details": {
    "permissions_added": ["create_projects", "edit_projects"],
    "permissions_removed": ["delete_projects"],
    "reason": "Promoted to Project Manager"
  }
}
```

#### Audit Log Viewer
```tsx
function AuditLogViewer() {
  const { data: logs } = useAuditLogs()
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date/Time</TableHead>
          <TableHead>Event</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Performed By</TableHead>
          <TableHead>Details</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map(log => (
          <TableRow key={log.id}>
            <TableCell>{formatDate(log.created_at)}</TableCell>
            <TableCell>
              <Badge>{formatEventType(log.event_type)}</Badge>
            </TableCell>
            <TableCell>{log.user?.name}</TableCell>
            <TableCell>{log.performed_by?.name}</TableCell>
            <TableCell>
              <Button variant="ghost" size="sm">
                View Details
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

## 📊 Admin Dashboard

### Key Metrics Display
```tsx
function AdminDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <MetricCard
        title="Total Users"
        value={stats.totalUsers}
        change="+3 this week"
      />
      <MetricCard
        title="Active Projects"
        value={stats.activeProjects}
        subtitle="12 completed"
      />
      <MetricCard
        title="Active Now"
        value={stats.activeUsers}
        subtitle="Users online"
      />
      <MetricCard
        title="Storage Used"
        value={`${stats.storageGB} GB`}
        subtitle="of 100 GB"
      />
    </div>
  )
}
```

## 🔒 Security Considerations

### Access Control
- Only users with `admin_panel_access` permission can access
- Super admin role for sensitive operations
- IP restrictions for admin access (optional)
- Two-factor authentication for admins (future)

### Data Protection
- Audit all permission changes
- No hard deletes (soft delete only)
- Encrypted sensitive data
- Regular permission reviews

## 🎨 UI Layout

```
┌────────────────────────────────────────────────────┐
│ Admin Panel                          👤 Admin Name │
├────────────────────────────────────────────────────┤
│ ┌──────────┬────────────────────────────────────┐ │
│ │ Sidebar  │  Main Content Area                  │ │
│ │          │                                      │ │
│ │ Dashboard│  [User Management Table]            │ │
│ │ Users    │  [Permission Editor]                │ │
│ │ Settings │  [Audit Logs]                       │ │
│ │ Templates│                                      │ │
│ │ Audit Log│                                      │ │
│ └──────────┴────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
```

## 🚀 Implementation Priority

### Phase 1 (Core - v3.0)
1. User list and basic CRUD
2. Visual permission editor
3. Permission templates
4. Basic audit log
5. Company settings

### Phase 2 (Enhanced - v3.1+)
- Bulk user operations
- CSV import/export
- Advanced filtering
- System monitoring
- API usage tracking
- Email notifications

## 📝 Admin Workflows

### Adding a New User
1. Admin clicks "Add User"
2. Fills in email, name, job title
3. Selects permission template or custom
4. System sends invite email
5. User sets password on first login

### Changing Permissions
1. Admin selects user
2. Opens permission editor
3. Modifies permissions
4. Adds reason (optional)
5. Changes logged in audit trail

### Applying Template
1. Select user(s)
2. Choose template
3. Preview changes
4. Confirm application
5. Bulk update applied

## 🎯 Success Metrics

- Time to add new user: < 2 minutes
- Time to update permissions: < 30 seconds
- Audit trail completeness: 100%
- Admin task completion rate: > 95%

---

*Last Updated: January 2025*
*Status: Admin Panel Defined*
*Next Step: Timeline and Deployment Strategy*