# Formula PM V2 - Testing Strategy & Implementation Guide

**Created**: August 5, 2025  
**Purpose**: Comprehensive testing strategy to achieve 98% test pass rate  
**Current Status**: 46% pass rate (30 passed, 35 failed) - Major improvements needed

---

## Executive Summary

### Current Testing Challenges
- **Test Pass Rate**: 46% (30/65 tests passing)
- **Primary Issues**: Authentication tests failing, environment setup problems
- **Integration Tests**: Multiple test environment connection failures
- **E2E Tests**: Authentication flow and token refresh failures

### Target Goals
- **Phase 1**: 85% test pass rate (56/65 tests)
- **Phase 2**: 92% test pass rate (60/65 tests)  
- **Phase 3**: 98% test pass rate (64/65 tests)

---

## Testing Architecture Overview

### Test Categories & Distribution

```
📊 Test Suite Breakdown (Current: 65 tests)
├── Unit Tests (API Routes): 15 tests
│   ├── Authentication Tests: 5 tests ❌ (Currently failing)
│   ├── Business Logic Tests: 8 tests ✅ (Mostly passing)  
│   └── Utility Function Tests: 2 tests ✅ (Passing)
├── Integration Tests: 25 tests  
│   ├── Database Integration: 8 tests ❌ (Connection issues)
│   ├── API Workflow Tests: 12 tests ❌ (Auth dependent)
│   └── Component Integration: 5 tests ⚠️ (Mixed results)
├── End-to-End Tests: 20 tests
│   ├── Authentication Flows: 10 tests ❌ (Token refresh failing)
│   ├── User Journeys: 8 tests ❌ (Auth dependent)
│   └── Performance Tests: 2 tests ✅ (Basic tests passing)
└── Component Tests: 5 tests ✅ (UI components passing)
```

---

## Phase 1: Critical Test Fixes (Week 1)

### 1.1 Authentication Test Suite Stabilization

#### **Priority 1: Fix Token Refresh Mechanism**
```typescript
// File: src/__tests__/hooks/useAuth.test.ts
// Issues: Token refresh not working correctly

describe('Token Refresh', () => {
  it('should refresh expired tokens automatically', async () => {
    // Current issue: Mock refresh returns stale token
    // Fix: Implement proper mock token refresh
    const mockSupabase = {
      auth: {
        refreshSession: jest.fn().mockResolvedValue({
          data: { 
            session: { 
              access_token: 'fresh-token-123',
              refresh_token: 'refresh-123'
            }
          },
          error: null
        })
      }
    };
    
    // Test implementation needs proper async handling
  });
});
```

**Expected Outcome**: 5/5 authentication tests passing
**Timeline**: 2 days
**Success Criteria**: All useAuth hook tests green

#### **Priority 2: Environment Setup for Tests**
```bash
# Create test environment configuration
# File: .env.test
NEXT_PUBLIC_SUPABASE_URL=https://test-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key
TEST_USER_EMAIL=test@formulapm.com
TEST_USER_PASSWORD=testpass123
```

**Expected Outcome**: Consistent test environment across all test types
**Timeline**: 1 day
**Success Criteria**: No more "fetch failed" errors in test output

#### **Priority 3: Test Database Seeding**
```typescript
// File: src/__tests__/utils/test-setup.ts
export async function setupTestDatabase() {
  // Create isolated test data for each test run
  const testUser = await createTestUser();
  const testProject = await createTestProject(testUser.id);
  const testScopeItems = await createTestScopeItems(testProject.id);
  
  return { testUser, testProject, testScopeItems };
}

export async function cleanupTestDatabase() {
  // Proper cleanup to prevent test pollution
  await deleteTestData();
}
```

**Expected Outcome**: Reliable test data setup and teardown
**Timeline**: 2 days
**Success Criteria**: No test pollution, consistent test results

### 1.2 Integration Test Fixes

#### **Fix Database Connection Issues**
Current error pattern:
```
Failed to create auth user: fetch failed
TypeError: Cannot read properties of undefined (reading 'cleanup')
```

**Root Cause**: Test utilities not properly initialized
**Fix**: Implement proper test environment setup

```typescript
// File: src/__tests__/utils/real-supabase-utils.ts
export async function setupBasicTestEnvironment() {
  try {
    // Ensure Supabase client is properly configured for tests
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false, // Disable for tests
          persistSession: false    // Don't persist in tests
        }
      }
    );
    
    const testEnv = {
      supabase,
      cleanup: async () => {
        // Proper cleanup implementation
        await cleanupTestData();
      }
    };
    
    return testEnv;
  } catch (error) {
    console.error('Test setup failed:', error);
    throw error;
  }
}
```

**Expected Outcome**: Integration tests running without connection errors
**Timeline**: 3 days
**Success Criteria**: 20/25 integration tests passing

---

## Phase 2: Business Logic Test Coverage (Week 2)

### 2.1 API Route Test Coverage

#### **Complete API Testing Suite**
```typescript
// Example: Comprehensive API route testing
describe('Projects API', () => {
  let testEnv: TestEnvironment;
  let authToken: string;
  
  beforeEach(async () => {
    testEnv = await setupBasicTestEnvironment();
    authToken = await getTestAuthToken();
  });
  
  afterEach(async () => {
    await testEnv.cleanup();
  });
  
  describe('GET /api/projects', () => {
    it('should return projects for authenticated user', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
        
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
    
    it('should return 401 for unauthenticated requests', async () => {
      await request(app)
        .get('/api/projects')
        .expect(401);
    });
  });
  
  describe('POST /api/projects', () => {
    it('should create new project with valid data', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'Test Description',
        status: 'active'
      };
      
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(201);
        
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(projectData.name);
    });
    
    it('should validate required fields', async () => {
      const invalidData = { description: 'Missing name' };
      
      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });
  });
});
```

**Coverage Targets**:
- All CRUD operations for each entity
- Authentication and authorization validation
- Input validation and error handling
- Edge cases and boundary conditions

### 2.2 Business Workflow Testing

#### **End-to-End Workflow Tests**
```typescript
describe('Project Management Workflow', () => {
  it('should complete full project lifecycle', async () => {
    // 1. Create project
    const project = await createTestProject();
    
    // 2. Add scope items
    const scopeItems = await addScopeItems(project.id);
    
    // 3. Create material specifications
    const materialSpecs = await createMaterialSpecs(scopeItems);
    
    // 4. Generate construction reports
    const reports = await generateReports(project.id);
    
    // 5. Complete project
    await completeProject(project.id);
    
    // Verify entire workflow
    const finalProject = await getProject(project.id);
    expect(finalProject.status).toBe('completed');
  });
});
```

**Expected Outcome**: Complete business logic validation
**Timeline**: 5 days
**Success Criteria**: 60/65 tests passing

---

## Phase 3: Production-Ready Test Suite (Week 3)

### 3.1 Performance Testing

#### **Load Testing Implementation**
```typescript
// File: src/__tests__/performance/load-tests.ts
describe('Load Testing', () => {
  it('should handle 50 concurrent users', async () => {
    const promises = Array.from({ length: 50 }, () =>
      makeAuthenticatedRequest('/api/dashboard/stats')
    );
    
    const results = await Promise.allSettled(promises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    
    expect(successful).toBeGreaterThan(45); // 90% success rate
  });
  
  it('should respond within performance targets', async () => {
    const startTime = Date.now();
    await makeAuthenticatedRequest('/api/projects');
    const responseTime = Date.now() - startTime;
    
    expect(responseTime).toBeLessThan(200); // 200ms target
  });
});
```

#### **Memory Leak Testing**
```typescript
describe('Memory Management', () => {
  it('should not leak memory during extended usage', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Simulate extended usage
    for (let i = 0; i < 100; i++) {
      await simulateUserInteraction();
      
      // Force garbage collection periodically
      if (i % 10 === 0 && global.gc) {
        global.gc();
      }
    }
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Should not increase by more than 50MB
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });
});
```

### 3.2 Security Testing

#### **Security Validation Tests**
```typescript
describe('Security Validation', () => {
  it('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE projects; --";
    
    const response = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: maliciousInput })
      .expect(400);
      
    // Should sanitize input and reject malicious content
    expect(response.body.error).toContain('Invalid input');
  });
  
  it('should prevent XSS attacks', async () => {
    const xssInput = '<script>alert("xss")</script>';
    
    const response = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: xssInput });
      
    // Should sanitize and escape HTML
    expect(response.body.data.name).not.toContain('<script>');
  });
  
  it('should enforce rate limiting', async () => {
    // Make many requests quickly
    const promises = Array.from({ length: 200 }, () =>
      request(app).get('/api/projects')
    );
    
    const results = await Promise.allSettled(promises);
    const rateLimited = results.filter(r => 
      r.status === 'fulfilled' && r.value.status === 429
    );
    
    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
```

**Expected Outcome**: Comprehensive security validation
**Timeline**: 3 days
**Success Criteria**: All security tests passing, zero vulnerabilities

### 3.3 Regression Testing

#### **Automated Regression Test Suite**
```bash
#!/bin/bash
# File: scripts/regression-test.sh

echo "🔄 Running Regression Test Suite"

# 1. Run all unit tests
npm run test:api
if [ $? -ne 0 ]; then
    echo "❌ Unit tests failed"
    exit 1
fi

# 2. Run integration tests
npm run test:integration
if [ $? -ne 0 ]; then
    echo "❌ Integration tests failed"
    exit 1
fi

# 3. Run E2E tests
npm run test:e2e
if [ $? -ne 0 ]; then
    echo "❌ E2E tests failed"
    exit 1
fi

# 4. Performance validation
npm run validate-performance
if [ $? -ne 0 ]; then
    echo "❌ Performance regression detected"
    exit 1
fi

echo "✅ All regression tests passed"
```

**Expected Outcome**: Automated regression detection
**Timeline**: 2 days
**Success Criteria**: 64/65 tests passing (98% target)

---

## Test Infrastructure & Tools

### 4.1 Testing Tools Configuration

#### **Jest Configuration Optimization**
```javascript
// File: jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 30000, // Increased for integration tests
  projects: [
    {
      displayName: 'Unit Tests',
      testMatch: ['<rootDir>/src/__tests__/unit/**/*.test.ts']
    },
    {
      displayName: 'Integration Tests',
      testMatch: ['<rootDir>/src/__tests__/integration/**/*.test.ts'],
      testTimeout: 60000
    },
    {
      displayName: 'API Routes',
      testMatch: ['<rootDir>/src/__tests__/api/**/*.test.ts']
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/__tests__/**/*'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

#### **Playwright E2E Configuration**
```typescript
// File: playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './src/__tests__/e2e',
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3003',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ],
  webServer: {
    command: 'npm run build && npm run start',
    port: 3003,
    reuseExistingServer: !process.env.CI
  }
});
```

### 4.2 Test Data Management

#### **Test Data Factory Pattern**
```typescript
// File: src/__tests__/factories/index.ts
export class TestDataFactory {
  static createUser(overrides = {}) {
    return {
      id: randomUUID(),
      email: 'test@formulapm.com',
      role: 'project_manager',
      created_at: new Date().toISOString(),
      ...overrides
    };
  }
  
  static createProject(userId: string, overrides = {}) {
    return {
      id: randomUUID(),
      name: 'Test Project',
      description: 'Test project description',
      status: 'active',
      user_id: userId,
      created_at: new Date().toISOString(),
      ...overrides
    };
  }
  
  static createScopeItem(projectId: string, overrides = {}) {
    return {
      id: randomUUID(),
      project_id: projectId,
      description: 'Test scope item',
      quantity: 1,
      unit: 'each',
      status: 'pending',
      ...overrides
    };
  }
}
```

#### **Database Test Helpers**
```typescript
// File: src/__tests__/utils/database-helpers.ts
export class DatabaseTestHelpers {
  static async seedTestData() {
    const user = await this.createTestUser();
    const project = await this.createTestProject(user.id);
    const scopeItems = await this.createTestScopeItems(project.id, 5);
    
    return { user, project, scopeItems };
  }
  
  static async cleanupTestData() {
    // Clean up in reverse dependency order
    await supabase.from('scope_items').delete().eq('description', 'Test scope item');
    await supabase.from('projects').delete().eq('name', 'Test Project');
    await supabase.from('user_profiles').delete().eq('email', 'test@formulapm.com');
  }
  
  static async resetDatabase() {
    // Reset to clean state for tests
    await this.cleanupTestData();
    await this.seedTestData();
  }
}
```

---

## Testing Metrics & Monitoring

### 5.1 Success Metrics Dashboard

#### **Test Quality Metrics**
```typescript
// File: scripts/test-metrics.js
class TestMetrics {
  static calculateMetrics(testResults) {
    return {
      passRate: (testResults.passed / testResults.total) * 100,
      coverage: testResults.coverage,
      averageTestTime: testResults.totalTime / testResults.total,
      flakyTests: this.identifyFlakyTests(testResults),
      performanceTests: this.analyzePerformanceTests(testResults)
    };
  }
  
  static identifyFlakyTests(results) {
    // Identify tests that pass/fail inconsistently
    return results.tests.filter(test => test.retries > 0);
  }
  
  static generateReport(metrics) {
    console.log(`📊 Test Quality Report`);
    console.log(`Pass Rate: ${metrics.passRate.toFixed(1)}%`);
    console.log(`Coverage: ${metrics.coverage.toFixed(1)}%`);
    console.log(`Average Test Time: ${metrics.averageTestTime}ms`);
    console.log(`Flaky Tests: ${metrics.flakyTests.length}`);
  }
}
```

#### **Continuous Integration Metrics**
```yaml
# File: .github/workflows/test-monitoring.yml
name: Test Quality Monitoring

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run test suite with coverage
        run: npm run test:coverage
      
      - name: Generate test metrics
        run: node scripts/test-metrics.js
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results.json
```

### 5.2 Performance Benchmarking

#### **Test Performance Monitoring**
```typescript
// File: src/__tests__/utils/performance-monitor.ts
export class TestPerformanceMonitor {
  static async measureTestSuite() {
    const startTime = Date.now();
    
    // Run full test suite
    const results = await this.runAllTests();
    
    const totalTime = Date.now() - startTime;
    const metrics = {
      totalTime,
      averagePerTest: totalTime / results.totalTests,
      slowestTests: results.tests
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10),
      fastestTests: results.tests
        .sort((a, b) => a.duration - b.duration)
        .slice(0, 10)
    };
    
    this.reportPerformanceMetrics(metrics);
    return metrics;
  }
  
  static reportPerformanceMetrics(metrics) {
    console.log('⚡ Test Performance Metrics:');
    console.log(`Total execution time: ${metrics.totalTime}ms`);
    console.log(`Average per test: ${metrics.averagePerTest}ms`);
    
    console.log('\n🐌 Slowest tests:');
    metrics.slowestTests.forEach((test, i) => {
      console.log(`${i + 1}. ${test.name}: ${test.duration}ms`);
    });
  }
}
```

---

## Implementation Timeline

### **Week 1: Critical Test Fixes (Days 1-7)**
- **Days 1-2**: Authentication test fixes
- **Days 3-4**: Test environment setup
- **Days 5-6**: Integration test stabilization  
- **Day 7**: Validation and metrics (Target: 85% pass rate)

### **Week 2: Business Logic Coverage (Days 8-14)**
- **Days 8-10**: Complete API route test coverage
- **Days 11-12**: Business workflow testing
- **Days 13-14**: Performance and load testing (Target: 92% pass rate)

### **Week 3: Production Readiness (Days 15-21)**
- **Days 15-17**: Security testing implementation
- **Days 18-19**: Regression testing automation
- **Days 20-21**: Final validation and documentation (Target: 98% pass rate)

---

## Risk Mitigation

### **High-Risk Areas**
1. **Authentication System**: Complex token refresh logic
2. **Test Environment**: Supabase cloud connectivity
3. **Integration Tests**: Database state management
4. **E2E Tests**: Browser automation reliability

### **Mitigation Strategies**
- **Isolation**: Each test runs with fresh data
- **Mocking**: Extensive use of mocks for external dependencies
- **Retry Logic**: Automatic retry for flaky tests
- **Parallel Execution**: Tests run in parallel for speed
- **Environment Validation**: Pre-test environment checks

---

## Expected Outcomes

### **Phase 1 Results**
- Test pass rate: 46% → 85%
- Authentication tests: 0/15 → 13/15 passing
- Test execution time: <5 minutes
- Environment stability: 100% reliable

### **Phase 2 Results**  
- Test pass rate: 85% → 92%
- API coverage: 100% of critical endpoints
- Business workflow validation: Complete
- Performance test coverage: Implemented

### **Phase 3 Results**
- Test pass rate: 92% → 98%
- Security test coverage: 100%
- Regression testing: Automated
- Production readiness: Validated

---

**Status**: Strategy Complete - Ready for Implementation  
**Next Steps**: Begin Phase 1 authentication test fixes  
**Success Definition**: 98% test pass rate achieved and sustained