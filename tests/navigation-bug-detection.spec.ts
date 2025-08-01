import { test, expect } from '@playwright/test';

test.describe('Navigation Bug Detection', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3003/auth/login');
    await page.fill('input[type="email"]', 'admin@formulapm.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Should be on dashboard
    await expect(page.url()).toContain('/dashboard');
    console.log(`✅ Login successful, on dashboard: ${page.url()}`);
  });

  test('should navigate to projects on FIRST click (detecting double-click bug)', async ({ page }) => {
    console.log('🔍 Testing first click navigation to projects...');
    
    // Take screenshot of dashboard
    await page.screenshot({ path: 'test-results/bug-01-dashboard.png' });
    
    // Find the projects link/tab
    const projectsLink = page.locator('a[href="/projects"]').first();
    
    // Verify the link exists
    const linkExists = await projectsLink.isVisible({ timeout: 5000 });
    expect(linkExists).toBeTruthy();
    console.log('✅ Projects link found');
    
    // Get the current URL before clicking
    const urlBeforeClick = page.url();
    console.log(`📍 URL before click: ${urlBeforeClick}`);
    
    // FIRST CLICK - This should work, but user reports it doesn't
    console.log('🖱️ Performing FIRST click on projects...');
    await projectsLink.click();
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give it time to settle
    
    // Check where we ended up
    const urlAfterFirstClick = page.url();
    console.log(`📍 URL after FIRST click: ${urlAfterFirstClick}`);
    
    // Take screenshot after first click
    await page.screenshot({ path: 'test-results/bug-02-after-first-click.png' });
    
    // THIS IS THE BUG TEST - First click should go to projects, not back to dashboard
    if (urlAfterFirstClick.includes('/dashboard')) {
      console.log('🐛 BUG DETECTED: First click redirected back to dashboard!');
      
      // Test the second click (user's workaround)
      console.log('🖱️ Testing SECOND click (user workaround)...');
      await projectsLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const urlAfterSecondClick = page.url();
      console.log(`📍 URL after SECOND click: ${urlAfterSecondClick}`);
      
      // Take screenshot after second click
      await page.screenshot({ path: 'test-results/bug-03-after-second-click.png' });
      
      if (urlAfterSecondClick.includes('/projects')) {
        console.log('🔧 CONFIRMED: Second click works (this proves the bug exists)');
      }
      
      // Fail the test - first click should have worked
      expect(urlAfterFirstClick).toContain('/projects');
      
    } else if (urlAfterFirstClick.includes('/projects')) {
      console.log('✅ SUCCESS: First click went to projects correctly');
      expect(urlAfterFirstClick).toContain('/projects');
    } else {
      console.log(`❓ UNEXPECTED: First click went to ${urlAfterFirstClick}`);
      expect(urlAfterFirstClick).toContain('/projects');
    }
  });

  test('should track all navigation events during projects click', async ({ page }) => {
    console.log('🔍 Tracking all navigation events...');
    
    // Track all navigation events
    const navigationEvents = [];
    
    page.on('framenavigated', frame => {
      if (frame === page.mainFrame()) {
        navigationEvents.push({
          type: 'navigation',
          url: frame.url(),
          timestamp: Date.now()
        });
        console.log(`🧭 Navigation: ${frame.url()}`);
      }
    });
    
    // Track requests that might cause redirects
    page.on('response', response => {
      if (response.status() >= 300 && response.status() < 400) {
        navigationEvents.push({
          type: 'redirect',
          url: response.url(),
          status: response.status(),
          location: response.headers()['location'],
          timestamp: Date.now()
        });
        console.log(`↩️ Redirect: ${response.status()} ${response.url()} → ${response.headers()['location']}`);
      }
    });
    
    // Start tracking
    const startUrl = page.url();
    console.log(`📍 Starting URL: ${startUrl}`);
    
    // Click projects link
    const projectsLink = page.locator('a[href="/projects"]').first();
    await projectsLink.click();
    
    // Wait and track what happens
    await page.waitForTimeout(3000);
    
    const finalUrl = page.url();
    console.log(`📍 Final URL: ${finalUrl}`);
    
    // Print all navigation events
    console.log('📊 Navigation Timeline:');
    navigationEvents.forEach((event, index) => {
      console.log(`  ${index + 1}. ${event.type}: ${event.url} ${event.status ? `(${event.status})` : ''}`);
    });
    
    // Take final screenshot
    await page.screenshot({ path: 'test-results/bug-navigation-timeline.png' });
    
    // Analysis
    if (navigationEvents.length > 2) {
      console.log('⚠️ Multiple navigation events detected - possible redirect loop or unnecessary redirects');
    }
    
    if (finalUrl.includes('/dashboard') && startUrl.includes('/dashboard')) {
      console.log('🐛 BUG CONFIRMED: Clicked projects but stayed on dashboard');
    }
  });

  test('should detect timing issues in navigation', async ({ page }) => {
    console.log('⏱️ Testing navigation timing...');
    
    // Test rapid clicking (what users might do when first click seems broken)
    const projectsLink = page.locator('a[href="/projects"]').first();
    
    console.log('🖱️ Testing rapid double-click...');
    await projectsLink.click();
    await page.waitForTimeout(100); // Very short wait
    await projectsLink.click(); // Second click quickly
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const finalUrl = page.url();
    console.log(`📍 URL after rapid double-click: ${finalUrl}`);
    
    await page.screenshot({ path: 'test-results/bug-rapid-click.png' });
    
    // Should end up on projects page
    expect(finalUrl).toContain('/projects');
  });

  test('should test different ways to navigate to projects', async ({ page }) => {
    console.log('🔍 Testing alternative navigation methods...');
    
    // Method 1: Direct URL navigation (baseline)
    console.log('Method 1: Direct URL navigation');
    await page.goto('http://localhost:3003/projects');
    await page.waitForLoadState('networkidle');
    const directUrl = page.url();
    console.log(`Direct navigation result: ${directUrl}`);
    expect(directUrl).toContain('/projects');
    
    // Go back to dashboard
    await page.goto('http://localhost:3003/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Method 2: JavaScript navigation
    console.log('Method 2: JavaScript navigation');
    await page.evaluate(() => {
      window.location.href = '/projects';
    });
    await page.waitForLoadState('networkidle');
    const jsUrl = page.url();
    console.log(`JavaScript navigation result: ${jsUrl}`);
    
    // Go back to dashboard
    await page.goto('http://localhost:3003/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Method 3: Click navigation (the problematic one)
    console.log('Method 3: Click navigation (potentially buggy)');
    const projectsLink = page.locator('a[href="/projects"]').first();
    await projectsLink.click();
    await page.waitForLoadState('networkidle');
    const clickUrl = page.url();
    console.log(`Click navigation result: ${clickUrl}`);
    
    await page.screenshot({ path: 'test-results/bug-navigation-methods.png' });
    
    // Compare results
    console.log('\n📊 Navigation Method Comparison:');
    console.log(`Direct URL: ${directUrl.includes('/projects') ? '✅' : '❌'}`);
    console.log(`JavaScript: ${jsUrl.includes('/projects') ? '✅' : '❌'}`);
    console.log(`Click Link: ${clickUrl.includes('/projects') ? '✅' : '❌'}`);
    
    if (directUrl.includes('/projects') && jsUrl.includes('/projects') && !clickUrl.includes('/projects')) {
      console.log('🐛 BUG ISOLATED: Click navigation is broken, other methods work');
    }
  });
});