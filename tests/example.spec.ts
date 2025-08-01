import { test, expect } from '@playwright/test';

test.describe('Formula PM App Tests', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if page loaded successfully
    await expect(page).toHaveTitle(/Formula PM/);
    
    // Take a screenshot
    await page.screenshot({ path: 'test-results/homepage.png' });
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    
    // Look for login button or link
    const loginButton = page.locator('text=Login').or(page.locator('text=Sign In')).first();
    
    if (await loginButton.isVisible()) {
      await loginButton.click();
      
      // Wait for navigation
      await page.waitForLoadState('networkidle');
      
      // Check if we're on login page
      await expect(page.url()).toContain('login');
      
      // Take a screenshot
      await page.screenshot({ path: 'test-results/login-page.png' });
    } else {
      console.log('No login button found');
    }
  });

  test('should test form interactions', async ({ page }) => {
    await page.goto('/');
    
    // Look for any input fields
    const inputs = await page.locator('input').count();
    console.log(`Found ${inputs} input fields`);
    
    // Look for any buttons
    const buttons = await page.locator('button').count();
    console.log(`Found ${buttons} buttons`);
    
    // Take a screenshot of the current state
    await page.screenshot({ path: 'test-results/form-elements.png', fullPage: true });
  });
});
