import { test, expect } from '@playwright/test';

test.describe('Login Debug', () => {
  test('should debug login form elements', async ({ page }) => {
    await page.goto('http://localhost:3003/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of login page
    await page.screenshot({ path: 'test-results/debug-login-page.png', fullPage: true });
    
    // Debug: Find all input elements
    const inputs = await page.locator('input').all();
    console.log(`Found ${inputs.length} input elements`);
    
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const type = await input.getAttribute('type');
      const name = await input.getAttribute('name');
      const placeholder = await input.getAttribute('placeholder');
      const id = await input.getAttribute('id');
      console.log(`Input ${i}: type=${type}, name=${name}, placeholder=${placeholder}, id=${id}`);
    }
    
    // Debug: Find all button elements
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} button elements`);
    
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const type = await button.getAttribute('type');
      const text = await button.textContent();
      console.log(`Button ${i}: type=${type}, text=${text}`);
    }
    
    // Try to fill the form with more specific selectors
    try {
      // Try different email input selectors
      const emailSelectors = [
        'input[type="email"]',
        'input[name="email"]', 
        'input[placeholder*="email"]',
        'input[placeholder*="Email"]',
        '#email',
        '[data-testid="email"]'
      ];
      
      let emailInput = null;
      for (const selector of emailSelectors) {
        try {
          emailInput = page.locator(selector).first();
          if (await emailInput.isVisible({ timeout: 1000 })) {
            console.log(`Found email input with selector: ${selector}`);
            await emailInput.fill('admin@formulapm.com');
            break;
          }
        } catch (e) {
          console.log(`Selector ${selector} failed: ${e.message}`);
        }
      }
      
      // Try different password input selectors
      const passwordSelectors = [
        'input[type="password"]',
        'input[name="password"]',
        'input[placeholder*="password"]',
        'input[placeholder*="Password"]',
        '#password',
        '[data-testid="password"]'
      ];
      
      let passwordInput = null;
      for (const selector of passwordSelectors) {
        try {
          passwordInput = page.locator(selector).first();
          if (await passwordInput.isVisible({ timeout: 1000 })) {
            console.log(`Found password input with selector: ${selector}`);
            await passwordInput.fill('admin123');
            break;
          }
        } catch (e) {
          console.log(`Selector ${selector} failed: ${e.message}`);
        }
      }
      
      // Take screenshot after filling
      await page.screenshot({ path: 'test-results/debug-form-filled.png', fullPage: true });
      
      // Try to find and click submit button
      const submitSelectors = [
        'button[type="submit"]',
        'button:has-text("Sign In")',
        'button:has-text("Login")',
        'button:has-text("Log In")',
        'input[type="submit"]',
        '[data-testid="submit"]'
      ];
      
      let submitButton = null;
      for (const selector of submitSelectors) {
        try {
          submitButton = page.locator(selector).first();
          if (await submitButton.isVisible({ timeout: 1000 })) {
            console.log(`Found submit button with selector: ${selector}`);
            await submitButton.click();
            break;
          }
        } catch (e) {
          console.log(`Submit selector ${selector} failed: ${e.message}`);
        }
      }
      
      // Wait and see what happens
      await page.waitForTimeout(3000);
      console.log(`Final URL: ${page.url()}`);
      
      // Take final screenshot
      await page.screenshot({ path: 'test-results/debug-after-submit.png', fullPage: true });
      
    } catch (error) {
      console.error('Error during form interaction:', error);
      await page.screenshot({ path: 'test-results/debug-error.png', fullPage: true });
    }
  });
});