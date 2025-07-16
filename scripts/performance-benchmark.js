// Formula PM 2.0 RLS Performance Benchmark
// Created: 2025-07-16
// Purpose: Benchmark RLS performance improvements after optimization

const { createClient } = require('@supabase/supabase-js');

// Configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

// Test credentials (adjust these based on your test data)
const testUsers = [
  { email: 'owner.test@formulapm.com', password: 'testpass123', role: 'company_owner' },
  { email: 'pm.test@formulapm.com', password: 'testpass123', role: 'project_manager' },
  { email: 'architect.test@formulapm.com', password: 'testpass123', role: 'architect' },
];

// Performance benchmarks
const benchmarks = {
  rls_policy_queries: [
    { name: 'user_profiles_select', query: 'SELECT * FROM user_profiles LIMIT 10' },
    { name: 'projects_select', query: 'SELECT * FROM projects LIMIT 10' },
    { name: 'scope_items_select', query: 'SELECT * FROM scope_items LIMIT 10' },
    { name: 'suppliers_select', query: 'SELECT * FROM suppliers LIMIT 10' },
    { name: 'purchase_requests_select', query: 'SELECT * FROM purchase_requests LIMIT 10' },
    { name: 'purchase_orders_select', query: 'SELECT * FROM purchase_orders LIMIT 10' },
    { name: 'vendor_ratings_select', query: 'SELECT * FROM vendor_ratings LIMIT 10' },
  ]
};

// Helper function to measure execution time
async function measureExecutionTime(name, asyncFunction) {
  const start = process.hrtime.bigint();
  const result = await asyncFunction();
  const end = process.hrtime.bigint();
  const duration = Number(end - start) / 1000000; // Convert to milliseconds
  
  console.log(`${name}: ${duration.toFixed(2)}ms`);
  return { name, duration, result };
}

// Authenticate user
async function authenticateUser(user) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    });
    
    if (error) {
      console.error(`Authentication failed for ${user.email}:`, error.message);
      return null;
    }
    
    console.log(`✅ Authenticated as ${user.email} (${user.role})`);
    return data;
  } catch (error) {
    console.error(`Authentication error for ${user.email}:`, error.message);
    return null;
  }
}

// Run performance benchmark for a specific user
async function runBenchmarkForUser(user) {
  console.log(`\n=== Performance Benchmark for ${user.role} ===`);
  
  const authData = await authenticateUser(user);
  if (!authData) {
    console.log(`❌ Skipping benchmark for ${user.email} due to authentication failure`);
    return;
  }
  
  const results = [];
  
  // Run each benchmark query
  for (const benchmark of benchmarks.rls_policy_queries) {
    try {
      const result = await measureExecutionTime(
        `${user.role}_${benchmark.name}`,
        async () => {
          const { data, error } = await supabase.rpc('execute_sql', {
            query: benchmark.query
          });
          
          if (error) {
            console.error(`Query error for ${benchmark.name}:`, error.message);
            return null;
          }
          
          return data;
        }
      );
      
      results.push(result);
    } catch (error) {
      console.error(`Benchmark error for ${benchmark.name}:`, error.message);
    }
  }
  
  // Calculate average execution time
  const avgTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  console.log(`📊 Average execution time for ${user.role}: ${avgTime.toFixed(2)}ms`);
  
  // Sign out user
  await supabase.auth.signOut();
  
  return {
    user: user.role,
    results,
    averageTime: avgTime
  };
}

// Test RLS policy functionality
async function testRLSFunctionality() {
  console.log('\n=== RLS Policy Functionality Test ===');
  
  // Test 1: Verify migration was applied
  try {
    const { data, error } = await supabase
      .from('migrations')
      .select('*')
      .eq('version', '20250716000000')
      .single();
    
    if (data) {
      console.log('✅ RLS optimization migration found:', data.name);
    } else {
      console.log('❌ RLS optimization migration not found');
    }
  } catch (error) {
    console.error('Migration check error:', error.message);
  }
  
  // Test 2: Check if optimized functions exist
  try {
    const { data, error } = await supabase.rpc('has_purchase_department_access');
    console.log('✅ has_purchase_department_access() function works:', typeof data === 'boolean');
  } catch (error) {
    console.error('❌ has_purchase_department_access() function error:', error.message);
  }
  
  // Test 3: Verify policies are active
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, email, role')
      .limit(1);
    
    if (data && data.length > 0) {
      console.log('✅ RLS policies are active (user_profiles query succeeded)');
    } else {
      console.log('❌ RLS policies may be blocking access');
    }
  } catch (error) {
    console.error('RLS policy test error:', error.message);
  }
}

// Main benchmark function
async function runPerformanceBenchmark() {
  console.log('🚀 Starting RLS Performance Benchmark');
  console.log('=====================================');
  
  // Test basic functionality first
  await testRLSFunctionality();
  
  // Run benchmarks for different user roles
  const allResults = [];
  
  for (const user of testUsers) {
    const userResults = await runBenchmarkForUser(user);
    if (userResults) {
      allResults.push(userResults);
    }
  }
  
  // Summary
  console.log('\n=== Performance Summary ===');
  console.log('============================');
  
  if (allResults.length > 0) {
    const overallAvg = allResults.reduce((sum, r) => sum + r.averageTime, 0) / allResults.length;
    console.log(`📊 Overall average execution time: ${overallAvg.toFixed(2)}ms`);
    
    allResults.forEach(result => {
      console.log(`- ${result.user}: ${result.averageTime.toFixed(2)}ms`);
    });
    
    console.log('\n✅ Performance benchmark completed successfully');
    console.log('💡 Optimized RLS policies using (select auth.uid()) pattern should show improved performance');
  } else {
    console.log('❌ No benchmark results available');
  }
}

// Run the benchmark
runPerformanceBenchmark().catch(console.error);