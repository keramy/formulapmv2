-- Check and Fix Users - Step by Step
-- Run this in your Supabase SQL Editor

-- Step 1: Check what users exist in auth.users
SELECT id, email, raw_user_meta_data, created_at 
FROM auth.users 
ORDER BY created_at DESC;

-- Step 2: Check what profiles exist
SELECT id, email, role, first_name, last_name 
FROM public.user_profiles;

-- Step 3: Create users directly in auth.users table (if they don't exist)
-- This uses the auth.users table directly with proper password hashing

-- Insert admin user
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
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@formulapm.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "Admin", "last_name": "User", "role": "admin"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
) ON CONFLICT (email) DO NOTHING;

-- Insert project manager user
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
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'pm@formulapm.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "Project", "last_name": "Manager", "role": "project_manager"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
) ON CONFLICT (email) DO NOTHING;

-- Insert client user
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
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'client@formulapm.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "Test", "last_name": "Client", "role": "client"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
) ON CONFLICT (email) DO NOTHING;

-- Step 4: Now create profiles for the users that exist
-- Get the actual user IDs first
DO $$
DECLARE
    admin_user_id uuid;
    pm_user_id uuid;
    client_user_id uuid;
BEGIN
    -- Get user IDs
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@formulapm.com';
    SELECT id INTO pm_user_id FROM auth.users WHERE email = 'pm@formulapm.com';
    SELECT id INTO client_user_id FROM auth.users WHERE email = 'client@formulapm.com';
    
    -- Create admin profile
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.user_profiles (
            id, role, first_name, last_name, email, company, department, permissions, is_active
        ) VALUES (
            admin_user_id, 'admin', 'Admin', 'User', 'admin@formulapm.com', 
            'Formula PM', 'Administration', '{"all": true}', true
        ) ON CONFLICT (id) DO UPDATE SET
            role = EXCLUDED.role,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            email = EXCLUDED.email,
            company = EXCLUDED.company,
            department = EXCLUDED.department,
            permissions = EXCLUDED.permissions,
            is_active = EXCLUDED.is_active;
    END IF;
    
    -- Create PM profile
    IF pm_user_id IS NOT NULL THEN
        INSERT INTO public.user_profiles (
            id, role, first_name, last_name, email, company, department, permissions, is_active
        ) VALUES (
            pm_user_id, 'project_manager', 'Project', 'Manager', 'pm@formulapm.com', 
            'Formula PM', 'Project Management', '{"projects": ["read", "write"]}', true
        ) ON CONFLICT (id) DO UPDATE SET
            role = EXCLUDED.role,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            email = EXCLUDED.email,
            company = EXCLUDED.company,
            department = EXCLUDED.department,
            permissions = EXCLUDED.permissions,
            is_active = EXCLUDED.is_active;
    END IF;
    
    -- Create client profile
    IF client_user_id IS NOT NULL THEN
        INSERT INTO public.user_profiles (
            id, role, first_name, last_name, email, company, department, permissions, is_active
        ) VALUES (
            client_user_id, 'client', 'Test', 'Client', 'client@formulapm.com', 
            'Test Company', 'Operations', '{"client_portal": ["read"]}', true
        ) ON CONFLICT (id) DO UPDATE SET
            role = EXCLUDED.role,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            email = EXCLUDED.email,
            company = EXCLUDED.company,
            department = EXCLUDED.department,
            permissions = EXCLUDED.permissions,
            is_active = EXCLUDED.is_active;
    END IF;
END $$;

-- Step 5: Verify everything is working
SELECT u.id, u.email, p.role, p.first_name, p.last_name
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.id
ORDER BY u.created_at DESC;