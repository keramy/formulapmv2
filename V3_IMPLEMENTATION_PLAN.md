### Formula PM V3 - AI Agent Implementation Plan

**Objective:** To fully implement the features outlined in the V3 plan, replacing all mock data with functional, database-driven systems, and to bring the application to a feature-complete state for its core project management capabilities.

**Current Status Summary:** The V3 feature set is **partially implemented**. Core systems for Task Management, Milestones, and Reporting are entirely missing. Other key features like Shop Drawings, Material Approvals, and Scope List enhancements exist in a nascent or outdated state. The application relies heavily on mock data, which must be replaced. The foundation is stable, but the core business logic is incomplete.

---

### **General Instructions for AI Agent**

1.  **Strict Prioritization:** Implement features in the precise order specified below (P1 first, then P2). Do not move to a lower-priority feature until the higher-priority one is complete, tested, and verified.
2.  **Adhere to Plans:** Each feature has a detailed design document in `docs/v3-plans/gemini-designs/`. Follow these plans *exactly* for data models, API endpoints, and UI components.
3.  **Database First:** For each feature, begin by creating the necessary Supabase database migrations. All schema changes **must** be in new migration files in `supabase/migrations/`.
4.  **Security is Paramount:**
    *   Implement Row-Level Security (RLS) policies for **every new table**.
    *   Use the project's existing permission system (`usePermissions`, `hasPermission`) to protect all new API endpoints and UI actions.
5.  **Test Incrementally:** After implementing each feature, run the relevant project tests (`npm test`) to ensure no regressions have been introduced. Write new tests for the functionality you add.
6.  **No Mock Data:** The primary goal is to eliminate mock data. Ensure all UI components are fetching and displaying data from the newly created APIs.
7.  **Update Documentation:** After a major feature is complete, update the `README.md` and relevant documents if its functionality has changed significantly.

---

### **P1 - Highest Priority Implementation Plan**

#### **1. Task Management System**

*   **Plan:** `task_management_plan.md`
*   **Status:** **Not Implemented**
*   **Action Plan:**
    1.  **Database:** Create a new migration file to add the `tasks`, `task_comments`, and `comment_mentions` tables as specified in the plan. Implement RLS policies for all three tables.
    2.  **API:** Build all required API endpoints under `/api/tasks/`, including endpoints for CRUD on tasks and for adding/viewing comments with `@mention` handling.
    3.  **UI:**
        *   Create a new `TasksTab.tsx` in the project view.
        *   Develop the `TaskDetailModal` component, including the comment section with `@mention` support.
        *   Replace the mock data in the `OverviewTab` ("Total Tasks", "Completed Tasks") with data from the new API.
        *   Populate the `MyTasksAndActions` component on the PM Dashboard.
    4.  **Testing:** Write tests for the API endpoints and the core task management UI components.

#### **2. Milestone Tracking System**

*   **Plan:** `milestone_tracking_plan.md`
*   **Status:** **Not Implemented**
*   **Action Plan:**
    1.  **Database:** Create a new migration file to add the `milestones` table with its RLS policy.
    2.  **API:** Build all API endpoints under `/api/milestones/`, including the specific `GET /api/projects/:projectId/next-milestone` for the overview tab.
    3.  **UI:**
        *   Create the `MilestonesTab.tsx` component.
        *   Develop the `MilestoneForm` and `MilestoneDetailModal` components.
        *   Replace the mock "Next Milestone" data in `OverviewTab.tsx` with a call to the new API.
    4.  **Testing:** Write tests for the milestone API and UI components.

#### **3. Scope List Enhancements**

*   **Plan:** `scope_list_plan.md`
*   **Status:** **Partially Implemented**
*   **Action Plan:**
    1.  **Database:** Create a migration to **ALTER** the existing `scope_items` table. Add the `initial_cost`, `sell_price`, and `group_progress_percentage` columns.
    2.  **API:**
        *   Create the new API endpoints for bulk supplier assignment (`/api/scope/bulk-assign-supplier`) and Excel/XLSM import/export (`/api/scope/export-template`, `/api/scope/import`, `/api/scope/export/:projectId`).
        *   Modify the existing `GET /api/scope` endpoint to return the new financial columns.
    3.  **UI:**
        *   Update `ScopeListTab.tsx` to display items grouped by category.
        *   Implement the manual group progress indicator and the new financial summary cards.
        *   Add the "Import/Export" buttons and functionality.
        *   Add the "Millwork Dependencies" indicator.
    4.  **Testing:** Test the import/export functionality thoroughly and verify the UI updates.

#### **4. Shop Drawing Approval System**

*   **Plan:** `shop_drawing_approval_plan.md`
*   **Status:** **Partially Implemented (with schema discrepancy)**
*   **Action Plan:**
    1.  **Database:** **This is critical.** The V3 plan is superior to the existing schema. Create a migration to **deprecate/remove** the old `shop_drawing_revisions` and `shop_drawing_approvals` tables and **create** the new `shop_drawings`, `shop_drawing_submissions`, and `shop_drawing_reviews` tables as defined in the plan. This will align the project with the strategic direction.
    2.  **API:** Build the new, version-aware API endpoints under `/api/shop-drawings/` as specified in the plan.
    3.  **UI:** Rebuild the `ShopDrawingsTab.tsx` and its sub-components (`ShopDrawingListTable`, `ShopDrawingDetailModal`, `ShopDrawingUploadForm`) to match the new workflow and data model.
    4.  **Testing:** Write comprehensive tests for the entire approval workflow, covering different user roles (internal and client).

#### **5. Material Approval & Management System**

*   **Plan:** `material_approval_plan.md`
*   **Status:** **Not Implemented**
*   **Action Plan:**
    1.  **Database:** Create a migration to add the `material_specs` and `scope_material_links` tables with their RLS policies.
    2.  **API:** Build all required API endpoints under `/api/material-specs/`.
    3.  **UI:** Create the `MaterialSpecsTab.tsx` and its sub-components (`MaterialSpecForm`, `MaterialSpecDetailModal`) to manage material specifications and link them to scope items.
    4.  **Testing:** Test the material approval workflow.

#### **6. Report Creation & Management System**

*   **Plan:** `report_creation_plan.md`
*   **Status:** **Not Implemented**
*   **Action Plan:**
    1.  **Database:** Create a migration to add the `reports`, `report_lines`, `report_line_photos`, and `report_shares` tables with RLS policies.
    2.  **API:** Build the API endpoints under `/api/reports/`, including the server-side PDF generation logic.
    3.  **UI:**
        *   Create the `ReportCreationPage`, `ReportReviewPage`, and `ReportPublishModal` components.
        *   Replace the mock `ReportsTab.tsx` with the new `ReportsListTab` that uses real data.
    4.  **Testing:** Test the entire report creation, PDF generation, and publishing flow.

---

### **P2 - Medium Priority Implementation Plan**

#### **1. Project Team Management System**

*   **Plan:** `project_team_management_plan.md`
*   **Status:** **Not Implemented**
*   **Action Plan:**
    1.  **Database:** Create a migration to add the `project_members` table with its RLS policy.
    2.  **API:** Build the API endpoints under `/api/projects/:projectId/members`.
    3.  **UI:** Create the `TeamTab.tsx` and `AddTeamMemberForm` components. Update the `OverviewTab` to show the real team member count.
    4.  **Integration:** Ensure the "Assigned To" dropdown in the new Task Management system filters users based on the `project_members` for the current project.

#### **2. Dashboard Design Refined**

*   **Plan:** `dashboard_design_plan.md`
*   **Status:** **Partially Implemented**
*   **Action Plan:**
    1.  **UI:**
        *   Refactor the main dashboard page (`/dashboard/page.tsx`) to implement the role-specific views for "Company Owner" and "Project Manager".
        *   Create the new PM-specific components: `MyProjectsOverview`, `MyTasksAndActions`, `RecentProjectActivity`, and `CriticalAlerts`.
    2.  **Data Integration:** Connect these new dashboard components to the P1 APIs (Tasks, Milestones, Projects) to display real, actionable data.

#### **3. Client Dashboard View**

*   **Plan:** `client_dashboard_plan.md`
*   **Status:** **Not Implemented**
*   **Action Plan:**
    1.  **API:** Build the secure, client-facing API endpoints under `/api/client/`.
    2.  **UI:** Create the `ClientDashboardPage` and all its sub-components (`ClientProjectList`, `ClientProjectOverview`, etc.) under a `src/components/client-portal/` directory.
    3.  **Security:** Pay extreme attention to the RLS policies and API logic to ensure clients can *only* see data explicitly shared with them.
