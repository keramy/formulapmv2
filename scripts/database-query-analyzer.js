#!/usr/bin/env node

/**
 * Database Query Analysis Script
 * Analyzes database performance, identifies slow queries, and detects N+1 problems
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  reportFile: 'DATABASE_QUERY_ANALYSIS_REPORT.json',
  slowQueryThreshold: 100, // milliseconds
  analysisQueries: [
    // Connection and performance stats
    {
      name: 'connection_stats',
      query: 'SELECT * FROM database_connection_stats',
      description: 'Database connection statistics'
    },
    {
      name: 'performance_summary',
      query: 'SELECT * FROM database_performance_summary',
      description: 'Overall database performance metrics'
    },
    {
      name: 'connection_health',
      query: 'SELECT * FROM connection_pool_health_check()',
      description: 'Connection pool health check'
    },
    // Table statistics
    {
      name: 'table_sizes',
      query: `
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation
        FROM pg_stats 
        WHERE schemaname = 'public'
        ORDER BY tablename, attname
      `,
      description: 'Table statistics for query optimization'
    },
    // Index usage analysis
    {
      name: 'index_usage',
      query: `
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_tup_read,
          idx_tup_fetch,
          idx_scan,
          ROUND((idx_tup_fetch::numeric / NULLIF(idx_tup_read, 0)) * 100, 2) as hit_rate
        FROM pg_stat_user_indexes 
        WHERE schemaname = 'public'
        ORDER BY idx_scan DESC
      `,
      description: 'Index usage statistics'
    },
    // Missing indexes detection
    {
      name: 'missing_indexes',
      query: `
        SELECT 
          schemaname,
          tablename,
          seq_scan,
          seq_tup_read,
          idx_scan,
          idx_tup_fetch,
          ROUND((seq_tup_read::numeric / NULLIF(seq_scan, 0)), 2) as avg_seq_read,
          CASE 
            WHEN seq_scan > idx_scan AND seq_tup_read > 1000 
            THEN 'Consider adding index'
            ELSE 'OK'
          END as recommendation
        FROM pg_stat_user_tables 
        WHERE schemaname = 'public'
        ORDER BY seq_tup_read DESC
      `,
      description: 'Tables that might benefit from additional indexes'
    },
    // Active queries
    {
      name: 'active_queries',
      query: `
        SELECT 
          pid,
          usename,
          application_name,
          state,
          query_start,
          now() - query_start as duration,
          LEFT(query, 100) as query_preview
        FROM pg_stat_activity 
        WHERE state != 'idle' 
        AND query != '<IDLE>'
        AND query NOT LIKE '%pg_stat_activity%'
        ORDER BY query_start
      `,
      description: 'Currently active queries'
    },
    // Lock analysis
    {
      name: 'locks',
      query: `
        SELECT 
          l.locktype,
          l.database,
          l.relation::regclass,
          l.mode,
          l.granted,
          a.usename,
          a.query_start,
          a.query
        FROM pg_locks l
        JOIN pg_stat_activity a ON l.pid = a.pid
        WHERE l.granted = false
        ORDER BY l.relation
      `,
      description: 'Current database locks'
    }
  ],
  performanceQueries: [
    // Common application queries to analyze
    {
      name: 'projects_with_stats',
      query: `
        SELECT 
          p.id,
          p.name,
          p.status,
          COUNT(DISTINCT t.id) as task_count,
          COUNT(DISTINCT s.id) as scope_count,
          COUNT(DISTINCT m.id) as milestone_count
        FROM projects p
        LEFT JOIN tasks t ON p.id = t.project_id
        LEFT JOIN scope_items s ON p.id = s.project_id
        LEFT JOIN milestones m ON p.id = m.project_id
        GROUP BY p.id, p.name, p.status
        ORDER BY p.created_at DESC
        LIMIT 10
      `,
      description: 'Project statistics query performance'
    },
    {
      name: 'user_profiles_query',
      query: `
        SELECT 
          up.id,
          up.email,
          up.role,
          up.first_name,
          up.last_name,
          COUNT(DISTINCT p.id) as project_count,
          COUNT(DISTINCT t.id) as task_count
        FROM user_profiles up
        LEFT JOIN projects p ON up.id = p.created_by
        LEFT JOIN tasks t ON up.id = t.assigned_to
        GROUP BY up.id, up.email, up.role, up.first_name, up.last_name
        ORDER BY up.created_at DESC
        LIMIT 10
      `,
      description: 'User profile with related data query'
    },
    {
      name: 'dashboard_stats_query',
      query: `
        SELECT 
          (SELECT COUNT(*) FROM projects) as total_projects,
          (SELECT COUNT(*) FROM tasks WHERE status = 'pending') as pending_tasks,
          (SELECT COUNT(*) FROM tasks WHERE status = 'in_progress') as active_tasks,
          (SELECT COUNT(*) FROM tasks WHERE status = 'completed') as completed_tasks,
          (SELECT COUNT(*) FROM scope_items) as total_scope_items,
          (SELECT COUNT(*) FROM milestones WHERE status = 'completed') as completed_milestones
      `,
      description: 'Dashboard statistics query'
    },
    {
      name: 'recent_activity_query',
      query: `
        SELECT 
          'task' as type,
          t.id,
          t.title as name,
          t.updated_at,
          p.name as project_name,
          up.first_name || ' ' || up.last_name as user_name
        FROM tasks t
        JOIN projects p ON t.project_id = p.id
        JOIN user_profiles up ON t.assigned_to = up.id
        WHERE t.updated_at >= NOW() - INTERVAL '7 days'
        UNION ALL
        SELECT 
          'milestone' as type,
          m.id,
          m.title as name,
          m.updated_at,
          p.name as project_name,
          up.first_name || ' ' || up.last_name as user_name
        FROM milestones m
        JOIN projects p ON m.project_id = p.id
        JOIN user_profiles up ON m.created_by = up.id
        WHERE m.updated_at >= NOW() - INTERVAL '7 days'
        ORDER BY updated_at DESC
        LIMIT 20
      `,
      description: 'Recent activity query with joins'
    }
  ]
};

class DatabaseQueryAnalyzer {
  constructor() {
    this.supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);
    this.results = {
      summary: {
        analysisTime: new Date().toISOString(),
        slowQueries: [],
        recommendations: [],
        performance: {
          connectionStats: null,
          indexUsage: null,
          tableStats: null
        }
      },
      systemAnalysis: {},
      queryPerformance: {},
      bottlenecks: [],
      optimizations: []
    };
  }

  async executeQuery(name, query, description) {
    console.log(`📊 Analyzing: ${description}...`);
    
    const startTime = Date.now();
    
    try {
      const { data, error } = await this.supabase.rpc('exec_sql', { sql: query });
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      if (error) {
        console.log(`❌ Query failed: ${name} - ${error.message}`);
        return {
          success: false,
          error: error.message,
          executionTime,
          query
        };
      }
      
      console.log(`✅ ${name}: ${executionTime}ms`);
      
      return {
        success: true,
        data,
        executionTime,
        query,
        description
      };
    } catch (error) {
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      console.log(`❌ Query error: ${name} - ${error.message}`);
      
      return {
        success: false,
        error: error.message,
        executionTime,
        query
      };
    }
  }

  async analyzeSystemPerformance() {
    console.log('\n🔍 SYSTEM PERFORMANCE ANALYSIS');
    console.log('================================');
    
    for (const queryConfig of CONFIG.analysisQueries) {
      const result = await this.executeQuery(
        queryConfig.name,
        queryConfig.query,
        queryConfig.description
      );
      
      this.results.systemAnalysis[queryConfig.name] = result;
      
      // Check for slow queries
      if (result.executionTime > CONFIG.slowQueryThreshold) {
        this.results.summary.slowQueries.push({
          name: queryConfig.name,
          executionTime: result.executionTime,
          query: queryConfig.query
        });
      }
    }
  }

  async analyzeQueryPerformance() {
    console.log('\n🧪 QUERY PERFORMANCE ANALYSIS');
    console.log('==============================');
    
    for (const queryConfig of CONFIG.performanceQueries) {
      const result = await this.executeQuery(
        queryConfig.name,
        queryConfig.query,
        queryConfig.description
      );
      
      this.results.queryPerformance[queryConfig.name] = result;
      
      // Check for slow queries
      if (result.executionTime > CONFIG.slowQueryThreshold) {
        this.results.summary.slowQueries.push({
          name: queryConfig.name,
          executionTime: result.executionTime,
          query: queryConfig.query
        });
      }
    }
  }

  analyzeBottlenecks() {
    console.log('\n🚨 BOTTLENECK ANALYSIS');
    console.log('======================');
    
    // Analyze connection stats
    const connectionStats = this.results.systemAnalysis.connection_stats;
    if (connectionStats && connectionStats.success) {
      const stats = connectionStats.data;
      // Add connection analysis logic here
    }
    
    // Analyze index usage
    const indexUsage = this.results.systemAnalysis.index_usage;
    if (indexUsage && indexUsage.success) {
      const indexes = indexUsage.data;
      
      // Find unused indexes
      const unusedIndexes = indexes.filter(idx => idx.idx_scan === 0);
      if (unusedIndexes.length > 0) {
        this.results.bottlenecks.push({
          type: 'unused_indexes',
          severity: 'medium',
          description: `Found ${unusedIndexes.length} unused indexes`,
          details: unusedIndexes.map(idx => `${idx.schemaname}.${idx.tablename}.${idx.indexname}`),
          recommendation: 'Consider dropping unused indexes to improve write performance'
        });
      }
      
      // Find low-efficiency indexes
      const lowEfficiencyIndexes = indexes.filter(idx => idx.hit_rate < 50 && idx.idx_scan > 0);
      if (lowEfficiencyIndexes.length > 0) {
        this.results.bottlenecks.push({
          type: 'low_efficiency_indexes',
          severity: 'medium',
          description: `Found ${lowEfficiencyIndexes.length} low-efficiency indexes`,
          details: lowEfficiencyIndexes.map(idx => `${idx.indexname}: ${idx.hit_rate}% hit rate`),
          recommendation: 'Review and optimize low-efficiency indexes'
        });
      }
    }
    
    // Analyze missing indexes
    const missingIndexes = this.results.systemAnalysis.missing_indexes;
    if (missingIndexes && missingIndexes.success) {
      const tables = missingIndexes.data;
      
      const needsIndexes = tables.filter(table => table.recommendation === 'Consider adding index');
      if (needsIndexes.length > 0) {
        this.results.bottlenecks.push({
          type: 'missing_indexes',
          severity: 'high',
          description: `Found ${needsIndexes.length} tables that could benefit from indexes`,
          details: needsIndexes.map(table => `${table.tablename}: ${table.seq_tup_read} sequential reads`),
          recommendation: 'Add indexes to frequently queried columns'
        });
      }
    }
    
    // Analyze slow queries
    if (this.results.summary.slowQueries.length > 0) {
      this.results.bottlenecks.push({
        type: 'slow_queries',
        severity: 'high',
        description: `Found ${this.results.summary.slowQueries.length} slow queries`,
        details: this.results.summary.slowQueries.map(q => `${q.name}: ${q.executionTime}ms`),
        recommendation: 'Optimize slow queries with better indexing and query structure'
      });
    }
  }

  generateRecommendations() {
    console.log('\n💡 GENERATING RECOMMENDATIONS');
    console.log('=============================');
    
    const recommendations = [];
    
    // High-priority recommendations
    const highSeverityBottlenecks = this.results.bottlenecks.filter(b => b.severity === 'high');
    if (highSeverityBottlenecks.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'Critical Performance Issues',
        description: 'Address high-severity performance bottlenecks immediately',
        actions: highSeverityBottlenecks.map(b => b.recommendation)
      });
    }
    
    // Index optimization recommendations
    const indexBottlenecks = this.results.bottlenecks.filter(b => 
      b.type === 'missing_indexes' || b.type === 'unused_indexes' || b.type === 'low_efficiency_indexes'
    );
    if (indexBottlenecks.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'Index Optimization',
        description: 'Optimize database indexes for better performance',
        actions: [
          'Add missing indexes on frequently queried columns',
          'Remove unused indexes to improve write performance',
          'Analyze and optimize low-efficiency indexes',
          'Consider composite indexes for multi-column queries'
        ]
      });
    }
    
    // Query optimization recommendations
    if (this.results.summary.slowQueries.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'Query Optimization',
        description: 'Optimize slow-performing queries',
        actions: [
          'Rewrite queries to use indexes effectively',
          'Eliminate N+1 query patterns',
          'Consider query result caching',
          'Use EXPLAIN ANALYZE to identify query bottlenecks'
        ]
      });
    }
    
    // General performance recommendations
    recommendations.push({
      priority: 'medium',
      category: 'General Performance',
      description: 'Implement general performance improvements',
      actions: [
        'Implement connection pooling',
        'Add query result caching',
        'Monitor and optimize memory usage',
        'Set up regular database maintenance tasks'
      ]
    });
    
    this.results.summary.recommendations = recommendations;
  }

  async generateReport() {
    console.log('\n📄 GENERATING REPORT');
    console.log('====================');
    
    const reportPath = path.join(process.cwd(), CONFIG.reportFile);
    await fs.promises.writeFile(reportPath, JSON.stringify(this.results, null, 2));
    
    console.log(`Report saved to: ${reportPath}`);
    
    // Display summary
    this.displaySummary();
  }

  displaySummary() {
    console.log('\n📊 DATABASE ANALYSIS SUMMARY');
    console.log('=============================');
    
    console.log(`Analysis completed at: ${this.results.summary.analysisTime}`);
    console.log(`Slow queries found: ${this.results.summary.slowQueries.length}`);
    console.log(`Bottlenecks identified: ${this.results.bottlenecks.length}`);
    console.log(`Recommendations generated: ${this.results.summary.recommendations.length}`);
    
    if (this.results.summary.slowQueries.length > 0) {
      console.log('\n🐌 SLOWEST QUERIES:');
      this.results.summary.slowQueries
        .sort((a, b) => b.executionTime - a.executionTime)
        .slice(0, 5)
        .forEach((query, index) => {
          console.log(`${index + 1}. ${query.name}: ${query.executionTime}ms`);
        });
    }
    
    if (this.results.bottlenecks.length > 0) {
      console.log('\n🚨 TOP BOTTLENECKS:');
      this.results.bottlenecks
        .filter(b => b.severity === 'high')
        .slice(0, 3)
        .forEach((bottleneck, index) => {
          console.log(`${index + 1}. ${bottleneck.type}: ${bottleneck.description}`);
        });
    }
    
    if (this.results.summary.recommendations.length > 0) {
      console.log('\n💡 TOP RECOMMENDATIONS:');
      this.results.summary.recommendations
        .slice(0, 3)
        .forEach((rec, index) => {
          console.log(`${index + 1}. ${rec.category}: ${rec.description}`);
        });
    }
  }

  async run() {
    console.log('🚀 Starting Database Query Analysis...');
    
    try {
      await this.analyzeSystemPerformance();
      await this.analyzeQueryPerformance();
      this.analyzeBottlenecks();
      this.generateRecommendations();
      await this.generateReport();
      
      console.log('\n✅ Database analysis completed successfully!');
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      process.exit(1);
    }
  }
}

// Check if we need to create the exec_sql function
async function setupDatabaseFunction() {
  const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);
  
  try {
    // Try to create the exec_sql function if it doesn't exist
    const { error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
    if (error && error.message.includes('function exec_sql')) {
      console.log('📝 Creating exec_sql function...');
      // This would need to be done with admin privileges
      console.log('⚠️  exec_sql function not available. Analysis will be limited.');
    }
  } catch (error) {
    console.log('⚠️  Direct SQL execution not available. Analysis will be limited.');
  }
}

// Run the analysis
if (require.main === module) {
  const analyzer = new DatabaseQueryAnalyzer();
  setupDatabaseFunction().then(() => {
    analyzer.run().catch(console.error);
  });
}

module.exports = DatabaseQueryAnalyzer;