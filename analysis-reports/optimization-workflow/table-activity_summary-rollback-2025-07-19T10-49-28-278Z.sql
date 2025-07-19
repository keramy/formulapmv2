-- Batch Policy Optimization Rollback
BEGIN;

-- Rollback activity_summary.activity_summary_select_policy
DROP POLICY IF EXISTS "activity_summary_select_policy" ON "activity_summary";
CREATE POLICY "activity_summary_select_policy" ON "activity_summary" AS PERMISSIVE FOR SELECT TO "authenticated" USING (user_id = auth.uid() OR (auth.jwt() ->> 'role') = 'admin');

-- Rollback activity_summary.activity_summary_insert_policy
DROP POLICY IF EXISTS "activity_summary_insert_policy" ON "activity_summary";
CREATE POLICY "activity_summary_insert_policy" ON "activity_summary" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (user_id = auth.uid());

COMMIT;