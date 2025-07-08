#!/usr/bin/env node

/**
 * Formula PM 2.0 - SQL Migration Validator
 * 
 * A comprehensive TypeScript tool to validate SQL migrations before applying them.
 * Detects common issues and provides auto-fix capabilities.
 * 
 * Usage:
 *   npx tsx scripts/validate-migrations.ts [file|directory] [options]
 *   
 * Options:
 *   --fix         Auto-fix common issues where possible
 *   --verbose     Show detailed output
 *   --quiet       Only show errors
 *   --format      Output format: 'text' | 'json' (default: text)
 */

import * as fs from 'fs';
import * as path from 'path';

// Types and interfaces
interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
  line: number;
  column: number;
  context: string;
  fixable: boolean;
  fix?: string;
}

interface ValidationResult {
  filePath: string;
  issues: ValidationIssue[];
  stats: {
    errors: number;
    warnings: number;
    infos: number;
  };
}

interface ValidationOptions {
  fix: boolean;
  verbose: boolean;
  quiet: boolean;
  format: 'text' | 'json';
}

// SQL Validation Rules
class SQLValidator {
  private options: ValidationOptions;
  private sqlContent: string;
  private lines: string[];
  private filePath: string;

  constructor(options: ValidationOptions) {
    this.options = options;
    this.sqlContent = '';
    this.lines = [];
    this.filePath = '';
  }

  /**
   * Validate a single SQL file
   */
  validateFile(filePath: string): ValidationResult {
    this.filePath = filePath;
    this.sqlContent = fs.readFileSync(filePath, 'utf8');
    this.lines = this.sqlContent.split('\n');

    const issues: ValidationIssue[] = [];

    // Apply all validation rules
    issues.push(...this.validateGeneratedColumnSyntax());
    issues.push(...this.validateForeignKeyReferences());
    issues.push(...this.validateSubqueriesInGeneratedColumns());
    issues.push(...this.validateStoredKeywords());
    issues.push(...this.validateCommaPlacement());
    issues.push(...this.validateTableReferences());
    issues.push(...this.validateColumnDefinitions());
    issues.push(...this.validateIndexCreation());
    issues.push(...this.validateConstraintNaming());

    // Calculate stats
    const stats = {
      errors: issues.filter(i => i.type === 'error').length,
      warnings: issues.filter(i => i.type === 'warning').length,
      infos: issues.filter(i => i.type === 'info').length
    };

    return {
      filePath,
      issues,
      stats
    };
  }

  /**
   * Rule 1: Check for generated column syntax errors
   */
  private validateGeneratedColumnSyntax(): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const generatedColumnRegex = /GENERATED\s+ALWAYS\s+AS\s*\((.*?)\)\s*STORED/gi;

    this.lines.forEach((line, lineIndex) => {
      let match;
      while ((match = generatedColumnRegex.exec(line)) !== null) {
        const expression = match[1].trim();
        const column = match.index;

        // Check for common syntax errors in generated columns
        if (expression.toUpperCase().includes('SELECT')) {
          issues.push({
            type: 'error',
            rule: 'generated-column-syntax',
            message: 'Generated columns cannot contain SELECT statements',
            line: lineIndex + 1,
            column: column,
            context: line.trim(),
            fixable: false
          });
        }

        // Check for proper parentheses balance in the expression only
        const openParens = (expression.match(/\(/g) || []).length;
        const closeParens = (expression.match(/\)/g) || []).length;
        if (openParens !== closeParens) {
          issues.push({
            type: 'error',
            rule: 'generated-column-syntax',
            message: 'Unbalanced parentheses in generated column expression',
            line: lineIndex + 1,
            column: column,
            context: line.trim(),
            fixable: false
          });
        }
      }
    });

    return issues;
  }

  /**
   * Rule 2: Validate foreign key references exist
   */
  private validateForeignKeyReferences(): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const foreignKeyRegex = /REFERENCES\s+(\w+)\s*\((\w+)\)/gi;
    const createTableRegex = /CREATE\s+TABLE\s+(\w+)/gi;

    // Extract all table names from CREATE TABLE statements
    const tables = new Set<string>();
    this.lines.forEach(line => {
      let match;
      while ((match = createTableRegex.exec(line)) !== null) {
        tables.add(match[1].toLowerCase());
      }
    });

    // Check foreign key references
    this.lines.forEach((line, lineIndex) => {
      let match;
      while ((match = foreignKeyRegex.exec(line)) !== null) {
        const referencedTable = match[1].toLowerCase();
        const referencedColumn = match[2];

        if (!tables.has(referencedTable) && !this.isSystemTable(referencedTable)) {
          issues.push({
            type: 'error',
            rule: 'foreign-key-reference',
            message: `Referenced table '${referencedTable}' not found in migration`,
            line: lineIndex + 1,
            column: match.index,
            context: line.trim(),
            fixable: false
          });
        }
      }
    });

    return issues;
  }

  /**
   * Rule 3: Detect subqueries in generated columns
   */
  private validateSubqueriesInGeneratedColumns(): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const generatedColumnRegex = /GENERATED\s+ALWAYS\s+AS\s*\((.*?)\)\s*STORED/gi;

    this.lines.forEach((line, lineIndex) => {
      let match;
      while ((match = generatedColumnRegex.exec(line)) !== null) {
        const expression = match[1];
        
        // Check for subqueries (SELECT statements)
        if (expression.toUpperCase().includes('SELECT')) {
          issues.push({
            type: 'error',
            rule: 'subquery-in-generated-column',
            message: 'Subqueries are not allowed in generated columns',
            line: lineIndex + 1,
            column: match.index,
            context: line.trim(),
            fixable: false
          });
        }

        // Check for function calls that might be subqueries
        const functionCallRegex = /\b\w+\s*\(\s*SELECT/gi;
        if (functionCallRegex.test(expression)) {
          issues.push({
            type: 'error',
            rule: 'subquery-in-generated-column',
            message: 'Function calls containing SELECT are not allowed in generated columns',
            line: lineIndex + 1,
            column: match.index,
            context: line.trim(),
            fixable: false
          });
        }
      }
    });

    return issues;
  }

  /**
   * Rule 4: Check for missing STORED keywords
   */
  private validateStoredKeywords(): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const generatedColumnRegex = /GENERATED\s+ALWAYS\s+AS\s*\([^)]+\)(?!\s*STORED)/gi;

    this.lines.forEach((line, lineIndex) => {
      let match;
      while ((match = generatedColumnRegex.exec(line)) !== null) {
        // Check if this is actually a generated column without STORED
        if (!line.toUpperCase().includes('STORED')) {
          issues.push({
            type: 'error',
            rule: 'missing-stored-keyword',
            message: 'Generated column missing STORED keyword',
            line: lineIndex + 1,
            column: match.index,
            context: line.trim(),
            fixable: true,
            fix: line.replace(/(\)\s*),/, '$1 STORED,').replace(/(\)\s*);/, '$1 STORED;')
          });
        }
      }
    });

    return issues;
  }

  /**
   * Rule 5: Validate proper comma placement
   */
  private validateCommaPlacement(): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    this.lines.forEach((line, lineIndex) => {
      // Check for trailing commas before closing parentheses
      if (line.match(/,\s*\)/)) {
        issues.push({
          type: 'error',
          rule: 'comma-placement',
          message: 'Trailing comma before closing parenthesis',
          line: lineIndex + 1,
          column: line.indexOf(','),
          context: line.trim(),
          fixable: true,
          fix: line.replace(/,\s*\)/, ')')
        });
      }

      // Only check for missing commas within CREATE TABLE statements
      if (this.isInCreateTable(lineIndex)) {
        const trimmedLine = line.trim();
        const nextLine = lineIndex < this.lines.length - 1 ? this.lines[lineIndex + 1].trim() : '';
        
        // Check if this looks like a column definition without a trailing comma
        // But skip lines that have comments explaining the field
        if (trimmedLine.match(/^\w+\s+\w+/) && 
            nextLine.match(/^\w+\s+\w+/) &&
            !trimmedLine.endsWith(',') &&
            !trimmedLine.endsWith('(') &&
            !trimmedLine.includes('CREATE') &&
            !trimmedLine.includes('CONSTRAINT') &&
            !nextLine.includes(');') &&
            !trimmedLine.includes('--')) {
          issues.push({
            type: 'warning',
            rule: 'comma-placement',
            message: 'Possible missing comma between column definitions',
            line: lineIndex + 1,
            column: line.length,
            context: line.trim(),
            fixable: true,
            fix: line.endsWith(' ') ? line.slice(0, -1) + ',' : line + ','
          });
        }
      }
    });

    return issues;
  }

  /**
   * Rule 6: Validate table references
   */
  private validateTableReferences(): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const tableRefRegex = /(?:FROM|JOIN|UPDATE|DELETE\s+FROM|INSERT\s+INTO)\s+(\w+\.\w+|\w+)/gi;
    const createTableRegex = /CREATE\s+TABLE\s+(\w+)/gi;

    // Extract all table names
    const tables = new Set<string>();
    this.lines.forEach(line => {
      let match;
      while ((match = createTableRegex.exec(line)) !== null) {
        tables.add(match[1].toLowerCase());
      }
    });

    // Check table references in actual SQL statements (not comments)
    this.lines.forEach((line, lineIndex) => {
      // Skip comments and certain SQL constructs
      if (line.trim().startsWith('--') || 
          line.includes('BEFORE UPDATE ON') || 
          line.includes('AFTER UPDATE ON') ||
          line.includes('BEFORE INSERT ON') ||
          line.includes('AFTER INSERT ON') ||
          line.includes('BEFORE DELETE ON') ||
          line.includes('AFTER DELETE ON')) {
        return;
      }
      
      let match;
      while ((match = tableRefRegex.exec(line)) !== null) {
        const referencedTable = match[1].toLowerCase();
        
        // Handle schema.table format
        const tableName = referencedTable.includes('.') ? referencedTable.split('.')[1] : referencedTable;
        
        if (!tables.has(tableName) && !this.isSystemTable(referencedTable)) {
          issues.push({
            type: 'warning',
            rule: 'table-reference',
            message: `Referenced table '${referencedTable}' not found in migration`,
            line: lineIndex + 1,
            column: match.index,
            context: line.trim(),
            fixable: false
          });
        }
      }
    });

    return issues;
  }

  /**
   * Rule 7: Validate column definitions
   */
  private validateColumnDefinitions(): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    this.lines.forEach((line, lineIndex) => {
      // Only check actual column definitions within CREATE TABLE statements
      if (!this.isInCreateTable(lineIndex) || line.trim().startsWith('--') || line.includes('CREATE TABLE')) {
        return;
      }

      // Check for column definitions without proper data types
      const columnDefRegex = /^\s*(\w+)\s+(\w+)/;
      const match = columnDefRegex.exec(line);
      
      if (match) {
        const columnName = match[1];
        const dataType = match[2].toLowerCase();

        // Skip constraint definitions and other non-column lines
        if (columnName.toLowerCase() === 'constraint' || 
            columnName.toLowerCase() === 'unique' ||
            columnName.toLowerCase() === 'primary' ||
            columnName.toLowerCase() === 'foreign') {
          return;
        }

        // Check for invalid data types (including custom types)
        const validTypes = ['text', 'integer', 'boolean', 'date', 'timestamp', 'timestamptz', 'uuid', 'decimal', 'numeric', 'varchar', 'char', 'jsonb', 'json', 'bigint', 'smallint'];
        const customTypes = ['user_role', 'project_status', 'scope_category', 'scope_status', 'document_type', 'document_status', 'milestone_status', 'milestone_type'];
        
        if (!validTypes.includes(dataType) && !customTypes.includes(dataType) && !dataType.includes('(')) {
          issues.push({
            type: 'warning',
            rule: 'column-definition',
            message: `Unusual data type '${dataType}' for column '${columnName}'`,
            line: lineIndex + 1,
            column: match.index,
            context: line.trim(),
            fixable: false
          });
        }

        // Check for missing constraints on important columns
        if (columnName.toLowerCase().includes('id') && !line.includes('PRIMARY KEY') && !line.includes('REFERENCES')) {
          issues.push({
            type: 'info',
            rule: 'column-definition',
            message: `ID column '${columnName}' might need PRIMARY KEY or REFERENCES constraint`,
            line: lineIndex + 1,
            column: match.index,
            context: line.trim(),
            fixable: false
          });
        }
      }
    });

    return issues;
  }

  /**
   * Rule 8: Validate index creation
   */
  private validateIndexCreation(): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const indexRegex = /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(\w+)\s+ON\s+(\w+)/gi;

    this.lines.forEach((line, lineIndex) => {
      let match: RegExpExecArray | null;
      while ((match = indexRegex.exec(line)) !== null) {
        const indexName = match[1];
        const tableName = match[2];

        // Check for proper index naming convention
        if (!indexName.toLowerCase().startsWith('idx_')) {
          issues.push({
            type: 'warning',
            rule: 'index-creation',
            message: `Index name '${indexName}' should start with 'idx_' prefix`,
            line: lineIndex + 1,
            column: match.index,
            context: line.trim(),
            fixable: true,
            fix: line.replace(indexName, `idx_${indexName}`)
          });
        }

        // Check for potential duplicate indexes
        const duplicatePattern = new RegExp(`CREATE\\s+(?:UNIQUE\\s+)?INDEX\\s+\\w+\\s+ON\\s+${tableName}\\s*\\(([^)]+)\\)`, 'gi');
        const currentColumns = line.match(/\(([^)]+)\)/)?.[1];
        
        if (currentColumns) {
          this.lines.forEach((otherLine, otherIndex) => {
            if (otherIndex !== lineIndex && duplicatePattern.test(otherLine)) {
              const otherColumns = otherLine.match(/\(([^)]+)\)/)?.[1];
              if (otherColumns && otherColumns === currentColumns) {
                issues.push({
                  type: 'warning',
                  rule: 'index-creation',
                  message: `Potential duplicate index on ${tableName}(${currentColumns})`,
                  line: lineIndex + 1,
                  column: match?.index || 0,
                  context: line.trim(),
                  fixable: false
                });
              }
            }
          });
        }
      }
    });

    return issues;
  }

  /**
   * Rule 9: Validate constraint naming
   */
  private validateConstraintNaming(): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const constraintRegex = /CONSTRAINT\s+(\w+)/gi;

    this.lines.forEach((line, lineIndex) => {
      let match;
      while ((match = constraintRegex.exec(line)) !== null) {
        const constraintName = match[1];

        // Check for proper constraint naming convention
        const hasProperPrefix = constraintName.toLowerCase().match(/^(pk_|fk_|uk_|ck_|chk_)/);
        if (!hasProperPrefix) {
          issues.push({
            type: 'warning',
            rule: 'constraint-naming',
            message: `Constraint name '${constraintName}' should have proper prefix (pk_, fk_, uk_, ck_, chk_)`,
            line: lineIndex + 1,
            column: match.index,
            context: line.trim(),
            fixable: false
          });
        }

        // Check for overly long constraint names
        if (constraintName.length > 63) {
          issues.push({
            type: 'error',
            rule: 'constraint-naming',
            message: `Constraint name '${constraintName}' exceeds PostgreSQL 63 character limit`,
            line: lineIndex + 1,
            column: match.index,
            context: line.trim(),
            fixable: false
          });
        }
      }
    });

    return issues;
  }

  /**
   * Helper method to check if a table is a system table or a known table from other migrations
   */
  private isSystemTable(tableName: string): boolean {
    const systemTables = ['auth.users', 'public.migrations', 'information_schema', 'pg_catalog', 'migrations'];
    const systemPrefixes = ['auth.', 'public.', 'information_schema.', 'pg_'];
    
    // Common Formula PM tables that may be referenced across migrations
    const formulaPmTables = [
      'user_profiles', 'clients', 'suppliers', 'projects', 'project_assignments',
      'scope_items', 'scope_dependencies', 'documents', 'document_approvals',
      'vendors', 'purchase_requests', 'purchase_orders', 'vendor_ratings',
      'approval_workflows', 'delivery_confirmations', 'client_companies',
      'client_users', 'client_project_access', 'client_permissions',
      'client_document_access', 'client_document_approvals',
      'client_document_comments', 'client_notifications', 'client_activity_log',
      'client_communication_threads', 'client_messages',
      'subcontractor_users', 'subcontractor_project_assignments',
      'subcontractor_permissions', 'subcontractor_tasks',
      'subcontractor_daily_reports', 'subcontractor_photos',
      'subcontractor_notifications', 'subcontractor_activity_log',
      'field_reports', 'notifications', 'milestone_templates', 'milestones'
    ];
    
    return systemTables.some(table => tableName.toLowerCase().includes(table.toLowerCase())) ||
           systemPrefixes.some(prefix => tableName.toLowerCase().startsWith(prefix)) ||
           formulaPmTables.includes(tableName.toLowerCase());
  }

  /**
   * Helper method to check if a line is within a CREATE TABLE statement
   */
  private isInCreateTable(lineIndex: number): boolean {
    // Look backwards for CREATE TABLE
    for (let i = lineIndex; i >= 0; i--) {
      const line = this.lines[i].trim().toUpperCase();
      if (line.includes('CREATE TABLE')) {
        // Look forwards for the closing parenthesis
        for (let j = i; j < this.lines.length; j++) {
          if (this.lines[j].includes(');')) {
            return j >= lineIndex;
          }
        }
      }
    }
    return false;
  }

  /**
   * Apply fixes to the SQL file
   */
  applyFixes(result: ValidationResult): string {
    let fixedContent = this.sqlContent;
    const fixableIssues = result.issues.filter(issue => issue.fixable && issue.fix);

    // Apply fixes in reverse order to maintain line numbers
    fixableIssues.reverse().forEach(issue => {
      const lines = fixedContent.split('\n');
      if (issue.line <= lines.length) {
        lines[issue.line - 1] = issue.fix!;
        fixedContent = lines.join('\n');
      }
    });

    return fixedContent;
  }
}

// CLI Implementation
class MigrationValidatorCLI {
  private validator: SQLValidator;
  private options: ValidationOptions;

  constructor() {
    this.options = {
      fix: false,
      verbose: false,
      quiet: false,
      format: 'text'
    };
    this.validator = new SQLValidator(this.options);
  }

  /**
   * Parse command line arguments
   */
  parseArgs(args: string[]): { files: string[], options: ValidationOptions } {
    const files: string[] = [];
    const options = { ...this.options };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg === '--fix') {
        options.fix = true;
      } else if (arg === '--verbose') {
        options.verbose = true;
      } else if (arg === '--quiet') {
        options.quiet = true;
      } else if (arg === '--format') {
        const format = args[++i];
        if (format === 'json' || format === 'text') {
          options.format = format;
        }
      } else if (arg === '--help' || arg === '-h') {
        this.showHelp();
        process.exit(0);
      } else if (!arg.startsWith('--')) {
        files.push(arg);
      }
    }

    return { files, options };
  }

  /**
   * Show help message
   */
  showHelp(): void {
    console.log(`
Formula PM 2.0 - SQL Migration Validator

Usage: npx tsx scripts/validate-migrations.ts [file|directory] [options]

Options:
  --fix         Auto-fix common issues where possible
  --verbose     Show detailed output
  --quiet       Only show errors
  --format      Output format: 'text' | 'json' (default: text)
  --help, -h    Show this help message

Examples:
  npx tsx scripts/validate-migrations.ts supabase/migrations/
  npx tsx scripts/validate-migrations.ts migration.sql --fix
  npx tsx scripts/validate-migrations.ts supabase/migrations/ --format json
    `);
  }

  /**
   * Get SQL files from path
   */
  getSqlFiles(filePath: string): string[] {
    const files: string[] = [];
    
    if (fs.statSync(filePath).isDirectory()) {
      const dirFiles = fs.readdirSync(filePath);
      dirFiles.forEach(file => {
        if (file.endsWith('.sql')) {
          files.push(path.join(filePath, file));
        }
      });
    } else if (filePath.endsWith('.sql')) {
      files.push(filePath);
    }

    return files;
  }

  /**
   * Format validation results
   */
  formatResults(results: ValidationResult[]): string {
    if (this.options.format === 'json') {
      return JSON.stringify(results, null, 2);
    }

    let output = '';
    let totalIssues = 0;
    let totalErrors = 0;
    let totalWarnings = 0;

    results.forEach(result => {
      if (result.issues.length === 0) {
        if (this.options.verbose) {
          output += `✅ ${result.filePath}: No issues found\n`;
        }
        return;
      }

      output += `\n📁 ${result.filePath}\n`;
      output += `${'='.repeat(result.filePath.length + 2)}\n`;

      result.issues.forEach(issue => {
        const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
        const fixable = issue.fixable ? ' [FIXABLE]' : '';
        
        if (!this.options.quiet || issue.type === 'error') {
          output += `${icon} Line ${issue.line}:${issue.column} - ${issue.message}${fixable}\n`;
          output += `   Rule: ${issue.rule}\n`;
          output += `   Context: ${issue.context}\n`;
          
          if (issue.fix && this.options.verbose) {
            output += `   Fix: ${issue.fix}\n`;
          }
          output += '\n';
        }
      });

      totalIssues += result.issues.length;
      totalErrors += result.stats.errors;
      totalWarnings += result.stats.warnings;
    });

    // Summary
    output += `\n📊 SUMMARY\n`;
    output += `${'='.repeat(10)}\n`;
    output += `Files processed: ${results.length}\n`;
    output += `Total issues: ${totalIssues}\n`;
    output += `Errors: ${totalErrors}\n`;
    output += `Warnings: ${totalWarnings}\n`;

    if (totalErrors > 0) {
      output += `\n❌ Validation failed with ${totalErrors} error(s)\n`;
    } else if (totalWarnings > 0) {
      output += `\n⚠️ Validation completed with ${totalWarnings} warning(s)\n`;
    } else {
      output += `\n✅ All migrations validated successfully!\n`;
    }

    return output;
  }

  /**
   * Run the validator
   */
  async run(args: string[]): Promise<void> {
    const { files, options } = this.parseArgs(args);
    this.options = options;
    this.validator = new SQLValidator(options);

    if (files.length === 0) {
      console.error('❌ No files specified. Use --help for usage information.');
      process.exit(1);
    }

    const results: ValidationResult[] = [];
    let hasErrors = false;

    for (const filePath of files) {
      try {
        const sqlFiles = this.getSqlFiles(filePath);
        
        for (const sqlFile of sqlFiles) {
          const result = this.validator.validateFile(sqlFile);
          results.push(result);

          if (result.stats.errors > 0) {
            hasErrors = true;
          }

          // Apply fixes if requested
          if (options.fix) {
            const fixedContent = this.validator.applyFixes(result);
            const fixableIssues = result.issues.filter(issue => issue.fixable);
            
            if (fixableIssues.length > 0) {
              fs.writeFileSync(sqlFile, fixedContent);
              console.log(`🔧 Fixed ${fixableIssues.length} issue(s) in ${sqlFile}`);
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error processing ${filePath}: ${error}`);
        hasErrors = true;
      }
    }

    // Output results
    const output = this.formatResults(results);
    console.log(output);

    // Exit with error code if there were errors
    if (hasErrors) {
      process.exit(1);
    }
  }
}

// Main execution
if (require.main === module) {
  const cli = new MigrationValidatorCLI();
  cli.run(process.argv.slice(2)).catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
}

export { SQLValidator, MigrationValidatorCLI };
export type { ValidationResult, ValidationIssue, ValidationOptions };