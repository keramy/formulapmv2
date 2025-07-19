-- Consolidated RLS Optimization Rollback SQL
-- Generated: 2025-07-19T10:41:11.096Z
-- Use this to rollback all optimizations if needed

-- Rollback for table: projects
-- Batch Policy Optimization Rollback
BEGIN;

-- Rollback projects.projects_select_policy
DROP POLICY IF EXISTS "projects_select_policy" ON "projects";
CREATE POLICY "projects_select_policy" ON "projects" AS PERMISSIVE FOR SELECT TO "authenticated" USING (user_id = auth.uid() AND status = 'active');

-- Rollback projects.projects_update_policy
DROP POLICY IF EXISTS "projects_update_policy" ON "projects";
CREATE POLICY "projects_update_policy" ON "projects" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

COMMIT;

-- Rollback for table: tasks
-- Batch Policy Optimization Rollback
BEGIN;

-- Rollback tasks.tasks_select_policy
DROP POLICY IF EXISTS "tasks_select_policy" ON "tasks";
CREATE POLICY "tasks_select_policy" ON "tasks" AS PERMISSIVE FOR SELECT TO "authenticated" USING (assigned_to = auth.uid() OR created_by = auth.uid());

COMMIT;
