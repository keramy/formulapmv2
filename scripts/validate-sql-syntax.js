#!/usr/bin/env node

/**
 * SQL Syntax Validation Script
 * Validates SQL files for basic syntax issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating SQL file syntax...\n');

const sqlFiles = [
    'scripts/migration-logging-system.sql',
    'scripts/comprehensive-backup-system.sql', 
    'scripts/migration-rollback-system.sql',
    'scripts/migration-validation-functions.sql',
    'scripts/setup-migration-infrastructure.sql'
];

let totalErrors = 0;

for (const filePath of sqlFiles) {
    console.log(`📄 Checking: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
        console.log(`❌ File not found: ${filePath}`);
        totalErrors++;
        continue;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const errors = [];
    
    // Basic syntax checks
    const lines = content.split('\n');
    let inFunction = false;
    let functionDepth = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineNum = i + 1;
        
        // Skip comments and empty lines
        if (line.startsWith('--') || line.startsWith('/*') || line === '') {
            continue;
        }
        
        // Check for unmatched parentheses in function definitions
        if (line.includes('CREATE OR REPLACE FUNCTION') || line.includes('CREATE FUNCTION')) {
            inFunction = true;
            functionDepth = 0;
        }
        
        if (inFunction) {
            functionDepth += (line.match(/\(/g) || []).length;
            functionDepth -= (line.match(/\)/g) || []).length;
            
            if (line.includes('$ LANGUAGE') && functionDepth === 0) {
                inFunction = false;
            }
        }
        
        // Check for common syntax issues
        if (line.includes('CREAT ') && !line.includes('CREATE')) {
            errors.push(`Line ${lineNum}: Possible typo in CREATE statement`);
        }
        
        if (line.includes('SLECT') || line.includes('SELCT')) {
            errors.push(`Line ${lineNum}: Possible typo in SELECT statement`);
        }
        
        if (line.includes('FORM ') && !line.includes('PERFORM')) {
            errors.push(`Line ${lineNum}: Possible typo in FROM statement`);
        }
        
        // Check for unmatched quotes (basic check)
        const singleQuotes = (line.match(/'/g) || []).length;
        if (singleQuotes % 2 !== 0 && !line.includes('$$')) {
            errors.push(`Line ${lineNum}: Possible unmatched single quotes`);
        }
    }
    
    // Check for basic structure
    if (!content.includes('CREATE') && !content.includes('\\i ')) {
        errors.push('File appears to be empty or missing CREATE statements');
    }
    
    if (errors.length === 0) {
        console.log('✅ Syntax validation passed');
    } else {
        console.log(`❌ Found ${errors.length} potential issues:`);
        errors.forEach(error => console.log(`   ${error}`));
        totalErrors += errors.length;
    }
    
    console.log('');
}

console.log(`🏁 Validation complete. Total issues found: ${totalErrors}`);

if (totalErrors === 0) {
    console.log('✅ All SQL files passed basic syntax validation!');
    console.log('\n📝 Next steps:');
    console.log('1. Set DATABASE_URL or SUPABASE_DB_URL environment variable');
    console.log('2. Run: node scripts/execute-infrastructure-setup.js');
    console.log('3. Verify setup with database queries');
} else {
    console.log('❌ Please fix syntax issues before proceeding');
    process.exit(1);
}