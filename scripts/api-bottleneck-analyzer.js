#!/usr/bin/env node

/**
 * API Bottleneck Analyzer
 * Analyzes API route files to identify potential performance bottlenecks
 */

const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');

// Configuration
const CONFIG = {
  apiRoutesPath: 'src/app/api',
  reportFile: 'API_BOTTLENECK_ANALYSIS_REPORT.json',
  patterns: {
    // Performance bottleneck patterns
    nPlusOneQuery: /\.(map|forEach)\s*\(.*await.*\)/g,
    syncDatabase: /await.*\.(from|select|insert|update|delete).*(?!\.then)/g,
    missingPagination: /\.select\(\*\)|\.select\(\)/g,
    missingIndexHints: /WHERE.*=.*AND/g,
    heavyComputations: /(JSON\.parse|JSON\.stringify|.*\.sort\(|.*\.filter\()/g,
    missingCaching: /(?!.*cache).*await.*\.(from|select)/g,
    fileOperations: /(readFile|writeFile|stat|access)/g,
    externalApiCalls: /fetch\(|axios\.|http\./g,
    largeDataSets: /\.select\(\*\)|LIMIT\s+\d{3,}/g,
    inefficientJoins: /JOIN.*JOIN.*JOIN/g,
    missingErrorHandling: /await.*(?!try)(?!catch)/g,
    syncOperations: /(?!async).*function.*\(/g
  },
  endpoints: []
};

class APIBottleneckAnalyzer {
  constructor() {
    this.results = {
      summary: {
        totalRoutes: 0,
        routesAnalyzed: 0,
        bottlenecksFound: 0,
        highSeverityIssues: 0,
        analysisTime: new Date().toISOString()
      },
      routes: {},
      bottlenecks: [],
      recommendations: []
    };
  }

  async findAPIRoutes() {
    console.log('🔍 Scanning API routes...');
    
    const pattern = path.join(CONFIG.apiRoutesPath, '**/route.ts').replace(/\\/g, '/');
    
    return new Promise((resolve, reject) => {
      glob(pattern, (err, files) => {
        if (err) {
          reject(err);
          return;
        }
        
        this.results.summary.totalRoutes = files.length;
        console.log(`Found ${files.length} API route files`);
        resolve(files);
      });
    });
  }

  async analyzeRouteFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const relativePath = path.relative(process.cwd(), filePath);
      
      console.log(`📊 Analyzing: ${relativePath}`);
      
      const analysis = {
        path: relativePath,
        size: content.length,
        lines: content.split('\n').length,
        methods: this.extractMethods(content),
        issues: [],
        severity: 'low',
        recommendations: []
      };
      
      // Analyze for performance patterns
      await this.analyzePerformancePatterns(content, analysis);
      
      // Analyze code complexity
      this.analyzeComplexity(content, analysis);
      
      // Analyze database operations
      this.analyzeDatabaseOperations(content, analysis);
      
      // Determine overall severity
      this.calculateSeverity(analysis);
      
      this.results.routes[relativePath] = analysis;
      this.results.summary.routesAnalyzed++;
      
      return analysis;
    } catch (error) {
      console.error(`❌ Error analyzing ${filePath}: ${error.message}`);
      return null;
    }
  }

  extractMethods(content) {
    const methods = [];
    const methodRegex = /export\s+(?:async\s+)?function\s+(\w+)|export\s+const\s+(\w+)\s*=\s*(?:async\s+)?/g;
    let match;
    
    while ((match = methodRegex.exec(content)) !== null) {
      methods.push(match[1] || match[2]);
    }
    
    return methods;
  }

  async analyzePerformancePatterns(content, analysis) {
    for (const [patternName, pattern] of Object.entries(CONFIG.patterns)) {
      const matches = content.match(pattern);
      
      if (matches) {
        const issue = {
          type: patternName,
          count: matches.length,
          severity: this.getPatternSeverity(patternName),
          description: this.getPatternDescription(patternName),
          examples: matches.slice(0, 3), // Show first 3 examples
          recommendation: this.getPatternRecommendation(patternName)
        };
        
        analysis.issues.push(issue);
        
        // Add to global bottlenecks
        this.results.bottlenecks.push({
          route: analysis.path,
          ...issue
        });
      }
    }
  }

  analyzeComplexity(content, analysis) {
    // Count nested loops
    const nestedLoops = (content.match(/for\s*\(.*for\s*\(|while\s*\(.*while\s*\(/g) || []).length;
    if (nestedLoops > 0) {
      analysis.issues.push({
        type: 'nested_loops',
        count: nestedLoops,
        severity: 'medium',
        description: 'Nested loops detected - potential O(n²) complexity',
        recommendation: 'Consider optimizing nested loops with better algorithms'
      });
    }
    
    // Count function length
    const functionLines = content.split('\n').filter(line => line.trim().length > 0).length;
    if (functionLines > 100) {
      analysis.issues.push({
        type: 'large_function',
        count: functionLines,
        severity: 'medium',
        description: 'Large function detected - may be hard to maintain and optimize',
        recommendation: 'Consider breaking down large functions into smaller, focused functions'
      });
    }
    
    // Count database operations in single function
    const dbOperations = (content.match(/await.*\.(from|select|insert|update|delete)/g) || []).length;
    if (dbOperations > 5) {
      analysis.issues.push({
        type: 'multiple_db_operations',
        count: dbOperations,
        severity: 'high',
        description: 'Multiple database operations in single function',
        recommendation: 'Consider batching operations or using transactions'
      });
    }
  }

  analyzeDatabaseOperations(content, analysis) {
    // Check for missing transactions
    const dbWrites = (content.match(/\.(insert|update|delete)\(/g) || []).length;
    const transactions = (content.match(/\.transaction\(/g) || []).length;
    
    if (dbWrites > 1 && transactions === 0) {
      analysis.issues.push({
        type: 'missing_transactions',
        count: dbWrites,
        severity: 'high',
        description: 'Multiple write operations without transactions',
        recommendation: 'Wrap related database operations in transactions'
      });
    }
    
    // Check for missing connection pooling
    const directConnections = (content.match(/createClient\(/g) || []).length;
    if (directConnections > 1) {
      analysis.issues.push({
        type: 'multiple_connections',
        count: directConnections,
        severity: 'medium',
        description: 'Multiple database connections created',
        recommendation: 'Use connection pooling or reuse existing connections'
      });
    }
    
    // Check for missing query optimization
    const selectAll = (content.match(/\.select\(\*\)/g) || []).length;
    if (selectAll > 0) {
      analysis.issues.push({
        type: 'select_all',
        count: selectAll,
        severity: 'medium',
        description: 'SELECT * queries found',
        recommendation: 'Select only required columns to reduce data transfer'
      });
    }
  }

  calculateSeverity(analysis) {
    const highSeverityIssues = analysis.issues.filter(i => i.severity === 'high').length;
    const mediumSeverityIssues = analysis.issues.filter(i => i.severity === 'medium').length;
    
    if (highSeverityIssues > 0) {
      analysis.severity = 'high';
      this.results.summary.highSeverityIssues++;
    } else if (mediumSeverityIssues > 0) {
      analysis.severity = 'medium';
    } else {
      analysis.severity = 'low';
    }
  }

  getPatternSeverity(patternName) {
    const severityMap = {
      nPlusOneQuery: 'high',
      syncDatabase: 'medium',
      missingPagination: 'high',
      missingIndexHints: 'medium',
      heavyComputations: 'medium',
      missingCaching: 'medium',
      fileOperations: 'medium',
      externalApiCalls: 'medium',
      largeDataSets: 'high',
      inefficientJoins: 'high',
      missingErrorHandling: 'high',
      syncOperations: 'low'
    };
    
    return severityMap[patternName] || 'low';
  }

  getPatternDescription(patternName) {
    const descriptions = {
      nPlusOneQuery: 'N+1 query pattern detected - queries executed in loops',
      syncDatabase: 'Synchronous database operations may block execution',
      missingPagination: 'Missing pagination on potentially large datasets',
      missingIndexHints: 'Complex WHERE clauses without proper indexing',
      heavyComputations: 'Heavy computational operations in request handler',
      missingCaching: 'Database queries without caching mechanism',
      fileOperations: 'File system operations that may block execution',
      externalApiCalls: 'External API calls without proper error handling',
      largeDataSets: 'Queries that may return large datasets',
      inefficientJoins: 'Complex joins that may be inefficient',
      missingErrorHandling: 'Database operations without proper error handling',
      syncOperations: 'Synchronous operations that may block execution'
    };
    
    return descriptions[patternName] || 'Potential performance issue detected';
  }

  getPatternRecommendation(patternName) {
    const recommendations = {
      nPlusOneQuery: 'Use batch queries or eager loading to reduce database calls',
      syncDatabase: 'Use async/await pattern for all database operations',
      missingPagination: 'Implement pagination with LIMIT and OFFSET',
      missingIndexHints: 'Add database indexes for frequently queried columns',
      heavyComputations: 'Move heavy computations to background jobs',
      missingCaching: 'Implement caching for frequently accessed data',
      fileOperations: 'Use async file operations and consider caching',
      externalApiCalls: 'Add timeout, retry logic, and circuit breaker pattern',
      largeDataSets: 'Implement pagination and data filtering',
      inefficientJoins: 'Optimize joins and consider denormalization',
      missingErrorHandling: 'Add comprehensive error handling and logging',
      syncOperations: 'Convert to async operations where possible'
    };
    
    return recommendations[patternName] || 'Review and optimize this pattern';
  }

  generateRecommendations() {
    console.log('\n💡 Generating recommendations...');
    
    const recommendations = [];
    
    // Group bottlenecks by type
    const bottlenecksByType = this.results.bottlenecks.reduce((acc, bottleneck) => {
      if (!acc[bottleneck.type]) acc[bottleneck.type] = [];
      acc[bottleneck.type].push(bottleneck);
      return acc;
    }, {});
    
    // High-priority recommendations
    const highPriorityTypes = ['nPlusOneQuery', 'missingPagination', 'largeDataSets', 'inefficientJoins'];
    const highPriorityBottlenecks = Object.entries(bottlenecksByType)
      .filter(([type]) => highPriorityTypes.includes(type))
      .flat();
    
    if (highPriorityBottlenecks.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'Critical Performance Issues',
        description: 'Address high-impact performance bottlenecks immediately',
        actions: [
          'Optimize N+1 query patterns with batch operations',
          'Implement pagination for large datasets',
          'Add database indexes for frequently queried columns',
          'Review and optimize complex database joins'
        ],
        affectedRoutes: [...new Set(highPriorityBottlenecks.map(b => b.route))]
      });
    }
    
    // Database optimization recommendations
    const dbBottlenecks = ['missingTransactions', 'multipleConnections', 'selectAll'];
    const dbIssues = Object.entries(bottlenecksByType)
      .filter(([type]) => dbBottlenecks.includes(type))
      .flat();
    
    if (dbIssues.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'Database Optimization',
        description: 'Optimize database operations for better performance',
        actions: [
          'Implement database transactions for related operations',
          'Use connection pooling to reduce connection overhead',
          'Select only required columns instead of SELECT *',
          'Add proper error handling for database operations'
        ],
        affectedRoutes: [...new Set(dbIssues.map(b => b.route))]
      });
    }
    
    // Caching recommendations
    const cachingBottlenecks = ['missingCaching', 'heavyComputations'];
    const cachingIssues = Object.entries(bottlenecksByType)
      .filter(([type]) => cachingBottlenecks.includes(type))
      .flat();
    
    if (cachingIssues.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'Caching Strategy',
        description: 'Implement caching to reduce database load',
        actions: [
          'Add Redis caching for frequently accessed data',
          'Implement response caching for read-heavy endpoints',
          'Cache expensive computation results',
          'Use browser caching headers appropriately'
        ],
        affectedRoutes: [...new Set(cachingIssues.map(b => b.route))]
      });
    }
    
    // Error handling recommendations
    const errorHandlingIssues = bottlenecksByType['missingErrorHandling'] || [];
    if (errorHandlingIssues.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'Error Handling',
        description: 'Improve error handling for better reliability',
        actions: [
          'Add comprehensive try-catch blocks',
          'Implement proper error logging',
          'Add request timeout handling',
          'Implement circuit breaker pattern for external calls'
        ],
        affectedRoutes: [...new Set(errorHandlingIssues.map(b => b.route))]
      });
    }
    
    this.results.recommendations = recommendations;
  }

  async generateReport() {
    console.log('\n📄 Generating detailed report...');
    
    const reportPath = path.join(process.cwd(), CONFIG.reportFile);
    await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
    
    console.log(`Report saved to: ${reportPath}`);
    
    this.displaySummary();
  }

  displaySummary() {
    console.log('\n📊 API BOTTLENECK ANALYSIS SUMMARY');
    console.log('===================================');
    
    console.log(`Total routes analyzed: ${this.results.summary.routesAnalyzed}`);
    console.log(`Total bottlenecks found: ${this.results.bottlenecks.length}`);
    console.log(`High severity issues: ${this.results.summary.highSeverityIssues}`);
    console.log(`Recommendations generated: ${this.results.recommendations.length}`);
    
    // Show most problematic routes
    const routesByIssueCount = Object.entries(this.results.routes)
      .map(([path, analysis]) => ({ path, issueCount: analysis.issues.length, severity: analysis.severity }))
      .sort((a, b) => b.issueCount - a.issueCount)
      .slice(0, 5);
    
    if (routesByIssueCount.length > 0) {
      console.log('\n🚨 MOST PROBLEMATIC ROUTES:');
      routesByIssueCount.forEach((route, index) => {
        console.log(`${index + 1}. ${route.path}: ${route.issueCount} issues (${route.severity} severity)`);
      });
    }
    
    // Show most common bottlenecks
    const bottlenecksByType = this.results.bottlenecks.reduce((acc, bottleneck) => {
      acc[bottleneck.type] = (acc[bottleneck.type] || 0) + 1;
      return acc;
    }, {});
    
    const commonBottlenecks = Object.entries(bottlenecksByType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    
    if (commonBottlenecks.length > 0) {
      console.log('\n🔍 MOST COMMON BOTTLENECKS:');
      commonBottlenecks.forEach(([type, count], index) => {
        console.log(`${index + 1}. ${type}: ${count} occurrences`);
      });
    }
    
    // Show top recommendations
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 TOP RECOMMENDATIONS:');
      this.results.recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(`${index + 1}. ${rec.category}: ${rec.description}`);
        console.log(`   Priority: ${rec.priority.toUpperCase()}`);
        console.log(`   Affected routes: ${rec.affectedRoutes.length}`);
      });
    }
  }

  async run() {
    console.log('🚀 Starting API Bottleneck Analysis...');
    
    try {
      const routeFiles = await this.findAPIRoutes();
      
      for (const routeFile of routeFiles) {
        await this.analyzeRouteFile(routeFile);
      }
      
      this.generateRecommendations();
      await this.generateReport();
      
      console.log('\n✅ Analysis completed successfully!');
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the analysis
if (require.main === module) {
  const analyzer = new APIBottleneckAnalyzer();
  analyzer.run().catch(console.error);
}

module.exports = APIBottleneckAnalyzer;