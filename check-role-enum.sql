-- Check what role enum values are currently in the database
-- This will show us if we have 6 roles or 13 roles

-- Method 1: Query the enum type directly
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (
    SELECT oid 
    FROM pg_type 
    WHERE typname = 'user_role'
)
ORDER BY enumsortorder;

-- Method 2: Check information schema
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'user_role'
ORDER BY e.enumsortorder;