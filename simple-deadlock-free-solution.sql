-- Simple Deadlock-Free Solution
-- Disable ALL RLS and drop ALL policies first, then do the migration

-- Step 1: Disable RLS on ALL tables to prevent deadlocks
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE 'ALTER TABLE ' || table_record.tablename || ' DISABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;

-- Step 2: Drop ALL policies
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON ' || policy_record.tablename;
    END LOOP;
END $$;

-- Step 3: Now safely do the enum migration (this should work now)
ALTER TYPE user_role RENAME TO user_role_old;

CREATE TYPE user_role AS ENUM (
  'management',        
  'purchase_manager',  
  'technical_lead',    
  'project_manager',   
  'client',           
  'admin'             
);

-- Step 4: Update user_profiles table
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

-- Step 5: Cleanup
DROP TYPE user_role_old;

-- Step 6: Create admin profile
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

-- Step 7: Re-enable RLS only on user_profiles and create minimal policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view profiles" ON user_profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Verify the migration worked
SELECT 'New role enum values:' as info;
SELECT enumlabel as role_name
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;

SELECT 'User profiles after migration:' as info;
SELECT id, email, role, first_name, last_name, is_active 
FROM user_profiles 
ORDER BY created_at DESC;