-- Step-by-Step Migration to Avoid Deadlocks
-- Run each step separately, waiting between steps

-- ============================================================================
-- STEP 1: DISABLE RLS TEMPORARILY (Run this first, wait 5 seconds)
-- ============================================================================

-- Disable RLS on key tables to prevent deadlocks
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE permission_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: DROP ALL POLICIES (Run this second, wait 5 seconds)
-- ============================================================================

-- Now drop all policies without RLS interference
DROP POLICY IF EXISTS "Admin settings access" ON system_settings;
DROP POLICY IF EXISTS "Admin permission template access" ON permission_templates;
DROP POLICY IF EXISTS "permission_templates_select_policy" ON permission_templates;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON user_profiles;

-- ============================================================================
-- STEP 3: ENUM MIGRATION (Run this third, wait 5 seconds)
-- ============================================================================

-- Now safely alter the enum
ALTER TYPE user_role RENAME TO user_role_old;

CREATE TYPE user_role AS ENUM (
  'management',        
  'purchase_manager',  
  'technical_lead',    
  'project_manager',   
  'client',           
  'admin'             
);

-- ============================================================================
-- STEP 4: UPDATE TABLE (Run this fourth, wait 5 seconds)
-- ============================================================================

-- Update the user_profiles table
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

-- ============================================================================
-- STEP 5: CLEANUP (Run this fifth, wait 5 seconds)
-- ============================================================================

-- Drop old enum
DROP TYPE user_role_old;

-- ============================================================================
-- STEP 6: CREATE ADMIN PROFILE (Run this sixth)
-- ============================================================================

-- Create your admin profile
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
  'e42c6330-c382-4ba8-89c1-35895dddc523',
  'management',
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
-- STEP 7: RE-ENABLE RLS (Run this last)
-- ============================================================================

-- Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create minimal policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view profiles" ON user_profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Verify it worked
SELECT enumlabel as available_roles
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;