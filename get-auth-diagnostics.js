const { createClient } = require('@supabase/supabase-js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const client = createClient('http://127.0.0.1:54321', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0');

async function getDiagnostics() {
  try {
    const { data } = await client.auth.signInWithPassword({
      email: 'admin@formulapm.com',
      password: 'testpass123'
    });
    
    const response = await fetch('http://localhost:3003/api/auth/diagnostics', {
      headers: {
        'Authorization': `Bearer ${data.session?.access_token}`
      }
    });
    
    const result = await response.json();
    console.log('Authentication Diagnostics:');
    console.log('=========================');
    console.log('Overall Status:', result.data.overall);
    console.log('\nChecks:');
    console.log(JSON.stringify(result.data.diagnostics.checks, null, 2));
    console.log('\nErrors:');
    console.log(JSON.stringify(result.data.diagnostics.errors, null, 2));
    console.log('\nRecommendations:');
    console.log(JSON.stringify(result.data.diagnostics.recommendations, null, 2));
  } catch (error) {
    console.error('Error getting diagnostics:', error);
  }
}

getDiagnostics();