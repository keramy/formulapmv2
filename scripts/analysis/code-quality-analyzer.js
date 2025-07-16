const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Code Quality and Maintainability Assessment
 * Analyzes code complexity, test coverage, and technical debt
 */
class CodeQualityAnalyzer {
  constructor() {
    this.projectRoot = process.cwd();
    this.srcDir = path.join(this.projectRoot, 'src');
    this.testDir = path.join(this.srcDir, '__tests__');
  }

  async analyze() {
    console.log('📊 Analyzing code quality and maintainability...');
    
    const results = {
      timestamp: new Date().toISOString(),
      issues: [],
      summary: {
        totalFiles: 0,
        complexFiles: 0,
        testCoverage: 0,
        duplicatedCode: 0,
        technicalDebtHours: 0,
        codeSmells: 0,
        maintainabilityIndex: 0
      },
      recommendations: []
    };

    try {
      // Analyze code complexity
      const complexityIssues = await this.analyzeComplexity();
      results.issues.push(...complexityIssues);
      
      // Analyze test coverage
      const coverageIssues = await this.analyzeTestCoverage();
      results.issues.push(...coverageIssues);
      
      // Check for code duplication
      const duplicationIssues = await this.analyzeDuplication();
      results.issues.push(...duplicationIssues);
      
      // Analyze code smells
      const codeSmellIssues = await this.analyzeCodeSmells();
      results.issues.push(...codeSmellIssues);
      
      // Check documentation quality
      const documentationIssues = await this.analyzeDocumentation();
      results.issues.push(...documentationIssues);
      
      // Analyze dependency health
      const dependencyIssues = await this.analyzeDependencies();
      results.issues.push(...dependencyIssues);
      
      // Update summary
      this.updateSummary(results);
      
      // Generate recommendations
      results.recommendations = this.generateRecommendations(results.issues);
      
    } catch (error) {
      results.issues.push({
        id: 'code-quality-analyzer-error',
        category: 'quality',
        severity: 'medium',
        title: 'Code Quality Analysis Error',
        description: `Failed to analyze code quality: ${error.message}`,
        location: { file: 'code-quality-analyzer.js', line: 0 },
        recommendation: 'Manually review code quality metrics',
        estimatedEffort: 2,
        isProductionBlocker: false
      });
    }

    return results;
  }

  async analyzeComplexity() {
    const issues = [];
    
    try {
      const sourceFiles = this.getFilesRecursively(this.srcDir, ['.ts', '.tsx']);
      
      for (const file of sourceFiles) {
        // Skip test files and type definition files
        if (file.includes('__tests__') || file.includes('.test.') || file.endsWith('.d.ts')) {
          continue;
        }
        
        const content = fs.readFileSync(file, 'utf8');
        const relativePath = path.relative(this.projectRoot, file);
        
        const fileIssues = this.analyzeFileComplexity(relativePath, content);
        issues.push(...fileIssues);
      }
      
    } catch (error) {
      issues.push({
        id: 'complexity-analysis-error',
        category: 'quality',
        severity: 'low',
        title: 'Complexity Analysis Error',
        description: `Failed to analyze code complexity: ${error.message}`,
        location: { file: 'src/', line: 0 },
        recommendation: 'Manually review code complexity',
        estimatedEffort: 1,
        isProductionBlocker: false
      });
    }
    
    return issues;
  }

  analyzeFileComplexity(filePath, content) {
    const issues = [];
    
    // Calculate cyclomatic complexity (simplified)
    const complexity = this.calculateCyclomaticComplexity(content);
    
    if (complexity > 20) {
      issues.push({
        id: `high-complexity-${filePath}`,
        category: 'quality',
        severity: complexity > 30 ? 'high' : 'medium',
        title: `High Cyclomatic Complexity in ${filePath}`,
        description: `File has cyclomatic complexity of ${complexity}, which may be difficult to maintain`,
        location: { file: filePath, line: 0 },
        recommendation: 'Consider breaking down complex functions into smaller, more manageable pieces',
        estimatedEffort: Math.ceil(complexity / 10),
        isProductionBlocker: false,
        metadata: {
          complexity: complexity
        }
      });
    }
    
    // Check for long functions
    const functions = this.extractFunctions(content);
    functions.forEach(func => {
      if (func.lineCount > 50) {
        issues.push({
          id: `long-function-${filePath}-${func.name}`,
          category: 'quality',
          severity: func.lineCount > 100 ? 'medium' : 'low',
          title: `Long Function: ${func.name} in ${filePath}`,
          description: `Function ${func.name} has ${func.lineCount} lines, which may be too long`,
          location: { file: filePath, line: func.startLine },
          recommendation: 'Consider breaking down long functions into smaller, focused functions',
          estimatedEffort: 2,
          isProductionBlocker: false,
          metadata: {
            functionName: func.name,
            lineCount: func.lineCount
          }
        });
      }
    });
    
    // Check for deeply nested code
    const maxNesting = this.calculateMaxNesting(content);
    if (maxNesting > 4) {
      issues.push({
        id: `deep-nesting-${filePath}`,
        category: 'quality',
        severity: maxNesting > 6 ? 'medium' : 'low',
        title: `Deep Nesting in ${filePath}`,
        description: `Maximum nesting level is ${maxNesting}, which may reduce readability`,
        location: { file: filePath, line: 0 },
        recommendation: 'Consider using early returns or extracting nested logic into separate functions',
        estimatedEffort: 2,
        isProductionBlocker: false,
        metadata: {
          maxNesting: maxNesting
        }
      });
    }
    
    // Check for large files
    const lineCount = content.split('\n').length;
    if (lineCount > 300) {
      issues.push({
        id: `large-file-${filePath}`,
        category: 'quality',
        severity: lineCount > 500 ? 'medium' : 'low',
        title: `Large File: ${filePath}`,
        description: `File has ${lineCount} lines, which may be too large`,
        location: { file: filePath, line: 0 },
        recommendation: 'Consider splitting large files into smaller, more focused modules',
        estimatedEffort: 4,
        isProductionBlocker: false,
        metadata: {
          lineCount: lineCount
        }
      });
    }
    
    return issues;
  }

  calculateCyclomaticComplexity(content) {
    // Simplified cyclomatic complexity calculation
    const complexityKeywords = [
      'if', 'else if', 'while', 'for', 'switch', 'case', 
      'catch', '&&', '||', '?', 'forEach', 'map', 'filter'
    ];
    
    let complexity = 1; // Base complexity
    
    complexityKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = content.match(regex) || [];
      complexity += matches.length;
    });
    
    return complexity;
  }

  extractFunctions(content) {
    const functions = [];
    const lines = content.split('\n');
    
    // Simple function extraction (can be improved with AST parsing)
    const functionPatterns = [
      /function\s+(\w+)/g,
      /const\s+(\w+)\s*=\s*\(/g,
      /(\w+)\s*:\s*\(/g, // Object method
      /(\w+)\s*=\s*\([^)]*\)\s*=>/g // Arrow function
    ];
    
    functionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const functionName = match[1];
        const startLine = this.getLineNumber(content, match.index);
        
        // Estimate function length (simplified)
        let lineCount = 1;
        let braceCount = 0;
        let started = false;
        
        for (let i = startLine; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes('{')) {
            braceCount += (line.match(/\{/g) || []).length;
            started = true;
          }
          if (line.includes('}')) {
            braceCount -= (line.match(/\}/g) || []).length;
          }
          
          if (started) {
            lineCount++;
            if (braceCount === 0) break;
          }
        }
        
        functions.push({
          name: functionName,
          startLine: startLine,
          lineCount: lineCount
        });
      }
    });
    
    return functions;
  }

  calculateMaxNesting(content) {
    let maxNesting = 0;
    let currentNesting = 0;
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      if (char === '{') {
        currentNesting++;
        maxNesting = Math.max(maxNesting, currentNesting);
      } else if (char === '}') {
        currentNesting--;
      }
    }
    
    return maxNesting;
  }

  async analyzeTestCoverage() {
    const issues = [];
    
    try {
      // Run Jest coverage analysis
      const coverageResult = execSync('npm run test:coverage -- --passWithNoTests --silent', {
        cwd: this.projectRoot,
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      // Parse coverage results (simplified)
      const coverageData = this.parseCoverageOutput(coverageResult);
      
      if (coverageData.overall < 70) {
        issues.push({
          id: 'low-test-coverage',
          category: 'quality',
          severity: coverageData.overall < 50 ? 'high' : 'medium',
          title: 'Low Test Coverage',
          description: `Overall test coverage is ${coverageData.overall}%, below the recommended 70%`,
          location: { file: 'test coverage', line: 0 },
          recommendation: 'Increase test coverage by adding unit tests for uncovered code',
          estimatedEffort: Math.ceil((70 - coverageData.overall) / 10),
          isProductionBlocker: false,
          metadata: {
            coverage: coverageData.overall,
            threshold: 70
          }
        });
      }
      
      // Check for files with very low coverage
      if (coverageData.files) {
        coverageData.files.forEach(file => {
          if (file.coverage < 50) {
            issues.push({
              id: `low-file-coverage-${file.name}`,
              category: 'quality',
              severity: 'medium',
              title: `Low Test Coverage: ${file.name}`,
              description: `File has ${file.coverage}% test coverage`,
              location: { file: file.name, line: 0 },
              recommendation: 'Add unit tests to improve coverage for this file',
              estimatedEffort: 2,
              isProductionBlocker: false,
              metadata: {
                coverage: file.coverage
              }
            });
          }
        });
      }
      
    } catch (error) {
      // Coverage analysis failed, check if tests exist
      if (!fs.existsSync(this.testDir)) {
        issues.push({
          id: 'missing-tests',
          category: 'quality',
          severity: 'high',
          title: 'Missing Test Directory',
          description: 'No test directory found',
          location: { file: 'src/__tests__', line: 0 },
          recommendation: 'Create test directory and add unit tests',
          estimatedEffort: 8,
          isProductionBlocker: false
        });
      } else {
        issues.push({
          id: 'test-coverage-error',
          category: 'quality',
          severity: 'low',
          title: 'Test Coverage Analysis Failed',
          description: `Could not analyze test coverage: ${error.message}`,
          location: { file: 'test coverage', line: 0 },
          recommendation: 'Check test configuration and run coverage analysis manually',
          estimatedEffort: 1,
          isProductionBlocker: false
        });
      }
    }
    
    return issues;
  }

  parseCoverageOutput(output) {
    // Simplified coverage parsing
    const coverageData = {
      overall: 0,
      files: []
    };
    
    // Look for coverage percentage in output
    const overallMatch = output.match(/All files[^|]*\|\s*(\d+(?:\.\d+)?)/);
    if (overallMatch) {
      coverageData.overall = parseFloat(overallMatch[1]);
    }
    
    return coverageData;
  }

  async analyzeDuplication() {
    const issues = [];
    
    try {
      // Simple duplication detection
      const sourceFiles = this.getFilesRecursively(this.srcDir, ['.ts', '.tsx']);
      const codeBlocks = new Map();
      
      for (const file of sourceFiles) {
        if (file.includes('__tests__') || file.endsWith('.d.ts')) continue;
        
        const content = fs.readFileSync(file, 'utf8');
        const blocks = this.extractCodeBlocks(content);
        
        blocks.forEach(block => {
          if (block.length > 50) { // Only check blocks longer than 50 characters
            const hash = this.hashCode(block);
            if (codeBlocks.has(hash)) {
              const existing = codeBlocks.get(hash);
              issues.push({
                id: `code-duplication-${existing.file}-${file}`,
                category: 'quality',
                severity: 'low',
                title: `Code Duplication Detected`,
                description: `Similar code blocks found in ${existing.file} and ${path.relative(this.projectRoot, file)}`,
                location: { file: path.relative(this.projectRoot, file), line: 0 },
                recommendation: 'Extract common code into shared functions or utilities',
                estimatedEffort: 2,
                isProductionBlocker: false,
                metadata: {
                  duplicateFiles: [existing.file, path.relative(this.projectRoot, file)]
                }
              });
            } else {
              codeBlocks.set(hash, {
                file: path.relative(this.projectRoot, file),
                block: block
              });
            }
          }
        });
      }
      
    } catch (error) {
      console.warn('Warning: Could not analyze code duplication:', error.message);
    }
    
    return issues;
  }

  extractCodeBlocks(content) {
    // Extract meaningful code blocks (functions, classes, etc.)
    const blocks = [];
    const lines = content.split('\n');
    
    let currentBlock = '';
    let inBlock = false;
    let braceCount = 0;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip comments and empty lines
      if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine === '') {
        continue;
      }
      
      if (trimmedLine.includes('{')) {
        inBlock = true;
        braceCount += (trimmedLine.match(/\{/g) || []).length;
      }
      
      if (inBlock) {
        currentBlock += trimmedLine + '\n';
      }
      
      if (trimmedLine.includes('}')) {
        braceCount -= (trimmedLine.match(/\}/g) || []).length;
        if (braceCount === 0 && inBlock) {
          blocks.push(currentBlock.trim());
          currentBlock = '';
          inBlock = false;
        }
      }
    }
    
    return blocks;
  }

  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  async analyzeCodeSmells() {
    const issues = [];
    
    try {
      const sourceFiles = this.getFilesRecursively(this.srcDir, ['.ts', '.tsx']);
      
      for (const file of sourceFiles) {
        if (file.includes('__tests__') || file.endsWith('.d.ts')) continue;
        
        const content = fs.readFileSync(file, 'utf8');
        const relativePath = path.relative(this.projectRoot, file);
        
        const smells = this.detectCodeSmells(relativePath, content);
        issues.push(...smells);
      }
      
    } catch (error) {
      console.warn('Warning: Could not analyze code smells:', error.message);
    }
    
    return issues;
  }

  detectCodeSmells(filePath, content) {
    const issues = [];
    
    // Long parameter lists
    const longParameterPattern = /\([^)]{100,}\)/g;
    const longParamMatches = content.match(longParameterPattern) || [];
    if (longParamMatches.length > 0) {
      issues.push({
        id: `long-parameter-list-${filePath}`,
        category: 'quality',
        severity: 'low',
        title: `Long Parameter List in ${filePath}`,
        description: `Found ${longParamMatches.length} functions with long parameter lists`,
        location: { file: filePath, line: 0 },
        recommendation: 'Consider using object parameters or breaking down functions',
        estimatedEffort: 1,
        isProductionBlocker: false
      });
    }
    
    // Magic numbers
    const magicNumberPattern = /(?<![a-zA-Z_])\d{2,}(?![a-zA-Z_])/g;
    const magicNumbers = content.match(magicNumberPattern) || [];
    const uniqueMagicNumbers = [...new Set(magicNumbers)].filter(num => 
      !['100', '200', '404', '500'].includes(num) // Exclude common HTTP codes
    );
    
    if (uniqueMagicNumbers.length > 5) {
      issues.push({
        id: `magic-numbers-${filePath}`,
        category: 'quality',
        severity: 'low',
        title: `Magic Numbers in ${filePath}`,
        description: `Found ${uniqueMagicNumbers.length} magic numbers that should be constants`,
        location: { file: filePath, line: 0 },
        recommendation: 'Replace magic numbers with named constants',
        estimatedEffort: 1,
        isProductionBlocker: false,
        metadata: {
          magicNumbers: uniqueMagicNumbers.slice(0, 5) // Show first 5
        }
      });
    }
    
    // TODO comments
    const todoPattern = /\/\/\s*TODO|\/\*\s*TODO/gi;
    const todoMatches = content.match(todoPattern) || [];
    if (todoMatches.length > 3) {
      issues.push({
        id: `excessive-todos-${filePath}`,
        category: 'quality',
        severity: 'low',
        title: `Excessive TODO Comments in ${filePath}`,
        description: `Found ${todoMatches.length} TODO comments`,
        location: { file: filePath, line: 0 },
        recommendation: 'Address TODO comments or convert them to proper issues',
        estimatedEffort: 2,
        isProductionBlocker: false,
        metadata: {
          todoCount: todoMatches.length
        }
      });
    }
    
    // Commented out code
    const commentedCodePattern = /\/\/\s*[a-zA-Z_][a-zA-Z0-9_]*\s*[=\(]/g;
    const commentedCodeMatches = content.match(commentedCodePattern) || [];
    if (commentedCodeMatches.length > 2) {
      issues.push({
        id: `commented-code-${filePath}`,
        category: 'quality',
        severity: 'low',
        title: `Commented Out Code in ${filePath}`,
        description: `Found ${commentedCodeMatches.length} instances of commented out code`,
        location: { file: filePath, line: 0 },
        recommendation: 'Remove commented out code or convert to proper documentation',
        estimatedEffort: 1,
        isProductionBlocker: false
      });
    }
    
    return issues;
  }

  async analyzeDocumentation() {
    const issues = [];
    
    try {
      // Check for README files
      const readmeFiles = ['README.md', 'readme.md', 'README.txt'];
      const hasReadme = readmeFiles.some(file => 
        fs.existsSync(path.join(this.projectRoot, file))
      );
      
      if (!hasReadme) {
        issues.push({
          id: 'missing-readme',
          category: 'quality',
          severity: 'medium',
          title: 'Missing README File',
          description: 'No README file found in project root',
          location: { file: 'README.md', line: 0 },
          recommendation: 'Create a comprehensive README file with project documentation',
          estimatedEffort: 2,
          isProductionBlocker: false
        });
      }
      
      // Check for API documentation
      const apiFiles = this.getFilesRecursively(
        path.join(this.srcDir, 'app', 'api'), 
        ['.ts']
      );
      
      let undocumentedApis = 0;
      for (const file of apiFiles) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for JSDoc comments
        const hasDocumentation = content.includes('/**') || content.includes('* @');
        if (!hasDocumentation) {
          undocumentedApis++;
        }
      }
      
      if (undocumentedApis > apiFiles.length * 0.5) {
        issues.push({
          id: 'undocumented-apis',
          category: 'quality',
          severity: 'medium',
          title: 'Undocumented API Endpoints',
          description: `${undocumentedApis} out of ${apiFiles.length} API endpoints lack documentation`,
          location: { file: 'src/app/api', line: 0 },
          recommendation: 'Add JSDoc comments to API endpoints describing parameters and responses',
          estimatedEffort: Math.ceil(undocumentedApis / 5),
          isProductionBlocker: false,
          metadata: {
            undocumentedCount: undocumentedApis,
            totalCount: apiFiles.length
          }
        });
      }
      
    } catch (error) {
      console.warn('Warning: Could not analyze documentation:', error.message);
    }
    
    return issues;
  }

  async analyzeDependencies() {
    const issues = [];
    
    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        return issues;
      }
      
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      // Check for outdated dependencies (simplified check)
      const potentiallyOutdated = [];
      Object.entries(dependencies).forEach(([name, version]) => {
        // Check for very old version patterns
        if (version.includes('^0.') || version.includes('~0.')) {
          potentiallyOutdated.push(name);
        }
      });
      
      if (potentiallyOutdated.length > 0) {
        issues.push({
          id: 'potentially-outdated-deps',
          category: 'quality',
          severity: 'low',
          title: 'Potentially Outdated Dependencies',
          description: `Found ${potentiallyOutdated.length} dependencies that may be outdated`,
          location: { file: 'package.json', line: 0 },
          recommendation: 'Review and update dependencies to latest stable versions',
          estimatedEffort: 2,
          isProductionBlocker: false,
          metadata: {
            outdatedDependencies: potentiallyOutdated.slice(0, 5)
          }
        });
      }
      
      // Check for excessive dependencies
      const totalDeps = Object.keys(dependencies).length;
      if (totalDeps > 100) {
        issues.push({
          id: 'excessive-dependencies',
          category: 'quality',
          severity: 'medium',
          title: 'Excessive Dependencies',
          description: `Project has ${totalDeps} dependencies, which may impact build time and security`,
          location: { file: 'package.json', line: 0 },
          recommendation: 'Review dependencies and remove unused packages',
          estimatedEffort: 4,
          isProductionBlocker: false,
          metadata: {
            dependencyCount: totalDeps
          }
        });
      }
      
    } catch (error) {
      console.warn('Warning: Could not analyze dependencies:', error.message);
    }
    
    return issues;
  }

  getFilesRecursively(dir, extensions) {
    const files = [];
    
    if (!fs.existsSync(dir)) return files;
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...this.getFilesRecursively(fullPath, extensions));
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  getLineNumber(content, index) {
    const lines = content.substring(0, index).split('\n');
    return lines.length;
  }

  updateSummary(results) {
    const issues = results.issues;
    
    results.summary.totalFiles = this.getFilesRecursively(this.srcDir, ['.ts', '.tsx']).length;
    results.summary.complexFiles = issues.filter(i => i.id.includes('complexity')).length;
    results.summary.duplicatedCode = issues.filter(i => i.id.includes('duplication')).length;
    results.summary.codeSmells = issues.filter(i => i.id.includes('smell') || i.id.includes('magic') || i.id.includes('todo')).length;
    
    // Calculate technical debt in hours
    results.summary.technicalDebtHours = issues.reduce((total, issue) => 
      total + (issue.estimatedEffort || 0), 0
    );
    
    // Simple maintainability index (0-100, higher is better)
    const complexityPenalty = results.summary.complexFiles * 5;
    const smellPenalty = results.summary.codeSmells * 2;
    const duplicationPenalty = results.summary.duplicatedCode * 3;
    
    results.summary.maintainabilityIndex = Math.max(0, 
      100 - complexityPenalty - smellPenalty - duplicationPenalty
    );
    
    // Extract test coverage from issues
    const coverageIssue = issues.find(i => i.id === 'low-test-coverage');
    if (coverageIssue) {
      results.summary.testCoverage = coverageIssue.metadata?.coverage || 0;
    } else {
      results.summary.testCoverage = 70; // Assume good coverage if no issues
    }
  }

  generateRecommendations(issues) {
    const recommendations = [];
    
    const complexityIssues = issues.filter(i => i.id.includes('complexity'));
    if (complexityIssues.length > 0) {
      recommendations.push({
        priority: 'medium',
        title: 'Reduce Code Complexity',
        description: `Found ${complexityIssues.length} files with high complexity`,
        action: 'Refactor complex functions and reduce cyclomatic complexity'
      });
    }
    
    const coverageIssues = issues.filter(i => i.id.includes('coverage'));
    if (coverageIssues.length > 0) {
      recommendations.push({
        priority: 'high',
        title: 'Improve Test Coverage',
        description: `Test coverage is below recommended thresholds`,
        action: 'Add unit tests to increase code coverage above 70%'
      });
    }
    
    const documentationIssues = issues.filter(i => i.id.includes('documentation') || i.id.includes('readme'));
    if (documentationIssues.length > 0) {
      recommendations.push({
        priority: 'medium',
        title: 'Improve Documentation',
        description: `Found ${documentationIssues.length} documentation issues`,
        action: 'Add comprehensive documentation for APIs and project setup'
      });
    }
    
    const technicalDebtHours = issues.reduce((total, issue) => total + (issue.estimatedEffort || 0), 0);
    if (technicalDebtHours > 20) {
      recommendations.push({
        priority: 'medium',
        title: 'Address Technical Debt',
        description: `Estimated ${technicalDebtHours} hours of technical debt`,
        action: 'Prioritize and systematically address technical debt items'
      });
    }
    
    return recommendations;
  }
}

module.exports = CodeQualityAnalyzer;