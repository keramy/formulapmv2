# Migration Infrastructure Documentation

This document describes the comprehensive migration infrastructure created for the role system migration.

## Overview

The migration infrastructure provides a complete system for safely migrating from the 13-role system to the 6-role system with full backup, rollback, and validation capabilities.

## Components

### 1. Migration Logging System (`migration-logging-system.sql`)

**Purpose**: Tracks all migration operations for audit and rollback purposes.

**Key Features**:
- Individual user migration logging
- Batch operation tracking
- RLS policy change logging
- Migration status monitoring

**Main Functions**:
- `migration_tracking.start_migration_batch()` - Starts a new migration batch
- `migration_tracking.log_user_migration()` - Logs individual user changes
- `migration_tracking.complete_migration_batch()` - Completes migration batch
- `migration_tracking.get_migration_status()` - Gets migration status summary

### 2. Comprehensive Backup System (`comprehensive-backup-system.sql`)

**Purpose**: Creates complete backups of all user-related data before migration.

**Key Features**:
- Complete user profile backup with metadata
- RLS policy backup
- User session backup
- Backup validation and integrity checks

**Main Functions**:
- `migration_backup.create_comprehensive_backup()` - Creates full backup
- `migration_backup.validate_backup_completeness()` - Validates backup integrity
- `migration_backup.get_backup_summary()` - Shows backup information

### 3. Migration Rollback System (`migration-rollback-system.sql`)

**Purpose**: Provides complete rollback capability to restore previous state.

**Key Features**:
- Full data restoration from backup
- RLS policy restoration
- Rollback validation
- Emergency rollback function

**Main Functions**:
- `migration_backup.execute_rollback()` - Performs complete rollback
- `migration_backup.validate_rollback_success()` - Validates rollback
- `migration_backup.list_available_backups()` - Lists available backups
- `migration_backup.emergency_rollback()` - Emergency rollback function

### 4. Migration Validation Functions (`migration-validation-functions.sql`)

**Purpose**: Comprehensive validation suite for migration process.

**Key Features**:
- Pre-migration state validation
- Post-migration state validation
- Authentication testing
- RLS policy validation
- Role mapping validation

**Main Functions**:
- `migration_validation.validate_pre_migration_state()` - Pre-migration checks
- `migration_validation.validate_post_migration_state()` - Post-migration checks
- `migration_validation.test_user_authentication()` - Tests user authentication
- `migration_validation.validate_rls_policies()` - Validates RLS policies
- `migration_validation.run_comprehensive_validation()` - Runs all validations

### 5. Master Setup Script (`setup-migration-infrastructure.sql`)

**Purpose**: Sets up complete migration infrastructure in correct order.

**Key Features**:
- Creates all necessary schemas
- Loads all components in correct order
- Provides master control functions
- Verifies setup completion

**Main Functions**:
- `migration_control.initialize_migration_infrastructure()` - Tests all components
- `migration_control.prepare_for_migration()` - Prepares for migration
- `migration_control.get_infrastructure_status()` - Shows infrastructure status

## Usage Instructions

### 1. Setup Infrastructure

```bash
# Option 1: Use the JavaScript executor
node scripts/execute-infrastructure-setup.js

# Option 2: Run SQL directly
psql $DATABASE_URL -f scripts/setup-migration-infrastructure.sql
```

### 2. Verify Infrastructure

```sql
-- Check infrastructure status
SELECT * FROM migration_control.get_infrastructure_status();

-- Test all components
SELECT * FROM migration_control.initialize_migration_infrastructure();
```

### 3. Prepare for Migration

```sql
-- Run pre-migration preparation
SELECT * FROM migration_control.prepare_for_migration('role_system_migration');
```

### 4. Monitor Migration Progress

```sql
-- Check migration batch status
SELECT * FROM migration_tracking.get_migration_status('batch_id_here');

-- View backup summary
SELECT * FROM migration_backup.get_backup_summary();

-- Run validation checks
SELECT * FROM migration_validation.run_comprehensive_validation('post_migration');
```

### 5. Rollback if Needed

```sql
-- List available backups
SELECT * FROM migration_backup.list_available_backups();

-- Execute rollback
SELECT * FROM migration_backup.execute_rollback('backup_id_here', 'Rollback reason');

-- Validate rollback success
SELECT * FROM migration_backup.validate_rollback_success('backup_id', 'rollback_id');
```

## Database Schemas Created

- `migration_tracking` - Migration logging and batch tracking
- `migration_backup` - Backup storage and management
- `migration_validation` - Validation functions and results
- `migration_control` - Master control functions

## Tables Created

### migration_tracking schema:
- `migration_log` - Individual user migration records
- `migration_batch` - Migration batch tracking
- `rls_policy_changes` - RLS policy modification log

### migration_backup schema:
- `user_profiles_complete_backup` - Complete user profile backup
- `user_sessions_backup` - User session backup
- `rls_policies_backup` - RLS policy backup
- `backup_log` - Backup operation log

## Safety Features

1. **Transaction Safety**: All operations wrapped in transactions
2. **Backup Validation**: Comprehensive backup integrity checks
3. **Rollback Capability**: Complete restoration from any backup
4. **Error Handling**: Graceful error handling with detailed logging
5. **Validation Suite**: Extensive pre and post-migration validation
6. **Emergency Procedures**: Emergency rollback for critical situations

## Monitoring and Alerts

The system provides comprehensive monitoring through:
- Migration batch status tracking
- Individual user migration logging
- Backup integrity validation
- Authentication testing
- RLS policy validation
- Performance monitoring

## Troubleshooting

### Common Issues

1. **Permission Errors**
   - Ensure database user has CREATE SCHEMA privileges
   - Grant necessary permissions on all schemas

2. **Backup Failures**
   - Check disk space for backup storage
   - Verify user_profiles table accessibility

3. **Rollback Issues**
   - Ensure backup exists and is valid
   - Check for conflicting transactions

4. **Validation Failures**
   - Review validation error messages
   - Check data integrity before migration

### Emergency Procedures

If migration fails critically:

```sql
-- Emergency rollback (use with caution)
SELECT migration_backup.emergency_rollback('last_known_good_backup_id');
```

## Requirements Satisfied

This infrastructure satisfies the following requirements from the spec:

- **3.1**: Seamless migration without user session interruption
- **3.2**: No downtime during migration process
- **5.1**: Comprehensive rollback capabilities
- **5.2**: Complete data restoration capability

## Next Steps

After infrastructure setup:
1. Proceed to task 2: Implement database role migration script
2. Use the validation functions to verify each step
3. Utilize backup and rollback capabilities as needed
4. Monitor migration progress through logging system

## Support

For issues or questions:
1. Check the validation results for specific error messages
2. Review the migration logs for detailed operation history
3. Use the troubleshooting section above
4. Consult the individual SQL file comments for function details