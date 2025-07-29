-- FORCE 6-ROLE SYSTEM MIGRATION
-- This migration forcefully converts the database to the 6-role system
-- It runs right before the comprehensive fix

-- Drop all existing RLS policies to avoid conflicts
DO $$
DECLARE
    policy_name TEXT;
BEGIN
    -- Get all policies and drop them
    FOR policy_name IN 
        SELECT pol.polname 
        FROM pg_policy pol 
        JOIN pg_class cl ON pol.polrelid = cl.oid 
        WHERE cl.relname IN ('user_profiles', 'projects', 'scope_items', 'material_specs', 'vendors', 'suppliers', 'purchase_requests', 'system_settings')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON ' || 
            (SELECT cl.relname FROM pg_policy pol JOIN pg_class cl ON pol.polrelid = cl.oid WHERE pol.polname = policy_name LIMIT 1);
    END LOOP;
END $$;

-- Now create the new 6-role enum
CREATE TYPE user_role_6roles AS ENUM (
  'management',       
  'purchase_manager', 
  'technical_lead',   
  'project_manager',  
  'client',          
  'admin'            
);

-- Add seniority column
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS seniority TEXT DEFAULT 'regular'
CHECK (seniority IN ('executive', 'senior', 'regular'));

-- Add temp role column
ALTER TABLE user_profiles 
ADD COLUMN migration_role user_role_6roles;

-- Map all existing users to the new 6-role system
UPDATE user_profiles SET 
migration_role = CASE role::text
  WHEN 'company_owner' THEN 'management'::user_role_6roles
  WHEN 'general_manager' THEN 'management'::user_role_6roles  
  WHEN 'deputy_general_manager' THEN 'management'::user_role_6roles
  WHEN 'technical_director' THEN 'technical_lead'::user_role_6roles
  WHEN 'architect' THEN 'technical_lead'::user_role_6roles
  WHEN 'technical_engineer' THEN 'technical_lead'::user_role_6roles
  WHEN 'purchase_director' THEN 'purchase_manager'::user_role_6roles
  WHEN 'purchase_specialist' THEN 'purchase_manager'::user_role_6roles
  WHEN 'field_worker' THEN 'technical_lead'::user_role_6roles
  WHEN 'subcontractor' THEN 'technical_lead'::user_role_6roles
  WHEN 'project_manager' THEN 'project_manager'::user_role_6roles
  WHEN 'client' THEN 'client'::user_role_6roles
  WHEN 'admin' THEN 'admin'::user_role_6roles
  ELSE 'project_manager'::user_role_6roles
END,
seniority = CASE role::text
  WHEN 'company_owner' THEN 'executive'
  WHEN 'general_manager' THEN 'executive'
  WHEN 'deputy_general_manager' THEN 'senior'
  WHEN 'technical_director' THEN 'senior'
  WHEN 'purchase_director' THEN 'senior'
  ELSE 'regular'
END;

-- Switch to the new role system
ALTER TABLE user_profiles DROP COLUMN role CASCADE;
ALTER TABLE user_profiles RENAME COLUMN migration_role TO role;
ALTER TABLE user_profiles ALTER COLUMN role SET NOT NULL;

-- Drop old enum and rename new one
DROP TYPE user_role CASCADE;
ALTER TYPE user_role_6roles RENAME TO user_role;

-- Update JWT claims
UPDATE auth.users 
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{user_role}',
  to_jsonb(up.role::text)
)
FROM user_profiles up
WHERE auth.users.id = up.id;

-- Basic RLS policy for user profiles
CREATE POLICY "users_can_view_own_profile" ON user_profiles
FOR SELECT USING (id = (SELECT auth.uid()));

CREATE POLICY "management_and_admin_can_manage_users" ON user_profiles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = (SELECT auth.uid())
      AND up.role IN ('management', 'admin')
  )
  OR id = (SELECT auth.uid())
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_6 ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_seniority ON user_profiles(seniority);

SELECT 'FORCED 6-ROLE SYSTEM CONVERSION COMPLETED' as status;