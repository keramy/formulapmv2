-- Check Table Structure for Performance Index Migration
-- Run this in Supabase SQL Editor to see your actual table columns

-- ============================================================================
-- CHECK PROJECT_MILESTONES TABLE STRUCTURE
-- ============================================================================

-- Check if project_milestones table exists
SELECT 
    'TABLE EXISTS' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_milestones')
        THEN 'YES - project_milestones table exists'
        ELSE 'NO - project_milestones table does not exist'
    END as result;

-- Show all columns in project_milestones table (if it exists)
SELECT 
    'COLUMN STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'project_milestones'
ORDER BY ordinal_position;

-- ============================================================================
-- CHECK OTHER CORE TABLES
-- ============================================================================

-- Check tasks table columns
SELECT 
    'TASKS TABLE' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'tasks'
AND column_name IN ('project_id', 'status', 'assigned_to', 'due_date', 'created_at')
ORDER BY ordinal_position;

-- Check scope_items table columns  
SELECT 
    'SCOPE_ITEMS TABLE' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'scope_items'
AND column_name IN ('project_id', 'category', 'status', 'assigned_to', 'total_price')
ORDER BY ordinal_position;

-- Check projects table columns
SELECT 
    'PROJECTS TABLE' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'projects'
AND column_name IN ('id', 'name', 'status', 'project_manager_id', 'budget', 'actual_cost')
ORDER BY ordinal_position;

-- ============================================================================
-- CHECK EXISTING INDEXES
-- ============================================================================

-- Show existing indexes on these tables
SELECT 
    'EXISTING INDEXES' as check_type,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('tasks', 'scope_items', 'projects', 'project_milestones')
AND schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- RECOMMENDATIONS
-- ============================================================================

SELECT 
    'RECOMMENDATIONS' as info_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_milestones')
        THEN 'Run the corrected performance index migration - it will auto-detect your column names'
        ELSE 'project_milestones table not found - you may need to run milestone migration first'
    END as recommendation;
