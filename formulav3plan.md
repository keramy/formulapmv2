Formula PM 3.0 - Complete AI Agent Implementation Guide
📋 Project Overview Prompt
You are building Formula PM 3.0 - a modern construction project management system. This is a FRESH START project that keeps the excellent database but rebuilds the application layer with clean, modern patterns.

CONTEXT:
- Formula PM V2 has over-engineering issues (448-line useAuth hook, complex abstractions)
- Database schema is excellent and will be kept with minor enhancements
- Target users: Construction teams, project managers, architects, clients
- Focus: Clean code, fast navigation, flexible permissions, mobile-friendly

SUCCESS CRITERIA:
- Navigation speed like smooth modern apps (< 500ms between pages)
- Flexible permission system (admin-configurable, no code deployments)
- Professional UI for client meetings, mobile-ready for field workers
- Simple, maintainable codebase (opposite of V2 complexity)

🏗️ Architecture & Technology Stack Prompt
BUILD FORMULA PM 3.0 WITH THIS EXACT TECH STACK:

CORE STACK (Approved):
- Framework: Next.js 15 with App Router (NOT Pages Router)
- Database: Keep existing Supabase PostgreSQL schema (it's excellent)
- Styling: Tailwind CSS + Shadcn/ui components
- Language: TypeScript throughout
- Authentication: Supabase Auth (but simplified implementation)

STRATEGIC ADDITIONS:
- Data Management: @tanstack/react-query (for caching, background updates)
- Forms: react-hook-form + zod (construction forms are complex)  
- Charts: recharts (for Gantt charts, progress tracking)
- Icons: lucide-react (consistent, construction-friendly)

DEPLOYMENT TARGET:
- Primary: Vercel (zero-config Next.js deployment)
- Alternative: Azure Static Web Apps (if Azure ecosystem required)
- NO DOCKER (unnecessary complexity for this stack)

AVOID:
- Complex state management (React Query handles most needs)
- Over-abstracted components (keep simple)
- Route-level permission blocking (use component-level filtering)

🔑 Revolutionary RBAC System Prompt
IMPLEMENT DYNAMIC PERMISSION SYSTEM (This is the key innovation):

DATABASE CHANGES (Enhance existing schema):
1. ALTER TABLE user_profiles ADD COLUMN permissions TEXT[] DEFAULT '{}'
2. ALTER TABLE user_profiles ADD COLUMN job_title TEXT (descriptive only)
3. ALTER TABLE user_profiles ADD COLUMN department TEXT (descriptive only)
4. CREATE TABLE permission_templates (...) (for admin management)
5. CREATE TABLE permission_changes (...) (for audit trail)

CORE CONCEPT:
- NO MORE FIXED ROLES! Roles become descriptive text only
- Real access control through permissions array
- Same job title can have different permissions per company
- Admin panel manages permissions, not code changes

PERMISSION EXAMPLES:
user.permissions = [
  'create_projects', 'view_project_costs', 'internal_review_drawings', 
  'submit_to_client', 'approve_expenses', 'admin_panel_access'
]

COMPONENT USAGE:
```tsx
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
This approach gives ultimate flexibility - construction companies can customize access exactly to their needs without calling for code changes.

---

## 🎨 **User Interface & Experience Prompt**
CREATE PROJECT WORKSPACE PATTERN (This UX design is excellent):
URL STRUCTURE:
/projects                    # Project list page
/projects/[id]              # Project workspace (tabbed interface)
/projects/[id]/scope        # Scope items management
/projects/[id]/drawings     # Shop drawings workflow
/projects/[id]/tasks        # Task management
/projects/[id]/gantt        # Gantt chart timeline
/projects/[id]/documents    # Document management
/projects/[id]/reports      # Project reports
FOLDER STRUCTURE:
src/app/projects/
├── page.tsx                    # Project list
└── [id]/
├── layout.tsx              # Project workspace layout (header + tabs)
├── page.tsx                # Project overview/dashboard
├── scope/page.tsx          # Scope management
├── drawings/page.tsx       # Shop drawings
├── tasks/page.tsx          # Task management
├── gantt/page.tsx          # Gantt chart
└── reports/page.tsx        # Reports
UI LIBRARY: Use Shadcn/ui + Tailwind

Professional look for client meetings
Touch-friendly for field workers with work gloves
Fast loading on construction site internet
Mobile-responsive for tablets and phones
Easy to customize for company branding

USER FLOW:
Login → Projects List → Click Project → Project Workspace (stay in project context while switching between tabs like scope, drawings, tasks, etc.)

---

## 🔄 **Authentication Simplification Prompt**
REPLACE COMPLEX AUTHENTICATION WITH SIMPLE SYSTEM:
CURRENT PROBLEM: V2 has 448-line useAuth hook doing everything
TARGET SOLUTION: Clean, focused hooks under 50 lines each
useAuth Hook (20-30 lines max):
tsxexport const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) await fetchProfile(session.user.id)
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  return { user, profile, loading, signIn, signOut, isAuthenticated: !!user && !!profile }
}
usePermissions Hook (separate concern):
tsxexport const usePermissions = () => {
  const { profile } = useAuth()
  
  const hasPermission = (permission: string) => {
    return profile?.permissions?.includes(permission) || false
  }
  
  return { hasPermission }
}
PRINCIPLES:

Each hook has single responsibility
No impersonation complexity in core auth
No manual token refresh (let Supabase handle it)
No complex caching (React Query handles data)
Server Components handle auth checks where possible


---

## 🔄 **Approval Workflows Implementation Prompt**
IMPLEMENT SHOP DRAWING APPROVAL WORKFLOW (Example of permission-driven workflows):
WORKFLOW STAGES:

Architect creates drawing → 2. Internal review → 3. Submit to client → 4. Client review → 5. Approve/Reject

DATABASE STATUS TRACKING:
shop_drawings table with status field:

'draft' → 'internal_review' → 'internal_approved' → 'submitted_to_client' → 'client_approved'/'client_rejected'

PERMISSION-BASED ACTIONS:
tsxfunction ShopDrawingCard({ drawing }) {
  const { hasPermission } = usePermissions()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{drawing.drawing_number}</CardTitle>
        <StatusBadge status={drawing.status} />
      </CardHeader>
      <CardContent>
        {/* Actions based on status and permissions */}
        {drawing.status === 'draft' && hasPermission('submit_for_internal_review') && (
          <Button onClick={() => updateStatus('internal_review')}>
            Submit for Internal Review
          </Button>
        )}
        
        {drawing.status === 'internal_review' && hasPermission('internal_review_drawings') && (
          <div className="space-y-2">
            <Button onClick={() => updateStatus('internal_approved')}>Approve</Button>
            <Button variant="destructive" onClick={() => updateStatus('revision_needed')}>
              Request Changes
            </Button>
          </div>
        )}
        
        {drawing.status === 'submitted_to_client' && hasPermission('review_submitted_drawings') && (
          <div className="space-y-2">
            <Button onClick={() => updateStatus('client_approved')}>Client Approve</Button>
            <Button variant="destructive" onClick={() => updateStatus('client_rejected')}>
              Client Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
WORKFLOW BENEFITS:

Different users see different actions based on their permissions
Flexible for different construction companies (some skip internal review, others have multi-stage approval)
Complete audit trail of who approved what when
Easy to add new workflow stages without code changes


---

## 🛡️ **Admin Panel Implementation Prompt**
BUILD ADMIN PANEL FOR PERMISSION MANAGEMENT:
MAIN FEATURES:

User Management Table (view all users, job titles, permission counts)
Permission Editor Dialog (checkboxes for individual permissions organized by category)
Permission Templates (pre-built sets: "Project Manager", "Client Access", etc.)
Audit Log (track all permission changes with reasons)

KEY ADMIN COMPONENTS:
User Management:

Table showing: Name, Email, Job Title (text), Department (text), Permission Count, Status
Actions: Edit Details, Manage Permissions, View Activity, Activate/Deactivate

Permission Categories:
tsxconst permissionCategories = {
  'Project Management': [
    'create_projects', 'edit_projects', 'delete_projects', 
    'view_all_projects', 'assign_team_members'
  ],
  'Financial': [
    'view_project_costs', 'view_profit_margins', 'edit_budgets', 
    'approve_expenses', 'view_financial_reports'
  ],
  'Shop Drawings': [
    'create_shop_drawings', 'internal_review_drawings', 
    'submit_to_client', 'review_submitted_drawings'
  ],
  'Administration': [
    'admin_panel_access', 'manage_users', 'view_audit_logs'
  ]
}
Permission Templates:

"Project Manager": ['create_projects', 'view_costs', 'internal_review', ...]
"Senior Architect": ['create_drawings', 'internal_review', 'submit_client', ...]
"Client Access": ['view_assigned_projects', 'review_drawings', ...]
"Construction Manager": ['view_all_projects', 'view_costs', 'approve_budgets', ...]

ADMIN PANEL ACCESS:
Only users with 'admin_panel_access' permission can use these features.

---

## 📊 **Implementation Timeline Prompt**
BUILD FORMULA PM 3.0 IN THIS ORDER:
WEEK 1-2: FOUNDATION

Set up clean Next.js 15 project with App Router
Add permissions columns to user_profiles table
Create simple useAuth and usePermissions hooks
Build basic project list and workspace layout
Implement Shadcn/ui components and Tailwind styling

WEEK 3-4: CORE FEATURES

Project workspace with tabbed navigation
Scope items page with permission-based data filtering
Basic shop drawing workflow implementation
User management basics (list users, basic editing)
React Query integration for data management

WEEK 5-6: ADVANCED FEATURES

Complete shop drawing approval workflow
Admin panel for permission management
Permission templates and bulk operations
Audit logging for permission changes
Mobile optimization and responsive design

WEEK 7-8: PRODUCTION READY

Testing and bug fixes
Performance optimization
Deployment to Vercel
Documentation and user guides

TESTING APPROACH:
Focus on critical business workflows, not perfect coverage:

Authentication flow works reliably
Permission system prevents unauthorized access
Shop drawing workflow functions correctly
Admin panel allows permission management
Core construction management features work


---

## 🚀 **Deployment & Production Prompt**
DEPLOY TO VERCEL (RECOMMENDED):
WHY VERCEL FOR CONSTRUCTION MANAGEMENT:

Zero configuration for Next.js (focus on features, not deployment)
Fast global CDN (important for field workers on construction sites)
Automatic HTTPS and SSL certificates
Preview deployments for testing
Environment variable management
$0 for development, $20/month for production

DEPLOYMENT STEPS:

Push code to GitHub repository
Connect Vercel to GitHub (automatic deployments)
Set environment variables in Vercel dashboard:

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY


Configure custom domain (optional)
Test production deployment

ALTERNATIVE: Azure Static Web Apps (if Azure ecosystem required)
AVOID: Docker, complex container setups (unnecessary for this stack)
PRODUCTION CHECKLIST:

Environment variables configured
Database migrations applied
Test accounts created
SSL certificates working
Custom domain configured
Error monitoring enabled


---

## 🎯 **Critical Success Factors Prompt**
ENSURE THESE SUCCESS CRITERIA:
PERFORMANCE REQUIREMENTS:

Navigation between project tabs: < 500ms (like smooth modern apps)
Initial page load: < 2 seconds
Mobile responsiveness: Works perfectly on tablets with work gloves
Construction site internet: Fast loading on poor connections

BUSINESS REQUIREMENTS:

Clients cannot see pricing data (permission-filtered)
Construction companies can customize permissions without code changes
Job titles are descriptive only - permissions control real access
Shop drawing approval workflows match industry standards
Mobile-first design for field workers

CODE QUALITY REQUIREMENTS:

useAuth hook: < 50 lines (not 448 like V2)
Components: Simple, focused, single responsibility
No route-level permission blocking (use component-level filtering)
Extensive use of Server Components for better performance
React Query for all data fetching and caching

AVOID THESE V2 MISTAKES:

Over-engineered components with too many abstractions
Complex authentication with impersonation in core auth
Manual state management where React Query should handle
Route blocking that slows navigation
Fixed roles that require code changes to modify

CONSTRUCTION INDUSTRY FOCUS:

Touch-friendly interfaces for field workers
Professional appearance for client presentations
Industry-specific terminology and workflows
Mobile-first approach (tablets and phones primary devices)
Fast, reliable performance in challenging network conditions


---

## 💡 **Final Implementation Prompt**
BUILD FORMULA PM 3.0 - CONSTRUCTION PROJECT MANAGEMENT SYSTEM
You are building a modern, clean construction project management system. Use the technical decisions and architecture outlined above.
KEY PRINCIPLES:

SIMPLE over complex (opposite of V2 over-engineering)
FAST navigation (< 500ms between project tabs)
FLEXIBLE permissions (admin-configurable, not code-based)
CONSTRUCTION-FOCUSED (not generic project management)
MOBILE-FIRST (field workers primary users)

CORE INNOVATION: Dynamic permissions system where job titles are descriptive text but permissions array controls real access. This gives construction companies ultimate flexibility to customize access without code changes.
START WITH: Clean Next.js 15 project + enhance existing database schema + simple authentication + project workspace pattern + permission system.
FOCUS ON: Working software that construction teams will actually use daily, not perfect engineering that's too complex to maintain.
The goal is a fast, reliable, flexible construction management tool that works great on construction sites and in client meetings.

---

## 🎯 **Ready to Build!**

This comprehensive guide gives your AI agent everything needed to build Formula PM 3.0 successfully. The plan is focused, practical, and addresses the real needs of construction teams while avoiding the over-engineering mistakes of V2.

**Key takeaway: Keep the excellent database, rebuild the application layer cleanly, focus on the dynamic permissions innovation, and create something construction teams will love to use daily.**