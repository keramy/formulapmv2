-- Recreate Test Users - Fix Authentication Issue
-- The previous migration created user_profiles but not auth.users
-- This migration properly creates users in auth.users table

-- ============================================================================
-- CLEAN UP EXISTING TEST USERS (if any)
-- ============================================================================

-- First delete all dependent records to avoid foreign key constraints
DELETE FROM project_assignments WHERE user_id IN (
  SELECT id FROM user_profiles WHERE email LIKE '%test@formulapm.com'
);

-- Delete projects that reference test clients or managers
DELETE FROM projects WHERE 
  client_id IN (SELECT id FROM clients WHERE user_id IN (SELECT id FROM user_profiles WHERE email LIKE '%test@formulapm.com'))
  OR project_manager_id IN (SELECT id FROM user_profiles WHERE email LIKE '%test@formulapm.com');

-- Delete test clients
DELETE FROM clients WHERE user_id IN (
  SELECT id FROM user_profiles WHERE email LIKE '%test@formulapm.com'
);

-- Delete existing test users from auth.users to avoid conflicts
DELETE FROM auth.users WHERE email LIKE '%test@formulapm.com';

-- ============================================================================ 
-- CREATE TEST USERS IN AUTH.USERS WITH PROPER PASSWORD HASHING
-- ============================================================================

-- Insert test users into auth.users with proper bcrypt hashing
INSERT INTO auth.users (
  id, 
  instance_id, 
  email, 
  encrypted_password, 
  email_confirmed_at, 
  created_at, 
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES 
  -- Management user
  ('11111111-1111-1111-1111-111111111111'::uuid, 
   '00000000-0000-0000-0000-000000000000'::uuid,
   'management.test@formulapm.com', 
   crypt('testpass123', gen_salt('bf')), 
   NOW(), 
   NOW(), 
   NOW(),
   '{"provider": "email", "providers": ["email"], "user_role": "management"}'::jsonb,
   '{"first_name": "Management", "last_name": "User"}'::jsonb,
   false,
   'authenticated'),
  
  -- Purchase Manager
  ('22222222-2222-2222-2222-222222222222'::uuid, 
   '00000000-0000-0000-0000-000000000000'::uuid,
   'purchase.test@formulapm.com', 
   crypt('testpass123', gen_salt('bf')), 
   NOW(), 
   NOW(), 
   NOW(),
   '{"provider": "email", "providers": ["email"], "user_role": "purchase_manager"}'::jsonb,
   '{"first_name": "Purchase", "last_name": "Manager"}'::jsonb,
   false,
   'authenticated'),
  
  -- Technical Lead
  ('33333333-3333-3333-3333-333333333333'::uuid, 
   '00000000-0000-0000-0000-000000000000'::uuid,
   'technical.test@formulapm.com', 
   crypt('testpass123', gen_salt('bf')), 
   NOW(), 
   NOW(), 
   NOW(),
   '{"provider": "email", "providers": ["email"], "user_role": "technical_lead"}'::jsonb,
   '{"first_name": "Technical", "last_name": "Lead"}'::jsonb,
   false,
   'authenticated'),
  
  -- Project Manager
  ('44444444-4444-4444-4444-444444444444'::uuid, 
   '00000000-0000-0000-0000-000000000000'::uuid,
   'pm.test@formulapm.com', 
   crypt('testpass123', gen_salt('bf')), 
   NOW(), 
   NOW(), 
   NOW(),
   '{"provider": "email", "providers": ["email"], "user_role": "project_manager"}'::jsonb,
   '{"first_name": "Project", "last_name": "Manager"}'::jsonb,
   false,
   'authenticated'),
  
  -- Client
  ('55555555-5555-5555-5555-555555555555'::uuid, 
   '00000000-0000-0000-0000-000000000000'::uuid,
   'client.test@formulapm.com', 
   crypt('testpass123', gen_salt('bf')), 
   NOW(), 
   NOW(), 
   NOW(),
   '{"provider": "email", "providers": ["email"], "user_role": "client"}'::jsonb,
   '{"first_name": "Client", "last_name": "User"}'::jsonb,
   false,
   'authenticated'),
  
  -- Admin
  ('66666666-6666-6666-6666-666666666666'::uuid, 
   '00000000-0000-0000-0000-000000000000'::uuid,
   'admin.test@formulapm.com', 
   crypt('testpass123', gen_salt('bf')), 
   NOW(), 
   NOW(), 
   NOW(),
   '{"provider": "email", "providers": ["email"], "user_role": "admin"}'::jsonb,
   '{"first_name": "Admin", "last_name": "User"}'::jsonb,
   false,
   'authenticated')

ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  raw_app_meta_data = EXCLUDED.raw_app_meta_data,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data;

-- ============================================================================
-- CREATE IDENTITIES FOR EMAIL PROVIDER
-- ============================================================================

-- Insert corresponding identities for email authentication
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES 
  ('11111111-1111-1111-1111-111111111111'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 
   '{"sub": "11111111-1111-1111-1111-111111111111", "email": "management.test@formulapm.com"}'::jsonb,
   'email', NOW(), NOW(), NOW()),
  
  ('22222222-2222-2222-2222-222222222222'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 
   '{"sub": "22222222-2222-2222-2222-222222222222", "email": "purchase.test@formulapm.com"}'::jsonb,
   'email', NOW(), NOW(), NOW()),
  
  ('33333333-3333-3333-3333-333333333333'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 
   '{"sub": "33333333-3333-3333-3333-333333333333", "email": "technical.test@formulapm.com"}'::jsonb,
   'email', NOW(), NOW(), NOW()),
  
  ('44444444-4444-4444-4444-444444444444'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, 
   '{"sub": "44444444-4444-4444-4444-444444444444", "email": "pm.test@formulapm.com"}'::jsonb,
   'email', NOW(), NOW(), NOW()),
  
  ('55555555-5555-5555-5555-555555555555'::uuid, '55555555-5555-5555-5555-555555555555'::uuid, 
   '{"sub": "55555555-5555-5555-5555-555555555555", "email": "client.test@formulapm.com"}'::jsonb,
   'email', NOW(), NOW(), NOW()),
  
  ('66666666-6666-6666-6666-666666666666'::uuid, '66666666-6666-6666-6666-666666666666'::uuid, 
   '{"sub": "66666666-6666-6666-6666-666666666666", "email": "admin.test@formulapm.com"}'::jsonb,
   'email', NOW(), NOW(), NOW())

ON CONFLICT (id) DO UPDATE SET 
  identity_data = EXCLUDED.identity_data,
  updated_at = EXCLUDED.updated_at;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify users were created successfully
DO $$
DECLARE
  auth_user_count INTEGER;
  profile_count INTEGER;
  user_record RECORD;
BEGIN
  SELECT COUNT(*) INTO auth_user_count FROM auth.users WHERE email LIKE '%test@formulapm.com';
  SELECT COUNT(*) INTO profile_count FROM user_profiles WHERE email LIKE '%test@formulapm.com';
  
  RAISE NOTICE '✅ Created % auth users and % user profiles', auth_user_count, profile_count;
  
  -- Show auth users
  RAISE NOTICE '📧 AUTH.USERS:';
  FOR user_record IN (SELECT email, id FROM auth.users WHERE email LIKE '%test@formulapm.com' ORDER BY email)
  LOOP
    RAISE NOTICE '  📧 % - ID: %', user_record.email, user_record.id;
  END LOOP;
  
  -- Show user profiles
  RAISE NOTICE '👥 USER_PROFILES:';
  FOR user_record IN (SELECT email, role, seniority FROM user_profiles WHERE email LIKE '%test@formulapm.com' ORDER BY email)
  LOOP
    RAISE NOTICE '  👤 % - Role: % - Seniority: %', user_record.email, user_record.role, user_record.seniority;
  END LOOP;
  
  IF auth_user_count = 6 AND profile_count = 6 THEN
    RAISE NOTICE '🎉 SUCCESS: All test users created successfully!';
    RAISE NOTICE '🔐 Test Credentials: All emails with password "testpass123"';
  ELSE
    RAISE NOTICE '❌ WARNING: Expected 6 auth users and 6 profiles, got % and %', auth_user_count, profile_count;
  END IF;
END $$;