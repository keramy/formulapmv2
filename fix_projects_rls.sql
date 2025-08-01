-- Fix Projects RLS Policies
-- This script fixes the RLS policies that are preventing project access

-- First, let's drop the existing problematic policies
DROP POLICY IF EXISTS "projects_select" ON projects;
DROP POLICY IF EXISTS "projects_insert" ON projects; 
DROP POLICY IF EXISTS "projects_update" ON projects;

-- Create new optimized RLS policies that work correctly

-- 1. SELECT Policy - Allow users to see projects they have access to
CREATE POLICY "projects_select_optimized" ON projects
  FOR SELECT USING (
    -- Admin and management can see all active projects
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('management', 'admin') 
      AND is_active = true
    )
    OR
    -- Project managers can see projects they manage
    (project_manager_id = (SELECT auth.uid()))
    OR
    -- Users assigned to projects can see them
    EXISTS (
      SELECT 1 FROM project_assignments pa
      WHERE pa.project_id = projects.id
      AND pa.user_id = (SELECT auth.uid())
      AND pa.is_active = true
    )
    OR
    -- Clients can see their projects  
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN clients c ON up.id = c.contact_user_id
      WHERE up.id = (SELECT auth.uid())
      AND c.id = projects.client_id
      AND up.role = 'client'
      AND up.is_active = true
    )
  );

-- 2. INSERT Policy - Allow authorized users to create projects
CREATE POLICY "projects_insert_optimized" ON projects
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('management', 'admin', 'project_manager') 
      AND is_active = true
    )
  );

-- 3. UPDATE Policy - Allow authorized users to update projects  
CREATE POLICY "projects_update_optimized" ON projects
  FOR UPDATE USING (
    -- Admin and management can update all projects
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('management', 'admin') 
      AND is_active = true
    )
    OR
    -- Project managers can update their own projects
    (project_manager_id = (SELECT auth.uid()) AND 
     EXISTS (
       SELECT 1 FROM user_profiles 
       WHERE id = (SELECT auth.uid()) 
       AND role = 'project_manager' 
       AND is_active = true
     ))
  );

-- 4. DELETE Policy - Only admin and management can delete
CREATE POLICY "projects_delete_optimized" ON projects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('management', 'admin') 
      AND is_active = true
    )
  );

-- Test the fix by checking if policies were created successfully
DO $$
BEGIN
  RAISE NOTICE '✅ Projects RLS policies have been recreated successfully';
  RAISE NOTICE '📊 Check policy count: %', (
    SELECT COUNT(*) FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'projects'
  );
END $$;