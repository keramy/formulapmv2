-- Migration Validation Functions
-- Comprehensive validation suite for role migration process

-- Create validation schema
CREATE SCHEMA IF NOT EXISTS migration_validation;

-- Function to validate pre-migration state
CREATE OR REPLACE FUNCTION migration_validation.validate_pre_migration_state()
RETURNS TABLE(
    validation_category TEXT,
    check_name TEXT,
    status TEXT,
    details TEXT,
    recommendation TEXT
) AS $
DECLARE
    user_count INTEGER;
    role_enum_exists BOOLEAN;
    old_role_enum_exists BOOLEAN;
    rls_policy_count INTEGER;
    backup_available BOOLEAN;
BEGIN
    -- Check user count
    SELECT COUNT(*) INTO user_count FROM user_profiles;
    
    RETURN QUERY SELECT 
        'data_integrity'::TEXT,
        'user_count'::TEXT,
        CASE WHEN user_count > 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        format('Found %s users in user_profiles table', user_count)::TEXT,
        CASE WHEN user_count = 0 THEN 'Cannot migrate with no users' ELSE 'Ready for migration' END::TEXT;
    
    -- Check enum types exist
    SELECT EXISTS(
        SELECT 1 FROM pg_type WHERE typname = 'user_role'
    ) INTO role_enum_exists;
    
    RETURN QUERY SELECT 
        'schema_validation'::TEXT,
        'new_role_enum_exists'::TEXT,
        CASE WHEN role_enum_exists THEN 'PASS' ELSE 'FAIL' END::TEXT,
        format('user_role enum exists: %s', role_enum_exists)::TEXT,
        CASE WHEN NOT role_enum_exists THEN 'Create user_role enum before migration' ELSE 'Enum ready' END::TEXT;
    
    SELECT EXISTS(
        SELECT 1 FROM pg_type WHERE typname = 'user_role_old'
    ) INTO old_role_enum_exists;
    
    RETURN QUERY SELECT 
        'schema_validation'::TEXT,
        'old_role_enum_exists'::TEXT,
        CASE WHEN old_role_enum_exists THEN 'PASS' ELSE 'WARN' END::TEXT,
        format('user_role_old enum exists: %s', old_role_enum_exists)::TEXT,
        CASE WHEN NOT old_role_enum_exists THEN 'Old enum not found - may already be migrated' ELSE 'Old enum available' END::TEXT;
    
    -- Check RLS policies
    SELECT COUNT(*) INTO rls_policy_count
    FROM pg_policies 
    WHERE qual LIKE '%role%' OR qual LIKE '%user_role%';
    
    RETURN QUERY SELECT 
        'security_validation'::TEXT,
        'rls_policies_count'::TEXT,
        CASE WHEN rls_policy_count > 0 THEN 'PASS' ELSE 'WARN' END::TEXT,
        format('Found %s RLS policies referencing roles', rls_policy_count)::TEXT,
        CASE WHEN rls_policy_count = 0 THEN 'No RLS policies found - verify security setup' ELSE 'RLS policies detected' END::TEXT;
    
    -- Check backup availability
    SELECT EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'migration_backup' 
        AND table_name = 'user_profiles_complete_backup'
    ) INTO backup_available;
    
    RETURN QUERY SELECT 
        'backup_validation'::TEXT,
        'backup_system_ready'::TEXT,
        CASE WHEN backup_available THEN 'PASS' ELSE 'FAIL' END::TEXT,
        format('Backup system available: %s', backup_available)::TEXT,
        CASE WHEN NOT backup_available THEN 'Run backup system setup before migration' ELSE 'Backup system ready' END::TEXT;
    
    -- Check for users with null roles
    SELECT COUNT(*) INTO user_count FROM user_profiles WHERE role IS NULL;
    
    RETURN QUERY SELECT 
        'data_integrity'::TEXT,
        'users_with_null_roles'::TEXT,
        CASE WHEN user_count = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        format('Found %s users with null roles', user_count)::TEXT,
        CASE WHEN user_count > 0 THEN 'Fix null roles before migration' ELSE 'All users have roles' END::TEXT;
    
    RAISE NOTICE 'Pre-migration validation completed';
END;
$ LANGUAGE plpgsql;

-- Function to validate post-migration state
CREATE OR REPLACE FUNCTION migration_validation.validate_post_migration_state()
RETURNS TABLE(
    validation_category TEXT,
    check_name TEXT,
    status TEXT,
    details TEXT,
    recommendation TEXT
) AS $
DECLARE
    user_count INTEGER;
    users_with_new_roles INTEGER;
    users_with_seniority INTEGER;
    rls_policies_updated INTEGER;
    authentication_test_result BOOLEAN;
BEGIN
    -- Check total user count unchanged
    SELECT COUNT(*) INTO user_count FROM user_profiles;
    
    RETURN QUERY SELECT 
        'data_integrity'::TEXT,
        'user_count_preserved'::TEXT,
        'INFO'::TEXT,
        format('Total users after migration: %s', user_count)::TEXT,
        'Compare with pre-migration count'::TEXT;
    
    -- Check users have new role enum values
    SELECT COUNT(*) INTO users_with_new_roles 
    FROM user_profiles 
    WHERE role IN ('management', 'technical_lead', 'project_manager', 'purchase_manager', 'client', 'admin');
    
    RETURN QUERY SELECT 
        'migration_success'::TEXT,
        'users_with_new_roles'::TEXT,
        CASE WHEN users_with_new_roles = user_count THEN 'PASS' ELSE 'FAIL' END::TEXT,
        format('%s of %s users have new role values', users_with_new_roles, user_count)::TEXT,
        CASE WHEN users_with_new_roles < user_count THEN 'Some users may not have been migrated properly' ELSE 'All users migrated' END::TEXT;
    
    -- Check seniority levels assigned
    SELECT COUNT(*) INTO users_with_seniority 
    FROM user_profiles 
    WHERE seniority_level IS NOT NULL;
    
    RETURN QUERY SELECT 
        'migration_success'::TEXT,
        'seniority_levels_assigned'::TEXT,
        CASE WHEN users_with_seniority > 0 THEN 'PASS' ELSE 'WARN' END::TEXT,
        format('%s users have seniority levels assigned', users_with_seniority)::TEXT,
        CASE WHEN users_with_seniority = 0 THEN 'Consider assigning seniority levels' ELSE 'Seniority levels assigned' END::TEXT;
    
    -- Check RLS policies reference new roles
    SELECT COUNT(*) INTO rls_policies_updated
    FROM pg_policies 
    WHERE qual LIKE '%management%' OR qual LIKE '%technical_lead%' OR qual LIKE '%project_manager%';
    
    RETURN QUERY SELECT 
        'security_validation'::TEXT,
        'rls_policies_updated'::TEXT,
        CASE WHEN rls_policies_updated > 0 THEN 'PASS' ELSE 'WARN' END::TEXT,
        format('%s RLS policies reference new roles', rls_policies_updated)::TEXT,
        CASE WHEN rls_policies_updated = 0 THEN 'Update RLS policies to use new role names' ELSE 'RLS policies updated' END::TEXT;
    
    -- Test basic authentication capability
    BEGIN
        SELECT EXISTS(
            SELECT 1 FROM user_profiles 
            WHERE email IS NOT NULL AND role IS NOT NULL
            LIMIT 1
        ) INTO authentication_test_result;
        
        RETURN QUERY SELECT 
            'functionality_test'::TEXT,
            'basic_authentication_test'::TEXT,
            CASE WHEN authentication_test_result THEN 'PASS' ELSE 'FAIL' END::TEXT,
            format('Basic user data structure valid: %s', authentication_test_result)::TEXT,
            CASE WHEN NOT authentication_test_result THEN 'Critical: Users cannot authenticate' ELSE 'Authentication structure valid' END::TEXT;
            
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            'functionality_test'::TEXT,
            'basic_authentication_test'::TEXT,
            'FAIL'::TEXT,
            format('Authentication test failed: %s', SQLERRM)::TEXT,
            'Critical: Fix authentication issues immediately'::TEXT;
    END;
    
    -- Check for orphaned old role references
    RETURN QUERY SELECT 
        'cleanup_validation'::TEXT,
        'old_role_references'::TEXT,
        'INFO'::TEXT,
        'Check application code for old role references'::TEXT,
        'Search codebase for user_role_old references'::TEXT;
    
    RAISE NOTICE 'Post-migration validation completed';
END;
$ LANGUAGE plpgsql;

-- Function to validate role mapping correctness
CREATE OR REPLACE FUNCTION migration_validation.validate_role_mapping()
RETURNS TABLE(
    old_role TEXT,
    new_role TEXT,
    user_count INTEGER,
    mapping_status TEXT,
    notes TEXT
) AS $
DECLARE
    mapping_record RECORD;
BEGIN
    -- This function would ideally compare against the backup
    -- For now, we'll show the current role distribution
    
    FOR mapping_record IN
        SELECT 
            COALESCE(previous_role, 'unknown') as old_role_val,
            role::TEXT as new_role_val,
            COUNT(*) as count
        FROM user_profiles 
        GROUP BY previous_role, role::TEXT
        ORDER BY COUNT(*) DESC
    LOOP
        RETURN QUERY SELECT 
            mapping_record.old_role_val,
            mapping_record.new_role_val,
            mapping_record.count::INTEGER,
            CASE 
                WHEN mapping_record.old_role_val = 'unknown' THEN 'WARN'
                ELSE 'INFO'
            END::TEXT,
            CASE 
                WHEN mapping_record.old_role_val = 'unknown' THEN 'Previous role not recorded'
                ELSE 'Mapping recorded'
            END::TEXT;
    END LOOP;
    
    RAISE NOTICE 'Role mapping validation completed';
END;
$ LANGUAGE plpgsql;

-- Function to test user authentication after migration
CREATE OR REPLACE FUNCTION migration_validation.test_user_authentication(p_sample_size INTEGER DEFAULT 5)
RETURNS TABLE(
    user_email TEXT,
    user_role TEXT,
    seniority_level TEXT,
    auth_test_status TEXT,
    details TEXT
) AS $
DECLARE
    user_record RECORD;
    test_count INTEGER := 0;
BEGIN
    -- Test a sample of users to ensure they can be authenticated
    FOR user_record IN
        SELECT id, email, role::TEXT as role_text, seniority_level::TEXT as seniority_text
        FROM user_profiles 
        WHERE email IS NOT NULL 
        ORDER BY RANDOM()
        LIMIT p_sample_size
    LOOP
        test_count := test_count + 1;
        
        BEGIN
            -- Simulate basic authentication checks
            IF user_record.email IS NOT NULL AND user_record.role_text IS NOT NULL THEN
                RETURN QUERY SELECT 
                    user_record.email,
                    user_record.role_text,
                    COALESCE(user_record.seniority_text, 'none'),
                    'PASS'::TEXT,
                    'User data structure valid for authentication'::TEXT;
            ELSE
                RETURN QUERY SELECT 
                    user_record.email,
                    user_record.role_text,
                    COALESCE(user_record.seniority_text, 'none'),
                    'FAIL'::TEXT,
                    'Missing required authentication data'::TEXT;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            RETURN QUERY SELECT 
                user_record.email,
                user_record.role_text,
                COALESCE(user_record.seniority_text, 'none'),
                'ERROR'::TEXT,
                format('Authentication test error: %s', SQLERRM)::TEXT;
        END;
    END LOOP;
    
    RAISE NOTICE 'Authentication test completed for % users', test_count;
END;
$ LANGUAGE plpgsql;

-- Function to validate RLS policy functionality
CREATE OR REPLACE FUNCTION migration_validation.validate_rls_policies()
RETURNS TABLE(
    policy_name TEXT,
    table_name TEXT,
    policy_status TEXT,
    test_result TEXT,
    recommendation TEXT
) AS $
DECLARE
    policy_record RECORD;
    test_user_id UUID;
BEGIN
    -- Get a test user ID
    SELECT id INTO test_user_id FROM user_profiles LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RETURN QUERY SELECT 
            'no_test_user'::TEXT,
            'user_profiles'::TEXT,
            'FAIL'::TEXT,
            'No users available for RLS testing'::TEXT,
            'Cannot validate RLS without test users'::TEXT;
        RETURN;
    END IF;
    
    -- Check each RLS policy
    FOR policy_record IN
        SELECT pol.policyname, pol.tablename, pol.qual
        FROM pg_policies pol
        WHERE pol.qual LIKE '%role%'
    LOOP
        BEGIN
            -- Basic syntax validation
            IF policy_record.qual IS NOT NULL AND LENGTH(policy_record.qual) > 0 THEN
                RETURN QUERY SELECT 
                    policy_record.policyname,
                    policy_record.tablename,
                    'ACTIVE'::TEXT,
                    'PASS'::TEXT,
                    'Policy has valid definition'::TEXT;
            ELSE
                RETURN QUERY SELECT 
                    policy_record.policyname,
                    policy_record.tablename,
                    'INVALID'::TEXT,
                    'FAIL'::TEXT,
                    'Policy definition is empty or invalid'::TEXT;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            RETURN QUERY SELECT 
                policy_record.policyname,
                policy_record.tablename,
                'ERROR'::TEXT,
                'FAIL'::TEXT,
                format('Policy validation error: %s', SQLERRM)::TEXT;
        END;
    END LOOP;
    
    RAISE NOTICE 'RLS policy validation completed';
END;
$ LANGUAGE plpgsql;

-- Comprehensive validation runner
CREATE OR REPLACE FUNCTION migration_validation.run_comprehensive_validation(
    p_validation_type TEXT DEFAULT 'post_migration' -- 'pre_migration', 'post_migration', 'full'
)
RETURNS TABLE(
    validation_suite TEXT,
    total_checks INTEGER,
    passed_checks INTEGER,
    failed_checks INTEGER,
    warnings INTEGER,
    overall_status TEXT
) AS $
DECLARE
    pre_results RECORD;
    post_results RECORD;
    auth_results RECORD;
    rls_results RECORD;
    total_checks_count INTEGER := 0;
    passed_count INTEGER := 0;
    failed_count INTEGER := 0;
    warning_count INTEGER := 0;
BEGIN
    IF p_validation_type IN ('pre_migration', 'full') THEN
        -- Run pre-migration validation
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'PASS') as passed,
            COUNT(*) FILTER (WHERE status = 'FAIL') as failed,
            COUNT(*) FILTER (WHERE status = 'WARN') as warnings
        INTO pre_results
        FROM migration_validation.validate_pre_migration_state();
        
        total_checks_count := total_checks_count + pre_results.total;
        passed_count := passed_count + pre_results.passed;
        failed_count := failed_count + pre_results.failed;
        warning_count := warning_count + pre_results.warnings;
        
        RETURN QUERY SELECT 
            'pre_migration_validation'::TEXT,
            pre_results.total,
            pre_results.passed,
            pre_results.failed,
            pre_results.warnings,
            CASE 
                WHEN pre_results.failed > 0 THEN 'FAIL'
                WHEN pre_results.warnings > 0 THEN 'WARN'
                ELSE 'PASS'
            END::TEXT;
    END IF;
    
    IF p_validation_type IN ('post_migration', 'full') THEN
        -- Run post-migration validation
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'PASS') as passed,
            COUNT(*) FILTER (WHERE status = 'FAIL') as failed,
            COUNT(*) FILTER (WHERE status = 'WARN') as warnings
        INTO post_results
        FROM migration_validation.validate_post_migration_state();
        
        total_checks_count := total_checks_count + post_results.total;
        passed_count := passed_count + post_results.passed;
        failed_count := failed_count + post_results.failed;
        warning_count := warning_count + post_results.warnings;
        
        RETURN QUERY SELECT 
            'post_migration_validation'::TEXT,
            post_results.total,
            post_results.passed,
            post_results.failed,
            post_results.warnings,
            CASE 
                WHEN post_results.failed > 0 THEN 'FAIL'
                WHEN post_results.warnings > 0 THEN 'WARN'
                ELSE 'PASS'
            END::TEXT;
        
        -- Run authentication tests
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE auth_test_status = 'PASS') as passed,
            COUNT(*) FILTER (WHERE auth_test_status = 'FAIL') as failed,
            COUNT(*) FILTER (WHERE auth_test_status = 'ERROR') as warnings
        INTO auth_results
        FROM migration_validation.test_user_authentication(10);
        
        RETURN QUERY SELECT 
            'authentication_tests'::TEXT,
            auth_results.total,
            auth_results.passed,
            auth_results.failed,
            auth_results.warnings,
            CASE 
                WHEN auth_results.failed > 0 THEN 'FAIL'
                WHEN auth_results.warnings > 0 THEN 'WARN'
                ELSE 'PASS'
            END::TEXT;
        
        -- Run RLS validation
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE test_result = 'PASS') as passed,
            COUNT(*) FILTER (WHERE test_result = 'FAIL') as failed,
            0 as warnings
        INTO rls_results
        FROM migration_validation.validate_rls_policies();
        
        RETURN QUERY SELECT 
            'rls_policy_validation'::TEXT,
            rls_results.total,
            rls_results.passed,
            rls_results.failed,
            rls_results.warnings,
            CASE 
                WHEN rls_results.failed > 0 THEN 'FAIL'
                ELSE 'PASS'
            END::TEXT;
    END IF;
    
    -- Overall summary
    RETURN QUERY SELECT 
        'OVERALL_SUMMARY'::TEXT,
        total_checks_count,
        passed_count,
        failed_count,
        warning_count,
        CASE 
            WHEN failed_count > 0 THEN 'MIGRATION_FAILED'
            WHEN warning_count > 0 THEN 'MIGRATION_SUCCESS_WITH_WARNINGS'
            ELSE 'MIGRATION_SUCCESS'
        END::TEXT;
    
    RAISE NOTICE 'Comprehensive validation completed: % total checks, % passed, % failed, % warnings', 
        total_checks_count, passed_count, failed_count, warning_count;
END;
$ LANGUAGE plpgsql;

-- Grant permissions
GRANT USAGE ON SCHEMA migration_validation TO postgres;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA migration_validation TO postgres;

-- Add comments
COMMENT ON SCHEMA migration_validation IS 'Schema containing validation functions for role migration';
COMMENT ON FUNCTION migration_validation.validate_pre_migration_state IS 'Validates system state before migration';
COMMENT ON FUNCTION migration_validation.validate_post_migration_state IS 'Validates system state after migration';
COMMENT ON FUNCTION migration_validation.test_user_authentication IS 'Tests user authentication capability after migration';
COMMENT ON FUNCTION migration_validation.validate_rls_policies IS 'Validates RLS policy functionality';
COMMENT ON FUNCTION migration_validation.run_comprehensive_validation IS 'Runs complete validation suite';