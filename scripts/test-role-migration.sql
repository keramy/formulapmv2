-- Test Script for Role Migration
-- Tests the role migration script on a backup/test database
-- Validates mapping logic and ensures data integrity

\echo 'Starting Role Migration Test Script'

-- ============================================================================
-- CREATE TEST ENVIRONMENT
-- ============================================================================

-- Create test schema
CREATE SCHEMA IF NOT EXISTS migration_test;

-- Create test user_profiles table with sample data
CREATE TABLE migration_test.user_profiles AS
SELECT * FROM user_profiles LIMIT 0; -- Structure only

-- Insert test data representing all 13 old roles
INSERT INTO migration_test.user_profiles (
    id, role, first_name, last_name, email, seniority_level, 
    is_active, created_at, updated_at
) VALUES
    (gen_random_uuid(), 'company_owner'::user_role_old, 'John', 'Owner', 'owner@test.com', 'regular', true, NOW(), NOW()),
    (gen_random_uuid(), 'general_manager'::user_role_old, 'Jane', 'Manager', 'gm@test.com', 'regular', true, NOW(), NOW()),
    (gen_random_uuid(), 'deputy_general_manager'::user_role_old, 'Bob', 'Deputy', 'deputy@test.com', 'regular', true, NOW(), NOW()),
    (gen_random_uuid(), 'technical_director'::user_role_old, 'Alice', 'Tech', 'tech@test.com', 'regular', true, NOW(), NOW()),
    (gen_random_uuid(), 'architect'::user_role_old, 'Charlie', 'Architect', 'arch@test.com', 'regular', true, NOW(), NOW()),
    (gen_random_uuid(), 'technical_engineer'::user_role_old, 'David', 'Engineer', 'eng@test.com', 'regular', true, NOW(), NOW()),
    (gen_random_uuid(), 'field_worker'::user_role_old, 'Eve', 'Worker', 'worker@test.com', 'regular', true, NOW(), NOW()),
    (gen_random_uuid(), 'purchase_director'::user_role_old, 'Frank', 'Purchase', 'purchase@test.com', 'regular', true, NOW(), NOW()),
    (gen_random_uuid(), 'purchase_specialist'::user_role_old, 'Grace', 'Specialist', 'spec@test.com', 'regular', true, NOW(), NOW()),
    (gen_random_uuid(), 'project_manager'::user_role_old, 'Henry', 'PM', 'pm@test.com', 'regular', true, NOW(), NOW()),
    (gen_random_uuid(), 'client'::user_role_old, 'Ivy', 'Client', 'client@test.com', 'regular', true, NOW(), NOW()),
    (gen_random_uuid(), 'admin'::user_role_old, 'Jack', 'Admin', 'admin@test.com', 'regular', true, NOW(), NOW()),
    (gen_random_uuid(), 'subcontractor'::user_role_old, 'Kate', 'Sub', 'sub@test.com', 'regular', true, NOW(), NOW());

\echo 'Test data created with all 13 role types'

-- ============================================================================
-- TEST ROLE MAPPING LOGIC
-- ============================================================================

\echo 'Testing role mapping logic...'

-- Test the mapping logic without actually changing the table
CREATE OR REPLACE FUNCTION migration_test.test_role_mapping()
RETURNS TABLE(
    test_name TEXT,
    old_role TEXT,
    expected_new_role TEXT,
    expected_seniority TEXT,
    actual_new_role TEXT,
    actual_seniority TEXT,
    test_result TEXT
) AS $
DECLARE
    test_record RECORD;
    expected_mapping RECORD;
BEGIN
    -- Define expected mappings
    CREATE TEMP TABLE expected_mappings (
        old_role TEXT,
        new_role TEXT,
        seniority TEXT
    );
    
    INSERT INTO expected_mappings VALUES
        ('company_owner', 'management', 'executive'),
        ('general_manager', 'management', 'executive'),
        ('deputy_general_manager', 'management', 'senior'),
        ('technical_director', 'technical_lead', 'senior'),
        ('architect', 'project_manager', 'senior'),
        ('technical_engineer', 'project_manager', 'regular'),
        ('field_worker', 'project_manager', 'regular'),
        ('purchase_director', 'purchase_manager', 'senior'),
        ('purchase_specialist', 'purchase_manager', 'regular'),
        ('project_manager', 'project_manager', 'regular'),
        ('client', 'client', 'standard'),
        ('admin', 'admin', 'system'),
        ('subcontractor', 'project_manager', 'regular');
    
    -- Test each mapping
    FOR test_record IN
        SELECT 
            up.role::TEXT as current_role,
            up.first_name,
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
            END as mapped_role,
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
            END as mapped_seniority
        FROM migration_test.user_profiles up
    LOOP
        SELECT * INTO expected_mapping 
        FROM expected_mappings 
        WHERE old_role = test_record.current_role;
        
        RETURN QUERY SELECT
            format('role_mapping_%s', test_record.first_name),
            test_record.current_role,
            expected_mapping.new_role,
            expected_mapping.seniority,
            test_record.mapped_role,
            test_record.mapped_seniority,
            CASE 
                WHEN test_record.mapped_role = expected_mapping.new_role 
                     AND test_record.mapped_seniority = expected_mapping.seniority 
                THEN 'PASS'
                ELSE 'FAIL'
            END;
    END LOOP;
    
    DROP TABLE expected_mappings;
END;
$ LANGUAGE plpgsql;

-- Run mapping tests
DO $
DECLARE
    test_result RECORD;
    total_tests INTEGER := 0;
    passed_tests INTEGER := 0;
BEGIN
    RAISE NOTICE 'Running role mapping tests...';
    
    FOR test_result IN
        SELECT * FROM migration_test.test_role_mapping()
    LOOP
        total_tests := total_tests + 1;
        
        IF test_result.test_result = 'PASS' THEN
            passed_tests := passed_tests + 1;
            RAISE NOTICE 'PASS: % → % (%) ✓', 
                test_result.old_role, 
                test_result.actual_new_role, 
                test_result.actual_seniority;
        ELSE
            RAISE WARNING 'FAIL: % → expected: % (%), got: % (%)', 
                test_result.old_role,
                test_result.expected_new_role,
                test_result.expected_seniority,
                test_result.actual_new_role,
                test_result.actual_seniority;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Mapping tests completed: %/% passed', passed_tests, total_tests;
    
    IF passed_tests = total_tests THEN
        RAISE NOTICE 'All mapping tests PASSED ✓';
    ELSE
        RAISE WARNING 'Some mapping tests FAILED - review before proceeding';
    END IF;
END $;

-- ============================================================================
-- TEST ACTUAL MIGRATION ON TEST DATA
-- ============================================================================

\echo 'Testing actual migration process on test data...'

-- Create backup of test data
CREATE TABLE migration_test.user_profiles_backup AS
SELECT * FROM migration_test.user_profiles;

-- Apply migration to test data
BEGIN;

-- Store original roles
UPDATE migration_test.user_profiles 
SET 
    previous_role = role,
    role_migrated_at = NOW()
WHERE previous_role IS NULL;

-- Update seniority levels
UPDATE migration_test.user_profiles 
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

-- Migrate role column
ALTER TABLE migration_test.user_profiles 
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

COMMIT;

-- ============================================================================
-- VALIDATE TEST MIGRATION RESULTS
-- ============================================================================

\echo 'Validating test migration results...'

DO $
DECLARE
    validation_record RECORD;
    total_users INTEGER;
    validation_errors INTEGER := 0;
BEGIN
    SELECT COUNT(*) INTO total_users FROM migration_test.user_profiles;
    RAISE NOTICE 'Total test users after migration: %', total_users;
    
    -- Validate each user's migration
    FOR validation_record IN
        SELECT 
            first_name,
            last_name,
            previous_role::TEXT as old_role,
            role::TEXT as new_role,
            seniority_level
        FROM migration_test.user_profiles
        ORDER BY first_name
    LOOP
        RAISE NOTICE 'User %: % → % (seniority: %)', 
            validation_record.first_name,
            validation_record.old_role,
            validation_record.new_role,
            validation_record.seniority_level;
    END LOOP;
    
    -- Check for any NULL values
    IF EXISTS (SELECT 1 FROM migration_test.user_profiles WHERE previous_role IS NULL) THEN
        RAISE WARNING 'Some users missing previous_role data';
        validation_errors := validation_errors + 1;
    END IF;
    
    IF EXISTS (SELECT 1 FROM migration_test.user_profiles WHERE seniority_level IS NULL) THEN
        RAISE WARNING 'Some users missing seniority_level data';
        validation_errors := validation_errors + 1;
    END IF;
    
    -- Check role distribution
    RAISE NOTICE 'Final role distribution:';
    FOR validation_record IN
        SELECT role::TEXT, COUNT(*) as count
        FROM migration_test.user_profiles
        GROUP BY role
        ORDER BY count DESC
    LOOP
        RAISE NOTICE '  %: % users', validation_record.role, validation_record.count;
    END LOOP;
    
    IF validation_errors = 0 THEN
        RAISE NOTICE 'Test migration validation PASSED ✓';
    ELSE
        RAISE WARNING 'Test migration validation FAILED with % errors', validation_errors;
    END IF;
END $;

-- ============================================================================
-- CLEANUP TEST ENVIRONMENT
-- ============================================================================

\echo 'Cleaning up test environment...'

-- Drop test functions
DROP FUNCTION IF EXISTS migration_test.test_role_mapping();

-- Keep test schema for review if needed
-- DROP SCHEMA IF EXISTS migration_test CASCADE;

\echo 'Role migration test completed!'
\echo 'Test schema migration_test preserved for review'
\echo 'If tests passed, the migration script is ready for production use'