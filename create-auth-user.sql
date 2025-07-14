-- Create Proper Auth User for Supabase
-- This creates a user that will work with Supabase's auth system

-- Insert user with proper Supabase auth structure
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    email_change_sent_at,
    confirmation_sent_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change_token_current,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change_token,
    phone_change_sent_at,
    confirmed_at,
    email_change,
    banned_until,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    is_sso_user,
    deleted_at,
    is_anonymous
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@formulapm.com',
    crypt('testpass123', gen_salt('bf')),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    '',
    '',
    NOW(),
    NOW(),
    NULL,
    NULL,
    NULL,
    NULL,
    NOW(),
    NULL,
    NULL,
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    false,
    NULL,
    false
);

-- Get the user ID for profile creation
\set user_id (SELECT id FROM auth.users WHERE email = 'admin@formulapm.com')

-- Create the user profile
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

-- Verify creation
SELECT 
    u.email,
    u.email_confirmed_at IS NOT NULL as email_confirmed,
    u.confirmed_at IS NOT NULL as confirmed,
    p.first_name || ' ' || p.last_name as full_name,
    p.role
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
WHERE u.email = 'admin@formulapm.com';

SELECT 'Admin user created successfully! Email: admin@formulapm.com Password: testpass123' as result;