-- Bypass RLS for Auth Diagnostics
-- Created: 2025-07-16
-- Purpose: Create a simple policy for auth diagnostics to work without recursion

-- ============================================================================
-- DROP ALL PROBLEMATIC POLICIES
-- ============================================================================

-- Drop all user_profiles policies
DROP POLICY IF EXISTS "Simple user profiles access" ON user_profiles;
DROP POLICY IF EXISTS "User own profile" ON user_profiles;
DROP POLICY IF EXISTS "Management user access" ON user_profiles;

-- Drop all project_assignments policies
DROP POLICY IF EXISTS "Simple team assignment visibility" ON project_assignments;
DROP POLICY IF EXISTS "Management assignment access" ON project_assignments;
DROP POLICY IF EXISTS "PM assignment management" ON project_assignments;
DROP POLICY IF EXISTS "User own assignments" ON project_assignments;

-- ============================================================================
-- CREATE SIMPLE, NON-RECURSIVE POLICIES
-- ============================================================================

-- Super simple user profiles policy - users can only see their own profile
CREATE POLICY "User own profile only" ON user_profiles
  FOR SELECT USING (id = auth.uid());

-- Management can see all profiles
CREATE POLICY "Management full access" ON user_profiles
  FOR ALL USING (
    -- Check if user is management by looking at auth metadata directly
    COALESCE(
      (SELECT raw_app_meta_data->>'user_role' FROM auth.users WHERE id = auth.uid()),
      'unknown'
    ) IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin')
  );

-- Simple project assignments policy - users can only see their own assignments
CREATE POLICY "User own assignments only" ON project_assignments
  FOR SELECT USING (user_id = auth.uid());

-- Management can see all assignments
CREATE POLICY "Management assignment full access" ON project_assignments
  FOR ALL USING (
    -- Check if user is management by looking at auth metadata directly
    COALESCE(
      (SELECT raw_app_meta_data->>'user_role' FROM auth.users WHERE id = auth.uid()),
      'unknown'
    ) IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin')
  );

-- Insert migration record
INSERT INTO public.migrations (version, name, executed_at) 
VALUES ('20250716000004', 'bypass_rls_for_auth_diagnostics', NOW())
ON CONFLICT (version) DO NOTHING;