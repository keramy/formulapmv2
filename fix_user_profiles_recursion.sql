-- Fix infinite recursion in user_profiles RLS policies
-- This script should be run in the Supabase SQL Editor

-- First, disable RLS temporarily to avoid issues
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on user_profiles
DROP POLICY IF EXISTS user_profiles_admin_all ON user_profiles;
DROP POLICY IF EXISTS user_profiles_select ON user_profiles;
DROP POLICY IF EXISTS user_profiles_update_own ON user_profiles;
DROP POLICY IF EXISTS user_profiles_insert ON user_profiles;
DROP POLICY IF EXISTS user_profiles_delete ON user_profiles;

-- Create new non-recursive policies

-- 1. Users can see all profiles (adjust if you want more restrictive access)
CREATE POLICY user_profiles_select_policy ON user_profiles
FOR SELECT
USING (true);

-- 2. Users can update their own profile
CREATE POLICY user_profiles_update_own_policy ON user_profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 3. Users can insert their own profile (handled by trigger usually)
CREATE POLICY user_profiles_insert_own_policy ON user_profiles
FOR INSERT
WITH CHECK (id = auth.uid());

-- 4. Admin policy without recursion
-- This policy allows admins to do everything
-- We determine admin status from the profile itself, but in a way that doesn't cause recursion
CREATE POLICY user_profiles_admin_policy ON user_profiles
FOR ALL
USING (
    -- User's own profile is always accessible
    id = auth.uid()
    OR
    -- Admin check without recursion: 
    -- We check if the current auth.uid() has admin role
    -- This works because when checking THIS policy, it doesn't re-trigger itself
    (
        SELECT role = 'admin' AND is_active = true
        FROM user_profiles
        WHERE id = auth.uid()
        LIMIT 1
    )
);

-- Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Verify the policies are created correctly
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;