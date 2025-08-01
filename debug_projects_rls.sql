-- Diagnostic script to check projects RLS issue
-- Run this in Supabase SQL Editor to diagnose the problem

-- 1. Check if RLS is enabled on projects table
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled,
  hasoids 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'projects';

-- 2. Check existing RLS policies on projects table
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as command,
  qual as using_clause,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'projects'
ORDER BY policyname;

-- 3. Check projects data (should show 4 projects)
SELECT 
  id, 
  name, 
  code, 
  status, 
  is_active,
  created_at
FROM projects 
ORDER BY created_at DESC;

-- 4. Check if test users exist in user_profiles
SELECT 
  id,
  email,
  full_name,
  role,
  is_active
FROM user_profiles 
WHERE email LIKE '%test%'
ORDER BY email;

-- 5. Check project_assignments for the test users
SELECT 
  pa.id,
  pa.project_id,
  pa.user_id,
  pa.role_in_project,
  pa.is_active,
  up.email,
  p.name as project_name
FROM project_assignments pa
JOIN user_profiles up ON pa.user_id = up.id
JOIN projects p ON pa.project_id = p.id
WHERE up.email LIKE '%test%'
ORDER BY up.email, p.name;

-- 6. Test the get_user_accessible_projects function with a test user
-- Replace with actual test user ID from query above
SELECT get_user_accessible_projects('00000000-0000-0000-0000-000000000000'::uuid);

-- 7. Test auth context (this will show current user context)
SELECT 
  auth.uid() as current_user_id,
  auth.jwt() ->> 'email' as current_user_email;

-- 8. Check if there are any other tables blocking the function
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('projects', 'user_profiles', 'project_assignments')
  AND column_name IN ('id', 'user_id', 'project_id', 'is_active', 'role')
ORDER BY table_name, column_name;