# Formula PM Dashboard Implementation Pattern

## Overview
Comprehensive role-based dashboard system for Formula PM 2.0 Wave 2, featuring adaptive UI, project overview, and real-time statistics based on user permissions and roles.

## Architecture

### Component Structure
```
/src/app/dashboard/
├── page.tsx              # Main dashboard page with auth checks
├── loading.tsx           # Loading state component
├── error.tsx            # Error boundary component
└── components/
    ├── DashboardContent.tsx    # Main dashboard content orchestrator
    ├── DashboardSkeleton.tsx   # Loading skeleton component
    ├── DashboardStats.tsx      # Statistics cards with role filtering
    ├── ProjectOverview.tsx     # Role-based project listings
    ├── TaskSummary.tsx         # Scope items displayed as tasks
    ├── RecentActivity.tsx      # Activity timeline
    └── QuickActions.tsx        # Role-specific action buttons
```

### Role-Based Dashboard Features

#### Management Roles (Admin, General Manager, Company Owner)
- **Full Project Access**: View all projects across organization
- **Comprehensive Statistics**: Team metrics, financial data, budget overview
- **System Administration**: User management, settings access
- **Financial Visibility**: Budget tracking, cost variance, tender values

#### Project Roles (Project Manager, Architect, Technical Engineer)
- **Assigned Projects**: Projects they manage or are assigned to
- **Task Management**: Scope items relevant to their projects
- **Drawing Access**: Shop drawings and technical documents
- **Team Collaboration**: Project-specific team views

#### Purchase Roles (Purchase Director, Purchase Specialist)
- **Procurement Focus**: Supplier management, purchase orders
- **Financial Tracking**: Budget-related metrics
- **Scope Pricing**: Cost tracking and pricing visibility

#### Field Roles (Field Worker, Subcontractor)
- **Task-Focused**: Assigned scope items and progress tracking
- **Limited Visibility**: Only assigned projects and tasks
- **Mobile-Optimized**: Responsive design for field use

#### External Roles (Client)
- **Client Portal View**: Project progress, document approvals
- **Limited Access**: Only client-visible documents and reports

## Implementation Details

### Permission System Integration
```typescript
// Dashboard access control
if (!hasPermission('projects.read.all') && !hasPermission('projects.read.assigned')) {
  return <AccessDenied />
}

// Role-based data filtering
if (!canAccess(['admin', 'project_manager'])) {
  // Filter to assigned projects only
  const { data: memberProjects } = await supabase
    .from('project_assignments')
    .select('project_id')
    .eq('user_id', user.id)
}
```

### Data Fetching Strategy
- **Parallel Queries**: Multiple dashboard components fetch data simultaneously
- **Role-Based Filtering**: Database queries filtered by user permissions
- **Efficient Loading**: Suspense boundaries and skeleton states
- **Real-Time Updates**: Fresh data on each dashboard visit

### Responsive Design
- **Desktop**: Full sidebar navigation with detailed statistics
- **Tablet**: Condensed view with essential information
- **Mobile**: Bottom navigation with quick access to primary features

## Security Considerations

### Permission Validation
- Server-side permission checks in data fetching
- Client-side UI filtering based on user roles
- Row-level security (RLS) enforcement in Supabase

### Data Access Control
```typescript
// Example: Project access validation
const canViewProject = (projectId: string) => {
  if (isManagement()) return true
  return userAssignedProjects.includes(projectId)
}
```

## Performance Optimizations

### Loading Strategies
- **Skeleton Loading**: Immediate visual feedback
- **Progressive Loading**: Critical data first, secondary data async
- **Error Boundaries**: Graceful degradation for failed components

### Database Efficiency
- **Count Queries**: Efficient statistics calculation
- **Selective Fields**: Only fetch required data
- **Indexed Queries**: Optimized for role-based filtering

## Usage Examples

### Dashboard Statistics Component
```typescript
export function DashboardStats() {
  const { hasPermission, canAccess } = usePermissions()
  
  // Role-based statistics
  const statCards = [
    {
      title: 'Active Projects',
      show: hasPermission('projects.read.all') || hasPermission('projects.read.assigned')
    },
    {
      title: 'Team Members',
      show: hasPermission('users.read.all')
    },
    {
      title: 'Total Budget',
      show: hasPermission('financials.view')
    }
  ].filter(card => card.show)
}
```

### Project Overview Component
```typescript
export function ProjectOverview() {
  // Management sees all projects
  // Others see only assigned projects
  const projects = useMemo(() => {
    if (canAccess(['admin', 'project_manager'])) {
      return allProjects
    }
    return assignedProjects
  }, [userRole, allProjects, assignedProjects])
}
```

## Error Handling

### Component-Level Errors
- Error boundaries for each major dashboard section
- Fallback UI for failed data fetching
- Retry mechanisms for network failures

### Permission Errors
- Graceful degradation when permissions change
- Clear messaging for access denied scenarios
- Redirect to appropriate authenticated pages

## Testing Strategy

### Unit Testing
- Component rendering with different user roles
- Permission-based UI visibility
- Data transformation logic

### Integration Testing
- Dashboard data fetching with various user permissions
- Role-based routing and access control
- Responsive design across device sizes

### User Acceptance Testing
- Role-based dashboard functionality
- Performance with realistic data volumes
- Mobile usability for field workers

## Accessibility

### WCAG Compliance
- Semantic HTML structure
- Keyboard navigation support
- Screen reader compatibility
- Color contrast standards

### User Experience
- Clear visual hierarchy
- Consistent navigation patterns
- Intuitive role-based workflows

## Pattern Benefits

### Development Benefits
- **Reusable Components**: Modular dashboard sections
- **Type Safety**: Full TypeScript integration
- **Permission Integration**: Seamless role-based access
- **Performance**: Optimized data fetching and rendering

### Business Benefits
- **Role Clarity**: Clear separation of user capabilities
- **Data Security**: Appropriate information visibility
- **User Efficiency**: Relevant information prioritization
- **Scalability**: Easy addition of new roles and features

## Future Enhancements

### Planned Features
- Real-time notifications and updates
- Customizable dashboard layouts
- Advanced analytics and reporting
- Mobile app integration

### Extensibility Points
- Plugin architecture for custom widgets
- Role-based dashboard customization
- Third-party integrations
- Advanced permission modeling

## Success Metrics

### Technical Metrics
- Dashboard load time under 2 seconds
- Zero permission-related security issues
- 99.9% component rendering success rate
- Mobile responsive design validation

### User Metrics
- Role-appropriate information display
- Efficient task completion workflows
- User satisfaction with role-based features
- Adoption across all user roles

---

This pattern ensures a secure, performant, and user-friendly dashboard that adapts to the diverse needs of Formula PM's 13 distinct user roles while maintaining code quality and development velocity.