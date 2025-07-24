#!/usr/bin/env node

/**
 * Direct Infrastructure Setup Script
 * Sets up migration infrastructure using Node.js pg client instead of psql
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

class InfrastructureSetup {
    constructor() {
        this.client = null;
        this.errors = [];
        this.warnings = [];
        this.stats = {
            tablesCreated: 0,
            functionsCreated: 0,
            scriptsExecuted: 0
        };
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
     * Execute SQL file content
     */
    async executeSqlFile(filePath, description) {
        try {
            console.log(`📄 Executing ${description}...`);
            const sql = await fs.readFile(filePath, 'utf8');
            
            // Split SQL into individual statements (basic approach)
            const statements = sql
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

            let executedStatements = 0;

            for (const statement of statements) {
                if (statement.trim()) {
                    try {
                        await this.client.query(statement);
                        executedStatements++;
                    } catch (error) {
                        // Some statements might fail if objects already exist - that's OK
                        if (!error.message.includes('already exists')) {
                            console.warn(`⚠️  Statement failed: ${error.message}`);
                            this.warnings.push(`${description}: ${error.message}`);
                        }
                    }
                }
            }

            console.log(`✅ ${description} completed (${executedStatements} statements)`);
            this.stats.scriptsExecuted++;
            return { success: true, statements: executedStatements };

        } catch (error) {
            console.error(`❌ ${description} failed:`, error.message);
            this.errors.push(`${description}: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * Create migration infrastructure tables directly
     */
    async createInfrastructureTables() {
        console.log('🏗️  Creating migration infrastructure tables...');

        const tables = [
            {
                name: 'migration_backup_user_profiles',
                sql: `
                    CREATE TABLE IF NOT EXISTS migration_backup_user_profiles (
                        id UUID PRIMARY KEY,
                        role TEXT NOT NULL,
                        first_name TEXT NOT NULL,
                        last_name TEXT NOT NULL,
                        email TEXT UNIQUE,
                        phone TEXT,
                        company_name TEXT,
                        position TEXT,
                        department TEXT,
                        hire_date DATE,
                        is_active BOOLEAN DEFAULT true,
                        approval_limits JSONB DEFAULT '{}',
                        dashboard_preferences JSONB DEFAULT '{}',
                        previous_role TEXT,
                        role_migrated_at TIMESTAMP,
                        seniority_level TEXT,
                        created_at TIMESTAMP DEFAULT NOW(),
                        updated_at TIMESTAMP DEFAULT NOW(),
                        backup_timestamp TIMESTAMP DEFAULT NOW()
                    );
                `
            },
            {
                name: 'migration_validation_functions',
                sql: `
                    CREATE TABLE IF NOT EXISTS migration_validation_functions (
                        id SERIAL PRIMARY KEY,
                        function_name VARCHAR(255) NOT NULL,
                        validation_type VARCHAR(100) NOT NULL,
                        description TEXT,
                        sql_definition TEXT,
                        is_active BOOLEAN DEFAULT true,
                        created_at TIMESTAMP DEFAULT NOW()
                    );
                `
            },
            {
                name: 'migration_rollback_log',
                sql: `
                    CREATE TABLE IF NOT EXISTS migration_rollback_log (
                        id SERIAL PRIMARY KEY,
                        rollback_id VARCHAR(255) NOT NULL,
                        migration_id VARCHAR(255),
                        rollback_type VARCHAR(100) NOT NULL,
                        status VARCHAR(50) NOT NULL,
                        message TEXT,
                        details JSONB,
                        created_at TIMESTAMP DEFAULT NOW()
                    );
                `
            },
            {
                name: 'migration_execution_log',
                sql: `
                    CREATE TABLE IF NOT EXISTS migration_execution_log (
                        id SERIAL PRIMARY KEY,
                        migration_id VARCHAR(255) NOT NULL,
                        phase VARCHAR(100) NOT NULL,
                        status VARCHAR(50) NOT NULL,
                        message TEXT,
                        details JSONB,
                        created_at TIMESTAMP DEFAULT NOW()
                    );
                `
            }
        ];

        for (const table of tables) {
            try {
                await this.client.query(table.sql);
                console.log(`✅ Created table: ${table.name}`);
                this.stats.tablesCreated++;
            } catch (error) {
                if (error.message.includes('already exists')) {
                    console.log(`ℹ️  Table already exists: ${table.name}`);
                } else {
                    console.error(`❌ Failed to create table ${table.name}:`, error.message);
                    this.errors.push(`Table creation failed: ${table.name} - ${error.message}`);
                }
            }
        }
    }

    /**
     * Create validation functions
     */
    async createValidationFunctions() {
        console.log('🔧 Creating validation functions...');

        const functions = [
            {
                name: 'validate_role_migration',
                sql: `
                    CREATE OR REPLACE FUNCTION validate_role_migration()
                    RETURNS TABLE (
                        check_name TEXT,
                        status TEXT,
                        message TEXT,
                        details JSONB
                    )
                    LANGUAGE plpgsql
                    AS $$
                    BEGIN
                        -- Check 1: All users have valid roles
                        RETURN QUERY
                        SELECT 
                            'valid_roles'::TEXT,
                            CASE 
                                WHEN COUNT(*) = 0 THEN 'PASS'::TEXT
                                ELSE 'FAIL'::TEXT
                            END,
                            CASE 
                                WHEN COUNT(*) = 0 THEN 'All users have valid roles'::TEXT
                                ELSE FORMAT('%s users have invalid roles', COUNT(*))::TEXT
                            END,
                            json_build_object('invalid_count', COUNT(*))::JSONB
                        FROM user_profiles 
                        WHERE role NOT IN ('admin', 'management', 'technical_lead', 'project_manager', 'purchase_manager', 'client');

                        -- Check 2: Migration completeness
                        RETURN QUERY
                        SELECT 
                            'migration_completeness'::TEXT,
                            CASE 
                                WHEN COUNT(*) FILTER (WHERE role_migrated_at IS NULL) = 0 THEN 'PASS'::TEXT
                                ELSE 'FAIL'::TEXT
                            END,
                            CASE 
                                WHEN COUNT(*) FILTER (WHERE role_migrated_at IS NULL) = 0 THEN 'All users migrated'::TEXT
                                ELSE FORMAT('%s users not migrated', COUNT(*) FILTER (WHERE role_migrated_at IS NULL))::TEXT
                            END,
                            json_build_object(
                                'total_users', COUNT(*),
                                'migrated_users', COUNT(*) FILTER (WHERE role_migrated_at IS NOT NULL),
                                'unmigrated_users', COUNT(*) FILTER (WHERE role_migrated_at IS NULL)
                            )::JSONB
                        FROM user_profiles;

                        -- Check 3: Seniority level assignment
                        RETURN QUERY
                        SELECT 
                            'seniority_assignment'::TEXT,
                            CASE 
                                WHEN COUNT(*) FILTER (WHERE seniority_level IS NULL) = 0 THEN 'PASS'::TEXT
                                ELSE 'FAIL'::TEXT
                            END,
                            CASE 
                                WHEN COUNT(*) FILTER (WHERE seniority_level IS NULL) = 0 THEN 'All users have seniority levels'::TEXT
                                ELSE FORMAT('%s users missing seniority level', COUNT(*) FILTER (WHERE seniority_level IS NULL))::TEXT
                            END,
                            json_build_object('missing_seniority', COUNT(*) FILTER (WHERE seniority_level IS NULL))::JSONB
                        FROM user_profiles;
                    END;
                    $$;
                `
            },
            {
                name: 'backup_user_profiles',
                sql: `
                    CREATE OR REPLACE FUNCTION backup_user_profiles(backup_suffix TEXT DEFAULT NULL)
                    RETURNS TEXT
                    LANGUAGE plpgsql
                    AS $$
                    DECLARE
                        backup_table_name TEXT;
                        backup_count INTEGER;
                    BEGIN
                        -- Generate backup table name
                        IF backup_suffix IS NULL THEN
                            backup_table_name := 'migration_backup_user_profiles_' || EXTRACT(EPOCH FROM NOW())::BIGINT;
                        ELSE
                            backup_table_name := 'migration_backup_user_profiles_' || backup_suffix;
                        END IF;

                        -- Create backup
                        EXECUTE format('CREATE TABLE %I AS SELECT *, NOW() as backup_timestamp FROM user_profiles', backup_table_name);
                        
                        -- Get count
                        EXECUTE format('SELECT COUNT(*) FROM %I', backup_table_name) INTO backup_count;
                        
                        -- Log the backup
                        INSERT INTO migration_rollback_log (rollback_id, rollback_type, status, message, details)
                        VALUES (
                            backup_table_name,
                            'BACKUP',
                            'COMPLETED',
                            'User profiles backup created',
                            json_build_object('table_name', backup_table_name, 'record_count', backup_count)
                        );

                        RETURN format('Backup created: %s (%s records)', backup_table_name, backup_count);
                    END;
                    $$;
                `
            },
            {
                name: 'restore_user_profiles',
                sql: `
                    CREATE OR REPLACE FUNCTION restore_user_profiles(backup_table_name TEXT)
                    RETURNS TEXT
                    LANGUAGE plpgsql
                    AS $$
                    DECLARE
                        restore_count INTEGER;
                    BEGIN
                        -- Verify backup table exists
                        IF NOT EXISTS (
                            SELECT FROM information_schema.tables 
                            WHERE table_schema = 'public' 
                            AND table_name = backup_table_name
                        ) THEN
                            RAISE EXCEPTION 'Backup table % does not exist', backup_table_name;
                        END IF;

                        -- Get backup count
                        EXECUTE format('SELECT COUNT(*) FROM %I', backup_table_name) INTO restore_count;

                        -- Restore data (this is destructive!)
                        TRUNCATE user_profiles;
                        EXECUTE format('INSERT INTO user_profiles SELECT * FROM %I', backup_table_name);

                        -- Log the restore
                        INSERT INTO migration_rollback_log (rollback_id, rollback_type, status, message, details)
                        VALUES (
                            'restore_' || EXTRACT(EPOCH FROM NOW())::BIGINT,
                            'RESTORE',
                            'COMPLETED',
                            'User profiles restored from backup',
                            json_build_object('backup_table', backup_table_name, 'record_count', restore_count)
                        );

                        RETURN format('Restored %s records from %s', restore_count, backup_table_name);
                    END;
                    $$;
                `
            }
        ];

        for (const func of functions) {
            try {
                await this.client.query(func.sql);
                console.log(`✅ Created function: ${func.name}`);
                this.stats.functionsCreated++;
            } catch (error) {
                console.error(`❌ Failed to create function ${func.name}:`, error.message);
                this.errors.push(`Function creation failed: ${func.name} - ${error.message}`);
            }
        }
    }

    /**
     * Insert validation function metadata
     */
    async insertValidationMetadata() {
        console.log('📝 Inserting validation function metadata...');

        const metadata = [
            {
                function_name: 'validate_role_migration',
                validation_type: 'ROLE_VALIDATION',
                description: 'Validates role migration completeness and data integrity'
            },
            {
                function_name: 'backup_user_profiles',
                validation_type: 'BACKUP',
                description: 'Creates backup of user_profiles table'
            },
            {
                function_name: 'restore_user_profiles',
                validation_type: 'RESTORE',
                description: 'Restores user_profiles from backup table'
            }
        ];

        for (const meta of metadata) {
            try {
                await this.client.query(`
                    INSERT INTO migration_validation_functions (function_name, validation_type, description)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (function_name) DO UPDATE SET
                        validation_type = EXCLUDED.validation_type,
                        description = EXCLUDED.description
                `, [meta.function_name, meta.validation_type, meta.description]);
            } catch (error) {
                // Table might not have unique constraint on function_name, that's OK
                try {
                    await this.client.query(`
                        INSERT INTO migration_validation_functions (function_name, validation_type, description)
                        VALUES ($1, $2, $3)
                    `, [meta.function_name, meta.validation_type, meta.description]);
                } catch (insertError) {
                    console.warn(`⚠️  Could not insert metadata for ${meta.function_name}`);
                }
            }
        }
    }

    /**
     * Test infrastructure
     */
    async testInfrastructure() {
        console.log('🧪 Testing migration infrastructure...');

        const tests = [
            {
                name: 'Validation function test',
                query: 'SELECT * FROM validate_role_migration() LIMIT 1'
            },
            {
                name: 'Backup function test',
                query: 'SELECT backup_user_profiles(\'test_backup\')'
            },
            {
                name: 'Table access test',
                query: 'SELECT COUNT(*) FROM migration_execution_log'
            }
        ];

        let passedTests = 0;

        for (const test of tests) {
            try {
                const result = await this.client.query(test.query);
                console.log(`✅ ${test.name}: PASSED`);
                passedTests++;
            } catch (error) {
                console.error(`❌ ${test.name}: FAILED - ${error.message}`);
                this.errors.push(`Test failed: ${test.name} - ${error.message}`);
            }
        }

        // Clean up test backup
        try {
            await this.client.query('DROP TABLE IF EXISTS migration_backup_user_profiles_test_backup');
        } catch (error) {
            // Ignore cleanup errors
        }

        return passedTests === tests.length;
    }

    /**
     * Generate setup report
     */
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            success: this.errors.length === 0,
            statistics: this.stats,
            errors: this.errors,
            warnings: this.warnings
        };

        console.log('\n📊 INFRASTRUCTURE SETUP REPORT');
        console.log('==============================');
        console.log(`Status: ${report.success ? 'SUCCESS' : 'FAILED'}`);
        console.log(`Tables created: ${this.stats.tablesCreated}`);
        console.log(`Functions created: ${this.stats.functionsCreated}`);
        console.log(`Scripts executed: ${this.stats.scriptsExecuted}`);

        if (this.errors.length > 0) {
            console.log(`\n❌ Errors (${this.errors.length}):`);
            this.errors.forEach(error => console.log(`  - ${error}`));
        }

        if (this.warnings.length > 0) {
            console.log(`\n⚠️  Warnings (${this.warnings.length}):`);
            this.warnings.forEach(warning => console.log(`  - ${warning}`));
        }

        return report;
    }

    /**
     * Main setup execution
     */
    async execute() {
        console.log('🚀 Setting up migration infrastructure directly...');
        console.log('================================================');

        try {
            // Initialize
            if (!(await this.initialize())) {
                throw new Error('Database connection failed');
            }

            // Create infrastructure tables
            await this.createInfrastructureTables();

            // Create validation functions
            await this.createValidationFunctions();

            // Insert metadata
            await this.insertValidationMetadata();

            // Test infrastructure
            const testsPassed = await this.testInfrastructure();

            if (!testsPassed) {
                this.warnings.push('Some infrastructure tests failed');
            }

            console.log('\n🎉 INFRASTRUCTURE SETUP COMPLETED!');
            console.log('✅ Migration infrastructure is ready');
            console.log('✅ Backup and restore functions available');
            console.log('✅ Validation functions operational');

        } catch (error) {
            console.error('\n💥 INFRASTRUCTURE SETUP FAILED:', error.message);
            this.errors.push(error.message);
        } finally {
            // Generate report
            const report = this.generateReport();
            
            // Cleanup
            if (this.client) {
                await this.client.end();
                console.log('🔌 Database connection closed');
            }

            return report.success;
        }
    }
}

// Execute if run directly
if (require.main === module) {
    const setup = new InfrastructureSetup();
    
    setup.execute()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Unexpected error:', error);
            process.exit(1);
        });
}

module.exports = { InfrastructureSetup };