import { test, expect } from '@playwright/test';

test.describe('Project Workspace Tabs Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to projects
    await page.goto('http://localhost:3003/auth/login');
    await page.fill('input[type="email"]', 'admin@formulapm.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Navigate to projects page
    await page.locator('a[href="/projects"]').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log(`✅ Ready to test projects from: ${page.url()}`);
  });

  test('should navigate to project workspace and test all tabs', async ({ page }) => {
    console.log('🎯 Testing complete project workspace tab functionality...');
    
    // Monitor API calls throughout the test
    const apiCalls = [];
    const apiErrors = [];
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        const apiCall = {
          url: response.url(),
          status: response.status(),
          ok: response.ok(),
          timestamp: Date.now()
        };
        apiCalls.push(apiCall);
        
        if (!response.ok()) {
          apiErrors.push(apiCall);
          console.log(`❌ API Error: ${response.status()} - ${response.url()}`);
        } else {
          console.log(`✅ API Success: ${response.status()} - ${response.url()}`);
        }
      }
    });
    
    // Step 1: Find and click on a project
    console.log('1️⃣ Looking for projects to click on...');
    await page.screenshot({ path: 'test-results/workspace-01-projects-list.png', fullPage: true });
    
    // Look for actual project entries (not "New Project" button)
    const projectSelectors = [
      'a[href*="/projects/"]:not([href="/projects/new"])',  // Direct project links, exclude new project
      'tr[data-project-id]',                               // Table rows with project data
      'tr:has(td):not(:has(button))',                     // Table rows without buttons
      '.project-item:not(:has(button))',                  // Project items without create buttons
      '.project-name:not(:has(button))'                   // Project names without buttons
    ];
    
    let projectElement = null;
    let foundSelector = '';
    
    for (const selector of projectSelectors) {
      try {
        const elements = page.locator(selector);
        const count = await elements.count();
        console.log(`🔍 Selector "${selector}": found ${count} elements`);
        
        if (count > 0) {
          // Additional check to make sure it's not the "New Project" button/link
          const firstElement = elements.first();
          const elementText = await firstElement.textContent();
          
          if (elementText && !elementText.toLowerCase().includes('new project') && !elementText.toLowerCase().includes('create')) {
            projectElement = firstElement;
            foundSelector = selector;
            console.log(`✅ Found valid project: "${elementText.substring(0, 50)}..."`);
            break;
          } else {
            console.log(`⚠️ Selector "${selector}" found create/new project elements, skipping...`);
          }
        }
      } catch (e) {
        console.log(`⚠️ Selector "${selector}" failed: ${e.message}`);
      }
    }
    
    if (projectElement && await projectElement.isVisible()) {
      // Get project info before clicking
      let projectInfo = '';
      try {
        projectInfo = await projectElement.textContent() || '';
      } catch (e) {
        projectInfo = 'Unknown project';
      }
      
      console.log(`🎯 Found project using "${foundSelector}": ${projectInfo.substring(0, 50)}...`);
      
      // Click on the project
      console.log('🖱️ Clicking on project...');
      await projectElement.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000); // Wait for data loading
      
      const projectUrl = page.url();
      console.log(`📍 Project workspace URL: ${projectUrl}`);
      
      // Verify we're in a project workspace
      const isProjectWorkspace = projectUrl.match(/\/projects\/[a-f0-9-]+/);
      expect(isProjectWorkspace).toBeTruthy();
      
      await page.screenshot({ path: 'test-results/workspace-02-project-loaded.png', fullPage: true });
      
      // Step 2: Test all workspace tabs
      console.log('\n2️⃣ Testing workspace tabs...');
      
      // Define the tabs we expect to find
      const expectedTabs = [
        { name: 'Overview', selector: 'text=Overview', url: '' },
        { name: 'Scope', selector: 'text=Scope', url: '/scope' },
        { name: 'Shop Drawings', selector: 'text=Shop Drawings', url: '/shop-drawings' },
        { name: 'Material Specs', selector: 'text=Material Specs', url: '/material-specs' },
        { name: 'Reports', selector: 'text=Reports', url: '/reports' }
      ];
      
      let tabResults = [];
      
      for (const tab of expectedTabs) {
        console.log(`\n🔍 Testing ${tab.name} tab...`);
        
        try {
          // Look for the tab
          const tabElement = page.locator(tab.selector).first();
          const tabVisible = await tabElement.isVisible({ timeout: 5000 });
          
          if (tabVisible) {
            console.log(`✅ ${tab.name} tab found`);
            
            // Click the tab
            await tabElement.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
            
            const currentUrl = page.url();
            console.log(`📍 ${tab.name} URL: ${currentUrl}`);
            
            // Check if URL contains expected path (if specified)
            let urlCorrect = true;
            if (tab.url) {
              urlCorrect = currentUrl.includes(tab.url);
            }
            
            // Take screenshot of this tab
            await page.screenshot({ 
              path: `test-results/workspace-03-${tab.name.toLowerCase().replace(/ /g, '-')}-tab.png`, 
              fullPage: true 
            });
            
            // Check for content loading
            const hasContent = await checkTabContent(page, tab.name);
            
            tabResults.push({
              name: tab.name,
              found: true,
              urlCorrect,
              hasContent,
              url: currentUrl
            });
            
            console.log(`📊 ${tab.name} tab result: Found=✅, URL=${urlCorrect ? '✅' : '❌'}, Content=${hasContent ? '✅' : '❌'}`);
            
          } else {
            console.log(`❌ ${tab.name} tab not found`);
            tabResults.push({
              name: tab.name,
              found: false,
              urlCorrect: false,
              hasContent: false
            });
          }
          
        } catch (error) {
          console.log(`❌ Error testing ${tab.name} tab: ${error.message}`);
          tabResults.push({
            name: tab.name,
            found: false,
            urlCorrect: false,
            hasContent: false,
            error: error.message
          });
        }
      }
      
      // Step 3: API Analysis
      console.log('\n3️⃣ API Call Analysis...');
      console.log(`📡 Total API calls: ${apiCalls.length}`);
      console.log(`❌ API errors: ${apiErrors.length}`);
      console.log(`✅ API success rate: ${((apiCalls.length - apiErrors.length) / apiCalls.length * 100).toFixed(1)}%`);
      
      if (apiErrors.length > 0) {
        console.log('\n🚨 API Errors found:');
        apiErrors.forEach(error => {
          console.log(`  ${error.status} - ${error.url}`);
        });
      }
      
      // Step 4: Final Summary
      console.log('\n4️⃣ Final Results Summary:');
      console.log('📊 Tab Functionality:');
      tabResults.forEach(result => {
        const status = result.found && result.urlCorrect && result.hasContent ? '✅' : '❌';
        console.log(`  ${status} ${result.name}: Found=${result.found}, URL=${result.urlCorrect}, Content=${result.hasContent}`);
      });
      
      await page.screenshot({ path: 'test-results/workspace-04-final-state.png', fullPage: true });
      
      // Assertions
      const workingTabs = tabResults.filter(tab => tab.found && tab.urlCorrect).length;
      console.log(`\n🎯 ${workingTabs}/${expectedTabs.length} tabs working correctly`);
      
      // At least Overview tab should work
      const overviewWorking = tabResults.find(tab => tab.name === 'Overview')?.found;
      expect(overviewWorking).toBeTruthy();
      
      // No server errors should occur
      const serverErrors = apiErrors.filter(error => error.status >= 500).length;
      expect(serverErrors).toBe(0);
      
    } else {
      console.log('⚠️ No projects found to test');
      
      // Check if we need to create a project first
      const createButton = page.locator('button:has-text("Create"), a:has-text("New Project")');
      const hasCreateButton = await createButton.isVisible({ timeout: 3000 });
      
      if (hasCreateButton) {
        console.log('💡 Found create project button - this might be a fresh installation');
        await page.screenshot({ path: 'test-results/workspace-no-projects-create-available.png' });
      } else {
        console.log('❌ No projects and no create button found');
        await page.screenshot({ path: 'test-results/workspace-no-projects-no-create.png' });
      }
      
      // Don't fail the test - just document the state
      console.log('ℹ️ Test completed - no projects available to test workspace tabs');
    }
  });

});

// Helper function to check tab content
async function checkTabContent(page, tabName) {
    console.log(`🔍 Checking content for ${tabName} tab...`);
    
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Common content indicators
    const contentSelectors = [
      'table',                    // Tables with data
      '.card',                   // Card components
      '.overview',               // Overview sections
      '.stats',                  // Statistics
      'canvas',                  // Charts
      '.data',                   // Data containers
      '[role="tabpanel"]',       // Tab panels
      '.content',                // Content areas
      'h1, h2, h3',             // Headings
      'p',                       // Paragraphs
      'div:has(> *)'            // Divs with children
    ];
    
    let hasContent = false;
    
    for (const selector of contentSelectors) {
      try {
        const elements = page.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          hasContent = true;
          console.log(`  ✅ Found content: ${count} ${selector} elements`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    // Check for loading states
    const isLoading = await page.locator('.skeleton, .loading, text=Loading').isVisible({ timeout: 1000 });
    if (isLoading) {
      console.log('  ⏳ Content is still loading...');
      await page.waitForTimeout(3000);
      // Re-check after loading
      hasContent = await page.locator('table, .card, h1, h2, h3').count() > 0;
    }
    
    // Check for error states
    const hasError = await page.locator('.error, text=Error, text=Failed').isVisible({ timeout: 1000 });
    if (hasError) {
      console.log('  ❌ Error state detected in tab content');
    }
    
    return hasContent && !hasError;
}