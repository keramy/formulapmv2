-- Create Test Users for Formula PM - FIXED VERSION
-- Date: 2025-01-11
-- Purpose: Create working test users with correct authentication setup

-- ============================================================================
-- STEP 1: CREATE AUTH USERS (Using Supabase auth system)
-- ============================================================================

-- Create admin user using Supabase's auth system
-- The trigger will automatically create the profile

-- Create the auth user directly (simpler approach)
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
  is_super_admin
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated', 
  'admin@formulapm.com',
  crypt('testpass123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false
);

-- ============================================================================
-- STEP 2: CREATE USER PROFILES (In user_profiles table)
-- ============================================================================

-- 1. Admin Profile
INSERT INTO user_profiles (
  id,
  email,
  first_name,
  last_name,
  role,
  department,
  is_active,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@formulapm.com'),
  'admin@formulapm.com',
  'Admin',
  'User',
  'company_owner',
  'Management',
  true,
  NOW(),
  NOW()
);

-- ============================================================================
-- STEP 3: VERIFY USERS CREATED
-- ============================================================================

-- Check auth users
SELECT 
  email, 
  email_confirmed_at IS NOT NULL as confirmed,
  raw_app_meta_data ->> 'user_role' as role
FROM auth.users 
WHERE email = 'admin@formulapm.com';

-- Check user profiles  
SELECT 
  email,
  first_name || ' ' || last_name as full_name,
  role,
  is_active
FROM user_profiles 
WHERE email = 'admin@formulapm.com';

SELECT 'Test user created successfully! Use credentials: admin@formulapm.com / testpass123' as result;