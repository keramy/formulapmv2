## Scope List Tab Design (Refined - Manual Group Progress)

### **1. Core Objectives**

*   Organize scope items into predefined categories (Construction, Millwork, Electrical, Mechanical, Misc.).
*   Track progress at the group level **manually**.
*   Enable robust import/export functionality using XLSM format with a template system.
*   Track `initial_cost`, `sell_price`, and `actual_cost` for each item to facilitate project financial calculations.
*   Allow flexible supplier assignment (individual and bulk) and track payments to suppliers.
*   Implement dependency tracking for "Millwork" items based on shop drawing and material approvals.

### **2. Data Model (Supabase/PostgreSQL - Refinements)**

*   **`scope_items`** (Existing table, with additions)
    *   `id` (UUID, PK)
    *   `project_id` (UUID, FK to `projects.id`)
    *   `name` (TEXT)
    *   `description` (TEXT)
    *   `status` (ENUM: `not_started` | `in_progress` | `completed` | `on_hold`)
    *   `priority` (ENUM: `low` | `medium` | `high`)
    *   `initial_cost` (NUMERIC, **NEW - maps to `estimatedCost`**)
    *   `sell_price` (NUMERIC, **NEW**)
    *   `actual_cost` (NUMERIC, optional)
    *   `assigned_to` (UUID, FK to `users.id`, nullable)
    *   `start_date` (DATE, optional)
    *   `end_date` (DATE, optional)
    *   `supplier_id` (UUID, FK to `suppliers.id`, nullable)
    *   `category` (ENUM: `construction` | `millwork` | `electrical` | `mechanical` | `misc`, **Refined - now a strict ENUM for grouping**)
    *   `group_progress_percentage` (NUMERIC, **NEW - for manual input/display at group level**)
    *   `created_at` (TIMESTAMP)
    *   `updated_at` (TIMESTAMP)

*   **`suppliers`** (Existing table, already planned/used)
    *   `id`, `name`, `contact_person`, `email`, `phone`, `specialties`, `total_payments` (this `total_payments` will be derived from `scope_items.actual_cost` assigned to them).

*   **`shop_drawing_submissions`** (From Shop Drawing Plan - for Millwork dependencies)
    *   `status` (e.g., `approved`, `pending_internal_review`, `rejected`)

*   **`material_specs`** (From Material Approval Plan - for Millwork dependencies)
    *   `status` (e.g., `approved`, `pending_approval`, `rejected`)

### **3. API Endpoints (Next.js API Routes - Additions/Refinements)**

*   **`GET /api/scope?project_id=:projectId`**: (Existing, but will now return `initial_cost`, `sell_price`, and `group_progress_percentage`).
*   **`PUT /api/scope/:scopeItemId`**: (Existing, for individual updates, including `group_progress_percentage` if updated via UI).
*   **`PUT /api/scope/bulk-update-status`**: (Existing plan, will be extended).
*   **`PUT /api/scope/bulk-assign-supplier`** (NEW)
    *   **Purpose:** Assign a supplier to multiple selected scope items.
    *   **Auth:** Authenticated user with `scope_items.edit` permission.
    *   **Payload:**
        ```json
        {
          "scopeItemIds": ["uuid1", "uuid2", "uuid3"],
          "supplierId": "supplier_uuid" // The supplier to assign
        }
        ```
*   **`GET /api/scope/export-template`** (NEW)
    *   **Purpose:** Download an XLSM template for scope item import.
    *   **Auth:** Authenticated user.
    *   **Action:** Generate a pre-formatted XLSM file with required columns (Name, Description, Category, Initial Cost, Sell Price, Status, Priority, Group Progress Percentage, etc.).
*   **`POST /api/scope/import`** (NEW)
    *   **Purpose:** Upload and import scope items from an XLSM file.
    *   **Auth:** Authenticated user with `scope_items.create` permission.
    *   **Payload:** Multipart form data containing the XLSM file.
    *   **Action:**
        *   Receive and parse the XLSM file on the server (using a library like `xlsx`).
        *   Validate data against expected format and types.
        *   Perform bulk insert/update of scope items into the database.
        *   Handle errors (e.g., invalid data, missing required fields).
*   **`GET /api/scope/export/:projectId`** (NEW)
    *   **Purpose:** Export all scope items for a project as an XLSM file.
    *   **Auth:** Authenticated user with `scope_items.view` permission.
    *   **Action:** Fetch all scope items for the project, format them into an XLSM, and send the file as a response.
*   **`GET /api/projects/:projectId/financial-summary`** (NEW - for Dashboard integration)
    *   **Purpose:** Calculate and return project-level financial summaries (Total Initial Cost, Total Sell Price, Total Actual Cost) based on scope items.
    *   **Auth:** Authenticated user.

### **4. User Interface (UI) Components - `ScopeListTab.tsx` Refinements**

*   **Summary Cards (Refined):**
    *   Total Scope Items (count)
    *   Total Initial Cost (sum of `initial_cost`)
    *   Total Sell Price (sum of `sell_price`)
    *   Total Actual Cost (sum of `actual_cost`)
    *   Assigned Suppliers (count)
*   **Supplier Breakdown (Existing):** Will continue to show payment distribution.
*   **Import/Export Section:**
    *   Prominent "Import Scope" and "Export Scope" buttons.
    *   "Download Template" button next to "Import Scope."
    *   File input for import.
*   **Grouping & Group Progress:**
    *   Scope items will be rendered grouped by their `category` (Construction, Millwork, Electrical, Mechanical, Misc.).
    *   Each group will have a header displaying:
        *   Group Name (e.g., "Millwork")
        *   **Group Progress Bar/Status (Manual):** This will be a display of the `group_progress_percentage` stored with the group (or a representative item in the group). It will likely be an input field or a simple display that can be manually updated by a user with edit permissions.
        *   Group Financial Summary (Total Initial Cost, Total Sell Price, Total Actual Cost for that group).
*   **Individual Scope Item Display:**
    *   Remove individual progress bars/status.
    *   Display `initial_cost`, `sell_price`, `actual_cost` clearly.
    *   **Millwork Dependencies Indicator:** For items in the "Millwork" category, add a visual indicator (e.g., a small icon, badge, or text) if there are pending shop drawing approvals or material approvals related to that scope item. This indicator should be clickable to navigate to the relevant shop drawing or material spec.
*   **Bulk Actions (Extended):**
    *   The existing bulk status update UI will be extended.
    *   Add a "Bulk Assign Supplier" option to the bulk actions dropdown.
    *   When "Bulk Assign Supplier" is selected, a dropdown of available suppliers appears.

### **5. Permissions & Security**

*   **`scope_items.import`:** New permission for importing scope.
*   **`scope_items.export`:** New permission for exporting scope.
*   **`scope_items.edit`:** Required for bulk status and supplier assignment, and for manually updating `group_progress_percentage`.
*   **RLS:** Continue to enforce RLS on `scope_items` to ensure users only import/export/view/edit items for projects they are authorized for.

### **6. Backend Logic (Key Implementations)**

*   **XLSM Parsing/Generation:** Use a robust Node.js library (e.g., `xlsx` or `exceljs`) on the server for reading and writing XLSM files.
*   **Data Validation:** Implement strict validation rules for imported data to prevent corruption.
*   **Dependency Checking:** For Millwork items, query `shop_drawing_submissions` and `material_specs` tables to determine approval statuses and display indicators.
