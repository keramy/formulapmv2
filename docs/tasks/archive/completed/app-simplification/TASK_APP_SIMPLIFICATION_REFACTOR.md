# Task: Simplify Formula PM Application

## Type: Refactoring
**Priority**: High
**Effort**: 3-4 days  
**Subagents**: 4
**Approach**: Incremental

## Request Analysis
**Original Request**: "read this file C:\Users\Kerem\Desktop\formulapmv2\simplfyapp.md . We will simplfy our app. Then we will fix the issues permanently.If feature is needed we will add in future."
**Objective**: Refactor Formula PM into a simpler, more maintainable application focusing on core user journeys
**Over-Engineering Check**: Removing complex features (purchase, subcontractor) to focus on essential project management

## Subagent Assignments

### Wave 1: Foundation
#### Subagent 1: ui-enhance - Layout Foundation
```
TASK_NAME: build_core_layout_foundation
TASK_GOAL: Create new sidebar/header layout system as per Phase 1 of simplification plan
REQUIREMENTS:
1. Create Sidebar component at src/components/layouts/Sidebar.tsx with fixed dark navigation
2. Create Header component at src/components/layouts/Header.tsx with page title and user menu
3. Update root layout at src/app/layout.tsx to integrate new components
4. Ensure responsive design and proper styling with shadcn/ui
5. Compilation must pass with no TypeScript errors
CONSTRAINTS:
- DO NOT break existing authentication flow
- AVOID modifying any business logic
- Use existing shadcn/ui components where possible
DEPENDENCIES: None
```

### Wave 2: Owner Dashboard
#### Subagent 2: code - Simplified Owner View
```
TASK_NAME: implement_owner_dashboard
TASK_GOAL: Build simplified owner dashboard with high-level analytics as per Phase 2
REQUIREMENTS:
1. Modify src/app/dashboard/page.tsx for owner dashboard layout
2. Create GlobalStatsCards component showing active projects, budget, approvals, at-risk projects
3. Create ProjectsOverview component with project list and status visualization
4. Create CompanyActivityFeed component for real-time activity feed
5. Ensure all data fetches from existing Supabase tables
6. TypeScript compilation must pass
CONSTRAINTS:
- DO NOT create new database tables
- AVOID complex state management
- Use existing API routes where possible
DEPENDENCIES: build_core_layout_foundation
```

### Wave 3: Project Management
#### Subagent 3: code - Project Workspace Implementation
```
TASK_NAME: create_project_workspace
TASK_GOAL: Implement tabbed project management interface as per Phase 3
REQUIREMENTS:
1. Create project list page at src/app/projects/page.tsx
2. Create dynamic project workspace at src/app/projects/[id]/page.tsx
3. Implement TabbedWorkspace component with Overview, Scope List, Shop Drawings, Material Specs, Reports tabs
4. Create individual tab components in src/components/projects/tabs/
5. Ensure navigation between project list and workspace works
6. All components must compile without errors
CONSTRAINTS:
- DO NOT implement complex features - keep tabs simple
- AVOID creating new API endpoints initially
- Focus on read-only views first
DEPENDENCIES: implement_owner_dashboard
```

### Wave 4: New Feature & Cleanup
#### Subagent 4: code - Suppliers Feature & Deprecation
```
TASK_NAME: add_suppliers_remove_old_features
TASK_GOAL: Add suppliers management feature and remove deprecated modules as per Phase 5
REQUIREMENTS:
1. Create Suppliers feature allowing supplier creation with information
2. Add ability to assign suppliers to scope list items
3. Show supplier assignments and total payments per supplier
4. Remove all purchase department components and routes
5. Remove all subcontractor features and components
6. Update navigation to remove deprecated links
7. Ensure no broken imports after removal
CONSTRAINTS:
- DO NOT delete authentication or core user management
- AVOID breaking existing project/scope functionality
- Preserve all user data in database
DEPENDENCIES: create_project_workspace
```

## Technical Details
**Files to modify**: 
- src/app/layout.tsx (new layout integration)
- src/app/dashboard/page.tsx (owner dashboard)
- src/app/projects/* (new project pages)
- src/components/layouts/* (new layout components)
- src/components/dashboard/owner/* (new dashboard components)
- src/components/projects/* (new project components)

**Files to remove**:
- src/components/purchase/* (entire directory)
- src/components/subcontractor-access/* (entire directory)
- src/app/api/subcontractor/* (API routes)
- src/app/api/purchase/* (API routes)

**Patterns to use**: 
- Component composition for layout
- Tab navigation pattern for workspace
- List/detail pattern for projects

## Success Criteria
- Clean, modern UI with sidebar/header layout matching target design
- Simplified owner dashboard showing only essential metrics
- Functional project workspace with tabbed interface
- Suppliers feature working with scope assignments
- All purchase/subcontractor code removed
- Zero TypeScript compilation errors
- Existing authentication still works

## Status Tracking (For Coordinator)

### Wave 1: Foundation
- [ ] Subagent 1: build_core_layout_foundation - Status: ⟳ IN_PROGRESS | 📊 AWAITING_EVALUATION | ✓ APPROVED | 🔄 RE-DELEGATED
  - Score: __/100 | Notes: ____________

### Wave 2: Owner Dashboard  
- [ ] Subagent 2: implement_owner_dashboard - Status: ⟳ IN_PROGRESS | 📊 AWAITING_EVALUATION | ✓ APPROVED | 🔄 RE-DELEGATED
  - Score: __/100 | Notes: ____________

### Wave 3: Project Management
- [ ] Subagent 3: create_project_workspace - Status: ⟳ IN_PROGRESS | 📊 AWAITING_EVALUATION | ✓ APPROVED | 🔄 RE-DELEGATED
  - Score: __/100 | Notes: ____________

### Wave 4: New Feature & Cleanup
- [ ] Subagent 4: add_suppliers_remove_old_features - Status: ⟳ IN_PROGRESS | 📊 AWAITING_EVALUATION | ✓ APPROVED | 🔄 RE-DELEGATED
  - Score: __/100 | Notes: ____________

### Overall Progress
- **Progress**: ___% (0/4 tasks approved)
- **Blocked**: 0
- **Re-delegated**: 0
- **Current Wave**: 1
- **Next Action**: Start Wave 1 Foundation

### Decisions Made
- [Phased Approach]: Incremental implementation to ensure each phase works before proceeding
- [Feature Removal]: Remove purchase/subcontractor features to reduce complexity
- [Suppliers Addition]: Add suppliers as simpler alternative to complex subcontractor system