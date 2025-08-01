import { test, expect } from '@playwright/test';

test.describe('Project Workspace Comprehensive Testing', () => {
  test('should test project workspace tabs with real project', async ({ page }) => {
    console.log('🎯 Comprehensive project workspace testing...');
    
    // Login
    await page.goto('http://localhost:3003/auth/login');
    await page.fill('input[type="email"]', 'admin@formulapm.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Navigate to projects
    await page.locator('a[href="/projects"]').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log(`✅ On projects page: ${page.url()}`);
    await page.screenshot({ path: 'test-results/comprehensive-01-projects-page.png', fullPage: true });
    
    // Monitor API calls
    const apiCalls = [];
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiCalls.push({
          url: response.url(),
          status: response.status(),
          ok: response.ok()
        });
        console.log(`📡 ${response.status()} - ${response.url()}`);
      }
    });
    
    // Look for existing projects first
    console.log('🔍 Looking for existing projects...');
    
    // Check if there are any project rows in a table
    const projectRows = page.locator('tbody tr, .project-row').filter({
      hasNot: page.locator('button:has-text("Create"), button:has-text("New")')
    });
    
    const existingProjectCount = await projectRows.count();
    console.log(`📊 Found ${existingProjectCount} existing projects`);
    
    let projectUrl = '';
    
    if (existingProjectCount > 0) {
      console.log('✅ Using existing project');
      
      // Click on the first project
      const firstProject = projectRows.first();
      const projectName = await firstProject.textContent();
      console.log(`🎯 Clicking on: ${projectName?.substring(0, 50)}...`);
      
      await firstProject.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      projectUrl = page.url();
      
    } else {
      console.log('🆕 No existing projects - creating test project');
      
      // Create a test project
      const createButton = page.locator('button:has-text("Create"), a:has-text("New Project")').first();
      
      if (await createButton.isVisible({ timeout: 5000 })) {
        await createButton.click();
        await page.waitForLoadState('networkidle');
        
        // Fill out project creation form (basic fields)
        await page.fill('input[name="name"], input[placeholder*="name"], #name', 'E2E Test Project');
        await page.fill('input[name="description"], textarea[name="description"]', 'Created by Playwright E2E test');
        await page.fill('input[name="budget"], input[placeholder*="budget"]', '100000');
        
        // Try to find and select a client (if client dropdown exists)
        const clientSelect = page.locator('select[name="client"], select[name="client_id"]').first();
        if (await clientSelect.isVisible({ timeout: 2000 })) {
          await clientSelect.selectOption({ index: 1 }); // Select first non-empty option
        }
        
        await page.screenshot({ path: 'test-results/comprehensive-02-create-project-form.png' });
        
        // Submit the form
        const submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")').first();
        await submitButton.click();
        
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        projectUrl = page.url();
        console.log(`✅ Created test project, now at: ${projectUrl}`);
      } else {
        console.log('❌ Cannot find create project button');
        await page.screenshot({ path: 'test-results/comprehensive-no-create-button.png' });
        return; // Exit test
      }
    }
    
    // Verify we're in a project workspace
    console.log(`📍 Project URL: ${projectUrl}`);
    const isProjectWorkspace = projectUrl.match(/\/projects\/[a-f0-9-]+/) || projectUrl.includes('/projects/');
    expect(isProjectWorkspace).toBeTruthy();
    
    await page.screenshot({ path: 'test-results/comprehensive-03-project-workspace.png', fullPage: true });
    
    // Test workspace tabs
    console.log('\n🏷️ Testing workspace tabs...');
    
    const tabs = [
      { name: 'Overview', indicator: 'text=Overview' },
      { name: 'Scope', indicator: 'text=Scope' },
      { name: 'Shop Drawings', indicator: 'text=Shop' },
      { name: 'Material Specs', indicator: 'text=Material' },
      { name: 'Reports', indicator: 'text=Reports' }
    ];
    
    let workingTabs = [];
    let failedTabs = [];
    
    for (const tab of tabs) {
      console.log(`\n🔍 Testing ${tab.name} tab...`);
      
      try {
        // Look for the tab
        const tabElement = page.locator(tab.indicator).first();
        const tabExists = await tabElement.isVisible({ timeout: 5000 });
        
        if (tabExists) {
          console.log(`✅ ${tab.name} tab found`);
          
          // Click the tab
          await tabElement.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(2000);
          
          // Check if content loaded
          const contentLoaded = await checkForContent(page);
          const hasErrors = await checkForErrors(page);
          
          console.log(`📊 ${tab.name}: Content=${contentLoaded ? '✅' : '❌'}, Errors=${hasErrors ? '❌' : '✅'}`);
          
          // Take screenshot
          await page.screenshot({ 
            path: `test-results/comprehensive-04-${tab.name.toLowerCase().replace(/ /g, '-')}.png`, 
            fullPage: true 
          });
          
          if (contentLoaded && !hasErrors) {
            workingTabs.push(tab.name);
          } else {
            failedTabs.push({ name: tab.name, reason: hasErrors ? 'errors' : 'no content' });
          }
          
        } else {
          console.log(`❌ ${tab.name} tab not found`);
          failedTabs.push({ name: tab.name, reason: 'not found' });
        }
        
      } catch (error) {
        console.log(`❌ Error testing ${tab.name}: ${error.message}`);
        failedTabs.push({ name: tab.name, reason: error.message });
      }
    }
    
    // Final results
    console.log('\n📊 Final Results:');
    console.log(`✅ Working tabs (${workingTabs.length}): ${workingTabs.join(', ')}`);
    console.log(`❌ Failed tabs (${failedTabs.length}): ${failedTabs.map(t => `${t.name} (${t.reason})`).join(', ')}`);
    
    // API Results
    const successfulAPIs = apiCalls.filter(call => call.ok).length;
    const failedAPIs = apiCalls.filter(call => !call.ok).length;
    const serverErrors = apiCalls.filter(call => call.status >= 500).length;
    
    console.log(`\n📡 API Results:`);
    console.log(`✅ Successful: ${successfulAPIs}`);
    console.log(`❌ Failed: ${failedAPIs}`);
    console.log(`🚨 Server errors: ${serverErrors}`);
    
    await page.screenshot({ path: 'test-results/comprehensive-05-final.png', fullPage: true });
    
    // Assertions
    expect(workingTabs.length).toBeGreaterThan(0); // At least one tab should work
    expect(serverErrors).toBe(0); // No server errors should occur
    
    console.log('🎉 Comprehensive workspace test completed!');
  });
});

// Helper functions
async function checkForContent(page) {
  console.log('  🔍 Checking for content...');
  
  // Wait a bit for content to load
  await page.waitForTimeout(1500);
  
  // Look for various content indicators
  const contentSelectors = [
    'table tbody tr',     // Data tables
    '.card',              // Card components  
    '.stats',             // Statistics
    'h1, h2, h3',        // Headings
    'canvas',             // Charts
    'p:has-text()',       // Paragraphs with text
    '[role="tabpanel"]'   // Tab panels
  ];
  
  for (const selector of contentSelectors) {
    try {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`    ✅ Found ${count} ${selector} elements`);
        return true;
      }
    } catch (e) {
      // Continue checking
    }
  }
  
  console.log('    ❌ No content found');
  return false;
}

async function checkForErrors(page) {
  console.log('  🔍 Checking for errors...');
  
  const errorSelectors = [
    '.error',
    'text=Error',
    'text=Failed',
    'text=Something went wrong',
    '[role="alert"]'
  ];
  
  for (const selector of errorSelectors) {
    try {
      const errorVisible = await page.locator(selector).isVisible({ timeout: 1000 });
      if (errorVisible) {
        const errorText = await page.locator(selector).textContent();
        console.log(`    ❌ Error found: ${errorText?.substring(0, 50)}...`);
        return true;
      }
    } catch (e) {
      // Continue checking
    }
  }
  
  console.log('    ✅ No errors found');
  return false;
}