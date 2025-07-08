## Dashboard Design Refined: Owner vs. PM

The guiding principle remains **relevance and actionability**. Each role needs a dashboard tailored to their specific responsibilities and information needs.

---

### **1. Company Owner Dashboard (Refined)**

**Ideal Vision:** A high-level, strategic overview of the entire company's project portfolio and key operational performance indicators. Focus on overall project status, progress, and activity across the organization.

**Current Implementation (`src/app/dashboard/page.tsx` for `company_owner`):**
*   `GlobalStatsCards`
*   `ProjectsOverview`
*   `CompanyActivityFeed`

**Refined Evaluation & Suggestions:**

*   **What Works (and will be retained):**
    *   The existing structure with `GlobalStatsCards`, `ProjectsOverview`, and `CompanyActivityFeed` is excellent for an owner's high-level view.
    *   The `simplfyapp.md` plan for the owner's dashboard is fundamentally sound for its purpose.

*   **Adjustments (Removing Financial/Risk & Enhancing Navigation):**
    1.  **`GlobalStatsCards` Refinement:** These cards should focus on operational metrics like:
        *   Total Number of Active Projects
        *   Number of Pending Approvals (company-wide, e.g., documents, shop drawings)
        *   Number of Projects On Track / Delayed / Completed
        *   Overall Resource Utilization (if data is available)
        *   **Explicitly remove any cards or metrics related to detailed financial health or explicit risk assessment.**
    2.  **Enhanced Project Navigation from `ProjectsOverview`:**
        *   **Crucial:** When an owner clicks on a project name within the `ProjectsOverview` list, they **must navigate directly to the "Project Management Workspace" (`/projects/[id]`)**.
        *   From this project-specific page, the owner (or any authorized user) can then use the **tabbed interface** (Overview, Scope List, Shop Drawings, Material Specs, Reports) to explore all details of that project. This provides the desired drill-down capability without cluttering the main dashboard.
    3.  **Customizable Date Ranges (Optional but Recommended):** Still a good idea for `GlobalStatsCards` and `ProjectsOverview` to allow filtering by timeframes (e.g., "Last Quarter," "Year-to-Date") for trend analysis of operational data.

---

### **2. Project Manager (PM) Dashboard (Refined)**

**Ideal Vision:** An actionable, personalized dashboard focused exclusively on the PM's assigned projects, tasks, and immediate priorities. It should enable quick identification of issues, upcoming deadlines, and required actions, serving as their daily operational hub.

**Current Implementation (`src/app/dashboard/page.tsx` for other roles, using `DashboardContent`):**
*   As noted, `DashboardContent` is likely generic. The goal here is to replace it with a highly specific PM view.

**Refined Suggestions (Critical for PM Workflow):**

The PM dashboard should be composed of distinct, actionable components:

1.  **`MyProjectsOverview`:**
    *   **Purpose:** List only projects assigned to the logged-in PM.
    *   **Content:** Project Name, Current Status (e.g., "On Track," "Delayed"), Overall Progress (visual bar), Key Milestones (upcoming/overdue), and a simple indicator of budget status (e.g., "Within Budget," "Over Budget").
    *   **Functionality:** **Crucial:** Clicking on a project name **must navigate directly to the "Project Management Workspace" (`/projects/[id]`)**. This is the primary entry point for managing a specific project.

2.  **`MyTasksAndActions`:**
    *   **Purpose:** Display tasks assigned *to the PM* or tasks within *their projects* that require immediate attention.
    *   **Content:** Overdue Tasks, Tasks Due Soon (e.g., next 7 days), Tasks Awaiting My Approval/Review (e.g., shop drawings, documents).
    *   **Functionality:** Links directly to the task detail or the item requiring approval (e.g., the specific shop drawing submission).

3.  **`RecentProjectActivity`:**
    *   **Purpose:** A feed of recent, relevant activities *within the PM's assigned projects*.
    *   **Content:** "Shop drawing for 'X' submitted," "Task 'Y' completed by John Doe," "Document 'Z' uploaded," "Client approved 'A'."
    *   **Functionality:** Filterable by project, and clickable to the relevant item.

4.  **`CriticalAlerts`:**
    *   **Purpose:** Highlight immediate, high-priority issues across the PM's projects.
    *   **Content:** Projects significantly behind schedule, critical tasks overdue, unaddressed client rejections on shop drawings, or any other project-specific red flags.
    *   **Functionality:** Prominent display, links to problem areas for quick resolution.

**Dashboard Structure for PM (Conceptual Code):**

```tsx
// src/app/dashboard/page.tsx (Conditional rendering for PM role)
// This will be implemented AFTER critical compilation/auth issues are resolved.

import { MyProjectsOverview } from '@/components/dashboard/pm/MyProjectsOverview';
import { MyTasksAndActions } from '@/components/dashboard/pm/MyTasksAndActions';
import { RecentProjectActivity } from '@/components/dashboard/pm/RecentProjectActivity';
import { CriticalAlerts } from '@/components/dashboard/pm/CriticalAlerts';

export default function DashboardPage() {
  // ... existing auth and permission checks (assuming unified auth is done) ...

  if (profile.role === 'company_owner') {
    // ... Owner dashboard content (now without financial/risk focus) ...
    // Ensure GlobalStatsCards and ProjectsOverview reflect the refined scope.
  }

  // For Project Managers and other operational roles (e.g., General Manager)
  if (profile.role === 'project_manager' || profile.role === 'general_manager') {
    return (
      <div className="space-y-6">
        {/* Dashboard Header (Welcome message, role) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {profile.first_name}
            </h1>
            <p className="text-gray-600 capitalize">
              {profile.role.replace('_', ' ')} Dashboard
            </p>
          </div>
        </div>

        {/* PM Dashboard Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <CriticalAlerts />
            <MyProjectsOverview />
          </div>
          <div>
            <MyTasksAndActions />
            <RecentProjectActivity />
          </div>
        </div>
      </div>
    );
  }

  // ... fallback for other roles or generic DashboardContent if needed ...
}
```