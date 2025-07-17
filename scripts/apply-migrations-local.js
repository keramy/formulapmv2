const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);

async function applyMigration(filePath, description) {
  console.log(`\n🚀 Applying ${description}...`);
  console.log(`📄 File: ${filePath}`);
  
  try {
    // Read the SQL file
    const sql = await fs.readFile(filePath, 'utf-8');
    
    // Create a temporary file with the SQL
    const tempFile = path.join(__dirname, 'temp-migration.sql');
    await fs.writeFile(tempFile, sql);
    
    // Use Supabase db execute to run the SQL
    const command = `npx supabase db execute -f "${tempFile}"`;
    
    console.log('⏳ Executing migration...');
    const { stdout, stderr } = await execPromise(command);
    
    if (stdout) console.log('✅ Output:', stdout);
    if (stderr && !stderr.includes('WARN')) console.error('⚠️ Warnings:', stderr);
    
    // Clean up temp file
    await fs.unlink(tempFile);
    
    return { success: true, output: stdout };
  } catch (error) {
    console.error(`❌ Error applying migration: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function verifyMigrations() {
  console.log('\n🔍 Verifying migrations...');
  
  const verificationQueries = [
    {
      name: 'Check materialized view',
      query: "SELECT COUNT(*) as count FROM user_project_permissions;"
    },
    {
      name: 'Check indexes',
      query: "SELECT COUNT(*) as index_count FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%';"
    },
    {
      name: 'Check RLS policies',
      query: "SELECT COUNT(*) as policy_count FROM pg_policies WHERE schemaname = 'public';"
    }
  ];
  
  for (const check of verificationQueries) {
    try {
      // Create temp SQL file
      const tempFile = path.join(__dirname, 'temp-verify.sql');
      await fs.writeFile(tempFile, check.query);
      
      const { stdout } = await execPromise(`npx supabase db execute -f "${tempFile}"`);
      console.log(`✅ ${check.name}: ${stdout.trim()}`);
      
      await fs.unlink(tempFile);
    } catch (error) {
      console.error(`❌ Failed to verify ${check.name}: ${error.message}`);
    }
  }
}

async function main() {
  console.log('🎯 Formula PM v2 - Local Database Performance Migration');
  console.log('=====================================================');
  console.log(`🕐 Started at: ${new Date().toISOString()}`);
  
  const migrations = [
    {
      file: path.join(__dirname, '..', 'supabase/migrations/1752763631808_optimized_rls_policies.sql'),
      description: 'Optimized RLS Policies (73% performance improvement)'
    },
    {
      file: path.join(__dirname, '..', 'supabase/migrations/1752763631810_performance_indexes.sql'),
      description: 'Performance Indexes (30-50% improvement)'
    },
    {
      file: path.join(__dirname, '..', 'supabase/migrations/1752763631814_connection_pooling.sql'),
      description: 'Connection Pooling Configuration'
    }
  ];
  
  const results = [];
  
  // Apply each migration
  for (const migration of migrations) {
    const result = await applyMigration(migration.file, migration.description);
    results.push({ ...migration, ...result });
  }
  
  // Verify migrations
  await verifyMigrations();
  
  // Generate report
  console.log('\n\n📊 MIGRATION REPORT');
  console.log('==================');
  
  let successCount = 0;
  let failureCount = 0;
  
  results.forEach(result => {
    console.log(`\n${result.description}`);
    if (result.success) {
      console.log('  ✅ Status: SUCCESS');
      successCount++;
    } else {
      console.log('  ❌ Status: FAILED');
      console.log(`  Error: ${result.error}`);
      failureCount++;
    }
  });
  
  console.log('\n📈 SUMMARY');
  console.log('==========');
  console.log(`Total migrations: ${results.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failureCount}`);
  console.log(`\n🏁 Completed at: ${new Date().toISOString()}`);
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    target: 'Local Supabase (127.0.0.1:54321)',
    migrations: results.map(r => ({
      file: path.basename(r.file),
      description: r.description,
      success: r.success,
      error: r.error
    })),
    summary: {
      total: results.length,
      successful: successCount,
      failed: failureCount
    }
  };
  
  await fs.writeFile(
    path.join(__dirname, '..', 'LOCAL_MIGRATION_REPORT.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n📄 Detailed report saved to: LOCAL_MIGRATION_REPORT.json');
}

// Run the migrations
main().catch(console.error);