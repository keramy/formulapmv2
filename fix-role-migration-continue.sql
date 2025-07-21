-- Continue Role Migration (handling existing user_role_old)
-- This script picks up where the previous migration left off

-- First, check current state
SELECT 'Current user_role enum values:' as info;
SELECT enumlabel as role_name
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;

SELECT 'Checking if user_role_old exists:' as info;
SELECT typname FROM pg_type WHERE typname IN ('user_role', 'user_role_old');

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

-- Step 3: Handle the enum migration (accounting for existing user_role_old)
-- First drop the new user_role if it exists (from previous partial migration)
DO $$
BEGIN
    -- Check if we already have a new user_role enum
    IF EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'user_role' 
        AND EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
            AND enumlabel = 'management'
        )
    ) THEN
        -- We already have the new enum, skip creation
        RAISE NOTICE 'New user_role enum already exists, skipping creation';
    ELSE
        -- Create new enum
        CREATE TYPE user_role_new AS ENUM (
          'management',        
          'purchase_manager',  
          'technical_lead',    
          'project_manager',   
          'client',           
          'admin'             
        );
        
        -- Update user_profiles table to use new enum
        ALTER TABLE user_profiles 
          ALTER COLUMN role TYPE user_role_new 
          USING (
            CASE role::text
              WHEN 'company_owner' THEN 'management'::user_role_new
              WHEN 'general_manager' THEN 'management'::user_role_new
              WHEN 'deputy_general_manager' THEN 'management'::user_role_new
              WHEN 'technical_director' THEN 'technical_lead'::user_role_new
              WHEN 'architect' THEN 'project_manager'::user_role_new
              WHEN 'technical_engineer' THEN 'project_manager'::user_role_new
              WHEN 'field_worker' THEN 'project_manager'::user_role_new
              WHEN 'purchase_director' THEN 'purchase_manager'::user_role_new
              WHEN 'purchase_specialist' THEN 'purchase_manager'::user_role_new
              WHEN 'project_manager' THEN 'project_manager'::user_role_new
              WHEN 'client' THEN 'client'::user_role_new
              WHEN 'admin' THEN 'admin'::user_role_new
              ELSE 'project_manager'::user_role_new
            END
          );
        
        -- Drop old enum and rename new one
        DROP TYPE user_role CASCADE;
        ALTER TYPE user_role_new RENAME TO user_role;
    END IF;
END $$;

-- Step 4: Clean up user_role_old if it exists
DROP TYPE IF EXISTS user_role_old CASCADE;

-- Step 5: Create/update admin profile
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

-- Step 6: Re-enable RLS only on user_profiles and create minimal policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view profiles" ON user_profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Step 7: Verify the migration worked
SELECT 'Final role enum values:' as info;
SELECT enumlabel as role_name
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;

SELECT 'User profiles after migration:' as info;
SELECT id, email, role, first_name, last_name, is_active 
FROM user_profiles 
WHERE email IN ('admin@formulapm.com', 'owner.test@formulapm.com')
ORDER BY created_at DESC;