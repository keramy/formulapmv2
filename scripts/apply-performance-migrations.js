const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function executeSQLFile(filePath, description) {
  console.log(`\n🚀 Applying ${description}...`);
  console.log(`📄 File: ${filePath}`);
  
  try {
    // Read SQL file
    const sql = await fs.readFile(filePath, 'utf-8');
    
    // Split by semicolons but keep them for execution
    const statements = sql
      .split(/;\s*$/m)
      .filter(stmt => stmt.trim())
      .map(stmt => stmt.trim() + ';');
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip empty statements or comments only
      if (!statement.trim() || statement.trim().startsWith('--')) {
        continue;
      }
      
      // Log first 100 chars of statement
      const preview = statement.substring(0, 100).replace(/\n/g, ' ');
      console.log(`\n  [${i + 1}/${statements.length}] Executing: ${preview}...`);
      
      try {
        const { data, error } = await supabase.rpc('execute_sql', {
          query: statement
        });
        
        if (error) {
          // Try direct execution as fallback
          const directResult = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({ query: statement })
          });
          
          if (!directResult.ok) {
            throw new Error(`SQL execution failed: ${await directResult.text()}`);
          }
        }
        
        successCount++;
        console.log(`  ✅ Success`);
      } catch (error) {
        errorCount++;
        console.error(`  ❌ Error: ${error.message}`);
        
        // Continue with other statements even if one fails
        if (statement.includes('DROP POLICY') || statement.includes('IF EXISTS')) {
          console.log(`  ⚠️  Ignoring error for DROP/IF EXISTS statement`);
        }
      }
    }
    
    console.log(`\n📈 Summary for ${description}:`);
    console.log(`  ✅ Successful statements: ${successCount}`);
    console.log(`  ❌ Failed statements: ${errorCount}`);
    
    return { success: successCount, errors: errorCount };
    
  } catch (error) {
    console.error(`\n❌ Failed to read or execute ${filePath}: ${error.message}`);
    return { success: 0, errors: 1 };
  }
}

async function applyAllMigrations() {
  console.log('🎯 Formula PM v2 - Performance Migration Tool');
  console.log('============================================');
  console.log(`📍 Target: Local Supabase at ${supabaseUrl}`);
  console.log(`🕐 Started at: ${new Date().toISOString()}`);
  
  const migrations = [
    {
      file: 'supabase/migrations/1752763631808_optimized_rls_policies.sql',
      description: 'Optimized RLS Policies (73% performance improvement)'
    },
    {
      file: 'supabase/migrations/1752763631810_performance_indexes.sql',
      description: 'Performance Indexes (30-50% improvement)'
    },
    {
      file: 'supabase/migrations/1752763631814_connection_pooling.sql',
      description: 'Connection Pooling Configuration'
    }
  ];
  
  const results = [];
  
  for (const migration of migrations) {
    const result = await executeSQLFile(
      path.join(__dirname, '..', migration.file),
      migration.description
    );
    results.push({ ...migration, ...result });
  }
  
  // Generate report
  console.log('\n\n📊 MIGRATION REPORT');
  console.log('==================');
  
  let totalSuccess = 0;
  let totalErrors = 0;
  
  results.forEach(result => {
    console.log(`\n${result.description}`);
    console.log(`  File: ${result.file}`);
    console.log(`  ✅ Successful: ${result.success}`);
    console.log(`  ❌ Failed: ${result.errors}`);
    totalSuccess += result.success;
    totalErrors += result.errors;
  });
  
  console.log('\n📈 OVERALL SUMMARY');
  console.log('==================');
  console.log(`Total successful statements: ${totalSuccess}`);
  console.log(`Total failed statements: ${totalErrors}`);
  console.log(`Success rate: ${((totalSuccess / (totalSuccess + totalErrors)) * 100).toFixed(1)}%`);
  console.log(`\n🏁 Completed at: ${new Date().toISOString()}`);
  
  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    target: 'Local Supabase',
    url: supabaseUrl,
    migrations: results,
    summary: {
      totalSuccess,
      totalErrors,
      successRate: ((totalSuccess / (totalSuccess + totalErrors)) * 100).toFixed(1) + '%'
    }
  };
  
  await fs.writeFile(
    path.join(__dirname, '..', 'MIGRATION_REPORT.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n📄 Report saved to: MIGRATION_REPORT.json');
}

// Run migrations
applyAllMigrations().catch(console.error);