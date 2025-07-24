-- Master Migration Infrastructure Setup Script
-- Sets up complete migration infrastructure including backup, logging, rollback, and validation systems

\echo 'Setting up migration infrastructure...'

-- Create all necessary schemas
CREATE SCHEMA IF NOT EXISTS migration_tracking;
CREATE SCHEMA IF NOT EXISTS migration_backup;
CREATE SCHEMA IF NOT EXISTS migration_validation;

\echo 'Created migration schemas'

-- Load migration logging system
\i scripts/migration-logging-system.sql

\echo 'Migration logging system loaded'

-- Load comprehensive backup system
\i scripts/comprehensive-backup-system.sql

\echo 'Comprehensive backup system loaded'

-- Load rollback system
\i scripts/migration-rollback-system.sql

\echo 'Migration rollback system loaded'

-- Load validation functions
\i scripts/migration-validation-functions.sql

\echo 'Migration validation functions loaded'

-- Create master control functions
CREATE OR REPLACE FUNCTION migration_control.initialize_migration_infrastructure()
RETURNS TABLE(
    component TEXT,
    status TEXT,
    details TEXT
) AS $
DECLARE
    component_status TEXT;
BEGIN
    -- Test each component
    BEGIN
        PERFORM migration_tracking.start_migration_batch('infrastructure_test', 'test');
        component_status := 'READY';
    EXCEPTION WHEN OTHERS THEN
        component_status := 'ERROR: ' || SQLERRM;
    END;
    
    RETURN QUERY SELECT 
        'migration_tracking'::TEXT,
        component_status,
        'Migration logging and tracking system'::TEXT;
    
    BEGIN
        PERFORM migration_backup.create_comprehensive_backup('infrastructure_test');
        component_status := 'READY';
    EXCEPTION WHEN OTHERS THEN
        component_status := 'ERROR: ' || SQLERRM;
    END;
    
    RETURN QUERY SELECT 
        'backup_system'::TEXT,
        component_status,
        'Comprehensive backup system'::TEXT;
    
    BEGIN
        PERFORM migration_backup.list_available_backups();
        component_status := 'READY';
    EXCEPTION WHEN OTHERS THEN
        component_status := 'ERROR: ' || SQLERRM;
    END;
    
    RETURN QUERY SELECT 
        'rollback_system'::TEXT,
        component_status,
        'Migration rollback system'::TEXT;
    
    BEGIN
        PERFORM migration_validation.validate_pre_migration_state();
        component_status := 'READY';
    EXCEPTION WHEN OTHERS THEN
        component_status := 'ERROR: ' || SQLERRM;
    END;
    
    RETURN QUERY SELECT 
        'validation_system'::TEXT,
        component_status,
        'Migration validation functions'::TEXT;
    
    RAISE NOTICE 'Migration infrastructure initialization completed';
END;
$ LANGUAGE plpgsql;

-- Create schema for control functions
CREATE SCHEMA IF NOT EXISTS migration_control;

-- Master function to prepare for migration
CREATE OR REPLACE FUNCTION migration_control.prepare_for_migration(
    p_migration_name TEXT DEFAULT 'role_system_migration'
)
RETURNS TABLE(
    step_name TEXT,
    status TEXT,
    details TEXT,
    recommendation TEXT
) AS $
DECLARE
    backup_result RECORD;
    validation_result RECORD;
    batch_id UUID;
BEGIN
    RAISE NOTICE 'Preparing for migration: %', p_migration_name;
    
    -- Step 1: Run pre-migration validation
    RETURN QUERY SELECT 
        'pre_migration_validation'::TEXT,
        'IN_PROGRESS'::TEXT,
        'Running pre-migration checks...'::TEXT,
        'Validating system state'::TEXT;
    
    FOR validation_result IN
        SELECT * FROM migration_validation.validate_pre_migration_state()
    LOOP
        RETURN QUERY SELECT 
            format('validation_%s', validation_result.check_name),
            validation_result.status,
            validation_result.details,
            validation_result.recommendation;
    END LOOP;
    
    -- Step 2: Create comprehensive backup
    RETURN QUERY SELECT 
        'backup_creation'::TEXT,
        'IN_PROGRESS'::TEXT,
        'Creating comprehensive backup...'::TEXT,
        'Backing up all user data'::TEXT;
    
    SELECT * INTO backup_result 
    FROM migration_backup.create_comprehensive_backup(p_migration_name);
    
    RETURN QUERY SELECT 
        'backup_creation'::TEXT,
        'COMPLETED'::TEXT,
        format('Backup created: %s users, %s policies, %s MB (ID: %s)', 
               backup_result.total_users, 
               backup_result.total_policies,
               backup_result.backup_size_mb,
               backup_result.backup_id),
        format('Backup ID: %s', backup_result.backup_id)::TEXT;
    
    -- Step 3: Validate backup
    RETURN QUERY SELECT 
        'backup_validation'::TEXT,
        'IN_PROGRESS'::TEXT,
        'Validating backup completeness...'::TEXT,
        'Ensuring backup integrity'::TEXT;
    
    FOR validation_result IN
        SELECT * FROM migration_backup.validate_backup_completeness(backup_result.backup_id)
    LOOP
        RETURN QUERY SELECT 
            format('backup_%s', validation_result.validation_check),
            validation_result.status,
            validation_result.details,
            'Backup validation check'::TEXT;
    END LOOP;
    
    -- Step 4: Initialize migration batch
    SELECT migration_tracking.start_migration_batch(
        p_migration_name,
        'role_migration',
        format('Migration prepared with backup %s', backup_result.backup_id)
    ) INTO batch_id;
    
    RETURN QUERY SELECT 
        'migration_batch_initialized'::TEXT,
        'COMPLETED'::TEXT,
        format('Migration batch created: %s', batch_id),
        format('Use batch ID %s for migration tracking', batch_id)::TEXT;
    
    RAISE NOTICE 'Migration preparation completed. Backup ID: %, Batch ID: %', 
        backup_result.backup_id, batch_id;
END;
$ LANGUAGE plpgsql;

-- Function to get migration infrastructure status
CREATE OR REPLACE FUNCTION migration_control.get_infrastructure_status()
RETURNS TABLE(
    component TEXT,
    status TEXT,
    last_activity TIMESTAMPTZ,
    details TEXT
) AS $
BEGIN
    -- Check backup system
    RETURN QUERY SELECT 
        'backup_system'::TEXT,
        'ACTIVE'::TEXT,
        MAX(backup_timestamp),
        format('%s backups available', COUNT(*))::TEXT
    FROM migration_backup.user_profiles_complete_backup
    GROUP BY 1, 2;
    
    -- Check migration tracking
    RETURN QUERY SELECT 
        'migration_tracking'::TEXT,
        'ACTIVE'::TEXT,
        MAX(started_at),
        format('%s migration batches tracked', COUNT(*))::TEXT
    FROM migration_tracking.migration_batch
    GROUP BY 1, 2;
    
    -- Check validation system
    RETURN QUERY SELECT 
        'validation_system'::TEXT,
        'READY'::TEXT,
        NOW(),
        'Validation functions available'::TEXT;
    
    -- Check rollback system
    RETURN QUERY SELECT 
        'rollback_system'::TEXT,
        'READY'::TEXT,
        NOW(),
        'Rollback functions available'::TEXT;
END;
$ LANGUAGE plpgsql;

-- Grant permissions
GRANT USAGE ON SCHEMA migration_control TO postgres;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA migration_control TO postgres;

-- Final setup verification
DO $
DECLARE
    setup_result RECORD;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Verifying migration infrastructure setup...';
    
    FOR setup_result IN
        SELECT * FROM migration_control.initialize_migration_infrastructure()
    LOOP
        IF setup_result.status LIKE 'ERROR%' THEN
            error_count := error_count + 1;
            RAISE WARNING 'Component % failed: %', setup_result.component, setup_result.status;
        ELSE
            RAISE NOTICE 'Component % status: %', setup_result.component, setup_result.status;
        END IF;
    END LOOP;
    
    IF error_count = 0 THEN
        RAISE NOTICE 'Migration infrastructure setup completed successfully!';
        RAISE NOTICE 'Ready to proceed with role migration.';
        RAISE NOTICE 'Next step: Run migration_control.prepare_for_migration() to prepare for migration';
    ELSE
        RAISE WARNING 'Migration infrastructure setup completed with % errors', error_count;
        RAISE WARNING 'Review and fix errors before proceeding with migration';
    END IF;
END $;

-- Add helpful comments
COMMENT ON SCHEMA migration_control IS 'Master control functions for migration infrastructure';
COMMENT ON FUNCTION migration_control.prepare_for_migration IS 'Prepares system for role migration with validation and backup';
COMMENT ON FUNCTION migration_control.get_infrastructure_status IS 'Shows status of all migration infrastructure components';

\echo 'Migration infrastructure setup completed!'
\echo 'Use SELECT * FROM migration_control.get_infrastructure_status(); to check status'
\echo 'Use SELECT * FROM migration_control.prepare_for_migration(); to prepare for migration'