## Material Approvals & Management System Design

### **1. Core Objectives**

*   Define and track specific material requirements for project scope items.
*   Facilitate a clear approval process for material specifications.
*   Link approved materials directly to their associated scope items.
*   Provide a centralized repository for material specifications and their approval status.

### **2. Workflow Overview**

1.  **Material Specification Creation:**
    *   A user (e.g., PM, Designer) creates a new material specification entry.
    *   They define the material's name, detailed description, and technical specifications.
    *   They can optionally link it to one or more existing scope items.
    *   The initial status is `pending_approval`.

2.  **Internal Review & Approval:**
    *   Designated internal reviewers (e.g., Project Engineer, Architect) review the material specification.
    *   They can add comments, request revisions, or approve the specification.
    *   Once approved, the status changes to `approved`.

3.  **Supplier Association (Optional but useful):**
    *   A supplier can be associated with the approved material specification, indicating who would provide it (even if not tracking orders/delivery).

4.  **Usage in Manufacturing/Construction:**
    *   Approved materials are ready for use in manufacturing processes or on-site construction, ensuring only specified and approved materials are utilized.

### **3. Data Model (Supabase/PostgreSQL)**

We'll refine the `MaterialSpec` interface and propose a new table.

*   **`material_specs`** (Main record for a material specification)
    *   `id` (UUID, PK)
    *   `project_id` (UUID, FK to `projects.id`)
    *   `name` (TEXT, e.g., "Oak Veneer - Quarter Sawn")
    *   `description` (TEXT, e.g., "For millwork panels in main lobby")
    *   `specification` (TEXT, detailed technical specs, e.g., "Grade A, FSC certified, 0.6mm thickness, clear finish")
    *   `status` (ENUM: `pending_approval`, `approved`, `rejected`, `revision_required`)
    *   `priority` (ENUM: `low`, `medium`, `high`)
    *   `category` (TEXT, e.g., "Wood", "Metal", "Glass", "Stone")
    *   `supplier_id` (UUID, FK to `suppliers.id`, nullable - links to your existing `suppliers` table)
    *   `notes` (TEXT, nullable - general notes about the material)
    *   `created_at` (TIMESTAMP)
    *   `created_by` (UUID, FK to `users.id`)
    *   `approved_by` (UUID, FK to `users.id`, nullable)
    *   `approved_at` (TIMESTAMP, nullable)

*   **`scope_material_links`** (Junction table to link materials to scope items)
    *   `id` (UUID, PK)
    *   `scope_item_id` (UUID, FK to `scope_items.id`)
    *   `material_spec_id` (UUID, FK to `material_specs.id`)
    *   `notes` (TEXT, nullable - specific notes about this material's use in this scope item)
    *   `created_at` (TIMESTAMP)

### **4. API Endpoints (Next.js API Routes)**

*   **`POST /api/material-specs`**: Create a new material specification.
*   **`GET /api/projects/:projectId/material-specs`**: Retrieve all material specifications for a given project.
*   **`GET /api/material-specs/:materialSpecId`**: Retrieve details of a specific material specification.
*   **`PUT /api/material-specs/:materialSpecId`**: Update a material specification (e.g., status, notes).
*   **`POST /api/material-specs/:materialSpecId/approve`**: Mark a material specification as approved.
*   **`POST /api/material-specs/:materialSpecId/reject`**: Mark a material specification as rejected.
*   **`POST /api/material-specs/:materialSpecId/link-scope`**: Link a material spec to a scope item.
    *   Payload: `{ scope_item_id, notes }`
*   **`DELETE /api/material-specs/:materialSpecId/unlink-scope/:scopeItemId`**: Unlink a material spec from a scope item.

### **5. User Interface (UI) Components**

The `MaterialSpecsTab.tsx` will be updated to reflect this new purpose and data.

*   **`MaterialSpecsTab.tsx` (Main View):**
    *   **Summary Cards:**
        *   Total Materials (count)
        *   Approved Materials (count)
        *   Pending Approval (count)
    *   **Search and Filters:** By Name, Status, Category, Supplier.
    *   **Material Specifications List:**
        *   Displays `material_specs` records.
        *   Columns: Name, Description, Specification (maybe truncated), Status, Priority, Category, Supplier (if linked), Actions (View Details, Edit, Approve/Reject).
    *   **"Create New Material Spec" Button:** Opens `MaterialSpecForm`.

*   **`MaterialSpecForm` (Modal/Page):**
    *   Fields for `name`, `description`, `specification`, `priority`, `category`.
    *   Dropdown to select an existing `supplier`.
    *   Multi-select dropdown/list to link to `scope_items` within the current project.
    *   "Save" button.

*   **`MaterialSpecDetailModal` / `MaterialSpecDetailPage`:**
    *   Displays all details of a `material_spec`.
    *   Shows linked `scope_items`.
    *   **Approval Section:** Buttons for "Approve," "Reject," "Request Revision," "Add Comment."
    *   Audit trail of approval actions.

### **6. Permissions & Security**

*   **Leverage `useAuth` and `usePermissions`:**
    *   **`material_specs.create`:** Permission to create new material specifications.
    *   **`material_specs.review`:** Permission to approve/reject material specifications.
    *   **`material_specs.edit`:** Permission to edit material specifications.
    *   **`material_specs.view`:** Permission to view material specifications.
*   **Row-Level Security (RLS) in Supabase:** Implement RLS on `material_specs` and `scope_material_links` to ensure users only access materials for projects they are authorized for.

### **7. Notifications**

*   **In-App Notifications:**
    *   "New material specification 'X' requires your approval."
    *   "Material specification 'Y' has been approved/rejected."
*   **Email Notifications:** For critical approval requests or status changes.
