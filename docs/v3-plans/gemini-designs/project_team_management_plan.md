## Project Team Management System Design

### **1. Core Objectives**

*   Enable Project Managers (PMs) or authorized users to assign internal team members to specific projects.
*   Define roles for team members within each project.
*   Provide a clear list of all team members assigned to a project.
*   Populate the "Team Members" count in the `OverviewTab` with accurate data.
*   Facilitate notifications for new project assignments.

### **2. Workflow Overview**

1.  **Access Team Management:** From the "Project Management Workspace" (`/projects/[id]`), a new section or tab (e.g., "Team" or "Members") will be accessible.
2.  **Assign Team Member:** An authorized user selects an existing internal user and assigns them to the current project, optionally defining their project-specific role (e.g., "Site Engineer," "Architect," "Foreman").
3.  **View Project Team:** A list of all assigned team members for the project is displayed, along with their roles.
4.  **Remove Team Member:** An authorized user can remove a team member from a project.
5.  **Notifications:** Assigned team members receive a notification about their new project assignment.

### **3. Data Model (Supabase/PostgreSQL)**

*   **`project_members`** (**NEW table**)
    *   `id` (UUID, PK)
    *   `project_id` (UUID, FK to `projects.id`)
    *   `user_id` (UUID, FK to `users.id`)
    *   `project_role` (TEXT, e.g., "Site Engineer", "Project Coordinator", "Foreman", "Architect")
    *   `assigned_at` (TIMESTAMP)
    *   `assigned_by` (UUID, FK to `users.id`)
    *   *(Optional: `is_active` BOOLEAN, default TRUE - if you want to soft-delete assignments)*

*   **`users`** (Existing table)
    *   `id`, `first_name`, `last_name`, `email`, `role` (global role, e.g., `project_manager`, `engineer`)

### **4. API Endpoints (Next.js API Routes)**

*   **`POST /api/projects/:projectId/members`**: Assign a user to a project.
    *   **Payload:** `{ user_id, project_role }`
*   **`GET /api/projects/:projectId/members`**: Retrieve all team members for a specific project.
*   **`DELETE /api/projects/:projectId/members/:userId`**: Remove a user from a project.
*   **`GET /api/users`**: (Existing or new) To get a list of all internal users for assignment dropdowns.

### **5. User Interface (UI) Components**

*   **`TeamTab.tsx` (within `src/components/projects/tabs/`):**
    *   **Summary Card:** Displays "Total Team Members" (count of `project_members` for the project).
    *   **Team Member List/Table:**
        *   Displays `project_members` records.
        *   Columns: Member Name, Email, Project Role, Global Role, Actions (Remove).
    *   **"Add Team Member" Button:** Opens `AddTeamMemberForm`.

*   **`AddTeamMemberForm` (Modal):**
    *   Dropdown to select an existing internal user (from `GET /api/users`).
    *   Input field/Dropdown for `project_role`.
    *   "Assign" button.

*   **`OverviewTab.tsx` (Modification):**
    *   The "Team Members" count will now fetch data from `GET /api/projects/:projectId/members` and display the count of records.

### **6. Permissions & Security**

*   **Leverage `useAuth` and `usePermissions`:**
    *   **`project_members.manage`:** Permission to add/remove/edit project members (e.g., PMs, Admins).
    *   **`project_members.view`:** Permission to view project members (e.g., all project members).
*   **Row-Level Security (RLS) in Supabase:** Implement RLS on `project_members` to ensure users can only manage/view members for projects they are authorized for.

### **7. Notifications**

*   **In-App Notifications:** "You have been assigned to Project 'X' as a [Project Role]."
*   **Email Notifications:** For new project assignments.

### **8. Integration with Other Features**

*   **OverviewTab:** Directly populates the "Team Members" count.
*   **Task Management:** The "Assigned To" dropdown in task creation/editing will filter users based on `project_members` for the current project, ensuring tasks are assigned to actual project team members.
*   **Reports:** Can be used to filter reports by team member or generate team-specific activity reports.
