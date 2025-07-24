-- Fix infinite recursion in user_profiles RLS policies
-- Issue: Direct auth.uid() calls cause recursion, need to use (SELECT auth.uid())
-- Based on Kiro's analysis: Use (SELECT auth.uid()) not auth.uid() for 10-100x performance

-- Drop problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Users own profile access" ON user_profiles;
DROP POLICY IF EXISTS "Restrict role changes" ON user_profiles;

-- Recreate with optimized pattern to prevent recursion
CREATE POLICY "Users own profile access" ON user_profiles
  FOR ALL USING (id = (SELECT auth.uid()));

-- Recreate role restriction policy with optimized pattern
CREATE POLICY "Restrict role changes" ON user_profiles
  FOR UPDATE USING (
    -- Only company owner and admin can change roles (check JWT claims)
    (auth.jwt() ->> 'user_role' IN ('company_owner', 'admin')) OR
    -- Users can update their own profile but not role
    (id = (SELECT auth.uid()) AND role::text = (auth.jwt() ->> 'user_role'))
  );

-- Insert migration record
INSERT INTO public.migrations (version, name, executed_at) 
VALUES ('20250723000001', 'fix_user_profiles_rls_recursion', NOW())
ON CONFLICT (version) DO NOTHING;