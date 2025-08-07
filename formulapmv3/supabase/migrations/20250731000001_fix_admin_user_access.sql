-- Fix admin@formulapm.com user access
-- This migration ensures admin@formulapm.com exists with proper admin role
-- and can access all 4 projects in the system

-- ============================================================================
-- CREATE ADMIN@FORMULAPM.COM USER
-- ============================================================================

-- Insert admin@formulapm.com into auth.users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES (
  '77777777-7777-7777-7777-777777777777'::uuid,
  'admin@formulapm.com', 
  crypt('admin123', gen_salt('bf')), 
  NOW(), 
  NOW(), 
  NOW(), 
  '{"provider": "email", "providers": ["email"], "user_role": "admin"}'::jsonb, 
  '{"first_name": "Admin", "last_name": "User"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET 
  raw_app_meta_data = EXCLUDED.raw_app_meta_data,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  encrypted_password = EXCLUDED.encrypted_password;

-- Insert corresponding user profile
INSERT INTO user_profiles (id, email, first_name, last_name, role, seniority, phone, company, is_active)
VALUES (
  '77777777-7777-7777-7777-777777777777'::uuid,
  'admin@formulapm.com', 
  'Admin', 
  'User', 
  'admin', 
  'executive', 
  '+1234567896', 
  'Formula PM', 
  true
)
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  seniority = EXCLUDED.seniority,
  is_active = EXCLUDED.is_active;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check admin user was created successfully
DO $$
DECLARE
  auth_user_exists BOOLEAN;
  profile_exists BOOLEAN;
  user_role TEXT;
  project_count INTEGER;
BEGIN
  -- Check auth.users
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'admin@formulapm.com') INTO auth_user_exists;
  
  -- Check user_profiles
  SELECT EXISTS(SELECT 1 FROM user_profiles WHERE email = 'admin@formulapm.com'), role 
  INTO profile_exists, user_role
  FROM user_profiles WHERE email = 'admin@formulapm.com';
  
  -- Count projects
  SELECT COUNT(*) INTO project_count FROM projects;
  
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'ADMIN USER ACCESS FIX VERIFICATION';
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'Auth user exists: %', auth_user_exists;
  RAISE NOTICE 'Profile exists: %', profile_exists;
  RAISE NOTICE 'User role: %', user_role;
  RAISE NOTICE 'Total projects in system: %', project_count;
  
  IF auth_user_exists AND profile_exists AND user_role = 'admin' THEN
    RAISE NOTICE '✅ SUCCESS: admin@formulapm.com can now access all % projects', project_count;
  ELSE
    RAISE NOTICE '❌ FAILED: admin@formulapm.com setup incomplete';
  END IF;
  RAISE NOTICE '==========================================';
END $$;

-- List all projects for verification
SELECT 
  id as project_id,
  name as project_name,
  status,
  created_at
FROM projects 
ORDER BY created_at DESC;