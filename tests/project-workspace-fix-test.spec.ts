import { test, expect } from '@playwright/test';

test.describe('Project Workspace Fix Test', () => {
  test('should successfully navigate to project workspace and load project details', async ({ page }) => {
    console.log('🎯 Testing project workspace fix...');
    
    // Login
    await page.goto('http://localhost:3003/auth/login');
    await page.fill('input[type="email"]', 'admin@formulapm.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Logged in successfully');
    
    // Navigate to projects page
    await page.goto('http://localhost:3003/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('📋 Looking for projects...');
    
    // Monitor API calls
    const apiCalls = [];
    const errors = [];
    
    page.on('response', response => {
      if (response.url().includes('/api/projects/')) {
        const call = {
          url: response.url(),
          status: response.status(),
          ok: response.ok(),
          method: response.request().method()
        };
        apiCalls.push(call);
        
        if (response.ok()) {
          console.log(`✅ API SUCCESS: ${call.method} ${response.status()} - ${response.url()}`);
        } else {
          console.log(`❌ API ERROR: ${call.method} ${response.status()} - ${response.url()}`);
          errors.push(call);
        }
      }
    });
    
    // Look for project links
    const projectLinks = page.locator('a[href*="/projects/"]:not([href="/projects/new"])');
    const projectCount = await projectLinks.count();
    
    console.log(`📊 Found ${projectCount} project links`);
    
    if (projectCount > 0) {
      // Test the first project
      const firstProjectLink = projectLinks.first();
      const projectHref = await firstProjectLink.getAttribute('href');
      const projectText = await firstProjectLink.textContent();
      
      console.log(`🎯 Testing first project: "${projectText?.substring(0, 50)}..." at ${projectHref}`);
      
      // Click on the project
      await firstProjectLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000); // Wait for API calls to complete
      
      const currentUrl = page.url();
      console.log(`📍 Current URL after click: ${currentUrl}`);
      
      // Take screenshot
      await page.screenshot({ path: 'test-results/project-workspace-fix-01.png', fullPage: true });
      
      // Check for "Project Not Found" error
      const notFoundText = page.locator('text=Project Not Found');
      const hasNotFoundError = await notFoundText.isVisible({ timeout: 2000 });
      
      if (hasNotFoundError) {
        console.log('❌ Still showing "Project Not Found" error');
        await page.screenshot({ path: 'test-results/project-workspace-fix-error.png', fullPage: true });
      } else {
        console.log('✅ No "Project Not Found" error detected');
      }
      
      // Check for project name in the header
      const projectNameHeader = page.locator('h1');
      const headerText = await projectNameHeader.first().textContent();
      console.log(`📋 Project header text: "${headerText}"`);
      
      // Check for project details
      const hasProjectDetails = await page.locator('.card').count() > 0;
      console.log(`📊 Has project details cards: ${hasProjectDetails}`);
      
      // Check for tabs
      const tabs = await page.locator('text=Overview, text=Scope, text=Shop').count();
      console.log(`🏷️ Found ${tabs} workspace tabs`);
      
      // API call analysis
      const individualProjectCalls = apiCalls.filter(call => 
        call.url.match(/\/api\/projects\/[a-f0-9-]+$/) && call.method === 'GET'
      );
      
      console.log('\\n📊 API Call Analysis:');
      console.log(`📡 Total project API calls: ${apiCalls.length}`);
      console.log(`🎯 Individual project API calls: ${individualProjectCalls.length}`);
      console.log(`❌ API errors: ${errors.length}`);
      
      if (individualProjectCalls.length > 0) {
        console.log('✅ Individual project API calls detected:');
        individualProjectCalls.forEach(call => {
          console.log(`  ${call.status} - ${call.url}`);
        });
      }
      
      if (errors.length > 0) {
        console.log('❌ API Errors:');
        errors.forEach(error => {
          console.log(`  ${error.status} - ${error.url}`);
        });
      }
      
      // Test assertions
      expect(hasNotFoundError).toBeFalsy(); // Should not show "Project Not Found"
      expect(hasProjectDetails).toBeTruthy(); // Should have project details
      expect(individualProjectCalls.length).toBeGreaterThan(0); // Should make individual project API calls
      expect(errors.length).toBe(0); // Should have no API errors
      
      console.log('🎉 Project workspace fix test completed successfully!');
      
    } else {
      console.log('⚠️ No projects found to test');
      await page.screenshot({ path: 'test-results/project-workspace-no-projects.png' });
    }
  });
  
  test('should test all available projects', async ({ page }) => {
    console.log('🎯 Testing all available projects...');
    
    // Login
    await page.goto('http://localhost:3003/auth/login');
    await page.fill('input[type="email"]', 'admin@formulapm.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Navigate to projects
    await page.goto('http://localhost:3003/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Get all project links
    const projectLinks = page.locator('a[href*="/projects/"]:not([href="/projects/new"])');
    const projectCount = await projectLinks.count();
    
    console.log(`📊 Testing ${projectCount} projects`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < Math.min(projectCount, 4); i++) {
      console.log(`\\n🔍 Testing project ${i + 1}/${Math.min(projectCount, 4)}...`);
      
      try {
        const projectLink = projectLinks.nth(i);
        const projectHref = await projectLink.getAttribute('href');
        const projectText = await projectLink.textContent();
        
        console.log(`🎯 Project: "${projectText?.substring(0, 30)}..." (${projectHref})`);
        
        // Navigate directly to avoid clicking issues
        if (projectHref) {
          await page.goto(`http://localhost:3003${projectHref}`);
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(3000);
          
          // Check for errors
          const hasNotFoundError = await page.locator('text=Project Not Found').isVisible({ timeout: 2000 });
          const hasProjectName = await page.locator('h1').count() > 0;
          
          if (hasNotFoundError) {
            console.log(`❌ Project ${i + 1}: Shows "Not Found" error`);
            errorCount++;
          } else if (hasProjectName) {
            console.log(`✅ Project ${i + 1}: Loaded successfully`);
            successCount++;
          } else {
            console.log(`⚠️ Project ${i + 1}: Unclear state`);
          }
          
          await page.screenshot({ 
            path: `test-results/project-${i + 1}-test.png`, 
            fullPage: false 
          });
        }
        
      } catch (error) {
        console.log(`❌ Project ${i + 1}: Error - ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\\n📊 Final Results:`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📈 Success Rate: ${(successCount / (successCount + errorCount) * 100).toFixed(1)}%`);
    
    // At least 75% should work
    const successRate = successCount / (successCount + errorCount);
    expect(successRate).toBeGreaterThan(0.75);
  });
});