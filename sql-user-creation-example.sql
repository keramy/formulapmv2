-- SQL Template for Creating Users in Migration
-- Use this pattern in migration files

-- Create Admin User
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),  -- Or use specific UUID
  'authenticated',
  'authenticated',
  'admin@formulapm.com',
  crypt('admin123', gen_salt('bf')),  -- bcrypt hash
  NOW(),
  '{"provider":"email","providers":["email"],"user_role":"admin"}',
  '{"first_name":"Admin","last_name":"User"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Create Identity (required for auth)
INSERT INTO auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at,
  email
) 
SELECT 
  u.id,  -- provider_id same as user_id for email
  u.id,  -- user_id
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  NULL,
  NOW(),
  NOW(),
  u.email
FROM auth.users u 
WHERE u.email = 'admin@formulapm.com'
ON CONFLICT (provider_id, provider) DO NOTHING;

-- Create User Profile
INSERT INTO user_profiles (
  id,
  email,
  first_name,
  last_name,
  role,
  seniority,
  phone,
  company,
  is_active
)
SELECT 
  u.id,
  u.email,
  'Admin',
  'User',
  'admin',
  'executive',
  '+1234567890',
  'Formula PM',
  true
FROM auth.users u 
WHERE u.email = 'admin@formulapm.com'
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;