-- Test Data Cleanup Script
-- Run this in your Supabase SQL Editor to remove all test data

-- ============================================================================
-- OPTION 1: SMART CLEANUP (Removes only test data)
-- ============================================================================

-- Temporarily disable RLS for cleanup
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE scope_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- Show what will be deleted (for confirmation)
SELECT 'TEST USERS TO DELETE' as category, email FROM user_profiles 
WHERE email LIKE '%formulapm.com' OR email LIKE '%testcorp.com' OR email LIKE '%buildco.com' OR email LIKE '%test%';

SELECT 'TEST PROJECTS TO DELETE' as category, name FROM projects 
WHERE name LIKE '%Test%' OR name LIKE '%Downtown%' OR name LIKE '%Residential%' OR name LIKE '%Shopping%' OR name LIKE '%Industrial%' OR name LIKE '%School%';

SELECT 'TEST CLIENTS TO DELETE' as category, company_name FROM clients 
WHERE company_name LIKE '%Test%' OR company_name LIKE '%Tech%' OR company_name LIKE '%Build%' OR company_name LIKE '%Metro%';

-- Delete in correct order (respecting foreign key constraints)

-- 1. Delete tasks created by test users or for test projects
DELETE FROM tasks 
WHERE created_by IN (
    SELECT id FROM user_profiles 
    WHERE email LIKE '%formulapm.com' OR email LIKE '%testcorp.com' OR email LIKE '%buildco.com' OR email LIKE '%test%'
) OR project_id IN (
    SELECT id FROM projects 
    WHERE name LIKE '%Test%' OR name LIKE '%Downtown%' OR name LIKE '%Residential%' OR name LIKE '%Shopping%' OR name LIKE '%Industrial%' OR name LIKE '%School%'
);

-- 2. Delete scope items created by test users or for test projects
DELETE FROM scope_items 
WHERE created_by IN (
    SELECT id FROM user_profiles 
    WHERE email LIKE '%formulapm.com' OR email LIKE '%testcorp.com' OR email LIKE '%buildco.com' OR email LIKE '%test%'
) OR project_id IN (
    SELECT id FROM projects 
    WHERE name LIKE '%Test%' OR name LIKE '%Downtown%' OR name LIKE '%Residential%' OR name LIKE '%Shopping%' OR name LIKE '%Industrial%' OR name LIKE '%School%'
);

-- 3. Delete project assignments for test users/projects
DELETE FROM project_assignments 
WHERE user_id IN (
    SELECT id FROM user_profiles 
    WHERE email LIKE '%formulapm.com' OR email LIKE '%testcorp.com' OR email LIKE '%buildco.com' OR email LIKE '%test%'
) OR project_id IN (
    SELECT id FROM projects 
    WHERE name LIKE '%Test%' OR name LIKE '%Downtown%' OR name LIKE '%Residential%' OR name LIKE '%Shopping%' OR name LIKE '%Industrial%' OR name LIKE '%School%'
);

-- 4. Delete test projects
DELETE FROM projects 
WHERE name LIKE '%Test%' OR name LIKE '%Downtown%' OR name LIKE '%Residential%' OR name LIKE '%Shopping%' OR name LIKE '%Industrial%' OR name LIKE '%School%'
OR created_by IN (
    SELECT id FROM user_profiles 
    WHERE email LIKE '%formulapm.com' OR email LIKE '%testcorp.com' OR email LIKE '%buildco.com' OR email LIKE '%test%'
);

-- 5. Delete test clients
DELETE FROM clients 
WHERE company_name LIKE '%Test%' OR company_name LIKE '%Tech%' OR company_name LIKE '%Build%' OR company_name LIKE '%Metro%'
OR email LIKE '%testcorp.com' OR email LIKE '%buildco.com' OR email LIKE '%test%';

-- 6. Delete test user profiles
DELETE FROM user_profiles 
WHERE email LIKE '%formulapm.com' OR email LIKE '%testcorp.com' OR email LIKE '%buildco.com' OR email LIKE '%test%';

-- 7. Delete test auth users
DELETE FROM auth.users 
WHERE email LIKE '%formulapm.com' OR email LIKE '%testcorp.com' OR email LIKE '%buildco.com' OR email LIKE '%test%';

-- Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE scope_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- OPTION 2: NUCLEAR CLEANUP (Removes ALL data - use with caution!)
-- ============================================================================

-- Uncomment the section below ONLY if you want to delete ALL data

/*
-- WARNING: This will delete ALL data in your database!
-- Only use this if you want to start completely fresh

ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE scope_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- Delete all data (in correct order)
DELETE FROM tasks;
DELETE FROM scope_items;
DELETE FROM project_assignments;
DELETE FROM projects;
DELETE FROM clients;
DELETE FROM user_profiles;
DELETE FROM auth.users WHERE email != 'your-real-admin@email.com'; -- Keep your real admin

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE scope_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
*/

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check what remains after cleanup
SELECT 'REMAINING USERS' as category, COUNT(*) as count FROM user_profiles;
SELECT 'REMAINING PROJECTS' as category, COUNT(*) as count FROM projects;
SELECT 'REMAINING CLIENTS' as category, COUNT(*) as count FROM clients;
SELECT 'REMAINING SCOPE ITEMS' as category, COUNT(*) as count FROM scope_items;
SELECT 'REMAINING TASKS' as category, COUNT(*) as count FROM tasks;

-- Show remaining data
SELECT 'REMAINING USERS' as type, email, role FROM user_profiles ORDER BY email;
SELECT 'REMAINING PROJECTS' as type, name, status FROM projects ORDER BY name;
SELECT 'REMAINING CLIENTS' as type, company_name FROM clients ORDER BY company_name;

-- Success message
SELECT '🧹 Test data cleanup completed!' as result;
