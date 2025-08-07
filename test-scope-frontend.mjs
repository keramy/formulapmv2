import fetch from 'node-fetch'

async function testScopeFrontendIssues() {
  console.log('🔍 Testing Scope Frontend Issues...\n')
  
  try {
    // Step 1: Check if the scope page returns valid HTML
    console.log('1️⃣ Checking scope page HTML...')
    const response = await fetch('http://localhost:3003/scope', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    })

    if (response.ok) {
      const html = await response.text()
      
      // Check for specific error patterns
      const hasNextError = html.includes('Application error') || html.includes('500')
      const hasReactError = html.includes('Error') && html.includes('React')
      const hasAuthError = html.includes('useAuth') || html.includes('authentication')
      const hasImpersonationError = html.includes('impersonat') || html.includes('isImpersonating')
      const hasHydrationError = html.includes('Hydration') || html.includes('hydration')
      const hasFetchError = html.includes('fetch') && html.includes('failed')
      
      console.log('   📄 Page structure analysis:')
      console.log('   - Next.js App detected:', html.includes('__NEXT_DATA__'))
      console.log('   - Script tags found:', (html.match(/<script/g) || []).length)
      console.log('   - Error patterns:')
      console.log('     • Application/500 errors:', hasNextError)
      console.log('     • React errors:', hasReactError)
      console.log('     • Auth errors:', hasAuthError)
      console.log('     • Impersonation errors:', hasImpersonationError)
      console.log('     • Hydration errors:', hasHydrationError)
      console.log('     • Fetch errors:', hasFetchError)
      
      if (hasImpersonationError) {
        console.log('   ⚠️ FOUND IMPERSONATION REFERENCES!')
        // Find the specific references
        const lines = html.split('\n')
        lines.forEach((line, index) => {
          if (line.includes('impersonat') || line.includes('isImpersonating')) {
            console.log(`     Line ${index + 1}: ${line.trim().substring(0, 100)}...`)
          }
        })
      }
      
      if (hasAuthError) {
        console.log('   ⚠️ Potential auth-related errors found')
      }
      
      // Check if the page contains the expected content
      const hasExpectedContent = html.includes('Scope Management') || html.includes('scope-management')
      console.log('   - Contains expected content:', hasExpectedContent)
      
    } else {
      console.log(`   ❌ Failed to load page: ${response.status}`)
    }

    console.log()

    // Step 2: Test if it's a client-side vs server-side issue
    console.log('2️⃣ Testing client-side fetch simulation...')
    
    // Simulate what the browser would do
    const mockHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
    
    // Test the same calls a browser would make
    const apiTests = [
      { name: 'Auth Status', url: 'http://localhost:3003/api/auth/status' },
      { name: 'Scope Overview', url: 'http://localhost:3003/api/scope/overview' },
      { name: 'Scope List', url: 'http://localhost:3003/api/scope' }
    ]
    
    for (const test of apiTests) {
      try {
        const apiResponse = await fetch(test.url, {
          headers: mockHeaders
        })
        
        console.log(`   ${test.name}: ${apiResponse.status} ${apiResponse.statusText}`)
        
        if (!apiResponse.ok && apiResponse.status === 401) {
          console.log('     → Authentication required (expected for non-authenticated call)')
        } else if (!apiResponse.ok) {
          const errorText = await apiResponse.text()
          console.log(`     → Error: ${errorText.substring(0, 200)}`)
        }
      } catch (err) {
        console.log(`   ${test.name}: ❌ ${err.message}`)
      }
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message)
  }
}

testScopeFrontendIssues()