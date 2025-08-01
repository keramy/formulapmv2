import { test, expect } from '@playwright/test';

test.describe('Direct Milestones API Test', () => {
  test('should test milestones API with known project ID', async ({ page }) => {
    console.log('🎯 Testing milestones API with known project...');
    
    // Login first
    await page.goto('http://localhost:3003/auth/login');
    await page.fill('input[type="email"]', 'admin@formulapm.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Logged in successfully');
    
    // Use the known project ID from database
    const projectId = 'e1eda0dc-d09e-4aab-a2ff-83085b121e5b';
    const projectUrl = `http://localhost:3003/projects/${projectId}`;
    
    console.log(`🎯 Testing project workspace: ${projectUrl}`);
    
    // Monitor API calls specifically for milestones
    const apiCalls = [];
    page.on('response', response => {
      if (response.url().includes('/milestones')) {
        const call = {
          url: response.url(),
          status: response.status(),
          ok: response.ok(),
          timestamp: Date.now()
        };
        apiCalls.push(call);
        
        if (response.ok()) {
          console.log(`✅ Milestones API SUCCESS: ${response.status()} - ${response.url()}`);
        } else {
          console.log(`❌ Milestones API FAILED: ${response.status()} - ${response.url()}`);
        }
      }
    });
    
    // Navigate to project workspace 
    await page.goto(projectUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Wait for all API calls to complete
    
    console.log(`📍 Project workspace loaded: ${page.url()}`);
    await page.screenshot({ path: 'test-results/direct-milestones-01-workspace.png', fullPage: true });
    
    // Analyze milestones API results
    const milestonesAPICalls = apiCalls.filter(call => call.url.includes('milestones'));
    const successfulCalls = milestonesAPICalls.filter(call => call.ok);
    const failedCalls = milestonesAPICalls.filter(call => !call.ok);
    const serverErrors = milestonesAPICalls.filter(call => call.status >= 500);
    
    console.log('\\n📊 Milestones API Test Results:');
    console.log(`📡 Total milestones API calls: ${milestonesAPICalls.length}`);
    console.log(`✅ Successful calls: ${successfulCalls.length}`);
    console.log(`❌ Failed calls: ${failedCalls.length}`);
    console.log(`🚨 Server errors (500+): ${serverErrors.length}`);
    
    if (successfulCalls.length > 0) {
      console.log('\\n🎉 SUCCESS: Milestones API is working!'); 
      successfulCalls.forEach(call => {
        console.log(`  ✅ ${call.status} - ${call.url}`);
      });
    }
    
    if (failedCalls.length > 0) {
      console.log('\\n❌ FAILED API calls:');
      failedCalls.forEach(call => {
        console.log(`  ${call.status} - ${call.url}`);
      });
    }
    
    // Test workspace functionality
    console.log('\\n🏷️ Testing workspace tabs visibility...');
    
    const tabs = [
      { name: 'Overview', selector: 'text=Overview' },
      { name: 'Scope', selector: 'text=Scope' },
      { name: 'Shop Drawings', selector: 'text=Shop' }
    ];
    
    let visibleTabs = 0;
    
    for (const tab of tabs) {
      try {
        const tabElement = page.locator(tab.selector).first();
        const isVisible = await tabElement.isVisible({ timeout: 3000 });
        
        if (isVisible) {
          console.log(`✅ ${tab.name} tab is visible`);
          visibleTabs++;
        } else {
          console.log(`❌ ${tab.name} tab not visible`);
        }
      } catch (error) {
        console.log(`⚠️ Error checking ${tab.name} tab: ${error.message}`);
      }
    }
    
    console.log(`\\n🎯 Workspace Status: ${visibleTabs}/${tabs.length} tabs visible`);
    
    // Final screenshot
    await page.screenshot({ path: 'test-results/direct-milestones-02-final.png', fullPage: true });
    
    // Key assertions
    expect(milestonesAPICalls.length).toBeGreaterThan(0); // Should have milestones API calls
    expect(serverErrors.length).toBe(0); // No 500 errors
    expect(visibleTabs).toBeGreaterThan(0); // At least some tabs visible
    
    console.log('\\n🎉 Direct milestones API test completed successfully!');
  });
});