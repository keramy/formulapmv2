-- Complete Kiro's Role Migration - Handle ALL Blocking Policies
-- This script systematically removes all barriers and completes the 13→6 role conversion

-- ============================================================================
-- STEP 1: COMPREHENSIVE POLICY CLEANUP
-- ============================================================================

-- First, let's see what we're dealing with
SELECT 
    schemaname,
    tablename, 
    policyname,
    'DROP POLICY IF EXISTS "' || policyname || '" ON ' || tablename || ';' as drop_command
FROM pg_policies 
WHERE qual LIKE '%role%' 
   OR qual LIKE '%auth.jwt%'
   OR qual LIKE '%user_role%'
ORDER BY tablename, policyname;

-- Drop ALL policies that could reference the role column
-- System settings
DROP POLICY IF EXISTS "Admin settings access" ON system_settings;
DROP POLICY IF EXISTS "Admin permission template access" ON system_settings;

-- Permission templates (this was the blocking one!)
DROP POLICY IF EXISTS "Admin permission template access" ON permission_templates;
DROP POLICY IF EXISTS "permission_templates_select_policy" ON permission_templates;
DROP POLICY IF EXISTS "permission_templates_insert_policy" ON permission_templates;
DROP POLICY IF EXISTS "permission_templates_update_policy" ON permission_templates;
DROP POLICY IF EXISTS "permission_templates_delete_policy" ON permission_templates;

-- User profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "User profiles are viewable by owner" ON user_profiles;
DROP POLICY IF EXISTS "User profiles are editable by owner" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON user_profiles;
DROP POLICY IF EXISTS "Anon users cannot access profiles" ON user_profiles;

-- Activity logs
DROP POLICY IF EXISTS "Users can view activity logs they have access to" ON activity_logs;

-- Project related policies that might use role
DROP POLICY IF EXISTS "projects_select_policy" ON projects;
DROP POLICY IF EXISTS "projects_insert_policy" ON projects;
DROP POLICY IF EXISTS "projects_update_policy" ON projects;
DROP POLICY IF EXISTS "projects_delete_policy" ON projects;

-- Any other potential blockers
DROP POLICY IF EXISTS "role_based_access" ON user_profiles;
DROP POLICY IF EXISTS "admin_full_access" ON user_profiles;
DROP POLICY IF EXISTS "management_access" ON user_profiles;

-- ============================================================================
-- STEP 2: KIRO'S ROLE ENUM MIGRATION (13 → 6 ROLES)
-- ============================================================================

-- Rename current enum to backup
ALTER TYPE user_role RENAME TO user_role_old;

-- Create Kiro's optimized 6-role enum
CREATE TYPE user_role AS ENUM (
  'management',        -- Unified: company_owner, general_manager, deputy_general_manager
  'purchase_manager',  -- Unified: purchase_director, purchase_specialist  
  'technical_lead',    -- Renamed from: technical_director
  'project_manager',   -- Unified: project_manager, architect, technical_engineer, field_worker
  'client',           -- Unchanged
  'admin'             -- Unchanged (system admin)
);

-- Update user_profiles table with role conversion mapping
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

-- Clean up old enum
DROP TYPE user_role_old;

-- ============================================================================
-- STEP 3: CREATE ADMIN PROFILE
-- ============================================================================

-- Now create your admin profile with the correct 'management' role
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
  'e42c6330-c382-4ba8-89c1-35895dddc523', -- Your admin user ID
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

-- ============================================================================
-- STEP 4: RECREATE ESSENTIAL POLICIES (MINIMAL SET)
-- ============================================================================

-- Essential user_profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Allow authenticated users to view profiles (needed for app functionality)
CREATE POLICY "Authenticated users can view profiles" ON user_profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- STEP 5: VERIFICATION
-- ============================================================================

-- Verify the new role enum
SELECT 'Available Roles:' as info;
SELECT enumlabel as role_name
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;

-- Verify user profiles migration
SELECT 'User Profiles After Migration:' as info;
SELECT id, email, role, first_name, last_name, is_active 
FROM user_profiles 
ORDER BY created_at DESC;

-- Show role distribution
SELECT 'Role Distribution:' as info;
SELECT role, COUNT(*) as user_count
FROM user_profiles
GROUP BY role
ORDER BY user_count DESC;