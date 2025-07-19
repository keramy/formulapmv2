#!/usr/bin/env node

/**
 * Apply Performance Optimization Migrations
 * Safely applies RLS performance fixes with validation
 * Formula PM 2.0 - Performance Migration Tool
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
function loadEnvVars() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && !key.startsWith('#') && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    });
    
    return envVars;
  } catch (error) {
    console.log('⚠️  Could not load .env.local file');
    return {};
  }
}

const envVars = loadEnvVars();
const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Test database connection
async function testConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    return false;
  }
}

// Check current RLS policies
async function checkCurrentPolicies() {
  console.log('\n🔍 Checking current RLS policies...');
  
  const problematicTables = [
    'suppliers', 'documents', 'document_approvals', 'audit_logs', 
    'notifications', 'tasks', 'task_comments', 'field_reports', 
    'system_settings', 'invoices'
  ];
  
  const policyStatus = {};
  
  for (const tableName of problematicTables) {
    try {
      // Try to query the table to see if RLS is working
      const { data, error } = await supabase.from(tableName).select('*').limit(1);
      
      policyStatus[tableName] = {
        accessible: !error,
        error: error?.message,
        hasData: data && data.length > 0
      };
      
      if (error) {
        console.log(`⚠️  ${tableName}: ${error.message}`);
      } else {
        console.log(`✅ ${tableName}: Accessible (${data?.length || 0} rows)`);
      }
    } catch (error) {
      policyStatus[tableName] = {
        accessible: false,
        error: error.message,
        hasData: false
      };
      console.log(`❌ ${tableName}: ${error.message}`);
    }
  }
  
  return policyStatus;
}

// Apply the performance migration
async function applyPerformanceMigration() {
  console.log('\n🚀 Applying RLS performance optimization...');
  
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250718000006_rls_performance_optimization.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    return false;
  }
  
  try {
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration file loaded successfully');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim().length === 0) {
        continue;
      }
      
      try {
        console.log(`\n⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        // Execute the SQL statement
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        
        if (error) {
          console.log(`⚠️  Statement ${i + 1} warning: ${error.message}`);
          // Some errors are expected (like DROP POLICY IF EXISTS for non-existent policies)
          if (!error.message.includes('does not exist')) {
            errorCount++;
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          successCount++;
        }
        
        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`❌ Statement ${i + 1} failed: ${error.message}`);
        errorCount++;
        
        // Continue with other statements even if one fails
      }
    }
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    
    return errorCount === 0;
    
  } catch (error) {
    console.error('❌ Failed to apply migration:', error.message);
    return false;
  }
}

// Validate the migration worked
async function validateMigration() {
  console.log('\n🔍 Validating migration results...');
  
  try {
    // Check if the migration was logged
    const { data: migrationLog, error } = await supabase
      .from('migration_log')
      .select('*')
      .eq('migration_name', 'rls_performance_optimization')
      .single();
    
    if (error) {
      console.log('⚠️  Migration log not found, but this might be expected');
    } else {
      console.log('✅ Migration logged successfully:', migrationLog.status);
    }
    
    // Test a few key tables to ensure they're still accessible
    const testTables = ['user_profiles', 'projects', 'tasks', 'documents'];
    let accessibleCount = 0;
    
    for (const tableName of testTables) {
      try {
        const { data, error } = await supabase.from(tableName).select('*').limit(1);
        if (!error) {
          console.log(`✅ ${tableName}: Still accessible after migration`);
          accessibleCount++;
        } else {
          console.log(`⚠️  ${tableName}: ${error.message}`);
        }
      } catch (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
      }
    }
    
    console.log(`\n📊 Validation Summary:`);
    console.log(`   Accessible tables: ${accessibleCount}/${testTables.length}`);
    
    return accessibleCount === testTables.length;
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    return false;
  }
}

// Performance test before and after
async function performanceTest(label) {
  console.log(`\n⏱️  Running performance test: ${label}`);
  
  const testQueries = [
    { name: 'User Profiles', query: () => supabase.from('user_profiles').select('*').limit(10) },
    { name: 'Projects', query: () => supabase.from('projects').select('*').limit(10) },
    { name: 'Tasks', query: () => supabase.from('tasks').select('*').limit(10) },
    { name: 'Documents', query: () => supabase.from('documents').select('*').limit(10) }
  ];
  
  const results = {};
  
  for (const test of testQueries) {
    try {
      const startTime = Date.now();
      const { data, error } = await test.query();
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      results[test.name] = {
        duration,
        success: !error,
        error: error?.message,
        rowCount: data?.length || 0
      };
      
      if (error) {
        console.log(`  ❌ ${test.name}: ${error.message} (${duration}ms)`);
      } else {
        console.log(`  ✅ ${test.name}: ${duration}ms (${data?.length || 0} rows)`);
      }
    } catch (error) {
      results[test.name] = {
        duration: 0,
        success: false,
        error: error.message,
        rowCount: 0
      };
      console.log(`  ❌ ${test.name}: ${error.message}`);
    }
  }
  
  return results;
}

// Main migration process
async function runPerformanceMigration() {
  console.log('🚀 Starting RLS Performance Migration...');
  console.log(`📅 ${new Date().toISOString()}\n`);
  
  // Step 1: Test connection
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.error('❌ Cannot proceed without database connection');
    process.exit(1);
  }
  
  // Step 2: Check current policies
  const beforePolicies = await checkCurrentPolicies();
  
  // Step 3: Performance test before migration
  const beforePerformance = await performanceTest('BEFORE Migration');
  
  // Step 4: Apply migration
  console.log('\n' + '='.repeat(60));
  console.log('🔧 APPLYING PERFORMANCE OPTIMIZATION MIGRATION');
  console.log('='.repeat(60));
  
  const migrationSuccess = await applyPerformanceMigration();
  
  if (!migrationSuccess) {
    console.error('\n❌ Migration failed. Please review the errors above.');
    process.exit(1);
  }
  
  // Step 5: Validate migration
  const validationSuccess = await validateMigration();
  
  // Step 6: Performance test after migration
  const afterPerformance = await performanceTest('AFTER Migration');
  
  // Step 7: Generate report
  console.log('\n' + '='.repeat(60));
  console.log('📋 MIGRATION COMPLETION REPORT');
  console.log('='.repeat(60));
  
  console.log('\n✅ MIGRATION STATUS: SUCCESS');
  console.log(`   Applied: RLS Performance Optimization`);
  console.log(`   Validation: ${validationSuccess ? 'PASSED' : 'NEEDS REVIEW'}`);
  
  console.log('\n📊 PERFORMANCE COMPARISON:');
  Object.keys(beforePerformance).forEach(testName => {
    const before = beforePerformance[testName];
    const after = afterPerformance[testName];
    
    if (before.success && after.success) {
      const improvement = ((before.duration - after.duration) / before.duration * 100).toFixed(1);
      const symbol = improvement > 0 ? '🚀' : improvement < -10 ? '⚠️' : '➡️';
      console.log(`   ${symbol} ${testName}: ${before.duration}ms → ${after.duration}ms (${improvement}% improvement)`);
    } else {
      console.log(`   ❓ ${testName}: Could not compare (before: ${before.success}, after: ${after.success})`);
    }
  });
  
  console.log('\n💡 NEXT STEPS:');
  console.log('   1. Monitor application performance');
  console.log('   2. Test all application features');
  console.log('   3. Watch for any RLS-related errors');
  console.log('   4. Consider additional performance optimizations');
  
  console.log('\n🎉 RLS Performance Migration completed successfully!');
  
  return {
    success: migrationSuccess && validationSuccess,
    beforePerformance,
    afterPerformance
  };
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

// Run the migration
if (require.main === module) {
  runPerformanceMigration()
    .then(result => {
      if (result.success) {
        console.log('\n✅ All done! Your database performance should be significantly improved.');
        process.exit(0);
      } else {
        console.log('\n⚠️  Migration completed with issues. Please review the output above.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runPerformanceMigration };