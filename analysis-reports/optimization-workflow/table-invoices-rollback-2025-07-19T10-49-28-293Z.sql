-- Batch Policy Optimization Rollback
BEGIN;

-- Rollback invoices.invoices_select_policy
DROP POLICY IF EXISTS "invoices_select_policy" ON "invoices";
CREATE POLICY "invoices_select_policy" ON "invoices" AS PERMISSIVE FOR SELECT TO "authenticated" USING (created_by = auth.uid() OR (auth.jwt() ->> 'role') = 'admin');

-- Rollback invoices.invoices_update_policy
DROP POLICY IF EXISTS "invoices_update_policy" ON "invoices";
CREATE POLICY "invoices_update_policy" ON "invoices" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (created_by = auth.uid() OR (auth.jwt() ->> 'role') IN ('admin', 'manager')) WITH CHECK (created_by = auth.uid() OR (auth.jwt() ->> 'role') IN ('admin', 'manager'));

-- Rollback invoices.invoices_insert_policy
DROP POLICY IF EXISTS "invoices_insert_policy" ON "invoices";
CREATE POLICY "invoices_insert_policy" ON "invoices" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (created_by = auth.uid());

COMMIT;