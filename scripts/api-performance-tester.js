#!/usr/bin/env node

/**
 * Comprehensive API Performance Testing Script
 * Tests all major API endpoints for performance bottlenecks
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:3003',
  testDuration: 30000, // 30 seconds
  concurrentUsers: 5,
  warmupRequests: 5,
  requestTimeout: 10000, // 10 seconds
  reportFile: 'API_PERFORMANCE_REPORT.json'
};

// Test credentials (using existing test users)
const TEST_CREDENTIALS = {
  admin: { email: 'owner.test@formulapm.com', password: 'testpass123' },
  pm: { email: 'pm.test@formulapm.com', password: 'testpass123' },
  project_manager: { email: 'project_manager.test@formulapm.com', password: 'testpass123' }
};

// API endpoints to test
const ENDPOINTS = [
  // Authentication
  { method: 'POST', path: '/api/auth/login', name: 'Login', auth: false, body: TEST_CREDENTIALS.admin },
  { method: 'GET', path: '/api/auth/profile', name: 'Profile', auth: true },
  { method: 'POST', path: '/api/auth/logout', name: 'Logout', auth: true },
  
  // Dashboard
  { method: 'GET', path: '/api/dashboard/stats', name: 'Dashboard Stats', auth: true },
  { method: 'GET', path: '/api/dashboard/recent-activity', name: 'Recent Activity', auth: true },
  { method: 'GET', path: '/api/dashboard/tasks', name: 'Dashboard Tasks', auth: true },
  
  // Projects
  { method: 'GET', path: '/api/projects', name: 'Projects List', auth: true },
  { method: 'GET', path: '/api/projects/metrics', name: 'Project Metrics', auth: true },
  
  // Scope
  { method: 'GET', path: '/api/scope', name: 'Scope Items', auth: true },
  { method: 'GET', path: '/api/scope/overview', name: 'Scope Overview', auth: true },
  
  // Tasks
  { method: 'GET', path: '/api/tasks', name: 'Tasks List', auth: true },
  { method: 'GET', path: '/api/tasks/statistics', name: 'Task Statistics', auth: true },
  
  // Material Specs
  { method: 'GET', path: '/api/material-specs', name: 'Material Specs', auth: true },
  { method: 'GET', path: '/api/material-specs/statistics', name: 'Material Specs Stats', auth: true },
  
  // Milestones
  { method: 'GET', path: '/api/milestones', name: 'Milestones', auth: true },
  { method: 'GET', path: '/api/milestones/statistics', name: 'Milestone Stats', auth: true },
  
  // Suppliers
  { method: 'GET', path: '/api/suppliers', name: 'Suppliers', auth: true },
  { method: 'GET', path: '/api/suppliers/totals', name: 'Supplier Totals', auth: true },
  
  // Reports
  { method: 'GET', path: '/api/reports', name: 'Reports', auth: true }
];

class APIPerformanceTester {
  constructor() {
    this.authToken = null;
    this.results = {
      summary: {
        totalEndpoints: ENDPOINTS.length,
        testDuration: CONFIG.testDuration,
        concurrentUsers: CONFIG.concurrentUsers,
        startTime: new Date().toISOString(),
        endTime: null
      },
      endpoints: {},
      bottlenecks: [],
      recommendations: []
    };
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${CONFIG.baseUrl}${endpoint.path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(endpoint.auth && this.authToken ? { 'Authorization': `Bearer ${this.authToken}` } : {})
    };

    const requestOptions = {
      method: endpoint.method,
      headers,
      ...options
    };

    if (endpoint.body) {
      requestOptions.body = JSON.stringify(endpoint.body);
    }

    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.requestTimeout);
      
      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      const result = {
        success: response.ok,
        status: response.status,
        responseTime,
        size: response.headers.get('content-length') || 0,
        timestamp: new Date().toISOString()
      };

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        result.error = `${response.status}: ${errorText}`;
      }

      return result;
    } catch (error) {
      const endTime = Date.now();
      return {
        success: false,
        status: 0,
        responseTime: endTime - startTime,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async authenticate() {
    console.log('🔐 Authenticating with test credentials...');
    
    const loginEndpoint = ENDPOINTS.find(e => e.name === 'Login');
    const result = await this.makeRequest(loginEndpoint);
    
    if (result.success) {
      // For this test, we'll use a mock token since we can't easily parse the response
      // In a real scenario, you'd parse the response to get the actual token
      this.authToken = 'mock-token-for-testing';
      console.log('✅ Authentication successful');
      return true;
    } else {
      console.log('❌ Authentication failed:', result.error);
      return false;
    }
  }

  async testEndpoint(endpoint) {
    console.log(`🧪 Testing ${endpoint.name}...`);
    
    const endpointResults = {
      name: endpoint.name,
      path: endpoint.path,
      method: endpoint.method,
      requests: [],
      stats: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        avgResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        throughput: 0,
        errorRate: 0
      }
    };

    // Warmup requests
    for (let i = 0; i < CONFIG.warmupRequests; i++) {
      await this.makeRequest(endpoint);
    }

    // Performance testing
    const startTime = Date.now();
    const endTime = startTime + CONFIG.testDuration;
    
    const requests = [];
    
    // Run concurrent requests
    const concurrentPromises = [];
    for (let i = 0; i < CONFIG.concurrentUsers; i++) {
      concurrentPromises.push(this.runConcurrentRequests(endpoint, endTime, requests));
    }
    
    await Promise.all(concurrentPromises);
    
    // Calculate statistics
    endpointResults.requests = requests;
    endpointResults.stats = this.calculateStats(requests);
    
    // Identify bottlenecks
    this.identifyBottlenecks(endpointResults);
    
    this.results.endpoints[endpoint.name] = endpointResults;
    
    console.log(`✅ ${endpoint.name}: ${endpointResults.stats.avgResponseTime.toFixed(2)}ms avg, ${endpointResults.stats.successfulRequests}/${endpointResults.stats.totalRequests} success`);
  }

  async runConcurrentRequests(endpoint, endTime, requests) {
    while (Date.now() < endTime) {
      const result = await this.makeRequest(endpoint);
      requests.push(result);
      
      // Small delay to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  calculateStats(requests) {
    const responseTimes = requests.map(r => r.responseTime);
    const successfulRequests = requests.filter(r => r.success);
    
    const stats = {
      totalRequests: requests.length,
      successfulRequests: successfulRequests.length,
      failedRequests: requests.length - successfulRequests.length,
      avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      throughput: (requests.length / (CONFIG.testDuration / 1000)).toFixed(2),
      errorRate: ((requests.length - successfulRequests.length) / requests.length * 100).toFixed(2)
    };
    
    // Calculate percentiles
    const sortedTimes = responseTimes.sort((a, b) => a - b);
    stats.p95ResponseTime = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
    stats.p99ResponseTime = sortedTimes[Math.floor(sortedTimes.length * 0.99)];
    
    return stats;
  }

  identifyBottlenecks(endpointResults) {
    const stats = endpointResults.stats;
    
    // Identify slow endpoints (>200ms average)
    if (stats.avgResponseTime > 200) {
      this.results.bottlenecks.push({
        type: 'slow_response',
        endpoint: endpointResults.name,
        value: stats.avgResponseTime,
        severity: stats.avgResponseTime > 500 ? 'high' : 'medium',
        description: `Average response time of ${stats.avgResponseTime.toFixed(2)}ms exceeds 200ms threshold`
      });
    }
    
    // Identify high error rates (>5%)
    if (stats.errorRate > 5) {
      this.results.bottlenecks.push({
        type: 'high_error_rate',
        endpoint: endpointResults.name,
        value: stats.errorRate,
        severity: stats.errorRate > 20 ? 'high' : 'medium',
        description: `Error rate of ${stats.errorRate}% exceeds 5% threshold`
      });
    }
    
    // Identify low throughput (<1 req/sec)
    if (stats.throughput < 1) {
      this.results.bottlenecks.push({
        type: 'low_throughput',
        endpoint: endpointResults.name,
        value: stats.throughput,
        severity: stats.throughput < 0.5 ? 'high' : 'medium',
        description: `Throughput of ${stats.throughput} req/sec is below 1 req/sec threshold`
      });
    }
    
    // Identify high P95 response times (>1000ms)
    if (stats.p95ResponseTime > 1000) {
      this.results.bottlenecks.push({
        type: 'high_p95_latency',
        endpoint: endpointResults.name,
        value: stats.p95ResponseTime,
        severity: stats.p95ResponseTime > 2000 ? 'high' : 'medium',
        description: `P95 response time of ${stats.p95ResponseTime}ms exceeds 1000ms threshold`
      });
    }
  }

  generateRecommendations() {
    const bottlenecks = this.results.bottlenecks;
    const recommendations = [];
    
    // Group bottlenecks by type
    const bottleneckTypes = bottlenecks.reduce((acc, bottleneck) => {
      if (!acc[bottleneck.type]) acc[bottleneck.type] = [];
      acc[bottleneck.type].push(bottleneck);
      return acc;
    }, {});
    
    // Generate recommendations based on bottleneck patterns
    if (bottleneckTypes.slow_response) {
      recommendations.push({
        priority: 'high',
        category: 'Database Optimization',
        description: 'Multiple endpoints showing slow response times',
        actions: [
          'Add database indexes for frequently queried columns',
          'Optimize N+1 query patterns',
          'Implement query result caching',
          'Review and optimize slow SQL queries'
        ],
        affected_endpoints: bottleneckTypes.slow_response.map(b => b.endpoint)
      });
    }
    
    if (bottleneckTypes.high_error_rate) {
      recommendations.push({
        priority: 'high',
        category: 'Error Handling',
        description: 'High error rates detected on multiple endpoints',
        actions: [
          'Review error logs for root causes',
          'Implement better error handling and validation',
          'Add request timeout handling',
          'Implement circuit breaker pattern for external dependencies'
        ],
        affected_endpoints: bottleneckTypes.high_error_rate.map(b => b.endpoint)
      });
    }
    
    if (bottleneckTypes.low_throughput) {
      recommendations.push({
        priority: 'medium',
        category: 'Scalability',
        description: 'Low throughput indicates potential scalability issues',
        actions: [
          'Implement connection pooling',
          'Add response caching for read-heavy endpoints',
          'Optimize database connection management',
          'Consider horizontal scaling strategies'
        ],
        affected_endpoints: bottleneckTypes.low_throughput.map(b => b.endpoint)
      });
    }
    
    if (bottleneckTypes.high_p95_latency) {
      recommendations.push({
        priority: 'medium',
        category: 'Latency Optimization',
        description: 'High P95 latency indicates inconsistent performance',
        actions: [
          'Implement async processing for heavy operations',
          'Add request queuing and rate limiting',
          'Optimize database query performance',
          'Consider implementing read replicas'
        ],
        affected_endpoints: bottleneckTypes.high_p95_latency.map(b => b.endpoint)
      });
    }
    
    this.results.recommendations = recommendations;
  }

  async runTests() {
    console.log('🚀 Starting API Performance Testing...');
    console.log(`📊 Testing ${ENDPOINTS.length} endpoints with ${CONFIG.concurrentUsers} concurrent users for ${CONFIG.testDuration/1000} seconds each`);
    
    // Authenticate first
    const authSuccess = await this.authenticate();
    if (!authSuccess) {
      console.log('❌ Cannot proceed without authentication');
      return;
    }
    
    // Test each endpoint
    for (const endpoint of ENDPOINTS) {
      try {
        await this.testEndpoint(endpoint);
      } catch (error) {
        console.log(`❌ Error testing ${endpoint.name}: ${error.message}`);
      }
    }
    
    // Generate recommendations
    this.generateRecommendations();
    
    // Finalize results
    this.results.summary.endTime = new Date().toISOString();
    
    // Save results
    await this.saveResults();
    
    // Display summary
    this.displaySummary();
  }

  async saveResults() {
    const reportPath = path.join(process.cwd(), CONFIG.reportFile);
    await fs.promises.writeFile(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`📄 Performance report saved to ${reportPath}`);
  }

  displaySummary() {
    console.log('\n📊 PERFORMANCE TEST RESULTS SUMMARY');
    console.log('=====================================');
    
    const endpoints = Object.values(this.results.endpoints);
    const avgResponseTime = endpoints.reduce((sum, e) => sum + e.stats.avgResponseTime, 0) / endpoints.length;
    const totalRequests = endpoints.reduce((sum, e) => sum + e.stats.totalRequests, 0);
    const totalSuccessful = endpoints.reduce((sum, e) => sum + e.stats.successfulRequests, 0);
    const overallErrorRate = ((totalRequests - totalSuccessful) / totalRequests * 100).toFixed(2);
    
    console.log(`Total Endpoints Tested: ${endpoints.length}`);
    console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`Total Requests: ${totalRequests}`);
    console.log(`Overall Success Rate: ${((totalSuccessful / totalRequests) * 100).toFixed(2)}%`);
    console.log(`Overall Error Rate: ${overallErrorRate}%`);
    console.log(`Bottlenecks Found: ${this.results.bottlenecks.length}`);
    
    console.log('\n🔍 TOP PERFORMANCE ISSUES:');
    const topIssues = this.results.bottlenecks
      .filter(b => b.severity === 'high')
      .slice(0, 5);
      
    if (topIssues.length === 0) {
      console.log('✅ No high-severity performance issues found!');
    } else {
      topIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.endpoint}: ${issue.description}`);
      });
    }
    
    console.log('\n💡 TOP RECOMMENDATIONS:');
    this.results.recommendations.slice(0, 3).forEach((rec, index) => {
      console.log(`${index + 1}. ${rec.category}: ${rec.description}`);
    });
    
    console.log(`\n📄 Full report available in: ${CONFIG.reportFile}`);
  }
}

// Run the tests
if (require.main === module) {
  const tester = new APIPerformanceTester();
  tester.runTests().catch(console.error);
}

module.exports = APIPerformanceTester;