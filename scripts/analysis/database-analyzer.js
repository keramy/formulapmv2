const fs = require('fs');
const path = require('path');

/**
 * Database Query Performance Monitoring for Supabase
 * Analyzes database queries, RLS policies, and performance patterns
 */
class DatabaseAnalyzer {
  constructor() {
    this.projectRoot = process.cwd();
    this.supabaseDir = path.join(this.projectRoot, 'supabase');
    this.migrationsDir = path.join(this.supabaseDir, 'migrations');
    this.srcDir = path.join(this.projectRoot, 'src');
  }

  async analyze() {
    console.log('🗄️  Analyzing database performance and queries...');
    
    const results = {
      timestamp: new Date().toISOString(),
      issues: [],
      summary: {
        totalQueries: 0,
        complexQueries: 0,
        rlsPolicies: 0,
        missingIndexes: 0,
        n1Problems: 0,
        performanceIssues: 0
      },
      recommendations: []
    };

    try {
      // Analyze database schema and migrations
      const schemaIssues = await this.analyzeSchema();
      results.issues.push(...schemaIssues);
      
      // Analyze RLS policies
      const rlsIssues = await this.analyzeRLSPolicies();
      results.issues.push(...rlsIssues);
      
      // Analyze queries in the codebase
      const queryIssues = await this.analyzeQueries();
      results.issues.push(...queryIssues);
      
      // Check for N+1 query problems
      const n1Issues = await this.checkN1Problems();
      results.issues.push(...n1Issues);
      
      // Analyze connection and performance patterns
      const connectionIssues = await this.analyzeConnectionPatterns();
      results.issues.push(...connectionIssues);
      
      // Update summary
      this.updateSummary(results);
      
      // Generate recommendations
      results.recommendations = this.generateRecommendations(results.issues);
      
    } catch (error) {
      results.issues.push({
        id: 'database-analyzer-error',
        category: 'performance',
        severity: 'medium',
        title: 'Database Analysis Error',
        description: `Failed to analyze database: ${error.message}`,
        location: { file: 'database-analyzer.js', line: 0 },
        recommendation: 'Check database configuration and connection',
        estimatedEffort: 2,
        isProductionBlocker: false
      });
    }

    return results;
  }

  async analyzeSchema() {
    const issues = [];
    
    try {
      if (!fs.existsSync(this.migrationsDir)) {
        issues.push({
          id: 'missing-migrations-dir',
          category: 'infrastructure',
          severity: 'high',
          title: 'Missing Migrations Directory',
          description: 'Supabase migrations directory not found',
          location: { file: 'supabase/migrations', line: 0 },
          recommendation: 'Initialize Supabase project and create migrations directory',
          estimatedEffort: 2,
          isProductionBlocker: true
        });
        return issues;
      }

      const migrationFiles = fs.readdirSync(this.migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      if (migrationFiles.length === 0) {
        issues.push({
          id: 'no-migrations',
          category: 'infrastructure',
          severity: 'medium',
          title: 'No Database Migrations Found',
          description: 'No SQL migration files found in migrations directory',
          location: { file: 'supabase/migrations', line: 0 },
          recommendation: 'Create database schema migrations',
          estimatedEffort: 4,
          isProductionBlocker: false
        });
        return issues;
      }

      // Analyze each migration file
      for (const file of migrationFiles) {
        const filePath = path.join(this.migrationsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        const fileIssues = this.analyzeMigrationFile(file, content);
        issues.push(...fileIssues);
      }
      
    } catch (error) {
      issues.push({
        id: 'schema-analysis-error',
        category: 'infrastructure',
        severity: 'medium',
        title: 'Schema Analysis Error',
        description: `Failed to analyze database schema: ${error.message}`,
        location: { file: 'supabase/migrations', line: 0 },
        recommendation: 'Check migration files and directory permissions',
        estimatedEffort: 1,
        isProductionBlocker: false
      });
    }
    
    return issues;
  }

  analyzeMigrationFile(filename, content) {
    const issues = [];
    const lines = content.split('\n');
    
    // Check for missing indexes on foreign keys
    const foreignKeyPattern = /REFERENCES\s+(\w+)\s*\((\w+)\)/gi;
    const indexPattern = /CREATE\s+INDEX/gi;
    
    let foreignKeyMatches = [];
    let match;
    while ((match = foreignKeyPattern.exec(content)) !== null) {
      foreignKeyMatches.push({
        table: match[1],
        column: match[2],
        line: this.getLineNumber(content, match.index)
      });
    }
    
    const hasIndexes = indexPattern.test(content);
    
    if (foreignKeyMatches.length > 0 && !hasIndexes) {
      issues.push({
        id: `missing-indexes-${filename}`,
        category: 'performance',
        severity: 'medium',
        title: `Potential Missing Indexes in ${filename}`,
        description: `Found ${foreignKeyMatches.length} foreign key references but no explicit indexes`,
        location: { file: `supabase/migrations/${filename}`, line: 0 },
        recommendation: 'Consider adding indexes on foreign key columns for better query performance',
        estimatedEffort: 2,
        isProductionBlocker: false,
        metadata: {
          foreignKeys: foreignKeyMatches
        }
      });
    }
    
    // Check for large table operations without proper considerations
    const alterTablePattern = /ALTER\s+TABLE\s+(\w+)/gi;
    const dropColumnPattern = /DROP\s+COLUMN/gi;
    
    if (alterTablePattern.test(content) && dropColumnPattern.test(content)) {
      issues.push({
        id: `risky-migration-${filename}`,
        category: 'infrastructure',
        severity: 'medium',
        title: `Potentially Risky Migration: ${filename}`,
        description: 'Migration contains ALTER TABLE with DROP COLUMN operations',
        location: { file: `supabase/migrations/${filename}`, line: 0 },
        recommendation: 'Ensure proper backup and consider gradual migration strategy',
        estimatedEffort: 1,
        isProductionBlocker: false
      });
    }
    
    // Check for RLS policies
    const rlsPattern = /CREATE\s+POLICY|ALTER\s+TABLE.*ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi;
    if (rlsPattern.test(content)) {
      // This is good, but we'll analyze RLS complexity separately
    }
    
    return issues;
  }

  async analyzeRLSPolicies() {
    const issues = [];
    
    try {
      const migrationFiles = fs.readdirSync(this.migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      let totalPolicies = 0;
      let complexPolicies = 0;
      
      for (const file of migrationFiles) {
        const filePath = path.join(this.migrationsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Count RLS policies
        const policyMatches = content.match(/CREATE\s+POLICY/gi) || [];
        totalPolicies += policyMatches.length;
        
        // Check for complex policies (multiple JOINs, subqueries)
        const complexPolicyPattern = /CREATE\s+POLICY.*?(?:JOIN|EXISTS|IN\s*\(SELECT)/gis;
        const complexMatches = content.match(complexPolicyPattern) || [];
        complexPolicies += complexMatches.length;
        
        // Check for policies without proper indexing support
        if (complexMatches.length > 0) {
          issues.push({
            id: `complex-rls-${file}`,
            category: 'performance',
            severity: 'medium',
            title: `Complex RLS Policies in ${file}`,
            description: `Found ${complexMatches.length} complex RLS policies that may impact query performance`,
            location: { file: `supabase/migrations/${file}`, line: 0 },
            recommendation: 'Review RLS policy complexity and ensure supporting indexes exist',
            estimatedEffort: 4,
            isProductionBlocker: false,
            metadata: {
              complexPolicies: complexMatches.length,
              totalPolicies: policyMatches.length
            }
          });
        }
      }
      
      // Check for excessive RLS complexity across the system
      if (totalPolicies > 20) {
        issues.push({
          id: 'excessive-rls-policies',
          category: 'performance',
          severity: 'high',
          title: 'High Number of RLS Policies',
          description: `Found ${totalPolicies} RLS policies across migrations, which may impact performance`,
          location: { file: 'supabase/migrations', line: 0 },
          recommendation: 'Consider consolidating RLS policies and optimizing policy logic for better performance',
          estimatedEffort: 8,
          isProductionBlocker: false,
          metadata: {
            totalPolicies,
            complexPolicies
          }
        });
      }
      
    } catch (error) {
      issues.push({
        id: 'rls-analysis-error',
        category: 'performance',
        severity: 'low',
        title: 'RLS Analysis Error',
        description: `Failed to analyze RLS policies: ${error.message}`,
        location: { file: 'supabase/migrations', line: 0 },
        recommendation: 'Manually review RLS policies for performance impact',
        estimatedEffort: 2,
        isProductionBlocker: false
      });
    }
    
    return issues;
  }

  async analyzeQueries() {
    const issues = [];
    
    try {
      // Find all TypeScript files that might contain database queries
      const queryFiles = this.findFilesWithQueries();
      
      for (const file of queryFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const fileIssues = this.analyzeQueryFile(file, content);
        issues.push(...fileIssues);
      }
      
    } catch (error) {
      issues.push({
        id: 'query-analysis-error',
        category: 'performance',
        severity: 'low',
        title: 'Query Analysis Error',
        description: `Failed to analyze queries: ${error.message}`,
        location: { file: 'src/', line: 0 },
        recommendation: 'Manually review database queries for performance issues',
        estimatedEffort: 2,
        isProductionBlocker: false
      });
    }
    
    return issues;
  }

  findFilesWithQueries() {
    const files = [];
    
    const searchDirs = [
      path.join(this.srcDir, 'app', 'api'),
      path.join(this.srcDir, 'lib'),
      path.join(this.srcDir, 'hooks')
    ];
    
    for (const dir of searchDirs) {
      if (fs.existsSync(dir)) {
        const dirFiles = this.getFilesRecursively(dir, ['.ts', '.tsx']);
        files.push(...dirFiles);
      }
    }
    
    return files;
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

  analyzeQueryFile(filePath, content) {
    const issues = [];
    const relativePath = path.relative(this.projectRoot, filePath);
    
    // Check for potential N+1 queries
    const loopQueryPattern = /for\s*\([^}]+\)\s*{[^}]*(?:supabase|from|select)[^}]*}/gis;
    const loopMatches = content.match(loopQueryPattern) || [];
    
    if (loopMatches.length > 0) {
      issues.push({
        id: `potential-n1-${relativePath}`,
        category: 'performance',
        severity: 'high',
        title: `Potential N+1 Query Pattern in ${relativePath}`,
        description: 'Found database queries inside loops which may cause N+1 query problems',
        location: { file: relativePath, line: 0 },
        recommendation: 'Consider using batch queries or JOIN operations instead of queries in loops',
        estimatedEffort: 3,
        isProductionBlocker: false,
        metadata: {
          patternCount: loopMatches.length
        }
      });
    }
    
    // Check for missing error handling
    const queryPattern = /(?:supabase|from|select).*?(?:insert|update|delete|select)/gis;
    const errorHandlingPattern = /catch|try.*catch|\.catch\(/gis;
    
    const hasQueries = queryPattern.test(content);
    const hasErrorHandling = errorHandlingPattern.test(content);
    
    if (hasQueries && !hasErrorHandling) {
      issues.push({
        id: `missing-error-handling-${relativePath}`,
        category: 'bug',
        severity: 'medium',
        title: `Missing Database Error Handling in ${relativePath}`,
        description: 'Database queries found without proper error handling',
        location: { file: relativePath, line: 0 },
        recommendation: 'Add try-catch blocks or .catch() handlers for database operations',
        estimatedEffort: 2,
        isProductionBlocker: false
      });
    }
    
    // Check for hardcoded limits that might be too high
    const limitPattern = /\.limit\((\d+)\)/gi;
    let match;
    while ((match = limitPattern.exec(content)) !== null) {
      const limit = parseInt(match[1]);
      if (limit > 1000) {
        issues.push({
          id: `high-limit-${relativePath}-${limit}`,
          category: 'performance',
          severity: 'medium',
          title: `High Query Limit in ${relativePath}`,
          description: `Found query with limit of ${limit}, which may impact performance`,
          location: { file: relativePath, line: this.getLineNumber(content, match.index) },
          recommendation: 'Consider implementing pagination or reducing the limit',
          estimatedEffort: 2,
          isProductionBlocker: false,
          metadata: {
            limit: limit
          }
        });
      }
    }
    
    return issues;
  }

  async checkN1Problems() {
    const issues = [];
    
    try {
      // Look for common N+1 patterns in React components and hooks
      const componentFiles = this.getFilesRecursively(
        path.join(this.srcDir, 'components'), 
        ['.tsx']
      );
      
      const hookFiles = this.getFilesRecursively(
        path.join(this.srcDir, 'hooks'), 
        ['.ts', '.tsx']
      );
      
      const allFiles = [...componentFiles, ...hookFiles];
      
      for (const file of allFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const relativePath = path.relative(this.projectRoot, file);
        
        // Check for useEffect with database calls that depend on arrays
        const useEffectPattern = /useEffect\s*\([^,]+,\s*\[[^\]]*\]\s*\)/gs;
        const matches = content.match(useEffectPattern) || [];
        
        for (const match of matches) {
          if (match.includes('supabase') || match.includes('from(')) {
            issues.push({
              id: `useeffect-query-${relativePath}`,
              category: 'performance',
              severity: 'medium',
              title: `Potential N+1 in useEffect: ${relativePath}`,
              description: 'useEffect with database queries may cause excessive re-renders and queries',
              location: { file: relativePath, line: 0 },
              recommendation: 'Consider memoization or moving queries outside useEffect',
              estimatedEffort: 2,
              isProductionBlocker: false
            });
          }
        }
      }
      
    } catch (error) {
      console.warn('Warning: Could not check for N+1 problems:', error.message);
    }
    
    return issues;
  }

  async analyzeConnectionPatterns() {
    const issues = [];
    
    try {
      // Check for proper connection pooling configuration
      const libFiles = this.getFilesRecursively(path.join(this.srcDir, 'lib'), ['.ts']);
      
      for (const file of libFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const relativePath = path.relative(this.projectRoot, file);
        
        // Check for multiple Supabase client instances
        const clientPattern = /createClient|new\s+SupabaseClient/gi;
        const matches = content.match(clientPattern) || [];
        
        if (matches.length > 1) {
          issues.push({
            id: `multiple-clients-${relativePath}`,
            category: 'performance',
            severity: 'medium',
            title: `Multiple Supabase Clients in ${relativePath}`,
            description: 'Multiple Supabase client instances may lead to connection issues',
            location: { file: relativePath, line: 0 },
            recommendation: 'Use a singleton pattern for Supabase client instances',
            estimatedEffort: 2,
            isProductionBlocker: false,
            metadata: {
              clientCount: matches.length
            }
          });
        }
      }
      
    } catch (error) {
      console.warn('Warning: Could not analyze connection patterns:', error.message);
    }
    
    return issues;
  }

  getLineNumber(content, index) {
    const lines = content.substring(0, index).split('\n');
    return lines.length;
  }

  updateSummary(results) {
    const issues = results.issues;
    
    results.summary.totalQueries = issues.filter(i => 
      i.id.includes('query') || i.id.includes('n1')
    ).length;
    
    results.summary.complexQueries = issues.filter(i => 
      i.id.includes('complex') || i.severity === 'high'
    ).length;
    
    results.summary.rlsPolicies = issues.filter(i => 
      i.id.includes('rls')
    ).length;
    
    results.summary.missingIndexes = issues.filter(i => 
      i.id.includes('missing-indexes')
    ).length;
    
    results.summary.n1Problems = issues.filter(i => 
      i.id.includes('n1') || i.id.includes('useeffect-query')
    ).length;
    
    results.summary.performanceIssues = issues.filter(i => 
      i.category === 'performance'
    ).length;
  }

  generateRecommendations(issues) {
    const recommendations = [];
    
    const performanceIssues = issues.filter(i => i.category === 'performance');
    const highSeverityIssues = performanceIssues.filter(i => i.severity === 'high');
    
    if (highSeverityIssues.length > 0) {
      recommendations.push({
        priority: 'high',
        title: 'Address Critical Database Performance Issues',
        description: `Found ${highSeverityIssues.length} high-severity database performance issues`,
        action: 'Optimize queries, add indexes, and fix N+1 query problems immediately'
      });
    }
    
    const rlsIssues = issues.filter(i => i.id.includes('rls'));
    if (rlsIssues.length > 0) {
      recommendations.push({
        priority: 'medium',
        title: 'Optimize RLS Policies',
        description: `Found ${rlsIssues.length} RLS policy optimization opportunities`,
        action: 'Review and optimize Row Level Security policies for better performance'
      });
    }
    
    const indexIssues = issues.filter(i => i.id.includes('missing-indexes'));
    if (indexIssues.length > 0) {
      recommendations.push({
        priority: 'medium',
        title: 'Add Missing Database Indexes',
        description: `Found ${indexIssues.length} potential missing index opportunities`,
        action: 'Add indexes on foreign key columns and frequently queried fields'
      });
    }
    
    return recommendations;
  }
}

module.exports = DatabaseAnalyzer;