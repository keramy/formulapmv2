-- Create Profile for Dashboard User
-- Replace USER_ID_HERE with the actual user ID from the dashboard

-- Temporarily disable RLS
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Create admin profile (replace the UUID with actual user ID)
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
    'USER_ID_HERE', -- REPLACE THIS WITH ACTUAL USER ID
    'admin',
    'Admin',
    'User',
    'admin@formulapm.com',
    'Formula PM',
    'Administration',
    '{}',
    true
);

-- Re-enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Verify
SELECT * FROM public.user_profiles;