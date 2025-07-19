-- Batch Policy Optimization Transaction
BEGIN;

-- documents.documents_select_policy
DROP POLICY IF EXISTS "documents_select_policy" ON "documents";
CREATE POLICY "documents_select_policy" ON "documents" AS PERMISSIVE FOR SELECT TO "authenticated" USING (owner_id = (SELECT auth.uid()) OR shared_with @> ARRAY[(SELECT auth.uid())]);

-- documents.documents_update_policy
DROP POLICY IF EXISTS "documents_update_policy" ON "documents";
CREATE POLICY "documents_update_policy" ON "documents" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (owner_id = (SELECT auth.uid())) WITH CHECK (owner_id = (SELECT auth.uid()));

COMMIT;