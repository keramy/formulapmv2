const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client for local development
const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
);

// Test with actual working accounts
const testAccounts = [
  {
    email: 'admin@formulapm.com',
    password: 'password123',
    role: 'admin',
    expectedRoute: '/dashboard'
  },
  {
    email: 'pm@formulapm.com',
    password: 'password123',
    role: 'project_manager',
    expectedRoute: '/dashboard'
  },
  {
    email: 'client@formulapm.com',
    password: 'password123',
    role: 'client',
    expectedRoute: '/client-portal'
  }
];

async function testAuthFlow() {
  console.log('=== Authentication Flow Test ===\n');
  
  for (const account of testAccounts) {
    console.log(`Testing: ${account.email} (${account.role})`);
    
    try {
      // Test authentication
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password
      });
      
      if (authError) {
        console.log(`❌ Authentication failed: ${authError.message}`);
        continue;
      }
      
      console.log(`✅ Authentication successful`);
      console.log(`   User ID: ${authData.user.id}`);
      console.log(`   Access token exists: ${!!authData.session.access_token}`);
      
      // Test profile access
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      
      if (profileError) {
        console.log(`⚠️  Profile access issue: ${profileError.message}`);
        console.log(`   Error details:`, profileError);
      } else {
        console.log(`✅ Profile accessible: ${profileData.first_name} ${profileData.last_name}`);
        console.log(`   Role: ${profileData.role}`);
        console.log(`   Expected route: ${account.expectedRoute}`);
      }
      
      // Test dashboard permissions
      console.log(`   Checking dashboard access permissions...`);
      const hasProjectsReadAll = ['admin', 'company_owner', 'general_manager', 'deputy_general_manager', 'technical_director'].includes(profileData.role);
      const hasProjectsReadAssigned = ['project_manager', 'architect', 'technical_engineer', 'purchase_director', 'purchase_specialist'].includes(profileData.role);
      
      console.log(`   Has projects.read.all: ${hasProjectsReadAll}`);
      console.log(`   Has projects.read.assigned: ${hasProjectsReadAssigned}`);
      console.log(`   Dashboard access: ${hasProjectsReadAll || hasProjectsReadAssigned ? 'Should work' : 'Should fail'}`);
      
      // Sign out
      await supabase.auth.signOut();
      
    } catch (error) {
      console.log(`❌ Test failed: ${error.message}`);
    }
    
    console.log('');
  }
}

// Run tests
testAuthFlow();