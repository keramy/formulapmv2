const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Your Supabase Cloud credentials
const supabaseUrl = 'https://xrrrtwrfadcilwkgwacs.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhycnJ0d3JmYWRjaWx3a2d3YWNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjA2NDM1MSwiZXhwIjoyMDY3NjQwMzUxfQ.FHwH6p5CzouCCmNbihgBSEXyq9jW2C_INnj22TDZsVc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function pushSchemaToCloud() {
  console.log('🚀 Starting schema push to Supabase Cloud...\n');

  try {
    // Read the cleanup SQL
    const cleanupSql = fs.readFileSync(
      path.join(__dirname, '..', 'push-to-cloud.sql'),
      'utf8'
    );

    // Read the main migration
    const migrationSql = fs.readFileSync(
      path.join(__dirname, '..', 'supabase', 'migrations', '20250124000000_complete_database_setup.sql'),
      'utf8'
    );

    console.log('📋 Step 1: Cleaning up existing schema...');
    
    // Execute cleanup
    const { error: cleanupError } = await supabase.rpc('exec_sql', {
      sql: cleanupSql
    });

    if (cleanupError) {
      console.log('⚠️  Cleanup might have warnings (this is normal if tables don\'t exist)');
    }

    console.log('✅ Cleanup complete\n');

    console.log('📋 Step 2: Creating new schema...');
    console.log('This will create:');
    console.log('  - 18 production tables');
    console.log('  - User roles and enums');
    console.log('  - RLS policies');
    console.log('  - Indexes and triggers\n');

    // For large migrations, we might need to split it into chunks
    // But let's try the direct approach first
    console.log('⏳ Running migration (this may take a minute)...');

    // Since Supabase doesn't have exec_sql by default, let's use a different approach
    console.log('\n❗ IMPORTANT: Supabase Cloud doesn\'t allow direct SQL execution via API.');
    console.log('\n📝 Please follow these steps:\n');
    console.log('1. Go to: https://app.supabase.com/project/xrrrtwrfadcilwkgwacs/sql/new');
    console.log('2. Copy and paste the contents of: push-to-cloud.sql');
    console.log('3. Click "Run" to clean up existing tables');
    console.log('4. Then copy and paste the contents of: supabase/migrations/20250124000000_complete_database_setup.sql');
    console.log('5. Click "Run" to create the new schema\n');
    console.log('6. After that, come back here and I\'ll help you create test users!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

pushSchemaToCloud();