import fetch from 'node-fetch'

async function testScopeAPI() {
  console.log('🔍 Testing Scope Overview API...')
  
  try {
    // First, let's login to get a token
    console.log('🔐 Logging in...')
    const loginResponse = await fetch('http://localhost:3003/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@formulapm.com',
        password: 'admin123'
      })
    })

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`)
    }

    const loginData = await loginResponse.json()
    console.log('✅ Login successful')
    console.log('🔍 Login response structure:', JSON.stringify(loginData, null, 2))
    
    const token = loginData.session?.access_token || loginData.access_token || loginData.data?.session?.access_token
    if (!token) {
      console.error('❌ No access token found in login response')
      console.error('Available keys:', Object.keys(loginData))
      throw new Error('No access token received from login')
    }
    
    console.log('🎟️  Token received:', token ? `${token.substring(0, 20)}...` : 'Missing')

    // Now test the scope overview endpoint
    console.log('📊 Testing scope overview endpoint...')
    const scopeResponse = await fetch('http://localhost:3003/api/scope/overview', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('📈 Response status:', scopeResponse.status, scopeResponse.statusText)
    
    if (!scopeResponse.ok) {
      const errorText = await scopeResponse.text()
      console.error('❌ Scope API failed:', errorText)
      return
    }

    const scopeData = await scopeResponse.json()
    console.log('✅ Scope overview response:', JSON.stringify(scopeData, null, 2))
    
    if (scopeData.success) {
      console.log('🎉 Scope overview API is working correctly!')
      const overview = scopeData.data?.overview
      if (overview) {
        console.log('📊 Overview data:')
        console.log('  - Total items:', overview.total_items)
        console.log('  - Total projects:', overview.total_projects)
        console.log('  - Pending approvals:', overview.pending_approvals)
        console.log('  - User assignments:', overview.user_assignments)
        console.log('  - Categories:', Object.keys(overview.categories).length)
      }
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message)
    console.error(error.stack)
  }
}

// Run the test
testScopeAPI()