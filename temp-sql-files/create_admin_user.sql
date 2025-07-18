-- Create Admin User Profile
-- Replace 'USER_ID_HERE' with the actual UUID from the auth.users table

-- First, get the user ID (run this to see the user ID)
SELECT id, email FROM auth.users WHERE email = 'admin@formulapm.com';

-- Then insert the profile (replace the UUID with the actual user ID from above)
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
    'USER_ID_HERE', -- Replace with actual user ID
    'admin',
    'Admin',
    'User',
    'admin@formulapm.com',
    'Formula PM',
    'Administration',
    '{"all": true}',
    true
);

-- Create additional test users
-- Project Manager
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
    'PM_USER_ID_HERE', -- Replace with PM user ID
    'project_manager',
    'Project',
    'Manager',
    'pm@formulapm.com',
    'Formula PM',
    'Project Management',
    '{"projects": ["read", "write"]}',
    true
);

-- Client User
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
    'CLIENT_USER_ID_HERE', -- Replace with client user ID
    'client',
    'Test',
    'Client',
    'client@formulapm.com',
    'Test Company',
    'Operations',
    '{"client_portal": ["read"]}',
    true
);