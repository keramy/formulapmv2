import { chromium } from 'playwright';

async function testAuthDetailed() {
  console.log('🎭 Starting detailed authentication test...\n');

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect all console messages
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(`${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  // Collect network failures
  const networkErrors = [];
  page.on('requestfailed', request => {
    networkErrors.push(`Failed: ${request.method()} ${request.url()} - ${request.failure().errorText}`);
  });

  try {
    console.log('📄 Step 1: Navigate to login page');
    await page.goto('http://localhost:3003/auth/login');
    await page.waitForLoadState('networkidle');
    
    console.log(`   Current URL: ${page.url()}`);
    
    // Get page title and check for errors
    const title = await page.title();
    console.log(`   Page title: ${title}`);
    
    await page.screenshot({ path: 'detailed-1-login-page.png' });

    console.log('📄 Step 2: Check page content');
    
    // Check for any visible text
    const bodyText = await page.locator('body').textContent();
    console.log(`   Page has content: ${bodyText.length > 0 ? 'Yes' : 'No'}`);
    
    if (bodyText.length > 0) {
      console.log(`   First 200 chars: ${bodyText.substring(0, 200)}...`);
    }

    // Check for specific elements
    const formExists = await page.locator('form').count();
    const emailExists = await page.locator('input[name="email"]').count();
    const passwordExists = await page.locator('input[name="password"]').count();
    
    console.log(`   Form elements found: form=${formExists}, email=${emailExists}, password=${passwordExists}`);

    if (formExists > 0 && emailExists > 0 && passwordExists > 0) {
      console.log('📄 Step 3: Test login submission');
      
      // Fill form
      await page.fill('input[name="email"]', 'test.admin@formulapm.com');
      await page.fill('input[name="password"]', 'testpass123');
      
      console.log('   Credentials filled');
      await page.screenshot({ path: 'detailed-2-form-filled.png' });
      
      // Submit form and wait for response
      await Promise.all([
        page.waitForNavigation({ timeout: 10000 }).catch(() => console.log('   No navigation occurred')),
        page.click('button[type="submit"]')
      ]);
      
      await page.waitForTimeout(2000); // Wait for any redirects
      
      const finalUrl = page.url();
      console.log(`   After submission: ${finalUrl}`);
      
      await page.screenshot({ path: 'detailed-3-after-submit.png' });
      
      // Check for error messages
      const alerts = await page.locator('[role="alert"]').allTextContents();
      if (alerts.length > 0) {
        console.log('   Error alerts found:');
        alerts.forEach(alert => console.log(`     - ${alert}`));
      }
      
      // Check URL params for errors
      const url = new URL(page.url());
      const errorParam = url.searchParams.get('error');
      if (errorParam) {
        console.log(`   URL error parameter: ${errorParam}`);
      }
      
    } else {
      console.log('   ❌ Login form not properly loaded');
    }

    console.log('📄 Step 4: Check console and network logs');
    
    if (consoleLogs.length > 0) {
      console.log('   Console messages:');
      consoleLogs.forEach(log => console.log(`     ${log}`));
    }
    
    if (networkErrors.length > 0) {
      console.log('   Network errors:');
      networkErrors.forEach(error => console.log(`     ${error}`));
    }

    // Test direct API call
    console.log('📄 Step 5: Test authentication API directly');
    
    const authResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('http://127.0.0.1:54321/auth/v1/token?grant_type=password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
          },
          body: JSON.stringify({
            email: 'test.admin@formulapm.com',
            password: 'testpass123'
          })
        });
        
        const data = await response.json();
        return { 
          ok: response.ok, 
          status: response.status, 
          data: response.ok ? { hasToken: !!data.access_token } : data 
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('   Direct API test result:', authResponse);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'detailed-error.png' });
  } finally {
    console.log('\n🎭 Detailed test completed.');
    await browser.close();
  }
}

testAuthDetailed();