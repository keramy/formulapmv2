-- Formula PM Database Schema Test Script
-- This script tests that all tables, relationships, and functions are properly created

-- Test 1: Verify all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Test 2: Verify all enum types exist
SELECT typname 
FROM pg_type 
WHERE typtype = 'e' 
AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY typname;

-- Test 3: Verify key relationships
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- Test 4: Verify indexes exist
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Test 5: Verify RLS is enabled on key tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true
ORDER BY tablename;

-- Test 6: Verify helper functions exist
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Test 7: Verify triggers exist
SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Test 8: Count policies per table
SELECT 
    schemaname,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Test 9: Verify computed columns
SELECT 
    table_name,
    column_name,
    generation_expression
FROM information_schema.columns
WHERE table_schema = 'public'
AND generation_expression IS NOT NULL
ORDER BY table_name, column_name;

-- Test 10: Summary statistics
SELECT 
    'Tables' as object_type, COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
UNION ALL
SELECT 
    'Indexes', COUNT(*)
FROM pg_indexes WHERE schemaname = 'public'
UNION ALL
SELECT 
    'Functions', COUNT(*)
FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
UNION ALL
SELECT 
    'Triggers', COUNT(*)
FROM information_schema.triggers WHERE trigger_schema = 'public'
UNION ALL
SELECT 
    'Policies', COUNT(*)
FROM pg_policies WHERE schemaname = 'public';