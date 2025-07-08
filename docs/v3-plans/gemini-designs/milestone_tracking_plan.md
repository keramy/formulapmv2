**TO: AI Agent**
**FROM: Gemini CLI Agent**
**SUBJECT: Milestone Tracking System Implementation Plan**
**DATE: 8 Temmuz 2025 Salı**

**OVERVIEW:**
This plan outlines the design and implementation of a Milestone Tracking System. The objective is to enable users to define, track, and manage key project milestones, providing essential data for project overview and future timeline visualizations.

**PRIORITIZATION:**
This feature should be implemented after the core critical problem fixes are complete, as it relies on a stable application foundation.

---

### **1. Core Objectives**

*   Enable users to define key milestones for each project.
*   Track milestone target dates and actual completion dates.
*   Monitor milestone status (e.g., upcoming, completed, overdue).
*   Populate the "Next Milestone" section in the `OverviewTab` with real data.
*   Provide data for future timeline visualizations (e.g., Gantt charts).

### **2. Workflow Overview**

1.  **Milestone Creation:** A user (e.g., PM) creates a new milestone for a project, defining its name, a target due date, and a description.
2.  **Milestone Tracking:** Users can view a list of all milestones for a project, seeing their target dates and current status.
3.  **Milestone Completion:** When a milestone is achieved, a user marks it as "completed" and records the actual completion date.
4.  **Notifications:** Relevant stakeholders can be notified when a milestone is approaching or completed.

### **3. Data Model (Supabase/PostgreSQL)**

*   **`milestones`** (**NEW table**)
    *   `id` (UUID, PK)
    *   `project_id` (UUID, FK to `projects.id`)
    *   `name` (TEXT, e.g., "Foundation Complete", "Structural Steel Erected")
    *   `description` (TEXT, nullable)
    *   `target_date` (DATE)
    *   `actual_date` (DATE, nullable - date when milestone was actually completed)
    *   `status` (ENUM: `upcoming`, `completed`, `overdue`, `cancelled`)
    *   `created_by` (UUID, FK to `users.id`)
    *   `created_at` (TIMESTAMP)
    *   `updated_at` (TIMESTAMP)

### **4. API Endpoints (Next.js API Routes)**

*   **`POST /api/milestones`**: Create a new milestone.
*   **`GET /api/projects/:projectId/milestones`**: Retrieve all milestones for a specific project.
*   **`GET /api/milestones/:milestoneId`**: Retrieve details of a specific milestone.
*   **`PUT /api/milestones/:milestoneId`**: Update a milestone (e.g., status, actual date, name, description).
*   **`DELETE /api/milestones/:milestoneId`**: Delete a milestone.
*   **`GET /api/projects/:projectId/next-milestone`**: Retrieve the next upcoming milestone for a project (for `OverviewTab`).

### **5. User Interface (UI) Components**

*   **`MilestonesTab.tsx` (within `src/components/projects/tabs/`):**
    *   **Summary Cards:**
        *   Total Milestones (count)
        *   Completed Milestones (count)
        *   Overdue Milestones (count)
        *   Upcoming Milestones (count)
    *   **Milestone List/Table:**
        *   Displays `milestones` records.
        *   Columns: Milestone Name, Target Date, Actual Date, Status, Actions (View Details, Edit, Mark Complete).
    *   **"Create New Milestone" Button:** Opens `MilestoneForm`.

*   **`MilestoneForm` (Modal/Page):**
    *   Fields for `name`, `description`, `target_date`.
    *   "Save" button.

*   **`MilestoneDetailModal` / `MilestoneDetailPage`:**
    *   Displays all details of a `milestone`.
    *   Allows editing of fields.
    *   "Mark Complete" button (which sets `status` to `completed` and `actual_date` to current date).

*   **`OverviewTab.tsx` (Modification):**
    *   The "Next Milestone" section will now fetch data from `GET /api/projects/:projectId/next-milestone` and display the real milestone name, target date, and days remaining.

### **6. Permissions & Security**

*   **Leverage `useAuth` and `usePermissions`:**
    *   **`milestones.create`:** Permission to create milestones.
    *   **`milestones.edit`:** Permission to edit milestones (e.g., PMs).
    *   **`milestones.view`:** Permission to view milestones (e.g., all project members).
*   **Row-Level Security (RLS) in Supabase:** Implement RLS on `milestones` to ensure users can only access milestones within projects they are authorized for.

### **7. Notifications**

*   **In-App Notifications:**
    *   "Milestone 'X' is approaching (due in 7 days)."
    *   "Milestone 'Y' has been completed."
*   **Email Notifications:** For critical milestone updates.

### **8. Integration with Other Features**

*   **OverviewTab:** Directly populates the "Next Milestone" section.
*   **PM Dashboard:** Can display upcoming or overdue milestones relevant to the PM.
*   **Gantt Chart (Future):** The `milestones` table will provide the necessary data points (`name`, `target_date`, `actual_date`, `status`) to render milestones on a Gantt chart visualization. The Gantt chart component would simply query `GET /api/projects/:projectId/milestones` and display them.

### **9. Implementation Steps for AI Agent**

1.  **Database Schema Implementation:**
    *   Create SQL migration files for the `milestones` table in `supabase/migrations/`.
    *   Define appropriate RLS policies for this table.

2.  **API Route Development:**
    *   Create new API routes under `src/app/api/milestones/` for the endpoints defined in Section 4.

3.  **UI Component Development:**
    *   Create `MilestonesTab.tsx` within `src/components/projects/tabs/`.
    *   Develop `MilestoneForm.tsx` and `MilestoneDetailModal.tsx` (or `MilestoneDetailPage.tsx`) within a new `src/components/projects/milestones/` directory.
    *   Integrate these components into `MilestonesTab.tsx`.
    *   Modify `OverviewTab.tsx` to fetch and display real milestone data.

4.  **Permissions Integration:**
    *   Update `src/lib/permissions.ts` (or equivalent) to define the new `milestones` permissions.
    *   Integrate permission checks into API routes and UI components.

5.  **Notification System Integration:**
    *   Implement logic to trigger in-app and email notifications for milestone events.

6.  **Testing:**
    *   Write unit and integration tests for API routes and core UI components.
    *   Manually test the full workflow for milestone creation, tracking, and completion.
