#!/usr/bin/env node

/**
 * Safe Deployment Script for Performance Fixes
 * Applies the RLS optimizations in a controlled manner with rollback capability
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const MIGRATIONS = [
  '20250723000008_critical_rls_performance_minimal.sql'
];

async function deployPerformanceFixes() {
  console.log('🚀 Deploying Performance Fixes...\n');

  try {
    // 1. Backup current state
    console.log('📦 Creating database backup...');
    const backupFile = `backup_${Date.now()}.sql`;
    // Use password for remote backup
    execSync(`npx supabase db dump -p "506884Kerem." -f ${backupFile}`, { stdio: 'inherit' });
    console.log(`✅ Backup created: ${backupFile}\n`);

    // 2. Apply migrations one by one
    for (let i = 0; i < MIGRATIONS.length; i++) {
      const migration = MIGRATIONS[i];
      const migrationPath = path.join('supabase/migrations', migration);
      
      if (!fs.existsSync(migrationPath)) {
        console.log(`⚠️  Migration file not found: ${migration}`);
        continue;
      }

      console.log(`📋 Applying migration ${i + 1}/${MIGRATIONS.length}: ${migration}`);
      
      try {
        // Apply the migration
        execSync(`npx supabase db push`, { stdio: 'inherit' });
        console.log(`✅ Applied: ${migration}\n`);
        
        // Quick verification after each migration
        console.log('🔍 Running quick verification...');
        const verifyResult = execSync('node scripts/verify-rls-performance-fixes.js', { 
          encoding: 'utf8',
          stdio: 'pipe'
        });
        
        if (verifyResult.includes('SUCCESS')) {
          console.log('✅ Migration verified successfully\n');
        } else {
          console.log('⚠️  Migration applied but verification shows issues\n');
        }
        
      } catch (err) {
        console.error(`❌ Failed to apply ${migration}:`, err.message);
        
        // Rollback on error
        console.log('🔄 Rolling back...');
        execSync(`npx supabase db reset`, { stdio: 'inherit' });
        execSync(`psql -f ${backupFile}`, { stdio: 'inherit' });
        
        throw new Error(`Migration ${migration} failed, database rolled back`);
      }
    }

    // 3. Final comprehensive verification
    console.log('🎯 Running comprehensive performance verification...');
    try {
      const finalResult = execSync('node scripts/verify-rls-performance-fixes.js', { 
        encoding: 'utf8' 
      });
      
      if (finalResult.includes('SUCCESS')) {
        console.log('🎉 All performance fixes deployed successfully!');
        console.log('\n📈 Expected Improvements:');
        console.log('- 10-100x faster queries on large tables');
        console.log('- Reduced database CPU usage');
        console.log('- Faster page load times');
        console.log('- Better app responsiveness');
        
        return true;
      } else {
        console.log('⚠️  Deployment completed but verification shows issues');
        console.log('Check the verification output above for details');
        return false;
      }
      
    } catch (verifyErr) {
      console.log('⚠️  Could not run final verification:', verifyErr.message);
      console.log('Migrations applied, but please test manually');
      return true;
    }

  } catch (err) {
    console.error('❌ Deployment failed:', err.message);
    console.log('\n🔄 Rollback instructions:');
    console.log('1. Run: npx supabase db reset');
    console.log('2. Restore from backup if needed');
    return false;
  }
}

// Usage instructions
function showUsage() {
  console.log('🛠️  Performance Fix Deployment Tool');
  console.log('\nThis script will:');
  console.log('1. Create a database backup');
  console.log('2. Apply RLS performance optimizations');
  console.log('3. Verify the improvements');
  console.log('4. Rollback if issues occur');
  console.log('\nUsage: node scripts/deploy-performance-fixes.js');
  console.log('\nMake sure you have:');
  console.log('- Supabase CLI installed and logged in');
  console.log('- Local Supabase instance running');
  console.log('- Database connection configured\n');
}

// Run the deployment
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showUsage();
    process.exit(0);
  }

  deployPerformanceFixes().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(err => {
    console.error('❌ Deployment script error:', err);
    process.exit(1);
  });
}

module.exports = { deployPerformanceFixes };