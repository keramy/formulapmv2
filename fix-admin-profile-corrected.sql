-- Fix admin profile issue by creating the missing user_profiles record
-- Using the correct role enum values from the database

-- Insert the admin profile for the authenticated user
INSERT INTO user_profiles (
  id, 
  role, 
  first_name, 
  last_name, 
  email, 
  company, 
  department, 
  is_active, 
  permissions,
  created_at,
  updated_at
) VALUES (
  'e42c6330-c382-4ba8-89c1-35895dddc523', -- User ID from your auth.users table
  'company_owner', -- Use company_owner for full admin access
  'Admin', 
  'User', 
  'admin@formulapm.com', -- Update this to match your actual admin email
  'Formula PM', 
  'Administration', 
  true, 
  '{}',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  role = 'company_owner',
  is_active = true,
  updated_at = NOW();

-- Also create profiles for the test users if they exist in auth.users
-- Owner test user
INSERT INTO user_profiles (id, role, first_name, last_name, email, company, department, is_active, permissions)
SELECT 
  id, 
  'company_owner', 
  'Owner', 
  'Test', 
  'owner.test@formulapm.com',
  'Formula PM',
  'Executive',
  true,
  '{}'
FROM auth.users 
WHERE email = 'owner.test@formulapm.com'
ON CONFLICT (id) DO NOTHING;

-- Project Manager test user  
INSERT INTO user_profiles (id, role, first_name, last_name, email, company, department, is_active, permissions)
SELECT 
  id, 
  'project_manager', 
  'Project', 
  'Manager', 
  'pm.test@formulapm.com',
  'Formula PM',
  'Project Management',
  true,
  '{}'
FROM auth.users 
WHERE email = 'pm.test@formulapm.com'
ON CONFLICT (id) DO NOTHING;

-- General Manager test user
INSERT INTO user_profiles (id, role, first_name, last_name, email, company, department, is_active, permissions)
SELECT 
  id, 
  'general_manager', 
  'General', 
  'Manager', 
  'gm.test@formulapm.com',
  'Formula PM',
  'Management',
  true,
  '{}'
FROM auth.users 
WHERE email = 'gm.test@formulapm.com'
ON CONFLICT (id) DO NOTHING;

-- Architect test user
INSERT INTO user_profiles (id, role, first_name, last_name, email, company, department, is_active, permissions)
SELECT 
  id, 
  'architect', 
  'Architect', 
  'Test', 
  'architect.test@formulapm.com',
  'Formula PM',
  'Technical',
  true,
  '{}'
FROM auth.users 
WHERE email = 'architect.test@formulapm.com'
ON CONFLICT (id) DO NOTHING;

-- Client test user
INSERT INTO user_profiles (id, role, first_name, last_name, email, company, department, is_active, permissions)
SELECT 
  id, 
  'client', 
  'Client', 
  'Test', 
  'client.test@formulapm.com',
  'ABC Company',
  'External',
  true,
  '{}'
FROM auth.users 
WHERE email = 'client.test@formulapm.com'
ON CONFLICT (id) DO NOTHING;

-- Verify the profiles were created
SELECT id, email, role, first_name, last_name, is_active 
FROM user_profiles 
ORDER BY created_at DESC;