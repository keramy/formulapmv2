-- RLS Policy Testing Script
-- This script tests the migrated RLS policies with sample users from each role

-- ============================================================================
-- TEST DATA SETUP
-- ============================================================================

-- Create test users for each new role (if they don't exist)
INSERT INTO public.user_profiles (id, role, first_name, last_name, email, seniority_level)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'admin', 'Test', 'Admin', 'admin@test.com', 'system'),
    ('22222222-2222-2222-2222-222222222222', 'management', 'Test', 'Manager', 'manager@test.com', 'executive'),
    ('33333333-3333-3333-3333-333333333333', 'technical_lead', 'Test', 'TechLead', 'techlead@test.com', 'senior'),
    ('44444444-4444-4444-4444-444444444444', 'project_manager', 'Test', 'PM', 'pm@test.com', 'regular'),
    ('55555555-5555-5555-5555-555555555555', 'purchase_manager', 'Test', 'Purchaser', 'purchase@test.com', 'regular'),
    ('66666666-6666-6666-6666-666666666666', 'client', 'Test', 'Client', 'client@test.com', 'standard')
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    seniority_level = EXCLUDED.seniority_level;

-- Create test project
INSERT INTO public.projects (id, name, description, project_manager_id, client_id, status)
VALUES (
    '77777777-7777-7777-7777-777777777777',
    'Test Project',
    'Test project for RLS policy validation',
    '44444444-4444-4444-4444-444444444444', -- project_manager
    '66666666-6666-6666-6666-666666666666', -- client
    'active'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    project_manager_id = EXCLUDED.project_manager_id,
    client_id = EXCLUDED.client_id;

-- Create test project assignment
INSERT INTO public.project_assignments (id, project_id, user_id, role, is_active)
VALUES (
    '88888888-8888-8888-8888-888888888888',
    '77777777-7777-7777-7777-777777777777',
    '44444444-4444-4444-4444-444444444444',
    'project_manager',
    true
) ON CONFLICT (id) DO UPDATE SET
    is_active = EXCLUDED.is_active;

-- ============================================================================
-- POLICY TESTING FUNCTIONS
-- ============================================================================

-- Function to test policy access for a specific user
CREATE OR REPLACE FUNCTION test_user_access(test_user_id UUID, test_role TEXT)
RETURNS TABLE (
    test_name TEXT,
    table_name TEXT,
    operation TEXT,
    access_granted BOOLEAN,
    error_message TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rec RECORD;
    test_result BOOLEAN;
    error_msg TEXT;
BEGIN
    -- Set the user context for testing
    PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_id, 'user_role', test_role)::text, true);
    PERFORM set_config('request.jwt.claim.sub', test_user_id::text, true);
    
    -- Test mobile_devices access (admin only)
    BEGIN
        test_result := EXISTS(SELECT 1 FROM public.mobile_devices LIMIT 1);
        RETURN QUERY SELECT 
            format('User %s (%s) mobile_devices access', test_user_id, test_role),
            'mobile_devices'::TEXT,
            'SELECT'::TEXT,
            test_result,
            NULL::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            format('User %s (%s) mobile_devices access', test_user_id, test_role),
            'mobile_devices'::TEXT,
            'SELECT'::TEXT,
            false,
            SQLERRM;
    END;
    
    -- Test subcontractor_users access (admin, project_manager, technical_lead)
    BEGIN
        test_result := EXISTS(SELECT 1 FROM public.subcontractor_users LIMIT 1);
        RETURN QUERY SELECT 
            format('User %s (%s) subcontractor_users access', test_user_id, test_role),
            'subcontractor_users'::TEXT,
            'SELECT'::TEXT,
            test_result,
            NULL::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            format('User %s (%s) subcontractor_users access', test_user_id, test_role),
            'subcontractor_users'::TEXT,
            'SELECT'::TEXT,
            false,
            SQLERRM;
    END;
    
    -- Test suppliers access (management, purchase_manager, project_manager, technical_lead)
    BEGIN
        test_result := EXISTS(SELECT 1 FROM public.suppliers LIMIT 1);
        RETURN QUERY SELECT 
            format('User %s (%s) suppliers access', test_user_id, test_role),
            'suppliers'::TEXT,
            'SELECT'::TEXT,
            test_result,
            NULL::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            format('User %s (%s) suppliers access', test_user_id, test_role),
            'suppliers'::TEXT,
            'SELECT'::TEXT,
            false,
            SQLERRM;
    END;
    
    -- Test documents access
    BEGIN
        test_result := EXISTS(SELECT 1 FROM public.documents WHERE project_id = '77777777-7777-7777-7777-777777777777' LIMIT 1);
        RETURN QUERY SELECT 
            format('User %s (%s) documents access', test_user_id, test_role),
            'documents'::TEXT,
            'SELECT'::TEXT,
            test_result,
            NULL::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            format('User %s (%s) documents access', test_user_id, test_role),
            'documents'::TEXT,
            'SELECT'::TEXT,
            false,
            SQLERRM;
    END;
    
    -- Test purchase_requests access
    BEGIN
        test_result := EXISTS(SELECT 1 FROM public.purchase_requests WHERE project_id = '77777777-7777-7777-7777-777777777777' LIMIT 1);
        RETURN QUERY SELECT 
            format('User %s (%s) purchase_requests access', test_user_id, test_role),
            'purchase_requests'::TEXT,
            'SELECT'::TEXT,
            test_result,
            NULL::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            format('User %s (%s) purchase_requests access', test_user_id, test_role),
            'purchase_requests'::TEXT,
            'SELECT'::TEXT,
            false,
            SQLERRM;
    END;
    
END;
$$;

-- ============================================================================
-- RUN TESTS FOR ALL ROLES
-- ============================================================================

-- Test admin access
SELECT * FROM test_user_access('11111111-1111-1111-1111-111111111111', 'admin');

-- Test management access  
SELECT * FROM test_user_access('22222222-2222-2222-2222-222222222222', 'management');

-- Test technical_lead access
SELECT * FROM test_user_access('33333333-3333-3333-3333-333333333333', 'technical_lead');

-- Test project_manager access
SELECT * FROM test_user_access('44444444-4444-4444-4444-444444444444', 'project_manager');

-- Test purchase_manager access
SELECT * FROM test_user_access('55555555-5555-5555-5555-555555555555', 'purchase_manager');

-- Test client access
SELECT * FROM test_user_access('66666666-6666-6666-6666-666666666666', 'client');

-- ============================================================================
-- PERMISSION ESCALATION TESTS
-- ============================================================================

-- Test that clients cannot access admin functions
CREATE OR REPLACE FUNCTION test_permission_escalation()
RETURNS TABLE (
    test_description TEXT,
    should_fail BOOLEAN,
    actual_result BOOLEAN,
    test_passed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    test_result BOOLEAN;
BEGIN
    -- Set client context
    PERFORM set_config('request.jwt.claims', json_build_object('sub', '66666666-6666-6666-6666-666666666666', 'user_role', 'client')::text, true);
    PERFORM set_config('request.jwt.claim.sub', '66666666-6666-6666-6666-666666666666', true);
    
    -- Test 1: Client should not access mobile_devices
    BEGIN
        test_result := EXISTS(SELECT 1 FROM public.mobile_devices LIMIT 1);
        RETURN QUERY SELECT 
            'Client accessing mobile_devices (should fail)'::TEXT,
            true, -- should fail
            test_result, -- actual result
            NOT test_result; -- test passes if access is denied
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            'Client accessing mobile_devices (should fail)'::TEXT,
            true,
            false, -- access denied (exception thrown)
            true; -- test passed
    END;
    
    -- Test 2: Client should not access subcontractor_users
    BEGIN
        test_result := EXISTS(SELECT 1 FROM public.subcontractor_users LIMIT 1);
        RETURN QUERY SELECT 
            'Client accessing subcontractor_users (should fail)'::TEXT,
            true,
            test_result,
            NOT test_result;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            'Client accessing subcontractor_users (should fail)'::TEXT,
            true,
            false,
            true;
    END;
    
    -- Test 3: Regular project_manager should not access all suppliers
    PERFORM set_config('request.jwt.claims', json_build_object('sub', '44444444-4444-4444-4444-444444444444', 'user_role', 'project_manager')::text, true);
    PERFORM set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444444', true);
    
    BEGIN
        test_result := EXISTS(SELECT 1 FROM public.suppliers LIMIT 1);
        RETURN QUERY SELECT 
            'Project manager accessing suppliers (should succeed)'::TEXT,
            false, -- should succeed
            test_result,
            test_result; -- test passes if access is granted
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 
            'Project manager accessing suppliers (should succeed)'::TEXT,
            false,
            false,
            false; -- test failed - access should be granted
    END;
    
END;
$$;

-- Run permission escalation tests
SELECT * FROM test_permission_escalation();

-- ============================================================================
-- CLEANUP TEST FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS test_user_access(UUID, TEXT);
DROP FUNCTION IF EXISTS test_permission_escalation();

-- Reset session variables
SELECT set_config('request.jwt.claims', NULL, true);
SELECT set_config('request.jwt.claim.sub', NULL, true);