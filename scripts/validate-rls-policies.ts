#!/usr/bin/env node

/**
 * RLS Policy Validation Script
 * 
 * This script prevents auth.uid() performance issues by:
 * 1. Scanning migration files for problematic patterns
 * 2. Suggesting optimized alternatives  
 * 3. Validating that new policies use the RLS function library
 * 4. Providing educational feedback to developers
 * 
 * Usage:
 *   npm run validate-rls
 *   npm run validate-rls -- --fix  (auto-fix simple issues)
 *   npm run validate-rls -- --file migration.sql
 */

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

interface ValidationIssue {
  file: string;
  line: number;
  column: number;
  type: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
  autoFix?: string;
}

interface ValidationResult {
  issues: ValidationIssue[];
  summary: {
    errors: number;
    warnings: number;
    filesScanned: number;
    issuesFixed?: number;
  };
}

// Problematic patterns that cause performance issues
const ANTI_PATTERNS = [
  {
    pattern: /auth\.uid\(\)/g,
    type: 'error' as const,
    message: 'Direct auth.uid() call causes performance issues (re-evaluated per row)',
    suggestion: 'Use rls_current_user_id() or (SELECT auth.uid()) instead',
    autoFix: 'rls_current_user_id()'
  },
  {
    pattern: /auth\.uid\(\)\s+IS\s+NOT\s+NULL/gi,
    type: 'error' as const,
    message: 'auth.uid() IS NOT NULL causes performance issues',
    suggestion: 'Use rls_authenticated_only() function instead',
    autoFix: 'rls_authenticated_only()'
  },
  {
    pattern: /=\s*auth\.uid\(\)/g,
    type: 'error' as const,
    message: 'Direct auth.uid() comparison causes performance issues',
    suggestion: 'Use rls_is_owner(column_name) function instead',
    autoFix: (match: string, context: string) => {
      // Try to extract column name from context
      const columnMatch = context.match(/(\w+)\s*=\s*auth\.uid\(\)/);
      if (columnMatch) {
        return `rls_is_owner(${columnMatch[1]})`;
      }
      return 'rls_is_owner(column_name) -- UPDATE COLUMN NAME';
    }
  },
  {
    pattern: /SELECT\s+role\s+FROM\s+user_profiles/gi,
    type: 'warning' as const,
    message: 'Querying user_profiles for role can cause infinite recursion',
    suggestion: 'Use rls_get_user_role() function instead'
  },
  {
    pattern: /SELECT.*FROM.*user_profiles.*WHERE.*id.*=.*auth\.uid/gi,
    type: 'error' as const,
    message: 'Querying user_profiles with auth.uid() can cause infinite recursion',
    suggestion: 'Use RLS functions like rls_get_user_role() or rls_is_management() instead'
  }
];

// Recommended patterns
const RECOMMENDED_PATTERNS = [
  'rls_authenticated_only()',
  'rls_is_owner(column_name)',
  'rls_management_only()',
  'rls_project_team_or_management(project_id)',
  'rls_project_stakeholder_access(project_id)',
  'rls_has_role(ARRAY[\'role1\', \'role2\'])'
];

// Check if using recommended patterns
const GOOD_PATTERNS = [
  {
    pattern: /rls_\w+\(/g,
    type: 'info' as const,
    message: '✅ Using optimized RLS function'
  }
];

class RLSValidator {
  private issues: ValidationIssue[] = [];
  private filesScanned = 0;
  private fixMode = false;

  constructor(fixMode = false) {
    this.fixMode = fixMode;
  }

  validateFile(filePath: string): ValidationIssue[] {
    this.filesScanned++;
    const fileIssues: ValidationIssue[] = [];
    
    if (!fs.existsSync(filePath)) {
      return [{
        file: filePath,
        line: 0,
        column: 0,
        type: 'error',
        message: 'File not found'
      }];
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, lineIndex) => {
      // Check for anti-patterns
      ANTI_PATTERNS.forEach(antiPattern => {
        const matches = [...line.matchAll(antiPattern.pattern)];
        matches.forEach(match => {
          const issue: ValidationIssue = {
            file: filePath,
            line: lineIndex + 1,
            column: match.index || 0,
            type: antiPattern.type,
            message: antiPattern.message,
            suggestion: antiPattern.suggestion
          };

          if (antiPattern.autoFix) {
            if (typeof antiPattern.autoFix === 'string') {
              issue.autoFix = antiPattern.autoFix;
            } else {
              issue.autoFix = antiPattern.autoFix(match[0], line);
            }
          }

          fileIssues.push(issue);
        });
      });

      // Check for good patterns
      GOOD_PATTERNS.forEach(goodPattern => {
        const matches = [...line.matchAll(goodPattern.pattern)];
        if (matches.length > 0) {
          fileIssues.push({
            file: filePath,
            line: lineIndex + 1,
            column: matches[0].index || 0,
            type: goodPattern.type,
            message: goodPattern.message
          });
        }
      });
    });

    return fileIssues;
  }

  validateDirectory(dirPath: string): ValidationResult {
    const migrationPattern = path.join(dirPath, '**/*.sql');
    const files = glob.sync(migrationPattern);

    console.log(`🔍 Scanning ${files.length} SQL files for RLS policy issues...\n`);

    files.forEach(file => {
      const fileIssues = this.validateFile(file);
      this.issues.push(...fileIssues);
    });

    return this.generateReport();
  }

  validateSingleFile(filePath: string): ValidationResult {
    console.log(`🔍 Scanning ${filePath} for RLS policy issues...\n`);
    
    const fileIssues = this.validateFile(filePath);
    this.issues.push(...fileIssues);

    return this.generateReport();
  }

  private generateReport(): ValidationResult {
    const errors = this.issues.filter(i => i.type === 'error').length;
    const warnings = this.issues.filter(i => i.type === 'warning').length;

    return {
      issues: this.issues,
      summary: {
        errors,
        warnings,
        filesScanned: this.filesScanned,
        issuesFixed: this.fixMode ? this.autoFixIssues() : undefined
      }
    };
  }

  private autoFixIssues(): number {
    // Group issues by file
    const issuesByFile = new Map<string, ValidationIssue[]>();
    
    this.issues
      .filter(issue => issue.autoFix && issue.type === 'error')
      .forEach(issue => {
        if (!issuesByFile.has(issue.file)) {
          issuesByFile.set(issue.file, []);
        }
        issuesByFile.get(issue.file)!.push(issue);
      });

    let fixedCount = 0;

    issuesByFile.forEach((issues, filePath) => {
      let content = fs.readFileSync(filePath, 'utf-8');
      let lines = content.split('\n');

      // Sort issues by line number (descending) to avoid line number shifts
      issues.sort((a, b) => b.line - a.line);

      issues.forEach(issue => {
        if (issue.autoFix && issue.line <= lines.length) {
          const lineIndex = issue.line - 1;
          const originalLine = lines[lineIndex];
          
          // Apply the fix
          ANTI_PATTERNS.forEach(pattern => {
            if (pattern.autoFix && originalLine.match(pattern.pattern)) {
              lines[lineIndex] = originalLine.replace(pattern.pattern, pattern.autoFix as string);
              fixedCount++;
            }
          });
        }
      });

      // Write back the fixed content
      const fixedContent = lines.join('\n');
      fs.writeFileSync(filePath, fixedContent, 'utf-8');
      console.log(`🔧 Auto-fixed ${issues.length} issues in ${filePath}`);
    });

    return fixedCount;
  }

  printReport(result: ValidationResult): void {
    console.log('📊 RLS Policy Validation Report');
    console.log('================================\n');

    if (result.issues.length === 0) {
      console.log('✅ No RLS policy issues found! Great job using optimized patterns.\n');
      this.printRecommendations();
      return;
    }

    // Group issues by type
    const errors = result.issues.filter(i => i.type === 'error');
    const warnings = result.issues.filter(i => i.type === 'warning');
    const info = result.issues.filter(i => i.type === 'info');

    if (errors.length > 0) {
      console.log('❌ ERRORS (Must Fix):');
      errors.forEach(issue => {
        console.log(`  ${issue.file}:${issue.line}:${issue.column}`);
        console.log(`    ${issue.message}`);
        if (issue.suggestion) {
          console.log(`    💡 Suggestion: ${issue.suggestion}`);
        }
        console.log('');
      });
    }

    if (warnings.length > 0) {
      console.log('⚠️  WARNINGS (Should Fix):');
      warnings.forEach(issue => {
        console.log(`  ${issue.file}:${issue.line}:${issue.column}`);
        console.log(`    ${issue.message}`);
        if (issue.suggestion) {
          console.log(`    💡 Suggestion: ${issue.suggestion}`);
        }
        console.log('');
      });
    }

    if (info.length > 0) {
      console.log('ℹ️  INFO (Good Practices):');
      info.forEach(issue => {
        console.log(`  ${issue.file}:${issue.line}: ${issue.message}`);
      });
      console.log('');
    }

    console.log('📈 Summary:');
    console.log(`  Files scanned: ${result.summary.filesScanned}`);
    console.log(`  Errors: ${result.summary.errors}`);
    console.log(`  Warnings: ${result.summary.warnings}`);
    console.log(`  Good practices: ${info.length}`);
    
    if (result.summary.issuesFixed) {
      console.log(`  Issues auto-fixed: ${result.summary.issuesFixed}`);
    }

    console.log('');

    if (result.summary.errors > 0) {
      console.log('🚨 Action Required:');
      console.log('  Your migration has performance issues that will cause slowdowns.');
      console.log('  Please fix the errors above before proceeding.\n');
      
      if (!this.fixMode) {
        console.log('💡 Quick Fix:');
        console.log('  Run: npm run validate-rls -- --fix');
        console.log('  This will automatically fix simple auth.uid() issues.\n');
      }
    }

    this.printRecommendations();
  }

  private printRecommendations(): void {
    console.log('📚 Recommended RLS Patterns:');
    console.log('============================');
    RECOMMENDED_PATTERNS.forEach(pattern => {
      console.log(`  ✅ ${pattern}`);
    });
    console.log('');
    console.log('📖 Documentation:');
    console.log('  See CLAUDE.md for complete RLS function library documentation');
    console.log('  All functions are performance-optimized and prevent recursion');
  }
}

// CLI interface
function main() {
  const args = process.argv.slice(2);
  const fixMode = args.includes('--fix');
  const fileArg = args.find(arg => arg.startsWith('--file='));
  const specificFile = fileArg ? fileArg.split('=')[1] : null;

  const validator = new RLSValidator(fixMode);
  
  let result: ValidationResult;
  
  if (specificFile) {
    result = validator.validateSingleFile(specificFile);
  } else {
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    result = validator.validateDirectory(migrationsDir);
  }

  validator.printReport(result);

  // Exit with error code if there are errors
  if (result.summary.errors > 0 && !fixMode) {
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { RLSValidator, ValidationIssue, ValidationResult };