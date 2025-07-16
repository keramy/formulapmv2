-- Fix Project Assignments RLS Recursion (Final Fix)
-- Created: 2025-07-16
-- Purpose: Completely remove the recursive RLS policy that's causing infinite recursion

-- ============================================================================
-- DROP PROBLEMATIC POLICIES CAUSING RECURSION
-- ============================================================================

-- Drop the policy causing infinite recursion
DROP POLICY IF EXISTS "Team assignment project visibility" ON project_assignments;

-- ============================================================================
-- CREATE SIMPLE, NON-RECURSIVE POLICIES
-- ============================================================================

-- Simple policy for project assignments - no recursion
CREATE POLICY "Simple team assignment visibility" ON project_assignments
  FOR SELECT USING (
    -- Users can see their own assignments
    user_id = auth.uid() OR
    -- Project managers can see assignments in their projects
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_assignments.project_id
      AND p.project_manager_id = auth.uid()
    )
  );

-- ============================================================================
-- SIMPLIFY USER PROFILES POLICIES TO AVOID RECURSION
-- ============================================================================

-- Drop and recreate user profiles policies with no recursion
DROP POLICY IF EXISTS "PM team member access" ON user_profiles;
DROP POLICY IF EXISTS "Team member visibility" ON user_profiles;

-- Create simple user profiles policy without recursion
CREATE POLICY "Simple user profiles access" ON user_profiles
  FOR SELECT USING (
    -- Users can see their own profile
    id = auth.uid() OR
    -- Management can see all profiles
    is_management_role() OR
    -- Project managers can see users in their projects (no recursion)
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

-- Insert migration record
INSERT INTO public.migrations (version, name, executed_at) 
VALUES ('20250716000003', 'fix_project_assignments_recursion', NOW())
ON CONFLICT (version) DO NOTHING;