-- Batch Policy Optimization Rollback
BEGIN;

-- Rollback audit_logs.audit_logs_select_policy
DROP POLICY IF EXISTS "audit_logs_select_policy" ON "audit_logs";
CREATE POLICY "audit_logs_select_policy" ON "audit_logs" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((auth.jwt() ->> 'role') IN ('admin', 'manager') OR user_id = auth.uid());

COMMIT;