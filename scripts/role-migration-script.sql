-- Database Role Migration Script
-- Migrates user_profiles.role from user_role_old (13 roles) to user_role (6 roles)
-- Implements role mapping logic and assigns seniority levels based on original roles
-- Stores original role in previous_role column for audit trail

-- ============================================================================
-- ROLE MIGRATION SCRIPT - TASK 2 IMPLEMENTATION
-- ============================================================================

\echo 'Starting Role Migration Script - Task 2'
\echo 'Migrating from user_role_old (13 roles) to user_role (6 roles)'

-- Create migration tracking for this specific migration
DO $
DECLARE
    batch_id UUID;
BEGIN
    -- Initialize migration batch if infrastructure exists
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'migration_tracking') THEN
        SELECT migration_tracking.start_migration_batch(
            'role_system_migration_task2',
            'role_migration',
            'Task 2: Database role migration from 13-role to 6-role system'
        ) INTO batch_id;
        RAISE NOTICE 'Migration batch initialized: %', batch_id;
    ELSE
        RAISE NOTICE 'Migration tracking not available - proceeding without tracking';
    END IF;
END $;

-- ============================================================================
-- PRE-MIGRATION VALIDATION
-- ============================================================================

\echo 'Running pre-migration validation checks...'

DO $
DECLARE
    user_count INTEGER;
    role_distribution RECORD;
    validation_errors INTEGER := 0;
BEGIN
    -- Check current user count
    SELECT COUNT(*) INTO user_count FROM user_profiles;
    RAISE NOTICE 'Total users to migrate: %', user_count;
    
    -- Show current role distribution
    RAISE NOTICE 'Current role distribution:';
    FOR role_distribution IN
        SELECT role::TEXT, COUNT(*) as count
        FROM user_profiles 
        GROUP BY role 
        ORDER BY COUNT(*) DESC
    LOOP
        RAISE NOTICE '  %: % users', role_distribution.role, role_distribution.count;
    END LOOP;
    
    -- Validate that user_role enum exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'user_role' 
        AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN
        RAISE EXCEPTION 'user_role enum type does not exist. Cannot proceed with migration.';
    END IF;
    
    -- Validate that required columns exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'seniority_level'
    ) THEN
        RAISE EXCEPTION 'seniority_level column does not exist in user_profiles table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'previous_role'
    ) THEN
        RAISE EXCEPTION 'previous_role column does not exist in user_profiles table';
    END IF;
    
    RAISE NOTICE 'Pre-migration validation completed successfully';
END $;

-- ============================================================================
-- BACKUP CURRENT STATE
-- ============================================================================

\echo 'Creating backup of current user_profiles state...'

-- Create backup table for this specific migration
CREATE TABLE IF NOT EXISTS migration_backup.role_migration_backup AS
SELECT 
    id,
    role,
    first_name,
    last_name,
    email,
    phone,
    company,
    department,
    hire_date,
    is_active,
    permissions,
    created_at,
    updated_at,
    seniority_level,
    approval_limits,
    dashboard_preferences,
    previous_role,
    role_migrated_at,
    NOW() as backup_timestamp
FROM user_profiles;

-- Verify backup
DO $
DECLARE
    original_count INTEGER;
    backup_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO original_count FROM user_profiles;
    SELECT COUNT(*) INTO backup_count FROM migration_backup.role_migration_backup;
    
    IF original_count != backup_count THEN
        RAISE EXCEPTION 'Backup verification failed: original=%, backup=%', original_count, backup_count;
    END IF;
    
    RAISE NOTICE 'Backup created successfully: % users backed up', backup_count;
END $;

-- ============================================================================
-- ROLE MAPPING LOGIC IMPLEMENTATION
-- ============================================================================

\echo 'Implementing role mapping logic...'

-- Create temporary function for role mapping validation
CREATE OR REPLACE FUNCTION temp_validate_role_mapping()
RETURNS TABLE(
    old_role TEXT,
    new_role TEXT,
    seniority TEXT,
    user_count INTEGER
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        up.role::TEXT as old_role,
        CASE up.role::TEXT
            WHEN 'company_owner' THEN 'management'
            WHEN 'general_manager' THEN 'management'
            WHEN 'deputy_general_manager' THEN 'management'
            WHEN 'technical_director' THEN 'technical_lead'
            WHEN 'architect' THEN 'project_manager'
            WHEN 'technical_engineer' THEN 'project_manager'
            WHEN 'field_worker' THEN 'project_manager'
            WHEN 'purchase_director' THEN 'purchase_manager'
            WHEN 'purchase_specialist' THEN 'purchase_manager'
            WHEN 'project_manager' THEN 'project_manager'
            WHEN 'client' THEN 'client'
            WHEN 'admin' THEN 'admin'
            WHEN 'subcontractor' THEN 'project_manager'
            ELSE 'project_manager'
        END as new_role,
        CASE up.role::TEXT
            WHEN 'company_owner' THEN 'executive'
            WHEN 'general_manager' THEN 'executive'
            WHEN 'deputy_general_manager' THEN 'senior'
            WHEN 'technical_director' THEN 'senior'
            WHEN 'architect' THEN 'senior'
            WHEN 'technical_engineer' THEN 'regular'
            WHEN 'field_worker' THEN 'regular'
            WHEN 'purchase_director' THEN 'senior'
            WHEN 'purchase_specialist' THEN 'regular'
            WHEN 'project_manager' THEN 'regular'
            WHEN 'client' THEN 'standard'
            WHEN 'admin' THEN 'system'
            WHEN 'subcontractor' THEN 'regular'
            ELSE 'regular'
        END as seniority,
        COUNT(*)::INTEGER as user_count
    FROM user_profiles up
    GROUP BY up.role::TEXT
    ORDER BY user_count DESC;
END;
$ LANGUAGE plpgsql;

-- Show mapping preview
\echo 'Role mapping preview:'
DO $
DECLARE
    mapping_preview RECORD;
BEGIN
    FOR mapping_preview IN
        SELECT * FROM temp_validate_role_mapping()
    LOOP
        RAISE NOTICE '  % → % (seniority: %) - % users', 
            mapping_preview.old_role, 
            mapping_preview.new_role, 
            mapping_preview.seniority,
            mapping_preview.user_count;
    END LOOP;
END $;

-- ============================================================================
-- EXECUTE MIGRATION IN TRANSACTION
-- ============================================================================

\echo 'Executing role migration...'

BEGIN;

-- Step 1: Store original roles in previous_role column for audit trail
UPDATE user_profiles 
SET 
    previous_role = role,
    role_migrated_at = NOW()
WHERE previous_role IS NULL;

RAISE NOTICE 'Step 1: Stored original roles in previous_role column';

-- Step 2: Update seniority_level based on original roles
UPDATE user_profiles 
SET seniority_level = 
    CASE role::TEXT
        WHEN 'company_owner' THEN 'executive'
        WHEN 'general_manager' THEN 'executive'
        WHEN 'deputy_general_manager' THEN 'senior'
        WHEN 'technical_director' THEN 'senior'
        WHEN 'architect' THEN 'senior'
        WHEN 'technical_engineer' THEN 'regular'
        WHEN 'field_worker' THEN 'regular'
        WHEN 'purchase_director' THEN 'senior'
        WHEN 'purchase_specialist' THEN 'regular'
        WHEN 'project_manager' THEN 'regular'
        WHEN 'client' THEN 'standard'
        WHEN 'admin' THEN 'system'
        WHEN 'subcontractor' THEN 'regular'
        ELSE 'regular'
    END;

RAISE NOTICE 'Step 2: Updated seniority levels based on original roles';

-- Step 3: Migrate role column from user_role_old to user_role using CASE mapping
ALTER TABLE user_profiles 
ALTER COLUMN role TYPE user_role 
USING (
    CASE role::TEXT
        WHEN 'company_owner' THEN 'management'::user_role
        WHEN 'general_manager' THEN 'management'::user_role
        WHEN 'deputy_general_manager' THEN 'management'::user_role
        WHEN 'technical_director' THEN 'technical_lead'::user_role
        WHEN 'architect' THEN 'project_manager'::user_role
        WHEN 'technical_engineer' THEN 'project_manager'::user_role
        WHEN 'field_worker' THEN 'project_manager'::user_role
        WHEN 'purchase_director' THEN 'purchase_manager'::user_role
        WHEN 'purchase_specialist' THEN 'purchase_manager'::user_role
        WHEN 'project_manager' THEN 'project_manager'::user_role
        WHEN 'client' THEN 'client'::user_role
        WHEN 'admin' THEN 'admin'::user_role
        WHEN 'subcontractor' THEN 'project_manager'::user_role
        ELSE 'project_manager'::user_role
    END
);

RAISE NOTICE 'Step 3: Migrated role column from user_role_old to user_role';

-- Step 4: Update updated_at timestamp
UPDATE user_profiles SET updated_at = NOW();

RAISE NOTICE 'Step 4: Updated timestamps';

COMMIT;

-- ============================================================================
-- POST-MIGRATION VALIDATION
-- ============================================================================

\echo 'Running post-migration validation...'

DO $
DECLARE
    total_users INTEGER;
    role_distribution RECORD;
    seniority_distribution RECORD;
    validation_errors INTEGER := 0;
    users_without_previous_role INTEGER;
    users_without_seniority INTEGER;
BEGIN
    -- Check total user count (should be unchanged)
    SELECT COUNT(*) INTO total_users FROM user_profiles;
    RAISE NOTICE 'Total users after migration: %', total_users;
    
    -- Check new role distribution
    RAISE NOTICE 'New role distribution:';
    FOR role_distribution IN
        SELECT role::TEXT, COUNT(*) as count
        FROM user_profiles 
        GROUP BY role 
        ORDER BY COUNT(*) DESC
    LOOP
        RAISE NOTICE '  %: % users', role_distribution.role, role_distribution.count;
    END LOOP;
    
    -- Check seniority distribution
    RAISE NOTICE 'Seniority level distribution:';
    FOR seniority_distribution IN
        SELECT seniority_level, COUNT(*) as count
        FROM user_profiles 
        GROUP BY seniority_level 
        ORDER BY COUNT(*) DESC
    LOOP
        RAISE NOTICE '  %: % users', seniority_distribution.seniority_level, seniority_distribution.count;
    END LOOP;
    
    -- Validate all users have previous_role set
    SELECT COUNT(*) INTO users_without_previous_role 
    FROM user_profiles 
    WHERE previous_role IS NULL;
    
    IF users_without_previous_role > 0 THEN
        RAISE WARNING '% users missing previous_role data', users_without_previous_role;
        validation_errors := validation_errors + 1;
    END IF;
    
    -- Validate all users have seniority_level set
    SELECT COUNT(*) INTO users_without_seniority 
    FROM user_profiles 
    WHERE seniority_level IS NULL OR seniority_level = '';
    
    IF users_without_seniority > 0 THEN
        RAISE WARNING '% users missing seniority_level data', users_without_seniority;
        validation_errors := validation_errors + 1;
    END IF;
    
    -- Validate all roles are valid user_role values
    IF EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE role NOT IN ('management', 'purchase_manager', 'technical_lead', 'project_manager', 'client', 'admin')
    ) THEN
        RAISE WARNING 'Invalid roles found after migration';
        validation_errors := validation_errors + 1;
    END IF;
    
    IF validation_errors = 0 THEN
        RAISE NOTICE 'Post-migration validation completed successfully!';
    ELSE
        RAISE WARNING 'Post-migration validation completed with % errors', validation_errors;
    END IF;
END $;

-- ============================================================================
-- MIGRATION SUMMARY AND CLEANUP
-- ============================================================================

\echo 'Generating migration summary...'

-- Create migration summary
DO $
DECLARE
    summary_record RECORD;
    total_migrated INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_migrated FROM user_profiles;
    
    RAISE NOTICE '=== ROLE MIGRATION SUMMARY ===';
    RAISE NOTICE 'Migration completed successfully';
    RAISE NOTICE 'Total users migrated: %', total_migrated;
    RAISE NOTICE 'Migration timestamp: %', NOW();
    
    RAISE NOTICE '';
    RAISE NOTICE 'Role mapping results:';
    
    FOR summary_record IN
        SELECT 
            previous_role::TEXT as old_role,
            role::TEXT as new_role,
            seniority_level,
            COUNT(*) as user_count
        FROM user_profiles 
        WHERE previous_role IS NOT NULL
        GROUP BY previous_role::TEXT, role::TEXT, seniority_level
        ORDER BY user_count DESC
    LOOP
        RAISE NOTICE '  % → % (%) - % users', 
            summary_record.old_role, 
            summary_record.new_role, 
            summary_record.seniority_level,
            summary_record.user_count;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Backup available at: migration_backup.role_migration_backup';
    RAISE NOTICE 'Original roles preserved in: user_profiles.previous_role';
    RAISE NOTICE 'Migration timestamp in: user_profiles.role_migrated_at';
END $;

-- Clean up temporary functions
DROP FUNCTION IF EXISTS temp_validate_role_mapping();

-- Log migration completion
DO $
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'migration_tracking') THEN
        PERFORM migration_tracking.log_migration_step(
            'role_system_migration_task2',
            'role_migration_completed',
            'SUCCESS',
            'Database role migration from user_role_old to user_role completed successfully'
        );
        RAISE NOTICE 'Migration logged to tracking system';
    END IF;
END $;

\echo 'Role migration script completed successfully!'
\echo 'Next steps:'
\echo '1. Test user authentication with new roles'
\echo '2. Update RLS policies to use new role system'
\echo '3. Verify application functionality'
\echo '4. If issues occur, rollback is available via migration_backup.role_migration_backup'