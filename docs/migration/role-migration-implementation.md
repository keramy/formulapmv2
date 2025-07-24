# Role Migration Implementation - Task 2

## Overview

This document describes the implementation of Task 2 from the role system migration spec: "Implement database role migration script". The implementation includes a comprehensive SQL script that migrates the `user_profiles.role` column from the 13-role system (`user_role_old`) to the 6-role system (`user_role`).

## Files Created

### 1. `scripts/role-migration-script.sql`
The main migration script that performs the role system migration.

**Key Features:**
- Pre-migration validation checks
- Comprehensive backup creation
- Role mapping logic using CASE statements
- Seniority level assignment based on original roles
- Audit trail preservation in `previous_role` column
- Post-migration validation
- Transaction safety with rollback capability

### 2. `scripts/test-role-migration.sql`
A comprehensive test script that validates the migration logic on test data.

**Key Features:**
- Creates isolated test environment
- Tests all 13 role mappings
- Validates seniority level assignments
- Performs actual migration on test data
- Comprehensive result validation

## Role Mapping Logic

The migration implements the following role mappings as specified in the design document:

| Old Role (user_role_old) | New Role (user_role) | Seniority Level |
|---------------------------|---------------------|-----------------|
| company_owner | management | executive |
| general_manager | management | executive |
| deputy_general_manager | management | senior |
| technical_director | technical_lead | senior |
| architect | project_manager | senior |
| technical_engineer | project_manager | regular |
| field_worker | project_manager | regular |
| purchase_director | purchase_manager | senior |
| purchase_specialist | purchase_manager | regular |
| project_manager | project_manager | regular |
| client | client | standard |
| admin | admin | system |
| subcontractor | project_manager | regular |

## Migration Process

### Phase 1: Pre-Migration Validation
1. Validates user count and current role distribution
2. Checks that required enum types exist
3. Verifies required columns exist (`seniority_level`, `previous_role`)
4. Displays current system state

### Phase 2: Backup Creation
1. Creates `migration_backup.role_migration_backup` table
2. Backs up complete user_profiles data with timestamp
3. Verifies backup integrity

### Phase 3: Migration Execution
1. **Step 1**: Store original roles in `previous_role` column for audit trail
2. **Step 2**: Update `seniority_level` based on original roles using CASE logic
3. **Step 3**: Migrate `role` column from `user_role_old` to `user_role` using CASE mapping
4. **Step 4**: Update `updated_at` timestamps

### Phase 4: Post-Migration Validation
1. Validates total user count unchanged
2. Displays new role and seniority distributions
3. Checks for missing audit trail data
4. Validates all roles are valid `user_role` values
5. Reports validation results

### Phase 5: Summary and Cleanup
1. Generates comprehensive migration summary
2. Logs completion to migration tracking system
3. Provides next steps guidance

## Safety Features

### Transaction Safety
- All migration steps wrapped in single transaction
- Automatic rollback on any failure
- Comprehensive error handling

### Backup and Rollback
- Complete backup before migration
- Original roles preserved in `previous_role` column
- Migration timestamp in `role_migrated_at` column
- Rollback capability via backup table

### Validation
- Pre-migration state validation
- Post-migration integrity checks
- Test script for validation before production use

## Usage Instructions

### 1. Test the Migration
```sql
-- Run the test script first
\i scripts/test-role-migration.sql
```

### 2. Execute the Migration
```sql
-- Run the actual migration
\i scripts/role-migration-script.sql
```

### 3. Verify Results
```sql
-- Check migration results
SELECT 
    role::TEXT as new_role,
    previous_role::TEXT as old_role,
    seniority_level,
    COUNT(*) as user_count
FROM user_profiles 
GROUP BY role, previous_role, seniority_level
ORDER BY user_count DESC;
```

## Requirements Compliance

This implementation satisfies all requirements from Task 2:

✅ **Create SQL script to migrate user_profiles.role from user_role_old to user_role**
- Complete migration script with ALTER TABLE and CASE logic

✅ **Implement role mapping logic using CASE statements**
- Comprehensive CASE statements for both role and seniority mapping

✅ **Add seniority_level assignment based on original roles**
- Seniority levels assigned according to design specification

✅ **Store original role in previous_role column for audit trail**
- Original roles preserved before migration

✅ **Test migration script on backup database**
- Comprehensive test script with isolated test environment

## Related Requirements

This implementation addresses the following requirements from the spec:

- **Requirement 1.1**: Migration from 13-role to 6-role system
- **Requirement 1.2**: Proper role mapping without data loss
- **Requirement 1.4**: Audit trail preservation
- **Requirement 4.1**: Seniority-based approval system foundation

## Next Steps

After successful migration:

1. **Update RLS Policies** (Task 3): Modify all RLS policies to use new role system
2. **Test Authentication**: Verify users can authenticate with new roles
3. **Application Testing**: Ensure frontend components work with new role system
4. **Performance Monitoring**: Monitor system performance post-migration

## Rollback Procedure

If issues occur after migration:

```sql
-- Restore from backup
BEGIN;

-- Restore original data
TRUNCATE user_profiles;
INSERT INTO user_profiles 
SELECT 
    id, role, first_name, last_name, email, phone, company, 
    department, hire_date, is_active, permissions, created_at, 
    updated_at, 'regular', approval_limits, dashboard_preferences,
    NULL, NULL
FROM migration_backup.role_migration_backup;

-- Restore role column type
ALTER TABLE user_profiles ALTER COLUMN role TYPE user_role_old 
USING role::TEXT::user_role_old;

COMMIT;
```

## Monitoring and Validation

Post-migration monitoring should include:

1. **Authentication Success Rate**: Monitor login success rates
2. **Permission Errors**: Watch for role-based permission failures
3. **Application Functionality**: Test all major workflows
4. **Performance Impact**: Monitor query performance with new role system

## Support and Troubleshooting

Common issues and solutions:

1. **Migration Fails**: Check pre-migration validation errors
2. **Authentication Issues**: Verify JWT token role claims updated
3. **Permission Errors**: Check RLS policies updated for new roles
4. **Performance Issues**: Monitor index usage on role column

For additional support, refer to the migration tracking logs and backup data preserved during the migration process.