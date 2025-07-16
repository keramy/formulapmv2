const { createClient } = require('@supabase/supabase-js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const client = createClient('http://127.0.0.1:54321', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0');

console.log('Testing full authentication flow...');

async function testAuth() {
  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: 'admin@formulapm.com',
      password: 'testpass123'
    });
    
    if (error) {
      console.error('Login error:', error);
      return;
    }
    
    console.log('Login successful! User:', data.user?.email);
    console.log('Access token length:', data.session?.access_token?.length);
    
    // Test protected endpoint
    const response = await fetch('http://localhost:3003/api/auth/diagnostics', {
      headers: {
        'Authorization': `Bearer ${data.session?.access_token}`
      }
    });
    
    if (!response.ok) {
      console.error('API test failed:', response.status, response.statusText);
      const text = await response.text();
      console.error('Response:', text);
    } else {
      const result = await response.json();
      console.log('API test successful:', result);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAuth();