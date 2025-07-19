#!/usr/bin/env node

/**
 * Database Schema Validator
 * Validates schema alignment and role system consistency
 * Formula PM 2.0 - Critical Security and Schema Validation
 */

const fs = require('fs');
const path = require('path');

// Expected role system (from migration)
const EXPECTED_ROLES = [
  'management',
  'purchase_manager', 
  'technical_lead',
  'project_manager',
  'client',
  'admin'
];

// TypeScript role definitions from auth.ts
const TYPESCRIPT_ROLES = [
  'management',
  'purchase_manager',
  'technical_lead', 
  'project_manager',
  'client',
  'admin'
];

// Validation results
const issues = [];
const recommendations = [];

function addIssue(severity, category, description, recommendation, details = null) {
  issues.push({
    severity,
    category,
    description,
    recommendation,
    details,
    timestamp: new Date()
  });
  
  if (!recommendations.includes(recommendation)) {
    recommendations.push(recommendation);
  }
  
  const icon = severity === 'CRITICAL' ? '🚨' : severity === 'HIGH' ? '❌' : '⚠️';
  console.log(`${icon} ${severity}: ${description}`);
  if (details) {
    console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
  }
  console.log(`   💡 ${recommendation}\n`);
}

// Validate TypeScript type definitions
function validateTypeScriptTypes() {
  console.log('🔍 Validating TypeScript Type Definitions...\n');
  
  try {
    // Check auth.ts
    const authTypesPath = path.join(__dirname, '..', 'src', 'types', 'auth.ts');
    if (!fs.existsSync(authTypesPath)) {
      addIssue('HIGH', 'TYPES', 'auth.ts file not found', 'Create auth.ts with proper role definitions');
      return;
    }
    
    const authContent = fs.readFileSync(authTypesPath, 'utf8');
    
    // Check if all expected roles are defined
    const missingRoles = EXPECTED_ROLES.filter(role => !authContent.includes(`'${role}'`));
    if (missingRoles.length > 0) {
      addIssue('HIGH', 'TYPES', 'Missing roles in TypeScript definitions', 
        'Update UserRole type in auth.ts to include all roles', 
        { missingRoles });
    } else {
      console.log('✅ All expected roles found in auth.ts');
    }
    
    // Check database.ts
    const dbTypesPath = path.join(__dirname, '..', 'src', 'types', 'database.ts');
    if (fs.existsSync(dbTypesPath)) {
      const dbContent = fs.readFileSync(dbTypesPath, 'utf8');
      
      // Check for role consistency between files
      const dbMissingRoles = EXPECTED_ROLES.filter(role => !dbContent.includes(`'${role}'`));
      if (dbMissingRoles.length > 0) {
        addIssue('HIGH', 'TYPES', 'Role inconsistency between auth.ts and database.ts',
          'Ensure both files have identical role definitions',
          { missingInDatabase: dbMissingRoles });
      } else {
        console.log('✅ Role consistency between auth.ts and database.ts');
      }
    }
    
  } catch (error) {
    addIssue('HIGH', 'TYPES', 'Error validating TypeScript types', 
      'Review TypeScript type files for syntax errors', 
      { error: error.message });
  }
}

// Validate migration files
function validateMigrations() {
  console.log('🔍 Validating Migration Files...\n');
  
  try {
    const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      addIssue('CRITICAL', 'MIGRATIONS', 'Migrations directory not found', 
        'Ensure supabase/migrations directory exists');
      return;
    }
    
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`📁 Found ${migrationFiles.length} migration files`);
    
    // Check for role system migration
    const roleSystemMigrations = migrationFiles.filter(file => 
      file.includes('role') || file.includes('user_role')
    );
    
    if (roleSystemMigrations.length === 0) {
      addIssue('HIGH', 'MIGRATIONS', 'No role system migrations found',
        'Create migrations to implement the 5-role system');
    } else {
      console.log(`✅ Found ${roleSystemMigrations.length} role-related migrations:`);
      roleSystemMigrations.forEach(file => console.log(`   - ${file}`));
    }
    
    // Check latest role fix migration
    const latestRoleFix = migrationFiles.find(file => 
      file.includes('fix_role_system_mismatch')
    );
    
    if (latestRoleFix) {
      console.log(`✅ Found role system fix migration: ${latestRoleFix}`);
      
      // Validate the migration content
      const migrationPath = path.join(migrationsDir, latestRoleFix);
      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      
      // Check if all expected roles are in the migration
      const missingInMigration = EXPECTED_ROLES.filter(role => 
        !migrationContent.includes(`'${role}'`)
      );
      
      if (missingInMigration.length > 0) {
        addIssue('HIGH', 'MIGRATIONS', 'Migration missing expected roles',
          'Update role system migration to include all expected roles',
          { missingRoles: missingInMigration });
      } else {
        console.log('✅ Migration includes all expected roles');
      }
    } else {
      addIssue('HIGH', 'MIGRATIONS', 'Role system fix migration not found',
        'Create migration to fix role system mismatch');
    }
    
  } catch (error) {
    addIssue('HIGH', 'MIGRATIONS', 'Error validating migrations',
      'Review migration files for issues',
      { error: error.message });
  }
}

// Validate environment configuration
function validateEnvironment() {
  console.log('🔍 Validating Environment Configuration...\n');
  
  try {
    // Check for .env files
    const envFiles = ['.env.local', '.env.example', '.env.production'];
    const existingEnvFiles = envFiles.filter(file => 
      fs.existsSync(path.join(__dirname, '..', file))
    );
    
    console.log(`📁 Found environment files: ${existingEnvFiles.join(', ')}`);
    
    if (existingEnvFiles.length === 0) {
      addIssue('HIGH', 'CONFIG', 'No environment files found',
        'Create .env.local with proper Supabase configuration');
    }
    
    // Check if we can read basic config
    const envLocalPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envLocalPath)) {
      const envContent = fs.readFileSync(envLocalPath, 'utf8');
      
      const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'DATABASE_URL'
      ];
      
      const missingVars = requiredVars.filter(varName => 
        !envContent.includes(varName)
      );
      
      if (missingVars.length > 0) {
        addIssue('HIGH', 'CONFIG', 'Missing required environment variables',
          'Add missing environment variables to .env.local',
          { missingVars });
      } else {
        console.log('✅ All required environment variables found');
      }
    }
    
  } catch (error) {
    addIssue('MEDIUM', 'CONFIG', 'Error validating environment',
      'Review environment configuration files',
      { error: error.message });
  }
}

// Check for common misalignment patterns
function validateCommonIssues() {
  console.log('🔍 Checking for Common Misalignment Issues...\n');
  
  try {
    // Check for old role references in code
    const srcDir = path.join(__dirname, '..', 'src');
    if (fs.existsSync(srcDir)) {
      const oldRoles = [
        'company_owner',
        'general_manager', 
        'deputy_general_manager',
        'technical_director',
        'architect',
        'technical_engineer',
        'field_worker',
        'purchase_director',
        'purchase_specialist',
        'subcontractor'
      ];
      
      // This is a simplified check - in a real scenario, you'd want to recursively search files
      console.log('⚠️  Note: Manual code review needed to check for old role references');
      console.log('   Old roles to look for:', oldRoles.join(', '));
      
      addIssue('MEDIUM', 'CODE', 'Manual code review needed for old role references',
        'Search codebase for old role names and update to new role system');
    }
    
  } catch (error) {
    addIssue('MEDIUM', 'CODE', 'Error checking for common issues',
      'Manually review code for old role references',
      { error: error.message });
  }
}

// Generate report
function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📋 DATABASE SCHEMA VALIDATION REPORT');
  console.log('='.repeat(80));
  
  console.log('\n📊 SUMMARY:');
  console.log(`Total Issues Found: ${issues.length}`);
  
  const criticalIssues = issues.filter(i => i.severity === 'CRITICAL');
  const highIssues = issues.filter(i => i.severity === 'HIGH');
  const mediumIssues = issues.filter(i => i.severity === 'MEDIUM');
  
  console.log(`🚨 Critical: ${criticalIssues.length}`);
  console.log(`❌ High: ${highIssues.length}`);
  console.log(`⚠️  Medium: ${mediumIssues.length}`);
  
  if (issues.length === 0) {
    console.log('\n🎉 No schema validation issues found!');
  } else {
    console.log('\n💡 RECOMMENDATIONS:');
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
  }
  
  // Save detailed report
  const report = {
    summary: {
      totalIssues: issues.length,
      critical: criticalIssues.length,
      high: highIssues.length,
      medium: mediumIssues.length,
      timestamp: new Date()
    },
    issues,
    recommendations,
    expectedRoles: EXPECTED_ROLES,
    typescriptRoles: TYPESCRIPT_ROLES
  };
  
  const reportPath = path.join(__dirname, '..', 'SCHEMA_VALIDATION_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  return {
    success: criticalIssues.length === 0 && highIssues.length === 0,
    issues,
    recommendations
  };
}

// Main validation function
function runValidation() {
  console.log('🚀 Starting Database Schema Validation...');
  console.log(`📅 ${new Date().toISOString()}\n`);
  
  validateTypeScriptTypes();
  validateMigrations();
  validateEnvironment();
  validateCommonIssues();
  
  const result = generateReport();
  
  if (result.success) {
    console.log('\n🎉 Schema validation completed successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ Schema validation found issues that need attention.');
    console.log('Please address the high and critical issues before proceeding.');
    process.exit(1);
  }
}

// Run the validation
if (require.main === module) {
  runValidation();
}

module.exports = {
  runValidation,
  validateTypeScriptTypes,
  validateMigrations,
  validateEnvironment,
  generateReport
};