
-- ============================================================================
-- ROLE MIGRATION VALIDATION SCRIPT
-- Validates the migration from 13-role to 5-role system
-- ============================================================================

-- Check migration completeness
SELECT 
    'Migration Status Check' as check_type,
    old_role,
    new_role,
    COUNT(*) as migrated_count
FROM role_migration_log
GROUP BY old_role, new_role
ORDER BY old_role;

-- Verify no users left with old roles (except archived subcontractors)
SELECT 
    'Unmigrated Users Check' as check_type,
    role,
    COUNT(*) as count
FROM user_profiles 
WHERE is_active = TRUE 
AND role NOT IN ('management', 'purchase_manager', 'technical_lead', 'project_manager', 'client', 'admin')
GROUP BY role;

-- Check subcontractor conversion
SELECT 
    'Subcontractor Conversion Check' as check_type,
    COUNT(DISTINCT s.id) as entities_created,
    COUNT(DISTINCT sa.id) as assignments_migrated,
    COUNT(DISTINCT up.id) as users_archived
FROM subcontractors s
FULL OUTER JOIN subcontractor_assignments sa ON s.id = sa.subcontractor_id
FULL OUTER JOIN user_profiles up ON up.previous_role = 'subcontractor' AND up.is_active = FALSE;

-- Validate approval limits are set
SELECT 
    'Approval Limits Check' as check_type,
    role,
    seniority_level,
    COUNT(*) as users_with_limits
FROM user_profiles 
WHERE is_active = TRUE 
AND approval_limits IS NOT NULL 
AND approval_limits != '{}'
GROUP BY role, seniority_level;

-- Check for any migration errors
SELECT 
    'Migration Errors Check' as check_type,
    COUNT(*) as users_without_migration_timestamp
FROM user_profiles 
WHERE is_active = TRUE 
AND role_migrated_at IS NULL;

-- Performance validation - check if we achieved role reduction
SELECT 
    'Role Reduction Validation' as check_type,
    'Before: 13 roles, After: ' || COUNT(DISTINCT role) || ' roles' as result
FROM user_profiles 
WHERE is_active = TRUE;

-- Final validation summary
SELECT 
    'MIGRATION VALIDATION COMPLETE' as status,
    CASE 
        WHEN (SELECT COUNT(DISTINCT role) FROM user_profiles WHERE is_active = TRUE) <= 6 
        THEN '✅ SUCCESS: Role reduction achieved'
        ELSE '❌ ISSUE: Too many roles remaining'
    END as result;
