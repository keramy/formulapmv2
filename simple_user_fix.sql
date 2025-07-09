-- Simple User Fix - Step by Step
-- Run this in your Supabase SQL Editor

-- Step 1: Check what users exist in auth.users
SELECT id, email, raw_user_meta_data, created_at 
FROM auth.users 
ORDER BY created_at DESC;

-- Step 2: Check what profiles exist
SELECT id, email, role, first_name, last_name 
FROM public.user_profiles;

-- Step 3: If no users exist, let's use the Supabase Auth API approach
-- First, let's temporarily disable RLS on user_profiles to allow profile creation
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Step 4: Create test users using a simpler approach
-- We'll create the auth users first, then the profiles

-- Note: Since we can't directly insert into auth.users from SQL easily,
-- let's create the profiles for any existing users first

-- If you see users in Step 1, create profiles for them:
-- Replace the UUIDs below with the actual user IDs from Step 1

-- Example: If you see a user with ID 'abc123...', uncomment and modify:
-- INSERT INTO public.user_profiles (
--     id,
--     role,
--     first_name,
--     last_name,
--     email,
--     company,
--     department,
--     permissions,
--     is_active
-- ) VALUES (
--     'REPLACE_WITH_ACTUAL_USER_ID',
--     'admin',
--     'Admin',
--     'User',
--     'admin@formulapm.com',
--     'Formula PM',
--     'Administration',
--     '{}',
--     true
-- );

-- Step 5: Re-enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Create a simple admin policy for testing
DROP POLICY IF EXISTS "Admin users can manage all profiles" ON public.user_profiles;
CREATE POLICY "Admin users can manage all profiles" ON public.user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Step 7: Create a policy for users to manage their own profiles
DROP POLICY IF EXISTS "Users can manage own profile" ON public.user_profiles;
CREATE POLICY "Users can manage own profile" ON public.user_profiles
    FOR ALL USING (auth.uid() = id);

-- Step 8: Final verification
SELECT 'Users in auth.users:' as table_name, count(*) as count FROM auth.users
UNION ALL
SELECT 'Profiles in user_profiles:' as table_name, count(*) as count FROM public.user_profiles;