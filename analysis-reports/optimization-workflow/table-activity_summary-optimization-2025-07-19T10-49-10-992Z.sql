-- Batch Policy Optimization Transaction
BEGIN;

-- activity_summary.activity_summary_select_policy
DROP POLICY IF EXISTS "activity_summary_select_policy" ON "activity_summary";
CREATE POLICY "activity_summary_select_policy" ON "activity_summary" AS PERMISSIVE FOR SELECT TO "authenticated" USING (user_id = (SELECT auth.uid()) OR ((SELECT auth.jwt()) ->> 'role') = 'admin');

-- activity_summary.activity_summary_insert_policy
DROP POLICY IF EXISTS "activity_summary_insert_policy" ON "activity_summary";
CREATE POLICY "activity_summary_insert_policy" ON "activity_summary" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (user_id = (SELECT auth.uid()));

COMMIT;