# Formula PM 3.0 - Revolutionary RBAC System

## 🔑 Core Concept

**The Revolution**: Eliminate fixed roles entirely. Job titles are descriptive text only. Real access control happens through a flexible permissions array.

## 🗄️ Database Changes

```sql
-- Add to existing user_profiles table
ALTER TABLE user_profiles ADD COLUMN permissions TEXT[] DEFAULT '{}';
ALTER TABLE user_profiles ADD COLUMN job_title TEXT;  -- Descriptive only
ALTER TABLE user_profiles ADD COLUMN department TEXT;  -- Descriptive only

-- Permission templates for admin management
CREATE TABLE permission_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  permissions TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit trail for permission changes
CREATE TABLE permission_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  changed_by UUID REFERENCES auth.users(id),
  old_permissions TEXT[],
  new_permissions TEXT[],
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🎯 How It Works

### User Profile Example
```json
{
  "id": "user-123",
  "email": "john@construction.com",
  "job_title": "Project Manager",  // Just descriptive text
  "department": "Operations",       // Just descriptive text
  "permissions": [
    "create_projects",
    "view_project_costs", 
    "internal_review_drawings",
    "submit_to_client",
    "approve_expenses"
  ]
}
```

### Component Usage
```tsx
// Simple permission check
const { hasPermission } = usePermissions()

return (
  <div>
    <h1>{project.name}</h1>
    
    {hasPermission('view_project_costs') && (
      <p>Budget: ${project.budget}</p>
    )}
    
    {hasPermission('edit_projects') && (
      <Button>Edit Project</Button>
    )}
  </div>
)
```

### API Route Protection
```tsx
export const GET = withAuth(async (request, { user, profile }) => {
  if (!profile.permissions.includes('view_financial_reports')) {
    return new Response('Forbidden', { status: 403 })
  }
  // Return data
}, { requireAuth: true })
```

## 📋 Permission Categories

```typescript
const permissionCategories = {
  'Project Management': [
    'create_projects',
    'edit_projects', 
    'delete_projects',
    'view_all_projects',
    'assign_team_members'
  ],
  'Financial': [
    'view_project_costs',
    'view_profit_margins',
    'edit_budgets',
    'approve_expenses',
    'view_financial_reports'
  ],
  'Shop Drawings': [
    'create_shop_drawings',
    'internal_review_drawings',
    'submit_to_client',
    'review_submitted_drawings'
  ],
  'Scope Management': [
    'create_scope_items',
    'edit_scope_items',
    'delete_scope_items',
    'assign_subcontractors',
    'import_export_excel'
  ],
  'Material Specs': [
    'create_material_specs',
    'approve_material_specs',
    'reject_material_specs',
    'request_revisions'
  ],
  'Administration': [
    'admin_panel_access',
    'manage_users',
    'manage_permissions',
    'view_audit_logs',
    'manage_templates'
  ]
}
```

## 🎨 Permission Templates

Pre-built permission sets that admins can apply:

- **Project Manager**: Full project control, financial visibility, team management
- **Senior Architect**: Drawing management, material specs, internal reviews
- **Site Supervisor**: Scope management, task assignment, QC/punch lists
- **Client Access**: View assigned projects, review drawings, view milestones
- **Subcontractor**: View assigned scope, update task status, upload documents
- **Admin**: Full system access including user management

## 💡 Key Benefits

1. **Ultimate Flexibility** - Every company can customize permissions exactly to their needs
2. **No Code Changes** - Admins manage everything through UI
3. **Same Title, Different Access** - "Project Manager" can mean different things per company
4. **Granular Control** - Permission-level control, not role-level
5. **Easy Auditing** - Complete trail of who changed what permissions when

## 🚀 Implementation

### usePermissions Hook (Simple!)
```tsx
export const usePermissions = () => {
  const { profile } = useAuth()
  
  const hasPermission = (permission: string) => {
    return profile?.permissions?.includes(permission) || false
  }
  
  const hasAnyPermission = (permissions: string[]) => {
    return permissions.some(p => hasPermission(p))
  }
  
  const hasAllPermissions = (permissions: string[]) => {
    return permissions.every(p => hasPermission(p))
  }
  
  return { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions,
    permissions: profile?.permissions || []
  }
}
```

## 🔄 Migration from V2

V2's complex role system (13 roles) maps to simple permissions:
- `owner` → Gets all permissions
- `admin` → Gets admin permissions subset  
- `project_manager` → Gets PM permission template
- etc.

But after migration, admins can customize each user individually!

---

*Last Updated: January 2025*
*Status: Core Innovation Ready*
*Next Step: UI/UX Project Workspace Pattern*