-- Role Migration Backup Script
-- Creates comprehensive backup of user_profiles table before migration
-- Includes all related data and constraints

-- Create backup schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS migration_backup;

-- Create backup table with exact structure of user_profiles
CREATE TABLE IF NOT EXISTS migration_backup.user_profiles_backup AS 
SELECT * FROM user_profiles WHERE 1=0; -- Structure only, no data yet

-- Add all constraints and indexes to backup table
DO $$
DECLARE
    constraint_record RECORD;
    index_record RECORD;
BEGIN
    -- Copy table structure with all columns and types
    DROP TABLE IF EXISTS migration_backup.user_profiles_backup;
    CREATE TABLE migration_backup.user_profiles_backup (LIKE user_profiles INCLUDING ALL);
    
    -- Add timestamp for backup creation
    ALTER TABLE migration_backup.user_profiles_backup 
    ADD COLUMN IF NOT EXISTS backup_timestamp TIMESTAMPTZ DEFAULT NOW();
    
    -- Add backup metadata
    ALTER TABLE migration_backup.user_profiles_backup 
    ADD COLUMN IF NOT EXISTS backup_version TEXT DEFAULT 'role_migration_v1';
    
    RAISE NOTICE 'Backup table structure created successfully';
END $$;

-- Function to create full backup
CREATE OR REPLACE FUNCTION migration_backup.create_user_profiles_backup()
RETURNS TABLE(
    backup_id UUID,
    total_users INTEGER,
    backup_timestamp TIMESTAMPTZ,
    backup_status TEXT
) AS $$
DECLARE
    backup_uuid UUID := gen_random_uuid();
    user_count INTEGER;
BEGIN
    -- Clear any existing backup data
    DELETE FROM migration_backup.user_profiles_backup;
    
    -- Insert all current user_profiles data
    INSERT INTO migration_backup.user_profiles_backup 
    SELECT *, NOW(), 'role_migration_v1'
    FROM user_profiles;
    
    -- Get count of backed up users
    SELECT COUNT(*) INTO user_count FROM migration_backup.user_profiles_backup;
    
    -- Log backup creation
    INSERT INTO migration_backup.backup_log (
        backup_id,
        table_name,
        record_count,
        backup_timestamp,
        backup_type,
        status
    ) VALUES (
        backup_uuid,
        'user_profiles',
        user_count,
        NOW(),
        'full_backup',
        'completed'
    );
    
    RETURN QUERY SELECT 
        backup_uuid,
        user_count,
        NOW()::TIMESTAMPTZ,
        'completed'::TEXT;
        
    RAISE NOTICE 'Backup completed: % users backed up with ID %', user_count, backup_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to verify backup integrity
CREATE OR REPLACE FUNCTION migration_backup.verify_backup_integrity()
RETURNS TABLE(
    check_name TEXT,
    original_count INTEGER,
    backup_count INTEGER,
    status TEXT
) AS $$
DECLARE
    orig_count INTEGER;
    back_count INTEGER;
BEGIN
    -- Check total record count
    SELECT COUNT(*) INTO orig_count FROM user_profiles;
    SELECT COUNT(*) INTO back_count FROM migration_backup.user_profiles_backup;
    
    RETURN QUERY SELECT 
        'total_records'::TEXT,
        orig_count,
        back_count,
        CASE WHEN orig_count = back_count THEN 'PASS' ELSE 'FAIL' END::TEXT;
    
    -- Check role distribution
    FOR check_name, orig_count, back_count IN
        SELECT 
            'role_' || COALESCE(up.role::TEXT, 'null'),
            COUNT(up.id)::INTEGER,
            COUNT(bup.id)::INTEGER
        FROM user_profiles up
        FULL OUTER JOIN migration_backup.user_profiles_backup bup 
            ON up.role = bup.role
        GROUP BY up.role, bup.role
    LOOP
        RETURN QUERY SELECT 
            check_name,
            orig_count,
            back_count,
            CASE WHEN orig_count = back_count THEN 'PASS' ELSE 'FAIL' END::TEXT;
    END LOOP;
    
    RAISE NOTICE 'Backup integrity verification completed';
END;
$$ LANGUAGE plpgsql;

-- Create backup log table for tracking
CREATE TABLE IF NOT EXISTS migration_backup.backup_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_id UUID NOT NULL,
    table_name TEXT NOT NULL,
    record_count INTEGER NOT NULL,
    backup_timestamp TIMESTAMPTZ DEFAULT NOW(),
    backup_type TEXT NOT NULL, -- 'full_backup', 'incremental', 'rollback'
    status TEXT NOT NULL, -- 'completed', 'failed', 'in_progress'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA migration_backup TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA migration_backup TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA migration_backup TO postgres;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_backup_log_backup_id 
ON migration_backup.backup_log(backup_id);

CREATE INDEX IF NOT EXISTS idx_backup_log_timestamp 
ON migration_backup.backup_log(backup_timestamp);

COMMENT ON SCHEMA migration_backup IS 'Schema for storing role migration backups and logs';
COMMENT ON TABLE migration_backup.user_profiles_backup IS 'Complete backup of user_profiles table before role migration';
COMMENT ON TABLE migration_backup.backup_log IS 'Log of all backup operations for audit trail';