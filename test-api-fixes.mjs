#!/usr/bin/env node

/**
 * Quick test script to verify API fixes
 * Tests both DELETE endpoint response and authentication flow
 */

const API_BASE = 'http://localhost:3003';

// Test credentials (admin user)
const TEST_EMAIL = 'admin@formulapm.com';
const TEST_PASSWORD = 'admin123';

async function testDeleteEndpoint() {
  console.log('🧪 Testing DELETE API endpoint fix...\n');
  
  try {
    // 1. Sign in to get access token
    console.log('1. Signing in...');
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    
    // 2. Get projects list to find a project to test with
    console.log('2. Fetching projects...');
    const projectsResponse = await fetch(`${API_BASE}/api/projects`, {
      headers: { 'Authorization': `Bearer ${loginData.data.access_token}` }
    });
    
    if (!projectsResponse.ok) {
      throw new Error(`Projects fetch failed: ${projectsResponse.status}`);
    }
    
    const projectsData = await projectsResponse.json();
    console.log(`✅ Found ${projectsData.data.projects.length} projects`);
    
    if (projectsData.data.projects.length === 0) {
      console.log('⚠️ No projects found to test DELETE with');
      return;
    }
    
    // Find a test project or use the first one
    const testProject = projectsData.data.projects.find(p => p.name.includes('Test')) || projectsData.data.projects[0];
    console.log(`3. Testing DELETE with project: ${testProject.name} (${testProject.id})`);
    
    // 3. Test DELETE endpoint (this should return proper JSON now)
    const deleteResponse = await fetch(`${API_BASE}/api/projects/${testProject.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${loginData.data.access_token}` }
    });
    
    console.log(`📡 DELETE Response Status: ${deleteResponse.status} ${deleteResponse.statusText}`);
    console.log(`📡 DELETE Response Headers:`, Object.fromEntries(deleteResponse.headers.entries()));
    
    // Read the response body
    const responseText = await deleteResponse.text();
    console.log(`📡 DELETE Response Body (raw):`, responseText);
    
    if (responseText.trim()) {
      try {
        const responseData = JSON.parse(responseText);
        console.log(`📡 DELETE Response Body (parsed):`, responseData);
        
        if (responseData.success) {
          console.log('✅ DELETE endpoint now returns proper JSON response!');
          console.log(`✅ Deleted project: ${responseData.data?.deleted_project?.name || 'Unknown'}`);
        } else {
          console.log(`❌ DELETE failed: ${responseData.error}`);
        }
      } catch (parseError) {
        console.log(`❌ DELETE response is not valid JSON: ${parseError.message}`);
        console.log(`Raw response: "${responseText}"`);
      }
    } else {
      console.log('❌ DELETE returned empty response body');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testPageLoadOptimization() {
  console.log('\n🧪 Testing page load optimization...\n');
  
  try {
    // Test the main projects page load time
    console.log('1. Testing projects page load time...');
    const startTime = Date.now();
    
    const pageResponse = await fetch(`${API_BASE}/projects`);
    const endTime = Date.now();
    
    console.log(`✅ Projects page responded in ${endTime - startTime}ms`);
    console.log(`📡 Status: ${pageResponse.status} ${pageResponse.statusText}`);
    
    if (pageResponse.ok) {
      console.log('✅ Projects page loads without errors');
    } else {
      console.log(`❌ Projects page returned ${pageResponse.status}`);
    }
    
  } catch (error) {
    console.error('❌ Page load test failed:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting API fixes verification...\n');
  
  await testDeleteEndpoint();
  await testPageLoadOptimization();
  
  console.log('\n✅ Test suite completed!');
}

runTests().catch(console.error);