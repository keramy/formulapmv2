# Application Issues Report

This report consolidates the findings from previous analyses, identifying critical bugs, security vulnerabilities, and areas for improvement in the Formula PM application.

## I. Critical Bugs & Errors (Immediate Impact)

These issues are currently causing application instability and preventing core functionalities from working as intended.

1.  **Database Schema Mismatch (`projects.is_active` column missing):**
    *   **Description:** The frontend component `ProjectOverview.tsx` (and potentially others) attempts to query the `projects` table using an `is_active` column, which does not exist in the current database schema. This results in `400 Bad Request` errors from the Supabase API.
    *   **Impact:** Prevents the main dashboard from loading project data, leading to a cascade of errors and a non-functional dashboard.
    *   **Status:** Identified in `error_log_analysis_report.md`. A temporary code-side fix (commenting out the filter) was suggested to stabilize the app, but the underlying database issue remains.

2.  **Missing Database Tables (`project_members`, `financial_tenders`, `shop_drawings_mobile`):**
    *   **Description:** The application attempts to fetch data from tables (`project_members`, `financial_tenders`, `shop_drawings_mobile`) that are not present in the local Supabase instance. This leads to `404 Not Found` errors for these API calls.
    *   **Impact:** Prevents various dashboard components (e.g., `DashboardStats`, `ProjectOverview`) from displaying correct data and contributes to the error flood.
    *   **Status:** Identified in `error_log_analysis_report.md`. Likely due to outdated local database migrations.

3.  **Missing Next.js API Route (`/api/client-portal/admin/metrics`):**
    *   **Description:** The `ClientPortalCard.tsx` component attempts to call a backend API route (`/api/client-portal/admin/metrics`) that returns a `404 Not Found` error.
    *   **Impact:** Prevents the Client Portal metrics card from loading, contributing to dashboard instability.
    *   **Status:** Identified in `error_log_analysis_report.md`. A temporary code-side fix (commenting out the fetch call) was suggested.

## II. Security Vulnerabilities

1.  **Critical: Supabase Service Role Key Exposure:**
    *   **Description:** The `SUPABASE_SERVICE_ROLE_KEY` is exposed to the client-side via `next.config.js`. This key grants full administrative access to your entire Supabase database, bypassing all Row Level Security (RLS).
    *   **Impact:** Anyone inspecting your site's client-side code can obtain this key and gain unrestricted access to your database, posing an extreme security risk (data deletion, modification, exfiltration).
    *   **Status:** Identified in `gemini_analysis_report.md`. This is the highest priority fix.

## III. Architectural & Code Quality Issues

These issues impact the long-term maintainability, scalability, and developer experience of the application.

1.  **Code Duplication in APIs:**
    *   **Description:** Helper functions (e.g., `verifyProjectAccess`, `getAccessibleProjects`) are duplicated across multiple API routes within `src/app/api`.
    *   **Impact:** Increases code redundancy, makes maintenance harder (changes need to be applied in multiple places), and increases the likelihood of introducing inconsistencies or bugs.
    *   **Status:** Identified in `gemini_analysis_report.md`.

2.  **Extensive API Monolith:**
    *   **Description:** The `src/app/api` directory is very large, with many individual API routes.
    *   **Impact:** While functional, this structure can become difficult to manage as the application grows, potentially leading to complex interdependencies and harder debugging.
    *   **Status:** Identified in `gemini_analysis_report.md`.

3.  **Lack of Centralized Error Handling:**
    *   **Description:** Error handling in API routes appears to be implemented on a per-route basis.
    *   **Impact:** Leads to inconsistent error responses and makes global error logging and monitoring more challenging.
    *   **Status:** Identified in `gemini_analysis_report.md`.

4.  **Automated Database Migrations (Missing Process):**
    *   **Description:** While migration files exist, the process for consistently applying them to local and deployment environments is not explicitly automated or documented within the project.
    *   **Impact:** Leads to schema mismatches between environments (as seen with the `is_active` column error) and makes collaborative development more prone to database-related issues.
    *   **Status:** Identified in `gemini_analysis_report.md`.

5.  **Limited Test Coverage:**
    *   **Description:** A testing framework (`jest.config.js`) and a basic CI workflow (`validate-sql.yml`) are present, but the `__tests__` directory appears to have minimal content.
    *   **Impact:** Low test coverage increases the risk of regressions when changes are made and makes refactoring more dangerous.
    *   **Status:** Identified in `gemini_analysis_report.md`.

## IV. User Experience & Design Issues

These issues relate to the usability and clarity of the application from a user's perspective.

1.  **Dashboard Information Overload:**
    *   **Description:** The current main dashboard presents a large amount of information and various widgets simultaneously.
    *   **Impact:** Can be overwhelming for users, making it difficult to quickly identify relevant information or prioritize tasks.
    *   **Status:** Identified in UX analysis.

2.  **Fragmented Project Management Workflow:**
    *   **Description:** Project-related information (scope, documents, purchases, shop drawings) is spread across different top-level navigation sections.
    *   **Impact:** Forces Project Managers to constantly switch contexts and navigate away from a project-specific view to gather information or perform tasks related to a single project, leading to inefficiency.
    *   **Status:** Identified in UX analysis.
