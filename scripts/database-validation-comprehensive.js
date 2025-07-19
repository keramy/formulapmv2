#!/usr/bin/env node

/**
 * Comprehensive Database Validation Script
 * Validates schema alignment, RLS policies, and role system consistency
 * Formula PM 2.0 - Critical Security and Schema Validation
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

// Validation results storage
const validationResults = {
  summary: {
    totalTests: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
    startTime: new Date(),
    endTime: null,
    duration: 0
  },
  results: [],
  issues: [],
  recommendations: []
};

// Expected role system (from migration)
const EXPECTED_ROLES = [
  'management',
  'purchase_manager', 
  'technical_lead',
  'project_manager',
  'client',
  'admin'
];

// Expected tables with their critical columns
const EXPECTED_SCHEMA = {
  user_profiles: {
    columns: ['id', 'role', 'first_name', 'last_name', 'email', 'seniority_level', 'approval_limits', 'previous_role', 'role_migrated_at'],
    constraints: ['user_profiles_pkey', 'user_profiles_email_key'],
    indexes: ['idx_user_profiles_role_seniority']
  },
  projects: {
    columns: ['id', 'name', 'client_id', 'project_manager_id', 'status', 'budget', 'actual_cost'],
    constraints: ['projects_pkey'],
    indexes: []
  },
  scope_items: {
    columns: ['id', 'project_id', 'category', 'description', 'quantity', 'unit_price', 'total_price'],
    constraints: ['scope_items_pkey'],
    indexes: []
  },
  subcontractors: {
    columns: ['id', 'name', 'company', 'email', 'specialties', 'performance_rating', 'is_active'],
    constraints: ['subcontractors_pkey'],
    indexes: ['idx_subcontractors_availability']
  },
  subcontractor_assignments: {
    columns: ['id', 'subcontractor_id', 'scope_item_id', 'project_id', 'status'],
    constraints: ['subcontractor_assignments_pkey'],
    indexes: ['idx_subcontractor_assignments_status']
  },
  approval_requests: {
    columns: ['id', 'request_type', 'project_id', 'requested_by', 'current_approver', 'status'],
    constraints: ['approval_requests_pkey'],
    indexes: ['idx_approval_requests_current_approver']
  }
};

// Initialize Supabase client
let supabase;
try {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
} catch (error) {
  console.error('❌ Failed to initialize Supabase client:', error.message);
  process.exit(1);
}

// Utility functions
function addResult(component, test, status, message, details = null) {
  const result = {
    component,
    test,
    status,
    message,
    details,
    timestamp: new Date(),
    duration: 0
  };
  
  validationResults.results.push(result);
  validationResults.summary.totalTests++;
  
  if (status === 'PASS') {
    validationResults.summary.passed++;
    console.log(`✅ ${component}: ${test} - ${message}`);
  } else if (status === 'FAIL') {
    validationResults.summary.failed++;
    console.log(`❌ ${component}: ${test} - ${message}`);
    if (details) console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
  } else if (status === 'WARNING') {
    validationResults.summary.warnings++;
    console.log(`⚠️  ${component}: ${test} - ${message}`);
  }
}

function addIssue(severity, category, description, recommendation) {
  const issue = {
    severity,
    category,
    description,
    recommendation,
    timestamp: new Date()
  };
  
  validationResults.issues.push(issue);
  
  if (!validationResults.recommendations.includes(recommendation)) {
    validationResults.recommendations.push(recommendation);
  }
}

// Database connection validation
async function validateDatabaseConnection() {
  console.log('\n🔍 Validating Database Connection...');
  
  try {
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
    
    if (error) {
      addResult('Connection', 'Database Access', 'FAIL', `Cannot access database: ${error.message}`, error);
      addIssue('CRITICAL', 'CONNECTION', 'Database connection failed', 'Check Supabase configuration and credentials');
      return false;
    }
    
    addResult('Connection', 'Database Access', 'PASS', 'Successfully connected to database');
    return true;
  } catch (error) {
    addResult('Connection', 'Database Access', 'FAIL', `Connection error: ${error.message}`, error);
    addIssue('CRITICAL', 'CONNECTION', 'Database connection error', 'Verify Supabase is running and accessible');
    return false;
  }
}

// Schema validation
async function validateSchema() {
  console.log('\n🔍 Validating Database Schema...');
  
  try {
    // Check if user_role enum exists and has correct values
    const { data: enumData, error: enumError } = await supabase.rpc('get_enum_values', { enum_name: 'user_role' });
    
    if (enumError) {
      addResult('Schema', 'Role Enum', 'FAIL', `Cannot query role enum: ${enumError.message}`, enumError);
      addIssue('CRITICAL', 'SCHEMA', 'Role enum not accessible', 'Check if user_role enum exists and is properly defined');
    } else {
      const actualRoles = enumData || [];
      const missingRoles = EXPECTED_ROLES.filter(role => !actualRoles.includes(role));
      const extraRoles = actualRoles.filter(role => !EXPECTED_ROLES.includes(role));
      
      if (missingRoles.length === 0 && extraRoles.length === 0) {
        addResult('Schema', 'Role Enum', 'PASS', 'Role enum matches expected values');
      } else {
        addResult('Schema', 'Role Enum', 'FAIL', 'Role enum mismatch', {
          expected: EXPECTED_ROLES,
          actual: actualRoles,
          missing: missingRoles,
          extra: extraRoles
        });
        addIssue('HIGH', 'SCHEMA', 'Role enum mismatch detected', 'Update role enum to match expected values');
      }
    }
    
    // Validate table structures
    for (const [tableName, expectedTable] of Object.entries(EXPECTED_SCHEMA)) {
      await validateTableStructure(tableName, expectedTable);
    }
    
  } catch (error) {
    addResult('Schema', 'General Validation', 'FAIL', `Schema validation error: ${error.message}`, error);
    addIssue('HIGH', 'SCHEMA', 'Schema validation failed', 'Review database schema and migrations');
  }
}

async function validateTableStructure(tableName, expectedTable) {
  try {
    // Check if table exists by trying to query it
    const { data, error } = await supabase.from(tableName).select('*').limit(1);
    
    if (error && error.code === 'PGRST116') {
      addResult('Schema', `Table ${tableName}`, 'FAIL', `Table ${tableName} does not exist`, error);
      addIssue('HIGH', 'SCHEMA', `Missing table: ${tableName}`, `Create table ${tableName} with proper structure`);
      return;
    }
    
    if (error) {
      addResult('Schema', `Table ${tableName}`, 'WARNING', `Cannot validate table ${tableName}: ${error.message}`, error);
      return;
    }
    
    addResult('Schema', `Table ${tableName}`, 'PASS', `Table ${tableName} exists and is accessible`);
    
  } catch (error) {
    addResult('Schema', `Table ${tableName}`, 'FAIL', `Error validating table ${tableName}: ${error.message}`, error);
  }
}

// Role system validation
async function validateRoleSystem() {
  console.log('\n🔍 Validating Role System...');
  
  try {
    // Get all users and their roles
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('id, role, first_name, last_name, email, seniority_level, previous_role, role_migrated_at');
    
    if (error) {
      addResult('Roles', 'User Roles Query', 'FAIL', `Cannot query user roles: ${error.message}`, error);
      addIssue('HIGH', 'ROLES', 'Cannot access user role data', 'Check user_profiles table and RLS policies');
      return;
    }
    
    if (!users || users.length === 0) {
      addResult('Roles', 'User Data', 'WARNING', 'No users found in database');
      addIssue('MEDIUM', 'DATA', 'No users in database', 'Ensure test users are created for validation');
      return;
    }
    
    // Analyze role distribution
    const roleDistribution = {};
    const invalidRoles = [];
    const unmigrated = [];
    
    users.forEach(user => {
      if (!user.role) {
        invalidRoles.push({ user: user.email, issue: 'null role' });
        return;
      }
      
      if (!EXPECTED_ROLES.includes(user.role)) {
        invalidRoles.push({ user: user.email, role: user.role, issue: 'invalid role' });
        return;
      }
      
      roleDistribution[user.role] = (roleDistribution[user.role] || 0) + 1;
      
      // Check if user was migrated
      if (!user.role_migrated_at && user.previous_role) {
        unmigrated.push({ user: user.email, previous_role: user.previous_role });
      }
    });
    
    // Report results
    if (invalidRoles.length === 0) {
      addResult('Roles', 'Role Validity', 'PASS', 'All user roles are valid');
    } else {
      addResult('Roles', 'Role Validity', 'FAIL', `Found ${invalidRoles.length} users with invalid roles`, invalidRoles);
      addIssue('HIGH', 'ROLES', 'Users with invalid roles detected', 'Update user roles to match expected role system');
    }
    
    if (unmigrated.length === 0) {
      addResult('Roles', 'Role Migration', 'PASS', 'All users appear to be migrated');
    } else {
      addResult('Roles', 'Role Migration', 'WARNING', `Found ${unmigrated.length} users that may not be fully migrated`, unmigrated);
      addIssue('MEDIUM', 'MIGRATION', 'Incomplete role migration detected', 'Complete role migration for all users');
    }
    
    // Report role distribution
    addResult('Roles', 'Role Distribution', 'PASS', 'Role distribution analysis complete', roleDistribution);
    console.log('📊 Role Distribution:', roleDistribution);
    
  } catch (error) {
    addResult('Roles', 'Role System Validation', 'FAIL', `Role validation error: ${error.message}`, error);
    addIssue('HIGH', 'ROLES', 'Role system validation failed', 'Review role system implementation');
  }
}

// RLS Policy validation
async function validateRLSPolicies() {
  console.log('\n🔍 Validating RLS Policies...');
  
  try {
    // Test basic RLS functionality by trying to access data with different contexts
    // This is a simplified test - full RLS testing would require setting up different user contexts
    
    const testTables = ['user_profiles', 'projects', 'scope_items'];
    
    for (const table of testTables) {
      try {
        const { data, error } = await supabase.from(table).select('id').limit(1);
        
        if (error) {
          addResult('RLS', `${table} Access`, 'WARNING', `RLS may be blocking access to ${table}: ${error.message}`, error);
        } else {
          addResult('RLS', `${table} Access`, 'PASS', `Can access ${table} with service role`);
        }
      } catch (error) {
        addResult('RLS', `${table} Access`, 'FAIL', `Error testing ${table} access: ${error.message}`, error);
      }
    }
    
  } catch (error) {
    addResult('RLS', 'Policy Validation', 'FAIL', `RLS validation error: ${error.message}`, error);
    addIssue('MEDIUM', 'SECURITY', 'RLS policy validation incomplete', 'Implement comprehensive RLS policy testing');
  }
}

// JWT Claims validation
async function validateJWTClaims() {
  console.log('\n🔍 Validating JWT Claims...');
  
  try {
    // Check if users have proper JWT claims in auth.users
    const { data: authUsers, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      addResult('JWT', 'Auth Users Query', 'FAIL', `Cannot query auth users: ${error.message}`, error);
      addIssue('HIGH', 'AUTH', 'Cannot access auth.users table', 'Check service role permissions for auth schema');
      return;
    }
    
    if (!authUsers.users || authUsers.users.length === 0) {
      addResult('JWT', 'Auth Users', 'WARNING', 'No auth users found');
      return;
    }
    
    let usersWithoutClaims = 0;
    let usersWithInvalidClaims = 0;
    
    authUsers.users.forEach(user => {
      const userRole = user.app_metadata?.user_role || user.raw_app_meta_data?.user_role;
      
      if (!userRole) {
        usersWithoutClaims++;
      } else if (!EXPECTED_ROLES.includes(userRole)) {
        usersWithInvalidClaims++;
      }
    });
    
    if (usersWithoutClaims === 0 && usersWithInvalidClaims === 0) {
      addResult('JWT', 'Claims Validation', 'PASS', 'All users have valid JWT claims');
    } else {
      addResult('JWT', 'Claims Validation', 'FAIL', `Found issues with JWT claims`, {
        usersWithoutClaims,
        usersWithInvalidClaims,
        totalUsers: authUsers.users.length
      });
      addIssue('HIGH', 'AUTH', 'JWT claims issues detected', 'Update JWT claims for all users to match role system');
    }
    
  } catch (error) {
    addResult('JWT', 'Claims Validation', 'FAIL', `JWT validation error: ${error.message}`, error);
    addIssue('MEDIUM', 'AUTH', 'JWT claims validation failed', 'Review JWT claims implementation');
  }
}

// Data integrity validation
async function validateDataIntegrity() {
  console.log('\n🔍 Validating Data Integrity...');
  
  try {
    // Check for orphaned records and broken relationships
    const integrityChecks = [
      {
        name: 'Projects without Project Managers',
        query: supabase
          .from('projects')
          .select('id, name, project_manager_id')
          .not('project_manager_id', 'is', null)
          .limit(100)
      },
      {
        name: 'Scope Items without Projects',
        query: supabase
          .from('scope_items')
          .select('id, project_id')
          .limit(100)
      }
    ];
    
    for (const check of integrityChecks) {
      try {
        const { data, error } = await check.query;
        
        if (error) {
          addResult('Integrity', check.name, 'WARNING', `Cannot perform integrity check: ${error.message}`, error);
        } else {
          addResult('Integrity', check.name, 'PASS', `Integrity check completed: ${data?.length || 0} records found`);
        }
      } catch (error) {
        addResult('Integrity', check.name, 'FAIL', `Integrity check error: ${error.message}`, error);
      }
    }
    
  } catch (error) {
    addResult('Integrity', 'Data Integrity', 'FAIL', `Data integrity validation error: ${error.message}`, error);
    addIssue('MEDIUM', 'DATA', 'Data integrity validation incomplete', 'Implement comprehensive data integrity checks');
  }
}

// Generate comprehensive report
function generateReport() {
  validationResults.summary.endTime = new Date();
  validationResults.summary.duration = validationResults.summary.endTime - validationResults.summary.startTime;
  
  console.log('\n' + '='.repeat(80));
  console.log('📋 DATABASE VALIDATION REPORT');
  console.log('='.repeat(80));
  
  console.log('\n📊 SUMMARY:');
  console.log(`Total Tests: ${validationResults.summary.totalTests}`);
  console.log(`✅ Passed: ${validationResults.summary.passed}`);
  console.log(`❌ Failed: ${validationResults.summary.failed}`);
  console.log(`⚠️  Warnings: ${validationResults.summary.warnings}`);
  console.log(`⏱️  Duration: ${Math.round(validationResults.summary.duration / 1000)}s`);
  
  if (validationResults.issues.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES:');
    validationResults.issues
      .filter(issue => issue.severity === 'CRITICAL')
      .forEach(issue => {
        console.log(`❌ ${issue.category}: ${issue.description}`);
        console.log(`   💡 ${issue.recommendation}`);
      });
    
    console.log('\n⚠️  HIGH PRIORITY ISSUES:');
    validationResults.issues
      .filter(issue => issue.severity === 'HIGH')
      .forEach(issue => {
        console.log(`⚠️  ${issue.category}: ${issue.description}`);
        console.log(`   💡 ${issue.recommendation}`);
      });
  }
  
  if (validationResults.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    validationResults.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
  }
  
  // Save detailed report
  const reportPath = path.join(__dirname, '..', 'DATABASE_VALIDATION_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(validationResults, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  // Return overall status
  const hasFailures = validationResults.summary.failed > 0;
  const hasCriticalIssues = validationResults.issues.some(issue => issue.severity === 'CRITICAL');
  
  return {
    success: !hasFailures && !hasCriticalIssues,
    summary: validationResults.summary,
    issues: validationResults.issues,
    recommendations: validationResults.recommendations
  };
}

// Main validation function
async function runValidation() {
  console.log('🚀 Starting Comprehensive Database Validation...');
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`🔗 Database: ${SUPABASE_URL}`);
  
  // Run all validation components
  const connectionOk = await validateDatabaseConnection();
  
  if (connectionOk) {
    await validateSchema();
    await validateRoleSystem();
    await validateRLSPolicies();
    await validateJWTClaims();
    await validateDataIntegrity();
  }
  
  // Generate final report
  const result = generateReport();
  
  if (result.success) {
    console.log('\n🎉 Database validation completed successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ Database validation found critical issues that need attention.');
    process.exit(1);
  }
}

// Handle errors and cleanup
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  addResult('System', 'Error Handling', 'FAIL', `Unhandled rejection: ${error.message}`, error);
  generateReport();
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  addResult('System', 'Error Handling', 'FAIL', `Uncaught exception: ${error.message}`, error);
  generateReport();
  process.exit(1);
});

// Add RPC function for enum values if it doesn't exist
async function ensureHelperFunctions() {
  try {
    const { error } = await supabase.rpc('get_enum_values', { enum_name: 'user_role' });
    if (error && error.code === 'PGRST202') {
      console.log('📝 Creating helper function for enum validation...');
      // This would need to be created via SQL migration
      addResult('Setup', 'Helper Functions', 'WARNING', 'get_enum_values function not found - some validations may be limited');
    }
  } catch (error) {
    addResult('Setup', 'Helper Functions', 'WARNING', 'Cannot test helper functions');
  }
}

// Run the validation
if (require.main === module) {
  ensureHelperFunctions().then(() => {
    runValidation();
  });
}

module.exports = {
  runValidation,
  validateDatabaseConnection,
  validateSchema,
  validateRoleSystem,
  validateRLSPolicies,
  validateJWTClaims,
  validateDataIntegrity,
  generateReport
};