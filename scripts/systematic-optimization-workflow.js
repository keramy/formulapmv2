#!/usr/bin/env node

/**
 * Systematic RLS Optimization Workflow
 * 
 * This script implements a systematic workflow for optimizing RLS policies table by table.
 * It provides progress tracking, error handling, and rollback capabilities.
 * 
 * Requirements: 1.1, 1.2, 2.1, 3.2
 */

const fs = require('fs');
const path = require('path');
const PatternTransformationEngine = require('./pattern-transformation-engine');

// Load environment variables from .env.local if it exists
function loadEnvVars() {
  const envPath = '.env.local';
  const envVars = {};
  
  try {
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          envVars[key.trim()] = value.replace(/^["']|["']$/g, ''); // Remove quotes
        }
      });
    }
  } catch (error) {
    console.warn('Warning: Could not load .env.local file:', error.message);
  }
  
  return envVars;
}

const envVars = loadEnvVars();

class SystematicOptimizationWorkflow {
  constructor() {
    this.transformationEngine = new PatternTransformationEngine();
    this.results = {
      timestamp: new Date().toISOString(),
      workflow_status: 'initialized',
      tables_processed: [],
      overall_statistics: {
        total_tables: 0,
        successful_tables: 0,
        failed_tables: 0,
        total_policies: 0,
        optimized_policies: 0,
        failed_policies: 0,
        skipped_policies: 0
      },
      errors: [],
      rollback_information: []
    };
  }

  /**
   * Process a single table's policies for optimization
   * 
   * @param {string} tableName - Name of the table to process
   * @param {array} policies - Array of policy objects for the table
   * @returns {object} - Table processing results
   */
  async processTableOptimization(tableName, policies) {
    console.log(`\n🔧 Processing table: ${tableName}`);
    console.log(`   Policies to analyze: ${policies.length}`);

    const tableResult = {
      table_name: tableName,
      status: 'processing',
      timestamp: new Date().toISOString(),
      policies: {
        total: policies.length,
        analyzed: 0,
        optimized: 0,
        failed: 0,
        skipped: 0,
        no_changes_needed: 0
      },
      transformations: [],
      sql_statements: {
        individual: [],
        batch_transaction: '',
        rollback_transaction: ''
      },
      errors: []
    };

    try {
      // Step 1: Analyze and transform policies
      console.log(`   📊 Analyzing policies...`);
      
      const transformationResults = [];
      
      for (const policy of policies) {
        try {
          tableResult.policies.analyzed++;
          
          const transformResult = this.transformationEngine.transformPolicyDefinition(policy);
          
          if (transformResult.success) {
            if (transformResult.changes_made) {
              transformationResults.push(transformResult);
              tableResult.policies.optimized++;
              console.log(`     ✅ ${policy.policyname}: Optimization needed`);
            } else {
              tableResult.policies.no_changes_needed++;
              console.log(`     ⚪ ${policy.policyname}: Already optimized`);
            }
          } else {
            tableResult.policies.failed++;
            tableResult.errors.push({
              policy_name: policy.policyname,
              error: transformResult.error,
              timestamp: new Date().toISOString()
            });
            console.log(`     ❌ ${policy.policyname}: Transformation failed - ${transformResult.error}`);
          }
        } catch (error) {
          tableResult.policies.failed++;
          tableResult.errors.push({
            policy_name: policy.policyname || 'unknown',
            error: error.message,
            timestamp: new Date().toISOString()
          });
          console.log(`     ❌ ${policy.policyname || 'unknown'}: Processing error - ${error.message}`);
        }
      }

      // Step 2: Generate SQL statements if there are optimizations to apply
      if (transformationResults.length > 0) {
        console.log(`   🔧 Generating SQL statements for ${transformationResults.length} policies...`);
        
        try {
          const batchSQLResult = this.transformationEngine.generateBatchPolicyReplacementSQL(transformationResults);
          
          if (batchSQLResult.success) {
            tableResult.sql_statements.batch_transaction = batchSQLResult.batch_transaction_sql;
            tableResult.sql_statements.rollback_transaction = batchSQLResult.batch_rollback_sql;
            tableResult.sql_statements.individual = batchSQLResult.sql_statements;
            
            console.log(`     ✅ SQL generation successful`);
            console.log(`     📄 Generated ${batchSQLResult.successful_generations} SQL statements`);
          } else {
            throw new Error(`Batch SQL generation failed: ${batchSQLResult.error}`);
          }
        } catch (error) {
          tableResult.errors.push({
            type: 'sql_generation',
            error: error.message,
            timestamp: new Date().toISOString()
          });
          console.log(`     ❌ SQL generation failed: ${error.message}`);
        }
      }

      // Step 3: Determine final status
      if (tableResult.errors.length === 0) {
        tableResult.status = 'completed_successfully';
        console.log(`   ✅ Table ${tableName} processed successfully`);
        console.log(`      - Policies optimized: ${tableResult.policies.optimized}`);
        console.log(`      - Already optimized: ${tableResult.policies.no_changes_needed}`);
      } else if (tableResult.policies.optimized > 0) {
        tableResult.status = 'completed_with_errors';
        console.log(`   ⚠️  Table ${tableName} completed with errors`);
        console.log(`      - Policies optimized: ${tableResult.policies.optimized}`);
        console.log(`      - Failed policies: ${tableResult.policies.failed}`);
      } else {
        tableResult.status = 'failed';
        console.log(`   ❌ Table ${tableName} processing failed`);
        console.log(`      - Failed policies: ${tableResult.policies.failed}`);
      }

      tableResult.transformations = transformationResults;
      return tableResult;

    } catch (error) {
      tableResult.status = 'failed';
      tableResult.errors.push({
        type: 'table_processing',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      console.log(`   ❌ Table ${tableName} processing failed: ${error.message}`);
      return tableResult;
    }
  }

  /**
   * Execute systematic optimization workflow across multiple tables
   * 
   * @param {object} tablesPolicies - Object with table names as keys and policy arrays as values
   * @param {object} options - Workflow options
   * @returns {object} - Complete workflow results
   */
  async executeOptimizationWorkflow(tablesPolicies, options = {}) {
    const {
      continueOnError = true,
      generateReports = true,
      saveIntermediateResults = true
    } = options;

    console.log('🚀 Starting Systematic RLS Optimization Workflow');
    console.log('=' .repeat(60));

    this.results.workflow_status = 'running';
    this.results.overall_statistics.total_tables = Object.keys(tablesPolicies).length;

    // Calculate total policies
    this.results.overall_statistics.total_policies = Object.values(tablesPolicies)
      .reduce((sum, policies) => sum + policies.length, 0);

    console.log(`📊 Workflow Overview:`);
    console.log(`   Tables to process: ${this.results.overall_statistics.total_tables}`);
    console.log(`   Total policies: ${this.results.overall_statistics.total_policies}`);

    // Process each table
    for (const [tableName, policies] of Object.entries(tablesPolicies)) {
      try {
        const tableResult = await this.processTableOptimization(tableName, policies);
        this.results.tables_processed.push(tableResult);

        // Update overall statistics
        if (tableResult.status === 'completed_successfully') {
          this.results.overall_statistics.successful_tables++;
        } else if (tableResult.status === 'completed_with_errors') {
          this.results.overall_statistics.successful_tables++;
          this.results.overall_statistics.failed_tables++;
        } else {
          this.results.overall_statistics.failed_tables++;
        }

        this.results.overall_statistics.optimized_policies += tableResult.policies.optimized;
        this.results.overall_statistics.failed_policies += tableResult.policies.failed;
        this.results.overall_statistics.skipped_policies += tableResult.policies.no_changes_needed;

        // Save intermediate results if requested
        if (saveIntermediateResults) {
          await this.saveIntermediateResults(tableName, tableResult);
        }

        // Check if we should continue on error
        if (!continueOnError && tableResult.status === 'failed') {
          console.log(`\n⚠️  Stopping workflow due to table failure: ${tableName}`);
          this.results.workflow_status = 'stopped_on_error';
          break;
        }

      } catch (error) {
        console.log(`\n❌ Critical error processing table ${tableName}: ${error.message}`);
        this.results.errors.push({
          table_name: tableName,
          type: 'critical_error',
          error: error.message,
          timestamp: new Date().toISOString()
        });

        if (!continueOnError) {
          this.results.workflow_status = 'stopped_on_error';
          break;
        }
      }
    }

    // Finalize workflow
    if (this.results.workflow_status === 'running') {
      this.results.workflow_status = 'completed';
    }

    // Generate final report
    console.log('\n' + '=' .repeat(60));
    console.log('📊 Workflow Summary');
    console.log('=' .repeat(60));
    console.log(`Status: ${this.results.workflow_status.toUpperCase()}`);
    console.log(`Tables processed: ${this.results.tables_processed.length}/${this.results.overall_statistics.total_tables}`);
    console.log(`Successful tables: ${this.results.overall_statistics.successful_tables}`);
    console.log(`Failed tables: ${this.results.overall_statistics.failed_tables}`);
    console.log(`Policies optimized: ${this.results.overall_statistics.optimized_policies}`);
    console.log(`Policies failed: ${this.results.overall_statistics.failed_policies}`);
    console.log(`Policies skipped (already optimized): ${this.results.overall_statistics.skipped_policies}`);

    if (generateReports) {
      await this.generateWorkflowReport();
    }

    return this.results;
  }

  /**
   * Save intermediate results for a table
   */
  async saveIntermediateResults(tableName, tableResult) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportDir = 'analysis-reports/optimization-workflow';
    
    // Ensure directory exists
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    // Save table results
    const tableResultPath = path.join(reportDir, `table-${tableName}-${timestamp}.json`);
    fs.writeFileSync(tableResultPath, JSON.stringify(tableResult, null, 2));

    // Save SQL files if they exist
    if (tableResult.sql_statements.batch_transaction) {
      const sqlPath = path.join(reportDir, `table-${tableName}-optimization-${timestamp}.sql`);
      fs.writeFileSync(sqlPath, tableResult.sql_statements.batch_transaction);

      const rollbackPath = path.join(reportDir, `table-${tableName}-rollback-${timestamp}.sql`);
      fs.writeFileSync(rollbackPath, tableResult.sql_statements.rollback_transaction);
    }

    console.log(`     💾 Intermediate results saved for ${tableName}`);
  }

  /**
   * Generate comprehensive workflow report
   */
  async generateWorkflowReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportDir = 'analysis-reports/optimization-workflow';
    
    // Ensure directory exists
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    // Generate comprehensive report
    const report = {
      title: 'Systematic RLS Optimization Workflow Report',
      generated_at: this.results.timestamp,
      completed_at: new Date().toISOString(),
      workflow_status: this.results.workflow_status,
      summary: this.results.overall_statistics,
      table_results: this.results.tables_processed,
      errors: this.results.errors,
      recommendations: this.generateRecommendations()
    };

    // Save JSON report
    const reportPath = path.join(reportDir, `workflow-report-${timestamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate markdown summary
    const markdownPath = path.join(reportDir, `workflow-summary-${timestamp}.md`);
    const markdown = this.generateMarkdownSummary(report);
    fs.writeFileSync(markdownPath, markdown);

    // Generate consolidated SQL files
    await this.generateConsolidatedSQL(timestamp);

    console.log(`\n💾 Workflow reports saved:`);
    console.log(`   📄 Detailed report: ${reportPath}`);
    console.log(`   📝 Summary: ${markdownPath}`);

    return { reportPath, markdownPath };
  }

  /**
   * Generate consolidated SQL files for all optimizations
   */
  async generateConsolidatedSQL(timestamp) {
    const reportDir = 'analysis-reports/optimization-workflow';
    
    const allOptimizations = [];
    const allRollbacks = [];

    for (const tableResult of this.results.tables_processed) {
      if (tableResult.sql_statements.batch_transaction) {
        allOptimizations.push(`-- Table: ${tableResult.table_name}`);
        allOptimizations.push(tableResult.sql_statements.batch_transaction);
        allOptimizations.push('');

        allRollbacks.push(`-- Rollback for table: ${tableResult.table_name}`);
        allRollbacks.push(tableResult.sql_statements.rollback_transaction);
        allRollbacks.push('');
      }
    }

    if (allOptimizations.length > 0) {
      const consolidatedSQL = `-- Consolidated RLS Optimization SQL
-- Generated: ${new Date().toISOString()}
-- Total tables: ${this.results.tables_processed.length}
-- Total optimizations: ${this.results.overall_statistics.optimized_policies}

${allOptimizations.join('\n')}`;

      const consolidatedRollback = `-- Consolidated RLS Optimization Rollback SQL
-- Generated: ${new Date().toISOString()}
-- Use this to rollback all optimizations if needed

${allRollbacks.join('\n')}`;

      const sqlPath = path.join(reportDir, `consolidated-optimization-${timestamp}.sql`);
      const rollbackPath = path.join(reportDir, `consolidated-rollback-${timestamp}.sql`);

      fs.writeFileSync(sqlPath, consolidatedSQL);
      fs.writeFileSync(rollbackPath, consolidatedRollback);

      console.log(`   🔧 Consolidated SQL: ${sqlPath}`);
      console.log(`   🔄 Rollback SQL: ${rollbackPath}`);
    }
  }

  /**
   * Generate recommendations based on workflow results
   */
  generateRecommendations() {
    const recommendations = [];
    
    const successRate = this.results.overall_statistics.total_tables > 0 ? 
      (this.results.overall_statistics.successful_tables / this.results.overall_statistics.total_tables) * 100 : 0;

    if (successRate === 100) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Execute optimizations',
        description: 'All tables processed successfully. Ready to apply optimizations.',
        impact: 'Significant performance improvement across all RLS policies'
      });
    } else if (successRate >= 80) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Execute optimizations with caution',
        description: `${successRate.toFixed(1)}% success rate. Review failed tables before proceeding.`,
        impact: 'Good performance improvement with some manual intervention needed'
      });
    } else {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Review and fix errors',
        description: `${successRate.toFixed(1)}% success rate. Address errors before optimization.`,
        impact: 'Optimization blocked until errors are resolved'
      });
    }

    if (this.results.overall_statistics.failed_policies > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Manual review of failed policies',
        description: `${this.results.overall_statistics.failed_policies} policies failed transformation`,
        impact: 'Some policies may need manual optimization'
      });
    }

    return recommendations;
  }

  /**
   * Generate markdown summary report
   */
  generateMarkdownSummary(report) {
    const successRate = report.summary.total_tables > 0 ? 
      (report.summary.successful_tables / report.summary.total_tables) * 100 : 0;

    return `# Systematic RLS Optimization Workflow Summary

Generated: ${report.completed_at}

## Executive Summary

- **Workflow Status**: ${report.workflow_status.toUpperCase()}
- **Success Rate**: ${successRate.toFixed(1)}%
- **Tables Processed**: ${report.summary.successful_tables}/${report.summary.total_tables}
- **Policies Optimized**: ${report.summary.optimized_policies}
- **Policies Failed**: ${report.summary.failed_policies}

## Table Results

${report.table_results.map(table => 
  `### ${table.table_name}
- **Status**: ${table.status}
- **Policies Optimized**: ${table.policies.optimized}
- **Already Optimized**: ${table.policies.no_changes_needed}
- **Failed**: ${table.policies.failed}
${table.errors.length > 0 ? `- **Errors**: ${table.errors.length}` : ''}`
).join('\n\n')}

## Recommendations

${report.recommendations.map(rec => 
  `### ${rec.priority} Priority: ${rec.action}
${rec.description}
*Impact: ${rec.impact}*`
).join('\n\n')}

## Next Steps

1. Review table results and error details
2. Execute SQL optimizations for successful tables
3. Address failed policies manually if needed
4. Monitor performance improvements after optimization

---
*Generated by Systematic RLS Optimization Workflow*
`;
  }
}

// Export for use as module
module.exports = SystematicOptimizationWorkflow;

// Run if called directly with real data
if (require.main === module) {
  console.log('🧪 Testing Systematic Optimization Workflow');
  console.log('=' .repeat(50));

  const workflow = new SystematicOptimizationWorkflow();

  // Sample test data
  const sampleTablesPolicies = {
    'projects': [
      {
        tablename: 'projects',
        policyname: 'projects_select_policy',
        cmd: 'SELECT',
        permissive: 'PERMISSIVE',
        roles: ['authenticated'],
        qual: "user_id = auth.uid() AND status = 'active'",
        with_check: null
      },
      {
        tablename: 'projects',
        policyname: 'projects_update_policy',
        cmd: 'UPDATE',
        permissive: 'PERMISSIVE',
        roles: ['authenticated'],
        qual: "user_id = auth.uid()",
        with_check: "user_id = auth.uid()"
      }
    ],
    'tasks': [
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
        tablename: 'tasks',
        policyname: 'tasks_already_optimized',
        cmd: 'INSERT',
        permissive: 'PERMISSIVE',
        roles: ['authenticated'],
        qual: "created_by = (SELECT auth.uid())",
        with_check: "created_by = (SELECT auth.uid())"
      }
    ]
  };

  // Execute workflow
  workflow.executeOptimizationWorkflow(sampleTablesPolicies, {
    continueOnError: true,
    generateReports: true,
    saveIntermediateResults: true
  }).then(results => {
    console.log('\n✅ Systematic Optimization Workflow test complete!');
    process.exit(results.workflow_status === 'completed' ? 0 : 1);
  }).catch(error => {
    console.error('\n❌ Workflow test failed:', error.message);
    process.exit(1);
  });
}