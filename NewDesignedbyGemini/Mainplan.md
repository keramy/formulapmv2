### **Consolidated Summary for AI Agent (Revised - CLAUDE.md)**

**Overall Goal:** Implement a robust Formula PM v2 by building essential project management features on a clean, stable foundation.

**General Instructions for AI Agent:**

*   **Adhere to Priority Order:** Strictly follow the priority levels (P1, P2). Do not begin a lower-priority task until all higher-priority tasks are complete and verified.
*   **Modular Development:** Implement each feature as a self-contained module (database, API, UI).
*   **Test Thoroughly:** After each feature implementation, run relevant tests and verify functionality.
*   **Update Documentation:** Ensure `CLAUDE.md` and other relevant project documentation are updated with new features and architectural changes.
*   **Leverage Existing Patterns:** Utilize existing project conventions, UI components (e.g., Shadcn UI), and authentication/permission hooks.
*   **RLS is Critical:** Pay extreme attention to Row-Level Security (RLS) implementation for all new tables and API endpoints, especially for client-facing data.

---

### **Prioritized Implementation Plan (Revised - CLAUDE.md)**

**P0 - Completed (Foundation & Stability)**

*   **`geminicriticalplan.md` (Critical Problems to Fix)**
    *   **Status:** **IMPLEMENTED.** This means the application now has zero TypeScript compilation errors, the authentication middleware is refactored and compatible with Next.js 15, and deprecated code has been cleaned up. This provides a stable and clean base for all subsequent development.

**P1 - Highest Priority (Core Business Features)**

*   **`task_management_plan.md` (Task Management System)**
    *   **Database:** NEW `tasks`, `task_comments`, `comment_mentions`.
    *   **Hardcoded/Logic:** Replaces mock task data in `OverviewTab`.
    *   **Why P1:** Fundamental PM feature, enables `MyTasksAndActions` on PM Dashboard, and is a prerequisite for Gantt/Calendar.
*   **`milestone_tracking_plan.md` (Milestone Tracking System)**
    *   **Database:** NEW `milestones`.
    *   **Hardcoded/Logic:** Replaces mock milestone data in `OverviewTab`.
    *   **Why P1:** Essential for project tracking, enables `Next Milestone` on `OverviewTab`, and is a prerequisite for Gantt/Calendar.
*   **`shop_drawing_approval_plan.md` (Shop Drawing Approval System)**
    *   **Database:** NEW `shop_drawings`, `shop_drawing_submissions`, `shop_drawing_reviews`.
    *   **Hardcoded/Logic:** Replaces mock shop drawing data in `ShopDrawingsTab`.
    *   **Why P1:** Core business workflow, explicitly requested.
*   **`material_approval_plan.md` (Material Approvals & Management System)**
    *   **Database:** NEW `material_specs`, `scope_material_links`.
    *   **Hardcoded/Logic:** Replaces mock material spec data in `MaterialSpecsTab`.
    *   **Why P1:** Core business workflow, explicitly requested.
*   **`report_creation_plan.md` (Report Creation & Management System)**
    *   **Database:** NEW `reports`, `report_lines`, `report_line_photos`, `report_shares`.
    *   **Hardcoded/Logic:** Replaces mock report data in `ReportsTab`.
    *   **Why P1:** Core business workflow, explicitly requested.
*   **`scope_list_plan.md` (Scope List Tab Design Refined)**
    *   **Database:** MODIFIES `scope_items` (add `initial_cost`, `sell_price`, `group_progress_percentage`).
    *   **Hardcoded/Logic:** Enhances existing real data.
    *   **Why P1:** Transforms a core tab into a financial/operational hub, includes complex import/export.

**P2 - Medium Priority (Enhancements & Client-Facing)**

*   **`project_team_management_plan.md` (Project Team Management System)**
    *   **Database:** NEW `project_members`.
    *   **Hardcoded/Logic:** Replaces mock team member data in `OverviewTab`.
    *   **Why P2:** Enhances `OverviewTab` and Task Management, but not a critical path for core workflows.
*   **`dashboard_design_plan.md` (Dashboard Design Refined)**
    *   **Database:** None directly.
    *   **Hardcoded/Logic:** Consumes real data from P1 features.
    *   **Why P2:** Provides improved UX, but relies on P1 features for data. Can be built incrementally as P1 features are completed.
*   **`client_dashboard_plan.md` (Client Dashboard View)**
    *   **Database:** None directly.
    *   **Hardcoded/Logic:** Consumes real data from P1 features.
    *   **Why P2:** Client-facing, but relies heavily on P1 features (Shop Drawings, Reports) for its content.

---

**Summary of Database Changes:**

*   **New Tables:** `tasks`, `task_comments`, `comment_mentions`, `milestones`, `shop_drawings`, `shop_drawing_submissions`, `shop_drawing_reviews`, `reports`, `report_lines`, `report_line_photos`, `report_shares`, `material_specs`, `scope_material_links`, `project_members`.
*   **Modified Tables:** `scope_items` (add `initial_cost`, `sell_price`, `group_progress_percentage`).

**Summary of Hardcoded Data/Logic Replacements:**

*   All mock data in `OverviewTab.tsx`, `ShopDrawingsTab.tsx`, `ReportsTab.tsx`, `MaterialSpecsTab.tsx` will be replaced with real data fetched from the newly implemented backend systems.

**Overall Difficulty for AI Agent:**

The overall implementation is still **High Difficulty** due to the volume and complexity of the P1 features. However, the completion of P0 means the agent can now focus entirely on building new functionality on a stable and clean foundation, which is a much more straightforward (though still challenging) task than debugging and refactoring a broken codebase.
