**TO: AI Agent**
**FROM: Gemini CLI Agent**
**SUBJECT: Client Dashboard View Implementation Plan**
**DATE: 8 Temmuz 2025 Salı**

**OVERVIEW:**
This plan outlines the design and implementation of a dedicated Client Dashboard View. The objective is to provide external clients with a secure, concise, and relevant overview of their associated project(s), including progress, shared reports, and shared shop drawings.

**PRIORITIZATION:**
This feature should be implemented after the core authentication refactoring (from `geminicriticalplan.md`) is complete, as secure client authentication and authorization are foundational.

---

### **1. Core Objectives**

*   Provide clients with a clear, concise overview of their assigned project(s).
*   Display key project progress indicators.
*   Show a list of reports and shop drawings specifically shared with them.
*   Facilitate secure, read-only access to relevant project information.
*   Ensure a simple and intuitive user experience.

### **2. Key Actors & Roles**

*   **Client User:** Can view project progress, shared reports, and shared shop drawings for projects they are associated with. Cannot edit or create internal project data.

### **3. Workflow Overview**

1.  **Client Login:** Client logs into the unified application.
2.  **Dashboard Landing:** Upon successful login, if the user is a `client` role, they are directed to their dedicated client dashboard.
3.  **Project Selection/Overview:**
    *   If a client is associated with only **one project**, they land directly on that project's client overview.
    *   If a client is associated with **multiple projects**, they see a list of their projects and can select one to view its details.
4.  **Project-Specific Client View:** For a selected project, the client sees:
    *   Overall project progress.
    *   Key milestones.
    *   A list of reports shared with them.
    *   A list of shop drawings shared with them (and their approval status).

### **4. Data Model (Leveraging Existing & Planned Tables)**

This dashboard will primarily consume data from existing and newly planned tables. No new tables are required for this feature, but proper data relationships and RLS are critical.

*   **`projects`**: For basic project details (name, status, progress percentage, start/end dates).
*   **`users`**: To identify the client user and their associated projects.
*   **`reports`**: For reports that have been `published` and `shared_with_client_id` (from the `report_shares` table).
*   **`shop_drawings` / `shop_drawing_submissions`**: For shop drawings that have been approved or shared with the client (and their `status`).
*   **`milestones`** (if a dedicated table exists or is planned): For key project milestones.

### **5. API Endpoints (Next.js API Routes)**

*   **`GET /api/client/projects`**:
    *   **Purpose:** Retrieve a list of projects associated with the logged-in client.
    *   **Auth:** Client user.
    *   **Response:** Array of simplified project objects (ID, Name, Current Status, Progress Percentage).
*   **`GET /api/client/projects/:projectId/overview`**:
    *   **Purpose:** Get detailed overview for a specific project for the client.
    *   **Auth:** Client user, authorized for `projectId`.
    *   **Response:** Project details, overall progress, key milestones.
*   **`GET /api/client/projects/:projectId/reports`**:
    *   **Purpose:** Get reports shared with the client for a specific project.
    *   **Auth:** Client user, authorized for `projectId`.
    *   **Response:** Array of simplified report objects (ID, Name, Type, Generated Date, PDF URL, Status).
*   **`GET /api/client/projects/:projectId/shop-drawings`**:
    *   **Purpose:** Get shop drawings shared with the client for a specific project.
    *   **Auth:** Client user, authorized for `projectId`.
    *   **Response:** Array of simplified shop drawing submission objects (ID, Name, Version, Status, Submitted Date, Reviewed Date, File URL).

### **6. User Interface (UI) Components**

This will likely reside under `src/app/client-portal/dashboard/page.tsx` or similar, depending on the final consolidation of portal systems.

*   **`ClientDashboardPage` (Main Client Landing Page):**
    *   **If multiple projects:** Displays a `ClientProjectList` component.
    *   **If single project:** Renders `ClientProjectOverview` directly.
*   **`ClientProjectList`:**
    *   A simple list or card view of projects the client is associated with.
    *   Each project card shows: Project Name, Current Status, Overall Progress Bar.
    *   Clicking a project navigates to `ClientProjectOverview`.
*   **`ClientProjectOverview` (for a single project):**
    *   **Project Header:** Project Name, Current Status.
    *   **Progress Summary Card:**
        *   Overall Project Progress (e.g., a large progress circle/bar).
        *   Key Milestones (Upcoming, Completed).
    *   **`ClientSharedReportsList`:**
        *   Displays a table/list of reports shared with the client for this project.
        *   Columns: Report Name, Type, Date, Status.
        *   "View PDF" button/icon to open the `pdf_url`.
    *   **`ClientSharedShopDrawingsList`:**
        *   Displays a table/list of shop drawings shared with the client for this project.
        *   Columns: Drawing Name, Version, Status (e.g., "Approved," "Rejected," "Pending Review"), Submitted Date.
        *   "View Drawing" button/icon to open the file.

### **7. Permissions & Security**

*   **Role-Based Access:** The unified authentication system must correctly identify `client` users.
*   **Row-Level Security (RLS) in Supabase:** **CRITICAL.** All data fetched for the client dashboard (projects, reports, shop drawings) must be strictly filtered by the client's associated `project_id` and `user_id`. Clients should *only* see data explicitly linked to them or their projects.
*   **Data Filtering at API Level:** API routes must enforce that only data relevant to the authenticated client is returned.

### **8. Notifications**

*   **In-App Notifications:** Alert clients to new shared reports, new shop drawings requiring their review, or status changes on items they've reviewed.
*   **Email Notifications:** For critical updates (e.g., "New Report Published," "Shop Drawing Requires Your Review").

### **9. Implementation Steps for AI Agent**

1.  **Database RLS Configuration:**
    *   Ensure RLS policies are correctly set up on `projects`, `reports`, `report_shares`, `shop_drawings`, and `shop_drawing_submissions` tables to restrict client access to only relevant data.

2.  **API Route Development:**
    *   Create new API routes under `src/app/api/client/` for the endpoints defined in Section 5.
    *   Implement robust data filtering based on the authenticated client's user ID and associated projects.

3.  **UI Component Development:**
    *   Create `ClientDashboardPage.tsx` (e.g., in `src/app/client-portal/dashboard/`).
    *   Develop `ClientProjectList.tsx`, `ClientProjectOverview.tsx`, `ClientSharedReportsList.tsx`, and `ClientSharedShopDrawingsList.tsx` within a new `src/components/client-portal/dashboard/` directory.

4.  **Authentication Integration:**
    *   Ensure the unified authentication system correctly identifies and routes `client` users to this dashboard.

5.  **Notification System Integration:**
    *   Implement logic to trigger in-app and email notifications for clients when new reports or shop drawings are shared with them.

6.  **Testing:**
    *   Thoroughly test client login and data access for various client scenarios (single project, multiple projects).
    *   Verify that clients cannot access data they are not authorized for.

**Note to AI Agent:** The security and RLS implementation for client data access is paramount. Pay close attention to these aspects during development.
