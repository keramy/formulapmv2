-- Fix Broken Policies - Phase 3: Remove policies referencing non-existent tables
-- These policies reference "user_project_permissions" table that doesn't exist

-- Remove broken scope_items policies that reference non-existent user_project_permissions table
DROP POLICY IF EXISTS "Optimized scope access" ON public.scope_items;
DROP POLICY IF EXISTS "Optimized scope update" ON public.scope_items;

-- Note: These policies were trying to use a permission system that doesn't exist.
-- The working policy "Users can view scope items for assigned projects" handles the access control
-- through project_assignments table, which is the correct approach.

-- If you need more granular permissions in the future, you would need to:
-- 1. Create the user_project_permissions table
-- 2. Populate it with permission data
-- 3. Recreate these policies with proper auth.uid() wrapping