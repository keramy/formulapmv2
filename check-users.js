const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client for local development
const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function checkUsers() {
  console.log('=== Checking Existing Users ===\n');
  
  try {
    // List all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error listing users:', usersError.message);
      return;
    }
    
    console.log(`Found ${users.users.length} users in auth.users:\n`);
    
    for (const user of users.users) {
      console.log(`- ${user.email} (ID: ${user.id})`);
      console.log(`  Created: ${user.created_at}`);
      console.log(`  Email confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
      console.log('');
    }
    
    // Check user profiles
    console.log('=== Checking User Profiles ===\n');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*');
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError.message);
      return;
    }
    
    console.log(`Found ${profiles.length} user profiles:\n`);
    
    for (const profile of profiles) {
      console.log(`- ${profile.email} (${profile.role})`);
      console.log(`  Name: ${profile.first_name} ${profile.last_name}`);
      console.log(`  Active: ${profile.is_active}`);
      console.log(`  Profile ID: ${profile.id}`);
      console.log('');
    }
    
  } catch (error) {
    console.error('Error checking users:', error.message);
  }
}

// Run check
checkUsers();