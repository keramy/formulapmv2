-- Fix User Profiles - Manual Creation
-- Run this in your Supabase SQL Editor

-- Get the user IDs from auth.users
SELECT id, email, raw_user_meta_data FROM auth.users;

-- Insert user profiles for the existing users
-- Replace the UUIDs with the actual user IDs from the query above

-- Admin user profile
INSERT INTO public.user_profiles (
    id,
    role,
    first_name,
    last_name,
    email,
    company,
    department,
    permissions,
    is_active
) VALUES (
    '3b749b66-d2c3-4035-a7c2-1aa410831501', -- Replace with actual admin user ID
    'admin',
    'Admin',
    'User',
    'admin@formulapm.com',
    'Formula PM',
    'Administration',
    '{"all": true}',
    true
) ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    company = EXCLUDED.company,
    department = EXCLUDED.department,
    permissions = EXCLUDED.permissions,
    is_active = EXCLUDED.is_active;

-- Project Manager user profile
INSERT INTO public.user_profiles (
    id,
    role,
    first_name,
    last_name,
    email,
    company,
    department,
    permissions,
    is_active
) VALUES (
    'a9d7528b-c316-4795-9b53-be5439bd3dbd', -- Replace with actual PM user ID
    'project_manager',
    'Project',
    'Manager',
    'pm@formulapm.com',
    'Formula PM',
    'Project Management',
    '{"projects": ["read", "write"]}',
    true
) ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    company = EXCLUDED.company,
    department = EXCLUDED.department,
    permissions = EXCLUDED.permissions,
    is_active = EXCLUDED.is_active;

-- Client user profile
INSERT INTO public.user_profiles (
    id,
    role,
    first_name,
    last_name,
    email,
    company,
    department,
    permissions,
    is_active
) VALUES (
    '4147e3da-aad3-473d-b443-5fd6cea24dce', -- Replace with actual client user ID
    'client',
    'Test',
    'Client',
    'client@formulapm.com',
    'Test Company',
    'Operations',
    '{"client_portal": ["read"]}',
    true
) ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    company = EXCLUDED.company,
    department = EXCLUDED.department,
    permissions = EXCLUDED.permissions,
    is_active = EXCLUDED.is_active;

-- Verify profiles were created
SELECT id, email, role, first_name, last_name FROM public.user_profiles;