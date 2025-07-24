#!/usr/bin/env node

/**
 * Role Migration Execution Script
 * Safely executes the database role migration from 13-role to 6-role system
 * 
 * Usage:
 *   node scripts/execute-role-migration.js [--test-only] [--force]
 * 
 * Options:
 *   --test-only: Run only the test script without actual migration
 *   --force: Skip confirmation prompts (use with caution)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
    testScript: 'scripts/test-role-migration.sql',
    migrationScript: 'scripts/role-migration-script.sql',
    logFile: `migration-logs/role-migration-${new Date().toISOString().replace(/[:.]/g, '-')}.log`
};

// Parse command line arguments
const args = process.argv.slice(2);
const testOnly = args.includes('--test-only');
const force = args.includes('--force');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(`${color}${logMessage}${colors.reset}`);
    
    // Ensure log directory exists
    const logDir = path.dirname(config.logFile);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    
    // Append to log file
    fs.appendFileSync(config.logFile, logMessage + '\n');
}

function error(message) {
    log(`ERROR: ${message}`, colors.red);
}

function success(message) {
    log(`SUCCESS: ${message}`, colors.green);
}

function warning(message) {
    log(`WARNING: ${message}`, colors.yellow);
}

function info(message) {
    log(`INFO: ${message}`, colors.blue);
}

function checkPrerequisites() {
    info('Checking prerequisites...');
    
    // Check if required files exist
    const requiredFiles = [config.testScript, config.migrationScript];
    
    for (const file of requiredFiles) {
        if (!fs.existsSync(file)) {
            error(`Required file not found: ${file}`);
            process.exit(1);
        }
    }
    
    // Check database connection
    const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
    if (!dbUrl) {
        error('Database connection not configured. Set DATABASE_URL or SUPABASE_DB_URL environment variable.');
        process.exit(1);
    }
    
    success('Prerequisites check passed');
}

function runSqlScript(scriptPath, description) {
    info(`Running ${description}...`);
    
    try {
        const command = `psql "${process.env.DATABASE_URL || process.env.SUPABASE_DB_URL}" -f "${scriptPath}"`;
        const output = execSync(command, { 
            encoding: 'utf8',
            stdio: 'pipe'
        });
        
        log(`Script output:\n${output}`);
        success(`${description} completed successfully`);
        return true;
    } catch (err) {
        error(`${description} failed: ${err.message}`);
        if (err.stdout) log(`STDOUT: ${err.stdout}`);
        if (err.stderr) log(`STDERR: ${err.stderr}`);
        return false;
    }
}

function confirmAction(message) {
    if (force) {
        warning('Skipping confirmation due to --force flag');
        return true;
    }
    
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    return new Promise((resolve) => {
        rl.question(`${message} (y/N): `, (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
    });
}

async function main() {
    try {
        log('='.repeat(60), colors.bright);
        log('ROLE MIGRATION EXECUTION SCRIPT', colors.bright);
        log('='.repeat(60), colors.bright);
        
        // Check prerequisites
        checkPrerequisites();
        
        // Run test script
        info('Step 1: Running migration test script');
        const testSuccess = runSqlScript(config.testScript, 'Migration test script');
        
        if (!testSuccess) {
            error('Migration test failed. Aborting migration.');
            process.exit(1);
        }
        
        if (testOnly) {
            success('Test-only mode completed successfully');
            info(`Log file: ${config.logFile}`);
            return;
        }
        
        // Confirm migration execution
        log('='.repeat(60), colors.yellow);
        warning('IMPORTANT: You are about to execute the role migration on the production database!');
        warning('This will change the role system from 13 roles to 6 roles.');
        warning('Make sure you have:');
        warning('1. Reviewed the test results above');
        warning('2. Verified the migration infrastructure is set up');
        warning('3. Informed all users about potential brief downtime');
        warning('4. Have a rollback plan ready');
        log('='.repeat(60), colors.yellow);
        
        const confirmed = await confirmAction('Do you want to proceed with the migration?');
        
        if (!confirmed) {
            info('Migration cancelled by user');
            return;
        }
        
        // Execute migration
        info('Step 2: Executing role migration');
        const migrationSuccess = runSqlScript(config.migrationScript, 'Role migration script');
        
        if (!migrationSuccess) {
            error('Role migration failed!');
            error('Check the logs and consider rollback if necessary');
            process.exit(1);
        }
        
        // Success
        log('='.repeat(60), colors.green);
        success('ROLE MIGRATION COMPLETED SUCCESSFULLY!');
        log('='.repeat(60), colors.green);
        
        info('Next steps:');
        info('1. Test user authentication with new roles');
        info('2. Update RLS policies to use new role system (Task 3)');
        info('3. Verify application functionality');
        info('4. Monitor system performance');
        
        info(`Complete log available at: ${config.logFile}`);
        
    } catch (err) {
        error(`Unexpected error: ${err.message}`);
        process.exit(1);
    }
}

// Handle process termination
process.on('SIGINT', () => {
    warning('Migration interrupted by user');
    process.exit(1);
});

process.on('SIGTERM', () => {
    warning('Migration terminated');
    process.exit(1);
});

// Run the script
main().catch(err => {
    error(`Fatal error: ${err.message}`);
    process.exit(1);
});