-- Create admin user in Supabase
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

-- Create owner.test@formulapm.com user
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
    'owner.test@formulapm.com',
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

-- Create user profiles
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
    'owner.test@formulapm.com',
    'Owner',
    'Test',
    'company_owner',
    'Management',
    true,
    NOW(),
    NOW()
FROM auth.users u 
WHERE u.email = 'owner.test@formulapm.com';