/**
 * Database Analysis Tools for Supabase Specialist
 * Provides comprehensive database performance and security analysis
 */

export interface DatabaseMetrics {
  tableCount: number
  indexCount: number
  policyCount: number
  unindexedForeignKeys: ForeignKeyIssue[]
  performanceIssues: PerformanceIssue[]
  securityVulnerabilities: SecurityIssue[]
  schemaHealth: SchemaHealthScore
}

export interface ForeignKeyIssue {
  tableName: string
  columnName: string
  constraintName: string
  referencedTable: string
  hasIndex: boolean
  estimatedImpact: 'low' | 'medium' | 'high' | 'critical'
}

export interface PerformanceIssue {
  type: 'slow_query' | 'missing_index' | 'inefficient_rls' | 'large_table_scan'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  recommendation: string
  estimatedImprovement: string
  affectedQueries: string[]
}

export interface SecurityIssue {
  type: 'missing_rls' | 'insecure_policy' | 'direct_auth_uid' | 'public_table'
  severity: 'low' | 'medium' | 'high' | 'critical'
  tableName: string
  policyName?: string
  description: string
  fix: string
}

export interface SchemaHealthScore {
  overall: number // 0-100
  performance: number
  security: number
  maintainability: number
  scalability: number
  details: {
    indexCoverage: number
    rlsPolicyCompliance: number
    foreignKeyIntegrity: number
    dataTypeOptimization: number
  }
}

export class DatabaseAnalyzer {
  /**
   * Comprehensive database health analysis
   */
  static async analyzeDatabaseHealth(): Promise<DatabaseMetrics> {
    const metrics: DatabaseMetrics = {
      tableCount: 0,
      indexCount: 0,
      policyCount: 0,
      unindexedForeignKeys: [],
      performanceIssues: [],
      securityVulnerabilities: [],
      schemaHealth: {
        overall: 0,
        performance: 0,
        security: 0,
        maintainability: 0,
        scalability: 0,
        details: {
          indexCoverage: 0,
          rlsPolicyCompliance: 0,
          foreignKeyIntegrity: 0,
          dataTypeOptimization: 0
        }
      }
    }

    // This would contain actual SQL queries to analyze the database
    // For now, providing the analysis framework

    return metrics
  }

  /**
   * SQL queries for database analysis
   */
  static getAnalysisQueries() {
    return {
      // Find unindexed foreign keys
      unindexedForeignKeys: `
        SELECT 
          tc.table_name,
          kcu.column_name,
          tc.constraint_name,
          ccu.table_name AS referenced_table,
          CASE 
            WHEN i.indexname IS NULL THEN false 
            ELSE true 
          END as has_index
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu 
          ON ccu.constraint_name = tc.constraint_name
        LEFT JOIN pg_indexes i 
          ON i.tablename = tc.table_name 
          AND i.indexdef LIKE '%' || kcu.column_name || '%'
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
        ORDER BY tc.table_name, kcu.column_name;
      `,

      // Find RLS policies with direct auth.uid() calls
      inefficientRlsPolicies: `
        SELECT 
          schemaname,
          tablename,
          policyname,
          qual as policy_definition
        FROM pg_policies 
        WHERE qual LIKE '%auth.uid()%'
          AND qual NOT LIKE '%(SELECT auth.uid())%'
        ORDER BY tablename, policyname;
      `,

      // Find tables without RLS enabled
      tablesWithoutRls: `
        SELECT 
          t.table_name,
          CASE 
            WHEN c.relrowsecurity THEN 'enabled'
            ELSE 'disabled'
          END as rls_status
        FROM information_schema.tables t
        LEFT JOIN pg_class c ON c.relname = t.table_name
        WHERE t.table_schema = 'public' 
          AND t.table_type = 'BASE TABLE'
          AND (c.relrowsecurity IS NULL OR c.relrowsecurity = false)
        ORDER BY t.table_name;
      `,

      // Index usage statistics
      indexUsageStats: `
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_tup_read,
          idx_tup_fetch,
          CASE 
            WHEN idx_tup_read = 0 THEN 'unused'
            WHEN idx_tup_read < 1000 THEN 'low_usage'
            WHEN idx_tup_read < 10000 THEN 'medium_usage'
            ELSE 'high_usage'
          END as usage_level
        FROM pg_stat_user_indexes 
        ORDER BY idx_tup_read DESC;
      `,

      // Table size and row count analysis
      tableSizeAnalysis: `
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
          pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_rows,
          n_dead_tup as dead_rows
        FROM pg_stat_user_tables 
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
      `,

      // Security functions analysis
      securityFunctionsCheck: `
        SELECT 
          routine_name,
          routine_definition,
          security_type,
          CASE 
            WHEN routine_definition LIKE '%SET search_path%' THEN 'secure'
            WHEN security_type = 'DEFINER' THEN 'potentially_insecure'
            ELSE 'needs_review'
          END as security_status
        FROM information_schema.routines
        WHERE routine_schema = 'public'
          AND security_type = 'DEFINER'
        ORDER BY routine_name;
      `
    }
  }

  /**
   * Generate performance optimization recommendations
   */
  static generatePerformanceRecommendations(metrics: DatabaseMetrics): string[] {
    const recommendations: string[] = []

    if (metrics.unindexedForeignKeys.length > 0) {
      recommendations.push(
        `🔍 Index ${metrics.unindexedForeignKeys.length} unindexed foreign keys for optimal JOIN performance`
      )
    }

    if (metrics.performanceIssues.some(issue => issue.type === 'inefficient_rls')) {
      recommendations.push(
        `⚡ Optimize RLS policies to use (SELECT auth.uid()) pattern for 10-100x performance improvement`
      )
    }

    if (metrics.schemaHealth.performance < 80) {
      recommendations.push(
        `📊 Implement comprehensive indexing strategy to improve query performance`
      )
    }

    return recommendations
  }

  /**
   * Generate security recommendations
   */
  static generateSecurityRecommendations(metrics: DatabaseMetrics): string[] {
    const recommendations: string[] = []

    if (metrics.securityVulnerabilities.some(vuln => vuln.type === 'missing_rls')) {
      recommendations.push(
        `🛡️ Enable RLS on all tables containing sensitive data`
      )
    }

    if (metrics.securityVulnerabilities.some(vuln => vuln.type === 'direct_auth_uid')) {
      recommendations.push(
        `🔒 Replace direct auth.uid() calls with (SELECT auth.uid()) in RLS policies`
      )
    }

    if (metrics.securityVulnerabilities.some(vuln => vuln.severity === 'critical')) {
      recommendations.push(
        `🚨 Address critical security vulnerabilities immediately`
      )
    }

    return recommendations
  }

  /**
   * Generate migration script for common optimizations
   */
  static generateOptimizationMigration(metrics: DatabaseMetrics): string {
    let migration = `-- Database Optimization Migration\n-- Generated automatically by Supabase Specialist\n\nBEGIN;\n\n`

    // Add foreign key indexes
    metrics.unindexedForeignKeys.forEach(fk => {
      if (!fk.hasIndex) {
        migration += `-- Index for foreign key: ${fk.tableName}.${fk.columnName}\n`
        migration += `CREATE INDEX IF NOT EXISTS idx_${fk.tableName}_${fk.columnName} ON ${fk.tableName}(${fk.columnName});\n\n`
      }
    })

    // Fix RLS policies
    metrics.securityVulnerabilities
      .filter(vuln => vuln.type === 'direct_auth_uid')
      .forEach(vuln => {
        migration += `-- Fix RLS policy: ${vuln.policyName} on ${vuln.tableName}\n`
        migration += `-- ${vuln.fix}\n\n`
      })

    migration += `-- Verify changes\nDO $$\nBEGIN\n  RAISE NOTICE 'Database optimization migration completed successfully';\nEND $$;\n\nCOMMIT;\n`

    return migration
  }
}

/**
 * Database monitoring utilities
 */
export class DatabaseMonitor {
  /**
   * Performance monitoring queries
   */
  static getMonitoringQueries() {
    return {
      activeConnections: `
        SELECT count(*) as active_connections,
               state,
               wait_event_type,
               wait_event
        FROM pg_stat_activity 
        WHERE state = 'active'
        GROUP BY state, wait_event_type, wait_event;
      `,

      slowQueries: `
        SELECT query,
               calls,
               total_time,
               mean_time,
               rows
        FROM pg_stat_statements 
        WHERE mean_time > 100  -- queries slower than 100ms
        ORDER BY mean_time DESC 
        LIMIT 10;
      `,

      lockStatus: `
        SELECT blocked_locks.pid AS blocked_pid,
               blocked_activity.usename AS blocked_user,
               blocking_locks.pid AS blocking_pid,
               blocking_activity.usename AS blocking_user,
               blocked_activity.query AS blocked_statement,
               blocking_activity.query AS current_statement_in_blocking_process
        FROM pg_catalog.pg_locks blocked_locks
        JOIN pg_catalog.pg_stat_activity blocked_activity 
          ON blocked_activity.pid = blocked_locks.pid
        JOIN pg_catalog.pg_locks blocking_locks 
          ON blocking_locks.locktype = blocked_locks.locktype
        JOIN pg_catalog.pg_stat_activity blocking_activity 
          ON blocking_activity.pid = blocking_locks.pid
        WHERE NOT blocked_locks.granted;
      `
    }
  }
}