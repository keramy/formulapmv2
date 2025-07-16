const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * TypeScript Error Detection and Reporting System
 * Analyzes TypeScript compilation errors and type inconsistencies
 */
class TypeScriptAnalyzer {
  constructor() {
    this.projectRoot = process.cwd();
    this.tsconfigPath = path.join(this.projectRoot, 'tsconfig.json');
  }

  async analyze() {
    console.log('🔍 Analyzing TypeScript errors...');
    
    const results = {
      timestamp: new Date().toISOString(),
      issues: [],
      summary: {
        totalErrors: 0,
        totalWarnings: 0,
        criticalIssues: 0,
        typeErrors: 0,
        importErrors: 0,
        configurationIssues: 0
      },
      recommendations: []
    };

    try {
      // Run TypeScript compiler check
      const tscResults = await this.runTypeScriptCheck();
      results.issues.push(...tscResults.issues);
      
      // Analyze tsconfig.json
      const configResults = await this.analyzeTsConfig();
      results.issues.push(...configResults.issues);
      
      // Check for common TypeScript patterns and issues
      const patternResults = await this.analyzeCommonPatterns();
      results.issues.push(...patternResults.issues);
      
      // Update summary
      this.updateSummary(results);
      
      // Generate recommendations
      results.recommendations = this.generateRecommendations(results.issues);
      
    } catch (error) {
      results.issues.push({
        id: 'typescript-analyzer-error',
        category: 'bug',
        severity: 'high',
        title: 'TypeScript Analyzer Error',
        description: `Failed to run TypeScript analysis: ${error.message}`,
        location: { file: 'typescript-analyzer.js', line: 0 },
        recommendation: 'Check TypeScript installation and configuration',
        estimatedEffort: 1,
        isProductionBlocker: false
      });
    }

    return results;
  }

  async runTypeScriptCheck() {
    const results = { issues: [] };
    
    try {
      // Run tsc --noEmit to check for type errors without generating files
      execSync('npx tsc --noEmit --pretty false', { 
        cwd: this.projectRoot,
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      console.log('✅ No TypeScript compilation errors found');
      
    } catch (error) {
      const output = error.stdout || error.stderr || '';
      const errors = this.parseTypeScriptErrors(output);
      
      errors.forEach(error => {
        results.issues.push({
          id: `ts-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          category: 'bug',
          severity: this.determineSeverity(error.code, error.message),
          title: `TypeScript Error: ${error.code}`,
          description: error.message,
          location: {
            file: error.file,
            line: error.line,
            column: error.column
          },
          recommendation: this.getRecommendationForError(error.code, error.message),
          estimatedEffort: this.estimateEffortForError(error.code),
          isProductionBlocker: this.isProductionBlocker(error.code),
          metadata: {
            errorCode: error.code,
            category: this.categorizeError(error.code)
          }
        });
      });
      
      console.log(`⚠️  Found ${errors.length} TypeScript errors`);
    }
    
    return results;
  }

  parseTypeScriptErrors(output) {
    const errors = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      // Parse TypeScript error format: file(line,column): error TS####: message
      const match = line.match(/^(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$/);
      if (match) {
        errors.push({
          file: match[1],
          line: parseInt(match[2]),
          column: parseInt(match[3]),
          code: match[4],
          message: match[5]
        });
      }
    }
    
    return errors;
  }

  async analyzeTsConfig() {
    const results = { issues: [] };
    
    try {
      if (!fs.existsSync(this.tsconfigPath)) {
        results.issues.push({
          id: 'missing-tsconfig',
          category: 'infrastructure',
          severity: 'critical',
          title: 'Missing tsconfig.json',
          description: 'TypeScript configuration file is missing',
          location: { file: 'tsconfig.json', line: 0 },
          recommendation: 'Create a tsconfig.json file with proper TypeScript configuration',
          estimatedEffort: 2,
          isProductionBlocker: true
        });
        return results;
      }

      const tsconfig = JSON.parse(fs.readFileSync(this.tsconfigPath, 'utf8'));
      
      // Check for recommended compiler options
      const recommendations = this.checkCompilerOptions(tsconfig.compilerOptions || {});
      results.issues.push(...recommendations);
      
      // Check for path mapping issues
      const pathIssues = this.checkPathMappings(tsconfig.compilerOptions?.paths || {});
      results.issues.push(...pathIssues);
      
    } catch (error) {
      results.issues.push({
        id: 'tsconfig-parse-error',
        category: 'infrastructure',
        severity: 'high',
        title: 'Invalid tsconfig.json',
        description: `Failed to parse tsconfig.json: ${error.message}`,
        location: { file: 'tsconfig.json', line: 0 },
        recommendation: 'Fix JSON syntax errors in tsconfig.json',
        estimatedEffort: 1,
        isProductionBlocker: true
      });
    }
    
    return results;
  }

  checkCompilerOptions(options) {
    const issues = [];
    const recommendations = [
      {
        option: 'strict',
        expected: true,
        severity: 'medium',
        reason: 'Enables all strict type checking options'
      },
      {
        option: 'noUnusedLocals',
        expected: true,
        severity: 'low',
        reason: 'Helps identify unused variables'
      },
      {
        option: 'noUnusedParameters',
        expected: true,
        severity: 'low',
        reason: 'Helps identify unused parameters'
      },
      {
        option: 'exactOptionalPropertyTypes',
        expected: true,
        severity: 'medium',
        reason: 'Improves type safety for optional properties'
      }
    ];

    recommendations.forEach(rec => {
      if (options[rec.option] !== rec.expected) {
        issues.push({
          id: `tsconfig-${rec.option}`,
          category: 'quality',
          severity: rec.severity,
          title: `TypeScript Configuration: ${rec.option}`,
          description: `Consider setting "${rec.option}": ${rec.expected}. ${rec.reason}`,
          location: { file: 'tsconfig.json', line: 0 },
          recommendation: `Add "${rec.option}": ${rec.expected} to compilerOptions`,
          estimatedEffort: 0.5,
          isProductionBlocker: false
        });
      }
    });

    return issues;
  }

  checkPathMappings(paths) {
    const issues = [];
    
    Object.entries(paths).forEach(([alias, mappings]) => {
      mappings.forEach(mapping => {
        const resolvedPath = path.resolve(this.projectRoot, mapping.replace('*', ''));
        if (!fs.existsSync(resolvedPath)) {
          issues.push({
            id: `path-mapping-${alias}`,
            category: 'infrastructure',
            severity: 'medium',
            title: `Invalid Path Mapping: ${alias}`,
            description: `Path mapping "${alias}" points to non-existent directory: ${mapping}`,
            location: { file: 'tsconfig.json', line: 0 },
            recommendation: `Update path mapping or create the missing directory: ${mapping}`,
            estimatedEffort: 1,
            isProductionBlocker: false
          });
        }
      });
    });
    
    return issues;
  }

  async analyzeCommonPatterns() {
    const results = { issues: [] };
    
    try {
      // Check for any/unknown usage
      const anyUsageIssues = await this.checkAnyUsage();
      results.issues.push(...anyUsageIssues);
      
      // Check for missing return types
      const returnTypeIssues = await this.checkMissingReturnTypes();
      results.issues.push(...returnTypeIssues);
      
      // Check for unused imports
      const unusedImportIssues = await this.checkUnusedImports();
      results.issues.push(...unusedImportIssues);
      
    } catch (error) {
      console.warn('Warning: Could not analyze common patterns:', error.message);
    }
    
    return results;
  }

  async checkAnyUsage() {
    const issues = [];
    
    try {
      // Cross-platform approach to find 'any' usage
      const sourceFiles = this.getFilesRecursively(path.join(this.projectRoot, 'src'), ['.ts', '.tsx']);
      
      for (const file of sourceFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        const relativePath = path.relative(this.projectRoot, file);
        
        lines.forEach((line, index) => {
          if (/\bany\b/.test(line) && !line.trim().startsWith('//')) {
            issues.push({
              id: `any-usage-${relativePath}-${index + 1}`,
              category: 'quality',
              severity: 'low',
              title: 'Usage of "any" type',
              description: `Found usage of "any" type which reduces type safety: ${line.trim()}`,
              location: { file: relativePath, line: index + 1 },
              recommendation: 'Replace "any" with specific types for better type safety',
              estimatedEffort: 0.5,
              isProductionBlocker: false
            });
          }
        });
      }
    } catch (error) {
      // Ignore errors
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

  async checkMissingReturnTypes() {
    // This would require more sophisticated AST parsing
    // For now, return empty array as this is a complex analysis
    return [];
  }

  async checkUnusedImports() {
    const issues = [];
    
    try {
      // Check for unused imports using a simple pattern
      const result = execSync(
        'find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "^import.*from" | head -10',
        { cwd: this.projectRoot, encoding: 'utf8' }
      );
      
      // This is a simplified check - in a real implementation,
      // you'd want to use TypeScript's AST or a tool like ts-unused-exports
      
    } catch (error) {
      // Ignore errors
    }
    
    return issues;
  }

  determineSeverity(errorCode, message) {
    // Critical errors that prevent compilation
    const criticalCodes = ['TS2307', 'TS2304', 'TS2322', 'TS2345'];
    if (criticalCodes.includes(errorCode)) {
      return 'critical';
    }
    
    // High priority errors
    const highPriorityCodes = ['TS2339', 'TS2571', 'TS2740'];
    if (highPriorityCodes.includes(errorCode)) {
      return 'high';
    }
    
    // Medium priority by default
    return 'medium';
  }

  categorizeError(errorCode) {
    const categories = {
      'TS2307': 'import',
      'TS2304': 'type',
      'TS2322': 'type',
      'TS2339': 'property',
      'TS2345': 'argument',
      'TS2571': 'type',
      'TS2740': 'type'
    };
    
    return categories[errorCode] || 'general';
  }

  getRecommendationForError(errorCode, message) {
    const recommendations = {
      'TS2307': 'Check import path and ensure the module exists',
      'TS2304': 'Define the missing type or import it from the correct module',
      'TS2322': 'Ensure the assigned value matches the expected type',
      'TS2339': 'Check if the property exists on the type or add it to the interface',
      'TS2345': 'Verify function arguments match the expected parameters',
      'TS2571': 'Initialize the object or make the property optional',
      'TS2740': 'Ensure all required properties are provided'
    };
    
    return recommendations[errorCode] || 'Review the TypeScript error and fix according to type requirements';
  }

  estimateEffortForError(errorCode) {
    const effortMap = {
      'TS2307': 2, // Import issues might require restructuring
      'TS2304': 1, // Type definition issues
      'TS2322': 1, // Type assignment issues
      'TS2339': 1, // Property issues
      'TS2345': 0.5, // Argument issues
      'TS2571': 1, // Object initialization
      'TS2740': 1  // Missing properties
    };
    
    return effortMap[errorCode] || 1;
  }

  isProductionBlocker(errorCode) {
    // These errors prevent compilation and are production blockers
    const blockers = ['TS2307', 'TS2304'];
    return blockers.includes(errorCode);
  }

  updateSummary(results) {
    results.issues.forEach(issue => {
      if (issue.severity === 'critical') {
        results.summary.criticalIssues++;
      }
      
      if (issue.metadata?.category === 'import') {
        results.summary.importErrors++;
      } else if (issue.metadata?.category === 'type') {
        results.summary.typeErrors++;
      }
      
      if (issue.category === 'infrastructure') {
        results.summary.configurationIssues++;
      }
    });
    
    results.summary.totalErrors = results.issues.filter(i => i.severity === 'critical' || i.severity === 'high').length;
    results.summary.totalWarnings = results.issues.filter(i => i.severity === 'medium' || i.severity === 'low').length;
  }

  generateRecommendations(issues) {
    const recommendations = [];
    
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push({
        priority: 'high',
        title: 'Fix Critical TypeScript Errors',
        description: `Address ${criticalIssues.length} critical TypeScript errors that prevent compilation`,
        action: 'Review and fix all critical TypeScript compilation errors before deployment'
      });
    }
    
    const anyUsage = issues.filter(i => i.title.includes('any'));
    if (anyUsage.length > 5) {
      recommendations.push({
        priority: 'medium',
        title: 'Reduce "any" Type Usage',
        description: `Found ${anyUsage.length} instances of "any" type usage`,
        action: 'Replace "any" types with specific interfaces for better type safety'
      });
    }
    
    const configIssues = issues.filter(i => i.category === 'infrastructure');
    if (configIssues.length > 0) {
      recommendations.push({
        priority: 'medium',
        title: 'Improve TypeScript Configuration',
        description: `Found ${configIssues.length} configuration improvements`,
        action: 'Update tsconfig.json with recommended compiler options'
      });
    }
    
    return recommendations;
  }
}

module.exports = TypeScriptAnalyzer;