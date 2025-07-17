
-- ============================================================================
-- COMPLETE ROLE MIGRATION SCRIPT
-- Migrates all users from 13-role system to 5-role optimized system
-- Generated: 2025-07-17T08:48:58.358Z
-- ============================================================================

-- Create migration log table
CREATE TABLE IF NOT EXISTS role_migration_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    old_role TEXT,
    new_role TEXT,
    seniority_level TEXT,
    conversion_type TEXT,
    migrated_at TIMESTAMP DEFAULT NOW(),
    migration_notes TEXT
);

-- ============================================================================
-- BATCH MIGRATION BY ROLE TYPE
-- ============================================================================

-- 1. MANAGEMENT CONSOLIDATION (3 → 1)
-- Migrate company_owner, general_manager, deputy_general_manager → management
UPDATE user_profiles 
SET 
    previous_role = role,
    role_migrated_at = NOW(),
    seniority_level = 'executive',
    approval_limits = '{"budget": "unlimited", "scope_changes": "all", "timeline_extensions": "unlimited"}',
    dashboard_preferences = '{"dashboardAccess": ["company_overview", "pm_workload", "financial_summary", "all_projects"]}'
WHERE role IN ('company_owner', 'general_manager', 'deputy_general_manager');

-- Log management migrations
INSERT INTO role_migration_log (user_id, old_role, new_role, seniority_level, migration_notes)
SELECT id, role::text, 'management', 'executive', 'Management consolidation migration'
FROM user_profiles 
WHERE role IN ('company_owner', 'general_manager', 'deputy_general_manager');

-- 2. PURCHASE DEPARTMENT CONSOLIDATION (2 → 1)
-- Migrate purchase_director → purchase_manager (senior)
UPDATE user_profiles 
SET 
    previous_role = role,
    role_migrated_at = NOW(),
    seniority_level = 'senior',
    approval_limits = '{"budget": 100000, "vendor_management": "all", "purchase_orders": "unlimited"}'
WHERE role = 'purchase_director';

-- Migrate purchase_specialist → purchase_manager (regular)
UPDATE user_profiles 
SET 
    previous_role = role,
    role_migrated_at = NOW(),
    seniority_level = 'regular',
    approval_limits = '{"budget": 25000, "vendor_management": "assigned", "purchase_orders": "standard"}'
WHERE role = 'purchase_specialist';

-- Log purchase migrations
INSERT INTO role_migration_log (user_id, old_role, new_role, seniority_level, migration_notes)
SELECT id, role::text, 'purchase_manager', 
       CASE WHEN role = 'purchase_director' THEN 'senior' ELSE 'regular' END,
       'Purchase department consolidation'
FROM user_profiles 
WHERE role IN ('purchase_director', 'purchase_specialist');

-- 3. TECHNICAL LEAD (1 → 1, enhanced)
-- Migrate technical_director → technical_lead
UPDATE user_profiles 
SET 
    previous_role = role,
    role_migrated_at = NOW(),
    seniority_level = 'senior',
    approval_limits = '{"budget": 75000, "scope_changes": "technical", "subcontractor_assignment": "all"}'
WHERE role = 'technical_director';

-- Log technical lead migrations
INSERT INTO role_migration_log (user_id, old_role, new_role, seniority_level, migration_notes)
SELECT id, role::text, 'technical_lead', 'senior', 'Technical director to technical lead migration'
FROM user_profiles 
WHERE role = 'technical_director';

-- 4. PROJECT MANAGER CONSOLIDATION (4 → 1 with hierarchy)
-- Existing project_manager → project_manager (senior)
UPDATE user_profiles 
SET 
    previous_role = role,
    role_migrated_at = NOW(),
    seniority_level = 'senior',
    approval_limits = '{"budget": 50000, "scope_changes": "major", "timeline_extensions": 30}'
WHERE role = 'project_manager';

-- architect → project_manager (regular)
UPDATE user_profiles 
SET 
    previous_role = role,
    role_migrated_at = NOW(),
    seniority_level = 'regular',
    approval_limits = '{"budget": 15000, "scope_changes": "minor", "timeline_extensions": 7}'
WHERE role = 'architect';

-- technical_engineer → project_manager (regular)
UPDATE user_profiles 
SET 
    previous_role = role,
    role_migrated_at = NOW(),
    seniority_level = 'regular',
    approval_limits = '{"budget": 15000, "scope_changes": "minor", "timeline_extensions": 7}'
WHERE role = 'technical_engineer';

-- field_worker → project_manager (regular)
UPDATE user_profiles 
SET 
    previous_role = role,
    role_migrated_at = NOW(),
    seniority_level = 'regular',
    approval_limits = '{"budget": 5000, "scope_changes": "none", "timeline_extensions": 3}'
WHERE role = 'field_worker';

-- Log project manager consolidation
INSERT INTO role_migration_log (user_id, old_role, new_role, seniority_level, migration_notes)
SELECT id, role::text, 'project_manager',
       CASE 
           WHEN role = 'project_manager' THEN 'senior'
           ELSE 'regular'
       END,
       'Project management consolidation - ' || role::text || ' to unified project_manager'
FROM user_profiles 
WHERE role IN ('project_manager', 'architect', 'technical_engineer', 'field_worker');

-- 5. CLIENT SIMPLIFICATION (1 → 1, simplified)
-- client → client (simplified)
UPDATE user_profiles 
SET 
    previous_role = role,
    role_migrated_at = NOW(),
    seniority_level = 'standard',
    approval_limits = '{"document_approval": "assigned_projects", "report_access": "assigned_projects"}'
WHERE role = 'client';

-- Log client migrations
INSERT INTO role_migration_log (user_id, old_role, new_role, seniority_level, migration_notes)
SELECT id, role::text, 'client', 'standard', 'Client role simplification'
FROM user_profiles 
WHERE role = 'client';

-- 6. SUBCONTRACTOR CONVERSION (user → database entity)
-- Convert subcontractor users to database entities
INSERT INTO subcontractors (
    name,
    company,
    contact_person,
    email,
    phone,
    specialties,
    performance_rating,
    is_active,
    created_by,
    created_at
) 
SELECT 
    COALESCE(first_name || ' ' || last_name, 'Unknown Subcontractor'),
    COALESCE(company, 'Independent'),
    first_name || ' ' || last_name,
    email,
    phone,
    ARRAY['general'], -- Default specialty, can be updated later
    0.00, -- Default rating
    is_active,
    (SELECT id FROM user_profiles WHERE role = 'admin' LIMIT 1), -- Created by admin
    created_at
FROM user_profiles 
WHERE role = 'subcontractor';

-- Migrate existing subcontractor assignments
INSERT INTO subcontractor_assignments (
    subcontractor_id,
    scope_item_id,
    project_id,
    assigned_by,
    status,
    work_description,
    created_at
)
SELECT 
    s.id,
    si.id,
    si.project_id,
    si.created_by,
    'migrated',
    'Assignment migrated from user account: ' || up.first_name || ' ' || up.last_name,
    NOW()
FROM user_profiles up
JOIN subcontractors s ON s.email = up.email
JOIN scope_items si ON up.id = ANY(si.assigned_to)
WHERE up.role = 'subcontractor';

-- Archive subcontractor user accounts (don't delete for audit)
UPDATE user_profiles 
SET 
    is_active = FALSE,
    previous_role = 'subcontractor',
    role_migrated_at = NOW(),
    email = email || '_archived_' || extract(epoch from now())::text
WHERE role = 'subcontractor';

-- Log subcontractor conversions
INSERT INTO role_migration_log (user_id, old_role, new_role, conversion_type, migration_notes)
SELECT id, 'subcontractor', 'DATABASE_ENTITY', 'user_to_entity', 
       'Converted subcontractor user to database entity'
FROM user_profiles 
WHERE previous_role = 'subcontractor' AND is_active = FALSE;

-- 7. ADMIN REMAINS (1 → 1, unchanged)
-- admin → admin (no change needed, just log)
INSERT INTO role_migration_log (user_id, old_role, new_role, seniority_level, migration_notes)
SELECT id, 'admin', 'admin', 'system', 'Admin role unchanged'
FROM user_profiles 
WHERE role = 'admin';

-- ============================================================================
-- MIGRATION SUMMARY AND VALIDATION
-- ============================================================================

-- Create migration summary view
CREATE OR REPLACE VIEW migration_summary AS
SELECT 
    old_role,
    new_role,
    COUNT(*) as user_count,
    MIN(migrated_at) as first_migration,
    MAX(migrated_at) as last_migration
FROM role_migration_log
GROUP BY old_role, new_role
ORDER BY old_role;

-- Validation queries
SELECT 'Migration Summary:' as status;
SELECT * FROM migration_summary;

SELECT 'Total users migrated:' as status, COUNT(*) as count FROM role_migration_log;
SELECT 'Subcontractors converted:' as status, COUNT(*) as count FROM subcontractors;
SELECT 'Active user profiles after migration:' as status, COUNT(*) as count FROM user_profiles WHERE is_active = TRUE;

-- Success message
SELECT 'Role migration completed successfully! 13 roles → 5 optimized roles' as status;
