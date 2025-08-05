import fetch from 'node-fetch';

// Test login and navigation
async function testLoginAndNavigation() {
  console.log('1. Testing login endpoint...');
  
  // Login
  const loginResponse = await fetch('http://localhost:3003/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'admin@formulapm.com',
      password: 'admin123'
    })
  });

  console.log('Login response:', loginResponse.status);
  const loginText = await loginResponse.text();
  console.log('Response headers:', loginResponse.headers.get('content-type'));
  
  let loginData;
  try {
    loginData = JSON.parse(loginText);
    console.log('Login data:', loginData);
  } catch (e) {
    console.log('Response is not JSON. First 200 chars:', loginText.substring(0, 200));
    return;
  }

  if (!loginData.access_token) {
    console.error('No access token received!');
    return;
  }

  // Test accessing projects with the token
  console.log('\n2. Testing projects endpoint with token...');
  const projectsResponse = await fetch('http://localhost:3003/api/projects', {
    headers: {
      'Authorization': `Bearer ${loginData.access_token}`
    }
  });

  console.log('Projects response:', projectsResponse.status);
  const projectsData = await projectsResponse.json();
  console.log('Number of projects:', Array.isArray(projectsData) ? projectsData.length : 'Not an array');
  
  if (Array.isArray(projectsData) && projectsData.length > 0) {
    const firstProject = projectsData[0];
    console.log('First project:', {
      id: firstProject.id,
      name: firstProject.name,
      status: firstProject.status
    });
    
    // Test project workspace endpoint
    console.log('\n3. Testing project workspace endpoint...');
    const projectId = firstProject.id;
    const workspaceResponse = await fetch(`http://localhost:3003/api/projects/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${loginData.access_token}`
      }
    });
    
    console.log('Workspace response:', workspaceResponse.status);
    const workspaceData = await workspaceResponse.json();
    console.log('Workspace data:', workspaceData);
  }
}

testLoginAndNavigation().catch(console.error);