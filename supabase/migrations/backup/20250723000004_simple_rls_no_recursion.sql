-- Simple RLS Policy Without Recursion
-- Replaces complex policies with simple ones that don't cause circular references

-- Drop all existing policies on user_profiles
DROP POLICY IF EXISTS "users_own_profile_access" ON user_profiles;
DROP POLICY IF EXISTS "management_admin_full_access" ON user_profiles;
DROP POLICY IF EXISTS "users_update_own_non_role_fields" ON user_profiles;
DROP POLICY IF EXISTS "management_and_admin_can_manage_users" ON user_profiles;

-- Create simple, non-recursive policies
-- Policy 1: Users can view and update their own profile
CREATE POLICY "own_profile_access" ON user_profiles
  FOR ALL USING (id = (SELECT auth.uid()));

-- Policy 2: Admin role can access all profiles (using JWT claims, not table lookup)
CREATE POLICY "admin_full_access" ON user_profiles
  FOR ALL USING (
    (SELECT auth.jwt() ->> 'user_role') = 'admin'
  );

-- Policy 3: Management role can access all profiles (using JWT claims, not table lookup)  
CREATE POLICY "management_full_access" ON user_profiles
  FOR ALL USING (
    (SELECT auth.jwt() ->> 'user_role') = 'management'
  );

-- Verify the policies are simpler
DO $$
DECLARE
    policy_rec RECORD;
BEGIN
    RAISE NOTICE 'New simplified user_profiles policies:';
    FOR policy_rec IN 
        SELECT policyname, qual 
        FROM pg_policies 
        WHERE tablename = 'user_profiles' AND schemaname = 'public'
    LOOP
        RAISE NOTICE '  - %: %', policy_rec.policyname, policy_rec.qual;
    END LOOP;
END $$;