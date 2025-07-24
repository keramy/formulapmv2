-- COMPREHENSIVE ROLE SYSTEM FIX
-- This migration applies after all existing migrations to convert to 6-role system
-- It handles any remaining issues from legacy migrations

-- Step 1: Create the correct 6-role enum if it doesn't exist
DO $$ 
BEGIN
  -- Check if current enum has the old 13 roles and replace it
  IF EXISTS (
    SELECT 1 FROM pg_enum e 
    JOIN pg_type t ON t.oid = e.enumtypid 
    WHERE t.typname = 'user_role' AND e.enumlabel = 'company_owner'
  ) THEN
    -- The enum still has old values, we need to fix this
    
    -- Create new enum with 6 roles
    CREATE TYPE user_role_6system AS ENUM (
      'management',       
      'purchase_manager', 
      'technical_lead',   
      'project_manager',  
      'client',          
      'admin'            
    );

    -- Add seniority column if it doesn't exist
    ALTER TABLE user_profiles 
    ADD COLUMN IF NOT EXISTS seniority TEXT DEFAULT 'regular'
    CHECK (seniority IN ('executive', 'senior', 'regular'));

    -- Add temporary migration column
    ALTER TABLE user_profiles 
    ADD COLUMN temp_role user_role_6system;

    -- Map all existing users to new 6-role system
    UPDATE user_profiles SET 
    temp_role = CASE 
      WHEN role IN ('company_owner', 'general_manager', 'deputy_general_manager') THEN 'management'::user_role_6system
      WHEN role IN ('purchase_director', 'purchase_specialist') THEN 'purchase_manager'::user_role_6system
      WHEN role IN ('technical_director', 'architect', 'technical_engineer') THEN 'technical_lead'::user_role_6system
      WHEN role = 'project_manager' THEN 'project_manager'::user_role_6system
      WHEN role IN ('field_worker', 'subcontractor') THEN 'technical_lead'::user_role_6system
      WHEN role = 'client' THEN 'client'::user_role_6system
      WHEN role = 'admin' THEN 'admin'::user_role_6system
      ELSE 'project_manager'::user_role_6system
    END,
    seniority = CASE 
      WHEN role IN ('company_owner', 'general_manager') THEN 'executive'
      WHEN role IN ('deputy_general_manager', 'technical_director', 'purchase_director') THEN 'senior'
      ELSE 'regular'
    END;

    -- Drop all policies that might depend on the old roles (comprehensive cleanup)
    DROP POLICY IF EXISTS "Restrict role changes" ON user_profiles;
    
    -- Switch to new role system
    ALTER TABLE user_profiles DROP COLUMN role;
    ALTER TABLE user_profiles RENAME COLUMN temp_role TO role;
    ALTER TABLE user_profiles ALTER COLUMN role SET NOT NULL;

    -- Replace old enum with new one
    DROP TYPE user_role CASCADE;
    ALTER TYPE user_role_6system RENAME TO user_role;

    -- Update JWT claims for all users with new roles
    UPDATE auth.users 
    SET raw_app_meta_data = jsonb_set(
      COALESCE(raw_app_meta_data, '{}'::jsonb),
      '{user_role}',
      to_jsonb(up.role::text)
    )
    FROM user_profiles up
    WHERE auth.users.id = up.id;

    -- Create essential new RLS policies with 6-role system
    CREATE POLICY "management_and_admin_can_update_roles" ON user_profiles
    FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = (SELECT auth.uid())
          AND up.role IN ('management', 'admin')
      ) 
      OR id = (SELECT auth.uid())  -- Users can update their own profile (but not role)
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_user_profiles_role_6system ON user_profiles(role);
    CREATE INDEX IF NOT EXISTS idx_user_profiles_seniority ON user_profiles(seniority);
    
  END IF;
END $$;

-- Step 2: Create test users for all 6 roles if they don't exist
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'management.test@formulapm.com', crypt('testpass123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"user_role": "management"}'::jsonb, '{}'::jsonb),
  ('22222222-2222-2222-2222-222222222222', 'purchase.test@formulapm.com', crypt('testpass123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"user_role": "purchase_manager"}'::jsonb, '{}'::jsonb),
  ('33333333-3333-3333-3333-333333333333', 'technical.test@formulapm.com', crypt('testpass123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"user_role": "technical_lead"}'::jsonb, '{}'::jsonb),
  ('44444444-4444-4444-4444-444444444444', 'pm.test@formulapm.com', crypt('testpass123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"user_role": "project_manager"}'::jsonb, '{}'::jsonb),
  ('55555555-5555-5555-5555-555555555555', 'client.test@formulapm.com', crypt('testpass123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"user_role": "client"}'::jsonb, '{}'::jsonb),
  ('66666666-6666-6666-6666-666666666666', 'admin.test@formulapm.com', crypt('testpass123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"user_role": "admin"}'::jsonb, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Add seniority column at the beginning if it doesn't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS seniority TEXT DEFAULT 'regular'
CHECK (seniority IN ('executive', 'senior', 'regular'));

-- Create corresponding profiles for test users  
INSERT INTO user_profiles (id, first_name, last_name, email, role, seniority, is_active, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Management', 'User', 'management.test@formulapm.com', 'management', 'executive', true, NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'Purchase', 'Manager', 'purchase.test@formulapm.com', 'purchase_manager', 'senior', true, NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'Technical', 'Lead', 'technical.test@formulapm.com', 'technical_lead', 'senior', true, NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444444', 'Project', 'Manager', 'pm.test@formulapm.com', 'project_manager', 'regular', true, NOW(), NOW()),
  ('55555555-5555-5555-5555-555555555555', 'Client', 'User', 'client.test@formulapm.com', 'client', 'regular', true, NOW(), NOW()),
  ('66666666-6666-6666-6666-666666666666', 'Admin', 'User', 'admin.test@formulapm.com', 'admin', 'regular', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Final verification and status
SELECT 'COMPREHENSIVE ROLE SYSTEM MIGRATION COMPLETED!' as status;
SELECT '6-ROLE SYSTEM NOW ACTIVE' as info;
SELECT role, count(*) as user_count, 
       string_agg(DISTINCT seniority, ', ' ORDER BY seniority) as seniority_levels
FROM user_profiles 
GROUP BY role 
ORDER BY role;

-- Show available role enum values
SELECT 'Available roles:' as info, unnest(enum_range(NULL::user_role)) as roles;