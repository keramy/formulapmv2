-- Batch Policy Optimization Transaction
BEGIN;

-- invoices.invoices_select_policy
DROP POLICY IF EXISTS "invoices_select_policy" ON "invoices";
CREATE POLICY "invoices_select_policy" ON "invoices" AS PERMISSIVE FOR SELECT TO "authenticated" USING (created_by = (SELECT auth.uid()) OR ((SELECT auth.jwt()) ->> 'role') = 'admin');

-- invoices.invoices_update_policy
DROP POLICY IF EXISTS "invoices_update_policy" ON "invoices";
CREATE POLICY "invoices_update_policy" ON "invoices" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (created_by = (SELECT auth.uid()) OR ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager')) WITH CHECK (created_by = (SELECT auth.uid()) OR ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager'));

-- invoices.invoices_insert_policy
DROP POLICY IF EXISTS "invoices_insert_policy" ON "invoices";
CREATE POLICY "invoices_insert_policy" ON "invoices" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (created_by = (SELECT auth.uid()));

COMMIT;