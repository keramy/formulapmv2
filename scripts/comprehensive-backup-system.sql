-- Comprehensive Backup System for Role Migration
-- Creates complete backup of all user-related data and system state

-- Create backup schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS migration_backup;

-- Enhanced backup table with complete user profile data
CREATE TABLE IF NOT EXISTS migration_backup.user_profiles_complete_backup (
    -- Original user_profiles columns
    id UUID,
    email TEXT,
    full_name TEXT,
    role TEXT, -- Store as text to preserve original enum value
    seniority_level TEXT,
    previous_role TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    
    -- Backup metadata
    backup_id UUID NOT NULL,
    backup_timestamp TIMESTAMPTZ DEFAULT NOW(),
    backup_version TEXT DEFAULT 'role_migration_v1',
    original_role_enum TEXT, -- Store the actual enum type name
    
    PRIMARY KEY (id, backup_id)
);

-- Backup related tables that might be affected
CREATE TABLE IF NOT EXISTS migration_backup.user_sessions_backup (
    session_id TEXT,
    user_id UUID,
    role_at_backup TEXT,
    backup_id UUID NOT NULL,
    backup_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- System state backup for RLS policies
CREATE TABLE IF NOT EXISTS migration_backup.rls_policies_backup (
    policy_name TEXT,
    table_name TEXT,
    policy_definition TEXT,
    backup_id UUID NOT NULL,
    backup_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced backup function with comprehensive data capture
CREATE OR REPLACE FUNCTION migration_backup.create_comprehensive_backup(
    p_backup_name TEXT DEFAULT 'role_migration_backup'
)
RETURNS TABLE(
    backup_id UUID,
    total_users INTEGER,
    total_policies INTEGER,
    backup_timestamp TIMESTAMPTZ,
    backup_status TEXT,
    backup_size_mb NUMERIC
) AS $
DECLARE
    backup_uuid UUID := gen_random_uuid();
    user_count INTEGER;
    policy_count INTEGER;
    backup_size NUMERIC;
BEGIN
    RAISE NOTICE 'Starting comprehensive backup: %', p_backup_name;
    
    -- Clear any existing backup data for this backup_id
    DELETE FROM migration_backup.user_profiles_complete_backup WHERE backup_id = backup_uuid;
    DELETE FROM migration_backup.user_sessions_backup WHERE backup_id = backup_uuid;
    DELETE FROM migration_backup.rls_policies_backup WHERE backup_id = backup_uuid;
    
    -- Backup user_profiles with complete data
    INSERT INTO migration_backup.user_profiles_complete_backup (
        id, email, full_name, role, seniority_level, previous_role,
        created_at, updated_at, backup_id, original_role_enum
    )
    SELECT 
        id, email, full_name, 
        role::TEXT, -- Convert enum to text for safe storage
        seniority_level::TEXT,
        previous_role,
        created_at, updated_at,
        backup_uuid,
        pg_typeof(role)::TEXT -- Store the enum type name
    FROM user_profiles;
    
    GET DIAGNOSTICS user_count = ROW_COUNT;
    
    -- Backup current user sessions if they exist
    INSERT INTO migration_backup.user_sessions_backup (
        session_id, user_id, role_at_backup, backup_id
    )
    SELECT 
        'session_' || up.id::TEXT, -- Placeholder for session data
        up.id,
        up.role::TEXT,
        backup_uuid
    FROM user_profiles up;
    
    -- Backup RLS policies that reference user roles
    INSERT INTO migration_backup.rls_policies_backup (
        policy_name, table_name, policy_definition, backup_id
    )
    SELECT 
        pol.policyname,
        pol.tablename,
        pol.qual, -- Policy definition
        backup_uuid
    FROM pg_policies pol
    WHERE pol.qual LIKE '%role%' OR pol.qual LIKE '%user_role%';
    
    GET DIAGNOSTICS policy_count = ROW_COUNT;
    
    -- Calculate approximate backup size
    SELECT 
        ROUND(
            (pg_total_relation_size('migration_backup.user_profiles_complete_backup') +
             pg_total_relation_size('migration_backup.user_sessions_backup') +
             pg_total_relation_size('migration_backup.rls_policies_backup')) / 1024.0 / 1024.0, 2
        ) INTO backup_size;
    
    -- Log the backup operation
    INSERT INTO migration_backup.backup_log (
        backup_id,
        table_name,
        record_count,
        backup_timestamp,
        backup_type,
        status,
        notes
    ) VALUES (
        backup_uuid,
        'comprehensive_backup',
        user_count,
        NOW(),
        'full_backup',
        'completed',
        format('Backup: %s users, %s policies, %s MB', user_count, policy_count, backup_size)
    );
    
    RETURN QUERY SELECT 
        backup_uuid,
        user_count,
        policy_count,
        NOW()::TIMESTAMPTZ,
        'completed'::TEXT,
        backup_size;
        
    RAISE NOTICE 'Comprehensive backup completed: % users, % policies, % MB (ID: %)', 
        user_count, policy_count, backup_size, backup_uuid;
END;
$ LANGUAGE plpgsql;

-- Function to validate backup completeness
CREATE OR REPLACE FUNCTION migration_backup.validate_backup_completeness(p_backup_id UUID)
RETURNS TABLE(
    validation_check TEXT,
    expected_count INTEGER,
    actual_count INTEGER,
    status TEXT,
    details TEXT
) AS $
DECLARE
    orig_user_count INTEGER;
    backup_user_count INTEGER;
    missing_users INTEGER;
    policy_count INTEGER;
BEGIN
    -- Check user count
    SELECT COUNT(*) INTO orig_user_count FROM user_profiles;
    SELECT COUNT(*) INTO backup_user_count 
    FROM migration_backup.user_profiles_complete_backup 
    WHERE backup_id = p_backup_id;
    
    RETURN QUERY SELECT 
        'user_profiles_count'::TEXT,
        orig_user_count,
        backup_user_count,
        CASE WHEN orig_user_count = backup_user_count THEN 'PASS' ELSE 'FAIL' END::TEXT,
        CASE WHEN orig_user_count = backup_user_count 
             THEN 'All users backed up successfully'
             ELSE format('Missing %s users in backup', orig_user_count - backup_user_count)
        END::TEXT;
    
    -- Check for users with null critical fields
    SELECT COUNT(*) INTO missing_users
    FROM migration_backup.user_profiles_complete_backup 
    WHERE backup_id = p_backup_id 
    AND (id IS NULL OR email IS NULL OR role IS NULL);
    
    RETURN QUERY SELECT 
        'data_integrity'::TEXT,
        0,
        missing_users,
        CASE WHEN missing_users = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        CASE WHEN missing_users = 0 
             THEN 'All backup records have complete data'
             ELSE format('%s records have missing critical data', missing_users)
        END::TEXT;
    
    -- Check RLS policies backup
    SELECT COUNT(*) INTO policy_count
    FROM migration_backup.rls_policies_backup 
    WHERE backup_id = p_backup_id;
    
    RETURN QUERY SELECT 
        'rls_policies_backup'::TEXT,
        policy_count,
        policy_count,
        CASE WHEN policy_count > 0 THEN 'PASS' ELSE 'WARN' END::TEXT,
        format('%s RLS policies backed up', policy_count)::TEXT;
    
    -- Check role distribution preservation
    FOR validation_check, expected_count, actual_count IN
        SELECT 
            'role_distribution_' || COALESCE(orig.role_text, 'null'),
            orig.count,
            COALESCE(backup.count, 0)
        FROM (
            SELECT role::TEXT as role_text, COUNT(*)::INTEGER as count
            FROM user_profiles 
            GROUP BY role::TEXT
        ) orig
        LEFT JOIN (
            SELECT role as role_text, COUNT(*)::INTEGER as count
            FROM migration_backup.user_profiles_complete_backup 
            WHERE backup_id = p_backup_id
            GROUP BY role
        ) backup ON orig.role_text = backup.role_text
    LOOP
        RETURN QUERY SELECT 
            validation_check,
            expected_count,
            actual_count,
            CASE WHEN expected_count = actual_count THEN 'PASS' ELSE 'FAIL' END::TEXT,
            format('Role %s: expected %s, got %s', 
                   REPLACE(validation_check, 'role_distribution_', ''),
                   expected_count, actual_count)::TEXT;
    END LOOP;
    
    RAISE NOTICE 'Backup validation completed for backup ID: %', p_backup_id;
END;
$ LANGUAGE plpgsql;

-- Function to get backup summary
CREATE OR REPLACE FUNCTION migration_backup.get_backup_summary(p_backup_id UUID DEFAULT NULL)
RETURNS TABLE(
    backup_id UUID,
    backup_timestamp TIMESTAMPTZ,
    total_users INTEGER,
    total_policies INTEGER,
    backup_size_estimate TEXT,
    status TEXT,
    age_hours NUMERIC
) AS $
BEGIN
    IF p_backup_id IS NULL THEN
        -- Return all backups
        RETURN QUERY
        SELECT DISTINCT
            b.backup_id,
            b.backup_timestamp,
            COUNT(DISTINCT ub.id)::INTEGER as total_users,
            COUNT(DISTINCT pb.policy_name)::INTEGER as total_policies,
            '~' || ROUND(
                (pg_total_relation_size('migration_backup.user_profiles_complete_backup') / 1024.0 / 1024.0), 2
            )::TEXT || ' MB' as backup_size_estimate,
            bl.status,
            ROUND(EXTRACT(EPOCH FROM (NOW() - b.backup_timestamp)) / 3600.0, 2) as age_hours
        FROM migration_backup.user_profiles_complete_backup b
        LEFT JOIN migration_backup.user_profiles_complete_backup ub ON b.backup_id = ub.backup_id
        LEFT JOIN migration_backup.rls_policies_backup pb ON b.backup_id = pb.backup_id
        LEFT JOIN migration_backup.backup_log bl ON b.backup_id = bl.backup_id
        GROUP BY b.backup_id, b.backup_timestamp, bl.status
        ORDER BY b.backup_timestamp DESC;
    ELSE
        -- Return specific backup
        RETURN QUERY
        SELECT 
            p_backup_id,
            b.backup_timestamp,
            COUNT(DISTINCT b.id)::INTEGER as total_users,
            COUNT(DISTINCT pb.policy_name)::INTEGER as total_policies,
            '~' || ROUND(
                (pg_total_relation_size('migration_backup.user_profiles_complete_backup') / 1024.0 / 1024.0), 2
            )::TEXT || ' MB' as backup_size_estimate,
            bl.status,
            ROUND(EXTRACT(EPOCH FROM (NOW() - b.backup_timestamp)) / 3600.0, 2) as age_hours
        FROM migration_backup.user_profiles_complete_backup b
        LEFT JOIN migration_backup.rls_policies_backup pb ON b.backup_id = pb.backup_id
        LEFT JOIN migration_backup.backup_log bl ON b.backup_id = bl.backup_id
        WHERE b.backup_id = p_backup_id
        GROUP BY b.backup_id, b.backup_timestamp, bl.status;
    END IF;
END;
$ LANGUAGE plpgsql;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_backup_id 
ON migration_backup.user_profiles_complete_backup(backup_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_backup_timestamp 
ON migration_backup.user_profiles_complete_backup(backup_timestamp);

CREATE INDEX IF NOT EXISTS idx_rls_policies_backup_id 
ON migration_backup.rls_policies_backup(backup_id);

-- Grant permissions
GRANT USAGE ON SCHEMA migration_backup TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA migration_backup TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA migration_backup TO postgres;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA migration_backup TO postgres;

-- Add comments
COMMENT ON TABLE migration_backup.user_profiles_complete_backup IS 'Complete backup of user profiles with metadata for role migration';
COMMENT ON TABLE migration_backup.rls_policies_backup IS 'Backup of RLS policies that reference user roles';
COMMENT ON FUNCTION migration_backup.create_comprehensive_backup IS 'Creates complete backup of all user-related data before migration';
COMMENT ON FUNCTION migration_backup.validate_backup_completeness IS 'Validates that backup contains all expected data';