-- Migration Rollback System
-- Provides complete rollback capability for role migration

-- Function to perform complete rollback from backup
CREATE OR REPLACE FUNCTION migration_backup.execute_rollback(
    p_backup_id UUID,
    p_rollback_reason TEXT DEFAULT 'Manual rollback requested'
)
RETURNS TABLE(
    rollback_id UUID,
    users_restored INTEGER,
    policies_restored INTEGER,
    rollback_timestamp TIMESTAMPTZ,
    rollback_status TEXT,
    validation_results TEXT[]
) AS $
DECLARE
    rollback_uuid UUID := gen_random_uuid();
    restored_users INTEGER := 0;
    restored_policies INTEGER := 0;
    validation_errors TEXT[] := ARRAY[]::TEXT[];
    backup_exists BOOLEAN := FALSE;
    original_enum_type TEXT;
    policy_record RECORD;
    user_record RECORD;
BEGIN
    RAISE NOTICE 'Starting rollback process with backup ID: %', p_backup_id;
    
    -- Verify backup exists
    SELECT COUNT(*) > 0 INTO backup_exists
    FROM migration_backup.user_profiles_complete_backup 
    WHERE backup_id = p_backup_id;
    
    IF NOT backup_exists THEN
        RAISE EXCEPTION 'Backup with ID % not found', p_backup_id;
    END IF;
    
    -- Start transaction for rollback
    BEGIN
        -- Log rollback start
        INSERT INTO migration_backup.backup_log (
            backup_id,
            table_name,
            record_count,
            backup_timestamp,
            backup_type,
            status,
            notes
        ) VALUES (
            rollback_uuid,
            'rollback_operation',
            0,
            NOW(),
            'rollback',
            'in_progress',
            format('Rollback from backup %s: %s', p_backup_id, p_rollback_reason)
        );
        
        -- Get the original enum type from backup
        SELECT DISTINCT original_role_enum INTO original_enum_type
        FROM migration_backup.user_profiles_complete_backup 
        WHERE backup_id = p_backup_id
        LIMIT 1;
        
        -- Restore RLS policies first (they depend on role enum)
        FOR policy_record IN 
            SELECT policy_name, table_name, policy_definition
            FROM migration_backup.rls_policies_backup 
            WHERE backup_id = p_backup_id
        LOOP
            BEGIN
                -- Drop existing policy
                EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 
                              policy_record.policy_name, 
                              policy_record.table_name);
                
                -- Recreate original policy
                EXECUTE format('CREATE POLICY %I ON %I %s', 
                              policy_record.policy_name,
                              policy_record.table_name,
                              policy_record.policy_definition);
                
                restored_policies := restored_policies + 1;
                
                RAISE NOTICE 'Restored policy: % on table %', 
                    policy_record.policy_name, policy_record.table_name;
                    
            EXCEPTION WHEN OTHERS THEN
                validation_errors := validation_errors || 
                    format('Failed to restore policy %s: %s', 
                           policy_record.policy_name, SQLERRM);
                RAISE WARNING 'Failed to restore policy %: %', 
                    policy_record.policy_name, SQLERRM;
            END;
        END LOOP;
        
        -- Check if we need to recreate the old enum type
        IF original_enum_type IS NOT NULL AND original_enum_type != 'user_role' THEN
            -- This would require recreating the old enum type
            -- For safety, we'll document this but not automatically execute
            validation_errors := validation_errors || 
                format('Warning: Original enum type was %s, manual enum restoration may be needed', 
                       original_enum_type);
        END IF;
        
        -- Restore user profiles data
        -- First, disable triggers to avoid conflicts
        ALTER TABLE user_profiles DISABLE TRIGGER ALL;
        
        -- Clear current data (with safety check)
        IF (SELECT COUNT(*) FROM user_profiles) > 0 THEN
            -- Create temporary backup of current state before rollback
            CREATE TEMP TABLE temp_current_users AS 
            SELECT * FROM user_profiles;
            
            RAISE NOTICE 'Created temporary backup of current state before rollback';
        END IF;
        
        -- Delete current user data
        DELETE FROM user_profiles;
        
        -- Restore from backup
        FOR user_record IN 
            SELECT id, email, full_name, role, seniority_level, previous_role, 
                   created_at, updated_at
            FROM migration_backup.user_profiles_complete_backup 
            WHERE backup_id = p_backup_id
        LOOP
            BEGIN
                INSERT INTO user_profiles (
                    id, email, full_name, role, seniority_level, previous_role,
                    created_at, updated_at
                ) VALUES (
                    user_record.id,
                    user_record.email,
                    user_record.full_name,
                    user_record.role::user_role, -- Cast to current enum type
                    CASE 
                        WHEN user_record.seniority_level IS NOT NULL 
                        THEN user_record.seniority_level::seniority_level
                        ELSE NULL
                    END,
                    user_record.previous_role,
                    user_record.created_at,
                    user_record.updated_at
                );
                
                restored_users := restored_users + 1;
                
            EXCEPTION WHEN OTHERS THEN
                validation_errors := validation_errors || 
                    format('Failed to restore user %s (%s): %s', 
                           user_record.email, user_record.id, SQLERRM);
                RAISE WARNING 'Failed to restore user %: %', 
                    user_record.email, SQLERRM;
            END;
        END LOOP;
        
        -- Re-enable triggers
        ALTER TABLE user_profiles ENABLE TRIGGER ALL;
        
        -- Update rollback log
        UPDATE migration_backup.backup_log 
        SET 
            record_count = restored_users,
            status = CASE 
                WHEN array_length(validation_errors, 1) > 0 THEN 'completed_with_warnings'
                ELSE 'completed'
            END,
            notes = format('Rollback completed: %s users, %s policies restored. Errors: %s', 
                          restored_users, restored_policies, 
                          COALESCE(array_length(validation_errors, 1), 0))
        WHERE backup_id = rollback_uuid;
        
        -- Log individual user restorations in migration tracking
        INSERT INTO migration_tracking.migration_log (
            user_id,
            user_email,
            old_role,
            new_role,
            migration_timestamp,
            migration_status,
            migration_batch_id
        )
        SELECT 
            b.id,
            b.email,
            'migrated_role', -- Placeholder for whatever role they had
            b.role,
            NOW(),
            'rolled_back',
            rollback_uuid
        FROM migration_backup.user_profiles_complete_backup b
        WHERE b.backup_id = p_backup_id;
        
        RAISE NOTICE 'Rollback completed: % users and % policies restored', 
            restored_users, restored_policies;
            
    EXCEPTION WHEN OTHERS THEN
        -- Rollback failed, log the error
        UPDATE migration_backup.backup_log 
        SET 
            status = 'failed',
            notes = format('Rollback failed: %s', SQLERRM)
        WHERE backup_id = rollback_uuid;
        
        RAISE EXCEPTION 'Rollback failed: %', SQLERRM;
    END;
    
    RETURN QUERY SELECT 
        rollback_uuid,
        restored_users,
        restored_policies,
        NOW()::TIMESTAMPTZ,
        CASE 
            WHEN array_length(validation_errors, 1) > 0 THEN 'completed_with_warnings'
            ELSE 'completed'
        END::TEXT,
        validation_errors;
END;
$ LANGUAGE plpgsql;

-- Function to validate rollback success
CREATE OR REPLACE FUNCTION migration_backup.validate_rollback_success(
    p_backup_id UUID,
    p_rollback_id UUID
)
RETURNS TABLE(
    validation_check TEXT,
    expected_value TEXT,
    actual_value TEXT,
    status TEXT,
    details TEXT
) AS $
DECLARE
    backup_user_count INTEGER;
    current_user_count INTEGER;
    role_match_count INTEGER;
    total_backup_users INTEGER;
BEGIN
    -- Get backup user count
    SELECT COUNT(*) INTO backup_user_count
    FROM migration_backup.user_profiles_complete_backup 
    WHERE backup_id = p_backup_id;
    
    -- Get current user count
    SELECT COUNT(*) INTO current_user_count FROM user_profiles;
    
    -- Check total user count
    RETURN QUERY SELECT 
        'total_user_count'::TEXT,
        backup_user_count::TEXT,
        current_user_count::TEXT,
        CASE WHEN backup_user_count = current_user_count THEN 'PASS' ELSE 'FAIL' END::TEXT,
        format('Expected %s users, found %s users', backup_user_count, current_user_count)::TEXT;
    
    -- Check role distribution matches backup
    SELECT COUNT(*) INTO total_backup_users
    FROM migration_backup.user_profiles_complete_backup 
    WHERE backup_id = p_backup_id;
    
    SELECT COUNT(*) INTO role_match_count
    FROM migration_backup.user_profiles_complete_backup b
    JOIN user_profiles u ON b.id = u.id AND b.role = u.role::TEXT
    WHERE b.backup_id = p_backup_id;
    
    RETURN QUERY SELECT 
        'role_distribution_match'::TEXT,
        total_backup_users::TEXT,
        role_match_count::TEXT,
        CASE WHEN total_backup_users = role_match_count THEN 'PASS' ELSE 'FAIL' END::TEXT,
        format('%s of %s users have matching roles', role_match_count, total_backup_users)::TEXT;
    
    -- Check for any users not in backup
    FOR validation_check, expected_value, actual_value IN
        SELECT 
            'missing_user_' || u.email,
            'should_not_exist',
            'exists'
        FROM user_profiles u
        LEFT JOIN migration_backup.user_profiles_complete_backup b 
            ON u.id = b.id AND b.backup_id = p_backup_id
        WHERE b.id IS NULL
        LIMIT 10 -- Limit to avoid too many results
    LOOP
        RETURN QUERY SELECT 
            validation_check,
            expected_value,
            actual_value,
            'FAIL'::TEXT,
            'User exists in current state but not in backup'::TEXT;
    END LOOP;
    
    -- Check rollback log status
    RETURN QUERY SELECT 
        'rollback_operation_status'::TEXT,
        'completed'::TEXT,
        bl.status::TEXT,
        CASE WHEN bl.status IN ('completed', 'completed_with_warnings') THEN 'PASS' ELSE 'FAIL' END::TEXT,
        COALESCE(bl.notes, 'No details available')::TEXT
    FROM migration_backup.backup_log bl
    WHERE bl.backup_id = p_rollback_id;
    
    RAISE NOTICE 'Rollback validation completed for backup % and rollback %', p_backup_id, p_rollback_id;
END;
$ LANGUAGE plpgsql;

-- Function to list available backups for rollback
CREATE OR REPLACE FUNCTION migration_backup.list_available_backups()
RETURNS TABLE(
    backup_id UUID,
    backup_timestamp TIMESTAMPTZ,
    user_count INTEGER,
    age_hours NUMERIC,
    status TEXT,
    can_rollback BOOLEAN
) AS $
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        b.backup_id,
        b.backup_timestamp,
        COUNT(b.id)::INTEGER as user_count,
        ROUND(EXTRACT(EPOCH FROM (NOW() - b.backup_timestamp)) / 3600.0, 2) as age_hours,
        COALESCE(bl.status, 'unknown')::TEXT as status,
        (bl.status = 'completed' AND 
         EXTRACT(EPOCH FROM (NOW() - b.backup_timestamp)) < 86400 * 7)::BOOLEAN as can_rollback -- 7 days
    FROM migration_backup.user_profiles_complete_backup b
    LEFT JOIN migration_backup.backup_log bl ON b.backup_id = bl.backup_id
    GROUP BY b.backup_id, b.backup_timestamp, bl.status
    ORDER BY b.backup_timestamp DESC;
END;
$ LANGUAGE plpgsql;

-- Emergency rollback function (simplified, for critical situations)
CREATE OR REPLACE FUNCTION migration_backup.emergency_rollback(p_backup_id UUID)
RETURNS BOOLEAN AS $
DECLARE
    backup_count INTEGER;
BEGIN
    -- Quick validation
    SELECT COUNT(*) INTO backup_count
    FROM migration_backup.user_profiles_complete_backup 
    WHERE backup_id = p_backup_id;
    
    IF backup_count = 0 THEN
        RAISE EXCEPTION 'Emergency rollback failed: backup % not found', p_backup_id;
    END IF;
    
    -- Simple restore without extensive validation
    DELETE FROM user_profiles;
    
    INSERT INTO user_profiles (id, email, full_name, role, seniority_level, previous_role, created_at, updated_at)
    SELECT 
        id, email, full_name, 
        role::user_role,
        CASE WHEN seniority_level IS NOT NULL THEN seniority_level::seniority_level ELSE NULL END,
        previous_role,
        created_at, updated_at
    FROM migration_backup.user_profiles_complete_backup 
    WHERE backup_id = p_backup_id;
    
    RAISE NOTICE 'Emergency rollback completed for backup %', p_backup_id;
    RETURN TRUE;
    
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Emergency rollback failed: %', SQLERRM;
END;
$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA migration_backup TO postgres;

-- Add comments
COMMENT ON FUNCTION migration_backup.execute_rollback IS 'Performs complete rollback of role migration using specified backup';
COMMENT ON FUNCTION migration_backup.validate_rollback_success IS 'Validates that rollback restored data correctly';
COMMENT ON FUNCTION migration_backup.list_available_backups IS 'Lists all available backups that can be used for rollback';
COMMENT ON FUNCTION migration_backup.emergency_rollback IS 'Emergency rollback function for critical situations';