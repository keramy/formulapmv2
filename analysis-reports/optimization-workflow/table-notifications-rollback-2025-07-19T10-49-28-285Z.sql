-- Batch Policy Optimization Rollback
BEGIN;

-- Rollback notifications.notifications_select_policy
DROP POLICY IF EXISTS "notifications_select_policy" ON "notifications";
CREATE POLICY "notifications_select_policy" ON "notifications" AS PERMISSIVE FOR SELECT TO "authenticated" USING (recipient_id = auth.uid());

COMMIT;