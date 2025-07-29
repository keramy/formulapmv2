-- Create Admin User - Simple Method
-- This creates a single admin user for testing

-- Create admin user in auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
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
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'authenticated',
  'authenticated',
  'admin@formulapm.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NULL,
  NULL,
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Admin","last_name":"User"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Create identity for the admin user
INSERT INTO auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at,
  email
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","email":"admin@formulapm.com"}',
  'email',
  NULL,
  NOW(),
  NOW(),
  'admin@formulapm.com'
);

-- Create user profile for admin
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
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'admin@formulapm.com',
  'Admin',
  'User',
  'admin',
  'executive',
  '+1234567890',
  'Formula PM',
  true
) ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '✅ Admin user created successfully!';
  RAISE NOTICE '📧 Email: admin@formulapm.com';
  RAISE NOTICE '🔑 Password: admin123';
  RAISE NOTICE '👤 Role: admin';
  RAISE NOTICE '🏢 Access: Full system access';
END $$;