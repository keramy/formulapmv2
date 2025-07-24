-- RLS Migration Validation Script
-- This script validates that the RLS policy migration maintains proper security boundaries

-- ============================================================================
-- VALIDATION QUERIES
-- ============================================================================

-- 1. Verify no policies reference user_role_old
SELECT 
    'CRITICAL: Policies still reference user_role_old' as issue_type,
    schemaname,
    tablename,
    policyname,
    CASE 
        WHEN qual LIKE '%user_role_old%' THEN 'qual'
        WHEN with_check LIKE '%user_role_old%' THEN 'with_check'
    END as reference_location
FROM pg_policies 
WHERE qual LIKE '%user_role_old%' 
   OR with_check LIKE '%user_role_old%'
ORDER BY schemaname, tablename, policyname;

-- 2. Verify all expected new policies exist
WITH expected_policies AS (
    SELECT unnest(ARRAY[
        'mobile_devices.Admin manage all devices',
        'subcontractor_users.Admins can insert subcontractor profiles',
        'subcontractor_users.Admins can update subcontractor profiles', 
        'subcontractor_users.Internal users can view subcontractor profiles',
        'delivery_confirmations.Field worker delivery confirmation',
        'purchase_requests.Field worker purchase request read',
        'vendor_ratings.Project manager vendor rating access',
        'subcontractor_scope_access.Project managers can manage scope access',
        'suppliers.Project managers can manage suppliers',
        'subcontractor_reports.Project managers can view project reports',
        'documents.Field worker document create',
        'documents.Field worker own documents',
        'suppliers.Management supplier access',
        'suppliers.Project team supplier read',
        'documents.Subcontractor document access'
    ]) as expected_policy
),
actual_policies AS (
    SELECT tablename || '.' || policyname as actual_policy
    FROM pg_policies 
    WHERE schemaname = 'public'
)
SELECT 
    'Missing expected policy' as issue_type,
    ep.expected_policy,
    CASE WHEN ap.actual_policy IS NULL THEN 'MISSING' ELSE 'EXISTS' END as status
FROM expected_policies ep
LEFT JOIN actual_policies ap ON ep.expected_policy = ap.actual_policy
WHERE ap.actual_policy IS NULL;

-- 3. Check for policies with syntax errors or invalid role references
SELECT 
    'Policy syntax validation' as check_type,
    schemaname,
    tablename, 
    policyname,
    CASE 
        WHEN qual LIKE '%user_role::%' AND qual NOT LIKE '%user_role_old%' THEN 'Valid new role reference'
        WHEN qual LIKE '%user_role%' AND qual NOT LIKE '%user_role::%' AND qual NOT LIKE '%user_role_old%' THEN 'Potential JWT role reference'
        WHEN qual LIKE '%ARRAY[%user_role%' THEN 'Array role reference'
        ELSE 'Other'
    END as reference_type
FROM pg_policies 
WHERE schemaname = 'public'
  AND (qual LIKE '%user_role%' OR with_check LIKE '%user_role%')
  AND qual NOT LIKE '%user_role_old%'
  AND with_check NOT LIKE '%user_role_old%'
ORDER BY tablename, policyname;

-- 4. Validate helper functions are updated
SELECT 
    'Helper function validation' as check_type,
    routine_name,
    CASE 
        WHEN routine_definition LIKE '%user_role_old%' THEN 'CRITICAL: Still references user_role_old'
        WHEN routine_definition LIKE '%management%' AND routine_definition LIKE '%user_role%' THEN 'Updated to new roles'
        WHEN routine_definition LIKE '%project_manager%' AND routine_definition LIKE '%user_role%' THEN 'Updated to new roles'
        WHEN routine_definition LIKE '%purchase_manager%' AND routine_definition LIKE '%user_role%' THEN 'Updated to new roles'
        ELSE 'Needs review'
    END as status
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND (
    routine_name LIKE '%management%' 
    OR routine_name LIKE '%project%'
    OR routine_name LIKE '%purchase%'
    OR routine_name LIKE '%role%'
  )
ORDER BY routine_name;

-- 5. Role mapping validation - ensure all old roles can be mapped
WITH role_mapping AS (
    SELECT unnest(ARRAY[
        'company_owner', 'general_manager', 'deputy_general_manager',
        'technical_director', 'architect', 'technical_engineer', 
        'field_worker', 'purchase_director', 'purchase_specialist',
        'project_manager', 'subcontractor', 'client', 'admin'
    ]) as old_role,
    unnest(ARRAY[
        'management', 'management', 'management',
        'technical_lead', 'project_manager', 'project_manager',
        'project_manager', 'purchase_manager', 'purchase_manager', 
        'project_manager', 'project_manager', 'client', 'admin'
    ]) as new_role
)
SELECT 
    'Role mapping validation' as check_type,
    old_role,
    new_role,
    CASE 
        WHEN new_role IN ('admin', 'management', 'technical_lead', 'project_manager', 'purchase_manager', 'client') 
        THEN 'Valid mapping'
        ELSE 'Invalid mapping'
    END as validation_status
FROM role_mapping
ORDER BY old_role;

-- 6. Security boundary validation
SELECT 
    'Security boundary check' as check_type,
    'Admin role isolation' as boundary_type,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) > 0 THEN 'Admin policies exist'
        ELSE 'WARNING: No admin-specific policies found'
    END as status
FROM pg_policies 
WHERE schemaname = 'public'
  AND (qual LIKE '%admin%' OR with_check LIKE '%admin%')
  AND (qual LIKE '%user_role%' OR with_check LIKE '%user_role%');

-- 7. Client access restriction validation  
SELECT 
    'Client access restriction' as check_type,
    tablename,
    policyname,
    CASE 
        WHEN qual LIKE '%client%' AND qual LIKE '%project%' THEN 'Proper client project restriction'
        WHEN qual LIKE '%client%' THEN 'Client access policy'
        ELSE 'Non-client policy'
    END as access_type
FROM pg_policies 
WHERE schemaname = 'public'
  AND (qual LIKE '%client%' OR with_check LIKE '%client%')
ORDER BY tablename, policyname;

-- 8. Management role consolidation check
SELECT 
    'Management role consolidation' as check_type,
    COUNT(*) as policies_with_management,
    'Policies should use management role instead of individual executive roles' as note
FROM pg_policies 
WHERE schemaname = 'public'
  AND (qual LIKE '%management%' OR with_check LIKE '%management%');

-- ============================================================================
-- SUMMARY REPORT
-- ============================================================================

SELECT 
    '=== RLS MIGRATION VALIDATION SUMMARY ===' as report_section,
    '' as details;

SELECT 
    'Total policies in public schema' as metric,
    COUNT(*)::text as value
FROM pg_policies 
WHERE schemaname = 'public';

SELECT 
    'Policies referencing user_role (new)' as metric,
    COUNT(*)::text as value  
FROM pg_policies 
WHERE schemaname = 'public'
  AND (qual LIKE '%user_role%' OR with_check LIKE '%user_role%')
  AND qual NOT LIKE '%user_role_old%'
  AND with_check NOT LIKE '%user_role_old%';

SELECT 
    'Policies still referencing user_role_old' as metric,
    COUNT(*)::text as value
FROM pg_policies 
WHERE schemaname = 'public'
  AND (qual LIKE '%user_role_old%' OR with_check LIKE '%user_role_old%');

SELECT 
    'Helper functions updated' as metric,
    COUNT(*)::text as value
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND routine_definition LIKE '%user_role%'
  AND routine_definition NOT LIKE '%user_role_old%';

-- Final validation message
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public'
            AND (qual LIKE '%user_role_old%' OR with_check LIKE '%user_role_old%')
        ) THEN 'MIGRATION INCOMPLETE: Some policies still reference user_role_old'
        ELSE 'MIGRATION COMPLETE: All policies updated to new role system'
    END as migration_status;