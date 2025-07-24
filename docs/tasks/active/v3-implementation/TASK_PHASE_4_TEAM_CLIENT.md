# Task: Phase 4 - Team Management & Client Features

## Type: New Feature
**Priority**: High
**Effort**: 1 week  
**Subagents**: 1 (focused on user experience)
**Approach**: Incremental

## Request Analysis
**Original Request**: "Implement project team management and client portal with secure access"
**Objective**: Complete user management features and external client access
**Over-Engineering Check**: Using role-based security from Phase 1, minimal new infrastructure

## Subagent Assignment

### Week 6: Team & Client Implementation

#### Subagent F: User Experience Specialist
```
TASK_NAME: TEAM_CLIENT_FEATURES_IMPLEMENTATION
TASK_GOAL: Complete team management system and secure client portal
REQUIREMENTS:
1. Create project team management:
   - Build project_members table
   - Implement team assignment interface
   - Create role management within projects
   - Add workload distribution tracking
   - Build team performance metrics
   - Implement team notifications
2. Develop client portal:
   - Create client_dashboard_access table
   - Build read-only project views for clients
   - Implement secure client authentication
   - Create client-specific navigation
   - Build progress visibility features
   - Add document sharing for clients
3. Implement communication system:
   - Client messaging interface
   - Project updates feed
   - Comment restrictions for clients
   - Email notification system
4. Complete navigation integration:
   - Add all features to main navigation
   - Implement role-based menu visibility
   - Create quick access shortcuts
   - Build breadcrumb navigation
5. Optimize mobile experience:
   - Responsive design for all new features
   - Touch-friendly interfaces
   - Mobile-specific navigation
   - Performance optimization for mobile
6. Enhance user experience:
   - Consistent loading states
   - Error handling improvements
   - Success feedback animations
   - Tooltip help system
7. Ensure compilation: npm run build && npm run type-check
CONSTRAINTS:
- Client access must be read-only
- Use existing authentication system
- Follow established security patterns
- Maintain performance targets
- Ensure mobile responsiveness
DEPENDENCIES:
- All previous phases completed
- Client role properly configured
- Email service configured
OUTPUT_ARTIFACTS:
- Team management system
- Client portal interface
- Navigation components
- Mobile-optimized views
- Communication features
```

## Technical Details

### Database Schema Implementation

```sql
-- Team Management Table
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id),
  role_in_project TEXT NOT NULL CHECK (role_in_project IN (
    'project_lead', 'team_member', 'reviewer', 'observer'
  )),
  responsibilities TEXT[],
  allocation_percentage INTEGER DEFAULT 100 CHECK (
    allocation_percentage >= 0 AND allocation_percentage <= 100
  ),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by UUID REFERENCES user_profiles(id),
  is_active BOOLEAN DEFAULT true,
  removed_at TIMESTAMP,
  removed_by UUID REFERENCES user_profiles(id),
  UNIQUE(project_id, user_id)
);

-- Client Access Control Table
CREATE TABLE client_dashboard_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES user_profiles(id),
  project_id UUID REFERENCES projects(id),
  access_level TEXT DEFAULT 'read_only' CHECK (access_level IN (
    'read_only', 'comment_only', 'limited_edit'
  )),
  access_scope JSONB DEFAULT '{}', -- Specific sections/features
  granted_by UUID REFERENCES user_profiles(id),
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  last_accessed TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(client_id, project_id)
);

-- Client Communication Table
CREATE TABLE client_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  sender_id UUID REFERENCES user_profiles(id),
  recipient_id UUID REFERENCES user_profiles(id),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_project_members_user ON project_members(user_id);
CREATE INDEX idx_client_access_client ON client_dashboard_access(client_id);
CREATE INDEX idx_client_messages_recipient ON client_messages(recipient_id);
```

### Team Management Implementation

```typescript
// Team Assignment Component
export function TeamAssignment({ projectId }: { projectId: string }) {
  const { data: availableUsers } = useAvailableTeamMembers();
  const { data: currentTeam } = useProjectTeam(projectId);
  
  const assignTeamMember = async (userId: string, role: string) => {
    const result = await fetch('/api/projects/team', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAccessToken()}`
      },
      body: JSON.stringify({
        project_id: projectId,
        user_id: userId,
        role_in_project: role,
        allocation_percentage: 100
      })
    });
    
    if (result.ok) {
      toast.success('Team member assigned successfully');
      mutate(`/api/projects/${projectId}/team`);
    }
  };
  
  return (
    <div className="space-y-6">
      <CurrentTeamList 
        team={currentTeam}
        onRemove={handleRemove}
        onRoleChange={handleRoleChange}
      />
      
      <AvailableUsersList
        users={availableUsers}
        onAssign={assignTeamMember}
        currentTeam={currentTeam}
      />
      
      <WorkloadChart
        team={currentTeam}
        showAllocation={true}
      />
    </div>
  );
}

// Team Performance Metrics
export function TeamMetrics({ projectId }: { projectId: string }) {
  const { data: metrics } = useTeamMetrics(projectId);
  
  return (
    <MetricsGrid>
      <MetricCard
        title="Team Utilization"
        value={metrics?.avgUtilization}
        format="percentage"
        target={85}
      />
      <MetricCard
        title="Tasks Completed"
        value={metrics?.tasksCompleted}
        total={metrics?.totalTasks}
        trend="up"
      />
      <MetricCard
        title="On-Time Delivery"
        value={metrics?.onTimePercentage}
        format="percentage"
        status={metrics?.onTimePercentage > 90 ? 'success' : 'warning'}
      />
      <TeamActivityFeed
        activities={metrics?.recentActivities}
        limit={10}
      />
    </MetricsGrid>
  );
}
```

### Client Portal Implementation

```typescript
// Client Dashboard Layout
export function ClientDashboard() {
  const { user, profile } = useAuth();
  const { data: projects } = useClientProjects();
  
  // Ensure client role
  if (profile?.role !== 'client') {
    return <AccessDenied />;
  }
  
  return (
    <ClientLayout>
      <ClientHeader user={user} />
      
      <ProjectSelector
        projects={projects}
        onChange={setActiveProject}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProjectProgress 
            projectId={activeProject}
            viewMode="client"
          />
          <MilestoneTimeline
            projectId={activeProject}
            interactive={false}
          />
        </div>
        
        <div className="space-y-6">
          <DocumentsPanel
            projectId={activeProject}
            clientView={true}
          />
          <MessagesWidget
            projectId={activeProject}
            recipientOnly={true}
          />
        </div>
      </div>
    </ClientLayout>
  );
}

// Client Access API
export const GET = withAuth(async (request, { user, profile }) => {
  // Ensure client role
  if (profile.role !== 'client') {
    return createErrorResponse('Access denied', 403);
  }
  
  // Get only projects with explicit access
  const { data: access } = await supabase
    .from('client_dashboard_access')
    .select(`
      project_id,
      access_level,
      access_scope,
      project:projects(
        id,
        name,
        status,
        progress_percentage,
        start_date,
        end_date
      )
    `)
    .eq('client_id', user.id)
    .eq('is_active', true);
  
  return createSuccessResponse(access);
}, { permission: 'client.view' });
```

### Navigation Integration

```typescript
// Role-Based Navigation Component
export function MainNavigation() {
  const { profile } = useAuth();
  const navigation = getNavigationItems(profile?.role);
  
  return (
    <nav className="flex-1">
      {navigation.map((section) => (
        <NavSection key={section.id}>
          <NavSectionTitle>{section.title}</NavSectionTitle>
          {section.items.map((item) => (
            <NavItem
              key={item.id}
              href={item.href}
              icon={item.icon}
              badge={item.badge}
              active={isActive(item.href)}
            >
              {item.label}
            </NavItem>
          ))}
        </NavSection>
      ))}
    </nav>
  );
}

// Navigation Configuration
function getNavigationItems(role: string) {
  const baseItems = [
    {
      id: 'projects',
      title: 'Projects',
      items: [
        { id: 'overview', label: 'Overview', href: '/projects', icon: FolderIcon },
        { id: 'milestones', label: 'Milestones', href: '/milestones', icon: FlagIcon }
      ]
    }
  ];
  
  // Add role-specific items
  if (['management', 'project_manager'].includes(role)) {
    baseItems.push({
      id: 'team',
      title: 'Team Management',
      items: [
        { id: 'members', label: 'Team Members', href: '/team', icon: UsersIcon },
        { id: 'workload', label: 'Workload', href: '/team/workload', icon: ChartIcon },
        { id: 'performance', label: 'Performance', href: '/team/performance', icon: TrendingUpIcon }
      ]
    });
  }
  
  if (role === 'client') {
    return [{
      id: 'client',
      title: 'My Projects',
      items: [
        { id: 'dashboard', label: 'Dashboard', href: '/client/dashboard', icon: HomeIcon },
        { id: 'progress', label: 'Progress', href: '/client/progress', icon: ChartIcon },
        { id: 'documents', label: 'Documents', href: '/client/documents', icon: DocumentIcon },
        { id: 'messages', label: 'Messages', href: '/client/messages', icon: InboxIcon }
      ]
    }];
  }
  
  return baseItems;
}
```

### Mobile Optimization

```typescript
// Mobile-First Components
export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <MobileHeader>
        <MenuButton onClick={() => setIsOpen(true)} />
        <Logo className="h-8" />
        <NotificationBell />
      </MobileHeader>
      
      <MobileDrawer open={isOpen} onClose={() => setIsOpen(false)}>
        <MainNavigation mobile={true} />
      </MobileDrawer>
    </>
  );
}

// Touch-Optimized Components
export function TouchFriendlyCard({ children, onClick }: CardProps) {
  return (
    <motion.div
      className="p-4 bg-white rounded-lg shadow-sm"
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{ minHeight: '44px' }} // iOS touch target size
    >
      {children}
    </motion.div>
  );
}
```

## Success Criteria

### Team Management Features
- [ ] Team assignment interface working
- [ ] Multiple team members per project
- [ ] Role management within projects
- [ ] Workload tracking accurate
- [ ] Performance metrics calculating
- [ ] Team notifications functional

### Client Portal Features
- [ ] Client login working correctly
- [ ] Read-only access enforced
- [ ] Project progress visible
- [ ] Documents accessible
- [ ] Messaging system functional
- [ ] Client isolation verified

### Navigation & UX
- [ ] All features in navigation
- [ ] Role-based visibility working
- [ ] Mobile navigation functional
- [ ] Responsive on all devices
- [ ] Loading states consistent
- [ ] Error handling graceful

### Performance Targets
- [ ] Page load under 2 seconds
- [ ] Mobile performance optimized
- [ ] Navigation instant (<100ms)
- [ ] Search results fast (<500ms)
- [ ] No layout shifts (CLS = 0)

## Risk Management

### Security Risks
- **Risk**: Client accessing unauthorized data
- **Mitigation**: Strict RLS policies, regular security audits

### UX Risks
- **Risk**: Complex navigation confusing users
- **Mitigation**: User testing, progressive disclosure, help tooltips

### Performance Risks
- **Risk**: Mobile performance degradation
- **Mitigation**: Code splitting, lazy loading, image optimization

## Status Tracking (For Coordinator)

### Daily Progress
- [ ] Day 1: Database schema and API setup
- [ ] Day 2: Team management UI
- [ ] Day 3: Client portal foundation
- [ ] Day 4: Navigation integration
- [ ] Day 5: Mobile optimization
- [ ] Day 6: Communication features
- [ ] Day 7: Testing and polish

### Feature Completion
- Team Management: ___% complete
- Client Portal: ___% complete
- Navigation: ___% complete
- Mobile Experience: ___% complete
- Communication: ___% complete

### Subagent Status
- [ ] Subagent F: User Experience - Status: ⟳ IN_PROGRESS | 📊 AWAITING_EVALUATION | ✓ APPROVED | 🔄 RE-DELEGATED
  - Score: __/100 | Notes: ____________

### Quality Metrics
- Accessibility Score: ___/100
- Mobile Performance: ___/100
- User Testing Feedback: ___/5
- Bug Count: ___

### Phase Completion Criteria
- [ ] Team management fully functional
- [ ] Client portal secure and working
- [ ] Navigation complete and intuitive
- [ ] Mobile experience optimized
- [ ] All security tests passing
- [ ] Performance targets met
- [ ] User acceptance testing passed
- [ ] Documentation updated