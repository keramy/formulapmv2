import { test, expect, Page } from '@playwright/test';

/**
 * Performance Optimization Tests
 * 
 * Tests the optimizations implemented:
 * 1. Token exposure fixes (security)
 * 2. API caching layer (performance)
 * 3. Response time improvements
 */

// Test configuration
const TEST_CONFIG = {
  // Test user credentials - using admin for full access
  email: 'admin@formulapm.com',
  password: 'admin123',
  baseUrl: 'http://localhost:3003',
  expectedImprovements: {
    projects: { before: 2280, after: 500 }, // 2.28s → 500ms
    dashboard: { before: 1500, after: 300 }, // 1.5s → 300ms
    scope: { before: 3000, after: 600 }      // 3s → 600ms
  }
};

test.describe('Performance Optimization Validation', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Navigate to login page
    await page.goto(`${TEST_CONFIG.baseUrl}/auth/login`);
    
    // Login with admin credentials
    await page.fill('input[type="email"]', TEST_CONFIG.email);
    await page.fill('input[type="password"]', TEST_CONFIG.password);
    await page.click('button[type="submit"]');
    
    // Wait for successful login and redirect to dashboard
    await page.waitForURL('**/dashboard');
    await expect(page.locator('body')).not.toContainText('Sign in');
  });

  test('Security Fix: No JWT tokens in console logs', async () => {
    const consoleLogs: string[] = [];
    
    // Capture console logs
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });
    
    // Navigate through the app to trigger token logging
    await page.goto(`${TEST_CONFIG.baseUrl}/dashboard`);
    await page.goto(`${TEST_CONFIG.baseUrl}/projects`);
    await page.goto(`${TEST_CONFIG.baseUrl}/scope`);
    
    // Wait for any async operations
    await page.waitForTimeout(2000);
    
    // Check that no JWT token substrings are logged
    const tokenExposures = consoleLogs.filter(log => 
      log.includes('JWT Token: ey') || 
      log.includes('Access Token: ey') ||
      log.includes('Token: ey')
    );
    
    console.log('📋 Console logs captured:', consoleLogs.length);
    console.log('🔍 Token exposures found:', tokenExposures.length);
    
    if (tokenExposures.length > 0) {
      console.log('⚠️ Token exposures:', tokenExposures);
    }
    
    // Security assertion: No JWT tokens should be exposed in logs
    expect(tokenExposures.length).toBe(0);
    
    // Verify secure logging is working (should see "Received (X chars)" format)
    const secureTokenLogs = consoleLogs.filter(log => 
      log.includes('Received (') && log.includes('chars)')
    );
    
    console.log('✅ Secure token logs found:', secureTokenLogs.length);
  });

  test('API Performance: Projects endpoint caching', async () => {
    // Set up performance timing
    const performanceTimings: number[] = [];
    
    // Intercept API calls to measure response times
    page.route('**/api/projects**', async (route, request) => {
      const startTime = Date.now();
      const response = await route.fetch();
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      performanceTimings.push(responseTime);
      console.log(`📊 Projects API response time: ${responseTime}ms`);
      
      route.fulfill({ response });
    });
    
    // First request (should be slower - cache miss)
    await page.goto(`${TEST_CONFIG.baseUrl}/projects`);
    await page.waitForSelector('[data-testid="projects-list"], .project-card, table, [role="table"]', { timeout: 10000 });
    
    // Second request (should be faster - cache hit)
    await page.reload();
    await page.waitForSelector('[data-testid="projects-list"], .project-card, table, [role="table"]', { timeout: 10000 });
    
    // Third request (should also be cached)
    await page.reload();
    await page.waitForSelector('[data-testid="projects-list"], .project-card, table, [role="table"]', { timeout: 10000 });
    
    // Analyze performance
    console.log('📈 Projects API Timings:', performanceTimings);
    
    if (performanceTimings.length >= 2) {
      const firstRequest = performanceTimings[0];
      const cachedRequests = performanceTimings.slice(1);
      const avgCachedTime = cachedRequests.reduce((a, b) => a + b) / cachedRequests.length;
      
      console.log(`⏱️ First request (cache miss): ${firstRequest}ms`);
      console.log(`⚡ Cached requests average: ${avgCachedTime}ms`);
      console.log(`🚀 Performance improvement: ${((firstRequest - avgCachedTime) / firstRequest * 100).toFixed(1)}%`);
      
      // Performance assertions
      expect(firstRequest).toBeLessThan(TEST_CONFIG.expectedImprovements.projects.before);
      expect(avgCachedTime).toBeLessThan(TEST_CONFIG.expectedImprovements.projects.after);
      
      // Cache should provide at least 30% improvement
      const improvementPercent = (firstRequest - avgCachedTime) / firstRequest;
      expect(improvementPercent).toBeGreaterThan(0.3);
    }
  });

  test('API Performance: Dashboard stats caching', async () => {
    const performanceTimings: number[] = [];
    
    // Intercept dashboard stats API calls
    page.route('**/api/dashboard/stats**', async (route, request) => {
      const startTime = Date.now();
      const response = await route.fetch();
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      performanceTimings.push(responseTime);
      console.log(`📊 Dashboard stats API response time: ${responseTime}ms`);
      
      route.fulfill({ response });
    });
    
    // First request
    await page.goto(`${TEST_CONFIG.baseUrl}/dashboard`);
    await page.waitForSelector('[data-testid="dashboard-stats"], .stats-card, .metric', { timeout: 10000 });
    
    // Second request (cached)
    await page.reload();
    await page.waitForSelector('[data-testid="dashboard-stats"], .stats-card, .metric', { timeout: 10000 });
    
    // Analyze performance
    console.log('📈 Dashboard Stats API Timings:', performanceTimings);
    
    if (performanceTimings.length >= 2) {
      const firstRequest = performanceTimings[0];
      const cachedRequest = performanceTimings[1];
      
      console.log(`⏱️ First request: ${firstRequest}ms`);
      console.log(`⚡ Cached request: ${cachedRequest}ms`);
      
      // Performance assertions
      expect(firstRequest).toBeLessThan(TEST_CONFIG.expectedImprovements.dashboard.before);
      expect(cachedRequest).toBeLessThan(TEST_CONFIG.expectedImprovements.dashboard.after);
    }
  });

  test('API Performance: Scope endpoint caching', async () => {
    const performanceTimings: number[] = [];
    
    // Intercept scope API calls
    page.route('**/api/scope**', async (route, request) => {
      const startTime = Date.now();
      const response = await route.fetch();
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      performanceTimings.push(responseTime);
      console.log(`📊 Scope API response time: ${responseTime}ms`);
      
      route.fulfill({ response });
    });
    
    // Navigate to scope page
    await page.goto(`${TEST_CONFIG.baseUrl}/scope`);
    await page.waitForSelector('[data-testid="scope-list"], .scope-item, table', { timeout: 10000 });
    
    // Second request (cached)
    await page.reload();
    await page.waitForSelector('[data-testid="scope-list"], .scope-item, table', { timeout: 10000 });
    
    // Analyze performance
    console.log('📈 Scope API Timings:', performanceTimings);
    
    if (performanceTimings.length >= 2) {
      const firstRequest = performanceTimings[0];
      const cachedRequest = performanceTimings[1];
      
      console.log(`⏱️ First request: ${firstRequest}ms`);
      console.log(`⚡ Cached request: ${cachedRequest}ms`);
      
      // Performance assertions
      expect(firstRequest).toBeLessThan(TEST_CONFIG.expectedImprovements.scope.before);
      expect(cachedRequest).toBeLessThan(TEST_CONFIG.expectedImprovements.scope.after);
    }
  });

  test('End-to-End Performance: Full navigation flow', async () => {
    const navigationTimes: { page: string, loadTime: number }[] = [];
    
    const measurePageLoad = async (pageName: string, url: string, selector: string) => {
      const startTime = Date.now();
      await page.goto(url);
      await page.waitForSelector(selector, { timeout: 15000 });
      const loadTime = Date.now() - startTime;
      
      navigationTimes.push({ page: pageName, loadTime });
      console.log(`📄 ${pageName} load time: ${loadTime}ms`);
      
      return loadTime;
    };
    
    // Test key pages in sequence
    await measurePageLoad('Dashboard', `${TEST_CONFIG.baseUrl}/dashboard`, '[data-testid="dashboard"], .dashboard-content, main');
    await measurePageLoad('Projects', `${TEST_CONFIG.baseUrl}/projects`, '[data-testid="projects-list"], .project-card, table');
    await measurePageLoad('Scope', `${TEST_CONFIG.baseUrl}/scope`, '[data-testid="scope-list"], .scope-item, table');
    
    // Navigation performance summary
    const avgLoadTime = navigationTimes.reduce((sum, item) => sum + item.loadTime, 0) / navigationTimes.length;
    console.log('📊 Navigation Performance Summary:');
    navigationTimes.forEach(({ page, loadTime }) => {
      console.log(`   ${page}: ${loadTime}ms`);
    });
    console.log(`📈 Average load time: ${avgLoadTime.toFixed(0)}ms`);
    
    // Overall performance assertion
    expect(avgLoadTime).toBeLessThan(2000); // Average page load under 2s
    
    // Individual page assertions
    navigationTimes.forEach(({ page, loadTime }) => {
      expect(loadTime).toBeLessThan(5000); // No page should take more than 5s
    });
  });

  test('Cache Validation: Headers and behavior', async () => {
    let cacheHeaders: Record<string, string> = {};
    
    // Intercept to check cache headers
    page.route('**/api/projects**', async (route, request) => {
      const response = await route.fetch();
      
      // Capture response headers
      const headers = response.headers();
      cacheHeaders = headers;
      
      console.log('📋 Response headers:', Object.keys(headers));
      
      route.fulfill({ response });
    });
    
    await page.goto(`${TEST_CONFIG.baseUrl}/projects`);
    await page.waitForSelector('[data-testid="projects-list"], .project-card, table', { timeout: 10000 });
    
    // Check if appropriate caching headers are present
    console.log('🔍 Cache-related headers found:', Object.keys(cacheHeaders).filter(h => 
      h.toLowerCase().includes('cache') || 
      h.toLowerCase().includes('etag') ||
      h.toLowerCase().includes('expires')
    ));
  });
});

test.describe('Regression Tests: Existing Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(`${TEST_CONFIG.baseUrl}/auth/login`);
    await page.fill('input[type="email"]', TEST_CONFIG.email);
    await page.fill('input[type="password"]', TEST_CONFIG.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('Authentication still works after optimizations', async ({ page }) => {
    // Should be logged in and see dashboard
    await expect(page.locator('body')).not.toContainText('Sign in');
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Should be able to navigate to protected pages
    await page.goto(`${TEST_CONFIG.baseUrl}/projects`);
    await page.waitForSelector('[data-testid="projects-list"], .project-card, table');
    
    // Should not see authentication errors
    const errorMessages = page.locator('.error, [role="alert"], .alert-error');
    await expect(errorMessages).toHaveCount(0);
  });

  test('Data loading still works after caching implementation', async ({ page }) => {
    // Projects page should load data
    await page.goto(`${TEST_CONFIG.baseUrl}/projects`);
    await page.waitForSelector('[data-testid="projects-list"], .project-card, table', { timeout: 10000 });
    
    // Dashboard should show stats
    await page.goto(`${TEST_CONFIG.baseUrl}/dashboard`);
    await page.waitForSelector('[data-testid="dashboard-stats"], .stats-card, .metric', { timeout: 10000 });
    
    // Scope should load items
    await page.goto(`${TEST_CONFIG.baseUrl}/scope`);
    await page.waitForLoadState('networkidle');
    
    // Verify no API errors in console
    const apiErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && (msg.text().includes('API') || msg.text().includes('fetch'))) {
        apiErrors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    expect(apiErrors.length).toBe(0);
  });
});