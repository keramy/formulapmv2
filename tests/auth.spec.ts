import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the homepage
    await page.goto('http://localhost:3003');
  });

  test('should login successfully with admin credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3003/auth/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Fill in login credentials
    await page.fill('input[type="email"], input[name="email"]', 'admin@formulapm.com');
    await page.fill('input[type="password"], input[name="password"]', 'admin123');
    
    // Take screenshot before login
    await page.screenshot({ path: 'test-results/login-form-filled.png' });
    
    // Click login button
    await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
    
    // Wait for redirect after login
    await page.waitForLoadState('networkidle');
    
    // Should redirect to dashboard
    await expect(page.url()).toContain('/dashboard');
    
    // Check for successful login indicators
    const isLoggedIn = await page.locator('text=Dashboard, text=Projects').first().isVisible({ timeout: 10000 });
    expect(isLoggedIn).toBeTruthy();
    
    // Take screenshot of successful login
    await page.screenshot({ path: 'test-results/login-success.png' });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:3003/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Fill in wrong credentials
    await page.fill('input[type="email"], input[name="email"]', 'wrong@email.com');
    await page.fill('input[type="password"], input[name="password"]', 'wrongpassword');
    
    await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
    
    // Wait for error message
    await page.waitForTimeout(2000);
    
    // Should show error message
    const errorVisible = await page.locator('text=Invalid, text=Error, text=failed, .error, .alert').first().isVisible({ timeout: 5000 });
    
    // Take screenshot of error state
    await page.screenshot({ path: 'test-results/login-error.png' });
    
    // Should still be on login page
    await expect(page.url()).toContain('/auth/login');
  });

  test('should maintain authentication state across page reloads', async ({ page }) => {
    // First login
    await page.goto('http://localhost:3003/auth/login');
    await page.fill('input[type="email"], input[name="email"]', 'admin@formulapm.com');
    await page.fill('input[type="password"], input[name="password"]', 'admin123');
    await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
    
    await page.waitForLoadState('networkidle');
    
    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should still be logged in
    const isStillLoggedIn = await page.locator('text=Dashboard, text=Projects').first().isVisible({ timeout: 10000 });
    expect(isStillLoggedIn).toBeTruthy();
    
    await page.screenshot({ path: 'test-results/auth-persistence.png' });
  });
});

test.describe('Authentication Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    await page.goto('http://localhost:3003/auth/login');
    
    // Block network requests to simulate network error
    await page.route('**/api/auth/**', route => route.abort());
    
    await page.fill('input[type="email"], input[name="email"]', 'admin@formulapm.com');
    await page.fill('input[type="password"], input[name="password"]', 'admin123');
    await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
    
    // Should handle error gracefully
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/network-error.png' });
    
    // Should still be on login page
    await expect(page.url()).toContain('/auth/login');
  });
});