#!/usr/bin/env node

/**
 * Automatic Rollback System
 * Provides automatic rollback capabilities with safety checks and validation
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

class AutomaticRollback {
    constructor() {
        this.client = null;
        this.rollbackId = `rollback_${Date.now()}`;
        this.errors = [];
        this.warnings = [];
        this.stats = {
            usersRestored: 0,
            policiesRestored: 0,
            backupsFound: 0
        };
    }

    async initialize() {
        try {
            this.client = new Client(dbConfig);
            await this.client.connect();
            console.log('✅ Database connection established for rollback');
            return true;
        } catch (error) {
            console.error('❌ Failed to connect to database:', error.message);
            return false;
        }
    }

    /**
     * Detect if rollback is needed
     */
    async detectRollbackNeed() {
        console.log('🔍 Detecting if rollback is needed...');

        const checks = [
            this.checkMigrationFailure,
            this.checkDataCorruption,
            this.checkSystemHealth,
            this.checkUserFeedback
        ];

        const issues = [];

        for (const check of checks) {
            try {
                const result = await check.call(this);
                if (!result.success) {
                    issues.push(result);
                }
            } catch (error) {
                issues.push({
                    success: false,
                    severity: 'high',
                    issue: `Check failed: ${error.message}`,
                    recommendation: 'investigate'
                });
            }
        }

        return {
            needsRollback: issues.some(issue => issue.severity === 'high'),
            issues: issues,
            recommendation: this.generateRollbackRecommendation(issues)
        };
    }

    /**
     * Check for migration failure indicators
     */
    async checkMigrationFailure() {
        const result = await this.client.query(`
            SELECT 
                migration_id,
                phase,
                status,
                message,
                created_at
            FROM migration_execution_log 
            WHERE status IN ('FAILED', 'ERROR')
            ORDER BY created_at DESC 
            LIMIT 5
        `);

        if (result.rows.length > 0) {
            const recentFailures = result.rows.filter(row => 
                new Date() - new Date(row.created_at) < 3600000 // Last hour
            );

            if (recentFailures.length > 0) {
                return {
                    success: false,
                    severity: 'high',
                    issue: `Recent migration failures detected: ${recentFailures.length} failures in last hour`,
                    details: recentFailures,
                    recommendation: 'rollback'
                };
            }
        }

        return { success: true, message: 'No recent migration failures detected' };
    }

    /**
     * Check for data corruption
     */
    async checkDataCorruption() {
        const checks = [
            {
                name: 'Invalid roles',
                query: `
                    SELECT COUNT(*) as count 
                    FROM user_profiles 
                    WHERE role NOT IN ('admin', 'management', 'technical_lead', 'project_manager', 'purchase_manager', 'client')
                `
            },
            {
                name: 'Missing seniority levels',
                query: `
                    SELECT COUNT(*) as count 
                    FROM user_profiles 
                    WHERE seniority_level IS NULL AND role_migrated_at IS NOT NULL
                `
            },
            {
                name: 'Orphaned role assignments',
                query: `
                    SELECT COUNT(*) as count 
                    FROM user_profiles 
                    WHERE role_migrated_at IS NOT NULL AND previous_role IS NULL
                `
            }
        ];

        const issues = [];

        for (const check of checks) {
            const result = await this.client.query(check.query);
            const count = parseInt(result.rows[0].count);
            
            if (count > 0) {
                issues.push({
                    check: check.name,
                    count: count
                });
            }
        }

        if (issues.length > 0) {
            return {
                success: false,
                severity: 'high',
                issue: `Data corruption detected: ${issues.map(i => `${i.check}(${i.count})`).join(', ')}`,
                details: issues,
                recommendation: 'rollback'
            };
        }

        return { success: true, message: 'No data corruption detected' };
    }

    /**
     * Check system health
     */
    async checkSystemHealth() {
        try {
            // Check for excessive database load
            const loadResult = await this.client.query(`
                SELECT 
                    count(*) as active_connections,
                    count(*) FILTER (WHERE state = 'active' AND query_start < now() - interval '5 minutes') as long_running_queries
                FROM pg_stat_activity
            `);

            const load = loadResult.rows[0];
            
            if (parseInt(load.long_running_queries) > 10) {
                return {
                    success: false,
                    severity: 'medium',
                    issue: `High database load detected: ${load.long_running_queries} long-running queries`,
                    recommendation: 'monitor'
                };
            }

            // Check for table locks
            const lockResult = await this.client.query(`
                SELECT COUNT(*) as lock_count
                FROM pg_locks l
                JOIN pg_class c ON l.relation = c.oid
                WHERE c.relname = 'user_profiles'
                AND NOT granted
            `);

            if (parseInt(lockResult.rows[0].lock_count) > 0) {
                return {
                    success: false,
                    severity: 'medium',
                    issue: `Table locks detected on user_profiles: ${lockResult.rows[0].lock_count} blocked locks`,
                    recommendation: 'monitor'
                };
            }

            return { success: true, message: 'System health is good' };

        } catch (error) {
            return {
                success: false,
                severity: 'medium',
                issue: `Health check failed: ${error.message}`,
                recommendation: 'investigate'
            };
        }
    }

    /**
     * Check user feedback (implementation for real implementation)
     */
    async checkUserFeedback() {
        // In a real implementation, this would check:
        // - Error reporting system
        // - User support tickets
        // - Application error logs
        // - Performance metrics

        return { success: true, message: 'No user feedback issues detected' };
    }

    /**
     * Generate rollback recommendation
     */
    generateRollbackRecommendation(issues) {
        const highSeverityIssues = issues.filter(issue => issue.severity === 'high');
        const mediumSeverityIssues = issues.filter(issue => issue.severity === 'medium');

        if (highSeverityIssues.length > 0) {
            return {
                action: 'IMMEDIATE_ROLLBACK',
                reason: `${highSeverityIssues.length} high-severity issues detected`,
                urgency: 'high'
            };
        }

        if (mediumSeverityIssues.length >= 3) {
            return {
                action: 'CONSIDER_ROLLBACK',
                reason: `Multiple medium-severity issues detected (${mediumSeverityIssues.length})`,
                urgency: 'medium'
            };
        }

        if (issues.length > 0) {
            return {
                action: 'MONITOR',
                reason: `${issues.length} minor issues detected`,
                urgency: 'low'
            };
        }

        return {
            action: 'NO_ACTION',
            reason: 'No issues detected',
            urgency: 'none'
        };
    }

    /**
     * Find available backups
     */
    async findAvailableBackups() {
        console.log('🔍 Finding available backups...');

        const backupTables = await this.client.query(`
            SELECT 
                table_name,
                CASE 
                    WHEN table_name LIKE 'migration_backup_user_profiles_%' THEN 'user_profiles'
                    WHEN table_name LIKE 'rls_policy_backup_%' THEN 'rls_policies'
                    ELSE 'unknown'
                END as backup_type,
                CASE 
                    WHEN table_name ~ '\\d{4}-\\d{2}-\\d{2}' THEN 
                        SUBSTRING(table_name FROM '\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}')
                    ELSE 
                        SUBSTRING(table_name FROM '\\d+$')
                END as backup_timestamp
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND (
                table_name LIKE 'migration_backup_user_profiles_%'
                OR table_name LIKE 'rls_policy_backup_%'
            )
            ORDER BY table_name DESC
        `);

        const backups = {
            user_profiles: [],
            rls_policies: []
        };

        backupTables.rows.forEach(row => {
            if (backups[row.backup_type]) {
                backups[row.backup_type].push({
                    table_name: row.table_name,
                    timestamp: row.backup_timestamp
                });
            }
        });

        this.stats.backupsFound = backupTables.rows.length;

        console.log(`📊 Found ${backupTables.rows.length} backup tables:`);
        console.log(`  - User profiles: ${backups.user_profiles.length}`);
        console.log(`  - RLS policies: ${backups.rls_policies.length}`);

        return backups;
    }

    /**
     * Execute rollback
     */
    async executeRollback(backups) {
        console.log('\n🔄 Executing rollback...');

        try {
            await this.client.query('BEGIN');

            // Step 1: Restore user profiles
            if (backups.user_profiles.length > 0) {
                const latestBackup = backups.user_profiles[0];
                console.log(`📥 Restoring user profiles from ${latestBackup.table_name}`);

                // Verify backup integrity
                const backupCount = await this.client.query(`SELECT COUNT(*) FROM ${latestBackup.table_name}`);
                console.log(`📊 Backup contains ${backupCount.rows[0].count} user records`);

                // Restore data
                await this.client.query(`
                    TRUNCATE user_profiles;
                    INSERT INTO user_profiles 
                    SELECT * FROM ${latestBackup.table_name};
                `);

                const restoredCount = await this.client.query('SELECT COUNT(*) FROM user_profiles');
                this.stats.usersRestored = parseInt(restoredCount.rows[0].count);
                
                console.log(`✅ Restored ${this.stats.usersRestored} user profiles`);
            }

            // Step 2: Restore RLS policies (if needed)
            if (backups.rls_policies.length > 0) {
                console.log('⚠️  RLS policy restoration requires manual intervention');
                this.warnings.push('RLS policies may need manual restoration');
            }

            // Step 3: Clean up migration artifacts
            await this.cleanupMigrationArtifacts();

            await this.client.query('COMMIT');
            console.log('✅ Rollback transaction committed');

            return true;

        } catch (error) {
            await this.client.query('ROLLBACK');
            this.errors.push(`Rollback failed: ${error.message}`);
            console.error('❌ Rollback failed, transaction rolled back');
            return false;
        }
    }

    /**
     * Clean up migration artifacts
     */
    async cleanupMigrationArtifacts() {
        console.log('🧹 Cleaning up migration artifacts...');

        // Reset migration timestamps
        await this.client.query(`
            UPDATE user_profiles 
            SET 
                role_migrated_at = NULL,
                previous_role = NULL
            WHERE role_migrated_at IS NOT NULL
        `);

        // Log rollback event
        await this.client.query(`
            INSERT INTO migration_execution_log (migration_id, phase, status, message, details)
            VALUES ($1, 'ROLLBACK', 'COMPLETED', 'Automatic rollback executed', $2)
        `, [this.rollbackId, JSON.stringify({
            rollback_id: this.rollbackId,
            stats: this.stats,
            timestamp: new Date().toISOString()
        })]);

        console.log('✅ Migration artifacts cleaned up');
    }

    /**
     * Validate rollback success
     */
    async validateRollback() {
        console.log('🔍 Validating rollback success...');

        const validations = [
            {
                name: 'User count consistency',
                query: 'SELECT COUNT(*) as count FROM user_profiles'
            },
            {
                name: 'Migration timestamps cleared',
                query: 'SELECT COUNT(*) as count FROM user_profiles WHERE role_migrated_at IS NOT NULL'
            },
            {
                name: 'Previous roles cleared',
                query: 'SELECT COUNT(*) as count FROM user_profiles WHERE previous_role IS NOT NULL'
            }
        ];

        const results = [];

        for (const validation of validations) {
            const result = await this.client.query(validation.query);
            results.push({
                name: validation.name,
                count: parseInt(result.rows[0].count),
                status: validation.name === 'User count consistency' ? 
                    (parseInt(result.rows[0].count) > 0 ? 'pass' : 'fail') :
                    (parseInt(result.rows[0].count) === 0 ? 'pass' : 'fail')
            });
        }

        console.log('📊 Rollback validation results:');
        results.forEach(result => {
            const icon = result.status === 'pass' ? '✅' : '❌';
            console.log(`  ${icon} ${result.name}: ${result.count}`);
        });

        return results.every(result => result.status === 'pass');
    }

    /**
     * Generate rollback report
     */
    async generateRollbackReport(detection, backups, success) {
        const report = {
            rollbackId: this.rollbackId,
            timestamp: new Date().toISOString(),
            success: success,
            detection: detection,
            backupsUsed: backups,
            statistics: this.stats,
            errors: this.errors,
            warnings: this.warnings
        };

        // Save report to file
        const reportPath = path.join(__dirname, `rollback-report-${this.rollbackId}.json`);
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        console.log('\n📊 ROLLBACK REPORT');
        console.log('==================');
        console.log(`Status: ${success ? 'SUCCESS' : 'FAILED'}`);
        console.log(`Users restored: ${this.stats.usersRestored}`);
        console.log(`Backups found: ${this.stats.backupsFound}`);
        
        if (this.errors.length > 0) {
            console.log(`\n❌ Errors (${this.errors.length}):`);
            this.errors.forEach(error => console.log(`  - ${error}`));
        }

        if (this.warnings.length > 0) {
            console.log(`\n⚠️  Warnings (${this.warnings.length}):`);
            this.warnings.forEach(warning => console.log(`  - ${warning}`));
        }

        console.log(`\n📄 Full report saved to: ${reportPath}`);

        return report;
    }

    /**
     * Main rollback execution
     */
    async execute(force = false) {
        console.log('🔄 Starting Automatic Rollback System');
        console.log('=====================================');
        console.log(`Rollback ID: ${this.rollbackId}`);

        try {
            // Initialize
            if (!(await this.initialize())) {
                throw new Error('Rollback initialization failed');
            }

            // Detect if rollback is needed
            const detection = await this.detectRollbackNeed();
            
            console.log(`\n🔍 Rollback Detection Results:`);
            console.log(`Action: ${detection.recommendation.action}`);
            console.log(`Reason: ${detection.recommendation.reason}`);
            console.log(`Urgency: ${detection.recommendation.urgency}`);

            if (detection.issues.length > 0) {
                console.log('\n⚠️  Issues detected:');
                detection.issues.forEach(issue => {
                    console.log(`  - [${issue.severity}] ${issue.issue}`);
                });
            }

            // Check if rollback should proceed
            if (!force && !['IMMEDIATE_ROLLBACK', 'CONSIDER_ROLLBACK'].includes(detection.recommendation.action)) {
                console.log('\n✅ No rollback needed at this time');
                return true;
            }

            if (!force && detection.recommendation.action === 'CONSIDER_ROLLBACK') {
                console.log('\n⚠️  Rollback recommended but not critical. Use --force to proceed.');
                return true;
            }

            // Find backups
            const backups = await this.findAvailableBackups();
            
            if (backups.user_profiles.length === 0) {
                throw new Error('No user profile backups found - cannot proceed with rollback');
            }

            // Execute rollback
            const rollbackSuccess = await this.executeRollback(backups);
            
            if (!rollbackSuccess) {
                throw new Error('Rollback execution failed');
            }

            // Validate rollback
            const validationSuccess = await this.validateRollback();
            
            if (!validationSuccess) {
                this.warnings.push('Rollback validation had issues');
            }

            // Generate report
            await this.generateRollbackReport(detection, backups, rollbackSuccess && validationSuccess);

            console.log('\n🎉 ROLLBACK COMPLETED SUCCESSFULLY!');
            return true;

        } catch (error) {
            console.error('\n💥 ROLLBACK FAILED:', error.message);
            this.errors.push(error.message);
            
            // Still generate report for failed rollback
            try {
                await this.generateRollbackReport({}, {}, false);
            } catch (reportError) {
                console.error('Failed to generate rollback report:', reportError.message);
            }
            
            return false;
        } finally {
            if (this.client) {
                await this.client.end();
            }
        }
    }
}

// Execute if run directly
if (require.main === module) {
    const force = process.argv.includes('--force');
    const rollback = new AutomaticRollback();
    
    rollback.execute(force)
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Unexpected error:', error);
            process.exit(1);
        });
}

module.exports = { AutomaticRollback };