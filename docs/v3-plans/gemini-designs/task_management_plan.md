## Task Management System Design (Refined with Comments & Mentions)

### **1. Core Objectives**

*   Enable users to create, assign, track, and manage individual tasks within projects.
*   Support task statuses, priorities, and due dates.
*   Allow for task assignments to specific team members.
*   Provide a clear overview of task progress and workload.
*   Integrate with project data (e.g., linking tasks to scope items, if desired).
*   Provide data for PM dashboards (My Tasks & Actions).
*   **Allow users to add comments to tasks.**
*   **Enable `@mention` functionality within comments to notify specific team members.**

### **2. Workflow Overview**

1.  **Task Creation:** A user (e.g., PM, Team Lead) creates a new task, associating it with a project. They define its name, description, due date, priority, and assign it to a team member.
2.  **Task Assignment:** The assigned team member is notified of the new task.
3.  **Task Progress:** Assigned users update the status of their tasks as they progress (e.g., "Not Started," "In Progress," "Completed," "On Hold").
4.  **Task Commenting:** Users can add comments to a task.
5.  **@Mention Notification:** When a user `@mentions` a team member in a comment, that team member receives a notification.
6.  **Task Tracking:** PMs and other authorized users can view all tasks for a project, filter them, and monitor their status and deadlines.
7.  **Task Completion:** Upon completion, the task status is updated, and relevant stakeholders (e.g., PM) can be notified.

### **3. Data Model (Supabase/PostgreSQL - Additions)**

*   **`tasks`** (Existing table)
    *   `id` (UUID, PK)
    *   `project_id` (UUID, FK to `projects.id`)
    *   `name` (TEXT, e.g., "Prepare Foundation Drawings")
    *   `description` (TEXT, nullable)
    *   `status` (ENUM: `not_started`, `in_progress`, `completed`, `on_hold`, `cancelled`)
    *   `priority` (ENUM: `low`, `medium`, `high`, `critical`)
    *   `due_date` (DATE, nullable)
    *   `assigned_to` (UUID, FK to `users.id`, nullable - can be unassigned)
    *   `created_by` (UUID, FK to `users.id`)
    *   `created_at` (TIMESTAMP)
    *   `updated_at` (TIMESTAMP)
    *   `completed_at` (TIMESTAMP, nullable)
    *   `scope_item_id` (UUID, FK to `scope_items.id`, nullable - Link to Scope Item)

*   **`task_comments`** (**NEW table**)
    *   `id` (UUID, PK)
    *   `task_id` (UUID, FK to `tasks.id`)
    *   `comment_text` (TEXT)
    *   `created_by` (UUID, FK to `users.id`)
    *   `created_at` (TIMESTAMP)

*   **`comment_mentions`** (**NEW table - for tracking mentions and notifications**)
    *   `id` (UUID, PK)
    *   `comment_id` (UUID, FK to `task_comments.id`)
    *   `mentioned_user_id` (UUID, FK to `users.id`)
    *   `notified_at` (TIMESTAMP, nullable - to track if notification was sent)

### **4. API Endpoints (Next.js API Routes - Additions)**

*   **`POST /api/tasks/:taskId/comments`**: Add a new comment to a task.
    *   **Payload:** `{ comment_text: "..." }`
    *   **Action:** After saving the comment, parse `comment_text` for `@mentions`. For each mention, create an entry in `comment_mentions` and trigger a notification.
*   **`GET /api/tasks/:taskId/comments`**: Retrieve all comments for a specific task.

### **5. User Interface (UI) Components - Additions**

*   **`TaskDetailModal` / `TaskDetailPage`:**
    *   **Comment Section:**
        *   A dedicated area to display a chronological list of comments.
        *   Each comment shows: author, timestamp, and comment text.
        *   An input field/textarea for adding new comments.
        *   **@Mention Input:** The comment input field should support `@mention` functionality (e.g., by suggesting team members as the user types `@`). This will require a frontend component that can parse input and suggest users.

### **6. Permissions & Security**

*   **Leverage `useAuth` and `usePermissions`:**
    *   **`tasks.create`:** Permission to create tasks.
    *   **`tasks.edit`:** Permission to edit tasks (e.g., PMs, assigned user).
    *   **`tasks.view`:** Permission to view tasks (e.g., all project members).
    *   **`tasks.assign`:** Permission to assign tasks.
    *   **`task_comments.create`:** Permission to add comments to tasks.
    *   **`task_comments.view`:** Permission to view comments on tasks.
*   **Row-Level Security (RLS) in Supabase:** Implement RLS on `tasks`, `task_comments` and `comment_mentions` to ensure users can only access tasks and comments within projects they are authorized for, and potentially only tasks assigned to them or their team.

### **7. Notifications (Refined)**

*   **In-App Notifications:**
    *   "You have been assigned a new task: 'X'."
    *   "Task 'Y' is due tomorrow."
    *   "Task 'Z' has been completed by [User]."
    *   **"You were mentioned in a comment on task 'A' by [User]."** (NEW)
*   **Email Notifications:** For critical assignments, overdue tasks, and **@mentions**.

### **8. Integration with Other Features**

*   **PM Dashboard (`MyTasksAndActions`):** Will directly consume data from the `tasks` table, filtering for tasks assigned to the logged-in PM or tasks within their projects that are overdue/due soon.
*   **OverviewTab:** The "Total Tasks" and "Completed Tasks" in the `OverviewTab` will now fetch real data from the `tasks` table, replacing the mock data.
*   **ScopeListTab:** The `scope_item_id` in the `tasks` table allows for linking tasks directly to specific scope items.
*   **Reports:** Task data can be used to generate progress reports.
