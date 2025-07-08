### **Project Tab Data - Current State & Observations (Revised)**

---

#### **1. `OverviewTab.tsx`**

**Purpose:** Provides a high-level summary of the project.

**Current Data Displayed:**

*   **Basic Project Information (from `project` object):**
    *   Location (`project.location`)
    *   Start Date (`project.start_date`)
    *   End Date (`project.end_date`)
    *   Total Budget (`project.budget` - permission-gated)
    *   Overall Progress Percentage (`project.progress_percentage`)
*   **Progress & Statistics (from `mockStats` - **MOCK DATA**):**
    *   Total Tasks
    *   Completed Tasks
    *   Team Members
    *   ~~Documents~~ (Removed - as per your note, this is unnecessary if not tied to a real document management system or specific metric.)
*   **Budget Summary (from `mockStats` - **MOCK DATA** & calculated):**
    *   Budget Spent
    *   Budget Remaining
    *   Budget Utilization Percentage
    *   **Clarification:** This budget calculation (`project.budget` vs. `mockStats.budgetSpent/Remaining`) is currently based on mock data. **For real data, it should indeed be calculated from the `ScopeListTab` feature's estimated and actual costs, and potentially other financial inputs from the project.**
*   **Next Milestone (from `mockStats` - **MOCK DATA**):**
    *   Milestone Name
    *   Target Date
    *   Days Remaining
*   **Team Summary (from `mockStats` - **MOCK DATA**):**
    *   Active Team Members
*   **Risk Level (from `mockStats` - **MOCK DATA**):**
    *   Risk Level (e.g., 'low', 'medium', 'high')

**Observations:** A significant portion of the data here is currently mocked. To make this tab truly useful, the `mockStats` data needs to be replaced with real data fetched from your backend (e.g., from task management, and a consolidated budget/cost tracking system).

---

#### **2. `ScopeListTab.tsx`**

**Purpose:** Displays a detailed list of all scope items for the project.

**Current Data Displayed:**

*   **Summary Cards:**
    *   Total Scope Items (count)
    *   Estimated Total Cost (sum of `estimatedCost` from scope items)
    *   Actual Spent (sum of `actualCost` from scope items)
    *   Assigned Suppliers (count of unique suppliers)
*   **Supplier Breakdown (from `api/suppliers/totals`):**
    *   Supplier Name
    *   Total Estimated Cost for that supplier
    *   Total Actual Cost for that supplier
    *   Number of scope items assigned to that supplier
*   **Individual Scope Item Details (from `api/scope`):**
    *   ID
    *   Name
    *   Description
    *   Status (`not_started`, `in_progress`, `completed`, `on_hold`)
        *   **Adjustment:** This should also have a **bulk update feature** for status.
    *   Priority (`low`, `medium`, `high`)
    *   Estimated Cost
    *   Actual Cost (optional)
    *   Assigned To (user name, optional)
    *   Start Date (optional)
    *   End Date (optional)
    *   Supplier Name (optional, with inline editing for assignment)
    *   Supplier ID (optional)
    *   Category

**Observations:** This tab is well-structured and already fetches real data for scope items and suppliers.

---

#### **3. `MaterialSpecsTab.tsx`**

**Purpose:** This feature aims to follow up the materials that will be used in specific scope items. Example: For a millwork item, it should have wood, metal, glass, marble material selected and approved, so we can manufacture that.

**Current Data Displayed:**

*   **Summary Cards:**
    *   Total Materials (count)
    *   ~~Total Value~~ (Removed - not needed)
    *   ~~Delivered~~ (Removed - not needed)
    *   Pending (count of materials with 'pending' status)
*   **Individual Material Specification Details (from `mockMaterialSpecs` - **MOCK DATA**):**
    *   ID
    *   Name
    *   Description
    *   Specification
    *   Status (`pending`, `ordered`, `in_transit`, `delivered`, `installed`, `rejected`)
    *   Priority (`low`, `medium`, `high`)
    *   Category
    *   Supplier
    *   ~~Quantity~~ (Removed - not needed)
    *   ~~Unit~~ (Removed - not needed)
    *   ~~Unit Price~~ (Removed - not needed)
    *   ~~Total Price~~ (Removed - not needed)
    *   ~~Order Date (optional)~~ (Removed - not needed)
    *   ~~Expected Delivery Date (optional)~~ (Removed - not needed)
    *   ~~Actual Delivery Date (optional)~~ (Removed - not needed)
    *   Notes (optional)
    *   Associated Scope Item ID (optional) - Confirmed this should be optional and linkable if required.

**Observations:** This tab currently uses mock data. To be functional, it needs to fetch real material specification data from your backend, focusing on the revised data points.

---

#### **4. `ReportsTab.tsx`**

**Purpose:** Displays a collection of all reports related to the project.

**Current Data Displayed:**

*   **Adjustment:** This tab will be **removed from the project view** and re-implemented as a **standalone feature** with a simplified report creation process.

**Observations:** This tab currently uses mock data. Its functionality will be redesigned and moved.

---

#### **5. `ShopDrawingsTab.tsx`**

**Purpose:** Manages shop drawing submissions and approvals.

**Current Data Displayed:**

*   **Summary Cards:**
    *   Total Drawings (count)
    *   Approved Drawings (count)
    *   Under Review Drawings (count)
    *   Need Revision Drawings (count)
*   **Individual Shop Drawing Details (from `mockShopDrawings` - **MOCK DATA**):**
    *   ID
    *   Name
    *   Description
    *   Status (`pending`, `under_review`, `approved`, `rejected`, `revision_required`)
    *   Priority (`low`, `medium`, `high`)
    *   Submitted By
    *   Submitted Date
    *   Reviewed By (optional)
    *   Reviewed Date (optional)
    *   Version
    *   Category
    *   Notes (optional)
    *   File Size
    *   File Type

**Observations:** This tab currently uses mock data. As we've planned, this will be replaced by the new shop drawing approval system, which will fetch real data.

---

### **Consolidated List of Data Points (Current & Planned for Real Data - Revised)**

**Project-Level Data (from `OverviewTab` and `useProject` hook):**
*   Project ID
*   Project Name (implied, but not explicitly shown in `OverviewTab` code, likely in `ProjectHeader`)
*   Location
*   Start Date
*   End Date
*   Total Budget
*   Overall Progress Percentage
*   Total Tasks (from task management system)
*   Completed Tasks (from task management system)
*   Team Members (from user/project assignment system)
*   Budget Spent (from Scope List and other financial inputs)
*   Budget Remaining (from Scope List and other financial inputs)
*   Risk Level (from a risk management system, if implemented)
*   Next Milestone, Milestone Date (from a milestone tracking system)

**Scope Management Data (from `ScopeListTab`):**
*   Scope Item ID, Name, Description
*   Scope Item Status, Priority, Category
*   Estimated Cost, Actual Cost
*   Assigned To (User)
*   Scope Item Start Date, End Date
*   Supplier Name, Supplier ID (with assignment capability)
*   Supplier Totals (Estimated, Actual, Item Count)
*   **New Feature:** Bulk update for status.

**Material Specification Data (from `MaterialSpecsTab` - *currently mock, will be real*):**
*   Material ID, Name, Description, Specification
*   Material Status, Priority, Category
*   Supplier
*   Notes
*   Associated Scope Item ID (optional)

**Report Data (from `ReportsTab` - *will be removed from project view and become standalone*):**
*   (No longer part of project-specific tab)

**Shop Drawing Data (from `ShopDrawingsTab` - *currently mock, will be replaced by new system*):**
*   Shop Drawing ID, Name, Description
*   Shop Drawing Status, Priority, Category
*   Submitted By, Submitted Date
*   Reviewed By, Reviewed Date
*   Version
*   Notes
*   File Size, File Type

---

**Notes for Revision:**

*   *(Add your notes here, next to each data point or section, to indicate what you want to adjust, remove, or add.)*