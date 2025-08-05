import { test, expect } from '@playwright/test';

// Test user credentials
const TEST_USER = {
  email: 'admin@formulapm.com',
  password: 'admin123'
};

test.describe('Project Workspace Tabs', () => {
  let projectId: string;

  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3003/auth/login');
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Wait for navigation to complete
    await page.waitForURL('http://localhost:3003/dashboard', { timeout: 10000 });
    
    // Navigate to projects page
    await page.goto('http://localhost:3003/projects');
    await page.waitForLoadState('networkidle');
    
    // Click on the first project
    const firstProject = page.locator('[data-testid="project-card"]').first();
    await expect(firstProject).toBeVisible({ timeout: 10000 });
    
    // Extract project ID from the link
    const projectLink = await firstProject.locator('a').first().getAttribute('href');
    projectId = projectLink?.split('/').pop() || '';
    
    // Navigate to project workspace
    await firstProject.click();
    await page.waitForURL(`**/projects/${projectId}`);
    await page.waitForLoadState('networkidle');
  });

  test('should display all expected tabs', async ({ page }) => {
    // Check for tab container
    const tabContainer = page.locator('[role="tablist"]');
    await expect(tabContainer).toBeVisible();
    
    // Define expected tabs
    const expectedTabs = [
      'Overview',
      'Tasks', 
      'Milestones',
      'Shop Drawings',
      'Scope List',
      'Material Specs',
      'Team',
      'Reports'
    ];
    
    // Check each tab exists
    for (const tabName of expectedTabs) {
      const tab = page.locator(`[role="tab"]:has-text("${tabName}")`);
      await expect(tab).toBeVisible();
      console.log(`✓ Tab "${tabName}" is visible`);
    }
  });

  test('should switch between tabs correctly', async ({ page }) => {
    // Test switching to each tab
    const tabTests = [
      { name: 'Tasks', contentSelector: '[data-testid="tasks-content"], .tasks-container, h2:has-text("Tasks")' },
      { name: 'Milestones', contentSelector: '[data-testid="milestones-content"], .milestones-container, h2:has-text("Milestones")' },
      { name: 'Shop Drawings', contentSelector: '[data-testid="shop-drawings-content"], .shop-drawings-container, h2:has-text("Shop Drawings")' },
      { name: 'Scope List', contentSelector: '[data-testid="scope-list-content"], .scope-list-container, h2:has-text("Scope")' },
      { name: 'Material Specs', contentSelector: '[data-testid="material-specs-content"], .material-specs-container, h2:has-text("Material")' },
      { name: 'Team', contentSelector: '[data-testid="team-content"], .team-container, h2:has-text("Team")' },
      { name: 'Reports', contentSelector: '[data-testid="reports-content"], .reports-container, h2:has-text("Reports")' }
    ];
    
    for (const { name, contentSelector } of tabTests) {
      console.log(`Testing tab: ${name}`);
      
      // Click the tab
      const tab = page.locator(`[role="tab"]:has-text("${name}")`);
      await tab.click();
      
      // Wait for any loading states to complete
      await page.waitForLoadState('networkidle');
      
      // Check if tab is active
      await expect(tab).toHaveAttribute('aria-selected', 'true');
      
      // Check if content is visible
      const content = page.locator(contentSelector).first();
      await expect(content).toBeVisible({ timeout: 10000 });
      
      console.log(`✓ Tab "${name}" switches correctly and shows content`);
    }
  });

  test('should show scope list tab buttons for admin role', async ({ page }) => {
    // Navigate to Scope List tab
    const scopeTab = page.locator('[role="tab"]:has-text("Scope List")');
    await scopeTab.click();
    await page.waitForLoadState('networkidle');
    
    // Check for Add Scope Item button
    const addButton = page.locator('button:has-text("Add Scope Item")');
    await expect(addButton).toBeVisible({ timeout: 10000 });
    console.log('✓ Add Scope Item button is visible');
    
    // Check for Import from Excel button
    const importButton = page.locator('button:has-text("Import from Excel")');
    await expect(importButton).toBeVisible({ timeout: 10000 });
    console.log('✓ Import from Excel button is visible');
  });

  test('should load data in each tab', async ({ page }) => {
    // Test Overview tab (default)
    await page.waitForSelector('text=/Project Overview|Overview|Status/', { timeout: 10000 });
    console.log('✓ Overview tab loads data');
    
    // Test Tasks tab
    await page.click('[role="tab"]:has-text("Tasks")');
    await page.waitForLoadState('networkidle');
    // Look for task-related elements or empty state
    const taskElements = await page.locator('.task-item, [data-testid="task-item"], text=/No tasks|Add Task/').count();
    expect(taskElements).toBeGreaterThan(0);
    console.log('✓ Tasks tab loads');
    
    // Test Milestones tab
    await page.click('[role="tab"]:has-text("Milestones")');
    await page.waitForLoadState('networkidle');
    const milestoneElements = await page.locator('.milestone-item, [data-testid="milestone-item"], text=/No milestones|Add Milestone/').count();
    expect(milestoneElements).toBeGreaterThan(0);
    console.log('✓ Milestones tab loads');
  });

  test('should handle tab errors gracefully', async ({ page }) => {
    // Monitor console for errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Click through all tabs quickly
    const tabs = await page.locator('[role="tab"]').all();
    for (const tab of tabs) {
      await tab.click();
      await page.waitForTimeout(500); // Brief wait
    }
    
    // Check for critical errors
    const criticalErrors = consoleErrors.filter(error => 
      error.includes('TypeError') || 
      error.includes('Cannot read') ||
      error.includes('undefined')
    );
    
    if (criticalErrors.length > 0) {
      console.log('⚠️ Critical errors found:', criticalErrors);
    } else {
      console.log('✓ No critical errors during tab switching');
    }
  });

  test('should maintain project context across tabs', async ({ page }) => {
    // Get project name from overview
    const projectName = await page.locator('h1, h2').first().textContent();
    console.log(`Project: ${projectName}`);
    
    // Switch to different tabs and verify project context is maintained
    const tabsToCheck = ['Tasks', 'Milestones', 'Scope List'];
    
    for (const tabName of tabsToCheck) {
      await page.click(`[role="tab"]:has-text("${tabName}")`);
      await page.waitForLoadState('networkidle');
      
      // Check if we're still in the same project context
      const currentUrl = page.url();
      expect(currentUrl).toContain(projectId);
      console.log(`✓ ${tabName} tab maintains project context`);
    }
  });
});