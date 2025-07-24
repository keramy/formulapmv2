#!/usr/bin/env node

/**
 * Code Complexity Analyzer
 * Analyzes code complexity and identifies technical debt in the codebase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CodeComplexityAnalyzer {
  constructor() {
    this.results = {
      complexFunctions: [],
      largeFiles: [],
      dependencyIssues: [],
      filesAnalyzed: 0
    };

    // Complexity thresholds
    this.complexityThreshold = 10; // Functions with complexity > 10 are flagged
    this.fileSizeThreshold = 300; // Files with > 300 lines are flagged
    
    // File extensions to analyze
    this.fileExtensions = ['.ts', '.tsx', '.js', '.jsx'];

    // Directories to exclude
    this.excludeDirs = ['node_modules', '.git', '.next', 'dist', 'build', 'coverage'];
  }

  /**
   * Main execution method
   */
  async execute() {
    console.log('🔍 ANALYZING CODE COMPLEXITY');
    console.log('===========================');
    console.log('Scanning codebase for complex functions and technical debt...');

    // Get all source files
    const sourceFiles = this.getAllSourceFiles('.');
    this.results.filesAnalyzed = sourceFiles.length;

    console.log(`Found ${sourceFiles.length} source files to analyze.`);
    
    // Analyze file sizes
    console.log('\nAnalyzing file sizes...');
    for (const file of sourceFiles) {
      this.analyzeFileSize(file);
    }
    
    // Analyze function complexity
    console.log('\nAnalyzing function complexity...');
    for (const file of sourceFiles) {
      await this.analyzeFunctionComplexity(file);
    }
    
    // Analyze dependencies
    console.log('\nAnalyzing dependencies...');
    this.analyzeDependencies();

    // Generate report
    this.generateReport();

    return this.results;
  }

  /**
   * Get all source files in the project
   */
  getAllSourceFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);

    for (const file of list) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        if (!this.excludeDirs.includes(file)) {
          results = results.concat(this.getAllSourceFiles(filePath));
        }
      } else {
        const ext = path.extname(file);
        if (this.fileExtensions.includes(ext)) {
          results.push(filePath);
        }
      }
    }

    return results;
  }

  /**
   * Analyze file size
   */
  analyzeFileSize(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').length;
      
      if (lines > this.fileSizeThreshold) {
        this.results.largeFiles.push({
          file: filePath,
          lines: lines,
          recommendation: lines > 500 ? 'Split into multiple files' : 'Consider refactoring'
        });
      }
    } catch (error) {
      console.error(`Error analyzing file size for ${filePath}:`, error.message);
    }
  }

  /**
   * Analyze function complexity
   */
  async analyzeFunctionComplexity(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Simple heuristic for function complexity
      // Count conditional statements, loops, and catch blocks
      const functionMatches = content.match(/function\s+(\w+)\s*\([^)]*\)\s*{|const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*{|class\s+(\w+)/g);
      
      if (functionMatches) {
        for (const match of functionMatches) {
          const functionName = match.match(/function\s+(\w+)|const\s+(\w+)|class\s+(\w+)/)[1] || 
                              match.match(/function\s+(\w+)|const\s+(\w+)|class\s+(\w+)/)[2] || 
                              match.match(/function\s+(\w+)|const\s+(\w+)|class\s+(\w+)/)[3] || 
                              'anonymous';
          
          // Find function body
          const startIndex = content.indexOf(match);
          let braceCount = 0;
          let endIndex = startIndex;
          let foundOpeningBrace = false;
          
          for (let i = startIndex; i < content.length; i++) {
            if (content[i] === '{') {
              foundOpeningBrace = true;
              braceCount++;
            } else if (content[i] === '}') {
              braceCount--;
              if (foundOpeningBrace && braceCount === 0) {
                endIndex = i;
                break;
              }
            }
          }
          
          if (endIndex > startIndex) {
            const functionBody = content.substring(startIndex, endIndex + 1);
            
            // Calculate complexity
            const ifCount = (functionBody.match(/if\s*\(/g) || []).length;
            const elseCount = (functionBody.match(/else\s*{/g) || []).length;
            const forCount = (functionBody.match(/for\s*\(/g) || []).length;
            const whileCount = (functionBody.match(/while\s*\(/g) || []).length;
            const switchCount = (functionBody.match(/switch\s*\(/g) || []).length;
            const caseCount = (functionBody.match(/case\s+/g) || []).length;
            const catchCount = (functionBody.match(/catch\s*\(/g) || []).length;
            const ternaryCount = (functionBody.match(/\?/g) || []).length;
            const andOrCount = (functionBody.match(/&&|\|\|/g) || []).length;
            
            // Cyclomatic complexity = 1 + decision points
            const complexity = 1 + ifCount + elseCount + forCount + whileCount + 
                              switchCount + caseCount + catchCount + ternaryCount + 
                              Math.floor(andOrCount / 2); // Count every two &&/|| as one decision point
            
            if (complexity > this.complexityThreshold) {
              this.results.complexFunctions.push({
                file: filePath,
                function: functionName,
                complexity: complexity,
                recommendation: this.getComplexityRecommendation(complexity)
              });
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error analyzing function complexity for ${filePath}:`, error.message);
    }
  }

  /**
   * Get recommendation based on complexity
   */
  getComplexityRecommendation(complexity) {
    if (complexity > 25) {
      return 'Critical: Immediate refactoring needed, break into multiple functions';
    } else if (complexity > 15) {
      return 'High: Consider breaking into smaller functions';
    } else {
      return 'Medium: Review and simplify logic';
    }
  }

  /**
   * Analyze dependencies
   */
  analyzeDependencies() {
    try {
      // Check if package.json exists
      if (fs.existsSync('package.json')) {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        // Check for outdated dependencies
        try {
          console.log('Checking for outdated dependencies...');
          const outdatedOutput = execSync('npm outdated --json', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
          
          if (outdatedOutput && outdatedOutput.trim() !== '') {
            const outdated = JSON.parse(outdatedOutput);
            
            for (const [pkg, info] of Object.entries(outdated)) {
              this.results.dependencyIssues.push({
                package: pkg,
                currentVersion: info.current,
                latestVersion: info.latest,
                type: 'outdated',
                recommendation: 'Update to latest version'
              });
            }
          }
        } catch (error) {
          // npm outdated returns non-zero exit code when outdated packages are found
          if (error.stdout) {
            try {
              const outdated = JSON.parse(error.stdout);
              
              for (const [pkg, info] of Object.entries(outdated)) {
                this.results.dependencyIssues.push({
                  package: pkg,
                  currentVersion: info.current,
                  latestVersion: info.latest,
                  type: 'outdated',
                  recommendation: 'Update to latest version'
                });
              }
            } catch (parseError) {
              console.error('Error parsing npm outdated output:', parseError.message);
            }
          }
        }
        
        // Check for security vulnerabilities
        try {
          console.log('Checking for security vulnerabilities...');
          const auditOutput = execSync('npm audit --json', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
          
          if (auditOutput && auditOutput.trim() !== '') {
            const audit = JSON.parse(auditOutput);
            
            if (audit.vulnerabilities) {
              for (const [pkg, info] of Object.entries(audit.vulnerabilities)) {
                this.results.dependencyIssues.push({
                  package: pkg,
                  severity: info.severity,
                  type: 'vulnerability',
                  recommendation: `${info.severity} vulnerability: ${info.via[0].title || 'Update package'}`
                });
              }
            }
          }
        } catch (error) {
          // npm audit returns non-zero exit code when vulnerabilities are found
          if (error.stdout) {
            try {
              const audit = JSON.parse(error.stdout);
              
              if (audit.vulnerabilities) {
                for (const [pkg, info] of Object.entries(audit.vulnerabilities)) {
                  this.results.dependencyIssues.push({
                    package: pkg,
                    severity: info.severity,
                    type: 'vulnerability',
                    recommendation: `${info.severity} vulnerability: ${info.via[0].title || 'Update package'}`
                  });
                }
              }
            } catch (parseError) {
              console.error('Error parsing npm audit output:', parseError.message);
            }
          }
        }
      } else {
        console.log('No package.json found, skipping dependency analysis.');
      }
    } catch (error) {
      console.error('Error analyzing dependencies:', error.message);
    }
  }

  /**
   * Generate report
   */
  generateReport() {
    console.log('\n📊 CODE COMPLEXITY ANALYSIS REPORT');
    console.log('===============================');
    
    console.log(`\n📈 Files analyzed: ${this.results.filesAnalyzed}`);
    console.log(`📈 Complex functions found: ${this.results.complexFunctions.length}`);
    console.log(`📈 Large files found: ${this.results.largeFiles.length}`);
    console.log(`📈 Dependency issues found: ${this.results.dependencyIssues.length}`);
    
    console.log('\n🔴 COMPLEX FUNCTIONS');
    console.log('=================');
    
    if (this.results.complexFunctions.length === 0) {
      console.log('✅ No overly complex functions found.');
    } else {
      console.log(`Found ${this.results.complexFunctions.length} complex functions:`);
      
      // Sort by complexity (highest first)
      const sortedFunctions = [...this.results.complexFunctions].sort((a, b) => b.complexity - a.complexity);
      
      for (const item of sortedFunctions.slice(0, 20)) { // Show top 20
        console.log(`\n📄 ${item.file}`);
        console.log(`  - Function: ${item.function}`);
        console.log(`  - Complexity: ${item.complexity}`);
        console.log(`  - Recommendation: ${item.recommendation}`);
      }
      
      if (sortedFunctions.length > 20) {
        console.log(`\n... and ${sortedFunctions.length - 20} more complex functions`);
      }
    }
    
    console.log('\n🟠 LARGE FILES');
    console.log('============');
    
    if (this.results.largeFiles.length === 0) {
      console.log('✅ No excessively large files found.');
    } else {
      console.log(`Found ${this.results.largeFiles.length} large files:`);
      
      // Sort by line count (highest first)
      const sortedFiles = [...this.results.largeFiles].sort((a, b) => b.lines - a.lines);
      
      for (const item of sortedFiles.slice(0, 20)) { // Show top 20
        console.log(`\n📄 ${item.file}`);
        console.log(`  - Lines: ${item.lines}`);
        console.log(`  - Recommendation: ${item.recommendation}`);
      }
      
      if (sortedFiles.length > 20) {
        console.log(`\n... and ${sortedFiles.length - 20} more large files`);
      }
    }
    
    console.log('\n🟡 DEPENDENCY ISSUES');
    console.log('=================');
    
    if (this.results.dependencyIssues.length === 0) {
      console.log('✅ No dependency issues found.');
    } else {
      console.log(`Found ${this.results.dependencyIssues.length} dependency issues:`);
      
      // Group by type
      const vulnerabilities = this.results.dependencyIssues.filter(item => item.type === 'vulnerability');
      const outdated = this.results.dependencyIssues.filter(item => item.type === 'outdated');
      
      if (vulnerabilities.length > 0) {
        console.log('\n⚠️ Security Vulnerabilities:');
        
        // Sort by severity
        const severityOrder = { critical: 0, high: 1, moderate: 2, low: 3 };
        const sortedVulnerabilities = [...vulnerabilities].sort((a, b) => 
          severityOrder[a.severity] - severityOrder[b.severity]
        );
        
        for (const item of sortedVulnerabilities.slice(0, 10)) {
          console.log(`  - ${item.package}: ${item.recommendation}`);
        }
        
        if (sortedVulnerabilities.length > 10) {
          console.log(`  ... and ${sortedVulnerabilities.length - 10} more vulnerabilities`);
        }
      }
      
      if (outdated.length > 0) {
        console.log('\n📦 Outdated Packages:');
        
        for (const item of outdated.slice(0, 10)) {
          console.log(`  - ${item.package}: ${item.currentVersion} → ${item.latestVersion}`);
        }
        
        if (outdated.length > 10) {
          console.log(`  ... and ${outdated.length - 10} more outdated packages`);
        }
      }
    }
    
    console.log('\n🎯 SUMMARY');
    console.log('=========');
    
    if (this.results.complexFunctions.length === 0 && 
        this.results.largeFiles.length === 0 && 
        this.results.dependencyIssues.length === 0) {
      console.log('✅ No significant code quality issues found.');
    } else {
      console.log('Code quality issues found:');
      
      if (this.results.complexFunctions.length > 0) {
        console.log(`- ${this.results.complexFunctions.length} complex functions need refactoring`);
      }
      
      if (this.results.largeFiles.length > 0) {
        console.log(`- ${this.results.largeFiles.length} large files should be split or refactored`);
      }
      
      if (this.results.dependencyIssues.length > 0) {
        const vulnerabilities = this.results.dependencyIssues.filter(item => item.type === 'vulnerability');
        const outdated = this.results.dependencyIssues.filter(item => item.type === 'outdated');
        
        if (vulnerabilities.length > 0) {
          console.log(`- ${vulnerabilities.length} security vulnerabilities need to be addressed`);
        }
        
        if (outdated.length > 0) {
          console.log(`- ${outdated.length} outdated dependencies should be updated`);
        }
      }
    }
    
    // Save detailed results to file
    this.saveResultsToFile('scripts/code-complexity-results.json');
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
  const analyzer = new CodeComplexityAnalyzer();
  
  analyzer.execute()
    .then(results => {
      console.log('\n🏁 Analysis completed.');
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { CodeComplexityAnalyzer };