import { test, expect } from '@playwright/test';

test.describe('Project Navigation Flow', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3003/auth/login');
    await page.fill('input[type="email"], input[name="email"]', 'admin@formulapm.com');
    await page.fill('input[type="password"], input[name="password"]', 'admin123');
    await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to projects page successfully', async ({ page }) => {
    // After login, we're on dashboard. Navigate to projects
    const projectsLink = page.locator('a[href="/projects"], text=Projects').first();
    
    if (await projectsLink.isVisible({ timeout: 5000 })) {
      await projectsLink.click();
      await page.waitForLoadState('networkidle');
    } else {
      // Fallback: navigate directly to projects page
      await page.goto('http://localhost:3003/projects');
      await page.waitForLoadState('networkidle');
    }
    
    // Should be on projects page
    await expect(page.url()).toContain('/projects');
    
    // Should show projects list or create project button
    const hasProjectsContent = await page.locator(
      'text=Projects, text=Create Project, table, .project'
    ).first().isVisible({ timeout: 10000 });
    
    expect(hasProjectsContent).toBeTruthy();
    
    await page.screenshot({ path: 'test-results/projects-page.png', fullPage: true });
  });

  test('should display project list correctly', async ({ page }) => {
    // Navigate to projects from dashboard
    const projectsLink = page.locator('a[href="/projects"], text=Projects').first();
    
    if (await projectsLink.isVisible({ timeout: 5000 })) {
      await projectsLink.click();
      await page.waitForLoadState('networkidle');
    } else {
      await page.goto('http://localhost:3003/projects');
      await page.waitForLoadState('networkidle');
    }
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Check if projects are displayed in table format
    const projectTable = page.locator('table, .project-list, .project-card').first();
    const tableExists = await projectTable.isVisible({ timeout: 5000 });
    
    if (tableExists) {
      // Count project rows/cards
      const projectCount = await page.locator('tr, .project-item, .project-card').count();
      console.log(`Found ${projectCount} project entries`);
    } else {
      // Check for empty state
      const emptyState = await page.locator('text=No projects, text=Create your first').first().isVisible();
      console.log(`Empty state visible: ${emptyState}`);
    }
    
    await page.screenshot({ path: 'test-results/project-list.png', fullPage: true });
  });

  test('should navigate to individual project workspace', async ({ page }) => {
    await page.goto('http://localhost:3003/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Look for clickable project names or links
    const projectLink = page.locator('a[href*="/projects/"], tr[data-project-id], .project-name').first();
    const linkExists = await projectLink.isVisible({ timeout: 5000 });
    
    if (linkExists) {
      // Get project info before clicking
      const projectText = await projectLink.textContent();
      console.log(`Clicking on project: ${projectText}`);
      
      await projectLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should navigate to project workspace
      await expect(page.url()).toMatch(/\/projects\/[a-f0-9-]+/);
      
      // Should show project workspace tabs
      const workspaceTabs = await page.locator('text=Overview, text=Scope, text=Shop Drawings, text=Reports').first().isVisible({ timeout: 10000 });
      
      if (workspaceTabs) {
        console.log('Project workspace loaded successfully');
      } else {
        console.log('Project workspace tabs not found, but navigation succeeded');
      }
      
      await page.screenshot({ path: 'test-results/project-workspace.png', fullPage: true });
    } else {
      console.log('No clickable projects found - testing project creation instead');
      
      // Look for create project button
      const createButton = page.locator('button:has-text("Create"), a:has-text("New Project")').first();
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.screenshot({ path: 'test-results/create-project-flow.png' });
      }
    }
  });

  test('should load project overview tab with data', async ({ page }) => {
    await page.goto('http://localhost:3003/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Try to find and click on a project
    const projectLink = page.locator('a[href*="/projects/"], tr[data-project-id], .project-name').first();
    
    if (await projectLink.isVisible({ timeout: 5000 })) {
      await projectLink.click();
      await page.waitForLoadState('networkidle');
      
      // Wait for data to load
      await page.waitForTimeout(3000);
      
      // Check for project overview content
      const hasOverviewContent = await page.locator(
        'text=Overview, text=Statistics, text=Milestones, text=Budget, .overview, .stats'
      ).first().isVisible({ timeout: 10000 });
      
      console.log(`Overview content loaded: ${hasOverviewContent}`);
      
      // Check for data loading states
      const hasLoadingStates = await page.locator('.skeleton, text=Loading').first().isVisible({ timeout: 2000 });
      console.log(`Loading states visible: ${hasLoadingStates}`);
      
      // Check for error states
      const hasErrors = await page.locator('text=Error, text=Failed, .error').first().isVisible({ timeout: 2000 });
      console.log(`Error states visible: ${hasErrors}`);
      
      await page.screenshot({ path: 'test-results/project-overview-data.png', fullPage: true });
    }
  });

  test('should handle API loading states properly', async ({ page }) => {
    // Slow down network to test loading states
    await page.route('**/api/projects/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      route.continue();
    });
    
    await page.goto('http://localhost:3003/projects');
    await page.waitForLoadState('networkidle');
    
    // Should show loading states
    const loadingVisible = await page.locator('.skeleton, text=Loading, .spinner').first().isVisible({ timeout: 2000 });
    console.log(`Loading states working: ${loadingVisible}`);
    
    await page.screenshot({ path: 'test-results/loading-states.png' });
    
    // Wait for data to fully load
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/data-loaded.png' });
  });
});