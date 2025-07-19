-- Batch Policy Optimization Rollback
BEGIN;

-- Rollback documents.documents_select_policy
DROP POLICY IF EXISTS "documents_select_policy" ON "documents";
CREATE POLICY "documents_select_policy" ON "documents" AS PERMISSIVE FOR SELECT TO "authenticated" USING (owner_id = auth.uid() OR shared_with @> ARRAY[auth.uid()]);

-- Rollback documents.documents_update_policy
DROP POLICY IF EXISTS "documents_update_policy" ON "documents";
CREATE POLICY "documents_update_policy" ON "documents" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

COMMIT;