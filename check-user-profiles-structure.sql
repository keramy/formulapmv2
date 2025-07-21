-- Check the actual structure of user_profiles table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Check if user_profiles exists
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'user_profiles'
) as table_exists;

-- Check all tables that might have role columns
SELECT 
    table_name, 
    column_name, 
    data_type
FROM information_schema.columns
WHERE column_name = 'role'
AND table_schema = 'public'
ORDER BY table_name;