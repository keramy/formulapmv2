// Direct API test script
const http = require('http');

const testProjectAPI = async () => {
  const projectId = 'e1eda0dc-d09e-4aab-a2ff-83085b121e5b';
  
  // First test the milestones API (we know this works)
  console.log('🔍 Testing milestones API (should work)...');
  const milestonesResponse = await fetch(`http://localhost:3003/api/projects/${projectId}/milestones`);
  console.log(`📡 Milestones API: ${milestonesResponse.status} ${milestonesResponse.statusText}`);
  
  // Then test the individual project API (this should be fixed)
  console.log('🔍 Testing individual project API (should be fixed)...');
  const projectResponse = await fetch(`http://localhost:3003/api/projects/${projectId}`);
  console.log(`📡 Individual Project API: ${projectResponse.status} ${projectResponse.statusText}`);
  
  if (!projectResponse.ok) {
    const errorText = await projectResponse.text();
    console.log(`❌ Error response: ${errorText}`);
  } else {
    const data = await projectResponse.json();
    console.log(`✅ Success response: ${JSON.stringify(data, null, 2)}`);
  }
};

testProjectAPI().catch(console.error);