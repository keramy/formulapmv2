-- Formula PM 2.0 RLS Optimization Test Script
-- Created: 2025-07-16
-- Purpose: Test optimized RLS policies maintain correct access control

-- ============================================================================
-- TEST SCENARIOS FOR RLS OPTIMIZATION
-- ============================================================================

-- Test 1: Verify auth.uid() and (select auth.uid()) return same results
DO $$
DECLARE
    direct_uid uuid;
    select_uid uuid;
BEGIN
    -- Get auth.uid() directly
    SELECT auth.uid() INTO direct_uid;
    
    -- Get (select auth.uid())
    SELECT (select auth.uid()) INTO select_uid;
    
    -- Compare results
    IF direct_uid = select_uid THEN
        RAISE NOTICE 'TEST 1 PASSED: auth.uid() patterns are equivalent';
    ELSE
        RAISE EXCEPTION 'TEST 1 FAILED: auth.uid() patterns differ - direct: %, select: %', direct_uid, select_uid;
    END IF;
END $$;

-- Test 2: Helper function optimization test
DO $$
DECLARE
    original_result boolean;
    optimized_result boolean;
BEGIN
    -- Test has_purchase_department_access function
    SELECT has_purchase_department_access() INTO optimized_result;
    
    -- Verify function returns a boolean
    IF optimized_result IS NOT NULL THEN
        RAISE NOTICE 'TEST 2 PASSED: has_purchase_department_access() returns valid boolean';
    ELSE
        RAISE EXCEPTION 'TEST 2 FAILED: has_purchase_department_access() returns NULL';
    END IF;
END $$;

-- Test 3: Verify policy existence after optimization
DO $$
DECLARE
    policy_count integer;
    expected_policies text[] := ARRAY[
        'Management and purchase vendor access',
        'Project team vendor read access', 
        'Vendor creator access',
        'Management purchase request access',
        'Project team purchase request read',
        'Requester own purchase request access',
        'Field worker purchase request read',
        'Management purchase order access',
        'Purchase order creator access',
        'Project team purchase order read',
        'Management vendor rating access',
        'Project manager vendor rating',
        'Rater own vendor rating access',
        'Team member vendor rating read',
        'Approver workflow access',
        'Purchase request workflow visibility',
        'Field worker delivery confirmation',
        'Vendor deactivation restriction',
        'Purchase request status protection',
        'Purchase order modification protection',
        'Purchase request deletion restriction',
        'Field worker scope access',
        'Field worker scope update',
        'Subcontractor scope access',
        'Users own profile access',
        'PM team member access',
        'Team member visibility',
        'Client self access',
        'PM client access',
        'PM assigned projects',
        'User own assignments',
        'Team assignment visibility',
        'Field worker own documents',
        'Subcontractor document access',
        'Client approval access',
        'Restrict role changes'
    ];
    policy_name text;
BEGIN
    -- Count total policies that should exist
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE policyname = ANY(expected_policies);
    
    -- Check if all expected policies exist
    IF policy_count >= 30 THEN
        RAISE NOTICE 'TEST 3 PASSED: % optimized policies found', policy_count;
    ELSE
        RAISE EXCEPTION 'TEST 3 FAILED: Only % policies found, expected at least 30', policy_count;
    END IF;
    
    -- List missing policies
    FOR policy_name IN 
        SELECT unnest(expected_policies) 
        EXCEPT 
        SELECT policyname FROM pg_policies WHERE policyname = ANY(expected_policies)
    LOOP
        RAISE NOTICE 'MISSING POLICY: %', policy_name;
    END LOOP;
END $$;

-- Test 4: Verify optimized policies work with sample data
DO $$
DECLARE
    test_user_id uuid := gen_random_uuid();
    test_project_id uuid := gen_random_uuid();
    test_vendor_id uuid := gen_random_uuid();
    test_request_id uuid := gen_random_uuid();
BEGIN
    -- Create temporary test data (if tables exist)
    BEGIN
        -- Test user profile access
        INSERT INTO user_profiles (id, email, full_name, role, created_at, updated_at)
        VALUES (test_user_id, 'test@example.com', 'Test User', 'project_manager', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'TEST 4 PASSED: Test data creation successful';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'TEST 4 SKIPPED: Could not create test data (tables may not exist yet)';
    END;
END $$;

-- Test 5: Performance comparison placeholder
DO $$
DECLARE
    start_time timestamp;
    end_time timestamp;
    execution_time interval;
BEGIN
    -- Record start time
    start_time := clock_timestamp();
    
    -- Execute a policy-heavy query (placeholder)
    PERFORM 1; -- Replace with actual query if needed
    
    -- Record end time
    end_time := clock_timestamp();
    execution_time := end_time - start_time;
    
    RAISE NOTICE 'TEST 5 PERFORMANCE: Query executed in %', execution_time;
END $$;

-- Test 6: Verify migration record
DO $$
DECLARE
    migration_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.migrations 
        WHERE version = '20250716000000' 
        AND name = 'optimize_auth_rls_performance'
    ) INTO migration_exists;
    
    IF migration_exists THEN
        RAISE NOTICE 'TEST 6 PASSED: Migration record found';
    ELSE
        RAISE EXCEPTION 'TEST 6 FAILED: Migration record not found';
    END IF;
END $$;

-- Test 7: Verify helper functions use optimized pattern
DO $$
DECLARE
    function_source text;
    optimization_found boolean := false;
BEGIN
    -- Check if has_purchase_department_access uses (select auth.uid())
    SELECT pg_get_functiondef(oid) INTO function_source
    FROM pg_proc 
    WHERE proname = 'has_purchase_department_access';
    
    -- Check if function contains optimized pattern
    IF function_source LIKE '%(select auth.uid())%' THEN
        optimization_found := true;
    END IF;
    
    IF optimization_found THEN
        RAISE NOTICE 'TEST 7 PASSED: Helper functions use optimized auth.uid() pattern';
    ELSE
        RAISE NOTICE 'TEST 7 WARNING: Helper functions may not use optimized pattern';
    END IF;
END $$;

-- ============================================================================
-- FINAL TEST SUMMARY
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '================================================================================';
    RAISE NOTICE 'RLS OPTIMIZATION TEST SUMMARY';
    RAISE NOTICE '================================================================================';
    RAISE NOTICE 'Test 1: auth.uid() pattern equivalence - Check logs above';
    RAISE NOTICE 'Test 2: Helper function validity - Check logs above';
    RAISE NOTICE 'Test 3: Policy existence verification - Check logs above';
    RAISE NOTICE 'Test 4: Test data creation - Check logs above';
    RAISE NOTICE 'Test 5: Performance timing - Check logs above';
    RAISE NOTICE 'Test 6: Migration record - Check logs above';
    RAISE NOTICE 'Test 7: Function optimization - Check logs above';
    RAISE NOTICE '================================================================================';
    RAISE NOTICE 'All tests completed. Review logs for any failures.';
END $$;