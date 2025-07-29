import { chromium } from 'playwright';

async function testAuthFlow() {
  console.log('🎭 Starting authentication flow test...\n');

  const browser = await chromium.launch({ 
    headless: false, // Show browser window
    slowMo: 1000 // Slow down actions for visibility
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('📄 Step 1: Navigate to homepage');
    await page.goto('http://localhost:3003');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot
    await page.screenshot({ path: 'test-1-homepage.png' });
    console.log('   ✅ Homepage loaded');

    console.log('📄 Step 2: Navigate to login page');
    await page.goto('http://localhost:3003/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Check if we see login form or get redirected
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('   ⚠️  ISSUE: Redirected to dashboard without login!');
      await page.screenshot({ path: 'test-2-unexpected-redirect.png' });
      
      // Clear storage and try again
      console.log('📄 Step 3: Clear storage and retry');
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      await page.goto('http://localhost:3003/auth/login');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-3-after-storage-clear.png' });
    }

    console.log('📄 Step 4: Check for login form elements');
    
    // Check if login form is present
    const emailInput = await page.locator('input[name="email"]').count();
    const passwordInput = await page.locator('input[name="password"]').count();
    const submitButton = await page.locator('button[type="submit"]').count();
    
    console.log(`   Email input: ${emailInput > 0 ? '✅ Found' : '❌ Missing'}`);
    console.log(`   Password input: ${passwordInput > 0 ? '✅ Found' : '❌ Missing'}`);
    console.log(`   Submit button: ${submitButton > 0 ? '✅ Found' : '❌ Missing'}`);

    if (emailInput > 0 && passwordInput > 0 && submitButton > 0) {
      console.log('📄 Step 5: Fill in login credentials');
      
      await page.fill('input[name="email"]', 'test.admin@formulapm.com');
      await page.fill('input[name="password"]', 'testpass123');
      
      await page.screenshot({ path: 'test-4-credentials-filled.png' });
      
      console.log('📄 Step 6: Submit login form');
      await page.click('button[type="submit"]');
      
      // Wait for navigation or error
      await page.waitForLoadState('networkidle');
      
      const finalUrl = page.url();
      console.log(`   Final URL: ${finalUrl}`);
      
      if (finalUrl.includes('/dashboard')) {
        console.log('   ✅ Successfully logged in and redirected to dashboard');
        
        // Check for user info or dashboard content
        const welcomeText = await page.locator('text=Welcome back').count();
        console.log(`   Dashboard welcome: ${welcomeText > 0 ? '✅ Found' : '❌ Missing'}`);
        
        await page.screenshot({ path: 'test-5-dashboard-success.png' });
      } else if (finalUrl.includes('/login')) {
        console.log('   ❌ Login failed - still on login page');
        
        // Check for error messages
        const errorAlert = await page.locator('[role="alert"]').textContent().catch(() => 'No error found');
        console.log(`   Error message: ${errorAlert}`);
        
        await page.screenshot({ path: 'test-5-login-failed.png' });
      } else {
        console.log(`   ⚠️  Unexpected redirect to: ${finalUrl}`);
        await page.screenshot({ path: 'test-5-unexpected-final-url.png' });
      }
    } else {
      console.log('   ❌ Login form not found - cannot proceed with test');
    }

    console.log('📄 Step 7: Check console logs for errors');
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(`ERROR: ${msg.text()}`);
      }
    });
    
    if (logs.length > 0) {
      console.log('   Console errors found:');
      logs.forEach(log => console.log(`   ${log}`));
    } else {
      console.log('   ✅ No console errors detected');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-error.png' });
  } finally {
    console.log('\n🎭 Test completed. Screenshots saved to project root.');
    await browser.close();
  }
}

testAuthFlow();