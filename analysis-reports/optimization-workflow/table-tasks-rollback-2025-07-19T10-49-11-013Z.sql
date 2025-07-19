-- Batch Policy Optimization Rollback
BEGIN;

-- Rollback tasks.tasks_select_policy
DROP POLICY IF EXISTS "tasks_select_policy" ON "tasks";
CREATE POLICY "tasks_select_policy" ON "tasks" AS PERMISSIVE FOR SELECT TO "authenticated" USING (assigned_to = auth.uid() OR created_by = auth.uid() OR project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

COMMIT;