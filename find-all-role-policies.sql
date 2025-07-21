-- Find ALL policies that reference role column across ALL tables
-- This will show us every table that's blocking the migration

SELECT 
    schemaname,
    tablename, 
    policyname,
    cmd,
    qual,
    'DROP TABLE IF EXISTS ' || tablename || ' CASCADE;' as drop_command
FROM pg_policies 
WHERE qual LIKE '%role%' 
   OR qual LIKE '%auth.jwt%'
   OR qual LIKE '%user_role%'
ORDER BY tablename, policyname;