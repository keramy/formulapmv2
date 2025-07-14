-- Create Proper Auth User for Supabase - FIXED VERSION

-- Insert user with proper Supabase auth structure (removing generated columns)
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
    is_sso_user,
    is_anonymous
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
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    false,
    false
);

-- Create the user profile using the created user ID
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
) 
SELECT 
    u.id,
    'admin@formulapm.com',
    'Admin',
    'User',
    'company_owner',
    'Management',
    true,
    NOW(),
    NOW()
FROM auth.users u 
WHERE u.email = 'admin@formulapm.com';

-- Verify creation
SELECT 
    u.email,
    u.email_confirmed_at IS NOT NULL as email_confirmed,
    p.first_name || ' ' || p.last_name as full_name,
    p.role,
    u.raw_app_meta_data ->> 'user_role' as auth_role
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
WHERE u.email = 'admin@formulapm.com';

SELECT 'Admin user created successfully! Email: admin@formulapm.com Password: testpass123' as result;