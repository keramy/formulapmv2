-- Simple RLS Fix - Remove All Recursion
-- Created: 2025-07-07
-- Purpose: Eliminate all infinite recursion by simplifying policies

-- ============================================================================
-- DISABLE AND RECREATE ALL PROBLEMATIC POLICIES
-- ============================================================================

-- Disable RLS temporarily to clear all policies
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;  
ALTER TABLE project_assignments DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Management full user access" ON user_profiles;
DROP POLICY IF EXISTS "Users own profile access" ON user_profiles;
DROP POLICY IF EXISTS "PM team member access" ON user_profiles;
DROP POLICY IF EXISTS "Team member visibility" ON user_profiles;
DROP POLICY IF EXISTS "Restrict role changes" ON user_profiles;

DROP POLICY IF EXISTS "Management full project access" ON projects;
DROP POLICY IF EXISTS "PM assigned projects" ON projects;
DROP POLICY IF EXISTS "Team project access" ON projects;
DROP POLICY IF EXISTS "Client project access" ON projects;

DROP POLICY IF EXISTS "Management assignment access" ON project_assignments;
DROP POLICY IF EXISTS "PM assignment management" ON project_assignments;
DROP POLICY IF EXISTS "User own assignments" ON project_assignments;
DROP POLICY IF EXISTS "Team assignment project visibility" ON project_assignments;

-- ============================================================================
-- CREATE SIMPLE, NON-RECURSIVE POLICIES
-- ============================================================================

-- Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;

-- USER PROFILES - Simple policies without cross-table queries
CREATE POLICY "Management full user access" ON user_profiles
  FOR ALL USING (is_management_role());

CREATE POLICY "Users own profile access" ON user_profiles
  FOR ALL USING (id = auth.uid());

-- Restrict role changes (simplified)
CREATE POLICY "Restrict role changes" ON user_profiles
  FOR UPDATE USING (
    (auth.jwt() ->> 'user_role' IN ('company_owner', 'admin')) OR
    (id = auth.uid() AND role = (auth.jwt() ->> 'user_role'))
  );

-- PROJECTS - Simple policies
CREATE POLICY "Management full project access" ON projects
  FOR ALL USING (is_management_role());

CREATE POLICY "PM own projects" ON projects
  FOR ALL USING (project_manager_id = auth.uid());

CREATE POLICY "Client project access" ON projects
  FOR SELECT USING (is_client_with_project_access(id));

-- PROJECT ASSIGNMENTS - Simple policies
CREATE POLICY "Management assignment access" ON project_assignments
  FOR ALL USING (is_management_role());

CREATE POLICY "User own assignments" ON project_assignments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "PM assignment management" ON project_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_assignments.project_id
      AND p.project_manager_id = auth.uid()
    )
  );

-- ============================================================================
-- ALTERNATIVE APPROACH: Use application-level access control
-- ============================================================================

-- Create simple function to check team membership without RLS recursion
CREATE OR REPLACE FUNCTION can_view_user_profile(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  viewer_role TEXT;
BEGIN
  -- Get viewer's role
  viewer_role := get_user_role_from_auth();
  
  -- Management can see all
  IF viewer_role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin') THEN
    RETURN TRUE;
  END IF;
  
  -- Users can see their own profile
  IF target_user_id = auth.uid() THEN
    RETURN TRUE;
  END IF;
  
  -- For other cases, return false and handle in application layer
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add application-controlled policy for user profiles
CREATE POLICY "Application controlled user access" ON user_profiles
  FOR SELECT USING (can_view_user_profile(id));

-- Insert migration record
INSERT INTO public.migrations (version, name, executed_at) 
VALUES ('20250707000003', 'simple_rls_fix', NOW())
ON CONFLICT (version) DO NOTHING;