# Plan: Simplify and Succeed

This document outlines a clear, phased approach to refactor the Formula PM application into a simpler, more maintainable, and highly demonstrable product. The primary goal is to reduce complexity by focusing on core user journeys.

**Visual Target:** The application's UI will be modeled after the provided image: a clean, modern layout with a fixed left sidebar and a main content area.

---

#### **Phase 1: Build the Core Layout Foundation**

This phase establishes the new, simplified visual structure for the entire application.

*   **Step 1.1: Create the `Sidebar` Component**
    *   **Action:** Create a new file at `src/components/layouts/Sidebar.tsx`.
    *   **Purpose:** This component will render the fixed, dark-themed navigation bar on the left.
    *   **Content:** It will contain navigation links with icons. The initial links should be:
        *   Dashboard (for the Owner's View)
        *   Projects (leading to the list of projects for a PM)
        *   Settings
    *   **Styling:** Use `position: fixed`, a dark background color, and give it a set width.

*   **Step 1.2: Create the `Header` Component**
    *   **Action:** Create a new file at `src/components/layouts/Header.tsx`.
    *   **Purpose:** This component will render the top header bar within the main content area.
    *   **Content:** It should display the current page's title and a user profile dropdown menu on the right.

*   **Step 1.3: Update the Root Layout**
    *   **Action:** Modify the main layout file at `src/app/layout.tsx`.
    *   **Purpose:** To integrate the new `Sidebar` and `Header` components, creating the final two-column layout.
    *   **Implementation:**
        ```tsx
        // src/app/layout.tsx
        import { Sidebar } from '@/components/layouts/Sidebar';
        import { Header } from '@/components/layouts/Header';

        export default function RootLayout({ children }: { children: React.ReactNode }) {
          return (
            <html lang="en">
              <body>
                <div className="flex h-screen">
                  <Sidebar />
                  <main className="flex-1 flex flex-col overflow-y-auto">
                    <Header />
                    <div className="p-6">
                      {children}
                    </div>
                  </main>
                </div>
              </body>
            </html>
          );
        }
        ```

---

#### **Phase 2: Implement the Simplified "Owner's View"**

This is the simplest, high-level view, perfect for demonstrating the project's status to stakeholders. The dashboard will be composed of three main components.

*   **Step 2.1: Define the Owner's Dashboard Page**
    *   **Action:** Modify the `src/app/dashboard/page.tsx` file.
    *   **Purpose:** This page will serve as the main landing page for a logged-in owner. It will be structured as a grid to organize the new components.
    *   **Layout:**
        ```tsx
        // src/app/dashboard/page.tsx
        import { GlobalStatsCards } from '@/components/dashboard/owner/GlobalStatsCards';
        import { ProjectsOverview } from '@/components/dashboard/owner/ProjectsOverview';
        import { CompanyActivityFeed } from '@/components/dashboard/owner/CompanyActivityFeed';

        export default function OwnerDashboardPage() {
          return (
            <div className="space-y-6">
              <GlobalStatsCards />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <ProjectsOverview />
                </div>
                <div>
                  <CompanyActivityFeed />
                </div>
              </div>
            </div>
          );
        }
        ```

*   **Step 2.2: Create the `GlobalStatsCards` Component**
    *   **Action:** Create a new file at `src/components/dashboard/owner/GlobalStatsCards.tsx`.
    *   **Purpose:** To display high-level, company-wide analytics cards at the top of the dashboard.
    *   **Content:** The component will show a set of cards with key metrics such as:
        *   Total Number of Active Projects
        *   Overall Company Budget vs. Actuals
        *   Number of Pending Approvals (company-wide)
        *   Number of At-Risk Projects

*   **Step 2.3: Create the `ProjectsOverview` Component**
    *   **Action:** Create a new file at `src/components/dashboard/owner/ProjectsOverview.tsx`.
    *   **Purpose:** To display a detailed list of all ongoing projects.
    *   **Content:** This component will render a table or a list of project cards with the following information for each project:
        *   Project Name
        *   Current Status (e.g., "On Track", "Delayed", "Completed")
        *   Assigned Team (listing the Project Manager)
        *   A visual progress bar indicating schedule or budget completion.
    *   **Functionality:** Clicking on a project will navigate the owner to the read-only view of the "Single Project Workspace" (Phase 3).

*   **Step 2.4: Create the `CompanyActivityFeed` Component**
    *   **Action:** Create a new file at `src/components/dashboard/owner/CompanyActivityFeed.tsx`.
    *   **Purpose:** To provide a real-time feed of the latest important activities across the company.
    *   **Content:** This component will display a list of recent events, such as:
        *   "New project 'Metropolis Tower' created."
        *   "Shop drawing for 'Main Lobby HVAC' approved."
        *   "User 'John Doe' added to 'Skyscraper Project'."

---

#### **Phase 3: The Project Management Workspace**

This phase implements the core workflow for all management roles (PM, GM, Deputy GM). It begins with a project list and drills down into a detailed, tabbed workspace for each project.

*   **Step 3.1: Create the Main Project List Page**
    *   **Action:** Create a new page file at `src/app/projects/page.tsx`.
    *   **Purpose:** This page will be accessed from the "Projects" link in the sidebar. It will display a list of all projects the logged-in user has permission to see.
    *   **Content:** The page will feature a filterable and sortable table or list of projects.
    *   **Functionality:** Each project name in the list will be a clickable link that navigates to the detailed workspace for that specific project (e.g., `/projects/PROJECT_ID`).

*   **Step 3.2: Define the Dynamic Project Workspace Page**
    *   **Action:** Create a new page file at `src/app/projects/[id]/page.tsx`.
    *   **Purpose:** This is the central hub for managing or viewing a specific project. The page will be composed of a header and a tabbed interface.
    *   **Layout:**
        ```tsx
        // src/app/projects/[id]/page.tsx
        import { ProjectHeader } from '@/components/projects/ProjectHeader';
        import { TabbedWorkspace } from '@/components/projects/TabbedWorkspace';

        export default function ProjectWorkspacePage({ params }: { params: { id: string } }) {
          return (
            <div className="space-y-4">
              <ProjectHeader projectId={params.id} />
              <TabbedWorkspace projectId={params.id} />
            </div>
          );
        }
        ```

*   **Step 3.3: Implement the Tabbed Workspace**
    *   **Action:** Create a new component at `src/components/projects/TabbedWorkspace.tsx`. This component will contain the tab controls and render the content for the selected tab.
    *   **Tabs:**
        1.  **Overview:** A high-level summary of the project.
        2.  **Scope List:** A detailed breakdown of scope items.
        3.  **Shop Drawings:** Management of shop drawing submissions and approvals.
        4.  **Material Specs:** A list of material specifications for the project.
        5.  **Reports:** A collection of all reports related to the project.

*   **Step 3.4: Build Each Tab as a Separate Component**
    *   **Action:** For each tab, create a dedicated component file inside a new `src/components/projects/tabs/` directory.
    *   **Minimum Viable Features for Each Tab:**
        *   **`OverviewTab.tsx`:** Display key project details, such as status, key dates, team members, and a budget summary.
        *   **`ScopeListTab.tsx`:** Display a read-only table of all scope items for the project, including their descriptions and associated costs.
        *   **`ShopDrawingsTab.tsx`:** Display a list of shop drawing submissions with their current approval status. Include a button to upload a new submission.
        *   **`MaterialSpecsTab.tsx`:** Display a list of required materials for the project, showing their specifications and status.
        *   **`ReportsTab.tsx`:** Display a list of all generated reports (e.g., daily reports, safety inspections) for the project, with an option to view each report.

---

#### **Phase 4: User Experience Enhancements (Future Considerations)**

These suggestions aim to further refine the user experience after the core simplified workflows are established. They focus on usability, efficiency, and user satisfaction across different roles.

*   **Suggestion 4.1: Proactive Notifications & Alerts**
    *   **Description:** Implement a robust notification system to alert users (PMs, GMs, Owners) about critical events.
    *   **Examples:** Overdue tasks, pending approvals requiring their action, budget nearing limits, new documents uploaded, critical project status changes.
    *   **Benefit:** Reduces the need for constant manual checking, allowing users to focus on high-priority items.

*   **Suggestion 4.2: Enhanced Search & Filtering**
    *   **Description:** Provide powerful, intuitive search and filtering capabilities across all lists (projects, tasks, documents, scope items).
    *   **Examples:** Global search bar, advanced filters by status, date range, assigned user, project type.
    *   **Benefit:** Users can quickly find specific information without navigating through multiple screens.

*   **Suggestion 4.3: Customizable Views & Dashboards**
    *   **Description:** Allow users to personalize their project lists, task boards, or even the main dashboard (for owners) by selecting which columns or widgets they want to see.
    *   **Benefit:** Tailors the interface to individual preferences and roles, reducing visual clutter and improving relevance.

*   **Suggestion 4.4: In-App Guidance & Tooltips**
    *   **Description:** For new or complex features, provide subtle in-app guidance, tooltips, or short walkthroughs.
    *   **Benefit:** Reduces the learning curve and improves feature adoption without requiring external documentation.

*   **Suggestion 4.5: Performance Feedback & Loading States**
    *   **Description:** Implement clear visual indicators for loading data, saving changes, or processing actions.
    *   **Examples:** Spinners, progress bars, success/error toasts.
    *   **Benefit:** Improves perceived performance and reduces user frustration by providing immediate feedback.

*   **Suggestion 4.6: Quick Actions & Contextual Menus**
    *   **Description:** For frequently performed actions (e.g., "Mark Task Complete," "Approve Document"), provide quick action buttons or contextual menus (right-click or ellipsis menus) directly on list items.
    *   **Benefit:** Streamlines workflows and reduces clicks for common tasks.

*   **Suggestion 4.7: Integrated Communication (Comments/Chat)**
    *   **Description:** Allow users to add comments or initiate discussions directly within tasks, documents, or specific project items.
    *   **Benefit:** Centralizes communication related to specific work items, reducing reliance on external email or chat applications.

---

#### **Phase 5: Rollout and Deprecation**

This ensures a smooth transition from the old, complex structure to the new, simplified one.

*   **Step 5.1: Build in Parallel:** All new pages and components from Phases 1-4 should be built without deleting any of the old pages.
*   **Step 5.2: Update Navigation:** Once the new "Single Project Workspace" is functional, update the links in the `Sidebar` component to point to the new pages.
*   **Step 5.3: Deprecate Old Pages:** Only after the new system is fully tested and working should the old, feature-based pages (the previous top-level `scope`, `documents` sections, etc.) be removed to eliminate code complexity.

Remove purchase department feature. we can add it later.
remove subcontractor feature. we can add it later.
Create a Suppliers feataure which allows to create suppliers with their information and we can assign suppliers to scope list elements. and that allows us to see which supplier doing which scope item and on total we can see how much will be paid to supplier.