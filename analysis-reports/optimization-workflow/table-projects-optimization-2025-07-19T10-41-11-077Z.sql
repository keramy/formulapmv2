-- Batch Policy Optimization Transaction
BEGIN;

-- projects.projects_select_policy
DROP POLICY IF EXISTS "projects_select_policy" ON "projects";
CREATE POLICY "projects_select_policy" ON "projects" AS PERMISSIVE FOR SELECT TO "authenticated" USING (user_id = (SELECT auth.uid()) AND status = 'active');

-- projects.projects_update_policy
DROP POLICY IF EXISTS "projects_update_policy" ON "projects";
CREATE POLICY "projects_update_policy" ON "projects" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

COMMIT;