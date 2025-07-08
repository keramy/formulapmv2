## Shop Drawing Approval System Design - Core Implementation

### 1. Core Objectives

*   Enable internal project managers (PMs) to upload shop drawing submissions.
*   Facilitate a clear, auditable approval workflow involving both internal stakeholders and external clients.
*   Provide version control for all shop drawing submissions.
*   Ensure secure access and relevant views for different user roles.
*   Integrate seamlessly into the new "Project Management Workspace" (Phase 3 of `simplfyapp.md`).

### 2. Key Actors & Roles

*   **Internal Users (PM, GM, etc.):**
    *   **Uploader:** Can upload new shop drawing submissions.
    *   **Internal Reviewer/Approver:** Can review, comment on, and provide internal approval/rejection.
    *   **Final Internal Approver:** Can mark a drawing as "Ready for Client Review" or "Internally Approved."
*   **Client Users:**
    *   **Client Reviewer/Approver:** Can view, comment on, and provide final client approval/rejection.

### 3. Workflow Overview

1.  **Submission:** An internal user (e.g., PM) uploads a new shop drawing file (PDF, image) for a specific project. This creates a new "submission" (version).
2.  **Internal Review:** The submission enters an internal review queue. Internal reviewers examine the drawing, add comments, and provide their feedback/approval.
3.  **Internal Approval:** Once all internal reviews are complete and the drawing is deemed ready, a designated internal approver marks it as "Ready for Client Review."
4.  **Client Review:** The client is notified and gains access to the drawing. They review, add comments, and provide their approval or rejection.
5.  **Final Status:**
    *   **Approved:** If the client approves, the drawing is marked as "Approved."
    *   **Approved with Comments:** Client approves but provides comments for minor revisions.
    *   **Rejected:** Client rejects, requiring a new submission (new version).
    *   **Resubmission:** If rejected or approved with comments, the internal team makes revisions and uploads a new version, restarting the workflow from step 1.

### 4. Data Model (Supabase/PostgreSQL)

We'll use the following tables, leveraging existing `users` and `projects` tables:

*   **`shop_drawings`** (Master record for a drawing)
    *   `id` (UUID, PK)
    *   `project_id` (UUID, FK to `projects.id`)
    *   `title` (TEXT, e.g., "HVAC Ducting - Level 3")
    *   `discipline` (TEXT, e.g., "Mechanical", "Architectural")
    *   `current_submission_id` (UUID, FK to `shop_drawing_submissions.id`, nullable - points to the latest active submission)
    *   `created_at` (TIMESTAMP)
    *   `created_by` (UUID, FK to `users.id`)

*   **`shop_drawing_submissions`** (Each version submitted for review)
    *   `id` (UUID, PK)
    *   `shop_drawing_id` (UUID, FK to `shop_drawings.id`)
    *   `version_number` (INT, e.g., 1, 2, 3)
    *   `file_url` (TEXT, URL to the stored drawing file in Supabase Storage)
    *   `status` (ENUM: `pending_internal_review`, `ready_for_client_review`, `pending_client_review`, `approved`, `approved_with_comments`, `rejected`, `resubmitted`)
    *   `submitted_at` (TIMESTAMP)
    *   `submitted_by` (UUID, FK to `users.id`)
    *   `internal_review_completed_at` (TIMESTAMP, nullable)
    *   `client_review_completed_at` (TIMESTAMP, nullable)

*   **`shop_drawing_reviews`** (Records each review action)
    *   `id` (UUID, PK)
    *   `submission_id` (UUID, FK to `shop_drawing_submissions.id`)
    *   `reviewer_id` (UUID, FK to `users.id`)
    *   `review_type` (ENUM: `internal`, `client`)
    *   `action` (ENUM: `approved`, `approved_with_comments`, `rejected`, `commented`)
    *   `comments` (TEXT, nullable)
    *   `reviewed_at` (TIMESTAMP)

### 5. API Endpoints (Next.js API Routes)

*   **`POST /api/shop-drawings`**
    *   **Purpose:** Create a new shop drawing record and its initial submission.
    *   **Auth:** Internal user (PM, Uploader role).
    *   **Payload:** `{ project_id, title, discipline, file_data }`
    *   **Action:** Upload file to Supabase Storage, create `shop_drawings` entry, create `shop_drawing_submissions` entry (status: `pending_internal_review`).

*   **`GET /api/shop-drawings/:projectId`**
    *   **Purpose:** Retrieve all shop drawings for a given project.
    *   **Auth:** Authenticated user (internal or client, with project access).
    *   **Response:** List of `shop_drawings` records, including `current_submission_id` and its `status`.

*   **`GET /api/shop-drawings/submissions/:submissionId`**
    *   **Purpose:** Retrieve details of a specific shop drawing submission (including file URL and associated reviews).
    *   **Auth:** Authenticated user (internal or client, with access to the submission).
    *   **Response:** `shop_drawing_submissions` record, and related `shop_drawing_reviews`.

*   **`POST /api/shop-drawings/submissions/:submissionId/review`**
    *   **Purpose:** Record a review action (approve, reject, comment).
    *   **Auth:** Authenticated user (internal or client, with appropriate review permissions).
    *   **Payload:** `{ action, comments }`
    *   **Action:** Create `shop_drawing_reviews` entry, update `shop_drawing_submissions.status` based on `action` and `review_type`. Trigger notifications.

*   **`POST /api/shop-drawings/submissions/:submissionId/ready-for-client`**
    *   **Purpose:** Mark an internal submission as ready for client review.
    *   **Auth:** Internal user (Final Internal Approver role).
    *   **Action:** Update `shop_drawing_submissions.status` to `pending_client_review`. Trigger client notification.

### 6. User Interface (UI) Components

These components would reside within `src/components/projects/tabs/ShopDrawingsTab.tsx` and its sub-components.

*   **`ShopDrawingListTable`:**
    *   Displays a table of all shop drawings for the current project.
    *   Columns: Title, Discipline, Latest Version, Current Status, Last Updated, Actions (View, Upload New Version).
    *   Visual cues for status (e.g., color-coded badges).

*   **`ShopDrawingDetailModal` / `ShopDrawingDetailPage`:**
    *   Opened when a user clicks "View" on a drawing.
    *   Displays the current version of the shop drawing (PDF viewer/image display).
    *   **Version History:** A sidebar or dropdown to navigate previous submissions/versions.
    *   **Review Section:**
        *   **Internal View:** Shows internal review comments and actions. Buttons for "Approve Internally," "Reject Internally," "Add Comment," "Mark Ready for Client Review."
        *   **Client View:** Shows client review comments. Buttons for "Approve," "Approve with Comments," "Reject," "Add Comment."
    *   **Audit Trail:** A chronological log of all actions (uploads, reviews, status changes).

*   **`ShopDrawingUploadForm`:**
    *   A modal or dedicated form for uploading a new shop drawing file.
    *   Fields: Title, Discipline, File Upload.
    *   Handles file storage to Supabase.

### 7. Permissions & Security

*   **Leverage `useAuth` and `usePermissions`:**
    *   **`shop_drawings.upload`:** Only internal users with this permission can upload.
    *   **`shop_drawings.internal_review`:** Only internal users with this permission can perform internal reviews.
    *   **`shop_drawings.client_review`:** Only client users associated with the project can perform client reviews.
    *   **`shop_drawings.view`:** All authenticated users associated with the project can view.
*   **Row-Level Security (RLS) in Supabase:** Implement RLS policies on `shop_drawings`, `shop_drawing_submissions`, and `shop_drawing_reviews` tables to ensure users can only access data related to projects they are authorized for.
*   **Supabase Storage Security:** Configure storage buckets with appropriate policies to restrict file access based on user authentication and project association.

### 8. Notifications

*   **In-App Notifications:** Use a notification system (e.g., `src/app/notifications/`) to alert users.
    *   "New shop drawing submitted for Project X."
    *   "Shop drawing Y is ready for your internal review."
    *   "Shop drawing Z is ready for client review."
    *   "Client has approved/rejected shop drawing A."
*   **Email Notifications:** For critical status changes (e.g., "Ready for Client Review," "Client Approved/Rejected"), send email notifications to relevant parties.

### 9. Implementation Steps for AI Agent

1.  **Database Schema Implementation:**
    *   Create SQL migration files for `shop_drawings`, `shop_drawing_submissions`, and `shop_drawing_reviews` tables in `supabase/migrations/`.
    *   Define appropriate RLS policies for these tables.

2.  **Supabase Storage Configuration:**
    *   Create a new Supabase Storage bucket (e.g., `shop-drawings`).
    *   Configure storage policies for secure file uploads and downloads.

3.  **API Route Development:**
    *   Create new API routes under `src/app/api/shop-drawings/` for the endpoints defined in Section 5.
    *   Implement logic for file uploads, database interactions, and status updates.

4.  **UI Component Development:**
    *   Create `ShopDrawingsTab.tsx` within `src/components/projects/tabs/`.
    *   Develop `ShopDrawingListTable.tsx`, `ShopDrawingDetailModal.tsx` (or `ShopDrawingDetailPage.tsx`), and `ShopDrawingUploadForm.tsx` within a new `src/components/projects/shop-drawings/` directory.
    *   Integrate these components into `ShopDrawingsTab.tsx`.

5.  **Permissions Integration:**
    *   Update `src/lib/permissions.ts` (or equivalent) to define the new `shop_drawings` permissions.
    *   Integrate permission checks into API routes and UI components.

6.  **Notification System Integration:**
    *   Implement logic to trigger in-app notifications for status changes.
    *   Set up basic email notifications for critical workflow events.

7.  **Testing:**
    *   Write unit and integration tests for API routes and core UI components.
    *   Manually test the full workflow for internal and client users.

**Note to AI Agent:** This plan focuses on the core functionality. Future enhancements (automated reminders, advanced reporting, deeper task management integration) will be discussed and planned separately. Ensure all changes adhere to existing project conventions and coding standards.