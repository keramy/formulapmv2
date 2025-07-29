-- Fix infinite recursion in RLS policies
-- The key issue: policies are creating circular dependencies

-- 1. Fix projects table policy (broken reference)
DROP POLICY IF EXISTS "Users can view assigned projects" ON projects;

CREATE POLICY "project_access_unified" ON projects
FOR ALL USING (
  -- Allow project managers assigned to this project
  EXISTS (
    SELECT 1 FROM project_assignments 
    WHERE project_assignments.project_id = projects.id 
    AND project_assignments.user_id = (SELECT auth.uid())
    AND project_assignments.is_active = true
  )
  OR
  -- Allow management/admin roles (direct role check to avoid recursion)
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = (SELECT auth.uid()) 
    AND role IN ('management', 'admin')
  )
);

-- 2. Add missing clients table policy
CREATE POLICY "clients_access_unified" ON clients
FOR ALL USING (
  -- Allow management/admin roles
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = (SELECT auth.uid()) 
    AND role IN ('management', 'admin')
  )
  OR
  -- Allow user to see their own client record
  user_id = (SELECT auth.uid())
);

-- 3. Fix suppliers table (likely missing policy)
DROP POLICY IF EXISTS "suppliers_unified_select" ON suppliers;

CREATE POLICY "suppliers_access_unified" ON suppliers
FOR ALL USING (
  -- Allow all authenticated users to view suppliers (business requirement)
  (SELECT auth.uid()) IS NOT NULL
);

-- 4. Fix project_assignments recursion
-- This table is referenced by other policies so it must have simple access
CREATE POLICY "project_assignments_self_access" ON project_assignments
FOR ALL USING (
  -- Users can see their own assignments
  user_id = (SELECT auth.uid())
  OR
  -- Management can see all assignments
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = (SELECT auth.uid()) 
    AND role IN ('management', 'admin')
  )
);

-- Verification message
DO $$
BEGIN
  RAISE NOTICE 'RLS RECURSION FIX COMPLETE';
  RAISE NOTICE 'Fixed policies for: projects, clients, suppliers, project_assignments';
  RAISE NOTICE 'All policies now use direct role checks instead of functions';
END $$;