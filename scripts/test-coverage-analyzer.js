#!/usr/bin/env node

/**
 * Test Coverage Analyzer
 * Analyzes test coverage and quality in the codebase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TestCoverageAnalyzer {
  constructor() {
    this.results = {
      coverageSummary: null,
      apiRouteCoverage: [],
      componentCoverage: [],
      workflowCoverage: [],
      missingTests: [],
      filesAnalyzed: 0
    };

    // File extensions to analyze
    this.fileExtensions = ['.ts', '.tsx', '.js', '.jsx'];

    // Directories to exclude
    this.excludeDirs = ['node_modules', '.git', '.next', 'dist', 'build', 'coverage'];
    
    // Critical paths that should have tests
    this.criticalPaths = [
      'src/app/api',
      'src/components',
      'src/lib',
      'src/hooks'
    ];
  }

  /**
   * Main execution method
   */
  async execute() {
    console.log('🔍 ANALYZING TEST COVERAGE');
    console.log('========================');
    console.log('Generating test coverage report...');

    try {
      // Run Jest with coverage
      this.runJestCoverage();
      
      // Parse coverage report
      this.parseCoverageReport();
      
      // Analyze API route testing
      console.log('\nAnalyzing API route testing...');
      this.analyzeApiRouteTesting();
      
      // Analyze component testing
      console.log('Analyzing component testing...');
      this.analyzeComponentTesting();
      
      // Analyze workflow testing
      console.log('Analyzing workflow testing...');
      this.analyzeWorkflowTesting();
      
      // Find missing tests
      console.log('Finding missing tests...');
      this.findMissingTests();

      // Generate report
      this.generateReport();

      return this.results;
    } catch (error) {
      console.error('Error executing test coverage analysis:', error.message);
      
      // Generate a report even if Jest fails
      this.generateReport();
      
      return this.results;
    }
  }

  /**
   * Run Jest with coverage
   */
  runJestCoverage() {
    try {
      console.log('Skipping Jest coverage run due to JSX parsing issues...');
      console.log('Analyzing test files directly instead.');
      // We're not running Jest directly to avoid JSX parsing errors
      // execSync('npx jest --coverage', { stdio: 'inherit' });
    } catch (error) {
      console.error('Jest coverage command failed:', error.message);
      console.log('Continuing with analysis of existing coverage data if available...');
    }
  }

  /**
   * Parse coverage report
   */
  parseCoverageReport() {
    try {
      // Check if coverage report exists
      const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
      
      if (fs.existsSync(coveragePath)) {
        console.log('Parsing coverage report...');
        const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
        
        this.results.coverageSummary = coverageData.total;
        this.results.filesAnalyzed = Object.keys(coverageData).length - 1; // Subtract 'total'
        
        console.log(`Coverage report parsed. Found data for ${this.results.filesAnalyzed} files.`);
      } else {
        console.log('No coverage report found. Skipping coverage parsing.');
      }
    } catch (error) {
      console.error('Error parsing coverage report:', error.message);
    }
  }

  /**
   * Analyze API route testing
   */
  analyzeApiRouteTesting() {
    try {
      // Find all API route files
      const apiRouteFiles = this.findFilesInDirectory('src/app/api', ['.ts', '.js']);
      const apiTestFiles = this.findFilesInDirectory('src/__tests__/api', ['.ts', '.js']);
      
      // Map test files to route files
      const testedRoutes = new Set();
      
      for (const testFile of apiTestFiles) {
        const testContent = fs.readFileSync(testFile, 'utf8');
        
        for (const routeFile of apiRouteFiles) {
          const routeName = path.basename(path.dirname(routeFile));
          
          if (testContent.includes(routeName)) {
            testedRoutes.add(routeFile);
            
            // Analyze test quality
            const testQuality = this.analyzeTestQuality(testFile);
            
            this.results.apiRouteCoverage.push({
              route: routeFile,
              testFile: testFile,
              hasMocks: testContent.includes('jest.mock') || testContent.includes('vi.mock'),
              hasErrorHandling: testContent.includes('catch') || testContent.includes('error'),
              testCount: (testContent.match(/it\(/g) || []).length,
              quality: testQuality
            });
          }
        }
      }
      
      // Find untested routes
      for (const routeFile of apiRouteFiles) {
        if (!testedRoutes.has(routeFile)) {
          this.results.apiRouteCoverage.push({
            route: routeFile,
            testFile: null,
            hasMocks: false,
            hasErrorHandling: false,
            testCount: 0,
            quality: 'Missing'
          });
        }
      }
    } catch (error) {
      console.error('Error analyzing API route testing:', error.message);
    }
  }

  /**
   * Analyze component testing
   */
  analyzeComponentTesting() {
    try {
      // Find all component files
      const componentFiles = this.findFilesInDirectory('src/components', ['.tsx', '.jsx']);
      const componentTestFiles = this.findFilesInDirectory('src/__tests__/components', ['.ts', '.tsx', '.js', '.jsx']);
      
      // Map test files to component files
      const testedComponents = new Set();
      
      for (const testFile of componentTestFiles) {
        const testContent = fs.readFileSync(testFile, 'utf8');
        
        for (const componentFile of componentFiles) {
          const componentName = path.basename(componentFile, path.extname(componentFile));
          
          if (testContent.includes(componentName)) {
            testedComponents.add(componentFile);
            
            // Analyze test quality
            const testQuality = this.analyzeTestQuality(testFile);
            
            this.results.componentCoverage.push({
              component: componentFile,
              testFile: testFile,
              hasRenders: testContent.includes('render(') || testContent.includes('mount('),
              hasInteractions: testContent.includes('fireEvent') || testContent.includes('userEvent'),
              testCount: (testContent.match(/it\(/g) || []).length,
              quality: testQuality
            });
          }
        }
      }
      
      // Find untested components
      for (const componentFile of componentFiles) {
        if (!testedComponents.has(componentFile)) {
          this.results.componentCoverage.push({
            component: componentFile,
            testFile: null,
            hasRenders: false,
            hasInteractions: false,
            testCount: 0,
            quality: 'Missing'
          });
        }
      }
    } catch (error) {
      console.error('Error analyzing component testing:', error.message);
    }
  }

  /**
   * Analyze workflow testing
   */
  analyzeWorkflowTesting() {
    try {
      // Find all workflow-related files (assuming they're in specific directories)
      const workflowFiles = [
        ...this.findFilesInDirectory('src/__tests__/integration', ['.ts', '.js']),
        ...this.findFilesInDirectory('src/__tests__/e2e', ['.ts', '.js'])
      ];
      
      // Analyze each workflow test file
      for (const testFile of workflowFiles) {
        const testContent = fs.readFileSync(testFile, 'utf8');
        const testName = path.basename(testFile, path.extname(testFile));
        
        // Determine workflow type
        let workflowType = 'Unknown';
        if (testFile.includes('auth')) workflowType = 'Authentication';
        else if (testFile.includes('project')) workflowType = 'Project Management';
        else if (testFile.includes('scope')) workflowType = 'Scope Management';
        else if (testFile.includes('material')) workflowType = 'Material Approval';
        else if (testFile.includes('purchase')) workflowType = 'Purchase Process';
        
        this.results.workflowCoverage.push({
          workflow: workflowType,
          testFile: testFile,
          testName: testName,
          testCount: (testContent.match(/it\(/g) || []).length,
          hasMultipleRoles: this.checkForMultipleRoles(testContent),
          quality: this.analyzeTestQuality(testFile)
        });
      }
    } catch (error) {
      console.error('Error analyzing workflow testing:', error.message);
    }
  }

  /**
   * Find missing tests
   */
  findMissingTests() {
    try {
      // Check critical paths for files without tests
      for (const criticalPath of this.criticalPaths) {
        const sourceFiles = this.findFilesInDirectory(criticalPath, this.fileExtensions);
        
        for (const sourceFile of sourceFiles) {
          // Skip route.ts files as they're covered by API route testing
          if (sourceFile.endsWith('route.ts') || sourceFile.endsWith('route.js')) {
            continue;
          }
          
          // Check if there's a corresponding test file
          const fileName = path.basename(sourceFile, path.extname(sourceFile));
          const testPattern = `${fileName}.test`;
          const testFiles = this.findFilesWithPattern('src/__tests__', testPattern);
          
          if (testFiles.length === 0) {
            // Check if the file is complex enough to warrant tests
            const content = fs.readFileSync(sourceFile, 'utf8');
            const isComplex = this.isFileComplex(content);
            
            if (isComplex) {
              this.results.missingTests.push({
                file: sourceFile,
                type: this.getFileType(sourceFile),
                complexity: this.getFileComplexity(content),
                recommendation: this.getTestRecommendation(sourceFile)
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error finding missing tests:', error.message);
    }
  }

  /**
   * Find files in directory
   */
  findFilesInDirectory(dir, extensions) {
    let results = [];
    
    try {
      if (!fs.existsSync(dir)) {
        return results;
      }
      
      const list = fs.readdirSync(dir);
      
      for (const file of list) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          if (!this.excludeDirs.includes(file)) {
            results = results.concat(this.findFilesInDirectory(filePath, extensions));
          }
        } else {
          const ext = path.extname(file);
          if (extensions.includes(ext)) {
            results.push(filePath);
          }
        }
      }
    } catch (error) {
      console.error(`Error finding files in ${dir}:`, error.message);
    }
    
    return results;
  }

  /**
   * Find files with pattern
   */
  findFilesWithPattern(dir, pattern) {
    let results = [];
    
    try {
      if (!fs.existsSync(dir)) {
        return results;
      }
      
      const list = fs.readdirSync(dir);
      
      for (const file of list) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          if (!this.excludeDirs.includes(file)) {
            results = results.concat(this.findFilesWithPattern(filePath, pattern));
          }
        } else {
          if (file.includes(pattern)) {
            results.push(filePath);
          }
        }
      }
    } catch (error) {
      console.error(`Error finding files with pattern ${pattern} in ${dir}:`, error.message);
    }
    
    return results;
  }

  /**
   * Analyze test quality
   */
  analyzeTestQuality(testFile) {
    try {
      const content = fs.readFileSync(testFile, 'utf8');
      
      // Count test cases
      const testCount = (content.match(/it\(/g) || []).length;
      
      // Check for mocks
      const hasMocks = content.includes('jest.mock') || content.includes('vi.mock');
      
      // Check for assertions
      const assertionCount = (content.match(/expect\(/g) || []).length;
      
      // Check for setup/teardown
      const hasSetup = content.includes('beforeEach') || content.includes('beforeAll');
      const hasTeardown = content.includes('afterEach') || content.includes('afterAll');
      
      // Calculate quality score
      let score = 0;
      if (testCount > 5) score += 2;
      else if (testCount > 2) score += 1;
      
      if (assertionCount > testCount * 2) score += 2;
      else if (assertionCount >= testCount) score += 1;
      
      if (hasMocks) score += 1;
      if (hasSetup) score += 1;
      if (hasTeardown) score += 1;
      
      // Return quality rating
      if (score >= 6) return 'Excellent';
      if (score >= 4) return 'Good';
      if (score >= 2) return 'Fair';
      return 'Poor';
    } catch (error) {
      console.error(`Error analyzing test quality for ${testFile}:`, error.message);
      return 'Unknown';
    }
  }

  /**
   * Check for multiple roles in test
   */
  checkForMultipleRoles(content) {
    const rolePatterns = [
      'management',
      'technical_lead',
      'project_manager',
      'purchase_manager',
      'client',
      'admin'
    ];
    
    let roleCount = 0;
    for (const role of rolePatterns) {
      if (content.includes(role)) {
        roleCount++;
      }
    }
    
    return roleCount > 1;
  }

  /**
   * Check if file is complex enough to warrant tests
   */
  isFileComplex(content) {
    // Count functions
    const functionCount = (content.match(/function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|class\s+\w+/g) || []).length;
    
    // Count conditional statements
    const conditionalCount = (content.match(/if\s*\(|else\s*{|switch\s*\(|case\s+|for\s*\(|while\s*\(|try\s*{|catch\s*\(/g) || []).length;
    
    // Count exports
    const exportCount = (content.match(/export\s+/g) || []).length;
    
    // File is complex if it has multiple functions, conditionals, or exports
    return functionCount > 1 || conditionalCount > 3 || exportCount > 0;
  }

  /**
   * Get file complexity
   */
  getFileComplexity(content) {
    // Count functions
    const functionCount = (content.match(/function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|class\s+\w+/g) || []).length;
    
    // Count conditional statements
    const conditionalCount = (content.match(/if\s*\(|else\s*{|switch\s*\(|case\s+|for\s*\(|while\s*\(|try\s*{|catch\s*\(/g) || []).length;
    
    // Calculate complexity score
    const complexityScore = functionCount + conditionalCount;
    
    if (complexityScore > 20) return 'Very High';
    if (complexityScore > 10) return 'High';
    if (complexityScore > 5) return 'Medium';
    return 'Low';
  }

  /**
   * Get file type
   */
  getFileType(filePath) {
    if (filePath.includes('/api/')) return 'API Route';
    if (filePath.includes('/components/')) return 'Component';
    if (filePath.includes('/hooks/')) return 'Hook';
    if (filePath.includes('/lib/')) return 'Utility';
    if (filePath.includes('/types/')) return 'Type Definition';
    return 'Other';
  }

  /**
   * Get test recommendation
   */
  getTestRecommendation(filePath) {
    const fileType = this.getFileType(filePath);
    
    switch (fileType) {
      case 'API Route':
        return 'Create API route test with mocks and error handling';
      case 'Component':
        return 'Create component test with rendering and user interactions';
      case 'Hook':
        return 'Create hook test with renderHook and state assertions';
      case 'Utility':
        return 'Create unit tests for each exported function';
      default:
        return 'Create appropriate tests based on file functionality';
    }
  }

  /**
   * Generate report
   */
  generateReport() {
    console.log('\n📊 TEST COVERAGE ANALYSIS REPORT');
    console.log('============================');
    
    // Count test files
    const apiTestFiles = this.findFilesInDirectory('src/__tests__/api', ['.ts', '.js']);
    const componentTestFiles = this.findFilesInDirectory('src/__tests__/components', ['.ts', '.tsx', '.js', '.jsx']);
    const hookTestFiles = this.findFilesInDirectory('src/__tests__/hooks', ['.ts', '.js']);
    const integrationTestFiles = this.findFilesInDirectory('src/__tests__/integration', ['.ts', '.js']);
    const unitTestFiles = this.findFilesInDirectory('src/__tests__/unit', ['.ts', '.js']);
    
    const totalTestFiles = apiTestFiles.length + componentTestFiles.length + 
                          hookTestFiles.length + integrationTestFiles.length + 
                          unitTestFiles.length;
    
    console.log('\n📈 TEST FILES SUMMARY');
    console.log('==================');
    console.log(`Total test files: ${totalTestFiles}`);
    console.log(`API test files: ${apiTestFiles.length}`);
    console.log(`Component test files: ${componentTestFiles.length}`);
    console.log(`Hook test files: ${hookTestFiles.length}`);
    console.log(`Integration test files: ${integrationTestFiles.length}`);
    console.log(`Unit test files: ${unitTestFiles.length}`);
    
    // Overall coverage
    if (this.results.coverageSummary) {
      console.log('\n📈 OVERALL COVERAGE');
      console.log('================');
      
      console.log(`Statement coverage: ${this.results.coverageSummary.statements.pct}%`);
      console.log(`Branch coverage: ${this.results.coverageSummary.branches.pct}%`);
      console.log(`Function coverage: ${this.results.coverageSummary.functions.pct}%`);
      console.log(`Line coverage: ${this.results.coverageSummary.lines.pct}%`);
    } else {
      console.log('\n⚠️ No Jest coverage data available. Analyzing test files directly instead.');
    }
    
    // API route coverage
    console.log('\n🔵 API ROUTE TESTING');
    console.log('=================');
    
    const testedRoutes = this.results.apiRouteCoverage.filter(item => item.testFile !== null);
    const untestedRoutes = this.results.apiRouteCoverage.filter(item => item.testFile === null);
    
    console.log(`API routes with tests: ${testedRoutes.length}`);
    console.log(`API routes without tests: ${untestedRoutes.length}`);
    
    if (untestedRoutes.length > 0) {
      console.log('\nTop untested API routes:');
      
      for (const route of untestedRoutes.slice(0, 5)) {
        console.log(`  - ${route.route}`);
      }
      
      if (untestedRoutes.length > 5) {
        console.log(`  ... and ${untestedRoutes.length - 5} more`);
      }
    }
    
    // Component coverage
    console.log('\n🟢 COMPONENT TESTING');
    console.log('=================');
    
    const testedComponents = this.results.componentCoverage.filter(item => item.testFile !== null);
    const untestedComponents = this.results.componentCoverage.filter(item => item.testFile === null);
    
    console.log(`Components with tests: ${testedComponents.length}`);
    console.log(`Components without tests: ${untestedComponents.length}`);
    
    if (untestedComponents.length > 0) {
      console.log('\nTop untested components:');
      
      for (const component of untestedComponents.slice(0, 5)) {
        console.log(`  - ${component.component}`);
      }
      
      if (untestedComponents.length > 5) {
        console.log(`  ... and ${untestedComponents.length - 5} more`);
      }
    }
    
    // Workflow coverage
    console.log('\n🟣 WORKFLOW TESTING');
    console.log('================');
    
    console.log(`Workflow tests found: ${this.results.workflowCoverage.length}`);
    
    // Group by workflow type
    const workflowTypes = {};
    for (const workflow of this.results.workflowCoverage) {
      if (!workflowTypes[workflow.workflow]) {
        workflowTypes[workflow.workflow] = [];
      }
      workflowTypes[workflow.workflow].push(workflow);
    }
    
    console.log('\nWorkflow coverage by type:');
    for (const [type, workflows] of Object.entries(workflowTypes)) {
      console.log(`  - ${type}: ${workflows.length} tests`);
    }
    
    // Missing tests
    console.log('\n🔴 MISSING TESTS');
    console.log('=============');
    
    console.log(`Files needing tests: ${this.results.missingTests.length}`);
    
    // Group by file type
    const fileTypes = {};
    for (const file of this.results.missingTests) {
      if (!fileTypes[file.type]) {
        fileTypes[file.type] = [];
      }
      fileTypes[file.type].push(file);
    }
    
    console.log('\nMissing tests by file type:');
    for (const [type, files] of Object.entries(fileTypes)) {
      console.log(`  - ${type}: ${files.length} files`);
    }
    
    if (this.results.missingTests.length > 0) {
      console.log('\nTop high-complexity files needing tests:');
      
      // Sort by complexity
      const sortedFiles = [...this.results.missingTests].sort((a, b) => {
        const complexityOrder = { 'Very High': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
        return complexityOrder[a.complexity] - complexityOrder[b.complexity];
      });
      
      for (const file of sortedFiles.slice(0, 10)) {
        console.log(`  - ${file.file} (${file.complexity} complexity)`);
        console.log(`    Recommendation: ${file.recommendation}`);
      }
      
      if (sortedFiles.length > 10) {
        console.log(`  ... and ${sortedFiles.length - 10} more files`);
      }
    }
    
    // Summary
    console.log('\n🎯 SUMMARY');
    console.log('=========');
    
    // Calculate overall test quality
    let overallQuality = 'Unknown';
    
    if (this.results.coverageSummary) {
      const avgCoverage = (
        this.results.coverageSummary.statements.pct +
        this.results.coverageSummary.branches.pct +
        this.results.coverageSummary.functions.pct +
        this.results.coverageSummary.lines.pct
      ) / 4;
      
      const apiCoveragePercent = testedRoutes.length / (testedRoutes.length + untestedRoutes.length) * 100 || 0;
      const componentCoveragePercent = testedComponents.length / (testedComponents.length + untestedComponents.length) * 100 || 0;
      
      const overallScore = (avgCoverage + apiCoveragePercent + componentCoveragePercent) / 3;
      
      if (overallScore >= 80) overallQuality = 'Excellent';
      else if (overallScore >= 60) overallQuality = 'Good';
      else if (overallScore >= 40) overallQuality = 'Fair';
      else overallQuality = 'Poor';
    }
    
    console.log(`Overall test quality: ${overallQuality}`);
    
    if (this.results.missingTests.length > 0) {
      console.log('\nRecommendations:');
      console.log('1. Add tests for high-complexity files without coverage');
      console.log('2. Improve API route test coverage, especially for critical endpoints');
      console.log('3. Add more component tests with user interaction testing');
      console.log('4. Enhance workflow tests to cover multiple user roles');
    } else {
      console.log('\nTest coverage is comprehensive. Focus on maintaining and improving existing tests.');
    }
    
    // Save detailed results to file
    this.saveResultsToFile('scripts/test-coverage-results.json');
  }

  /**
   * Save results to file
   */
  saveResultsToFile(filePath) {
    fs.writeFileSync(filePath, JSON.stringify(this.results, null, 2));
    console.log(`\nDetailed results saved to ${filePath}`);
  }
}

// Execute if run directly
if (require.main === module) {
  const analyzer = new TestCoverageAnalyzer();
  
  analyzer.execute()
    .then(results => {
      console.log('\n🏁 Analysis completed.');
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { TestCoverageAnalyzer };