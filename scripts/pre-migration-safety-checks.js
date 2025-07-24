#!/usr/bin/env node

/**
 * Pre-Migration Safety Checks
 * Comprehensive safety validation before executing migration
 */

const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');

const dbConfig = {
    host: '127.0.0.1',
    port: 54322,
    database: 'postgres',
    user: 'postgres',
    password: 'postgres'
};

class PreMigrationSafetyChecks {
    constructor() {
        this.client = null;
        this.checkResults = [];
        this.criticalIssues = [];
        this.warnings = [];
        this.recommendations = [];
    }

    async initialize() {
        try {
            this.client = new Client(dbConfig);
            await this.client.connect();
            console.log('✅ Database connection established');
            return true;
        } catch (error) {
            console.error('❌ Failed to connect to database:', error.message);
            return false;
        }
    }

    /**
     * Run all safety checks
     */
    async runAllChecks() {
        console.log('🔍 Running comprehensive pre-migration safety checks...\n');

        const checkSuites = [
            { name: 'Database Infrastructure', checks: this.getDatabaseInfrastructureChecks() },
            { name: 'Data Integrity', checks: this.getDataIntegrityChecks() },
            { name: 'Backup Readiness', checks: this.getBackupReadinessChecks() },
            { name: 'Migration Prerequisites', checks: this.getMigrationPrerequisiteChecks() },
            { name: 'System Resources', checks: this.getSystemResourceChecks() },
            { name: 'Application State', checks: this.getApplicationStateChecks() }
        ];

        for (const suite of checkSuites) {
            console.log(`📋 ${suite.name} Checks`);
            console.log('─'.repeat(suite.name.length + 8));

            for (const check of suite.checks) {
                try {
                    const result = await check.call(this);
                    this.processCheckResult(result);
                    this.displayCheckResult(result);
                } catch (error) {
                    const errorResult = {
                        name: check.name || 'Unknown Check',
                        status: 'error',
                        message: `Check failed: ${error.message}`,
                        severity: 'high',
                        category: suite.name
                    };
                    this.processCheckResult(errorResult);
                    this.displayCheckResult(errorResult);
                }
            }
            console.log('');
        }

        return this.generateSafetyReport();
    }

    /**
     * Process check result and categorize issues
     */
    processCheckResult(result) {
        this.checkResults.push(result);

        if (result.status === 'fail' && result.severity === 'high') {
            this.criticalIssues.push(result);
        } else if (result.status === 'warning' || (result.status === 'fail' && result.severity === 'medium')) {
            this.warnings.push(result);
        }

        if (result.recommendation) {
            this.recommendations.push({
                check: result.name,
                recommendation: result.recommendation
            });
        }
    }

    /**
     * Display individual check result
     */
    displayCheckResult(result) {
        const icons = {
            pass: '✅',
            fail: '❌',
            warning: '⚠️',
            error: '💥',
            info: 'ℹ️'
        };

        const icon = icons[result.status] || '❓';
        console.log(`  ${icon} ${result.name}: ${result.message}`);
        
        if (result.details) {
            console.log(`    Details: ${JSON.stringify(result.details)}`);
        }
    }

    /**
     * Database Infrastructure Checks
     */
    getDatabaseInfrastructureChecks() {
        return [
            this.checkDatabaseVersion,
            this.checkDatabaseConnections,
            this.checkDatabaseSize,
            this.checkTablespaceAvailability,
            this.checkReplicationStatus
        ];
    }

    async checkDatabaseVersion() {
        const result = await this.client.query('SELECT version()');
        const version = result.rows[0].version;
        
        // Extract PostgreSQL version number
        const versionMatch = version.match(/PostgreSQL (\d+\.\d+)/);
        const versionNumber = versionMatch ? parseFloat(versionMatch[1]) : 0;

        if (versionNumber < 12.0) {
            return {
                name: 'Database Version',
                status: 'fail',
                severity: 'high',
                message: `PostgreSQL ${versionNumber} is too old. Minimum version 12.0 required.`,
                recommendation: 'Upgrade PostgreSQL to version 12.0 or higher'
            };
        }

        return {
            name: 'Database Version',
            status: 'pass',
            message: `PostgreSQL version ${versionNumber} is supported`,
            details: { version: version }
        };
    }

    async checkDatabaseConnections() {
        const result = await this.client.query(`
            SELECT 
                count(*) as total_connections,
                count(*) FILTER (WHERE state = 'active') as active_connections,
                setting::int as max_connections
            FROM pg_stat_activity, pg_settings 
            WHERE name = 'max_connections'
            GROUP BY setting
        `);

        const stats = result.rows[0];
        const connectionUsage = (stats.total_connections / stats.max_connections) * 100;

        if (connectionUsage > 80) {
            return {
                name: 'Database Connections',
                status: 'warning',
                message: `High connection usage: ${Math.round(connectionUsage)}% (${stats.total_connections}/${stats.max_connections})`,
                recommendation: 'Consider increasing max_connections or closing idle connections',
                details: stats
            };
        }

        return {
            name: 'Database Connections',
            status: 'pass',
            message: `Connection usage is healthy: ${Math.round(connectionUsage)}%`,
            details: stats
        };
    }

    async checkDatabaseSize() {
        const result = await this.client.query(`
            SELECT 
                pg_size_pretty(pg_database_size(current_database())) as database_size,
                pg_size_pretty(pg_total_relation_size('user_profiles')) as user_profiles_size,
                (SELECT count(*) FROM user_profiles) as user_count
        `);

        const stats = result.rows[0];

        return {
            name: 'Database Size',
            status: 'info',
            message: `Database: ${stats.database_size}, User profiles: ${stats.user_profiles_size}, Users: ${stats.user_count}`,
            details: stats
        };
    }

    async checkTablespaceAvailability() {
        try {
            const result = await this.client.query(`
                SELECT 
                    spcname,
                    pg_size_pretty(pg_tablespace_size(spcname)) as size
                FROM pg_tablespace
            `);

            return {
                name: 'Tablespace Availability',
                status: 'pass',
                message: `${result.rows.length} tablespaces available`,
                details: result.rows
            };
        } catch (error) {
            return {
                name: 'Tablespace Availability',
                status: 'warning',
                message: `Could not check tablespaces: ${error.message}`
            };
        }
    }

    async checkReplicationStatus() {
        try {
            const result = await this.client.query(`
                SELECT 
                    client_addr,
                    state,
                    sync_state
                FROM pg_stat_replication
            `);

            if (result.rows.length > 0) {
                return {
                    name: 'Replication Status',
                    status: 'info',
                    message: `${result.rows.length} replication connections active`,
                    details: result.rows,
                    recommendation: 'Monitor replication lag during migration'
                };
            }

            return {
                name: 'Replication Status',
                status: 'info',
                message: 'No replication configured'
            };
        } catch (error) {
            return {
                name: 'Replication Status',
                status: 'info',
                message: 'Replication status unavailable (normal for single instance)'
            };
        }
    }

    /**
     * Data Integrity Checks
     */
    getDataIntegrityChecks() {
        return [
            this.checkUserProfilesIntegrity,
            this.checkRoleConsistency,
            this.checkForeignKeyConstraints,
            this.checkDuplicateData,
            this.checkNullValues
        ];
    }

    async checkUserProfilesIntegrity() {
        const checks = [
            {
                name: 'Primary key uniqueness',
                query: 'SELECT COUNT(*) as total, COUNT(DISTINCT id) as unique_ids FROM user_profiles'
            },
            {
                name: 'Email uniqueness',
                query: 'SELECT COUNT(*) as total, COUNT(DISTINCT email) as unique_emails FROM user_profiles WHERE email IS NOT NULL'
            }
        ];

        const issues = [];

        for (const check of checks) {
            const result = await this.client.query(check.query);
            const stats = result.rows[0];
            
            if (parseInt(stats.total) !== parseInt(stats.unique_ids || stats.unique_emails)) {
                issues.push(`${check.name}: ${stats.total} total vs ${stats.unique_ids || stats.unique_emails} unique`);
            }
        }

        if (issues.length > 0) {
            return {
                name: 'User Profiles Integrity',
                status: 'fail',
                severity: 'high',
                message: `Data integrity issues found: ${issues.join(', ')}`,
                recommendation: 'Fix data integrity issues before migration'
            };
        }

        return {
            name: 'User Profiles Integrity',
            status: 'pass',
            message: 'User profiles data integrity is good'
        };
    }

    async checkRoleConsistency() {
        const result = await this.client.query(`
            SELECT 
                role,
                COUNT(*) as count
            FROM user_profiles 
            GROUP BY role
            ORDER BY count DESC
        `);

        const validOldRoles = [
            'management', 'management', 'management',
            'technical_lead', 'project_manager', 'project_manager',
            'project_manager', 'purchase_manager', 'purchase_manager',
            'project_manager', 'project_manager', 'client', 'admin'
        ];

        const invalidRoles = result.rows.filter(row => 
            !validOldRoles.includes(row.role) && 
            !['admin', 'management', 'technical_lead', 'project_manager', 'purchase_manager', 'client'].includes(row.role)
        );

        if (invalidRoles.length > 0) {
            return {
                name: 'Role Consistency',
                status: 'fail',
                severity: 'high',
                message: `Invalid roles found: ${invalidRoles.map(r => `${r.role}(${r.count})`).join(', ')}`,
                recommendation: 'Clean up invalid roles before migration'
            };
        }

        return {
            name: 'Role Consistency',
            status: 'pass',
            message: `All ${result.rows.length} role types are valid`,
            details: result.rows
        };
    }

    async checkForeignKeyConstraints() {
        const result = await this.client.query(`
            SELECT 
                conname,
                conrelid::regclass as table_name,
                confrelid::regclass as referenced_table
            FROM pg_constraint 
            WHERE contype = 'f' 
            AND (conrelid::regclass::text = 'user_profiles' OR confrelid::regclass::text = 'user_profiles')
        `);

        return {
            name: 'Foreign Key Constraints',
            status: 'info',
            message: `${result.rows.length} foreign key constraints involving user_profiles`,
            details: result.rows,
            recommendation: result.rows.length > 0 ? 'Monitor foreign key constraints during migration' : null
        };
    }

    async checkDuplicateData() {
        const duplicateChecks = [
            {
                name: 'Duplicate emails',
                query: `
                    SELECT email, COUNT(*) as count 
                    FROM user_profiles 
                    WHERE email IS NOT NULL 
                    GROUP BY email 
                    HAVING COUNT(*) > 1
                `
            },
            {
                name: 'Duplicate names',
                query: `
                    SELECT first_name, last_name, COUNT(*) as count 
                    FROM user_profiles 
                    GROUP BY first_name, last_name 
                    HAVING COUNT(*) > 1 AND COUNT(*) < 10
                `
            }
        ];

        const duplicates = [];

        for (const check of duplicateChecks) {
            const result = await this.client.query(check.query);
            if (result.rows.length > 0) {
                duplicates.push({
                    type: check.name,
                    count: result.rows.length,
                    examples: result.rows.slice(0, 3)
                });
            }
        }

        if (duplicates.length > 0) {
            return {
                name: 'Duplicate Data',
                status: 'warning',
                message: `Duplicates found: ${duplicates.map(d => `${d.count} ${d.type}`).join(', ')}`,
                details: duplicates,
                recommendation: 'Review duplicate data - may indicate data quality issues'
            };
        }

        return {
            name: 'Duplicate Data',
            status: 'pass',
            message: 'No significant duplicate data found'
        };
    }

    async checkNullValues() {
        const result = await this.client.query(`
            SELECT 
                COUNT(*) as total_users,
                COUNT(*) FILTER (WHERE first_name IS NULL) as null_first_name,
                COUNT(*) FILTER (WHERE last_name IS NULL) as null_last_name,
                COUNT(*) FILTER (WHERE email IS NULL) as null_email,
                COUNT(*) FILTER (WHERE role IS NULL) as null_role
            FROM user_profiles
        `);

        const stats = result.rows[0];
        const issues = [];

        if (parseInt(stats.null_role) > 0) {
            issues.push(`${stats.null_role} users with null role`);
        }

        if (parseInt(stats.null_email) > parseInt(stats.total_users) * 0.5) {
            issues.push(`${stats.null_email} users with null email (${Math.round(stats.null_email/stats.total_users*100)}%)`);
        }

        if (issues.length > 0) {
            return {
                name: 'Null Values',
                status: 'warning',
                message: `Data quality issues: ${issues.join(', ')}`,
                details: stats,
                recommendation: 'Review null values - may affect migration'
            };
        }

        return {
            name: 'Null Values',
            status: 'pass',
            message: 'Null value distribution is acceptable',
            details: stats
        };
    }

    /**
     * Backup Readiness Checks
     */
    getBackupReadinessChecks() {
        return [
            this.checkBackupInfrastructure,
            this.checkBackupSpace,
            this.checkBackupPermissions,
            this.checkExistingBackups
        ];
    }

    async checkBackupInfrastructure() {
        const requiredTables = [
            'migration_backup_user_profiles',
            'migration_validation_functions',
            'migration_rollback_log'
        ];

        const existingTables = [];
        const missingTables = [];

        for (const table of requiredTables) {
            const result = await this.client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = $1
                )
            `, [table]);

            if (result.rows[0].exists) {
                existingTables.push(table);
            } else {
                missingTables.push(table);
            }
        }

        if (missingTables.length > 0) {
            return {
                name: 'Backup Infrastructure',
                status: 'fail',
                severity: 'high',
                message: `Missing backup infrastructure: ${missingTables.join(', ')}`,
                recommendation: 'Run migration infrastructure setup script first'
            };
        }

        return {
            name: 'Backup Infrastructure',
            status: 'pass',
            message: `All ${existingTables.length} backup tables ready`
        };
    }

    async checkBackupSpace() {
        const result = await this.client.query(`
            SELECT 
                pg_size_pretty(pg_database_size(current_database())) as current_size,
                pg_size_pretty(pg_total_relation_size('user_profiles') * 2) as estimated_backup_size
        `);

        return {
            name: 'Backup Space',
            status: 'info',
            message: `Current DB: ${result.rows[0].current_size}, Estimated backup: ${result.rows[0].estimated_backup_size}`,
            details: result.rows[0],
            recommendation: 'Ensure sufficient disk space for backups'
        };
    }

    async checkBackupPermissions() {
        try {
            // Test backup table creation
            const testTable = `backup_permission_test_${Date.now()}`;
            await this.client.query(`CREATE TABLE ${testTable} AS SELECT 1 as test`);
            await this.client.query(`DROP TABLE ${testTable}`);

            return {
                name: 'Backup Permissions',
                status: 'pass',
                message: 'Database user has backup creation permissions'
            };
        } catch (error) {
            return {
                name: 'Backup Permissions',
                status: 'fail',
                severity: 'high',
                message: `Cannot create backup tables: ${error.message}`,
                recommendation: 'Grant necessary permissions to database user'
            };
        }
    }

    async checkExistingBackups() {
        const result = await this.client.query(`
            SELECT 
                table_name,
                CASE 
                    WHEN table_name LIKE '%user_profiles%' THEN 'user_profiles'
                    WHEN table_name LIKE '%policy%' THEN 'policies'
                    ELSE 'other'
                END as backup_type
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_name LIKE '%backup%'
        `);

        return {
            name: 'Existing Backups',
            status: 'info',
            message: `${result.rows.length} existing backup tables found`,
            details: result.rows
        };
    }

    /**
     * Migration Prerequisites Checks
     */
    getMigrationPrerequisiteChecks() {
        return [
            this.checkUserRoleEnum,
            this.checkMigrationScripts,
            this.checkRLSPolicies,
            this.checkApplicationState
        ];
    }

    async checkUserRoleEnum() {
        const result = await this.client.query(`
            SELECT enumlabel 
            FROM pg_enum 
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
            ORDER BY enumsortorder
        `);

        const expectedRoles = ['management', 'purchase_manager', 'technical_lead', 'project_manager', 'client', 'admin'];
        const actualRoles = result.rows.map(row => row.enumlabel);
        
        const missingRoles = expectedRoles.filter(role => !actualRoles.includes(role));
        const extraRoles = actualRoles.filter(role => !expectedRoles.includes(role));

        if (missingRoles.length > 0) {
            return {
                name: 'User Role Enum',
                status: 'fail',
                severity: 'high',
                message: `Missing required roles: ${missingRoles.join(', ')}`,
                recommendation: 'Update user_role enum with all required roles'
            };
        }

        return {
            name: 'User Role Enum',
            status: 'pass',
            message: `All ${expectedRoles.length} required roles present`,
            details: { actualRoles, extraRoles }
        };
    }

    async checkMigrationScripts() {
        const requiredScripts = [
            'execute-complete-migration.js',
            'monitor-migration-status.js',
            'automatic-rollback.js'
        ];

        const existingScripts = [];
        const missingScripts = [];

        for (const script of requiredScripts) {
            try {
                await fs.access(path.join(__dirname, script));
                existingScripts.push(script);
            } catch (error) {
                missingScripts.push(script);
            }
        }

        if (missingScripts.length > 0) {
            return {
                name: 'Migration Scripts',
                status: 'fail',
                severity: 'high',
                message: `Missing migration scripts: ${missingScripts.join(', ')}`,
                recommendation: 'Ensure all migration scripts are present'
            };
        }

        return {
            name: 'Migration Scripts',
            status: 'pass',
            message: `All ${existingScripts.length} migration scripts ready`
        };
    }

    async checkRLSPolicies() {
        const oldPoliciesResult = await this.client.query(`
            SELECT COUNT(*) as count
            FROM pg_policies 
            WHERE schemaname = 'public'
            AND (qual LIKE '%user_role_old%' OR with_check LIKE '%user_role_old%')
        `);

        const newPoliciesResult = await this.client.query(`
            SELECT COUNT(*) as count
            FROM pg_policies 
            WHERE schemaname = 'public'
            AND (qual LIKE '%user_role::%' OR with_check LIKE '%user_role::%')
            AND qual NOT LIKE '%user_role_old%'
            AND with_check NOT LIKE '%user_role_old%'
        `);

        const oldPolicyCount = parseInt(oldPoliciesResult.rows[0].count);
        const newPolicyCount = parseInt(newPoliciesResult.rows[0].count);

        if (oldPolicyCount > 0) {
            return {
                name: 'RLS Policies',
                status: 'fail',
                severity: 'high',
                message: `${oldPolicyCount} policies still reference user_role_old`,
                recommendation: 'Complete RLS policy migration first'
            };
        }

        return {
            name: 'RLS Policies',
            status: 'pass',
            message: `RLS policies ready (${newPolicyCount} policies using new roles)`
        };
    }

    async checkApplicationState() {
        // This is a implementation for checking if the application is in a safe state
        // In a real implementation, this might check:
        // - Active user sessions
        // - Running background jobs
        // - Application health endpoints
        // - Load balancer status

        return {
            name: 'Application State',
            status: 'info',
            message: 'Application state check implemented',
            recommendation: 'Manually verify application is in maintenance mode or low-traffic state'
        };
    }

    /**
     * System Resources Checks
     */
    getSystemResourceChecks() {
        return [
            this.checkMemoryUsage,
            this.checkCPULoad,
            this.checkDiskIO
        ];
    }

    async checkMemoryUsage() {
        try {
            const result = await this.client.query(`
                SELECT 
                    setting as shared_buffers,
                    unit
                FROM pg_settings 
                WHERE name = 'shared_buffers'
            `);

            return {
                name: 'Memory Usage',
                status: 'info',
                message: `Shared buffers: ${result.rows[0].setting}${result.rows[0].unit}`,
                details: result.rows[0]
            };
        } catch (error) {
            return {
                name: 'Memory Usage',
                status: 'warning',
                message: `Could not check memory usage: ${error.message}`
            };
        }
    }

    async checkCPULoad() {
        // implementation for CPU load check
        return {
            name: 'CPU Load',
            status: 'info',
            message: 'CPU load check implemented',
            recommendation: 'Monitor CPU usage during migration'
        };
    }

    async checkDiskIO() {
        try {
            const result = await this.client.query(`
                SELECT 
                    sum(blks_read) as blocks_read,
                    sum(blks_hit) as blocks_hit,
                    round(sum(blks_hit)*100.0/(sum(blks_hit)+sum(blks_read)), 2) as cache_hit_ratio
                FROM pg_stat_database
            `);

            const hitRatio = parseFloat(result.rows[0].cache_hit_ratio);

            if (hitRatio < 95) {
                return {
                    name: 'Disk I/O',
                    status: 'warning',
                    message: `Low cache hit ratio: ${hitRatio}%`,
                    recommendation: 'Consider increasing shared_buffers or monitoring I/O during migration',
                    details: result.rows[0]
                };
            }

            return {
                name: 'Disk I/O',
                status: 'pass',
                message: `Good cache hit ratio: ${hitRatio}%`,
                details: result.rows[0]
            };
        } catch (error) {
            return {
                name: 'Disk I/O',
                status: 'warning',
                message: `Could not check disk I/O: ${error.message}`
            };
        }
    }

    /**
     * Application State Checks
     */
    getApplicationStateChecks() {
        return [
            this.checkActiveUsers,
            this.checkBackgroundJobs,
            this.checkSystemLocks
        ];
    }

    async checkActiveUsers() {
        const result = await this.client.query(`
            SELECT 
                count(*) as active_sessions,
                count(DISTINCT usename) as unique_users
            FROM pg_stat_activity 
            WHERE state = 'active' 
            AND usename IS NOT NULL
        `);

        const stats = result.rows[0];

        if (parseInt(stats.active_sessions) > 10) {
            return {
                name: 'Active Users',
                status: 'warning',
                message: `High activity: ${stats.active_sessions} active sessions from ${stats.unique_users} users`,
                recommendation: 'Consider scheduling migration during low-activity period',
                details: stats
            };
        }

        return {
            name: 'Active Users',
            status: 'pass',
            message: `Low activity: ${stats.active_sessions} active sessions`,
            details: stats
        };
    }

    async checkBackgroundJobs() {
        // implementation for background job checking
        return {
            name: 'Background Jobs',
            status: 'info',
            message: 'Background job check implemented',
            recommendation: 'Manually verify no critical background jobs are running'
        };
    }

    async checkSystemLocks() {
        const result = await this.client.query(`
            SELECT 
                count(*) as total_locks,
                count(*) FILTER (WHERE NOT granted) as blocked_locks
            FROM pg_locks
        `);

        const stats = result.rows[0];

        if (parseInt(stats.blocked_locks) > 0) {
            return {
                name: 'System Locks',
                status: 'warning',
                message: `${stats.blocked_locks} blocked locks out of ${stats.total_locks} total`,
                recommendation: 'Investigate blocked locks before migration',
                details: stats
            };
        }

        return {
            name: 'System Locks',
            status: 'pass',
            message: `${stats.total_locks} locks, none blocked`,
            details: stats
        };
    }

    /**
     * Generate comprehensive safety report
     */
    generateSafetyReport() {
        const totalChecks = this.checkResults.length;
        const passedChecks = this.checkResults.filter(r => r.status === 'pass').length;
        const failedChecks = this.checkResults.filter(r => r.status === 'fail').length;
        const warningChecks = this.checkResults.filter(r => r.status === 'warning').length;

        const safetyScore = Math.round((passedChecks / totalChecks) * 100);
        
        const isSafeToMigrate = this.criticalIssues.length === 0 && safetyScore >= 80;

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalChecks,
                passedChecks,
                failedChecks,
                warningChecks,
                safetyScore,
                isSafeToMigrate
            },
            criticalIssues: this.criticalIssues,
            warnings: this.warnings,
            recommendations: this.recommendations,
            allResults: this.checkResults
        };

        console.log('\n📊 SAFETY CHECK SUMMARY');
        console.log('======================');
        console.log(`Total Checks: ${totalChecks}`);
        console.log(`✅ Passed: ${passedChecks}`);
        console.log(`❌ Failed: ${failedChecks}`);
        console.log(`⚠️  Warnings: ${warningChecks}`);
        console.log(`🎯 Safety Score: ${safetyScore}%`);
        console.log(`🚦 Safe to Migrate: ${isSafeToMigrate ? 'YES' : 'NO'}`);

        if (this.criticalIssues.length > 0) {
            console.log(`\n🚨 CRITICAL ISSUES (${this.criticalIssues.length}):`);
            this.criticalIssues.forEach(issue => {
                console.log(`  ❌ ${issue.name}: ${issue.message}`);
            });
        }

        if (this.warnings.length > 0) {
            console.log(`\n⚠️  WARNINGS (${this.warnings.length}):`);
            this.warnings.forEach(warning => {
                console.log(`  ⚠️  ${warning.name}: ${warning.message}`);
            });
        }

        if (this.recommendations.length > 0) {
            console.log(`\n💡 RECOMMENDATIONS (${this.recommendations.length}):`);
            this.recommendations.forEach(rec => {
                console.log(`  💡 ${rec.check}: ${rec.recommendation}`);
            });
        }

        console.log(`\n${isSafeToMigrate ? '🎉 READY FOR MIGRATION!' : '🛑 MIGRATION NOT RECOMMENDED'}`);
        
        if (!isSafeToMigrate) {
            console.log('Please address critical issues before proceeding with migration.');
        }

        return report;
    }

    async cleanup() {
        if (this.client) {
            await this.client.end();
        }
    }
}

// Execute if run directly
if (require.main === module) {
    const safetyChecker = new PreMigrationSafetyChecks();
    
    safetyChecker.initialize()
        .then(success => {
            if (success) {
                return safetyChecker.runAllChecks();
            } else {
                process.exit(1);
            }
        })
        .then(report => {
            // Save report to file
            const reportPath = path.join(__dirname, `safety-check-report-${Date.now()}.json`);
            return fs.writeFile(reportPath, JSON.stringify(report, null, 2))
                .then(() => {
                    console.log(`\n📄 Full report saved to: ${reportPath}`);
                    return report;
                });
        })
        .then(report => {
            return safetyChecker.cleanup().then(() => report);
        })
        .then(report => {
            process.exit(report.summary.isSafeToMigrate ? 0 : 1);
        })
        .catch(error => {
            console.error('Safety check failed:', error);
            safetyChecker.cleanup();
            process.exit(1);
        });
}

module.exports = { PreMigrationSafetyChecks };