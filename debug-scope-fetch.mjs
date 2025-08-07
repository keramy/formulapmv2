import fetch from 'node-fetch'

async function debugScopeFetchErrors() {
  console.log('🔍 Debugging Scope Management Fetch Errors...\n')
  
  try {
    // Step 1: Login to get access token
    console.log('1️⃣ Attempting login...')
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

    console.log(`   Login Status: ${loginResponse.status} ${loginResponse.statusText}`)

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`)
    }

    const loginData = await loginResponse.json()
    const token = loginData.data?.session?.access_token
    if (!token) {
      throw new Error('No access token received from login')
    }
    
    console.log('   ✅ Login successful, got access token\n')

    // Step 2: Test scope overview API (used by scope page)
    console.log('2️⃣ Testing scope overview API...')
    const overviewResponse = await fetch('http://localhost:3003/api/scope/overview', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    console.log(`   Overview Status: ${overviewResponse.status} ${overviewResponse.statusText}`)
    
    if (overviewResponse.ok) {
      const overviewData = await overviewResponse.json()
      console.log('   ✅ Overview API working')
      console.log('   📊 Data structure:', Object.keys(overviewData))
      if (overviewData.data?.overview) {
        console.log('   📈 Overview stats:', {
          total_items: overviewData.data.overview.total_items,
          total_projects: overviewData.data.overview.total_projects,
          user_assignments: overviewData.data.overview.user_assignments
        })
      }
    } else {
      const errorData = await overviewResponse.text()
      console.log('   ❌ Overview API failed')
      console.log('   Error response:', errorData.substring(0, 500))
    }

    console.log()

    // Step 3: Test scope list API (used by ScopeCoordinatorEnhanced)
    console.log('3️⃣ Testing scope list API...')
    const listResponse = await fetch('http://localhost:3003/api/scope', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    console.log(`   List Status: ${listResponse.status} ${listResponse.statusText}`)
    
    if (listResponse.ok) {
      const listData = await listResponse.json()
      console.log('   ✅ List API working')
      console.log('   📊 Items found:', listData.data?.items?.length || 0)
      console.log('   📊 Statistics:', listData.data?.statistics)
    } else {
      const errorData = await listResponse.text()
      console.log('   ❌ List API failed')
      console.log('   Error response:', errorData.substring(0, 500))
    }

    console.log()

    // Step 4: Test page accessibility
    console.log('4️⃣ Testing page accessibility...')
    const pageResponse = await fetch('http://localhost:3003/scope', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    console.log(`   Page Status: ${pageResponse.status} ${pageResponse.statusText}`)
    
    if (pageResponse.ok) {
      const pageContent = await pageResponse.text()
      const hasReactApp = pageContent.includes('__NEXT_DATA__')
      const hasErrors = pageContent.includes('Application error') || pageContent.includes('500') || pageContent.includes('Error')
      
      console.log('   ✅ Page loads')
      console.log('   📄 Has React App:', hasReactApp)
      console.log('   ❌ Has Errors:', hasErrors)
      
      if (hasErrors) {
        console.log('   ⚠️ Page contains error indicators')
      }
    } else {
      console.log('   ❌ Page failed to load')
    }

    console.log()
    console.log('🎯 Debug Summary:')
    console.log('   - Login: ✅')
    console.log(`   - Overview API: ${overviewResponse.ok ? '✅' : '❌'}`)
    console.log(`   - List API: ${listResponse.ok ? '✅' : '❌'}`)
    console.log(`   - Page Load: ${pageResponse.ok ? '✅' : '❌'}`)

  } catch (error) {
    console.error('💥 Debug failed:', error.message)
    console.error(error.stack)
  }
}

// Run the debug
debugScopeFetchErrors()