const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
);

async function verifyUserProfiles() {
  console.log('🔍 VERIFYING USER PROFILES');
  console.log('===========================\n');

  try {
    // Get user profiles
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('*')
      .in('email', [
        'admin@formulapm.com',
        'owner@formulapm.com',
        'pm@formulapm.com',
        'client@formulapm.com',
        'subcontractor@formulapm.com'
      ])
      .order('email');

    if (error) {
      console.error('❌ Error fetching user profiles:', error.message);
      return;
    }

    console.log(`✅ Found ${profiles.length} user profiles with @formulapm.com domain\n`);

    profiles.forEach(profile => {
      console.log(`📋 Profile: ${profile.email}`);
      console.log(`   Role: ${profile.role}`);
      console.log(`   Name: ${profile.first_name} ${profile.last_name}`);
      console.log(`   ID: ${profile.id}`);
      console.log(`   Created: ${profile.created_at}`);
      console.log('');
    });

    // Verify auth users exist
    console.log('🔐 VERIFYING AUTH USERS');
    console.log('=======================\n');

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

    // Verify linkage
    console.log('🔗 VERIFYING USER PROFILE LINKAGE');
    console.log('================================\n');

    let linkageCount = 0;
    for (const profile of profiles) {
      const authUser = formulapmUsers.find(u => u.id === profile.id);
      if (authUser) {
        console.log(`✅ ${profile.email}: Profile linked to auth user`);
        linkageCount++;
      } else {
        console.log(`❌ ${profile.email}: Profile NOT linked to auth user`);
      }
    }

    console.log(`\n📊 SUMMARY:`);
    console.log(`Auth Users: ${formulapmUsers.length}`);
    console.log(`User Profiles: ${profiles.length}`);
    console.log(`Properly Linked: ${linkageCount}`);
    console.log(`Status: ${linkageCount === 5 ? '✅ ALL LINKED' : '❌ SOME UNLINKED'}`);

  } catch (error) {
    console.error('❌ Verification error:', error.message);
  }
}

verifyUserProfiles();