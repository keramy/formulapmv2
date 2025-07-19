#!/usr/bin/env node

/**
 * RLS Pattern Transformation Engine
 * 
 * This script implements the pattern transformation engine for RLS optimization.
 * It transforms direct auth.uid() and auth.jwt() calls to optimized subquery patterns.
 * 
 * Requirements: 1.1, 1.2, 1.5, 2.1, 2.3
 */

const fs = require('fs');
const path = require('path');

class PatternTransformationEngine {
  constructor() {
    this.transformationLog = [];
    this.results = {
      timestamp: new Date().toISOString(),
      transformations: [],
      statistics: {
        total_processed: 0,
        successful_transformations: 0,
        failed_transformations: 0,
        patterns_found: {
          direct_uid_calls: 0,
          direct_jwt_calls: 0,
          already_optimized: 0
        }
      }
    };
  }

  /**
   * Core transformation function for auth.uid() patterns
   * Transforms direct auth.uid() calls to (SELECT auth.uid()) subqueries
   * 
   * @param {string} sqlExpression - The SQL expression to transform
   * @returns {object} - Transformation result with original, transformed, and metadata
   */
  transformAuthUidPattern(sqlExpression) {
    if (!sqlExpression || typeof sqlExpression !== 'string') {
      return {
        success: false,
        original: sqlExpression,
        transformed: sqlExpression,
        changes_made: false,
        error: 'Invalid input: SQL expression must be a non-empty string'
      };
    }

    try {
      let transformed = sqlExpression;
      let changesMade = false;
      const transformations = [];

      // Pattern to match auth.uid() that is NOT already wrapped in SELECT
      // This regex looks for auth.uid() that is not preceded by "SELECT " (case insensitive)
      const directUidPattern = /(?<!SELECT\s+)auth\.uid\(\)/gi;
      
      // Find all matches first for logging
      const matches = [...sqlExpression.matchAll(directUidPattern)];
      
      if (matches.length > 0) {
        // Replace direct auth.uid() calls with (SELECT auth.uid())
        transformed = sqlExpression.replace(directUidPattern, '(SELECT auth.uid())');
        changesMade = true;
        
        transformations.push({
          pattern: 'direct_uid_calls',
          count: matches.length,
          positions: matches.map(match => match.index)
        });

        this.results.statistics.patterns_found.direct_uid_calls += matches.length;
      }

      // Check if there were already optimized patterns
      const optimizedUidPattern = /\(SELECT\s+auth\.uid\(\)\)/gi;
      const optimizedMatches = [...sqlExpression.matchAll(optimizedUidPattern)];
      
      if (optimizedMatches.length > 0) {
        transformations.push({
          pattern: 'already_optimized_uid',
          count: optimizedMatches.length,
          positions: optimizedMatches.map(match => match.index)
        });

        this.results.statistics.patterns_found.already_optimized += optimizedMatches.length;
      }

      return {
        success: true,
        original: sqlExpression,
        transformed: transformed,
        changes_made: changesMade,
        transformations: transformations,
        pattern_type: 'auth_uid'
      };

    } catch (error) {
      return {
        success: false,
        original: sqlExpression,
        transformed: sqlExpression,
        changes_made: false,
        error: `Transformation failed: ${error.message}`,
        pattern_type: 'auth_uid'
      };
    }
  }

  /**
   * Core transformation function for auth.jwt() patterns
   * Transforms direct auth.jwt() calls to (SELECT auth.jwt()) subqueries
   * 
   * @param {string} sqlExpression - The SQL expression to transform
   * @returns {object} - Transformation result with original, transformed, and metadata
   */
  transformAuthJwtPattern(sqlExpression) {
    if (!sqlExpression || typeof sqlExpression !== 'string') {
      return {
        success: false,
        original: sqlExpression,
        transformed: sqlExpression,
        changes_made: false,
        error: 'Invalid input: SQL expression must be a non-empty string'
      };
    }

    try {
      let transformed = sqlExpression;
      let changesMade = false;
      const transformations = [];

      // Pattern to match auth.jwt() that is NOT already wrapped in SELECT
      const directJwtPattern = /(?<!SELECT\s+)auth\.jwt\(\)/gi;
      
      // Find all matches first for logging
      const matches = [...sqlExpression.matchAll(directJwtPattern)];
      
      if (matches.length > 0) {
        // Replace direct auth.jwt() calls with (SELECT auth.jwt())
        transformed = sqlExpression.replace(directJwtPattern, '(SELECT auth.jwt())');
        changesMade = true;
        
        transformations.push({
          pattern: 'direct_jwt_calls',
          count: matches.length,
          positions: matches.map(match => match.index)
        });

        this.results.statistics.patterns_found.direct_jwt_calls += matches.length;
      }

      // Check if there were already optimized patterns
      const optimizedJwtPattern = /\(SELECT\s+auth\.jwt\(\)\)/gi;
      const optimizedMatches = [...sqlExpression.matchAll(optimizedJwtPattern)];
      
      if (optimizedMatches.length > 0) {
        transformations.push({
          pattern: 'already_optimized_jwt',
          count: optimizedMatches.length,
          positions: optimizedMatches.map(match => match.index)
        });

        this.results.statistics.patterns_found.already_optimized += optimizedMatches.length;
      }

      return {
        success: true,
        original: sqlExpression,
        transformed: transformed,
        changes_made: changesMade,
        transformations: transformations,
        pattern_type: 'auth_jwt'
      };

    } catch (error) {
      return {
        success: false,
        original: sqlExpression,
        transformed: sqlExpression,
        changes_made: false,
        error: `Transformation failed: ${error.message}`,
        pattern_type: 'auth_jwt'
      };
    }
  }

  /**
   * Comprehensive transformation function that handles both auth.uid() and auth.jwt() patterns
   * Preserves logical operators and handles complex nested conditions
   * 
   * @param {string} sqlExpression - The SQL expression to transform
   * @returns {object} - Comprehensive transformation result
   */
  transformAuthPatterns(sqlExpression) {
    if (!sqlExpression || typeof sqlExpression !== 'string') {
      return {
        success: false,
        original: sqlExpression,
        transformed: sqlExpression,
        changes_made: false,
        error: 'Invalid input: SQL expression must be a non-empty string',
        transformations: []
      };
    }

    try {
      let currentExpression = sqlExpression;
      let totalChangesMade = false;
      const allTransformations = [];

      // First, transform auth.uid() patterns
      const uidResult = this.transformAuthUidPattern(currentExpression);
      if (uidResult.success) {
        currentExpression = uidResult.transformed;
        if (uidResult.changes_made) {
          totalChangesMade = true;
          allTransformations.push(...uidResult.transformations);
        }
      } else {
        return {
          success: false,
          original: sqlExpression,
          transformed: sqlExpression,
          changes_made: false,
          error: `UID transformation failed: ${uidResult.error}`,
          transformations: []
        };
      }

      // Then, transform auth.jwt() patterns
      const jwtResult = this.transformAuthJwtPattern(currentExpression);
      if (jwtResult.success) {
        currentExpression = jwtResult.transformed;
        if (jwtResult.changes_made) {
          totalChangesMade = true;
          allTransformations.push(...jwtResult.transformations);
        }
      } else {
        return {
          success: false,
          original: sqlExpression,
          transformed: currentExpression,
          changes_made: totalChangesMade,
          error: `JWT transformation failed: ${jwtResult.error}`,
          transformations: allTransformations
        };
      }

      // Validate the transformation preserves logical structure
      const validationResult = this.validateTransformation(sqlExpression, currentExpression);
      
      return {
        success: true,
        original: sqlExpression,
        transformed: currentExpression,
        changes_made: totalChangesMade,
        transformations: allTransformations,
        validation: validationResult,
        pattern_type: 'comprehensive'
      };

    } catch (error) {
      return {
        success: false,
        original: sqlExpression,
        transformed: sqlExpression,
        changes_made: false,
        error: `Comprehensive transformation failed: ${error.message}`,
        transformations: []
      };
    }
  }

  /**
   * Validates that the transformation preserves logical structure
   * Checks for balanced parentheses and preserved operators
   * 
   * @param {string} original - Original SQL expression
   * @param {string} transformed - Transformed SQL expression
   * @returns {object} - Validation result
   */
  validateTransformation(original, transformed) {
    const validation = {
      valid: true,
      issues: [],
      checks: {
        parentheses_balanced: false,
        logical_operators_preserved: false,
        no_syntax_errors: false
      }
    };

    try {
      // Check parentheses balance
      const originalOpenParens = (original.match(/\(/g) || []).length;
      const originalCloseParens = (original.match(/\)/g) || []).length;
      const transformedOpenParens = (transformed.match(/\(/g) || []).length;
      const transformedCloseParens = (transformed.match(/\)/g) || []).length;
      
      // Calculate expected increase in parentheses from transformations
      // Count how many new SELECT wrappers were added (not existing ones)
      const originalSelectWrapped = (original.match(/\(SELECT auth\.(uid|jwt)\(\)\)/g) || []).length;
      const transformedSelectWrapped = (transformed.match(/\(SELECT auth\.(uid|jwt)\(\)\)/g) || []).length;
      const newSelectWrapped = transformedSelectWrapped - originalSelectWrapped;
      
      const expectedOpenIncrease = newSelectWrapped * 1; // Each new transformation adds 1 opening paren
      const expectedCloseIncrease = newSelectWrapped * 1; // Each new transformation adds 1 closing paren
      
      const expectedOpenParens = originalOpenParens + expectedOpenIncrease;
      const expectedCloseParens = originalCloseParens + expectedCloseIncrease;
      
      validation.checks.parentheses_balanced = 
        (transformedOpenParens === expectedOpenParens) && 
        (transformedCloseParens === expectedCloseParens) &&
        (transformedOpenParens === transformedCloseParens); // Overall balance

      if (!validation.checks.parentheses_balanced) {
        validation.issues.push(`Parentheses balance issue: expected ${expectedOpenParens}/${expectedCloseParens}, got ${transformedOpenParens}/${transformedCloseParens}`);
        validation.valid = false;
      }

      // Check that logical operators are preserved
      const logicalOperators = ['AND', 'OR', 'NOT', '=', '!=', '<>', '<', '>', '<=', '>=', 'IN', 'LIKE'];
      const originalOperators = logicalOperators.filter(op => 
        original.toUpperCase().includes(op.toUpperCase())
      );
      const transformedOperators = logicalOperators.filter(op => 
        transformed.toUpperCase().includes(op.toUpperCase())
      );

      validation.checks.logical_operators_preserved = 
        originalOperators.length === transformedOperators.length &&
        originalOperators.every(op => transformedOperators.includes(op));

      if (!validation.checks.logical_operators_preserved) {
        validation.issues.push('Logical operators may have been altered');
        validation.valid = false;
      }

      // Basic syntax check - no obvious syntax errors introduced
      const suspiciousPatterns = [
        /SELECT\s+SELECT/g, // Double SELECT
        /auth\.\w+\(\)\s+auth\./g // Adjacent auth calls without operators
      ];

      const syntaxIssues = suspiciousPatterns.filter(pattern => 
        pattern.test(transformed)
      );

      // Check for problematic excessive closing parentheses (5 or more in a row)
      // Allow up to 4 closing parentheses as they can be legitimate in nested SQL
      const excessiveClosePattern = /\)\)\)\)\)/g;
      const excessiveCloseMatches = [...transformed.matchAll(excessiveClosePattern)];
      
      // Only flag truly excessive closing parentheses (5 or more in a row)
      const problematicExcessiveClose = excessiveCloseMatches;

      // Special check for problematic double parentheses patterns
      // Allow ((SELECT auth.jwt()) ->> 'role') but flag other double SELECT patterns
      const doubleSelectPattern = /\(\(SELECT auth\.(uid|jwt)\(\)\)/g;
      const doubleSelectMatches = [...transformed.matchAll(doubleSelectPattern)];
      
      // Only flag as syntax error if double SELECT is not followed by JSON operators
      const problematicDoubleSelect = doubleSelectMatches.filter(match => {
        const afterMatch = transformed.substring(match.index + match[0].length, match.index + match[0].length + 10);
        return !afterMatch.match(/^\s*->>|^\s*->|^\s*\)/); // Not followed by JSON operators or closing paren
      });

      validation.checks.no_syntax_errors = 
        syntaxIssues.length === 0 && 
        problematicDoubleSelect.length === 0 && 
        problematicExcessiveClose.length === 0;

      if (!validation.checks.no_syntax_errors) {
        const issues = [];
        if (syntaxIssues.length > 0) issues.push('suspicious patterns detected');
        if (problematicDoubleSelect.length > 0) issues.push('problematic double SELECT patterns');
        if (problematicExcessiveClose.length > 0) issues.push('excessive closing parentheses (4+)');
        validation.issues.push(`Potential syntax issues: ${issues.join(', ')}`);
        validation.valid = false;
      }

    } catch (error) {
      validation.valid = false;
      validation.issues.push(`Validation error: ${error.message}`);
    }

    return validation;
  }

  /**
   * Process a policy definition and transform its qual and with_check clauses
   * 
   * @param {object} policy - Policy object with qual and with_check properties
   * @returns {object} - Processed policy with transformation results
   */
  transformPolicyDefinition(policy) {
    if (!policy || typeof policy !== 'object') {
      return {
        success: false,
        error: 'Invalid policy object',
        original: policy,
        transformed: policy
      };
    }

    const result = {
      success: true,
      original: { ...policy },
      transformed: { ...policy },
      changes_made: false,
      transformations: {
        qual: null,
        with_check: null
      }
    };

    try {
      // Transform qual clause if it exists
      if (policy.qual && typeof policy.qual === 'string') {
        const qualResult = this.transformAuthPatterns(policy.qual);
        result.transformations.qual = qualResult;
        
        if (qualResult.success && qualResult.changes_made) {
          result.transformed.qual = qualResult.transformed;
          result.changes_made = true;
        }
      }

      // Transform with_check clause if it exists
      if (policy.with_check && typeof policy.with_check === 'string') {
        const withCheckResult = this.transformAuthPatterns(policy.with_check);
        result.transformations.with_check = withCheckResult;
        
        if (withCheckResult.success && withCheckResult.changes_made) {
          result.transformed.with_check = withCheckResult.transformed;
          result.changes_made = true;
        }
      }

      // Update statistics
      this.results.statistics.total_processed++;
      if (result.changes_made) {
        this.results.statistics.successful_transformations++;
      }

      return result;

    } catch (error) {
      this.results.statistics.failed_transformations++;
      return {
        success: false,
        error: `Policy transformation failed: ${error.message}`,
        original: policy,
        transformed: policy,
        changes_made: false
      };
    }
  }

  /**
   * Batch process multiple policies
   * 
   * @param {array} policies - Array of policy objects
   * @returns {object} - Batch processing results
   */
  batchTransformPolicies(policies) {
    if (!Array.isArray(policies)) {
      return {
        success: false,
        error: 'Input must be an array of policies',
        results: []
      };
    }

    const batchResults = {
      success: true,
      total_policies: policies.length,
      processed: 0,
      successful: 0,
      failed: 0,
      policies_with_changes: 0,
      results: []
    };

    for (const policy of policies) {
      const result = this.transformPolicyDefinition(policy);
      batchResults.results.push(result);
      batchResults.processed++;

      if (result.success) {
        batchResults.successful++;
        if (result.changes_made) {
          batchResults.policies_with_changes++;
        }
      } else {
        batchResults.failed++;
      }
    }

    return batchResults;
  }

  /**
   * Generate SQL DROP POLICY statement
   * 
   * @param {object} policy - Policy object with tablename and policyname
   * @returns {string} - SQL DROP POLICY statement
   */
  generateDropPolicySQL(policy) {
    if (!policy || !policy.tablename || !policy.policyname) {
      throw new Error('Policy must have tablename and policyname properties');
    }

    // Escape identifiers to prevent SQL injection
    const tableName = policy.tablename.replace(/[^a-zA-Z0-9_]/g, '');
    const policyName = policy.policyname.replace(/[^a-zA-Z0-9_]/g, '');

    return `DROP POLICY IF EXISTS "${policyName}" ON "${tableName}";`;
  }

  /**
   * Generate SQL CREATE POLICY statement with optimized patterns
   * 
   * @param {object} policy - Policy object with all necessary properties
   * @param {object} transformedPolicy - Policy object with optimized qual and with_check
   * @returns {string} - SQL CREATE POLICY statement
   */
  generateCreatePolicySQL(policy, transformedPolicy = null) {
    if (!policy || !policy.tablename || !policy.policyname) {
      throw new Error('Policy must have tablename and policyname properties');
    }

    const policyToUse = transformedPolicy || policy;
    
    // Escape identifiers
    const tableName = policy.tablename.replace(/[^a-zA-Z0-9_]/g, '');
    const policyName = policy.policyname.replace(/[^a-zA-Z0-9_]/g, '');
    
    // Build CREATE POLICY statement
    let sql = `CREATE POLICY "${policyName}" ON "${tableName}"`;
    
    // Add AS clause (permissive/restrictive)
    if (policy.permissive !== undefined) {
      sql += policy.permissive === 'PERMISSIVE' || policy.permissive === true ? 
        ' AS PERMISSIVE' : ' AS RESTRICTIVE';
    }
    
    // Add FOR clause (command type)
    if (policy.cmd) {
      const command = policy.cmd.toUpperCase();
      if (['ALL', 'SELECT', 'INSERT', 'UPDATE', 'DELETE'].includes(command)) {
        sql += ` FOR ${command}`;
      }
    }
    
    // Add TO clause (roles)
    if (policy.roles && Array.isArray(policy.roles) && policy.roles.length > 0) {
      const rolesList = policy.roles.map(role => `"${role.replace(/[^a-zA-Z0-9_]/g, '')}"`).join(', ');
      sql += ` TO ${rolesList}`;
    } else if (policy.roles && typeof policy.roles === 'string') {
      sql += ` TO "${policy.roles.replace(/[^a-zA-Z0-9_]/g, '')}"`;
    }
    
    // Add USING clause (qual)
    if (policyToUse.qual && policyToUse.qual.trim()) {
      sql += ` USING (${policyToUse.qual})`;
    }
    
    // Add WITH CHECK clause
    if (policyToUse.with_check && policyToUse.with_check.trim()) {
      sql += ` WITH CHECK (${policyToUse.with_check})`;
    }
    
    sql += ';';
    
    return sql;
  }

  /**
   * Generate complete policy replacement SQL (DROP + CREATE in transaction)
   * 
   * @param {object} policy - Original policy object
   * @param {object} transformedPolicy - Policy object with optimized patterns
   * @returns {object} - SQL statements and transaction wrapper
   */
  generatePolicyReplacementSQL(policy, transformedPolicy) {
    if (!policy || !transformedPolicy) {
      throw new Error('Both original and transformed policy objects are required');
    }

    try {
      const dropSQL = this.generateDropPolicySQL(policy);
      const createSQL = this.generateCreatePolicySQL(policy, transformedPolicy);
      
      const transactionSQL = `-- Policy optimization for ${policy.tablename}.${policy.policyname}
BEGIN;

-- Drop existing policy
${dropSQL}

-- Create optimized policy
${createSQL}

COMMIT;`;

      const rollbackSQL = `-- Rollback for ${policy.tablename}.${policy.policyname}
BEGIN;

-- Drop optimized policy
${this.generateDropPolicySQL(transformedPolicy)}

-- Restore original policy
${this.generateCreatePolicySQL(policy)}

COMMIT;`;

      return {
        success: true,
        policy_name: policy.policyname,
        table_name: policy.tablename,
        drop_sql: dropSQL,
        create_sql: createSQL,
        transaction_sql: transactionSQL,
        rollback_sql: rollbackSQL
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to generate policy replacement SQL: ${error.message}`,
        policy_name: policy.policyname || 'unknown',
        table_name: policy.tablename || 'unknown'
      };
    }
  }

  /**
   * Generate batch policy replacement SQL for multiple policies
   * 
   * @param {array} policyTransformations - Array of transformation results
   * @returns {object} - Batch SQL generation results
   */
  generateBatchPolicyReplacementSQL(policyTransformations) {
    if (!Array.isArray(policyTransformations)) {
      return {
        success: false,
        error: 'Input must be an array of policy transformation results'
      };
    }

    const results = {
      success: true,
      total_policies: policyTransformations.length,
      successful_generations: 0,
      failed_generations: 0,
      sql_statements: [],
      rollback_statements: [],
      batch_transaction_sql: '',
      batch_rollback_sql: ''
    };

    const batchTransactionParts = ['-- Batch Policy Optimization Transaction', 'BEGIN;', ''];
    const batchRollbackParts = ['-- Batch Policy Optimization Rollback', 'BEGIN;', ''];

    for (const transformation of policyTransformations) {
      if (!transformation.success || !transformation.changes_made) {
        continue; // Skip failed transformations or those with no changes
      }

      try {
        const sqlResult = this.generatePolicyReplacementSQL(
          transformation.original,
          transformation.transformed
        );

        if (sqlResult.success) {
          results.sql_statements.push(sqlResult);
          results.successful_generations++;

          // Add to batch transaction
          batchTransactionParts.push(`-- ${sqlResult.table_name}.${sqlResult.policy_name}`);
          batchTransactionParts.push(sqlResult.drop_sql);
          batchTransactionParts.push(sqlResult.create_sql);
          batchTransactionParts.push('');

          // Add to batch rollback
          batchRollbackParts.push(`-- Rollback ${sqlResult.table_name}.${sqlResult.policy_name}`);
          batchRollbackParts.push(this.generateDropPolicySQL(transformation.transformed));
          batchRollbackParts.push(this.generateCreatePolicySQL(transformation.original));
          batchRollbackParts.push('');

        } else {
          results.failed_generations++;
        }

      } catch (error) {
        results.failed_generations++;
        console.error(`Failed to generate SQL for policy: ${error.message}`);
      }
    }

    batchTransactionParts.push('COMMIT;');
    batchRollbackParts.push('COMMIT;');

    results.batch_transaction_sql = batchTransactionParts.join('\n');
    results.batch_rollback_sql = batchRollbackParts.join('\n');

    return results;
  }

  /**
   * Generate transformation report
   */
  generateTransformationReport() {
    return {
      title: 'RLS Pattern Transformation Report',
      generated_at: this.results.timestamp,
      summary: {
        total_processed: this.results.statistics.total_processed,
        successful_transformations: this.results.statistics.successful_transformations,
        failed_transformations: this.results.statistics.failed_transformations,
        success_rate: this.results.statistics.total_processed > 0 ? 
          Math.round((this.results.statistics.successful_transformations / this.results.statistics.total_processed) * 100) : 0
      },
      patterns_found: this.results.statistics.patterns_found,
      transformations: this.results.transformations
    };
  }

  /**
   * Save transformation results to file
   */
  async saveResults(filename = null) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportDir = 'analysis-reports';
    
    // Ensure directory exists
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportPath = path.join(reportDir, filename || `pattern-transformation-${timestamp}.json`);
    const report = this.generateTransformationReport();
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`💾 Transformation results saved to: ${reportPath}`);
    return reportPath;
  }
}

// Export for use as module
module.exports = PatternTransformationEngine;

// Run if called directly with test examples
if (require.main === module) {
  console.log('🔧 Testing Pattern Transformation Engine');
  console.log('=' .repeat(50));

  const engine = new PatternTransformationEngine();

  // Test cases
  const testCases = [
    {
      name: 'Simple auth.uid() call',
      sql: "user_id = auth.uid()"
    },
    {
      name: 'Complex condition with auth.uid()',
      sql: "user_id = auth.uid() AND status = 'active'"
    },
    {
      name: 'Multiple auth.uid() calls',
      sql: "user_id = auth.uid() OR created_by = auth.uid()"
    },
    {
      name: 'Mixed auth functions',
      sql: "user_id = auth.uid() AND role = (auth.jwt() ->> 'role')"
    },
    {
      name: 'Already optimized',
      sql: "user_id = (SELECT auth.uid()) AND status = 'active'"
    },
    {
      name: 'Complex nested condition',
      sql: "(user_id = auth.uid() OR team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())) AND active = true"
    }
  ];

  console.log('\n🧪 Running test transformations...\n');

  testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.name}`);
    console.log(`Original:    ${testCase.sql}`);
    
    const result = engine.transformAuthPatterns(testCase.sql);
    
    if (result.success) {
      console.log(`Transformed: ${result.transformed}`);
      console.log(`Changes:     ${result.changes_made ? '✅ Yes' : '❌ No'}`);
      if (result.validation) {
        console.log(`Valid:       ${result.validation.valid ? '✅ Yes' : '❌ No'}`);
        if (!result.validation.valid) {
          console.log(`Issues:      ${result.validation.issues.join(', ')}`);
        }
      }
    } else {
      console.log(`Error:       ${result.error}`);
    }
    
    console.log('');
  });

  // Test policy transformation
  console.log('🏛️ Testing policy transformation...\n');

  const samplePolicy = {
    tablename: 'projects',
    policyname: 'projects_select_policy',
    cmd: 'SELECT',
    permissive: 'PERMISSIVE',
    roles: ['authenticated'],
    qual: "user_id = auth.uid() AND status = 'active'",
    with_check: "user_id = auth.uid()"
  };

  console.log('Sample Policy:');
  console.log(JSON.stringify(samplePolicy, null, 2));

  const policyResult = engine.transformPolicyDefinition(samplePolicy);
  
  console.log('\nTransformation Result:');
  console.log(`Success: ${policyResult.success}`);
  console.log(`Changes Made: ${policyResult.changes_made}`);
  
  if (policyResult.success && policyResult.changes_made) {
    console.log('\nTransformed Policy:');
    console.log(JSON.stringify(policyResult.transformed, null, 2));
    
    // Test SQL generation
    console.log('\n🔧 Testing SQL generation...\n');
    
    try {
      const sqlResult = engine.generatePolicyReplacementSQL(policyResult.original, policyResult.transformed);
      
      if (sqlResult.success) {
        console.log('✅ SQL Generation Successful!');
        console.log('\nDROP SQL:');
        console.log(sqlResult.drop_sql);
        console.log('\nCREATE SQL:');
        console.log(sqlResult.create_sql);
        console.log('\nTransaction SQL:');
        console.log(sqlResult.transaction_sql);
        console.log('\nRollback SQL:');
        console.log(sqlResult.rollback_sql);
      } else {
        console.log('❌ SQL Generation Failed:', sqlResult.error);
      }
    } catch (error) {
      console.log('❌ SQL Generation Error:', error.message);
    }
  }

  // Test batch processing
  console.log('\n📦 Testing batch processing...\n');

  const batchPolicies = [
    {
      tablename: 'tasks',
      policyname: 'tasks_select_policy',
      cmd: 'SELECT',
      permissive: 'PERMISSIVE',
      roles: ['authenticated'],
      qual: "assigned_to = auth.uid() OR created_by = auth.uid()",
      with_check: null
    },
    {
      tablename: 'documents',
      policyname: 'documents_update_policy',
      cmd: 'UPDATE',
      permissive: 'PERMISSIVE',
      roles: ['authenticated'],
      qual: "owner_id = auth.uid()",
      with_check: "owner_id = auth.uid()"
    }
  ];

  const batchResult = engine.batchTransformPolicies(batchPolicies);
  console.log(`Batch Processing Results:`);
  console.log(`- Total policies: ${batchResult.total_policies}`);
  console.log(`- Successful: ${batchResult.successful}`);
  console.log(`- With changes: ${batchResult.policies_with_changes}`);

  if (batchResult.policies_with_changes > 0) {
    console.log('\n🔧 Testing batch SQL generation...\n');
    
    const batchSQLResult = engine.generateBatchPolicyReplacementSQL(batchResult.results);
    
    if (batchSQLResult.success) {
      console.log(`✅ Batch SQL Generation Successful!`);
      console.log(`- SQL statements generated: ${batchSQLResult.successful_generations}`);
      console.log(`- Failed generations: ${batchSQLResult.failed_generations}`);
      
      console.log('\nBatch Transaction SQL:');
      console.log(batchSQLResult.batch_transaction_sql);
      
      console.log('\nBatch Rollback SQL:');
      console.log(batchSQLResult.batch_rollback_sql);
    } else {
      console.log('❌ Batch SQL Generation Failed:', batchSQLResult.error);
    }
  }

  // Generate and save report
  engine.saveResults('test-transformation-results.json').then(() => {
    console.log('\n✅ Pattern Transformation Engine test complete!');
  });
}