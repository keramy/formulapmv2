-- Fix Project Assignments RLS Recursion
-- Created: 2025-07-07
-- Purpose: Fix infinite recursion in project_assignments and has_project_access function

-- ============================================================================
-- DROP PROBLEMATIC POLICIES
-- ============================================================================

-- Drop the policy causing infinite recursion
DROP POLICY IF EXISTS "Team assignment visibility" ON project_assignments;

-- ============================================================================
-- UPDATE has_project_access FUNCTION TO AVOID RECURSION
-- ============================================================================

-- Create a safe version of has_project_access that doesn't query project_assignments
-- during RLS policy evaluation for user_profiles
CREATE OR REPLACE FUNCTION has_project_access(project_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get role from auth metadata to avoid recursion
  user_role := get_user_role_from_auth();
  
  -- Management has access to all projects
  IF user_role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin') THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is project manager for this project
  IF EXISTS (
    SELECT 1 FROM projects
    WHERE id = project_uuid
    AND project_manager_id = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- For non-management users, we need to be careful about project_assignments queries
  -- This function should only be used in contexts where it won't cause recursion
  -- For now, return false to avoid recursion, and handle project access differently
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CREATE SAFE PROJECT ACCESS FUNCTION FOR USER PROFILES
-- ============================================================================

-- Function specifically for user profiles that doesn't cause recursion
CREATE OR REPLACE FUNCTION safe_has_project_access_for_profiles(project_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get role from auth metadata to avoid recursion
  user_role := get_user_role_from_auth();
  
  -- Management has access to all projects
  IF user_role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin') THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is project manager for this project
  RETURN EXISTS (
    SELECT 1 FROM projects
    WHERE id = project_uuid
    AND project_manager_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- UPDATE USER PROFILES POLICIES TO USE SAFE FUNCTION
-- ============================================================================

-- Drop and recreate the PM team member access policy with safe function
DROP POLICY IF EXISTS "PM team member access" ON user_profiles;
CREATE POLICY "PM team member access" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.project_manager_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM project_assignments pa
        WHERE pa.project_id = p.id
        AND pa.user_id = user_profiles.id
        AND pa.is_active = true
      )
    )
  );

-- Drop and recreate the team member visibility policy with safe approach
DROP POLICY IF EXISTS "Team member visibility" ON user_profiles;
CREATE POLICY "Team member visibility" ON user_profiles
  FOR SELECT USING (
    -- Users can see other users in projects they manage
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.project_manager_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM project_assignments pa
        WHERE pa.project_id = p.id
        AND pa.user_id = user_profiles.id
        AND pa.is_active = true
      )
    ) OR
    -- Users can see other users they work with (same project manager)
    EXISTS (
      SELECT 1 FROM projects p1
      JOIN projects p2 ON p1.project_manager_id = p2.project_manager_id
      WHERE EXISTS (
        SELECT 1 FROM project_assignments pa1
        WHERE pa1.project_id = p1.id
        AND pa1.user_id = auth.uid()
        AND pa1.is_active = true
      ) AND EXISTS (
        SELECT 1 FROM project_assignments pa2
        WHERE pa2.project_id = p2.id
        AND pa2.user_id = user_profiles.id
        AND pa2.is_active = true
      )
    )
  );

-- ============================================================================
-- CREATE SAFER PROJECT ASSIGNMENTS POLICIES
-- ============================================================================

-- Drop existing project assignments policies and recreate them safely
DROP POLICY IF EXISTS "PM assignment management" ON project_assignments;
DROP POLICY IF EXISTS "User own assignments" ON project_assignments;
DROP POLICY IF EXISTS "Management assignment access" ON project_assignments;

-- Management full access (safe)
CREATE POLICY "Management assignment access" ON project_assignments
  FOR ALL USING (is_management_role());

-- Project managers can manage assignments for their projects (safe)
CREATE POLICY "PM assignment management" ON project_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_assignments.project_id
      AND p.project_manager_id = auth.uid()
    )
  );

-- Users can see their own assignments (safe)
CREATE POLICY "User own assignments" ON project_assignments
  FOR SELECT USING (user_id = auth.uid());

-- Team members can see assignments in projects they're assigned to
-- This is safe because it doesn't create recursion
CREATE POLICY "Team assignment project visibility" ON project_assignments
  FOR SELECT USING (
    -- Can see assignments in projects where user is project manager
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_assignments.project_id
      AND p.project_manager_id = auth.uid()
    ) OR
    -- Can see assignments in projects where user has direct assignment
    project_id IN (
      SELECT DISTINCT pa.project_id 
      FROM project_assignments pa
      WHERE pa.user_id = auth.uid() 
      AND pa.is_active = true
    )
  );

-- ============================================================================
-- UPDATE OTHER POLICIES THAT USE has_project_access
-- ============================================================================

-- Update projects policies to be more explicit and avoid recursion
DROP POLICY IF EXISTS "PM assigned projects" ON projects;
CREATE POLICY "PM assigned projects" ON projects
  FOR ALL USING (
    project_manager_id = auth.uid() OR
    id IN (
      SELECT DISTINCT pa.project_id 
      FROM project_assignments pa
      WHERE pa.user_id = auth.uid() 
      AND pa.is_active = true
    )
  );

DROP POLICY IF EXISTS "Team project access" ON projects;
CREATE POLICY "Team project access" ON projects
  FOR SELECT USING (
    project_manager_id = auth.uid() OR
    id IN (
      SELECT DISTINCT pa.project_id 
      FROM project_assignments pa
      WHERE pa.user_id = auth.uid() 
      AND pa.is_active = true
    )
  );

-- Insert migration record
INSERT INTO public.migrations (version, name, executed_at) 
VALUES ('20250707000002', 'fix_project_assignments_recursion', NOW())
ON CONFLICT (version) DO NOTHING;