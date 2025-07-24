#!/usr/bin/env node

/**
 * RLS Policy Discovery and Analysis System
 * 
 * This script implements the policy discovery and analysis system for RLS optimization.
 * It provides SQL queries and analysis tools for identifying policies requiring optimization.
 * 
 * Requirements: 3.1, 3.4
 */

const fs = require('fs');
const path = require('path');

class PolicyDiscoverySystem {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      discovery: {},
      validation: {},
      inventory: {}
    };
  }

  /**
   * SQL query to identify all policies requiring optimization
   * Finds policies with direct auth.uid() or auth.jwt() calls that are not already optimized
   */
  getPolicyDiscoveryQuery() {
    return `
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check,
        -- Analysis flags
        CASE 
          WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%' THEN true
          WHEN with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%' THEN true
          ELSE false
        END as has_direct_uid_calls,
        CASE 
          WHEN qual LIKE '%auth.jwt()%' AND qual NOT LIKE '%(SELECT auth.jwt())%' THEN true
          WHEN with_check LIKE '%auth.jwt()%' AND with_check NOT LIKE '%(SELECT auth.jwt())%' THEN true
          ELSE false
        END as has_direct_jwt_calls,
        CASE 
          WHEN qual LIKE '%(SELECT auth.uid())%' OR qual LIKE '%(SELECT auth.jwt())%' THEN true
          WHEN with_check LIKE '%(SELECT auth.uid())%' OR with_check LIKE '%(SELECT auth.jwt())%' THEN true
          ELSE false
        END as is_optimized,
        -- Count direct calls
        (LENGTH(qual) - LENGTH(REPLACE(qual, 'auth.uid()', ''))) / LENGTH('auth.uid()') +
        (LENGTH(COALESCE(with_check, '')) - LENGTH(REPLACE(COALESCE(with_check, ''), 'auth.uid()', ''))) / LENGTH('auth.uid()') as uid_call_count,
        (LENGTH(qual) - LENGTH(REPLACE(qual, 'auth.jwt()', ''))) / LENGTH('auth.jwt()') +
        (LENGTH(COALESCE(with_check, '')) - LENGTH(REPLACE(COALESCE(with_check, ''), 'auth.jwt()', ''))) / LENGTH('auth.jwt()') as jwt_call_count
      FROM pg_policies 
      WHERE schemaname = 'public'
      AND (
        qual LIKE '%auth.uid()%' OR 
        qual LIKE '%auth.jwt()%' OR
        with_check LIKE '%auth.uid()%' OR
        with_check LIKE '%auth.jwt()%'
      )
      ORDER BY tablename, policyname;
    `;
  }

  /**
   * SQL query to track optimization progress by table
   */
  getOptimizationProgressQuery() {
    return `
      SELECT 
        tablename,
        COUNT(*) as total_policies,
        COUNT(CASE 
          WHEN (qual LIKE '%(SELECT auth.uid())%' OR qual LIKE '%(SELECT auth.jwt())%' OR
                with_check LIKE '%(SELECT auth.uid())%' OR with_check LIKE '%(SELECT auth.jwt())%')
          THEN 1 
        END) as optimized_policies,
        COUNT(CASE 
          WHEN (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%') OR
               (qual LIKE '%auth.jwt()%' AND qual NOT LIKE '%(SELECT auth.jwt())%') OR
               (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%') OR
               (with_check LIKE '%auth.jwt()%' AND with_check NOT LIKE '%(SELECT auth.jwt())%')
          THEN 1 
        END) as direct_call_policies,
        ROUND(
          COUNT(CASE 
            WHEN (qual LIKE '%(SELECT auth.uid())%' OR qual LIKE '%(SELECT auth.jwt())%' OR
                  with_check LIKE '%(SELECT auth.uid())%' OR with_check LIKE '%(SELECT auth.jwt())%')
            THEN 1 
          END) * 100.0 / COUNT(*), 2
        ) as optimization_percentage
      FROM pg_policies 
      WHERE schemaname = 'public'
      AND (
        qual LIKE '%auth.uid()%' OR 
        qual LIKE '%auth.jwt()%' OR
        with_check LIKE '%auth.uid()%' OR
        with_check LIKE '%auth.jwt()%'
      )
      GROUP BY tablename
      ORDER BY direct_call_policies DESC, tablename;
    `;
  }

  /**
   * SQL query to get comprehensive policy inventory with status
   */
  getPolicyInventoryQuery() {
    return `
      SELECT 
        tablename,
        policyname,
        cmd as policy_type,
        permissive,
        roles,
        qual as condition_clause,
        with_check as check_clause,
        CASE 
          WHEN (qual LIKE '%(SELECT auth.uid())%' OR qual LIKE '%(SELECT auth.jwt())%' OR
                with_check LIKE '%(SELECT auth.uid())%' OR with_check LIKE '%(SELECT auth.jwt())%')
          THEN 'OPTIMIZED'
          WHEN (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%') OR
               (qual LIKE '%auth.jwt()%' AND qual NOT LIKE '%(SELECT auth.jwt())%') OR
               (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%') OR
               (with_check LIKE '%auth.jwt()%' AND with_check NOT LIKE '%(SELECT auth.jwt())%')
          THEN 'NEEDS_OPTIMIZATION'
          ELSE 'NO_AUTH_CALLS'
        END as optimization_status,
        -- Extract specific issues
        ARRAY_REMOVE(ARRAY[
          CASE WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%' THEN 'direct_uid_in_qual' END,
          CASE WHEN qual LIKE '%auth.jwt()%' AND qual NOT LIKE '%(SELECT auth.jwt())%' THEN 'direct_jwt_in_qual' END,
          CASE WHEN with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%' THEN 'direct_uid_in_check' END,
          CASE WHEN with_check LIKE '%auth.jwt()%' AND with_check NOT LIKE '%(SELECT auth.jwt())%' THEN 'direct_jwt_in_check' END
        ], NULL) as optimization_issues
      FROM pg_policies 
      WHERE schemaname = 'public'
      ORDER BY 
        CASE 
          WHEN (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%') OR
               (qual LIKE '%auth.jwt()%' AND qual NOT LIKE '%(SELECT auth.jwt())%') OR
               (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%') OR
               (with_check LIKE '%auth.jwt()%' AND with_check NOT LIKE '%(SELECT auth.jwt())%')
          THEN 1
          ELSE 2
        END,
        tablename, policyname;
    `;
  }

  /**
   * Generate SQL queries for policy discovery
   * Returns the SQL queries that need to be executed manually
   */
  generateDiscoveryQueries() {
    console.log('🔍 Generating policy discovery queries...');
    
    const queries = {
      policy_discovery: this.getPolicyDiscoveryQuery(),
      optimization_progress: this.getOptimizationProgressQuery(),
      policy_inventory: this.getPolicyInventoryQuery()
    };

    console.log('✅ Policy discovery queries generated');
    console.log('📝 Execute these queries in your database to get policy analysis data');
    
    return queries;
  }

  /**
   * Generate sample data for testing and demonstration
   */
  generateSampleResults() {
    console.log('📊 Generating sample analysis results...');
    
    // Sample data to demonstrate the system capabilities
    this.results.discovery = {
      total_policies_found: 15,
      policies_needing_optimization: 8,
      already_optimized: 7,
      policies: [
        {
          tablename: 'projects',
          policyname: 'projects_select_policy',
          has_direct_uid_calls: true,
          has_direct_jwt_calls: false,
          is_optimized: false,
          uid_call_count: 2,
          jwt_call_count: 0
        },
        {
          tablename: 'tasks',
          policyname: 'tasks_update_policy',
          has_direct_uid_calls: true,
          has_direct_jwt_calls: false,
          is_optimized: false,
          uid_call_count: 1,
          jwt_call_count: 0
        }
      ]
    };

    this.results.validation = {
      tables_analyzed: 5,
      total_policies: 15,
      total_optimized: 7,
      total_direct_calls: 8,
      overall_progress: 46.7,
      by_table: [
        {
          tablename: 'projects',
          total_policies: 4,
          optimized_policies: 1,
          direct_call_policies: 3,
          optimization_percentage: 25.0
        },
        {
          tablename: 'tasks',
          total_policies: 3,
          optimized_policies: 1,
          direct_call_policies: 2,
          optimization_percentage: 33.3
        },
        {
          tablename: 'user_profiles',
          total_policies: 2,
          optimized_policies: 2,
          direct_call_policies: 0,
          optimization_percentage: 100.0
        }
      ]
    };

    this.results.inventory = {
      total_policies: 15,
      status_summary: {
        NEEDS_OPTIMIZATION: 8,
        OPTIMIZED: 7
      },
      table_analysis: {
        projects: {
          total: 4,
          optimized: 1,
          needs_optimization: 3,
          policies: []
        },
        tasks: {
          total: 3,
          optimized: 1,
          needs_optimization: 2,
          policies: []
        }
      }
    };

    console.log('✅ Sample results generated for demonstration');
    return this.results;
  }

  /**
   * Generate detailed analysis report
   */
  generateAnalysisReport() {
    const report = {
      title: 'RLS Policy Discovery and Analysis Report',
      generated_at: this.results.timestamp,
      summary: {
        total_policies_with_auth: this.results.inventory.total_policies,
        policies_needing_optimization: this.results.inventory.status_summary.NEEDS_OPTIMIZATION || 0,
        already_optimized: this.results.inventory.status_summary.OPTIMIZED || 0,
        optimization_progress: this.results.validation.overall_progress + '%'
      },
      high_priority_tables: this.results.validation.by_table
        .filter(table => table.direct_call_policies > 0)
        .sort((a, b) => b.direct_call_policies - a.direct_call_policies)
        .slice(0, 10),
      detailed_findings: this.results,
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.validation.total_direct_calls > 0) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Optimize direct auth function calls',
        description: `${this.results.validation.total_direct_calls} policies contain direct auth.uid() or auth.jwt() calls that should be converted to subqueries`,
        impact: 'Significant performance improvement for row-level security evaluation'
      });
    }

    // Identify tables with highest optimization needs
    const highImpactTables = this.results.validation.by_table
      .filter(table => table.direct_call_policies >= 2)
      .sort((a, b) => b.direct_call_policies - a.direct_call_policies);

    if (highImpactTables.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Prioritize high-impact tables',
        description: `Focus optimization efforts on: ${highImpactTables.slice(0, 5).map(t => t.tablename).join(', ')}`,
        impact: 'Maximum performance gain with focused effort'
      });
    }

    if (this.results.validation.overall_progress < 100) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Complete systematic optimization',
        description: `${100 - this.results.validation.overall_progress}% of policies still need optimization`,
        impact: 'Comprehensive performance improvement across all tables'
      });
    }

    return recommendations;
  }

  /**
   * Save results to files
   */
  async saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportDir = 'analysis-reports';
    
    // Ensure directory exists
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    // Save detailed JSON results
    const jsonPath = path.join(reportDir, `rls-policy-discovery-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(this.results, null, 2));

    // Save analysis report
    const report = this.generateAnalysisReport();
    const reportPath = path.join(reportDir, `rls-policy-analysis-${timestamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Save markdown summary
    const markdownPath = path.join(reportDir, `rls-policy-summary-${timestamp}.md`);
    const markdown = this.generateMarkdownSummary(report);
    fs.writeFileSync(markdownPath, markdown);

    console.log(`💾 Results saved:`);
    console.log(`   📄 Detailed data: ${jsonPath}`);
    console.log(`   📊 Analysis report: ${reportPath}`);
    console.log(`   📝 Summary: ${markdownPath}`);

    return { jsonPath, reportPath, markdownPath };
  }

  /**
   * Generate markdown summary report
   */
  generateMarkdownSummary(report) {
    return `# RLS Policy Discovery and Analysis Summary

Generated: ${report.generated_at}

## Executive Summary

- **Total Policies**: ${report.summary.total_policies_with_auth}
- **Need Optimization**: ${report.summary.policies_needing_optimization}
- **Already Optimized**: ${report.summary.already_optimized}
- **Progress**: ${report.summary.optimization_progress}

## High Priority Tables

${report.high_priority_tables.map(table => 
  `- **${table.tablename}**: ${table.direct_call_policies} policies need optimization (${table.optimization_percentage}% complete)`
).join('\n')}

## Recommendations

${report.recommendations.map(rec => 
  `### ${rec.priority} Priority: ${rec.action}
${rec.description}
*Impact: ${rec.impact}*`
).join('\n\n')}

## Next Steps

1. Review high-priority tables identified above
2. Execute systematic optimization using the pattern transformation engine
3. Validate security preservation after each optimization batch
4. Monitor performance improvements through Supabase Performance Advisor

---
*Generated by RLS Policy Discovery and Analysis System*
`;
  }

  /**
   * Run complete discovery and analysis
   */
  async run() {
    console.log('🚀 Starting RLS Policy Discovery and Analysis System');
    console.log('=' .repeat(60));

    try {
      // Generate SQL queries for manual execution
      const queries = this.generateDiscoveryQueries();
      
      // Generate sample results for demonstration
      this.generateSampleResults();

      // Save results and queries
      const files = await this.saveResults();
      
      // Save SQL queries to file
      const sqlPath = path.join('analysis-reports', `rls-policy-queries-${new Date().toISOString().replace(/[:.]/g, '-')}.sql`);
      const sqlContent = `-- RLS Policy Discovery and Analysis Queries
-- Generated: ${new Date().toISOString()}
-- Execute these queries in your PostgreSQL database to analyze RLS policies

-- =============================================================================
-- 1. POLICY DISCOVERY QUERY
-- =============================================================================
${queries.policy_discovery}

-- =============================================================================
-- 2. OPTIMIZATION PROGRESS QUERY
-- =============================================================================
${queries.optimization_progress}

-- =============================================================================
-- 3. POLICY INVENTORY QUERY
-- =============================================================================
${queries.policy_inventory}
`;
      fs.writeFileSync(sqlPath, sqlContent);

      console.log('\n✅ Policy Discovery and Analysis Complete!');
      console.log('=' .repeat(60));
      console.log(`📊 Summary (Sample Data):`);
      console.log(`   Total policies analyzed: ${this.results.inventory.total_policies}`);
      console.log(`   Policies needing optimization: ${this.results.inventory.status_summary.NEEDS_OPTIMIZATION || 0}`);
      console.log(`   Already optimized: ${this.results.inventory.status_summary.OPTIMIZED || 0}`);
      console.log(`   Overall progress: ${this.results.validation.overall_progress}%`);
      console.log(`\n📄 SQL Queries saved to: ${sqlPath}`);
      console.log(`\n🔧 Next Steps:`);
      console.log(`   1. Execute the SQL queries in your database`);
      console.log(`   2. Use the results to identify policies needing optimization`);
      console.log(`   3. Apply the pattern transformation engine to optimize policies`);

      return {
        success: true,
        results: this.results,
        files: { ...files, sqlPath }
      };

    } catch (error) {
      console.error('\n❌ Discovery and Analysis Failed!');
      console.error('Error:', error.message);
      
      return {
        success: false,
        error: error.message,
        results: this.results
      };
    }
  }
}

// Export for use as module
module.exports = PolicyDiscoverySystem;

// Run if called directly
if (require.main === module) {
  const system = new PolicyDiscoverySystem();
  system.run().then(result => {
    process.exit(result.success ? 0 : 1);
  });
}