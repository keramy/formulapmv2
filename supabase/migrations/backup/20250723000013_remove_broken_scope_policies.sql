-- Remove Broken Scope Policies - Final Cleanup
-- These policies reference non-existent "user_project_permissions" table

-- Remove broken scope_items policies that reference non-existent user_project_permissions table
DROP POLICY IF EXISTS "Optimized scope access" ON public.scope_items;
DROP POLICY IF EXISTS "Optimized scope update" ON public.scope_items;

-- Note: These policies were trying to use a permission system that doesn't exist.
-- The working policy "Users can view scope items for assigned projects" handles the access control
-- through project_assignments table, which is the correct approach.

-- Result: scope_items will have only 1 clean, working policy instead of 3 (2 broken)