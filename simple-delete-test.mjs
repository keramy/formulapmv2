#!/usr/bin/env node

/**
 * Simple DELETE API response format test
 * This tests the response structure without requiring authentication
 */

const API_BASE = 'http://localhost:3003';

async function testDeleteResponse() {
  console.log('🧪 Testing DELETE API response format...\n');
  
  try {
    // Test DELETE endpoint with invalid ID to see response format
    console.log('Testing DELETE with invalid project ID...');
    const deleteResponse = await fetch(`${API_BASE}/api/projects/invalid-project-id`, {
      method: 'DELETE',
      headers: { 
        'Authorization': 'Bearer invalid-token' // This will fail auth, but we can see response format
      }
    });
    
    console.log(`📡 DELETE Response Status: ${deleteResponse.status} ${deleteResponse.statusText}`);
    console.log(`📡 DELETE Response Headers:`, Object.fromEntries(deleteResponse.headers.entries()));
    
    // Read the response body
    const responseText = await deleteResponse.text();
    console.log(`📡 DELETE Response Body (raw):`, responseText);
    
    if (responseText.trim()) {
      try {
        const responseData = JSON.parse(responseText);
        console.log(`📡 DELETE Response Body (parsed):`, JSON.stringify(responseData, null, 2));
        
        // Check if response has expected structure
        if ('success' in responseData && 'error' in responseData) {
          console.log('✅ DELETE endpoint returns properly structured JSON response!');
          console.log(`✅ Response structure: { success: ${responseData.success}, error: "${responseData.error}" }`);
        } else {
          console.log('❌ DELETE response missing expected structure (success, error fields)');
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

async function testGetResponse() {
  console.log('\n🧪 Testing GET API response format for comparison...\n');
  
  try {
    // Test GET endpoint with invalid ID to see response format
    console.log('Testing GET with invalid project ID...');
    const getResponse = await fetch(`${API_BASE}/api/projects/invalid-project-id`, {
      method: 'GET',
      headers: { 
        'Authorization': 'Bearer invalid-token' 
      }
    });
    
    console.log(`📡 GET Response Status: ${getResponse.status} ${getResponse.statusText}`);
    
    const responseText = await getResponse.text();
    console.log(`📡 GET Response Body (raw):`, responseText);
    
    if (responseText.trim()) {
      try {
        const responseData = JSON.parse(responseText);
        console.log(`📡 GET Response Body (parsed):`, JSON.stringify(responseData, null, 2));
        console.log('✅ GET endpoint returns structured JSON response');
      } catch (parseError) {
        console.log(`❌ GET response is not valid JSON: ${parseError.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ GET test failed:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Testing API response formats...\n');
  
  await testDeleteResponse();
  await testGetResponse();
  
  console.log('\n✅ Response format test completed!');
}

runTests().catch(console.error);