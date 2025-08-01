-- Formula PM 2.0 Admin User Creation
-- Created: 2025-01-24
-- Purpose: Create single admin user for system administration
-- Password: admin123

-- ============================================================================
-- CREATE ADMIN USER IN AUTH.USERS
-- ============================================================================

-- Insert admin user into auth.users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES 
  -- Admin user with full system access
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin@formulapm.com', 
   crypt('admin123', gen_salt('bf')), NOW(), NOW(), NOW(), 
   '{"provider": "email", "providers": ["email"], "user_role": "admin"}'::jsonb, 
   '{"first_name": "Admin", "last_name": "User"}'::jsonb)
ON CONFLICT (email) DO UPDATE SET
  encrypted_password = EXCLUDED.encrypted_password,
  updated_at = NOW(),
  raw_app_meta_data = EXCLUDED.raw_app_meta_data,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data;

-- ============================================================================
-- CREATE CORRESPONDING USER PROFILES
-- ============================================================================

-- Insert user profile for admin user
INSERT INTO user_profiles (id, email, first_name, last_name, role, department, is_active, created_at, updated_at)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin@formulapm.com', 'Admin', 'User', 'admin', 'Administration', true, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  user_count INTEGER;
  profile_count INTEGER;
BEGIN
  -- Count created users
  SELECT COUNT(*) INTO user_count FROM auth.users WHERE email = 'admin@formulapm.com';
  SELECT COUNT(*) INTO profile_count FROM user_profiles WHERE email = 'admin@formulapm.com';
  
  -- Report results
  RAISE NOTICE '✅ Admin user creation completed:';
  RAISE NOTICE '   Auth users created: %', user_count;
  RAISE NOTICE '   User profiles created: %', profile_count;
  
  IF user_count = 1 AND profile_count = 1 THEN
    RAISE NOTICE '🎉 Admin user setup successful!';
    RAISE NOTICE '📧 Login: admin@formulapm.com';
    RAISE NOTICE '🔐 Password: admin123';
  ELSE
    RAISE WARNING '⚠️ Admin user setup incomplete. Check for errors above.';
  END IF;
END $$;