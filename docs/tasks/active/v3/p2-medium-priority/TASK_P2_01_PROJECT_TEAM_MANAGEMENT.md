# Task: P2.01 - Project Team Management System Implementation

## Type: New Feature
**Priority**: P2 - Medium Priority (Start after P1 completion)
**Effort**: 2-3 days
**Complexity**: Simple to Moderate
**Dependencies**: P1.01 (Task Management) for enhanced task assignment

## Request Analysis
**Original Request**: Implement project team management with member assignment and role tracking
**Objective**: Replace mock team member data in OverviewTab with real team management functionality
**Over-Engineering Check**: Focus on core team management - member assignment, role tracking, basic team overview

## Technical Requirements

### Database Changes Required
```sql
-- NEW TABLE: Project team member assignments
CREATE TABLE project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) NOT NULL,
    user_id UUID REFERENCES user_profiles(id) NOT NULL,
    project_role TEXT NOT NULL, -- Role specific to this project
    assigned_at TIMESTAMP DEFAULT NOW(),
    assigned_by UUID REFERENCES user_profiles(id),
    removed_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    hourly_rate NUMERIC, -- Optional billing rate
    notes TEXT,
    UNIQUE(project_id, user_id) -- Prevent duplicate assignments
);

-- Enhanced project assignments table (modify existing if needed)
ALTER TABLE project_assignments 
ADD COLUMN team_lead BOOLEAN DEFAULT FALSE,
ADD COLUMN specialization TEXT,
ADD COLUMN availability_percentage NUMERIC DEFAULT 100;

-- Add project role types
CREATE TYPE project_role_type AS ENUM (
    'project_manager',
    'assistant_pm',
    'site_supervisor',
    'foreman',
    'lead_carpenter',
    'electrician',
    'plumber',
    'specialist',
    'quality_controller',
    'safety_officer'
);
```

### API Endpoints to Create
- `GET /api/projects/:projectId/members` - List project team members
- `POST /api/projects/:projectId/members` - Assign team member to project
- `PUT /api/projects/:projectId/members/:userId` - Update member role/details
- `DELETE /api/projects/:projectId/members/:userId` - Remove team member
- `GET /api/users/available` - Get users available for assignment
- `GET /api/projects/:projectId/team-summary` - Team overview and statistics
- `POST /api/projects/:projectId/members/bulk-assign` - Bulk team assignment

### Components to Build/Update
- `src/components/projects/tabs/TeamTab.tsx` - Main team management interface
- `src/components/team/TeamMemberList.tsx` - Team member display
- `src/components/team/AddTeamMemberForm.tsx` - Add/assign team members
- `src/components/team/TeamMemberCard.tsx` - Individual member display
- `src/components/team/TeamSummaryWidget.tsx` - Team overview widget
- Update `src/components/projects/tabs/OverviewTab.tsx` - Use real team data

## Implementation Phases

### Phase 1: Database & Core API (Day 1)
**Goal**: Database foundation and basic team management operations

**Tasks**:
1. Create migration for project_members table
2. Add project role enum types
3. Implement RLS policies for team data
4. Create basic API routes for team CRUD
5. Add team summary statistics API

**Success Criteria**:
- Database migration runs successfully
- API endpoints return proper responses
- Team member assignment/removal works
- RLS policies secure team data access

### Phase 2: Team Management Interface (Day 2)
**Goal**: User interface for team assignment and management

**Tasks**:
1. Create TeamTab for project workspace
2. Build TeamMemberList with role indicators
3. Implement AddTeamMemberForm with user search
4. Add team member role and rate management
5. Integrate tab into project workspace

**Success Criteria**:
- Team members display in project tabs
- Users can assign new team members
- Role and rate editing works correctly
- User search and selection functions

### Phase 3: Integration & Enhancement (Day 3)
**Goal**: Connect to existing systems and add advanced features

**Tasks**:
1. Update OverviewTab to show real team data
2. Integrate with task assignment (P1.01)
3. Add team workload and availability tracking
4. Create team summary dashboard widget
5. Add team member activity history

**Success Criteria**:
- OverviewTab shows real team member data
- Task assignment shows team members
- Team workload calculations work
- No more mock team data anywhere

## Technical Implementation Details

### Team Member Data Structure
```typescript
interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  user: UserProfile;
  project_role: string;
  assigned_at: Date;
  assigned_by: string;
  is_active: boolean;
  hourly_rate?: number;
  notes?: string;
  specialization?: string;
  availability_percentage: number;
}
```

### Team Summary Calculations
```sql
-- Team summary statistics
SELECT 
  COUNT(*) as total_members,
  COUNT(*) FILTER (WHERE is_active = true) as active_members,
  AVG(availability_percentage) as avg_availability,
  COUNT(DISTINCT project_role) as role_diversity
FROM project_members 
WHERE project_id = $1;
```

### Permission Requirements
- `team.read` - View project team members
- `team.assign` - Assign members to projects
- `team.update` - Update member roles and details
- `team.remove` - Remove members from projects
- `team.rates.view` - View member billing rates
- `team.rates.update` - Update member billing rates

### Files to Create
**New Files**:
- `supabase/migrations/20250708000007_project_team_management.sql`
- `src/app/api/projects/[id]/members/route.ts`
- `src/app/api/projects/[id]/members/[userId]/route.ts`
- `src/app/api/projects/[id]/team-summary/route.ts`
- `src/app/api/users/available/route.ts`
- `src/components/projects/tabs/TeamTab.tsx`
- `src/components/team/TeamMemberList.tsx`
- `src/components/team/AddTeamMemberForm.tsx`
- `src/components/team/TeamMemberCard.tsx`
- `src/components/team/TeamSummaryWidget.tsx`
- `src/types/team.ts`

**Modified Files**:
- `src/components/projects/tabs/OverviewTab.tsx`
- `src/components/projects/TabbedWorkspace.tsx`
- `src/components/tasks/TaskForm.tsx` (add team member assignment)
- `src/lib/permissions.ts`

## Success Criteria
- [ ] Project team database schema created successfully
- [ ] Team member assignment and removal works
- [ ] Team role management functions properly
- [ ] OverviewTab displays real team data
- [ ] Integration with task assignment works
- [ ] Team workload calculations accurate
- [ ] All TypeScript compilation passes: `npm run type-check`
- [ ] All tests pass: `npm test`
- [ ] Mobile responsive team management interface

## Integration Points
- **OverviewTab**: Replace `mockStats.teamMembers` with real data
- **Task Management (P1.01)**: Show team members in task assignment
- **Dashboard**: Display team allocation across projects
- **Reports (P1.05)**: Include team member information in reports
- **Time Tracking**: Foundation for future time tracking features

## Business Value
- **Project Managers**: Clear team composition and role tracking
- **Resource Management**: Visibility into team allocation and availability
- **Cost Control**: Team rate tracking for project budgeting
- **Communication**: Clear team structure and contact information
- **Planning**: Team workload balancing across projects

## Data Flow Example
```typescript
// OverviewTab.tsx - Before (Mock Data)
const mockStats = {
  teamMembers: [
    { name: "John Doe", role: "Project Manager" },
    { name: "Jane Smith", role: "Site Supervisor" }
  ]
}

// OverviewTab.tsx - After (Real Data)
const { data: teamMembers } = await fetch(
  `/api/projects/${projectId}/members`
);
```

## Risk Mitigation
- **Risk**: Complex team hierarchy management
  **Mitigation**: Start with flat team structure, add hierarchy later
- **Risk**: Team member role conflicts
  **Mitigation**: Clear role definitions and validation rules
- **Risk**: Performance with large teams
  **Mitigation**: Pagination and efficient queries

## Future Enhancements (Post-P2)
- Team hierarchy and reporting structures
- Skill matrix and competency tracking
- Team performance metrics and analytics
- Integration with HR systems
- Team calendar and scheduling
- Automated team recommendations based on project needs

## Testing Strategy
- Unit tests for team management CRUD operations
- Integration tests for task assignment integration
- Component tests for team management forms
- API tests for team member workflows
- Performance tests with large team sizes

## Status Tracking
- [ ] Phase 1: Database & Core API - Status: ⟳ PENDING
- [ ] Phase 2: Team Management Interface - Status: ⟳ PENDING
- [ ] Phase 3: Integration & Enhancement - Status: ⟳ PENDING
- [ ] Testing & Validation - Status: ⟳ PENDING

**Overall Progress**: 0% | **Current Phase**: Not Started | **Blockers**: None | **Start After**: P1 tasks completion