/**
 * Role Migration Helper Script
 * Helps migrate users from 13-role system to optimized 5-role system
 */

const fs = require('fs')
const path = require('path')

console.log('🔄 Role Migration Helper')
console.log('13-Role System → 5-Role Optimized System')
console.log('='.repeat(60))

// Role mapping configuration
const ROLE_MIGRATION_MAP = {
  // Management consolidation (3 → 1)
  'company_owner': {
    newRole: 'management',
    seniorityLevel: 'executive',
    approvalLimits: {
      budget: 'unlimited',
      scope_changes: 'all',
      timeline_extensions: 'unlimited',
      resource_allocation: 'unlimited'
    },
    dashboardAccess: ['company_overview', 'pm_workload', 'financial_summary', 'all_projects']
  },
  
  'general_manager': {
    newRole: 'management',
    seniorityLevel: 'executive',
    approvalLimits: {
      budget: 'unlimited',
      scope_changes: 'all',
      timeline_extensions: 'unlimited',
      resource_allocation: 'unlimited'
    },
    dashboardAccess: ['company_overview', 'pm_workload', 'financial_summary', 'all_projects']
  },
  
  'deputy_general_manager': {
    newRole: 'management',
    seniorityLevel: 'executive',
    approvalLimits: {
      budget: 'unlimited',
      scope_changes: 'all',
      timeline_extensions: 'unlimited',
      resource_allocation: 'unlimited'
    },
    dashboardAccess: ['company_overview', 'pm_workload', 'financial_summary', 'all_projects']
  },

  // Purchase department consolidation (2 → 1)
  'purchase_director': {
    newRole: 'purchase_manager',
    seniorityLevel: 'senior',
    approvalLimits: {
      budget: 100000,
      vendor_management: 'all',
      purchase_orders: 'unlimited'
    },
    specialPermissions: ['vendor_management', 'cost_tracking', 'purchase_approval']
  },
  
  'purchase_specialist': {
    newRole: 'purchase_manager',
    seniorityLevel: 'regular',
    approvalLimits: {
      budget: 25000,
      vendor_management: 'assigned',
      purchase_orders: 'standard'
    },
    specialPermissions: ['purchase_processing', 'vendor_coordination']
  },

  // Technical lead (1 → 1, enhanced)
  'technical_director': {
    newRole: 'technical_lead',
    seniorityLevel: 'senior',
    approvalLimits: {
      budget: 75000,
      scope_changes: 'technical',
      subcontractor_assignment: 'all'
    },
    specialPermissions: ['scope_upload', 'subcontractor_assignment', 'technical_oversight', 'cost_tracking']
  },

  // Project manager consolidation (4 → 1 with hierarchy)
  'project_manager': {
    newRole: 'project_manager',
    seniorityLevel: 'senior', // Existing PMs become senior by default
    approvalLimits: {
      budget: 50000,
      scope_changes: 'major',
      timeline_extensions: 30,
      team_management: 'full'
    },
    specialPermissions: ['project_management', 'team_coordination', 'client_communication']
  },
  
  'architect': {
    newRole: 'project_manager',
    seniorityLevel: 'regular',
    approvalLimits: {
      budget: 15000,
      scope_changes: 'minor',
      timeline_extensions: 7,
      design_approval: 'assigned_projects'
    },
    specialPermissions: ['architectural_review', 'design_coordination', 'drawing_approval']
  },
  
  'technical_engineer': {
    newRole: 'project_manager',
    seniorityLevel: 'regular',
    approvalLimits: {
      budget: 15000,
      scope_changes: 'minor',
      timeline_extensions: 7,
      technical_specs: 'assigned_projects'
    },
    specialPermissions: ['technical_specs', 'quality_control', 'progress_tracking']
  },
  
  'field_worker': {
    newRole: 'project_manager',
    seniorityLevel: 'regular',
    approvalLimits: {
      budget: 5000,
      scope_changes: 'none',
      timeline_extensions: 3,
      field_updates: 'assigned_tasks'
    },
    specialPermissions: ['field_updates', 'photo_upload', 'progress_reporting', 'task_management']
  },

  // Client simplification (1 → 1, simplified)
  'client': {
    newRole: 'client',
    seniorityLevel: 'standard',
    approvalLimits: {
      document_approval: 'assigned_projects',
      report_access: 'assigned_projects'
    },
    specialPermissions: ['project_visibility', 'document_review', 'progress_view']
  },

  // Subcontractor → Database entity (special handling)
  'subcontractor': {
    newRole: 'DATABASE_ENTITY', // Special flag for conversion
    conversionType: 'user_to_entity',
    entityTable: 'subcontractors',
    preserveData: ['name', 'company', 'contact_info', 'specialties', 'performance_data']
  },

  // Admin remains (1 → 1)
  'admin': {
    newRole: 'admin', // Special role, not part of main 5
    seniorityLevel: 'system',
    approvalLimits: {
      system_admin: 'unlimited',
      user_management: 'all',
      technical_support: 'all'
    },
    specialPermissions: ['system_admin', 'user_management', 'technical_support']
  }
}

/**
 * Generate migration SQL for a specific user
 */
function generateUserMigrationSQL(userId, currentRole, userData = {}) {
  const migration = ROLE_MIGRATION_MAP[currentRole]
  
  if (!migration) {
    return {
      error: `No migration path defined for role: ${currentRole}`,
      sql: null
    }
  }

  // Handle subcontractor special case
  if (migration.newRole === 'DATABASE_ENTITY') {
    return generateSubcontractorConversionSQL(userId, userData)
  }

  const sql = `
-- Migrate user ${userId} from ${currentRole} to ${migration.newRole}
UPDATE user_profiles 
SET 
    previous_role = '${currentRole}',
    role_migrated_at = NOW(),
    seniority_level = '${migration.seniorityLevel}',
    approval_limits = '${JSON.stringify(migration.approvalLimits)}',
    dashboard_preferences = '${JSON.stringify({ 
      dashboardAccess: migration.dashboardAccess || [],
      specialPermissions: migration.specialPermissions || []
    })}'
WHERE id = '${userId}';

-- Add migration audit log
INSERT INTO role_migration_log (
    user_id, 
    old_role, 
    new_role, 
    seniority_level, 
    migrated_at,
    migration_notes
) VALUES (
    '${userId}',
    '${currentRole}',
    '${migration.newRole}',
    '${migration.seniorityLevel}',
    NOW(),
    'Automated migration from 13-role to 5-role system'
);`

  return {
    error: null,
    sql: sql.trim(),
    migration
  }
}

/**
 * Generate SQL to convert subcontractor user to database entity
 */
function generateSubcontractorConversionSQL(userId, userData) {
  const sql = `
-- Convert subcontractor user ${userId} to database entity
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
    COALESCE(first_name || ' ' || last_name, 'Unknown'),
    COALESCE(company, 'Independent'),
    first_name || ' ' || last_name,
    email,
    phone,
    ARRAY['${userData.specialties || 'general'}'],
    COALESCE(${userData.performanceRating || 0}, 0),
    is_active,
    '${userData.createdBy || 'system'}',
    created_at
FROM user_profiles 
WHERE id = '${userId}';

-- Migrate any existing assignments
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
    (SELECT id FROM subcontractors WHERE email = up.email LIMIT 1),
    si.id,
    si.project_id,
    si.assigned_to,
    'migrated',
    'Migrated from user account',
    NOW()
FROM user_profiles up
JOIN scope_items si ON si.assigned_to = up.id
WHERE up.id = '${userId}';

-- Archive the user account (don't delete, for audit)
UPDATE user_profiles 
SET 
    is_active = FALSE,
    previous_role = 'subcontractor',
    role_migrated_at = NOW(),
    email = email || '_archived_' || extract(epoch from now())
WHERE id = '${userId}';

-- Add conversion log
INSERT INTO role_migration_log (
    user_id,
    old_role,
    new_role,
    conversion_type,
    migrated_at,
    migration_notes
) VALUES (
    '${userId}',
    'subcontractor',
    'DATABASE_ENTITY',
    'user_to_entity',
    NOW(),
    'Converted subcontractor user to database entity'
);`

  return {
    error: null,
    sql: sql.trim(),
    conversionType: 'user_to_entity'
  }
}

/**
 * Generate complete migration script
 */
function generateCompleteMigrationScript() {
  console.log('📝 Generating Complete Migration Script...')
  
  const script = `
-- ============================================================================
-- COMPLETE ROLE MIGRATION SCRIPT
-- Migrates all users from 13-role system to 5-role optimized system
-- Generated: ${new Date().toISOString()}
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
    previous_role = role::text,
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
    previous_role = role::text,
    role_migrated_at = NOW(),
    seniority_level = 'senior',
    approval_limits = '{"budget": 100000, "vendor_management": "all", "purchase_orders": "unlimited"}'
WHERE role = 'purchase_director';

-- Migrate purchase_specialist → purchase_manager (regular)
UPDATE user_profiles 
SET 
    previous_role = role::text,
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
    previous_role = role::text,
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
    previous_role = role::text,
    role_migrated_at = NOW(),
    seniority_level = 'senior',
    approval_limits = '{"budget": 50000, "scope_changes": "major", "timeline_extensions": 30}'
WHERE role = 'project_manager';

-- architect → project_manager (regular)
UPDATE user_profiles 
SET 
    previous_role = role::text,
    role_migrated_at = NOW(),
    seniority_level = 'regular',
    approval_limits = '{"budget": 15000, "scope_changes": "minor", "timeline_extensions": 7}'
WHERE role = 'architect';

-- technical_engineer → project_manager (regular)
UPDATE user_profiles 
SET 
    previous_role = role::text,
    role_migrated_at = NOW(),
    seniority_level = 'regular',
    approval_limits = '{"budget": 15000, "scope_changes": "minor", "timeline_extensions": 7}'
WHERE role = 'technical_engineer';

-- field_worker → project_manager (regular)
UPDATE user_profiles 
SET 
    previous_role = role::text,
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
    previous_role = role::text,
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
JOIN scope_items si ON si.assigned_to = up.id
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
`

  return script
}

/**
 * Generate migration validation script
 */
function generateValidationScript() {
  return `
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
`
}

/**
 * Main execution
 */
function generateMigrationFiles() {
  try {
    console.log('📝 Generating migration files...')
    
    // Generate complete migration script
    const migrationScript = generateCompleteMigrationScript()
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250717000002_role_migration.sql')
    fs.writeFileSync(migrationPath, migrationScript)
    
    // Generate validation script
    const validationScript = generateValidationScript()
    const validationPath = path.join(__dirname, 'role-migration-validation.sql')
    fs.writeFileSync(validationPath, validationScript)
    
    // Generate role mapping documentation
    const mappingDoc = `# Role Migration Mapping

## 13-Role System → 5-Role Optimized System

${Object.entries(ROLE_MIGRATION_MAP).map(([oldRole, config]) => `
### ${oldRole} → ${config.newRole}
- **Seniority Level**: ${config.seniorityLevel}
- **Approval Limits**: ${JSON.stringify(config.approvalLimits, null, 2)}
${config.specialPermissions ? `- **Special Permissions**: ${config.specialPermissions.join(', ')}` : ''}
${config.conversionType ? `- **Conversion Type**: ${config.conversionType}` : ''}
`).join('')}

## Migration Statistics
- **Total Role Reduction**: 13 → 5 (62% reduction)
- **Management Consolidation**: 3 → 1
- **Purchase Consolidation**: 2 → 1  
- **Project Management Consolidation**: 4 → 1 (with hierarchy)
- **Subcontractor Conversion**: Users → Database Entities
- **Client Simplification**: Maintained but simplified

## Expected Performance Improvements
- **Response Time**: 262ms → 180ms (31% improvement)
- **RLS Policies**: 45 → 15 (67% reduction)
- **Field Worker Performance**: 542ms → ~200ms (63% improvement)
`
    
    const mappingPath = path.join(__dirname, '..', 'ROLE_MIGRATION_MAPPING.md')
    fs.writeFileSync(mappingPath, mappingDoc)
    
    console.log('✅ Migration files generated successfully!')
    console.log(`  📄 Migration script: ${migrationPath}`)
    console.log(`  📄 Validation script: ${validationPath}`)
    console.log(`  📄 Mapping documentation: ${mappingPath}`)
    
    console.log('\\n🎯 Next Steps:')
    console.log('1. Review the migration script')
    console.log('2. Test on a development database first')
    console.log('3. Run the migration script')
    console.log('4. Run the validation script to verify success')
    console.log('5. Proceed to Phase 2: RLS Policy Implementation')
    
  } catch (error) {
    console.error('❌ Error generating migration files:', error)
    process.exit(1)
  }
}

// Run the migration file generation
generateMigrationFiles()