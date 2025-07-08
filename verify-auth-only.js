const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role
const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function verifyAuthOnly() {
  console.log('🔐 VERIFYING AUTH USERS ONLY');
  console.log('============================\n');

  try {
    // Get auth users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError.message);
      return;
    }

    const formulapmUsers = users.filter(user => user.email?.endsWith('@formulapm.com'));
    console.log(`✅ Found ${formulapmUsers.length} auth users with @formulapm.com domain\n`);

    formulapmUsers.forEach(user => {
      console.log(`🔑 Auth User: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
      console.log('');
    });

    // Test each account
    console.log('🧪 TESTING AUTHENTICATION');
    console.log('=========================\n');

    const testAccounts = [
      'admin@formulapm.com',
      'owner@formulapm.com',
      'pm@formulapm.com',
      'client@formulapm.com',
      'subcontractor@formulapm.com'
    ];

    let successCount = 0;
    for (const email of testAccounts) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: 'password123'
        });

        if (error) {
          console.log(`❌ ${email}: ${error.message}`);
        } else {
          console.log(`✅ ${email}: Authentication successful`);
          successCount++;
        }

        // Sign out
        await supabase.auth.signOut();
      } catch (e) {
        console.log(`❌ ${email}: ${e.message}`);
      }
    }

    console.log(`\n📊 FINAL RESULTS:`);
    console.log(`Total accounts: ${testAccounts.length}`);
    console.log(`Successful logins: ${successCount}`);
    console.log(`Status: ${successCount === 5 ? '✅ ALL WORKING' : '❌ SOME FAILED'}`);

  } catch (error) {
    console.error('❌ Verification error:', error.message);
  }
}

verifyAuthOnly();