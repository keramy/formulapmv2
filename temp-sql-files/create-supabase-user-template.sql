-- Proper Supabase User Creation Template
-- This template ensures all required fields are properly set to avoid auth errors

-- Template for creating authenticated users that work with Supabase auth
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
    is_anonymous,
    -- Critical: These fields must be empty strings, not NULL
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change_token_current,
    email_change,
    phone_change_token,
    phone_change
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    '[EMAIL]',                                              -- Replace with actual email
    crypt('[PASSWORD]', gen_salt('bf')),                   -- Replace with actual password
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false,
    false,
    false,
    '',  -- Must be empty string, not NULL
    '',  -- Must be empty string, not NULL
    '',  -- Must be empty string, not NULL
    '',  -- Must be empty string, not NULL
    '',  -- Must be empty string, not NULL
    '',  -- Must be empty string, not NULL
    ''   -- Must be empty string, not NULL
);

-- Create corresponding user profile
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
    '[EMAIL]',                    -- Replace with actual email
    '[FIRST_NAME]',               -- Replace with actual first name
    '[LAST_NAME]',                -- Replace with actual last name
    '[USER_ROLE]',                -- Replace with actual role (company_owner, project_manager, etc.)
    '[DEPARTMENT]',               -- Replace with actual department
    true,
    NOW(),
    NOW()
FROM auth.users u 
WHERE u.email = '[EMAIL]';        -- Replace with actual email

-- Usage Example:
-- Replace [EMAIL] with: admin@formulapm.com
-- Replace [PASSWORD] with: testpass123  
-- Replace [FIRST_NAME] with: Admin
-- Replace [LAST_NAME] with: User
-- Replace [USER_ROLE] with: company_owner
-- Replace [DEPARTMENT] with: Management