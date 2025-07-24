-- RLS Policy Discovery Script
-- This script identifies all RLS policies that reference user_role_old

-- First, let's find all policies that reference user_role_old directly
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE qual LIKE '%user_role_old%' 
   OR with_check LIKE '%user_role_old%'
ORDER BY schemaname, tablename, policyname;

-- Also find policies that use JWT role checking (these need to be updated too)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE qual LIKE '%user_role%' 
   OR with_check LIKE '%user_role%'
   OR qual LIKE '%jwt%user_role%'
   OR with_check LIKE '%jwt%user_role%'
ORDER BY schemaname, tablename, policyname;

-- Find all helper functions that might reference old roles
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition LIKE '%user_role_old%'
   OR routine_definition LIKE '%company_owner%'
   OR routine_definition LIKE '%general_manager%'
   OR routine_definition LIKE '%deputy_general_manager%'
   OR routine_definition LIKE '%technical_director%'
   OR routine_definition LIKE '%architect%'
   OR routine_definition LIKE '%technical_engineer%'
   OR routine_definition LIKE '%field_worker%'
   OR routine_definition LIKE '%purchase_director%'
   OR routine_definition LIKE '%purchase_specialist%'
   OR routine_definition LIKE '%subcontractor%'
ORDER BY routine_name;