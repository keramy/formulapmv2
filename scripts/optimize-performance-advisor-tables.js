#!/usr/bin/env node

/**
 * High-Priority Performance Advisor Tables Optimization
 * 
 * This script optimizes the specific tables identified by Supabase Performance Advisor
 * as having the highest impact on RLS performance.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

const fs = require('fs');
const path = require('path');
const SystematicOptimizationWorkflow = require('./systematic-optimization-workflow');

class PerformanceAdvisorOptimizer {
  constructor() {
    this.workflow = new SystematicOptimizationWorkflow();
    
    // High-priority tables identified by Performance Advisor
    this.highPriorityTables = {
      // Core user access tables
      'activity_summary': {
        priority: 'CRITICAL',
        direct_calls: 2,
        description: 'User activity tracking with frequent RLS checks'
      },
      'audit_logs': {
        priority: 'CRITICAL', 
        direct_calls: 1,
        description: 'System audit logging with user-based filtering'
      },
      'notifications': {
        priority: 'CRITICAL',
        direct_calls: 1,
        description: 'User notification system with high query volume'
      },
      
      // Task management tables
      'tasks': {
        priority: 'HIGH',
        direct_calls: 1,
        description: 'Project task management with user assignments'
      },
      'task_comments': {
        priority: 'HIGH',
        direct_calls: 1,
        description: 'Task discussion threads with user permissions'
      },
      'field_reports': {
        priority: 'HIGH',
        direct_calls: 1,
        description: 'Field reporting system with user-based access'
      },
      
      // Financial and administrative tables
      'invoices': {
        priority: 'HIGH',
        direct_calls: 3,
        description: 'Invoice management with complex user permissions'
      },
      'invoice_items': {
        priority: 'MEDIUM',
        direct_calls: 1,
        description: 'Invoice line items with inherited permissions'
      },
      'payments': {
        priority: 'MEDIUM',
        direct_calls: 1,
        description: 'Payment processing with user-based access'
      },
      'project_budgets': {
        priority: 'HIGH',
        direct_calls: 2,
        description: 'Project budget management with role-based access'
      },
      
      // System and document tables
      'system_settings': {
        priority: 'MEDIUM',
        direct_calls: 1,
        description: 'System configuration with admin access controls'
      },
      'permission_templates': {
        priority: 'MEDIUM',
        direct_calls: 1,
        description: 'Permission template management'
      },
      'documents': {
        priority: 'HIGH',
        direct_calls: 2,
        description: 'Document management with user-based permissions'
      },
      'document_approvals': {
        priority: 'MEDIUM',
        direct_calls: 1,
        description: 'Document approval workflow'
      },
      
      // Operational tables
      'suppliers': {
        priority: 'MEDIUM',
        direct_calls: 2,
        description: 'Supplier management with user-based access'
      },
      'mobile_devices': {
        priority: 'LOW',
        direct_calls: 1,
        description: 'Mobile device registration and management'
      },
      'tenders': {
        priority: 'MEDIUM',
        direct_calls: 1,
        description: 'Tender management with role-based permissions'
      }
    };
  }

  /**
   * Generate sample policy data for high-priority tables
   * In a real implementation, this would query the actual database
   */
  generateSamplePolicyData() {
    const samplePolicies = {
      // Critical priority tables
      'activity_summary': [
        {
          tablename: 'activity_summary',
          policyname: 'activity_summary_select_policy',
          cmd: 'SELECT',
          permissive: 'PERMISSIVE',
          roles: ['authenticated'],
          qual: "user_id = auth.uid() OR (auth.jwt() ->> 'role') = 'admin'",
          with_check: null
        },
        {
          tablename: 'activity_summary',
          policyname: 'activity_summary_insert_policy',
          cmd: 'INSERT',
          permissive: 'PERMISSIVE',
          roles: ['authenticated'],
          qual: null,
          with_check: "user_id = auth.uid()"
        }
      ],
      
      'audit_logs': [
        {
          tablename: 'audit_logs',
          policyname: 'audit_logs_select_policy',
          cmd: 'SELECT',
          permissive: 'PERMISSIVE',
          roles: ['authenticated'],
          qual: "(auth.jwt() ->> 'role') IN ('admin', 'manager') OR user_id = auth.uid()",
          with_check: null
        }
      ],
      
      'notifications': [
        {
          tablename: 'notifications',
          policyname: 'notifications_select_policy',
          cmd: 'SELECT',
          permissive: 'PERMISSIVE',
          roles: ['authenticated'],
          qual: "recipient_id = auth.uid()",
          with_check: null
        }
      ],
      
      // High priority tables
      'tasks': [
        {
          tablename: 'tasks',
          policyname: 'tasks_select_policy',
          cmd: 'SELECT',
          permissive: 'PERMISSIVE',
          roles: ['authenticated'],
          qual: "assigned_to = auth.uid() OR created_by = auth.uid() OR project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())",
          with_check: null
        }
      ],
      
      'invoices': [
        {
          tablename: 'invoices',
          policyname: 'invoices_select_policy',
          cmd: 'SELECT',
          permissive: 'PERMISSIVE',
          roles: ['authenticated'],
          qual: "created_by = auth.uid() OR (auth.jwt() ->> 'role') = 'admin'",
          with_check: null
        },
        {
          tablename: 'invoices',
          policyname: 'invoices_update_policy',
          cmd: 'UPDATE',
          permissive: 'PERMISSIVE',
          roles: ['authenticated'],
          qual: "created_by = auth.uid() OR (auth.jwt() ->> 'role') IN ('admin', 'manager')",
          with_check: "created_by = auth.uid() OR (auth.jwt() ->> 'role') IN ('admin', 'manager')"
        },
        {
          tablename: 'invoices',
          policyname: 'invoices_insert_policy',
          cmd: 'INSERT',
          permissive: 'PERMISSIVE',
          roles: ['authenticated'],
          qual: null,
          with_check: "created_by = auth.uid()"
        }
      ],
      
      'documents': [
        {
          tablename: 'documents',
          policyname: 'documents_select_policy',
          cmd: 'SELECT',
          permissive: 'PERMISSIVE',
          roles: ['authenticated'],
          qual: "owner_id = auth.uid() OR shared_with @> ARRAY[auth.uid()]",
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
      ]
    };

    return samplePolicies;
  }

  /**
   * Execute optimization for high-priority tables in order of priority
   */
  async executeHighPriorityOptimization() {
    console.log('🚀 Starting High-Priority Performance Advisor Table Optimization');
    console.log('=' .repeat(70));

    // Group tables by priority
    const tablesByPriority = {
      'CRITICAL': [],
      'HIGH': [],
      'MEDIUM': [],
      'LOW': []
    };

    for (const [tableName, tableInfo] of Object.entries(this.highPriorityTables)) {
      tablesByPriority[tableInfo.priority].push({
        name: tableName,
        ...tableInfo
      });
    }

    // Sort by direct calls within each priority group
    for (const priority of Object.keys(tablesByPriority)) {
      tablesByPriority[priority].sort((a, b) => b.direct_calls - a.direct_calls);
    }

    console.log('📊 Optimization Plan:');
    for (const [priority, tables] of Object.entries(tablesByPriority)) {
      if (tables.length > 0) {
        console.log(`\n${priority} Priority (${tables.length} tables):`);
        tables.forEach(table => {
          console.log(`  - ${table.name}: ${table.direct_calls} direct calls - ${table.description}`);
        });
      }
    }

    // Get sample policy data (in real implementation, this would query the database)
    const samplePolicies = this.generateSamplePolicyData();
    
    console.log('\n🔧 Processing tables by priority...\n');

    const results = {
      timestamp: new Date().toISOString(),
      priorities_processed: [],
      total_tables: Object.keys(this.highPriorityTables).length,
      tables_with_policies: Object.keys(samplePolicies).length,
      overall_results: null
    };

    // Process each priority group
    for (const priority of ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']) {
      const tablesInPriority = tablesByPriority[priority];
      
      if (tablesInPriority.length === 0) continue;

      console.log(`\n${'='.repeat(50)}`);
      console.log(`🔥 Processing ${priority} Priority Tables`);
      console.log(`${'='.repeat(50)}`);

      // Filter policies for this priority group
      const priorityPolicies = {};
      for (const table of tablesInPriority) {
        if (samplePolicies[table.name]) {
          priorityPolicies[table.name] = samplePolicies[table.name];
        } else {
          console.log(`⚠️  No sample policies available for ${table.name} (would query database in real implementation)`);
        }
      }

      if (Object.keys(priorityPolicies).length > 0) {
        // Execute optimization workflow for this priority group
        const priorityResults = await this.workflow.executeOptimizationWorkflow(priorityPolicies, {
          continueOnError: true,
          generateReports: false, // We'll generate a consolidated report at the end
          saveIntermediateResults: true
        });

        results.priorities_processed.push({
          priority: priority,
          tables: tablesInPriority.map(t => t.name),
          results: priorityResults
        });

        console.log(`\n✅ ${priority} priority tables completed`);
        console.log(`   Tables processed: ${priorityResults.overall_statistics.successful_tables}/${priorityResults.overall_statistics.total_tables}`);
        console.log(`   Policies optimized: ${priorityResults.overall_statistics.optimized_policies}`);
      }
    }

    // Generate consolidated results
    results.overall_results = this.consolidateResults(results.priorities_processed);

    // Generate final report
    await this.generatePerformanceAdvisorReport(results);

    return results;
  }

  /**
   * Consolidate results from all priority groups
   */
  consolidateResults(priorityResults) {
    const consolidated = {
      total_tables: 0,
      successful_tables: 0,
      failed_tables: 0,
      total_policies: 0,
      optimized_policies: 0,
      failed_policies: 0,
      skipped_policies: 0,
      by_priority: {}
    };

    for (const priorityResult of priorityResults) {
      const stats = priorityResult.results.overall_statistics;
      
      consolidated.total_tables += stats.total_tables;
      consolidated.successful_tables += stats.successful_tables;
      consolidated.failed_tables += stats.failed_tables;
      consolidated.total_policies += stats.total_policies;
      consolidated.optimized_policies += stats.optimized_policies;
      consolidated.failed_policies += stats.failed_policies;
      consolidated.skipped_policies += stats.skipped_policies;

      consolidated.by_priority[priorityResult.priority] = {
        tables: priorityResult.tables,
        statistics: stats
      };
    }

    return consolidated;
  }

  /**
   * Generate Performance Advisor specific report
   */
  async generatePerformanceAdvisorReport(results) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportDir = 'analysis-reports/performance-advisor';
    
    // Ensure directory exists
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const report = {
      title: 'Performance Advisor High-Priority Tables Optimization Report',
      generated_at: results.timestamp,
      completed_at: new Date().toISOString(),
      summary: results.overall_results,
      priority_breakdown: results.priorities_processed,
      table_priorities: this.highPriorityTables,
      recommendations: this.generatePerformanceRecommendations(results)
    };

    // Save JSON report
    const reportPath = path.join(reportDir, `performance-advisor-report-${timestamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate markdown summary
    const markdownPath = path.join(reportDir, `performance-advisor-summary-${timestamp}.md`);
    const markdown = this.generatePerformanceMarkdownSummary(report);
    fs.writeFileSync(markdownPath, markdown);

    console.log('\n' + '='.repeat(70));
    console.log('📊 Performance Advisor Optimization Summary');
    console.log('='.repeat(70));
    
    if (results.overall_results) {
      console.log(`Tables processed: ${results.overall_results.successful_tables}/${results.overall_results.total_tables}`);
      console.log(`Policies optimized: ${results.overall_results.optimized_policies}`);
      console.log(`Success rate: ${results.overall_results.total_tables > 0 ? 
        ((results.overall_results.successful_tables / results.overall_results.total_tables) * 100).toFixed(1) : 0}%`);
    }

    console.log(`\n💾 Performance Advisor reports saved:`);
    console.log(`   📄 Detailed report: ${reportPath}`);
    console.log(`   📝 Summary: ${markdownPath}`);

    return { reportPath, markdownPath };
  }

  /**
   * Generate performance-specific recommendations
   */
  generatePerformanceRecommendations(results) {
    const recommendations = [];

    if (!results.overall_results) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Execute with real database connection',
        description: 'This was a demonstration run. Connect to actual database to process real policies.',
        impact: 'Required for actual performance optimization'
      });
      return recommendations;
    }

    const stats = results.overall_results;
    const successRate = stats.total_tables > 0 ? (stats.successful_tables / stats.total_tables) * 100 : 0;

    if (successRate === 100 && stats.optimized_policies > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        action: 'Execute Performance Advisor optimizations immediately',
        description: `${stats.optimized_policies} high-impact policies ready for optimization`,
        impact: 'Significant RLS performance improvement across critical tables'
      });
    }

    if (stats.optimized_policies >= 10) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Monitor Performance Advisor metrics after optimization',
        description: 'Track query performance improvements in Supabase dashboard',
        impact: 'Validate optimization effectiveness'
      });
    }

    // Priority-specific recommendations
    for (const priorityResult of results.priorities_processed) {
      if (priorityResult.results.overall_statistics.optimized_policies > 0) {
        recommendations.push({
          priority: priorityResult.priority === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
          action: `Execute ${priorityResult.priority.toLowerCase()} priority optimizations`,
          description: `${priorityResult.results.overall_statistics.optimized_policies} policies in ${priorityResult.priority.toLowerCase()} priority tables`,
          impact: `${priorityResult.priority === 'CRITICAL' ? 'Maximum' : 'High'} performance impact`
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate markdown summary for Performance Advisor report
   */
  generatePerformanceMarkdownSummary(report) {
    const stats = report.summary;
    const successRate = stats ? (stats.successful_tables / stats.total_tables) * 100 : 0;

    return `# Performance Advisor High-Priority Tables Optimization

Generated: ${report.completed_at}

## Executive Summary

${stats ? `
- **Success Rate**: ${successRate.toFixed(1)}%
- **Tables Processed**: ${stats.successful_tables}/${stats.total_tables}
- **Policies Optimized**: ${stats.optimized_policies}
- **Performance Impact**: ${stats.optimized_policies >= 10 ? 'HIGH' : stats.optimized_policies >= 5 ? 'MEDIUM' : 'LOW'}
` : `
- **Status**: Demonstration run completed
- **Tables Analyzed**: ${Object.keys(report.table_priorities).length}
- **Sample Policies**: Available for ${report.priority_breakdown.length} priority groups
`}

## Priority Breakdown

${Object.entries(report.summary?.by_priority || {}).map(([priority, data]) => 
  `### ${priority} Priority
- **Tables**: ${data.tables.join(', ')}
- **Policies Optimized**: ${data.statistics.optimized_policies}
- **Success Rate**: ${data.statistics.total_tables > 0 ? 
    ((data.statistics.successful_tables / data.statistics.total_tables) * 100).toFixed(1) : 0}%`
).join('\n\n')}

## Table Analysis

${Object.entries(report.table_priorities).map(([table, info]) => 
  `### ${table}
- **Priority**: ${info.priority}
- **Direct Calls**: ${info.direct_calls}
- **Description**: ${info.description}`
).join('\n\n')}

## Recommendations

${report.recommendations.map(rec => 
  `### ${rec.priority} Priority: ${rec.action}
${rec.description}
*Impact: ${rec.impact}*`
).join('\n\n')}

## Next Steps

1. Execute optimizations for critical priority tables first
2. Monitor Supabase Performance Advisor metrics
3. Apply remaining optimizations in priority order
4. Validate performance improvements

---
*Generated by Performance Advisor High-Priority Tables Optimizer*
`;
  }
}

// Export for use as module
module.exports = PerformanceAdvisorOptimizer;

// Run if called directly
if (require.main === module) {
  const fs = require('fs');
  const path = require('path');
  
  console.log('🧪 Testing Performance Advisor High-Priority Tables Optimization');
  console.log('=' .repeat(70));

  const optimizer = new PerformanceAdvisorOptimizer();

  optimizer.executeHighPriorityOptimization().then(results => {
    console.log('\n✅ Performance Advisor optimization test complete!');
    process.exit(0);
  }).catch(error => {
    console.error('\n❌ Performance Advisor optimization test failed:', error.message);
    process.exit(1);
  });
}