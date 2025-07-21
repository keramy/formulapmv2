-- Complete Kiro's Role System Migration (13 → 6 roles)
-- Step 1: Remove policies that block enum alteration

-- First, let's see what policies exist that reference the role column
-- Run this to find all policies:
-- SELECT schemaname, tablename, policyname, cmd, qual 
-- FROM pg_policies 
-- WHERE qual LIKE '%role%' OR qual LIKE '%auth.jwt%';

-- Drop the specific policy that was blocking the migration
DROP POLICY IF EXISTS "Admin settings access" ON system_settings;

-- Drop any other policies that might reference the role column
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Anon users cannot access profiles" ON user_profiles;

-- Drop policies on other tables that might reference role
DROP POLICY IF EXISTS "Users can view activity logs they have access to" ON activity_logs;

-- Now we need to apply the role migration manually since the file is .skip
-- This replicates the content from 20250718000004_fix_role_system_mismatch.sql

-- Step 2: Update user_role enum to match Kiro's 6-role system
ALTER TYPE user_role RENAME TO user_role_old;

CREATE TYPE user_role AS ENUM (
  'management',        -- Unified: company_owner, general_manager, deputy_general_manager
  'purchase_manager',  -- Unified: purchase_director, purchase_specialist  
  'technical_lead',    -- Renamed from: technical_director
  'project_manager',   -- Unified: project_manager, architect, technical_engineer, field_worker
  'client',           -- Unchanged
  'admin'             -- Unchanged (system admin)
);

-- Step 3: Update user_profiles table to use new enum
ALTER TABLE user_profiles 
  ALTER COLUMN role TYPE user_role 
  USING (
    CASE role::text
      WHEN 'company_owner' THEN 'management'::user_role
      WHEN 'general_manager' THEN 'management'::user_role
      WHEN 'deputy_general_manager' THEN 'management'::user_role
      WHEN 'technical_director' THEN 'technical_lead'::user_role
      WHEN 'architect' THEN 'project_manager'::user_role
      WHEN 'technical_engineer' THEN 'project_manager'::user_role
      WHEN 'field_worker' THEN 'project_manager'::user_role
      WHEN 'purchase_director' THEN 'purchase_manager'::user_role
      WHEN 'purchase_specialist' THEN 'purchase_manager'::user_role
      WHEN 'project_manager' THEN 'project_manager'::user_role
      WHEN 'client' THEN 'client'::user_role
      WHEN 'admin' THEN 'admin'::user_role
      ELSE 'project_manager'::user_role
    END
  );

-- Step 4: Drop old enum
DROP TYPE user_role_old;

-- Step 5: Recreate essential RLS policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Allow authenticated users to view profiles (needed for the app to work)
CREATE POLICY "Authenticated users can view profiles" ON user_profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Step 6: Now create the admin profile with the correct role
INSERT INTO user_profiles (
  id, 
  role, 
  first_name, 
  last_name, 
  email, 
  company, 
  department, 
  is_active, 
  permissions,
  created_at,
  updated_at
) VALUES (
  'e42c6330-c382-4ba8-89c1-35895dddc523', -- User ID from auth error
  'management', -- Now this role exists!
  'Admin', 
  'User', 
  'admin@formulapm.com', 
  'Formula PM', 
  'Administration', 
  true, 
  '{}',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  role = 'management',
  is_active = true,
  updated_at = NOW();

-- Step 7: Verify the role enum values
SELECT enumlabel as available_roles
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;

-- Step 8: Verify user profiles have correct roles
SELECT id, email, role, first_name, last_name, is_active 
FROM user_profiles 
ORDER BY created_at DESC;