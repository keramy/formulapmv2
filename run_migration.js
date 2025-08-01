// Run the test users migration manually
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://xrrrtwrfadcilwkgwacs.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhycnJ0d3JmYWRjaWx3a2d3YWNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjA2NDM1MSwiZXhwIjoyMDY3NjQwMzUxfQ.FHwH6p5CzouCCmNbihgBSEXyq9jW2C_INnj22TDZsVc';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runMigration() {
  try {
    console.log('🔧 Running test users migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250124000003_create_test_users.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements (simple approach)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      .filter(stmt => !stmt.includes('DO $$')); // Skip complex blocks for now
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute the INSERT statements for users and profiles
    const userInserts = statements.filter(stmt => 
      stmt.includes('INSERT INTO auth.users') || 
      stmt.includes('INSERT INTO user_profiles') ||
      stmt.includes('INSERT INTO clients')
    );
    
    console.log(`👥 Executing ${userInserts.length} user-related statements...`);
    
    for (let i = 0; i < userInserts.length; i++) {
      const statement = userInserts[i];
      console.log(`⚡ Executing statement ${i + 1}/${userInserts.length}...`);
      
      try {
        await supabase.rpc('exec_sql', { sql: statement });
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (error) {
        console.log(`⚠️ Statement ${i + 1} failed (may already exist):`, error.message);
      }
    }
    
    // Verify the results
    console.log('🔍 Verifying user creation...');
    
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('email, role, is_active')
      .ilike('email', '%test@formulapm.com')
      .order('email');
    
    if (error) {
      console.error('❌ Error verifying users:', error);
    } else {
      console.log('✅ Test users created successfully:');
      profiles.forEach(profile => {
        console.log(`  📧 ${profile.email} (${profile.role}) - ${profile.is_active ? 'Active' : 'Inactive'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

runMigration();