# Task: P2.02 - Dashboard Design Enhancement (Owner vs PM)

## Type: Improvement
**Priority**: P2 - Medium Priority (Start after P1 core features provide data)
**Effort**: 3-4 days
**Complexity**: Moderate
**Dependencies**: All P1 tasks (provides real data for dashboards)

## Request Analysis
**Original Request**: Implement role-based dashboard designs with different views for Company Owner vs Project Manager
**Objective**: Create tailored dashboard experiences based on user roles and responsibilities
**Over-Engineering Check**: Focus on core dashboard differentiation - strategic vs operational views, relevant metrics per role

## Technical Requirements

### Database Changes Required
```sql
-- No new tables needed - consumes data from P1 features
-- May need dashboard preferences table for customization

CREATE TABLE user_dashboard_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) NOT NULL,
    dashboard_layout JSONB DEFAULT '{}',
    preferred_widgets JSONB DEFAULT '[]',
    date_range_preference TEXT DEFAULT '30_days',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);
```

### API Endpoints to Create/Enhance
- `GET /api/dashboard/owner` - Company owner dashboard data
- `GET /api/dashboard/pm` - Project manager dashboard data
- `GET /api/dashboard/metrics/company` - Company-wide metrics
- `GET /api/dashboard/metrics/projects` - Project-specific metrics
- `GET /api/dashboard/activities/company` - Company activity feed
- `GET /api/dashboard/activities/projects` - Project activity feed
- `POST /api/dashboard/preferences` - Save dashboard preferences
- `GET /api/dashboard/preferences` - Get user dashboard preferences

### Components to Build/Update

#### Company Owner Dashboard Components
- `src/components/dashboard/owner/OwnerDashboardPage.tsx` - Main owner dashboard
- `src/components/dashboard/owner/GlobalStatsCards.tsx` - Company-wide statistics
- `src/components/dashboard/owner/ProjectsOverview.tsx` - All projects overview
- `src/components/dashboard/owner/CompanyActivityFeed.tsx` - Company-wide activity
- `src/components/dashboard/owner/PerformanceMetrics.tsx` - High-level performance
- `src/components/dashboard/owner/ResourceUtilization.tsx` - Resource overview

#### Project Manager Dashboard Components  
- `src/components/dashboard/pm/PMDashboardPage.tsx` - Main PM dashboard
- `src/components/dashboard/pm/MyProjectsOverview.tsx` - PM's assigned projects
- `src/components/dashboard/pm/MyTasksAndActions.tsx` - PM's tasks and actions
- `src/components/dashboard/pm/RecentProjectActivity.tsx` - Recent project activity
- `src/components/dashboard/pm/CriticalAlerts.tsx` - Important notifications
- `src/components/dashboard/pm/TeamWorkload.tsx` - Team management view

#### Shared Dashboard Components
- `src/components/dashboard/shared/MetricCard.tsx` - Reusable metric display
- `src/components/dashboard/shared/ActivityItem.tsx` - Activity feed item
- `src/components/dashboard/shared/ProjectCard.tsx` - Project overview card
- `src/components/dashboard/shared/QuickActionButton.tsx` - Action buttons

## Implementation Phases

### Phase 1: Dashboard Architecture & Data APIs (Day 1)
**Goal**: Set up dashboard data architecture and API endpoints

**Tasks**:
1. Create dashboard-specific API endpoints
2. Implement role-based data filtering
3. Add dashboard preferences system
4. Create shared dashboard utilities
5. Set up dashboard routing and navigation

**Success Criteria**:
- Dashboard APIs return role-appropriate data
- Data filtering works by user role
- Dashboard preferences can be saved/loaded
- Routing directs users to correct dashboard

### Phase 2: Company Owner Dashboard (Day 2)
**Goal**: Strategic high-level dashboard for company owners

**Tasks**:
1. Build OwnerDashboardPage layout
2. Create GlobalStatsCards with company metrics
3. Implement ProjectsOverview with all projects
4. Add CompanyActivityFeed with system-wide activity
5. Create PerformanceMetrics for high-level KPIs

**Success Criteria**:
- Owner dashboard shows company-wide view
- All projects visible with key metrics
- Activity feed shows relevant company events
- Performance metrics display strategic KPIs

### Phase 3: Project Manager Dashboard (Day 3)
**Goal**: Operational dashboard focused on PM responsibilities

**Tasks**:
1. Build PMDashboardPage layout
2. Create MyProjectsOverview with assigned projects
3. Implement MyTasksAndActions from P1.01 data
4. Add RecentProjectActivity for relevant projects
5. Create CriticalAlerts for urgent items

**Success Criteria**:
- PM dashboard shows assigned projects only
- Tasks and actions relevant to PM displayed
- Activity feed filtered to PM's projects
- Critical alerts highlight urgent items

### Phase 4: Dashboard Data Integration (Day 4)
**Goal**: Connect dashboards to real data from P1 features

**Tasks**:
1. Integrate task data from P1.01 (Task Management)
2. Add milestone data from P1.02 (Milestones)
3. Include shop drawing metrics from P1.03
4. Show material approval status from P1.04
5. Display report metrics from P1.05

**Success Criteria**:
- All dashboard metrics use real data
- No mock data remains in dashboard components
- Data updates reflect real system changes
- Performance acceptable with real data loads

## Technical Implementation Details

### Dashboard Role Routing
```typescript
// Route users to appropriate dashboard based on role
function getDashboardRoute(userRole: UserRole): string {
  switch (userRole) {
    case 'company_owner':
    case 'general_manager':
      return '/dashboard/owner';
    case 'project_manager':
    case 'assistant_pm':
      return '/dashboard/pm';
    default:
      return '/dashboard/default';
  }
}
```

### Owner Dashboard Metrics
```typescript
interface OwnerDashboardData {
  globalStats: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalRevenue: number;
    pendingApprovals: number;
    resourceUtilization: number;
  };
  projectOverview: ProjectSummary[];
  companyActivity: ActivityItem[];
  performanceMetrics: KPIMetric[];
}
```

### PM Dashboard Metrics
```typescript
interface PMDashboardData {
  myProjects: ProjectSummary[];
  myTasks: TaskSummary[];
  recentActivity: ActivityItem[];
  criticalAlerts: AlertItem[];
  teamWorkload: TeamMember[];
  upcomingDeadlines: Milestone[];
}
```

### Permission Requirements
- `dashboard.owner.view` - Access company owner dashboard
- `dashboard.pm.view` - Access project manager dashboard
- `dashboard.metrics.company` - View company-wide metrics
- `dashboard.metrics.projects` - View project-specific metrics
- `dashboard.preferences.update` - Save dashboard preferences

### Files to Create
**New Files**:
- `supabase/migrations/20250708000008_dashboard_preferences.sql`
- `src/app/dashboard/owner/page.tsx` - Owner dashboard page
- `src/app/dashboard/pm/page.tsx` - PM dashboard page
- `src/app/api/dashboard/owner/route.ts`
- `src/app/api/dashboard/pm/route.ts`
- `src/app/api/dashboard/metrics/company/route.ts`
- `src/app/api/dashboard/metrics/projects/route.ts`
- `src/app/api/dashboard/preferences/route.ts`
- `src/components/dashboard/owner/OwnerDashboardPage.tsx`
- `src/components/dashboard/owner/GlobalStatsCards.tsx`
- `src/components/dashboard/owner/ProjectsOverview.tsx`
- `src/components/dashboard/owner/CompanyActivityFeed.tsx`
- `src/components/dashboard/pm/PMDashboardPage.tsx`
- `src/components/dashboard/pm/MyProjectsOverview.tsx`
- `src/components/dashboard/pm/MyTasksAndActions.tsx`
- `src/components/dashboard/pm/RecentProjectActivity.tsx`
- `src/components/dashboard/pm/CriticalAlerts.tsx`
- `src/components/dashboard/shared/MetricCard.tsx`
- `src/lib/dashboard/role-routing.ts`
- `src/types/dashboard.ts`

**Modified Files**:
- `src/app/dashboard/page.tsx` (add role-based routing)
- `src/components/layouts/Sidebar.tsx` (role-based navigation)
- `src/middleware.ts` (dashboard access control)

## Success Criteria
- [ ] Role-based dashboard routing works correctly
- [ ] Company owner dashboard shows strategic view
- [ ] Project manager dashboard shows operational view
- [ ] All dashboard metrics use real data from P1 features
- [ ] Dashboard preferences save and load properly
- [ ] Mobile responsive dashboard designs
- [ ] All TypeScript compilation passes: `npm run type-check`
- [ ] All tests pass: `npm test`
- [ ] Performance acceptable with real data loads

## Integration Points
- **Task Management (P1.01)**: Show tasks in PM dashboard
- **Milestones (P1.02)**: Display upcoming milestones and progress
- **Shop Drawings (P1.03)**: Show approval metrics and pending reviews
- **Materials (P1.04)**: Display material approval status
- **Reports (P1.05)**: Show recent reports and sharing metrics
- **Team Management (P2.01)**: Display team allocation and workload

## Business Value
- **Company Owners**: Strategic oversight of entire operation
- **Project Managers**: Focused operational dashboard for efficiency
- **Decision Making**: Role-appropriate information for better decisions
- **Productivity**: Faster access to relevant information
- **User Experience**: Tailored interface reduces cognitive load

## Design Principles

### Owner Dashboard Focus
- **Strategic View**: High-level metrics and trends
- **Company-Wide**: All projects and overall performance
- **Financial Focus**: Revenue, profitability, resource utilization
- **Exception Reporting**: Issues requiring owner attention

### PM Dashboard Focus
- **Operational View**: Day-to-day project management
- **Project-Specific**: Only assigned projects and teams
- **Task-Oriented**: Actionable items and immediate priorities
- **Team Management**: Direct reports and team performance

## Risk Mitigation
- **Risk**: Complex dashboard routing logic
  **Mitigation**: Simple role-based routing with fallbacks
- **Risk**: Performance with real-time data
  **Mitigation**: Cached metrics with periodic updates
- **Risk**: Dashboard customization complexity
  **Mitigation**: Start with fixed layouts, add customization later

## Future Enhancements (Post-P2)
- Customizable dashboard widgets and layouts
- Real-time data updates with WebSockets
- Dashboard themes and personalization
- Advanced analytics and reporting widgets
- Mobile dashboard applications
- Dashboard sharing and collaboration features

## Status Tracking
- [ ] Phase 1: Dashboard Architecture & APIs - Status: ⟳ PENDING
- [ ] Phase 2: Company Owner Dashboard - Status: ⟳ PENDING
- [ ] Phase 3: Project Manager Dashboard - Status: ⟳ PENDING
- [ ] Phase 4: Dashboard Data Integration - Status: ⟳ PENDING

**Overall Progress**: 0% | **Current Phase**: Not Started | **Blockers**: Requires P1 completion for data | **Start After**: P1 features provide real data