-- Fix Auth Users Permission
-- Created: 2025-07-16
-- Purpose: Fix the permission error when accessing auth.users table in RLS policies

-- ============================================================================
-- DROP PROBLEMATIC POLICIES THAT ACCESS auth.users
-- ============================================================================

-- Drop policies that access auth.users table
DROP POLICY IF EXISTS "Management full access" ON user_profiles;
DROP POLICY IF EXISTS "Management assignment full access" ON project_assignments;

-- ============================================================================
-- CREATE SIMPLE POLICIES WITHOUT auth.users ACCESS
-- ============================================================================

-- Management can see all profiles using the existing function
CREATE POLICY "Management full access" ON user_profiles
  FOR ALL USING (is_management_role());

-- Management can see all assignments using the existing function  
CREATE POLICY "Management assignment full access" ON project_assignments
  FOR ALL USING (is_management_role());

-- Insert migration record
INSERT INTO public.migrations (version, name, executed_at) 
VALUES ('20250716000005', 'fix_auth_users_permission', NOW())
ON CONFLICT (version) DO NOTHING;