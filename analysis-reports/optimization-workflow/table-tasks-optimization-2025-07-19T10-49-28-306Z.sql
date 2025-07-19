-- Batch Policy Optimization Transaction
BEGIN;

-- tasks.tasks_select_policy
DROP POLICY IF EXISTS "tasks_select_policy" ON "tasks";
CREATE POLICY "tasks_select_policy" ON "tasks" AS PERMISSIVE FOR SELECT TO "authenticated" USING (assigned_to = (SELECT auth.uid()) OR created_by = (SELECT auth.uid()) OR project_id IN (SELECT id FROM projects WHERE user_id = (SELECT auth.uid())));

COMMIT;