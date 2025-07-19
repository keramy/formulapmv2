-- Consolidated RLS Optimization SQL
-- Generated: 2025-07-19T10:41:11.096Z
-- Total tables: 2
-- Total optimizations: 3

-- Table: projects
-- Batch Policy Optimization Transaction
BEGIN;

-- projects.projects_select_policy
DROP POLICY IF EXISTS "projects_select_policy" ON "projects";
CREATE POLICY "projects_select_policy" ON "projects" AS PERMISSIVE FOR SELECT TO "authenticated" USING (user_id = (SELECT auth.uid()) AND status = 'active');

-- projects.projects_update_policy
DROP POLICY IF EXISTS "projects_update_policy" ON "projects";
CREATE POLICY "projects_update_policy" ON "projects" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

COMMIT;

-- Table: tasks
-- Batch Policy Optimization Transaction
BEGIN;

-- tasks.tasks_select_policy
DROP POLICY IF EXISTS "tasks_select_policy" ON "tasks";
CREATE POLICY "tasks_select_policy" ON "tasks" AS PERMISSIVE FOR SELECT TO "authenticated" USING (assigned_to = (SELECT auth.uid()) OR created_by = (SELECT auth.uid()));

COMMIT;
