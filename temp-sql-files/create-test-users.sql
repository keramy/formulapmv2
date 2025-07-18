-- Create Test Users for Formula PM
-- Date: 2025-01-11
-- Purpose: Create working test users with correct authentication setup

-- ============================================================================
-- STEP 1: CREATE AUTH USERS (In auth.users table)
-- ============================================================================

-- Note: In local Supabase, we need to create users in auth.users first
-- The password hash below is for 'testpass123' (bcrypt hash)

-- 1. Owner/Admin User
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@formulapm.com',
  '$2a$10$Q8D8tOoEuW7VGlE4.ZJXqOFEFy5Nh6ZGdFKb8VlKLY7J3eDcpzlYK', -- testpass123
  NOW(),
  NOW(),
  NOW(),
  '{"user_role": "company_owner", "is_active": true}',
  '{"name": "Admin User"}',
  false,
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- 2. Project Manager User
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'pm@formulapm.com',
  '$2a$10$Q8D8tOoEuW7VGlE4.ZJXqOFEFy5Nh6ZGdFKb8VlKLY7J3eDcpzlYK', -- testpass123
  NOW(),
  NOW(),
  NOW(),
  '{"user_role": "project_manager", "is_active": true}',
  '{"name": "Project Manager"}',
  false,
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- STEP 2: CREATE USER PROFILES (In user_profiles table)
-- ============================================================================

-- 1. Admin Profile
INSERT INTO user_profiles (
  id,
  email,
  full_name,
  role,
  department,
  is_active,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@formulapm.com'),
  'admin@formulapm.com',
  'Admin User',
  'company_owner',
  'Management',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- 2. Project Manager Profile
INSERT INTO user_profiles (
  id,
  email,
  full_name,
  role,
  department,
  is_active,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'pm@formulapm.com'),
  'pm@formulapm.com',
  'Project Manager',
  'project_manager',
  'Projects',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- STEP 3: VERIFY USERS CREATED
-- ============================================================================

-- Check auth users
SELECT 
  email, 
  email_confirmed_at IS NOT NULL as confirmed,
  raw_app_meta_data ->> 'user_role' as role
FROM auth.users 
WHERE email IN ('admin@formulapm.com', 'pm@formulapm.com');

-- Check user profiles
SELECT 
  email,
  full_name,
  role,
  is_active
FROM user_profiles 
WHERE email IN ('admin@formulapm.com', 'pm@formulapm.com');

SELECT 'Test users created successfully! Use credentials: admin@formulapm.com / testpass123 or pm@formulapm.com / testpass123' as result;