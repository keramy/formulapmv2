#!/usr/bin/env node

/**
 * Authentication Performance Tester
 * Tests JWT token verification overhead and auth middleware performance
 */

const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  testIterations: 1000,
  reportFile: 'AUTH_PERFORMANCE_REPORT.json',
  mockTokens: [
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid',
    'invalid.token.format'
  ]
};

class AuthPerformanceTester {
  constructor() {
    this.results = {
      summary: {
        testIterations: CONFIG.testIterations,
        testTime: new Date().toISOString(),
        totalTests: 0,
        avgProcessingTime: 0,
        bottlenecks: []
      },
      tests: {
        jwtParsing: [],
        tokenValidation: [],
        authMiddleware: [],
        permissionChecks: []
      },
      recommendations: []
    };
  }

  async testJWTTokenParsing() {
    console.log('🔐 Testing JWT Token Parsing Performance...');
    
    const results = [];
    
    for (let i = 0; i < CONFIG.testIterations; i++) {
      const token = CONFIG.mockTokens[i % CONFIG.mockTokens.length];
      
      const startTime = process.hrtime.bigint();
      
      try {
        // Simulate JWT parsing (without actually importing jsonwebtoken for speed)
        const parts = token.split('.');
        if (parts.length !== 3) {
          throw new Error('Invalid token format');
        }
        
        // Decode payload (simulation)
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        
        const endTime = process.hrtime.bigint();
        const processingTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        
        results.push({
          iteration: i + 1,
          processingTime,
          success: true,
          payload
        });
        
      } catch (error) {
        const endTime = process.hrtime.bigint();
        const processingTime = Number(endTime - startTime) / 1000000;
        
        results.push({
          iteration: i + 1,
          processingTime,
          success: false,
          error: error.message
        });
      }
    }
    
    this.results.tests.jwtParsing = results;
    
    const avgTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;
    const successRate = (results.filter(r => r.success).length / results.length) * 100;
    
    console.log(`✅ JWT Parsing: ${avgTime.toFixed(3)}ms average, ${successRate.toFixed(1)}% success rate`);
    
    return { avgTime, successRate };
  }

  async testTokenValidation() {
    console.log('🔍 Testing Token Validation Performance...');
    
    const results = [];
    
    for (let i = 0; i < CONFIG.testIterations; i++) {
      const token = CONFIG.mockTokens[i % CONFIG.mockTokens.length];
      
      const startTime = process.hrtime.bigint();
      
      try {
        // Simulate token validation logic
        const isValid = await this.validateToken(token);
        
        const endTime = process.hrtime.bigint();
        const processingTime = Number(endTime - startTime) / 1000000;
        
        results.push({
          iteration: i + 1,
          processingTime,
          success: isValid,
          token: token.substring(0, 20) + '...'
        });
        
      } catch (error) {
        const endTime = process.hrtime.bigint();
        const processingTime = Number(endTime - startTime) / 1000000;
        
        results.push({
          iteration: i + 1,
          processingTime,
          success: false,
          error: error.message
        });
      }
    }
    
    this.results.tests.tokenValidation = results;
    
    const avgTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;
    const successRate = (results.filter(r => r.success).length / results.length) * 100;
    
    console.log(`✅ Token Validation: ${avgTime.toFixed(3)}ms average, ${successRate.toFixed(1)}% success rate`);
    
    return { avgTime, successRate };
  }

  async testAuthMiddleware() {
    console.log('🛡️ Testing Auth Middleware Performance...');
    
    const results = [];
    
    for (let i = 0; i < CONFIG.testIterations; i++) {
      const mockRequest = {
        headers: {
          authorization: `Bearer ${CONFIG.mockTokens[i % CONFIG.mockTokens.length]}`
        }
      };
      
      const startTime = process.hrtime.bigint();
      
      try {
        // Simulate auth middleware logic
        const authResult = await this.simulateAuthMiddleware(mockRequest);
        
        const endTime = process.hrtime.bigint();
        const processingTime = Number(endTime - startTime) / 1000000;
        
        results.push({
          iteration: i + 1,
          processingTime,
          success: authResult.success,
          userId: authResult.userId,
          role: authResult.role
        });
        
      } catch (error) {
        const endTime = process.hrtime.bigint();
        const processingTime = Number(endTime - startTime) / 1000000;
        
        results.push({
          iteration: i + 1,
          processingTime,
          success: false,
          error: error.message
        });
      }
    }
    
    this.results.tests.authMiddleware = results;
    
    const avgTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;
    const successRate = (results.filter(r => r.success).length / results.length) * 100;
    
    console.log(`✅ Auth Middleware: ${avgTime.toFixed(3)}ms average, ${successRate.toFixed(1)}% success rate`);
    
    return { avgTime, successRate };
  }

  async testPermissionChecks() {
    console.log('🔒 Testing Permission Check Performance...');
    
    const results = [];
    const permissions = ['read:projects', 'write:projects', 'delete:projects', 'admin:users'];
    const roles = ['admin', 'project_manager', 'architect', 'client'];
    
    for (let i = 0; i < CONFIG.testIterations; i++) {
      const role = roles[i % roles.length];
      const permission = permissions[i % permissions.length];
      
      const startTime = process.hrtime.bigint();
      
      try {
        // Simulate permission check logic
        const hasPermission = await this.simulatePermissionCheck(role, permission);
        
        const endTime = process.hrtime.bigint();
        const processingTime = Number(endTime - startTime) / 1000000;
        
        results.push({
          iteration: i + 1,
          processingTime,
          success: true,
          role,
          permission,
          hasPermission
        });
        
      } catch (error) {
        const endTime = process.hrtime.bigint();
        const processingTime = Number(endTime - startTime) / 1000000;
        
        results.push({
          iteration: i + 1,
          processingTime,
          success: false,
          error: error.message
        });
      }
    }
    
    this.results.tests.permissionChecks = results;
    
    const avgTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;
    const successRate = (results.filter(r => r.success).length / results.length) * 100;
    
    console.log(`✅ Permission Checks: ${avgTime.toFixed(3)}ms average, ${successRate.toFixed(1)}% success rate`);
    
    return { avgTime, successRate };
  }

  async validateToken(token) {
    // Simulate async token validation
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2)); // 0-2ms delay
    
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }
    
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      return payload.exp ? payload.exp > Date.now() / 1000 : true;
    } catch (error) {
      return false;
    }
  }

  async simulateAuthMiddleware(request) {
    // Simulate database lookup delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 5)); // 0-5ms delay
    
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new Error('No authorization header');
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new Error('No token provided');
    }
    
    const isValid = await this.validateToken(token);
    if (!isValid) {
      throw new Error('Invalid token');
    }
    
    return {
      success: true,
      userId: 'user-123',
      role: 'admin'
    };
  }

  async simulatePermissionCheck(role, permission) {
    // Simulate permission lookup delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 3)); // 0-3ms delay
    
    const rolePermissions = {
      admin: ['read:projects', 'write:projects', 'delete:projects', 'admin:users'],
      project_manager: ['read:projects', 'write:projects'],
      architect: ['read:projects', 'write:projects'],
      client: ['read:projects']
    };
    
    return rolePermissions[role]?.includes(permission) || false;
  }

  analyzeResults() {
    console.log('\n📊 Analyzing Performance Results...');
    
    const allTests = Object.values(this.results.tests).flat();
    const totalTests = allTests.length;
    const avgProcessingTime = allTests.reduce((sum, test) => sum + test.processingTime, 0) / totalTests;
    
    this.results.summary.totalTests = totalTests;
    this.results.summary.avgProcessingTime = avgProcessingTime;
    
    // Identify bottlenecks
    const bottlenecks = [];
    
    // Check JWT parsing performance
    const jwtAvg = this.results.tests.jwtParsing.reduce((sum, test) => sum + test.processingTime, 0) / this.results.tests.jwtParsing.length;
    if (jwtAvg > 1.0) {
      bottlenecks.push({
        type: 'jwt_parsing',
        avgTime: jwtAvg,
        severity: jwtAvg > 2.0 ? 'high' : 'medium',
        description: `JWT parsing takes ${jwtAvg.toFixed(3)}ms on average`
      });
    }
    
    // Check token validation performance
    const validationAvg = this.results.tests.tokenValidation.reduce((sum, test) => sum + test.processingTime, 0) / this.results.tests.tokenValidation.length;
    if (validationAvg > 2.0) {
      bottlenecks.push({
        type: 'token_validation',
        avgTime: validationAvg,
        severity: validationAvg > 5.0 ? 'high' : 'medium',
        description: `Token validation takes ${validationAvg.toFixed(3)}ms on average`
      });
    }
    
    // Check auth middleware performance
    const middlewareAvg = this.results.tests.authMiddleware.reduce((sum, test) => sum + test.processingTime, 0) / this.results.tests.authMiddleware.length;
    if (middlewareAvg > 5.0) {
      bottlenecks.push({
        type: 'auth_middleware',
        avgTime: middlewareAvg,
        severity: middlewareAvg > 10.0 ? 'high' : 'medium',
        description: `Auth middleware takes ${middlewareAvg.toFixed(3)}ms on average`
      });
    }
    
    // Check permission check performance
    const permissionAvg = this.results.tests.permissionChecks.reduce((sum, test) => sum + test.processingTime, 0) / this.results.tests.permissionChecks.length;
    if (permissionAvg > 3.0) {
      bottlenecks.push({
        type: 'permission_checks',
        avgTime: permissionAvg,
        severity: permissionAvg > 6.0 ? 'high' : 'medium',
        description: `Permission checks take ${permissionAvg.toFixed(3)}ms on average`
      });
    }
    
    this.results.summary.bottlenecks = bottlenecks;
  }

  generateRecommendations() {
    console.log('💡 Generating Performance Recommendations...');
    
    const recommendations = [];
    
    // JWT Performance Recommendations
    const jwtBottleneck = this.results.summary.bottlenecks.find(b => b.type === 'jwt_parsing');
    if (jwtBottleneck) {
      recommendations.push({
        priority: 'high',
        category: 'JWT Processing',
        description: 'JWT parsing is slower than expected',
        actions: [
          'Consider caching JWT parsing results',
          'Use a faster JWT library',
          'Implement JWT token pooling',
          'Pre-validate token format before parsing'
        ]
      });
    }
    
    // Token Validation Recommendations
    const validationBottleneck = this.results.summary.bottlenecks.find(b => b.type === 'token_validation');
    if (validationBottleneck) {
      recommendations.push({
        priority: 'high',
        category: 'Token Validation',
        description: 'Token validation is taking too long',
        actions: [
          'Implement token caching for recently validated tokens',
          'Use async token validation',
          'Consider shorter token expiration times',
          'Implement token blacklisting instead of validation'
        ]
      });
    }
    
    // Middleware Performance Recommendations
    const middlewareBottleneck = this.results.summary.bottlenecks.find(b => b.type === 'auth_middleware');
    if (middlewareBottleneck) {
      recommendations.push({
        priority: 'high',
        category: 'Auth Middleware',
        description: 'Authentication middleware is slow',
        actions: [
          'Cache user profiles to reduce database lookups',
          'Use connection pooling for database queries',
          'Implement async user lookups',
          'Consider using Redis for session storage'
        ]
      });
    }
    
    // Permission Check Recommendations
    const permissionBottleneck = this.results.summary.bottlenecks.find(b => b.type === 'permission_checks');
    if (permissionBottleneck) {
      recommendations.push({
        priority: 'medium',
        category: 'Permission Checks',
        description: 'Permission checks are slower than optimal',
        actions: [
          'Cache permission mappings in memory',
          'Use bitwise operations for permission checks',
          'Pre-compute user permissions at login',
          'Implement role-based caching'
        ]
      });
    }
    
    // General Performance Recommendations
    recommendations.push({
      priority: 'medium',
      category: 'General Auth Performance',
      description: 'Overall authentication performance improvements',
      actions: [
        'Implement Redis caching for frequently accessed data',
        'Use async operations throughout the auth flow',
        'Consider JWT refresh token strategy',
        'Monitor auth performance in production'
      ]
    });
    
    this.results.recommendations = recommendations;
  }

  async generateReport() {
    console.log('\n📄 Generating Performance Report...');
    
    const reportPath = path.join(process.cwd(), CONFIG.reportFile);
    await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
    
    console.log(`Report saved to: ${reportPath}`);
    
    this.displaySummary();
  }

  displaySummary() {
    console.log('\n📊 AUTH PERFORMANCE TEST SUMMARY');
    console.log('=================================');
    
    console.log(`Total tests run: ${this.results.summary.totalTests}`);
    console.log(`Average processing time: ${this.results.summary.avgProcessingTime.toFixed(3)}ms`);
    console.log(`Bottlenecks found: ${this.results.summary.bottlenecks.length}`);
    console.log(`Recommendations: ${this.results.recommendations.length}`);
    
    if (this.results.summary.bottlenecks.length > 0) {
      console.log('\n🚨 PERFORMANCE BOTTLENECKS:');
      this.results.summary.bottlenecks.forEach((bottleneck, index) => {
        console.log(`${index + 1}. ${bottleneck.type}: ${bottleneck.description} (${bottleneck.severity} severity)`);
      });
    }
    
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 TOP RECOMMENDATIONS:');
      this.results.recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(`${index + 1}. ${rec.category}: ${rec.description}`);
      });
    }
  }

  async run() {
    console.log('🚀 Starting Authentication Performance Testing...');
    
    try {
      await this.testJWTTokenParsing();
      await this.testTokenValidation();
      await this.testAuthMiddleware();
      await this.testPermissionChecks();
      
      this.analyzeResults();
      this.generateRecommendations();
      await this.generateReport();
      
      console.log('\n✅ Authentication performance testing completed!');
    } catch (error) {
      console.error('❌ Testing failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the tests
if (require.main === module) {
  const tester = new AuthPerformanceTester();
  tester.run().catch(console.error);
}

module.exports = AuthPerformanceTester;