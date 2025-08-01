import { test, expect } from '@playwright/test';

test.describe('Comprehensive E2E Tests - Formula PM', () => {
  test('should complete full authentication and project navigation flow', async ({ page }) => {
    console.log('🚀 Starting comprehensive E2E test...');
    
    // Step 1: Navigate to login page
    console.log('📝 Step 1: Navigating to login page');
    await page.goto('http://localhost:3003/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Verify we're on login page
    await expect(page.url()).toContain('/auth/login');
    await page.screenshot({ path: 'test-results/01-login-page.png' });
    
    // Step 2: Fill login form
    console.log('📝 Step 2: Filling login credentials');
    await page.fill('input[type="email"]', 'admin@formulapm.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.screenshot({ path: 'test-results/02-form-filled.png' });
    
    // Step 3: Submit login
    console.log('📝 Step 3: Submitting login form');
    await page.click('button[type="submit"]');
    
    // Wait for navigation and verify success
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log(`🔍 After login URL: ${page.url()}`);
    await page.screenshot({ path: 'test-results/03-after-login.png' });
    
    // Check if we successfully logged in (should not be on login page)
    const isOnLoginPage = page.url().includes('/auth/login');
    expect(isOnLoginPage).toBeFalsy();
    
    // Step 4: Navigate to projects (whether from dashboard or directly)
    console.log('📝 Step 4: Navigating to projects');
    
    // Try to find projects link first
    const projectsLink = page.locator('a[href="/projects"], text=Projects').first();
    const hasProjectsLink = await projectsLink.isVisible({ timeout: 3000 });
    
    if (hasProjectsLink) {
      console.log('✅ Found projects link, clicking...');
      await projectsLink.click();
    } else {
      console.log('⚠️ No projects link found, navigating directly...');
      await page.goto('http://localhost:3003/projects');
    }
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log(`🔍 Projects page URL: ${page.url()}`);
    await page.screenshot({ path: 'test-results/04-projects-page.png', fullPage: true });
    
    // Verify we're on projects page
    expect(page.url()).toContain('/projects');
    
    // Step 5: Check for project data loading
    console.log('📝 Step 5: Checking project data');
    
    // Wait for any data to load
    await page.waitForTimeout(3000);
    
    // Look for various indicators of project content
    const hasContent = await page.locator('table, .project, text=Create Project, text=No projects').first().isVisible({ timeout: 5000 });
    console.log(`📊 Projects content visible: ${hasContent}`);
    
    // Step 6: Test project workspace navigation (if projects exist)
    console.log('📝 Step 6: Testing project workspace navigation');
    
    const projectRows = page.locator('tr[data-project-id], .project-item, a[href*="/projects/"]');
    const projectCount = await projectRows.count();
    console.log(`📈 Found ${projectCount} potential project links`);
    
    if (projectCount > 0) {
      const firstProject = projectRows.first();
      console.log('🎯 Clicking on first project...');
      await firstProject.click();
      
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      console.log(`🔍 Project workspace URL: ${page.url()}`);
      await page.screenshot({ path: 'test-results/05-project-workspace.png', fullPage: true });
      
      // Should be on a specific project page
      const isProjectWorkspace = page.url().match(/\/projects\/[a-f0-9-]+/);
      expect(isProjectWorkspace).toBeTruthy();
      
      // Step 7: Test API data loading
      console.log('📝 Step 7: Testing API data loading');
      
      // Monitor for any API errors
      let apiErrors = [];
      page.on('response', response => {
        if (response.url().includes('/api/') && response.status() >= 400) {
          apiErrors.push({ url: response.url(), status: response.status() });
          console.log(`❌ API Error: ${response.status()} - ${response.url()}`);
        }
      });
      
      // Wait for all data to load
      await page.waitForTimeout(5000);
      
      // Take final screenshot
      await page.screenshot({ path: 'test-results/06-final-state.png', fullPage: true });
      
      // Check for API errors
      const hasServerErrors = apiErrors.filter(e => e.status >= 500).length;
      console.log(`🔍 Server errors found: ${hasServerErrors}`);
      expect(hasServerErrors).toBe(0);
      
      console.log('✅ All tests completed successfully!');
      
    } else {
      console.log('ℹ️ No projects found - this is expected for a fresh installation');
      
      // Look for create project functionality
      const createButton = page.locator('button:has-text("Create"), a:has-text("New Project")').first();
      if (await createButton.isVisible({ timeout: 3000 })) {
        console.log('✅ Create project button found');
        await createButton.click();
        await page.screenshot({ path: 'test-results/05-create-project.png' });
      }
    }
    
    console.log('🎉 Comprehensive E2E test completed!');
  });
  
  test('should handle API calls correctly', async ({ page }) => {
    console.log('🔧 Testing API integration...');
    
    // Track API calls
    const apiCalls = [];
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiCalls.push({
          url: response.url(),
          status: response.status(),
          ok: response.ok()
        });
        console.log(`📡 API: ${response.status()} - ${response.url()}`);
      }
    });
    
    // Login and navigate to projects 
    await page.goto('http://localhost:3003/auth/login');
    await page.fill('input[type="email"]', 'admin@formulapm.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Navigate to projects page
    if (await page.locator('a[href="/projects"]').first().isVisible({ timeout: 3000 })) {
      await page.locator('a[href="/projects"]').first().click();
    } else {
      await page.goto('http://localhost:3003/projects');
    }
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Summary of API calls
    const successfulCalls = apiCalls.filter(call => call.ok).length;
    const failedCalls = apiCalls.filter(call => !call.ok).length;
    const serverErrors = apiCalls.filter(call => call.status >= 500).length;
    
    console.log(`📊 API Summary:`);
    console.log(`  ✅ Successful: ${successfulCalls}`);
    console.log(`  ❌ Failed: ${failedCalls}`);
    console.log(`  🚨 Server errors: ${serverErrors}`);
    
    // No server errors should occur
    expect(serverErrors).toBe(0);
    
    await page.screenshot({ path: 'test-results/api-integration-final.png', fullPage: true });
  });
});