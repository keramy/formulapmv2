# Error Log Analysis Report

### **Executive Summary**

The application is currently unstable due to a critical mismatch between the frontend code and the database schema. The dashboard component `ProjectOverview.tsx` is attempting to query a column named `is_active` on the `projects` table, but this column does not exist in the database. This single error is causing a cascade of "Bad Request" failures and preventing the dashboard from loading project data correctly.

Additionally, there are several secondary errors where the frontend is attempting to call API routes and database tables that do not exist, indicating either an incomplete local development setup or outdated code.

### **Root Cause Analysis**

#### **1. Critical Issue: Database Schema Mismatch**

The most significant error originates from `ProjectOverview.tsx` at line 55:

*   **Error Message:** `Error fetching projects: {code: '42703', details: null, hint: null, message: 'column projects.is_active does not exist'}`
*   **Analysis:** This is a PostgreSQL error code (`42703` = `undefined_column`). The frontend code is building a Supabase query that includes a filter like `.eq('is_active', true)`. The Supabase API is translating this to a SQL query, which the database then rejects because the `projects` table does not have a column named `is_active`.
*   **Impact:** This is the root cause for many of the `400 Bad Request` errors seen in the log (e.g., `GET /rest/v1/projects?...&is_active=eq.true...`). The entire project overview component is failing, which is a critical part of the Project Manager's dashboard.

#### **2. Secondary Issue: Missing Tables & API Routes**

The log shows multiple `404 Not Found` errors, which means the requested resource does not exist.

*   **Missing Database Tables:**
    *   `GET http://127.0.0.1:54321/rest/v1/project_members?select=...`
    *   `GET http://127.0.0.1:54321/rest/v1/financial_tenders?select=...`
    *   `GET http://127.0.0.1:54321/rest/v1/shop_drawings_mobile?select=...`
*   **Analysis:** The application is trying to fetch data from tables (`project_members`, `financial_tenders`, `shop_drawings_mobile`) that are not available in your local Supabase instance. This could be because your local database is not up-to-date with the latest migrations.

*   **Missing Next.js API Route:**
    *   `GET http://localhost:3003/api/client-portal/admin/metrics 404 (Not Found)`
*   **Analysis:** The `ClientPortalCard.tsx` component is trying to call a backend API route that has not been created or has been moved.

#### **3. Minor Issues**

*   **React Hydration Mismatch:** The warning `A tree hydrated but some attributes of the server rendered HTML didn't match...` is present. The log indicates attributes like `data-gr-ext-installed`, which are typically added by the Grammarly browser extension. While this error can sometimes indicate a real bug, in this case, it is most likely harmless and caused by an external script modifying the HTML.

*   **Malformed Query:** One of the failing project queries contains a duplicated parameter: `...&is_active=eq.true&status=eq.active&is_active=eq.true`. This is a bug in the code that constructs the query, but it is secondary to the fact that the `is_active` column doesn't exist in the first place.

### **Actionable Recommendations**

1.  **[CRITICAL] Fix the Database Schema:**
    *   **Action:** You must resolve the missing `is_active` column issue.
    *   **Step 1:** Check your `supabase/DATABASE_SCHEMA.md` file. Does it document an `is_active` column for the `projects` table?
    *   **Step 2 (If Documented):** Your local database is out of sync. Run your database migrations to add the missing column. You may need to run `supabase db reset` or apply migrations manually if you are using the Supabase CLI.
    *   **Step 3 (If Not Documented):** The frontend code is incorrect. You must go to `ProjectOverview.tsx` (line 55 and surrounding code) and remove the `.eq('is_active', true)` filter from the Supabase query.

2.  **[HIGH] Verify Local Database Setup:**
    *   **Action:** Ensure all required tables are present in your local database.
    *   **Step 1:** Compare your `supabase/migrations` folder with your local database schema.
    *   **Step 2:** Apply any missing migrations to create the `project_members`, `financial_tenders`, and `shop_drawings_mobile` tables.

3.  **[MEDIUM] Fix Broken API Route:**
    *   **Action:** Address the 404 error for the client portal metrics.
    *   **Step 1:** Check the `src/app/api/client-portal/admin/` directory for a file that should handle the `metrics` route.
    *   **Step 2:** If it exists, ensure the filename is correct. If not, you either need to create the API route or remove the call to it from the `ClientPortalCard.tsx` component (line 60).

4.  **[LOW] Clean Up Query Logic:**
    *   **Action:** Once the `is_active` column is fixed, find the query that is duplicating the `is_active=eq.true` parameter and remove the duplicate.