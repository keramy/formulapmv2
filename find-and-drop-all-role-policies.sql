-- Find and drop ALL policies that reference the role column
-- This will allow Kiro's role migration to complete

-- Step 1: Find all policies that might reference role column
SELECT 
    schemaname,
    tablename, 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE qual LIKE '%role%' 
   OR qual LIKE '%auth.jwt%'
   OR qual LIKE '%user_role%'
ORDER BY tablename, policyname;

-- Step 2: Drop ALL policies that could be blocking the role column alteration
-- Based on the error, we need to drop the permission_templates policy too

-- System settings policies
DROP POLICY IF EXISTS "Admin settings access" ON system_settings;
DROP POLICY IF EXISTS "Admin permission template access" ON system_settings;

-- Permission templates policies  
DROP POLICY IF EXISTS "Admin permission template access" ON permission_templates;
DROP POLICY IF EXISTS "permission_templates_select_policy" ON permission_templates;
DROP POLICY IF EXISTS "permission_templates_insert_policy" ON permission_templates;
DROP POLICY IF EXISTS "permission_templates_update_policy" ON permission_templates;
DROP POLICY IF EXISTS "permission_templates_delete_policy" ON permission_templates;

-- User profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "User profiles are viewable by owner" ON user_profiles;
DROP POLICY IF EXISTS "User profiles are editable by owner" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON user_profiles;
DROP POLICY IF EXISTS "Anon users cannot access profiles" ON user_profiles;

-- Activity logs policies
DROP POLICY IF EXISTS "Users can view activity logs they have access to" ON activity_logs;

-- Any other policies that might reference role
DROP POLICY IF EXISTS "role_based_access" ON user_profiles;
DROP POLICY IF EXISTS "admin_full_access" ON user_profiles;
DROP POLICY IF EXISTS "management_access" ON user_profiles;

-- Drop any RLS policies on tables that might use role in their conditions
-- We'll recreate the essential ones after the migration