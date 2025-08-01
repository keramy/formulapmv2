import { test, expect } from '@playwright/test';

test.describe('Single Project Debug', () => {
  test('should debug single project API call', async ({ page }) => {
    console.log('🔍 Debugging single project API...');
    
    // Login
    await page.goto('http://localhost:3003/auth/login');
    await page.fill('input[type="email"]', 'admin@formulapm.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Logged in');
    
    // Navigate directly to known project
    const projectId = 'e1eda0dc-d09e-4aab-a2ff-83085b121e5b'; // From database query
    
    console.log(`🎯 Testing project: ${projectId}`);
    
    // Monitor all API calls
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log(`📡 ${response.status()} ${response.request().method()} - ${response.url()}`);
      }
    });
    
    // Go to project workspace
    await page.goto(`http://localhost:3003/projects/${projectId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // Check page content
    const pageTitle = await page.title();
    const hasNotFound = await page.locator('text=Project Not Found').isVisible({ timeout: 2000 });
    const hasProjectContent = await page.locator('h1').count() > 0;
    
    console.log(`📋 Page title: ${pageTitle}`);
    console.log(`❌ Has "Not Found": ${hasNotFound}`);
    console.log(`📊 Has content: ${hasProjectContent}`);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/single-project-debug.png', fullPage: true });
    
    // The test will show us the console logs
    console.log('🎉 Debug test completed');
  });
});