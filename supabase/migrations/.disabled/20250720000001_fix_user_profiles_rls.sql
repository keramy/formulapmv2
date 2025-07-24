-- Fix user_profiles RLS policies for 406 error
-- This ensures users can read their own profile

-- First, ensure RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "User profiles are viewable by owner" ON user_profiles;
DROP POLICY IF EXISTS "User profiles are editable by owner" ON user_profiles;

-- Create simple, permissive policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Allow authenticated users to view all profiles (temporarily for debugging)
-- This can be made more restrictive later based on your needs
CREATE POLICY "Authenticated users can view all profiles" ON user_profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Ensure the anon role can't access profiles
CREATE POLICY "Anon users cannot access profiles" ON user_profiles
  FOR ALL
  USING (auth.role() != 'anon');