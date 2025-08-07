# Formula PM V3 - Project Context for Claude

## 🚨 CRITICAL CONTEXT

### Project Vision
Formula PM V3 is a **complete rebuild** of v2 focusing on:
- **SIMPLICITY** over complexity (v2 had 448-line useAuth hook!)
- **FLEXIBLE PERMISSIONS** - Admin-configurable without code changes
- **FAST NAVIGATION** - < 500ms between pages
- **CONSTRUCTION-FOCUSED** - Built for real construction workflows
- **MOBILE-FIRST** - Field workers are primary users

### What We're Keeping from V2
- ✅ **Database schema** - It's excellent, keep all migrations
- ✅ **Core business logic** - Scope management, project workflows
- ✅ **Performance optimizations** - RLS policies, indexes
- ✅ **Excel import/export** - Working logic, new UI

### What We're Rebuilding
- ❌ **Authentication system** - 448-line hook → Multiple 30-line hooks
- ❌ **UI components** - Complex abstractions → Simple Shadcn/ui
- ❌ **Permission system** - Fixed roles → Dynamic permission arrays
- ❌ **Navigation** - Slow routing → Fast tabbed workspace

## 🏗️ Architecture Decisions

### Tech Stack (FINAL)
- **Framework**: Next.js 15 with App Router
- **Database**: Supabase PostgreSQL (keep v2 schema)
- **Styling**: Tailwind CSS + Shadcn/ui
- **Language**: TypeScript throughout
- **Data**: @tanstack/react-query for caching
- **Forms**: react-hook-form + zod
- **Charts**: recharts (Gantt, timelines)
- **Files**: react-dropzone, xlsx/exceljs
- **Deployment**: Vercel (primary)

### Core Innovation: Dynamic Permission System
```typescript
// NO MORE FIXED ROLES!
user_profile {
  job_title: "Project Manager"  // Just descriptive text
  permissions: [               // Real access control
    "create_projects",
    "view_project_costs", 
    "internal_review_drawings"
  ]
}

// Usage in components
const { hasPermission } = usePermissions()
{hasPermission('view_project_costs') && <BudgetInfo />}
```

## 📋 Complete Feature List (AGREED)

### Core Features (v3.0)
1. **Dashboard** - Role-specific dashboards
2. **Projects** - Project workspace foundation
3. **Scope Management** - With subcontractor assignments + Excel import/export
4. **Shop Drawings** - Complete approval workflow
5. **Material Specs** - Approval workflow
6. **Tasks** - Task management with comments
7. **Timeline/Gantt** - Visual timeline creation
8. **Milestones** - Project milestone tracking
9. **RFIs** - Request for Information workflow
10. **Change Orders** - Change order workflow (internal + client approval)
11. **QC/Punch Lists** - Quality control tracking
12. **Subcontractors/Suppliers** - Manage and assign
13. **Clients** - Client portal access
14. **Notifications** - Workflow notifications
15. **Activity Logs** - Complete audit trail
16. **Reports** - Project reports
17. **Admin Panel** - User and permission management

### Future (v3.1+)
- Invoicing/Billing
- Purchase Orders

### NOT Building
- Labor/timesheet tracking
- Safety/incidents
- Equipment management
- Offline mode
- Complex integrations

## 🎨 UI/UX Pattern (FINALIZED)

### Smart Navigation System
```
┌────────────────────────────────────────────────┐
│ 🏗️ Project: Downtown Office Complex           │
├────────────────────────────────────────────────┤
│ [Overview] [Scope] [Drawings] [Tasks] [More ▼] │
└────────────────────────────────────────────────┘
```

**More dropdown contains**: Materials, Milestones, RFIs, Change Orders, QC/Punch Lists, Documents, Reports

**Customizable**: Users can pin frequently used tabs to main bar

### URL Structure
```
/projects/[id]              # Project workspace
/projects/[id]/scope        # Scope items
/projects/[id]/drawings     # Shop drawings  
/projects/[id]/materials    # Material specs
/projects/[id]/timeline     # Gantt chart
/projects/[id]/rfis         # RFIs
/projects/[id]/change-orders # Change orders
... etc
```

## 🔐 Authentication (SIMPLIFIED)

### Multiple Focused Hooks (< 50 lines each)
```typescript
// useAuth.ts (30 lines max)
const useAuth = () => {
  // Basic auth state only
  return { user, profile, loading, isAuthenticated }
}

// usePermissions.ts (20 lines) 
const usePermissions = () => {
  const { profile } = useAuth()
  const hasPermission = (perm) => profile?.permissions?.includes(perm)
  return { hasPermission }
}

// useAuthActions.ts (25 lines)
const useAuthActions = () => {
  return { signIn, signOut } // Actions only
}
```

### API Route Protection
```typescript
export const GET = withAuth(async (request, { user, profile }) => {
  // Handler code
}, { 
  requireAuth: true,
  permission: 'view_projects' 
})
```

## 🔄 Workflows (APPROVED)

### Two Main Workflows
1. **Shop Drawings**: Draft → Internal Review → Client Review → Approved
2. **Change Orders**: Draft → Internal Review → Client Review → Approved → Implemented

**Key Pattern**: Permission-based actions at each workflow stage

## 🛡️ Admin Panel (CORE FEATURES)

### Essential Admin Features (v3.0)
1. **User Management** - Add/edit/deactivate users
2. **Visual Permission Editor** - Checkboxes by category
3. **Permission Templates** - Pre-built permission sets
4. **Basic Audit Log** - Track permission changes
5. **Company Settings** - Basic company info

## 📅 8-Week Implementation Timeline

**Week 1-2**: Foundation (Next.js setup, database, auth)
**Week 3-4**: Core features (projects, scope, tasks, drawings)
**Week 5**: Advanced features (workflows, timelines, RFIs)
**Week 6**: Admin panel (user/permission management)  
**Week 7**: Polish (mobile, performance, testing)
**Week 8**: Deployment (Vercel, production launch)

## 🔍 Development Principles

### DO's ✅
- Keep functions under 50 lines
- Use permissions for UI filtering, not route blocking
- Reference v2 patterns, improve with modern tools
- Build mobile-first for construction sites
- Use React Query for all data fetching

### DON'Ts ❌
- Don't recreate v2's over-engineering
- Don't block routes (slows navigation)
- Don't build generic features - construction-focused only
- Don't add "nice to have" features in v3.0
- Don't ignore mobile experience

## 📁 Files to Copy from V2

### Database
```
supabase/migrations/        # All existing migrations
supabase/seed.sql          # Test data
```

### Code Patterns (Reference, Don't Copy)
```
src/types/                 # TypeScript interfaces (adapt)
src/lib/supabase/         # Client setup patterns
Excel import/export logic  # Working logic (new UI)
Scope management patterns  # Business logic patterns
```

## 🎯 Success Metrics

- **Performance**: Navigation < 500ms, load < 2s
- **Simplicity**: No function > 50 lines
- **Flexibility**: Admins manage permissions without developers
- **Completeness**: All v2 functionality preserved
- **Mobile**: Works with work gloves on tablets

## 💡 Key Reminders for Development

1. **Start Simple**: Build core functionality first, polish later
2. **Reference V2**: Copy working patterns, improve implementation  
3. **Permission-First**: Every UI element should check permissions
4. **Mobile-Ready**: Test on tablets, optimize for touch
5. **Performance**: Use React Query, optimize database queries
6. **Document**: Update this file as decisions change

---

**Last Updated**: January 2025
**Status**: Ready to Build
**Next**: Set up Next.js 15 project and copy v2 database