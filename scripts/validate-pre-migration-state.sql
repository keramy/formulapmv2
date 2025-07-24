-- Pre-Migration State Validation Script
-- Validates the current state of the database before role migration
-- Ensures all prerequisites are met for safe migration

\echo 'Validating pre-migration state...'

-- ============================================================================
-- SYSTEM INFORMATION
-- ============================================================================

\echo 'System Information:'
SELECT 
    current_database() as database_name,
    current_user as current_user,
    version() as postgresql_version;

-- ============================================================================
-- ENUM TYPE VALIDATION
-- ============================================================================

\echo 'Validating enum types...'

-- Check user_role_old enum exists and has expected values
DO $
DECLARE
    enum_values TEXT[];
    expected_values TEXT[] := ARRAY[
        'company_owner', 'general_manager', 'deputy_general_manager', 
        'technical_director', 'admin', 'project_manager', 'architect', 
        'technical_engineer', 'purchase_director', 'purchase_specialist', 
        'field_worker', 'client', 'subcontractor'
    ];
    missing_values TEXT[];
BEGIN
    -- Get current enum values
    SELECT array_agg(enumlabel ORDER BY enumsortorder) INTO enum_values
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role_old';
    
    IF enum_values IS NULL THEN
        RAISE EXCEPTION 'user_role_old enum type not found';
    END IF;
    
    -- Check for missing values
    SELECT array_agg(val) INTO missing_values
    FROM unnest(expected_values) val
    WHERE val != ALL(enum_values);
    
    IF missing_values IS NOT NULL THEN
        RAISE WARNING 'Missing enum values in user_role_old: %', array_to_string(missing_values, ', ');
    END IF;
    
    RAISE NOTICE 'user_role_old enum has % values: %', 
        array_length(enum_values, 1), 
        array_to_string(enum_values, ', ');
END $;

-- Check user_role enum exists and has expected values
DO $
DECLARE
    enum_values TEXT[];
    expected_values TEXT[] := ARRAY[
        'management', 'purchase_manager', 'technical_lead', 
        'project_manager', 'client', 'admin'
    ];
    missing_values TEXT[];
BEGIN
    -- Get current enum values
    SELECT array_agg(enumlabel ORDER BY enumsortorder) INTO enum_values
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role';
    
    IF enum_values IS NULL THEN
        RAISE EXCEPTION 'user_role enum type not found';
    END IF;
    
    -- Check for missing values
    SELECT array_agg(val) INTO missing_values
    FROM unnest(expected_values) val
    WHERE val != ALL(enum_values);
    
    IF missing_values IS NOT NULL THEN
        RAISE WARNING 'Missing enum values in user_role: %', array_to_string(missing_values, ', ');
    END IF;
    
    RAISE NOTICE 'user_role enum has % values: %', 
        array_length(enum_values, 1), 
        array_to_string(enum_values, ', ');
END $;

-- ============================================================================
-- TABLE STRUCTURE VALIDATION
-- ============================================================================

\echo 'Validating user_profiles table structure...'

-- Check table exists
DO $
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_profiles' 
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'user_profiles table not found';
    END IF;
    
    RAISE NOTICE 'user_profiles table exists';
END $;

-- Check required columns exist
DO $
DECLARE
    required_columns TEXT[] := ARRAY[
        'id', 'role', 'first_name', 'last_name', 'email',
        'seniority_level', 'previous_role', 'role_migrated_at'
    ];
    missing_columns TEXT[];
    col TEXT;
BEGIN
    -- Check each required column
    SELECT array_agg(col) INTO missing_columns
    FROM unnest(required_columns) col
    WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles'
        AND table_schema = 'public'
        AND column_name = col
    );
    
    IF missing_columns IS NOT NULL THEN
        RAISE EXCEPTION 'Missing required columns in user_profiles: %', 
            array_to_string(missing_columns, ', ');
    END IF;
    
    RAISE NOTICE 'All required columns exist in user_profiles table';
END $;

-- Check role column type
DO $
DECLARE
    role_type TEXT;
BEGIN
    SELECT data_type INTO role_type
    FROM information_schema.columns
    WHERE table_name = 'user_profiles'
    AND table_schema = 'public'
    AND column_name = 'role';
    
    IF role_type != 'USER-DEFINED' THEN
        RAISE WARNING 'role column type is %, expected USER-DEFINED', role_type;
    END IF;
    
    -- Check if it's using user_role_old
    SELECT udt_name INTO role_type
    FROM information_schema.columns
    WHERE table_name = 'user_profiles'
    AND table_schema = 'public'
    AND column_name = 'role';
    
    IF role_type = 'user_role_old' THEN
        RAISE NOTICE 'role column is using user_role_old (correct for pre-migration)';
    ELSIF role_type = 'user_role' THEN
        RAISE WARNING 'role column is already using user_role - migration may have already been run';
    ELSE
        RAISE WARNING 'role column is using unexpected type: %', role_type;
    END IF;
END $;

-- ============================================================================
-- DATA VALIDATION
-- ============================================================================

\echo 'Validating user data...'

-- Check user count and distribution
DO $
DECLARE
    total_users INTEGER;
    role_dist RECORD;
BEGIN
    SELECT COUNT(*) INTO total_users FROM user_profiles;
    RAISE NOTICE 'Total users in system: %', total_users;
    
    IF total_users = 0 THEN
        RAISE WARNING 'No users found in user_profiles table';
    END IF;
    
    -- Show role distribution
    RAISE NOTICE 'Current role distribution:';
    FOR role_dist IN
        SELECT role::TEXT, COUNT(*) as count
        FROM user_profiles
        GROUP BY role
        ORDER BY COUNT(*) DESC
    LOOP
        RAISE NOTICE '  %: % users', role_dist.role, role_dist.count;
    END LOOP;
END $;

-- Check for users with existing migration data
DO $
DECLARE
    migrated_users INTEGER;
    users_with_previous_role INTEGER;
BEGIN
    SELECT COUNT(*) INTO users_with_previous_role
    FROM user_profiles
    WHERE previous_role IS NOT NULL;
    
    SELECT COUNT(*) INTO migrated_users
    FROM user_profiles
    WHERE role_migrated_at IS NOT NULL;
    
    IF users_with_previous_role > 0 THEN
        RAISE WARNING '% users already have previous_role data - migration may have been run before', 
            users_with_previous_role;
    END IF;
    
    IF migrated_users > 0 THEN
        RAISE WARNING '% users have role_migrated_at timestamp - migration may have been run before', 
            migrated_users;
    END IF;
    
    IF users_with_previous_role = 0 AND migrated_users = 0 THEN
        RAISE NOTICE 'No existing migration data found - ready for fresh migration';
    END IF;
END $;

-- ============================================================================
-- BACKUP SYSTEM VALIDATION
-- ============================================================================

\echo 'Validating backup system...'

-- Check if migration_backup schema exists
DO $
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'migration_backup') THEN
        RAISE NOTICE 'migration_backup schema exists';
        
        -- Check for existing backups
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'migration_backup' 
            AND table_name LIKE '%backup%'
        ) THEN
            RAISE NOTICE 'Existing backup tables found in migration_backup schema';
        ELSE
            RAISE NOTICE 'migration_backup schema exists but no backup tables found';
        END IF;
    ELSE
        RAISE WARNING 'migration_backup schema not found - backup system may not be set up';
    END IF;
END $;

-- ============================================================================
-- MIGRATION INFRASTRUCTURE VALIDATION
-- ============================================================================

\echo 'Validating migration infrastructure...'

-- Check migration tracking
DO $
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'migration_tracking') THEN
        RAISE NOTICE 'migration_tracking schema exists';
    ELSE
        RAISE WARNING 'migration_tracking schema not found - tracking system not set up';
    END IF;
END $;

-- Check migration control functions
DO $
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'migration_control') THEN
        RAISE NOTICE 'migration_control schema exists';
    ELSE
        RAISE WARNING 'migration_control schema not found - control functions not set up';
    END IF;
END $;

-- ============================================================================
-- FINAL VALIDATION SUMMARY
-- ============================================================================

\echo 'Pre-migration validation summary:'

DO $
DECLARE
    validation_errors INTEGER := 0;
    validation_warnings INTEGER := 0;
    total_users INTEGER;
    role_type TEXT;
BEGIN
    -- Count users
    SELECT COUNT(*) INTO total_users FROM user_profiles;
    
    -- Check role column type
    SELECT udt_name INTO role_type
    FROM information_schema.columns
    WHERE table_name = 'user_profiles'
    AND table_schema = 'public'
    AND column_name = 'role';
    
    RAISE NOTICE '=== VALIDATION SUMMARY ===';
    RAISE NOTICE 'Total users: %', total_users;
    RAISE NOTICE 'Current role column type: %', role_type;
    
    -- Determine readiness
    IF role_type = 'user_role_old' AND total_users > 0 THEN
        RAISE NOTICE 'STATUS: READY FOR MIGRATION ✓';
        RAISE NOTICE 'The system is ready for role migration from user_role_old to user_role';
    ELSIF role_type = 'user_role' THEN
        RAISE WARNING 'STATUS: MIGRATION MAY HAVE ALREADY BEEN RUN';
        RAISE WARNING 'The role column is already using user_role type';
    ELSIF total_users = 0 THEN
        RAISE WARNING 'STATUS: NO USERS TO MIGRATE';
        RAISE WARNING 'No users found in the system';
    ELSE
        RAISE WARNING 'STATUS: UNEXPECTED STATE';
        RAISE WARNING 'System is in an unexpected state for migration';
    END IF;
    
    RAISE NOTICE '=== END VALIDATION SUMMARY ===';
END $;

\echo 'Pre-migration validation completed!'
\echo 'Review the output above before proceeding with migration'