// Test authenticated API access to projects
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xrrrtwrfadcilwkgwacs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhycnJ0d3JmYWRjaWx3a2d3YWNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwNjQzNTEsImV4cCI6MjA2NzY0MDM1MX0.jpwI60kidUuko2zvp3SJSuuBxV1r1Ra2gfVJVi6oqHk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuthenticatedAPI() {
  try {
    console.log('🔐 Testing authentication with test user...');
    
    // Sign in with test user (from CLAUDE.md - working credentials)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'pm.test@formulapm.com',
      password: 'testpass123'
    });

    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      return;
    }

    console.log('✅ Authentication successful');
    console.log('👤 User:', authData.user.email);
    
    // Get access token
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    
    if (!accessToken) {
      console.error('❌ No access token received');
      return;
    }

    console.log('🎫 Access token received (length:', accessToken.length, ')');

    // Test API call with authentication
    console.log('📡 Testing /api/projects with authentication...');
    
    const response = await fetch('http://localhost:3003/api/projects?limit=5', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ API call successful!');
      console.log('📊 Projects returned:', result.data?.projects?.length || 0);
      console.log('📊 Total count:', result.data?.total_count || 0);
      
      if (result.data?.projects?.length > 0) {
        console.log('📝 First project:', result.data.projects[0].name);
      }
    } else {
      console.error('❌ API call failed:', result);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuthenticatedAPI();