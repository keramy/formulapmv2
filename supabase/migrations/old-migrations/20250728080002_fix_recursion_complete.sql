-- Complete fix for infinite recursion in RLS policies
-- Created: 2025-07-28
-- Fix all broken policies that cause recursion

-- 1. Fix projects table - drop broken policy and create correct one
DROP POLICY IF EXISTS "Users can view assigned projects" ON projects;
DROP POLICY IF EXISTS "project_access_unified" ON projects;

CREATE POLICY "projects_unified_access" ON projects
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

-- 2. Add clients table policy (currently missing)
DROP POLICY IF EXISTS "clients_access_unified" ON clients;

CREATE POLICY "clients_unified_access" ON clients
FOR ALL USING (
  -- Allow management/admin roles
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = (SELECT auth.uid()) 
    AND role IN ('management', 'admin')
  )
  OR
  -- Allow user to see their own client record if they have one
  user_id = (SELECT auth.uid())
);

-- 3. Fix project_assignments table to avoid recursion
DROP POLICY IF EXISTS "project_assignments_unified_select" ON project_assignments;
DROP POLICY IF EXISTS "project_assignments_unified_insert" ON project_assignments;
DROP POLICY IF EXISTS "project_assignments_unified_update" ON project_assignments;
DROP POLICY IF EXISTS "project_assignments_unified_delete" ON project_assignments;
DROP POLICY IF EXISTS "project_assignments_self_access" ON project_assignments;

CREATE POLICY "project_assignments_unified_access" ON project_assignments
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
  RAISE NOTICE 'COMPLETE RLS RECURSION FIX APPLIED';
  RAISE NOTICE 'Fixed: projects, clients, project_assignments';
  RAISE NOTICE 'All policies now use direct role checks to avoid recursion';
END $$;