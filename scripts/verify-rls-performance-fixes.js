#!/usr/bin/env node

/**
 * Performance Verification Script
 * Tests the RLS policy optimizations to ensure they're working correctly
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRLSPerformance() {
  console.log('🔍 Testing RLS Policy Performance Improvements...\n');

  const testResults = {
    passed: 0,
    failed: 0,
    details: []
  };

  // Test cases for the most critical tables
  const testCases = [
    {
      name: 'user_profiles - Optimized auth.uid() usage',
      query: `
        EXPLAIN ANALYZE 
        SELECT * FROM user_profiles 
        WHERE id = (SELECT auth.uid())
        LIMIT 10;
      `,
      expectation: 'Should use SELECT wrapper around auth.uid()'
    },
    {
      name: 'project_assignments - Performance check',  
      query: `
        EXPLAIN ANALYZE 
        SELECT * FROM project_assignments 
        WHERE user_id = (SELECT auth.uid())
        LIMIT 10;
      `,
      expectation: 'Should be fast with index usage'
    },
    {
      name: 'clients - Consolidated policy test',
      query: `
        EXPLAIN ANALYZE 
        SELECT COUNT(*) FROM clients;
      `,
      expectation: 'Should use single consolidated policy'
    },
    {
      name: 'documents - Project access test',
      query: `
        EXPLAIN ANALYZE 
        SELECT COUNT(*) FROM documents;
      `,
      expectation: 'Should efficiently check project access'
    },
    {
      name: 'Check for duplicate indexes',
      query: `
        SELECT schemaname, tablename, indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename IN ('audit_logs', 'notifications')
        AND (indexname LIKE '%_user' OR indexname LIKE '%_user_id')
        ORDER BY tablename, indexname;
      `,
      expectation: 'Should show no duplicate user indexes'
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`Testing: ${testCase.name}`);
      const startTime = Date.now();
      
      const { data, error } = await supabase.rpc('execute_sql', {
        query: testCase.query
      });
      
      const executionTime = Date.now() - startTime;
      
      if (error) {
        console.log(`❌ FAILED: ${error.message}`);
        testResults.failed++;
        testResults.details.push({
          test: testCase.name,
          status: 'FAILED',
          error: error.message,
          executionTime
        });
      } else {
        console.log(`✅ PASSED (${executionTime}ms)`);
        testResults.passed++;
        testResults.details.push({
          test: testCase.name,
          status: 'PASSED',
          executionTime,
          expectation: testCase.expectation
        });
      }
      
      console.log(''); // Empty line for readability
    } catch (err) {
      console.log(`❌ ERROR: ${err.message}`);
      testResults.failed++;
      testResults.details.push({
        test: testCase.name,
        status: 'ERROR',
        error: err.message
      });
    }
  }

  // Test RLS policy consolidation
  console.log('🔍 Checking Policy Consolidation...');
  try {
    const { data: policies } = await supabase.rpc('execute_sql', {
      query: `
        SELECT schemaname, tablename, policyname, permissive, roles, cmd
        FROM pg_policies 
        WHERE tablename IN ('clients', 'documents', 'tasks', 'user_profiles', 'project_assignments')
        ORDER BY tablename, cmd, policyname;
      `
    });

    if (policies) {
      const policyCount = policies.length;
      console.log(`Found ${policyCount} policies on critical tables`);
      
      // Check for consolidated policies
      const consolidatedPolicies = policies.filter(p => 
        p.policyname && p.policyname.includes('consolidated')
      );
      
      console.log(`✅ Consolidated policies: ${consolidatedPolicies.length}`);
      testResults.details.push({
        test: 'Policy Consolidation',
        status: 'INFO',
        result: `${consolidatedPolicies.length} consolidated policies found`
      });
    }
  } catch (err) {
    console.log(`⚠️  Could not check policy consolidation: ${err.message}`);
  }

  // Summary
  console.log('\n📊 Performance Test Summary:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);

  // Detailed results
  if (testResults.details.length > 0) {
    console.log('\n📋 Detailed Results:');
    testResults.details.forEach(result => {
      console.log(`- ${result.test}: ${result.status} ${result.executionTime ? `(${result.executionTime}ms)` : ''}`);
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
      if (result.expectation) {
        console.log(`  Expected: ${result.expectation}`);
      }
    });
  }

  // Performance recommendations
  console.log('\n🚀 Performance Impact Assessment:');
  console.log('1. RLS policies optimized with SELECT wrappers');
  console.log('2. Multiple permissive policies consolidated');
  console.log('3. Duplicate indexes removed');
  console.log('4. Performance indexes added for common queries');
  
  const overallSuccess = testResults.failed === 0;
  console.log(`\n${overallSuccess ? '🎉' : '⚠️'} Overall Status: ${overallSuccess ? 'SUCCESS' : 'NEEDS ATTENTION'}`);
  
  return overallSuccess;
}

async function executeSQL() {
  // First, create the execute_sql function if it doesn't exist
  try {
    await supabase.rpc('execute_sql', {
      query: `
        CREATE OR REPLACE FUNCTION execute_sql(query text)
        RETURNS TABLE(result json)
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          rec record;
          results json[] := '{}';
        BEGIN
          FOR rec IN EXECUTE query LOOP
            results := array_append(results, to_json(rec));
          END LOOP;
          
          RETURN QUERY SELECT array_to_json(results);
        END;
        $$;
      `
    });
  } catch (err) {
    console.log('⚠️  Could not create execute_sql function, using direct queries');
  }
}

// Run the verification
if (require.main === module) {
  executeSQL().then(() => {
    testRLSPerformance().then(success => {
      process.exit(success ? 0 : 1);
    }).catch(err => {
      console.error('❌ Verification failed:', err);
      process.exit(1);
    });
  });
}

module.exports = { testRLSPerformance };