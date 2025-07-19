-- Batch Policy Optimization Transaction
BEGIN;

-- audit_logs.audit_logs_select_policy
DROP POLICY IF EXISTS "audit_logs_select_policy" ON "audit_logs";
CREATE POLICY "audit_logs_select_policy" ON "audit_logs" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager') OR user_id = (SELECT auth.uid()));

COMMIT;