# Formula PM 3.0 - UI/UX & Project Workspace Pattern

## 🎨 Project Workspace Pattern

### Smart Navigation System

The project workspace uses a **smart tab system** that adapts to user needs:

```
┌────────────────────────────────────────────────────────────────┐
│ 🏗️ Project: Downtown Office Complex                           │
│ ──────────────────────────────────────────────────────────────│
│                                                                │
│ [Overview] [Scope] [Drawings] [Tasks] [Timeline] [More ▼]     │
│ ─────────────────────────────────────────────────────────     │
│                                                                │
│                   Main Content Area                           │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**More Dropdown Contains:**
- Material Specs
- Milestones  
- RFIs
- Change Orders
- QC/Punch Lists
- Documents
- Reports
- Settings

### URL Structure

```
/dashboard                          # User dashboard
/projects                          # Projects list
/projects/[id]                     # Project overview
/projects/[id]/scope               # Scope items & subcontractors
/projects/[id]/drawings            # Shop drawings
/projects/[id]/tasks               # Task management
/projects/[id]/timeline            # Gantt chart/timeline
/projects/[id]/materials           # Material specifications
/projects/[id]/milestones          # Project milestones
/projects/[id]/rfis                # Request for Information
/projects/[id]/change-orders       # Change order management
/projects/[id]/punch-lists         # QC & punch lists
/projects/[id]/documents           # Document management
/projects/[id]/reports             # Project reports
/projects/[id]/settings            # Project settings
```

### Tab Customization

Users can customize their tab bar:

1. **Default Tabs** (Most Common):
   - Overview, Scope, Drawings, Tasks, Timeline

2. **Pinnable Tabs**:
   - Users can pin frequently used tabs from the "More" menu
   - Pinned tabs appear in the main tab bar
   - Stored per user in their profile

3. **Role-Based Defaults**:
   - Project Managers: Overview, Scope, Timeline, Tasks, Reports
   - Architects: Drawings, Materials, RFIs, Submittals
   - Site Supervisors: Tasks, QC/Punch Lists, Timeline
   - Clients: Overview, Drawings, Milestones, Reports

## 📱 Mobile-First Design

### Responsive Behavior

**Desktop (> 1024px)**
- Full tab bar with 5-6 tabs + More dropdown
- Side-by-side layouts where appropriate
- Data tables with all columns

**Tablet (768px - 1024px)**  
- 3-4 visible tabs + More dropdown
- Stack layouts vertically
- Responsive tables (priority columns)

**Mobile (< 768px)**
- Bottom navigation with 4 icons + menu
- Single column layouts
- Cards instead of tables
- Touch-optimized buttons (min 44px)

### Mobile Navigation Pattern

```
┌─────────────────────────┐
│ Project Name        ☰   │
├─────────────────────────┤
│                         │
│    Content Area         │
│                         │
├─────────────────────────┤
│  📊  📋  🔨  📅  ⋯     │
└─────────────────────────┘
   Overview Scope Tasks Timeline More
```

## 🎯 UI Components (Shadcn/ui)

### Core Components Usage

- **Cards** - For scope items, tasks, drawings
- **Tables** - For data lists (with mobile card view)
- **Dialogs** - For forms and detailed views
- **Sheets** - For mobile-friendly side panels
- **Tabs** - For sub-navigation within features
- **Command** - For search and quick actions
- **Toast** - For notifications and feedback

### Construction-Specific UI Elements

1. **Status Badges**
   - Color-coded for quick recognition
   - Icons for status types
   - Touch-friendly size

2. **Progress Indicators**
   - Visual progress bars
   - Percentage displays
   - Milestone markers

3. **Approval Workflows**
   - Clear action buttons
   - Status flow visualization
   - Permission-based UI

4. **File Previews**
   - Drawing thumbnails
   - Document icons
   - Quick preview on hover/tap

## 🚀 Performance Patterns

### Fast Navigation Strategy

1. **Prefetch on Hover**
   - Prefetch tab data when hovering over tab
   - Instant navigation feel

2. **Optimistic UI Updates**
   - Update UI immediately
   - Sync with server in background
   - Rollback on error

3. **Smart Loading States**
   - Skeleton screens for initial load
   - Inline spinners for updates
   - Keep previous data visible during refresh

4. **Data Caching**
   - Cache tab data with React Query
   - Background refresh when stale
   - Offline-capable reads

### Example Component Structure

```tsx
// Project workspace layout
export default function ProjectLayout({ children, params }) {
  const { id } = params
  const { data: project } = useProject(id)
  const pathname = usePathname()
  const { pinnedTabs } = useUserPreferences()
  
  const defaultTabs = ['overview', 'scope', 'drawings', 'tasks', 'timeline']
  const visibleTabs = pinnedTabs || defaultTabs
  
  return (
    <div className="flex flex-col h-screen">
      {/* Project Header */}
      <ProjectHeader project={project} />
      
      {/* Smart Tab Navigation */}
      <TabNavigation 
        tabs={visibleTabs}
        currentPath={pathname}
        projectId={id}
      />
      
      {/* Content Area */}
      <main className="flex-1 overflow-auto p-4">
        {children}
      </main>
    </div>
  )
}
```

## 🎨 Design System

### Colors
- **Primary**: Blue (trust, professionalism)
- **Success**: Green (approved, complete)
- **Warning**: Yellow (pending, attention needed)
- **Danger**: Red (rejected, overdue)
- **Neutral**: Gray scales (UI elements)

### Typography
- **Font**: System fonts for fast loading
- **Headings**: Clear hierarchy (h1-h6)
- **Body**: Readable size (16px minimum)
- **Mobile**: Larger touch targets

### Spacing
- Consistent 4px grid system
- Generous padding for touch
- Clear visual hierarchy
- Breathable layouts

## 📊 User Flow

1. **Login** → Dashboard
2. **Dashboard** → Quick stats, recent projects, notifications
3. **Select Project** → Project workspace
4. **Navigate Tabs** → Stay in project context
5. **Perform Actions** → Based on permissions
6. **Switch Projects** → Via project selector or breadcrumb

---

*Last Updated: January 2025*
*Status: UI/UX Pattern Defined*
*Next Step: Authentication Simplification*