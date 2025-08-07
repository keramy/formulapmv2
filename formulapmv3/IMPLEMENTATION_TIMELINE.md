# Formula PM 3.0 - Detailed Implementation Timeline

## 📋 What We'll Copy from V2

### Database Schema (Keep as-is)
- **Supabase migrations** - Copy all working migrations from v2
- **Core tables** - projects, user_profiles, scope_items, tasks, shop_drawings
- **RLS policies** - Keep optimized policies from v2 
- **Indexes** - All performance optimizations from v2

### Files to Copy & Adapt
```
Copy from V2:
├── supabase/migrations/      # All existing migrations
├── src/types/               # TypeScript interfaces (adapt for permissions)
├── src/lib/supabase/        # Supabase client setup
└── .env.example             # Environment variables template
```

### UI Patterns to Reference
- Scope management patterns
- Excel import/export logic
- Project workspace navigation
- Permission checking patterns

## 🗄️ Database Migration Strategy

### Step 1: Copy V2 Schema + Add V3 Enhancements
```sql
-- New V3 migrations on top of V2 base
-- 20250108000001_add_permissions.sql
ALTER TABLE user_profiles 
ADD COLUMN permissions TEXT[] DEFAULT '{}',
ADD COLUMN job_title TEXT,
ADD COLUMN department TEXT;

-- 20250108000002_permission_templates.sql
CREATE TABLE permission_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  permissions TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20250108000003_audit_logs.sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  performed_by UUID REFERENCES auth.users(id),
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 📅 8-Week Implementation Plan

### Week 1: Foundation (Jan 8-14)
- [ ] Set up Next.js 15 with App Router
- [ ] Copy v2 migrations and apply to new database
- [ ] Create simplified auth hooks (< 50 lines each)
- [ ] Build basic auth middleware for API routes

### Week 2: Core Architecture (Jan 15-21)
- [ ] Project workspace with smart tab navigation
- [ ] React Query setup for data management
- [ ] Shadcn/ui component library setup
- [ ] Basic API routes with permission system

### Week 3-4: Core Features (Jan 22 - Feb 4)
- [ ] Projects and workspace navigation
- [ ] Scope management (copy v2 logic, new UI)
- [ ] Tasks with permission-based actions
- [ ] Shop drawings with basic workflow
- [ ] Excel import/export (adapt v2 logic)

### Week 5: Advanced Features (Feb 5-11)
- [ ] Complete shop drawing workflow
- [ ] Change order workflow
- [ ] Timeline/Gantt implementation
- [ ] RFIs and material specs
- [ ] Workflow history tracking

### Week 6: Admin Panel (Feb 12-18)
- [ ] User management interface
- [ ] Visual permission editor
- [ ] Permission templates system
- [ ] Audit log viewer

### Week 7: Polish (Feb 19-25)
- [ ] Mobile optimization
- [ ] Performance tuning
- [ ] Testing and bug fixes
- [ ] UI/UX refinements

### Week 8: Deployment (Feb 26 - Mar 4)
- [ ] Production deployment to Vercel
- [ ] Database migration scripts
- [ ] User documentation
- [ ] Go-live monitoring

## 🔄 V2 to V3 Migration Strategy

### Permission System Migration
```typescript
const migrateV2RolesToV3Permissions = {
  'owner': getAllPermissions(),
  'admin': [
    'admin_panel_access', 'manage_users', 'manage_permissions',
    'create_projects', 'view_all_projects', 'view_project_costs'
  ],
  'project_manager': [
    'create_projects', 'edit_projects', 'view_project_costs',
    'assign_team_members', 'approve_expenses', 'internal_review_drawings'
  ],
  'architect': [
    'create_shop_drawings', 'internal_review_drawings', 
    'create_material_specs', 'submit_to_client'
  ],
  'client': [
    'view_assigned_projects', 'review_submitted_drawings',
    'view_milestones', 'client_approve_change_orders'
  ]
}
```

## 🎯 Success Criteria

- Navigation speed < 500ms (faster than v2)
- All v2 functionality preserved
- Permission system provides same access as v2 roles
- Mobile-friendly for field workers
- Admin can manage users without developer help

---

*Timeline: 8 weeks starting January 8, 2025*
*Target: Production-ready Formula PM 3.0*