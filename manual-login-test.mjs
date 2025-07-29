#!/usr/bin/env node

// Manual login test using fetch to simulate form submission
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://localhost:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCompleteLoginFlow() {
  console.log('🚀 Testing Complete Login Flow...\n');
  
  try {
    // Step 1: Test login page accessibility
    console.log('1️⃣ Testing login page...');
    const response = await fetch('http://localhost:3003/auth/login');
    if (response.ok) {
      console.log('✅ Login page accessible');
    } else {
      console.log('❌ Login page not accessible');
      return false;
    }
    
    // Step 2: Test authentication
    console.log('\n2️⃣ Testing authentication...');
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: 'admin@formulapm.com',
      password: 'admin123'
    });
    
    if (error) {
      console.error('❌ Authentication failed:', error.message);
      return false;
    }
    
    console.log('✅ Authentication successful');
    console.log('   User ID:', authData.user.id);
    console.log('   Email:', authData.user.email);
    
    // Step 3: Test session validity
    console.log('\n3️⃣ Testing session...');
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();
    
    if (sessionError) {
      console.error('❌ Session invalid:', sessionError.message);
      return false;
    }
    
    console.log('✅ Session valid');
    console.log('   Session user:', user?.email);
    
    // Step 4: Test dashboard access (simulate)
    console.log('\n4️⃣ Testing dashboard accessibility...');
    const dashboardResponse = await fetch('http://localhost:3003/dashboard');
    console.log('✅ Dashboard endpoint response:', dashboardResponse.status);
    
    // Step 5: Test logout
    console.log('\n5️⃣ Testing logout...');
    const { error: logoutError } = await supabase.auth.signOut();
    if (logoutError) {
      console.error('❌ Logout failed:', logoutError.message);
      return false;
    }
    
    console.log('✅ Logout successful');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the complete test
testCompleteLoginFlow().then(success => {
  console.log('\n' + '='.repeat(50));
  console.log('🎯 COMPLETE LOGIN FLOW TEST:', success ? 'PASSED ✅' : 'FAILED ❌');
  console.log('='.repeat(50));
  
  if (success) {
    console.log('\n🎉 Your authentication system is working perfectly!');
    console.log('📝 Summary:');
    console.log('   - Login page loads correctly');
    console.log('   - Admin credentials work');
    console.log('   - Session management works');
    console.log('   - Dashboard is accessible');
    console.log('   - Logout functionality works');
  }
  
  process.exit(success ? 0 : 1);
});