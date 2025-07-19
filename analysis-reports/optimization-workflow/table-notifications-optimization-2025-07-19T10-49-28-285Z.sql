-- Batch Policy Optimization Transaction
BEGIN;

-- notifications.notifications_select_policy
DROP POLICY IF EXISTS "notifications_select_policy" ON "notifications";
CREATE POLICY "notifications_select_policy" ON "notifications" AS PERMISSIVE FOR SELECT TO "authenticated" USING (recipient_id = (SELECT auth.uid()));

COMMIT;