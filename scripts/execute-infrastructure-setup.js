#!/usr/bin/env node

/**
 * Migration Infrastructure Setup Executor
 * Executes the complete migration infrastructure setup
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up migration infrastructure...\n');

// Check if we're in the right directory
const scriptsDir = path.join(process.cwd(), 'scripts');
if (!fs.existsSync(scriptsDir)) {
    console.error('❌ Error: scripts directory not found. Please run from project root.');
    process.exit(1);
}

// Check if required SQL files exist
const requiredFiles = [
    'scripts/migration-logging-system.sql',
    'scripts/comprehensive-backup-system.sql',
    'scripts/migration-rollback-system.sql',
    'scripts/migration-validation-functions.sql',
    'scripts/setup-migration-infrastructure.sql'
];

console.log('📋 Checking required files...');
for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
        console.error(`❌ Error: Required file ${file} not found.`);
        process.exit(1);
    }
    console.log(`✅ Found: ${file}`);
}

console.log('\n🔧 Executing migration infrastructure setup...\n');

try {
    // Check if we have database connection
    const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
    if (!dbUrl) {
        console.error('❌ Error: DATABASE_URL or SUPABASE_DB_URL environment variable not set.');
        console.log('Please set your database connection string in environment variables.');
        process.exit(1);
    }

    // Execute the setup script using psql
    console.log('📊 Executing SQL setup script...');
    
    const command = `psql "${dbUrl}" -f scripts/setup-migration-infrastructure.sql`;
    
    const output = execSync(command, { 
        encoding: 'utf8',
        stdio: 'pipe'
    });
    
    console.log('✅ Migration infrastructure setup completed successfully!\n');
    console.log('📋 Setup Output:');
    console.log(output);
    
    console.log('\n🎉 Migration Infrastructure Ready!');
    console.log('\n📝 Next Steps:');
    console.log('1. Run: SELECT * FROM migration_control.get_infrastructure_status();');
    console.log('2. Run: SELECT * FROM migration_control.prepare_for_migration();');
    console.log('3. Proceed with role migration tasks');
    
} catch (error) {
    console.error('❌ Error executing migration infrastructure setup:');
    console.error(error.message);
    
    if (error.stdout) {
        console.log('\n📋 Output:');
        console.log(error.stdout);
    }
    
    if (error.stderr) {
        console.log('\n🚨 Error Details:');
        console.log(error.stderr);
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Verify database connection string is correct');
    console.log('2. Ensure database user has sufficient privileges');
    console.log('3. Check that all required SQL files are present');
    console.log('4. Try running individual SQL files manually');
    
    process.exit(1);
}