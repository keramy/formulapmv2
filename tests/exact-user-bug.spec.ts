import { test, expect } from '@playwright/test';

test.describe('Exact User Bug Reproduction', () => {
  test('should reproduce the exact user experience: first click fails, second works', async ({ page }) => {
    console.log('🎯 Reproducing exact user bug scenario...');
    
    // Step 1: Login (exactly as user does)
    console.log('1️⃣ Login process...');
    await page.goto('http://localhost:3003/auth/login');
    await page.fill('input[type="email"]', 'admin@formulapm.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    console.log(`✅ Logged in, now on: ${page.url()}`);
    expect(page.url()).toContain('/dashboard');
    
    // Take screenshot of dashboard state
    await page.screenshot({ path: 'test-results/user-bug-01-dashboard.png' });
    
    // Step 2: Wait a bit (like user would) and then click Projects
    console.log('2️⃣ User waits, then clicks Projects tab for first time...');
    await page.waitForTimeout(2000); // User looks around dashboard
    
    const projectsTab = page.locator('a[href="/projects"]');
    await expect(projectsTab).toBeVisible();
    
    // Record URL before first click
    const urlBeforeClick = page.url();
    console.log(`📍 Before first click: ${urlBeforeClick}`);
    
    // FIRST CLICK (user reports this redirects back to dashboard)
    console.log('🖱️ FIRST CLICK on Projects...');
    await projectsTab.click();
    
    // Wait for any navigation/redirects to complete
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    const urlAfterFirstClick = page.url();
    console.log(`📍 After FIRST click: ${urlAfterFirstClick}`);
    await page.screenshot({ path: 'test-results/user-bug-02-after-first-click.png' });
    
    // Check if we're back on dashboard (the bug user reported)
    if (urlAfterFirstClick.includes('/dashboard')) {
      console.log('🐛 BUG REPRODUCED: First click went back to dashboard!');
      
      // Step 3: User clicks again (second time)
      console.log('3️⃣ User frustrated, clicks Projects AGAIN...');
      await page.waitForTimeout(1000); // User pauses, frustrated
      
      console.log('🖱️ SECOND CLICK on Projects...');
      await projectsTab.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
      
      const urlAfterSecondClick = page.url();
      console.log(`📍 After SECOND click: ${urlAfterSecondClick}`);
      await page.screenshot({ path: 'test-results/user-bug-03-after-second-click.png' });
      
      if (urlAfterSecondClick.includes('/projects')) {
        console.log('✅ SECOND CLICK WORKED: Now on projects page');
        console.log('🔍 BUG PATTERN CONFIRMED: First click fails, second click works');
      } else {
        console.log('❌ SECOND CLICK ALSO FAILED');
      }
      
      // This test should fail because first click should work
      expect(urlAfterFirstClick).toContain('/projects');
      
    } else if (urlAfterFirstClick.includes('/projects')) {
      console.log('✅ FIRST CLICK WORKED: Went to projects correctly');
      console.log('ℹ️ Bug might be fixed or not reproducible in this test');
      expect(urlAfterFirstClick).toContain('/projects');
    } else {
      console.log(`❓ UNEXPECTED BEHAVIOR: Went to ${urlAfterFirstClick}`);
    }
  });

  test('should test navigation under different dashboard states', async ({ page }) => {
    console.log('🔍 Testing navigation from different dashboard states...');
    
    // Login
    await page.goto('http://localhost:3003/auth/login');
    await page.fill('input[type="email"]', 'admin@formulapm.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Test 1: Immediate click after login
    console.log('Test 1: Immediate click after login...');
    await page.locator('a[href="/projects"]').click();
    await page.waitForLoadState('networkidle');
    const immediateResult = page.url();
    console.log(`Immediate click result: ${immediateResult}`);
    
    // Go back to dashboard
    await page.goto('http://localhost:3003/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Test 2: Click after interacting with dashboard
    console.log('Test 2: Click after interacting with dashboard...');
    await page.waitForTimeout(2000);
    // Simulate user interaction (scroll, hover, etc.)
    await page.mouse.move(100, 100);
    await page.mouse.move(200, 200);
    await page.waitForTimeout(1000);
    
    await page.locator('a[href="/projects"]').click();
    await page.waitForLoadState('networkidle');
    const afterInteractionResult = page.url();
    console.log(`After interaction result: ${afterInteractionResult}`);
    
    // Go back to dashboard
    await page.goto('http://localhost:3003/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Test 3: Click after page reload
    console.log('Test 3: Click after page reload...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.locator('a[href="/projects"]').click();
    await page.waitForLoadState('networkidle');
    const afterReloadResult = page.url();
    console.log(`After reload result: ${afterReloadResult}`);
    
    // Summary
    console.log('\n📊 Dashboard State Test Results:');
    console.log(`Immediate: ${immediateResult.includes('/projects') ? '✅' : '❌'}`);
    console.log(`After interaction: ${afterInteractionResult.includes('/projects') ? '✅' : '❌'}`);
    console.log(`After reload: ${afterReloadResult.includes('/projects') ? '✅' : '❌'}`);
    
    await page.screenshot({ path: 'test-results/user-bug-dashboard-states.png' });
  });

  test('should monitor all network activity during navigation', async ({ page }) => {
    console.log('📡 Monitoring all network activity during navigation...');
    
    const networkLogs = [];
    
    // Monitor all requests
    page.on('request', request => {
      networkLogs.push({
        type: 'request',
        method: request.method(),
        url: request.url(),
        timestamp: Date.now()
      });
    });
    
    // Monitor all responses
    page.on('response', response => {
      networkLogs.push({
        type: 'response',
        status: response.status(),
        url: response.url(),
        headers: response.headers(),
        timestamp: Date.now()
      });
      
      if (response.status() >= 300 && response.status() < 400) {
        console.log(`🔄 REDIRECT: ${response.status()} ${response.url()} → ${response.headers()['location']}`);
      }
    });
    
    // Login and navigate
    await page.goto('http://localhost:3003/auth/login');
    await page.fill('input[type="email"]', 'admin@formulapm.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    console.log('🖱️ Clicking projects link with full network monitoring...');
    await page.locator('a[href="/projects"]').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Analyze network logs
    const redirects = networkLogs.filter(log => 
      log.type === 'response' && log.status >= 300 && log.status < 400
    );
    
    const apiCalls = networkLogs.filter(log => 
      log.url.includes('/api/')
    );
    
    console.log('\n📊 Network Analysis:');
    console.log(`Total requests: ${networkLogs.filter(l => l.type === 'request').length}`);
    console.log(`Total responses: ${networkLogs.filter(l => l.type === 'response').length}`);
    console.log(`Redirects: ${redirects.length}`);
    console.log(`API calls: ${apiCalls.length}`);
    
    if (redirects.length > 0) {
      console.log('\n🔄 Redirects found:');
      redirects.forEach(redirect => {
        console.log(`  ${redirect.status} ${redirect.url} → ${redirect.headers['location']}`);
      });
    }
    
    console.log(`\n📍 Final URL: ${page.url()}`);
  });
});