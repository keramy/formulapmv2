const fs = require('fs');
const path = require('path');

/**
 * Security Scanning Tools for Authentication and API Endpoints
 * Analyzes security vulnerabilities in auth flows and API routes
 */
class SecurityAnalyzer {
  constructor() {
    this.projectRoot = process.cwd();
    this.srcDir = path.join(this.projectRoot, 'src');
    this.apiDir = path.join(this.srcDir, 'app', 'api');
    this.libDir = path.join(this.srcDir, 'lib');
  }

  async analyze() {
    console.log('🔒 Analyzing security vulnerabilities...');
    
    const results = {
      timestamp: new Date().toISOString(),
      issues: [],
      summary: {
        totalVulnerabilities: 0,
        criticalVulnerabilities: 0,
        authenticationIssues: 0,
        authorizationIssues: 0,
        inputValidationIssues: 0,
        dataExposureIssues: 0,
        configurationIssues: 0
      },
      recommendations: []
    };

    try {
      // Analyze authentication system
      const authIssues = await this.analyzeAuthentication();
      results.issues.push(...authIssues);
      
      // Analyze API endpoint security
      const apiIssues = await this.analyzeAPIEndpoints();
      results.issues.push(...apiIssues);
      
      // Analyze authorization and permissions
      const authzIssues = await this.analyzeAuthorization();
      results.issues.push(...authzIssues);
      
      // Check input validation and sanitization
      const validationIssues = await this.analyzeInputValidation();
      results.issues.push(...validationIssues);
      
      // Analyze data exposure risks
      const dataIssues = await this.analyzeDataExposure();
      results.issues.push(...dataIssues);
      
      // Check security configuration
      const configIssues = await this.analyzeSecurityConfiguration();
      results.issues.push(...configIssues);
      
      // Update summary
      this.updateSummary(results);
      
      // Generate recommendations
      results.recommendations = this.generateRecommendations(results.issues);
      
    } catch (error) {
      results.issues.push({
        id: 'security-analyzer-error',
        category: 'security',
        severity: 'medium',
        title: 'Security Analysis Error',
        description: `Failed to complete security analysis: ${error.message}`,
        location: { file: 'security-analyzer.js', line: 0 },
        recommendation: 'Manually review security configurations and run security audit',
        estimatedEffort: 2,
        isProductionBlocker: false
      });
    }

    return results;
  }

  async analyzeAuthentication() {
    const issues = [];
    
    try {
      // Find authentication-related files
      const authFiles = this.findAuthFiles();
      
      for (const file of authFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const relativePath = path.relative(this.projectRoot, file);
        
        const fileIssues = this.analyzeAuthFile(relativePath, content);
        issues.push(...fileIssues);
      }
      
      // Check for common authentication vulnerabilities
      const commonIssues = await this.checkCommonAuthVulnerabilities();
      issues.push(...commonIssues);
      
    } catch (error) {
      issues.push({
        id: 'auth-analysis-error',
        category: 'security',
        severity: 'medium',
        title: 'Authentication Analysis Error',
        description: `Failed to analyze authentication: ${error.message}`,
        location: { file: 'authentication', line: 0 },
        recommendation: 'Manually review authentication implementation',
        estimatedEffort: 2,
        isProductionBlocker: false
      });
    }
    
    return issues;
  }

  findAuthFiles() {
    const authFiles = [];
    const searchPatterns = [
      'auth',
      'login',
      'signup',
      'session',
      'middleware',
      'supabase'
    ];
    
    const searchDirs = [
      this.libDir,
      this.apiDir,
      path.join(this.srcDir, 'app', '(auth)'),
      path.join(this.srcDir, 'middleware.ts')
    ];
    
    for (const dir of searchDirs) {
      if (fs.existsSync(dir)) {
        if (fs.statSync(dir).isFile()) {
          authFiles.push(dir);
        } else {
          const files = this.getFilesRecursively(dir, ['.ts', '.tsx']);
          const authRelatedFiles = files.filter(file => 
            searchPatterns.some(pattern => 
              file.toLowerCase().includes(pattern)
            )
          );
          authFiles.push(...authRelatedFiles);
        }
      }
    }
    
    return authFiles;
  }

  analyzeAuthFile(filePath, content) {
    const issues = [];
    
    // Check for hardcoded secrets or keys
    const secretPatterns = [
      /(?:password|secret|key|token)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
      /(?:api_key|apikey|access_token)\s*[:=]\s*['"][^'"]+['"]/gi
    ];
    
    secretPatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      matches.forEach(match => {
        issues.push({
          id: `hardcoded-secret-${filePath}`,
          category: 'security',
          severity: 'critical',
          title: `Hardcoded Secret in ${filePath}`,
          description: `Found potential hardcoded secret: ${match.substring(0, 50)}...`,
          location: { file: filePath, line: this.getLineNumber(content, content.indexOf(match)) },
          recommendation: 'Move secrets to environment variables and never commit them to code',
          estimatedEffort: 1,
          isProductionBlocker: true
        });
      });
    });
    
    // Check for weak session management
    if (content.includes('localStorage') && content.includes('token')) {
      issues.push({
        id: `insecure-token-storage-${filePath}`,
        category: 'security',
        severity: 'high',
        title: `Insecure Token Storage in ${filePath}`,
        description: 'Tokens stored in localStorage are vulnerable to XSS attacks',
        location: { file: filePath, line: 0 },
        recommendation: 'Use httpOnly cookies or secure session storage for sensitive tokens',
        estimatedEffort: 3,
        isProductionBlocker: false
      });
    }
    
    // Check for missing CSRF protection
    if (content.includes('POST') && !content.includes('csrf') && !content.includes('CSRF')) {
      issues.push({
        id: `missing-csrf-${filePath}`,
        category: 'security',
        severity: 'medium',
        title: `Potential Missing CSRF Protection in ${filePath}`,
        description: 'POST requests without apparent CSRF protection',
        location: { file: filePath, line: 0 },
        recommendation: 'Implement CSRF protection for state-changing operations',
        estimatedEffort: 2,
        isProductionBlocker: false
      });
    }
    
    // Check for weak password requirements
    const passwordPattern = /password.*(?:length|min|max)/gi;
    if (passwordPattern.test(content)) {
      const weakPasswordPattern = /(?:length|min).*[1-7][^0-9]/gi;
      if (weakPasswordPattern.test(content)) {
        issues.push({
          id: `weak-password-policy-${filePath}`,
          category: 'security',
          severity: 'medium',
          title: `Weak Password Policy in ${filePath}`,
          description: 'Password requirements appear to be too weak',
          location: { file: filePath, line: 0 },
          recommendation: 'Implement strong password requirements (min 8 chars, complexity)',
          estimatedEffort: 1,
          isProductionBlocker: false
        });
      }
    }
    
    return issues;
  }

  async checkCommonAuthVulnerabilities() {
    const issues = [];
    
    // Check for missing rate limiting
    const middlewareFile = path.join(this.srcDir, 'middleware.ts');
    if (fs.existsSync(middlewareFile)) {
      const content = fs.readFileSync(middlewareFile, 'utf8');
      
      if (!content.includes('rateLimit') && !content.includes('throttle')) {
        issues.push({
          id: 'missing-rate-limiting',
          category: 'security',
          severity: 'high',
          title: 'Missing Rate Limiting',
          description: 'No rate limiting detected in middleware',
          location: { file: 'src/middleware.ts', line: 0 },
          recommendation: 'Implement rate limiting to prevent brute force attacks',
          estimatedEffort: 3,
          isProductionBlocker: false
        });
      }
    }
    
    return issues;
  }

  async analyzeAPIEndpoints() {
    const issues = [];
    
    try {
      if (!fs.existsSync(this.apiDir)) {
        issues.push({
          id: 'missing-api-dir',
          category: 'infrastructure',
          severity: 'medium',
          title: 'API Directory Not Found',
          description: 'API routes directory not found',
          location: { file: 'src/app/api', line: 0 },
          recommendation: 'Ensure API routes are properly organized',
          estimatedEffort: 1,
          isProductionBlocker: false
        });
        return issues;
      }

      const apiFiles = this.getFilesRecursively(this.apiDir, ['.ts']);
      
      for (const file of apiFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const relativePath = path.relative(this.projectRoot, file);
        
        const fileIssues = this.analyzeAPIFile(relativePath, content);
        issues.push(...fileIssues);
      }
      
    } catch (error) {
      issues.push({
        id: 'api-analysis-error',
        category: 'security',
        severity: 'medium',
        title: 'API Analysis Error',
        description: `Failed to analyze API endpoints: ${error.message}`,
        location: { file: 'src/app/api', line: 0 },
        recommendation: 'Manually review API endpoint security',
        estimatedEffort: 2,
        isProductionBlocker: false
      });
    }
    
    return issues;
  }

  analyzeAPIFile(filePath, content) {
    const issues = [];
    
    // Check for missing authentication
    const hasAuth = content.includes('auth') || 
                   content.includes('session') || 
                   content.includes('user') ||
                   content.includes('getUser');
    
    const isPublicEndpoint = filePath.includes('public') || 
                            filePath.includes('webhook') ||
                            filePath.includes('health');
    
    if (!hasAuth && !isPublicEndpoint) {
      issues.push({
        id: `missing-auth-${filePath}`,
        category: 'security',
        severity: 'high',
        title: `Missing Authentication in ${filePath}`,
        description: 'API endpoint appears to lack authentication checks',
        location: { file: filePath, line: 0 },
        recommendation: 'Add authentication middleware or user verification',
        estimatedEffort: 2,
        isProductionBlocker: true
      });
    }
    
    // Check for missing input validation
    const hasValidation = content.includes('zod') || 
                         content.includes('validate') || 
                         content.includes('schema') ||
                         content.includes('parse');
    
    const hasInput = content.includes('request.json()') || 
                    content.includes('req.body') ||
                    content.includes('searchParams');
    
    if (hasInput && !hasValidation) {
      issues.push({
        id: `missing-validation-${filePath}`,
        category: 'security',
        severity: 'medium',
        title: `Missing Input Validation in ${filePath}`,
        description: 'API endpoint processes input without apparent validation',
        location: { file: filePath, line: 0 },
        recommendation: 'Add input validation using Zod or similar validation library',
        estimatedEffort: 2,
        isProductionBlocker: false
      });
    }
    
    // Check for SQL injection vulnerabilities
    const sqlPatterns = [
      /\$\{[^}]*\}/g, // Template literals in SQL
      /['"].*\+.*['"]/g, // String concatenation
      /query.*\+/g // Query concatenation
    ];
    
    sqlPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        issues.push({
          id: `sql-injection-risk-${filePath}`,
          category: 'security',
          severity: 'critical',
          title: `SQL Injection Risk in ${filePath}`,
          description: 'Potential SQL injection vulnerability detected',
          location: { file: filePath, line: 0 },
          recommendation: 'Use parameterized queries and avoid string concatenation in SQL',
          estimatedEffort: 3,
          isProductionBlocker: true
        });
      }
    });
    
    // Check for missing error handling that might expose sensitive info
    const hasErrorHandling = content.includes('try') && content.includes('catch');
    const hasQueries = content.includes('supabase') || content.includes('from(');
    
    if (hasQueries && !hasErrorHandling) {
      issues.push({
        id: `missing-error-handling-${filePath}`,
        category: 'security',
        severity: 'medium',
        title: `Missing Error Handling in ${filePath}`,
        description: 'Database operations without proper error handling may expose sensitive information',
        location: { file: filePath, line: 0 },
        recommendation: 'Add try-catch blocks and sanitize error messages',
        estimatedEffort: 1,
        isProductionBlocker: false
      });
    }
    
    // Check for CORS configuration
    if (content.includes('Response') && !content.includes('Access-Control')) {
      issues.push({
        id: `missing-cors-${filePath}`,
        category: 'security',
        severity: 'low',
        title: `Missing CORS Headers in ${filePath}`,
        description: 'API endpoint may need CORS configuration',
        location: { file: filePath, line: 0 },
        recommendation: 'Configure appropriate CORS headers for API endpoints',
        estimatedEffort: 1,
        isProductionBlocker: false
      });
    }
    
    return issues;
  }

  async analyzeAuthorization() {
    const issues = [];
    
    try {
      // Check RLS policies in migrations
      const migrationsDir = path.join(this.projectRoot, 'supabase', 'migrations');
      if (fs.existsSync(migrationsDir)) {
        const migrationFiles = fs.readdirSync(migrationsDir)
          .filter(file => file.endsWith('.sql'));
        
        let tablesWithRLS = new Set();
        let tablesWithoutRLS = new Set();
        
        for (const file of migrationFiles) {
          const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
          
          // Find table creations
          const tableMatches = content.match(/CREATE\s+TABLE\s+(\w+)/gi) || [];
          tableMatches.forEach(match => {
            const tableName = match.split(/\s+/)[2];
            tablesWithoutRLS.add(tableName);
          });
          
          // Find RLS enablements
          const rlsMatches = content.match(/ALTER\s+TABLE\s+(\w+)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi) || [];
          rlsMatches.forEach(match => {
            const tableName = match.split(/\s+/)[2];
            tablesWithRLS.add(tableName);
            tablesWithoutRLS.delete(tableName);
          });
        }
        
        // Report tables without RLS
        if (tablesWithoutRLS.size > 0) {
          issues.push({
            id: 'tables-without-rls',
            category: 'security',
            severity: 'high',
            title: 'Tables Without Row Level Security',
            description: `Found ${tablesWithoutRLS.size} tables without RLS: ${Array.from(tablesWithoutRLS).join(', ')}`,
            location: { file: 'supabase/migrations', line: 0 },
            recommendation: 'Enable Row Level Security on all tables containing sensitive data',
            estimatedEffort: 4,
            isProductionBlocker: true,
            metadata: {
              tablesWithoutRLS: Array.from(tablesWithoutRLS)
            }
          });
        }
      }
      
    } catch (error) {
      issues.push({
        id: 'authorization-analysis-error',
        category: 'security',
        severity: 'medium',
        title: 'Authorization Analysis Error',
        description: `Failed to analyze authorization: ${error.message}`,
        location: { file: 'authorization', line: 0 },
        recommendation: 'Manually review authorization and RLS policies',
        estimatedEffort: 2,
        isProductionBlocker: false
      });
    }
    
    return issues;
  }

  async analyzeInputValidation() {
    const issues = [];
    
    try {
      const apiFiles = this.getFilesRecursively(this.apiDir, ['.ts']);
      
      for (const file of apiFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const relativePath = path.relative(this.projectRoot, file);
        
        // Check for XSS vulnerabilities
        const xssPatterns = [
          /innerHTML\s*=\s*[^;]+/gi,
          /dangerouslySetInnerHTML/gi,
          /document\.write/gi
        ];
        
        xssPatterns.forEach(pattern => {
          if (pattern.test(content)) {
            issues.push({
              id: `xss-risk-${relativePath}`,
              category: 'security',
              severity: 'high',
              title: `XSS Risk in ${relativePath}`,
              description: 'Potential Cross-Site Scripting vulnerability detected',
              location: { file: relativePath, line: 0 },
              recommendation: 'Sanitize user input and use safe DOM manipulation methods',
              estimatedEffort: 2,
              isProductionBlocker: true
            });
          }
        });
        
        // Check for path traversal vulnerabilities
        if (content.includes('fs.readFile') || content.includes('fs.writeFile')) {
          const pathTraversalPattern = /\.\.\//g;
          if (pathTraversalPattern.test(content)) {
            issues.push({
              id: `path-traversal-${relativePath}`,
              category: 'security',
              severity: 'critical',
              title: `Path Traversal Risk in ${relativePath}`,
              description: 'Potential path traversal vulnerability in file operations',
              location: { file: relativePath, line: 0 },
              recommendation: 'Validate and sanitize file paths, use path.resolve() and whitelist allowed directories',
              estimatedEffort: 3,
              isProductionBlocker: true
            });
          }
        }
      }
      
    } catch (error) {
      console.warn('Warning: Could not analyze input validation:', error.message);
    }
    
    return issues;
  }

  async analyzeDataExposure() {
    const issues = [];
    
    try {
      const allFiles = this.getFilesRecursively(this.srcDir, ['.ts', '.tsx']);
      
      for (const file of allFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const relativePath = path.relative(this.projectRoot, file);
        
        // Check for console.log with sensitive data
        const consoleLogPattern = /console\.log\([^)]*(?:password|token|secret|key|auth)[^)]*\)/gi;
        if (consoleLogPattern.test(content)) {
          issues.push({
            id: `sensitive-logging-${relativePath}`,
            category: 'security',
            severity: 'medium',
            title: `Sensitive Data Logging in ${relativePath}`,
            description: 'Console.log statements may expose sensitive information',
            location: { file: relativePath, line: 0 },
            recommendation: 'Remove or sanitize console.log statements containing sensitive data',
            estimatedEffort: 1,
            isProductionBlocker: false
          });
        }
        
        // Check for overly permissive data selection
        const selectAllPattern = /select\(\s*['"`]\*['"`]\s*\)/gi;
        if (selectAllPattern.test(content)) {
          issues.push({
            id: `overpermissive-select-${relativePath}`,
            category: 'security',
            severity: 'low',
            title: `Overpermissive Data Selection in ${relativePath}`,
            description: 'SELECT * queries may expose more data than necessary',
            location: { file: relativePath, line: 0 },
            recommendation: 'Select only the specific columns needed',
            estimatedEffort: 1,
            isProductionBlocker: false
          });
        }
      }
      
    } catch (error) {
      console.warn('Warning: Could not analyze data exposure:', error.message);
    }
    
    return issues;
  }

  async analyzeSecurityConfiguration() {
    const issues = [];
    
    try {
      // Check Next.js security headers
      const nextConfigPath = path.join(this.projectRoot, 'next.config.js');
      if (fs.existsSync(nextConfigPath)) {
        const content = fs.readFileSync(nextConfigPath, 'utf8');
        
        const securityHeaders = [
          'X-Frame-Options',
          'X-Content-Type-Options',
          'X-XSS-Protection',
          'Content-Security-Policy'
        ];
        
        const missingHeaders = securityHeaders.filter(header => 
          !content.includes(header)
        );
        
        if (missingHeaders.length > 0) {
          issues.push({
            id: 'missing-security-headers',
            category: 'security',
            severity: 'medium',
            title: 'Missing Security Headers',
            description: `Missing security headers: ${missingHeaders.join(', ')}`,
            location: { file: 'next.config.js', line: 0 },
            recommendation: 'Add missing security headers to Next.js configuration',
            estimatedEffort: 2,
            isProductionBlocker: false,
            metadata: {
              missingHeaders
            }
          });
        }
      }
      
      // Check environment variable security
      const envFiles = ['.env.local', '.env.production', '.env'];
      for (const envFile of envFiles) {
        const envPath = path.join(this.projectRoot, envFile);
        if (fs.existsSync(envPath)) {
          const content = fs.readFileSync(envPath, 'utf8');
          
          // Check for weak or default values
          const weakPatterns = [
            /password\s*=\s*['"](?:password|123456|admin)['"]$/gim,
            /secret\s*=\s*['"](?:secret|test|dev)['"]$/gim
          ];
          
          weakPatterns.forEach(pattern => {
            if (pattern.test(content)) {
              issues.push({
                id: `weak-env-values-${envFile}`,
                category: 'security',
                severity: 'critical',
                title: `Weak Environment Values in ${envFile}`,
                description: 'Found weak or default values in environment configuration',
                location: { file: envFile, line: 0 },
                recommendation: 'Use strong, unique values for all secrets and passwords',
                estimatedEffort: 1,
                isProductionBlocker: true
              });
            }
          });
        }
      }
      
    } catch (error) {
      console.warn('Warning: Could not analyze security configuration:', error.message);
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
    
    results.summary.totalVulnerabilities = issues.length;
    results.summary.criticalVulnerabilities = issues.filter(i => i.severity === 'critical').length;
    results.summary.authenticationIssues = issues.filter(i => 
      i.id.includes('auth') || i.title.toLowerCase().includes('authentication')
    ).length;
    results.summary.authorizationIssues = issues.filter(i => 
      i.id.includes('rls') || i.title.toLowerCase().includes('authorization')
    ).length;
    results.summary.inputValidationIssues = issues.filter(i => 
      i.id.includes('validation') || i.id.includes('xss') || i.id.includes('injection')
    ).length;
    results.summary.dataExposureIssues = issues.filter(i => 
      i.id.includes('logging') || i.id.includes('select') || i.id.includes('exposure')
    ).length;
    results.summary.configurationIssues = issues.filter(i => 
      i.id.includes('config') || i.id.includes('headers') || i.id.includes('env')
    ).length;
  }

  generateRecommendations(issues) {
    const recommendations = [];
    
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push({
        priority: 'critical',
        title: 'Fix Critical Security Vulnerabilities',
        description: `Found ${criticalIssues.length} critical security vulnerabilities`,
        action: 'Address all critical security issues immediately before deployment'
      });
    }
    
    const authIssues = issues.filter(i => i.id.includes('auth'));
    if (authIssues.length > 0) {
      recommendations.push({
        priority: 'high',
        title: 'Strengthen Authentication Security',
        description: `Found ${authIssues.length} authentication security issues`,
        action: 'Review and strengthen authentication implementation'
      });
    }
    
    const rlsIssues = issues.filter(i => i.id.includes('rls'));
    if (rlsIssues.length > 0) {
      recommendations.push({
        priority: 'high',
        title: 'Implement Row Level Security',
        description: `Found ${rlsIssues.length} tables without proper RLS`,
        action: 'Enable and configure Row Level Security on all sensitive tables'
      });
    }
    
    const validationIssues = issues.filter(i => i.id.includes('validation'));
    if (validationIssues.length > 0) {
      recommendations.push({
        priority: 'medium',
        title: 'Improve Input Validation',
        description: `Found ${validationIssues.length} input validation issues`,
        action: 'Implement comprehensive input validation and sanitization'
      });
    }
    
    return recommendations;
  }
}

module.exports = SecurityAnalyzer;