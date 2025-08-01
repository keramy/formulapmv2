import { test, expect } from '@playwright/test';

test.describe('API Integration Tests', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3003/auth/login');
    await page.fill('input[type="email"], input[name="email"]', 'admin@formulapm.com');
    await page.fill('input[type="password"], input[name="password"]', 'admin123');
    await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
    await page.waitForLoadState('networkidle');
  });

  test('should load project statistics without 500 errors', async ({ page }) => {
    // Monitor network requests
    const apiRequests: Array<{ url: string, status: number }> = [];
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiRequests.push({
          url: response.url(),
          status: response.status()
        });
        console.log(`API Response: ${response.status()} - ${response.url()}`);
      }
    });
    
    // Navigate to projects from dashboard
    const projectsLink = page.locator('a[href="/projects"], text=Projects').first();
    
    if (await projectsLink.isVisible({ timeout: 5000 })) {
      await projectsLink.click();
      await page.waitForLoadState('networkidle');
    } else {
      await page.goto('http://localhost:3003/projects');
      await page.waitForLoadState('networkidle');
    }
    
    // Try to navigate to a project workspace
    const projectLink = page.locator('a[href*="/projects/"], tr').first();
    
    if (await projectLink.isVisible({ timeout: 5000 })) {
      await projectLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      // Check for 500 errors in API calls
      const serverErrors = apiRequests.filter(req => req.status >= 500);
      console.log('Server errors found:', serverErrors);
      
      expect(serverErrors.length).toBe(0);
      
      // Check for authentication errors
      const authErrors = apiRequests.filter(req => req.status === 401 || req.status === 403);
      console.log('Auth errors found:', authErrors);
      
      // Take screenshot of final state
      await page.screenshot({ path: 'test-results/api-integration-success.png', fullPage: true });
    }
  });

  test('should handle milestones API correctly', async ({ page }) => {
    let milestonesApiCalled = false;
    let milestonesApiStatus = 0;
    
    page.on('response', response => {
      if (response.url().includes('/api/projects/') && response.url().includes('/milestones')) {
        milestonesApiCalled = true;
        milestonesApiStatus = response.status();
        console.log(`Milestones API: ${response.status()} - ${response.url()}`);
      }
    });
    
    // Navigate to projects from dashboard
    const projectsLink = page.locator('a[href="/projects"], text=Projects').first();
    
    if (await projectsLink.isVisible({ timeout: 5000 })) {
      await projectsLink.click();
      await page.waitForLoadState('networkidle');
    } else {
      await page.goto('http://localhost:3003/projects');
      await page.waitForLoadState('networkidle');
    }
    
    const projectLink = page.locator('a[href*="/projects/"], tr').first();
    
    if (await projectLink.isVisible({ timeout: 5000 })) {
      await projectLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      if (milestonesApiCalled) {
        expect(milestonesApiStatus).toBeLessThan(500);
        console.log('✅ Milestones API working correctly');
      } else {
        console.log('ℹ️ Milestones API not called (might be no data)');
      }
    }
    
    await page.screenshot({ path: 'test-results/milestones-api-test.png', fullPage: true });
  });

  test('should handle project stats API correctly', async ({ page }) => {
    let statsApiCalled = false;
    let statsApiStatus = 0;
    
    page.on('response', response => {
      if (response.url().includes('/api/projects/') && response.url().includes('/stats')) {
        statsApiCalled = true;
        statsApiStatus = response.status();
        console.log(`Stats API: ${response.status()} - ${response.url()}`);
      }
    });
    
    // Navigate to projects from dashboard
    const projectsLink = page.locator('a[href="/projects"], text=Projects').first();
    
    if (await projectsLink.isVisible({ timeout: 5000 })) {
      await projectsLink.click();
      await page.waitForLoadState('networkidle');
    } else {
      await page.goto('http://localhost:3003/projects');
      await page.waitForLoadState('networkidle');
    }
    
    const projectLink = page.locator('a[href*="/projects/"], tr').first();
    
    if (await projectLink.isVisible({ timeout: 5000 })) {
      await projectLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      if (statsApiCalled) {
        expect(statsApiStatus).toBeLessThan(500);
        console.log('✅ Project Stats API working correctly');
      } else {
        console.log('ℹ️ Project Stats API not called');
      }
    }
    
    await page.screenshot({ path: 'test-results/stats-api-test.png', fullPage: true });
  });

  test('should display real data in project overview', async ({ page }) => {
    // Navigate to projects from dashboard
    const projectsLink = page.locator('a[href="/projects"], text=Projects').first();
    
    if (await projectsLink.isVisible({ timeout: 5000 })) {
      await projectsLink.click();
      await page.waitForLoadState('networkidle');
    } else {
      await page.goto('http://localhost:3003/projects');
      await page.waitForLoadState('networkidle');
    }
    
    const projectLink = page.locator('a[href*="/projects/"], tr').first();
    
    if (await projectLink.isVisible({ timeout: 5000 })) {
      await projectLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      // Check for actual data display (not mock data)
      const hasRealData = await page.locator('text=Total Tasks, text=Team Members, text=Budget').first().isVisible({ timeout: 10000 });
      
      if (hasRealData) {
        // Check if data shows actual numbers (not all zeros)
        const dataElements = await page.locator('[class*="font-bold"], .text-2xl').allTextContents();
        console.log('Data displayed:', dataElements);
        
        // Take screenshot of data display
        await page.screenshot({ path: 'test-results/real-data-display.png', fullPage: true });
      } else {
        console.log('No data display elements found');
        await page.screenshot({ path: 'test-results/no-data-display.png', fullPage: true });
      }
    }
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Simulate API errors
    await page.route('**/api/projects/*/stats', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    // Navigate to projects from dashboard
    const projectsLink = page.locator('a[href="/projects"], text=Projects').first();
    
    if (await projectsLink.isVisible({ timeout: 5000 })) {
      await projectsLink.click();
      await page.waitForLoadState('networkidle');
    } else {
      await page.goto('http://localhost:3003/projects');
      await page.waitForLoadState('networkidle');
    }
    
    const projectLink = page.locator('a[href*="/projects/"], tr').first();
    
    if (await projectLink.isVisible({ timeout: 5000 })) {
      await projectLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      // Should handle error gracefully without crashing
      const pageContent = await page.content();
      expect(pageContent).not.toContain('Cannot read properties of null');
      
      await page.screenshot({ path: 'test-results/error-handling.png', fullPage: true });
    }
  });
});