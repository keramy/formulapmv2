#!/usr/bin/env node

/**
 * Comprehensive RLS Optimization Validation System
 * 
 * This script provides comprehensive validation for RLS policy optimizations,
 * including verification queries, status tracking, and patterns for future development.
 * 
 * Requirements: 3.3, 3.4, 3.5
 */

const fs = require('fs');
const path = require('path');

class ComprehensiveValidationSystem {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      validation_status: 'initialized',
      validation_results: {},
      optimization_metrics: {},
      patterns_for_future_agents: {},
      recommendations: []
    };
  }

  /**
   * Generate optimization verification queries
   * These queries count optimized vs unoptimized policies per table
   */
  getOptimizationVerificationQueries() {
    return {
      // Query 1: Count optimized vs unoptimized policies per table
      policy_optimization_status: `
        -- RLS Policy Optimization Status by Table
        -- This query shows the optimization status of all policies with auth function calls
        
        SELECT 
          tablename,
          COUNT(*) as total_policies_with_auth,
          
          -- Count optimized policies (using SELECT subqueries)
          COUNT(CASE 
            WHEN (qual LIKE '%(SELECT auth.uid())%' OR qual LIKE '%(SELECT auth.jwt())%' OR
                  with_check LIKE '%(SELECT auth.uid())%' OR with_check LIKE '%(SELECT auth.jwt())%')
            THEN 1 
          END) as optimized_policies,
          
          -- Count policies needing optimization (direct calls)
          COUNT(CASE 
            WHEN (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%') OR
                 (qual LIKE '%auth.jwt()%' AND qual NOT LIKE '%(SELECT auth.jwt())%') OR
                 (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%') OR
                 (with_check LIKE '%auth.jwt()%' AND with_check NOT LIKE '%(SELECT auth.jwt())%')
            THEN 1 
          END) as policies_needing_optimization,
          
          -- Calculate optimization percentage
          CASE 
            WHEN COUNT(*) > 0 THEN
              ROUND(
                COUNT(CASE 
                  WHEN (qual LIKE '%(SELECT auth.uid())%' OR qual LIKE '%(SELECT auth.jwt())%' OR
                        with_check LIKE '%(SELECT auth.uid())%' OR with_check LIKE '%(SELECT auth.jwt())%')
                  THEN 1 
                END) * 100.0 / COUNT(*), 2
              )
            ELSE 0
          END as optimization_percentage,
          
          -- Status classification
          CASE 
            WHEN COUNT(CASE 
              WHEN (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%') OR
                   (qual LIKE '%auth.jwt()%' AND qual NOT LIKE '%(SELECT auth.jwt())%') OR
                   (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%') OR
                   (with_check LIKE '%auth.jwt()%' AND with_check NOT LIKE '%(SELECT auth.jwt())%')
              THEN 1 
            END) = 0 THEN '✅ FULLY_OPTIMIZED'
            WHEN COUNT(CASE 
              WHEN (qual LIKE '%(SELECT auth.uid())%' OR qual LIKE '%(SELECT auth.jwt())%' OR
                    with_check LIKE '%(SELECT auth.uid())%' OR with_check LIKE '%(SELECT auth.jwt())%')
              THEN 1 
            END) > 0 THEN '🔄 PARTIALLY_OPTIMIZED'
            ELSE '❌ NOT_OPTIMIZED'
          END as optimization_status
          
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND (
          qual LIKE '%auth.uid()%' OR 
          qual LIKE '%auth.jwt()%' OR
          with_check LIKE '%auth.uid()%' OR
          with_check LIKE '%auth.jwt()%'
        )
        GROUP BY tablename
        ORDER BY policies_needing_optimization DESC, tablename;
      `,

      // Query 2: Detect nested SELECT issues
      nested_select_detection: `
        -- Detect Problematic Nested SELECT Patterns
        -- This query identifies policies that might have nested SELECT issues
        
        SELECT 
          tablename,
          policyname,
          cmd as policy_type,
          
          -- Check for problematic patterns in qual
          CASE 
            WHEN qual LIKE '%SELECT%SELECT%' THEN 'NESTED_SELECT_IN_QUAL'
            WHEN qual LIKE '%((SELECT%' THEN 'DOUBLE_PAREN_SELECT_IN_QUAL'
            ELSE NULL
          END as qual_issues,
          
          -- Check for problematic patterns in with_check
          CASE 
            WHEN with_check LIKE '%SELECT%SELECT%' THEN 'NESTED_SELECT_IN_CHECK'
            WHEN with_check LIKE '%((SELECT%' THEN 'DOUBLE_PAREN_SELECT_IN_CHECK'
            ELSE NULL
          END as with_check_issues,
          
          qual as condition_clause,
          with_check as check_clause,
          
          -- Severity assessment
          CASE 
            WHEN (qual LIKE '%SELECT%SELECT%' OR with_check LIKE '%SELECT%SELECT%') THEN 'HIGH'
            WHEN (qual LIKE '%((SELECT%' OR with_check LIKE '%((SELECT%') THEN 'MEDIUM'
            ELSE 'LOW'
          END as issue_severity
          
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND (
          qual LIKE '%SELECT%SELECT%' OR 
          with_check LIKE '%SELECT%SELECT%' OR
          qual LIKE '%((SELECT%' OR 
          with_check LIKE '%((SELECT%'
        )
        ORDER BY 
          CASE issue_severity
            WHEN 'HIGH' THEN 1
            WHEN 'MEDIUM' THEN 2
            ELSE 3
          END,
          tablename, policyname;
      `,

      // Query 3: Before/After comparison template
      before_after_comparison: `
        -- Before/After Optimization Comparison Template
        -- Use this query to compare policy states before and after optimization
        
        WITH policy_analysis AS (
          SELECT 
            tablename,
            policyname,
            cmd,
            qual,
            with_check,
            
            -- Count direct auth calls (BEFORE optimization)
            (LENGTH(COALESCE(qual, '')) - LENGTH(REPLACE(COALESCE(qual, ''), 'auth.uid()', ''))) / LENGTH('auth.uid()') +
            (LENGTH(COALESCE(with_check, '')) - LENGTH(REPLACE(COALESCE(with_check, ''), 'auth.uid()', ''))) / LENGTH('auth.uid()') +
            (LENGTH(COALESCE(qual, '')) - LENGTH(REPLACE(COALESCE(qual, ''), 'auth.jwt()', ''))) / LENGTH('auth.jwt()') +
            (LENGTH(COALESCE(with_check, '')) - LENGTH(REPLACE(COALESCE(with_check, ''), 'auth.jwt()', ''))) / LENGTH('auth.jwt()') as total_direct_calls,
            
            -- Count optimized calls (AFTER optimization)
            (LENGTH(COALESCE(qual, '')) - LENGTH(REPLACE(COALESCE(qual, ''), '(SELECT auth.uid())', ''))) / LENGTH('(SELECT auth.uid())') +
            (LENGTH(COALESCE(with_check, '')) - LENGTH(REPLACE(COALESCE(with_check, ''), '(SELECT auth.uid())', ''))) / LENGTH('(SELECT auth.uid())') +
            (LENGTH(COALESCE(qual, '')) - LENGTH(REPLACE(COALESCE(qual, ''), '(SELECT auth.jwt())', ''))) / LENGTH('(SELECT auth.jwt())') +
            (LENGTH(COALESCE(with_check, '')) - LENGTH(REPLACE(COALESCE(with_check, ''), '(SELECT auth.jwt())', ''))) / LENGTH('(SELECT auth.jwt())') as total_optimized_calls,
            
            -- Optimization status
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
            END as current_status
            
          FROM pg_policies 
          WHERE schemaname = 'public'
        )
        SELECT 
          tablename,
          COUNT(*) as total_policies,
          SUM(total_direct_calls) as total_direct_calls_found,
          SUM(total_optimized_calls) as total_optimized_calls_found,
          COUNT(CASE WHEN current_status = 'OPTIMIZED' THEN 1 END) as optimized_policies,
          COUNT(CASE WHEN current_status = 'NEEDS_OPTIMIZATION' THEN 1 END) as policies_needing_optimization,
          ROUND(
            COUNT(CASE WHEN current_status = 'OPTIMIZED' THEN 1 END) * 100.0 / 
            NULLIF(COUNT(CASE WHEN current_status IN ('OPTIMIZED', 'NEEDS_OPTIMIZATION') THEN 1 END), 0), 2
          ) as optimization_progress_percentage
        FROM policy_analysis
        WHERE current_status IN ('OPTIMIZED', 'NEEDS_OPTIMIZATION')
        GROUP BY tablename
        ORDER BY policies_needing_optimization DESC, tablename;
      `,

      // Query 4: Comprehensive validation checklist
      validation_checklist: `
        -- Comprehensive RLS Optimization Validation Checklist
        -- This query provides a complete validation report
        
        WITH validation_metrics AS (
          SELECT 
            -- Overall counts
            COUNT(*) as total_policies_with_auth,
            COUNT(CASE 
              WHEN (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%') OR
                   (qual LIKE '%auth.jwt()%' AND qual NOT LIKE '%(SELECT auth.jwt())%') OR
                   (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%') OR
                   (with_check LIKE '%auth.jwt()%' AND with_check NOT LIKE '%(SELECT auth.jwt())%')
              THEN 1 
            END) as policies_with_direct_calls,
            COUNT(CASE 
              WHEN (qual LIKE '%(SELECT auth.uid())%' OR qual LIKE '%(SELECT auth.jwt())%' OR
                    with_check LIKE '%(SELECT auth.uid())%' OR with_check LIKE '%(SELECT auth.jwt())%')
              THEN 1 
            END) as policies_with_optimized_calls,
            
            -- Problem detection
            COUNT(CASE 
              WHEN qual LIKE '%SELECT%SELECT%' OR with_check LIKE '%SELECT%SELECT%'
              THEN 1 
            END) as policies_with_nested_select,
            COUNT(CASE 
              WHEN qual LIKE '%((SELECT%' OR with_check LIKE '%((SELECT%'
              THEN 1 
            END) as policies_with_double_paren_select
            
          FROM pg_policies 
          WHERE schemaname = 'public'
          AND (
            qual LIKE '%auth.uid()%' OR 
            qual LIKE '%auth.jwt()%' OR
            with_check LIKE '%auth.uid()%' OR
            with_check LIKE '%auth.jwt()%'
          )
        )
        SELECT 
          '📊 OPTIMIZATION VALIDATION REPORT' as report_section,
          '' as separator,
          
          -- Validation results
          CASE WHEN policies_with_direct_calls = 0 THEN '✅ PASS' ELSE '❌ FAIL' END as direct_calls_eliminated,
          policies_with_direct_calls as remaining_direct_calls,
          
          CASE WHEN policies_with_optimized_calls > 0 THEN '✅ PASS' ELSE '❌ FAIL' END as optimizations_applied,
          policies_with_optimized_calls as total_optimized_policies,
          
          CASE WHEN policies_with_nested_select = 0 THEN '✅ PASS' ELSE '⚠️ WARNING' END as no_nested_select_issues,
          policies_with_nested_select as nested_select_count,
          
          CASE WHEN policies_with_double_paren_select = 0 THEN '✅ PASS' ELSE '⚠️ WARNING' END as no_double_paren_issues,
          policies_with_double_paren_select as double_paren_count,
          
          -- Overall status
          CASE 
            WHEN policies_with_direct_calls = 0 AND policies_with_optimized_calls > 0 
            THEN '🎉 OPTIMIZATION COMPLETE'
            WHEN policies_with_direct_calls > 0 AND policies_with_optimized_calls > 0 
            THEN '🔄 OPTIMIZATION IN PROGRESS'
            WHEN policies_with_direct_calls > 0 AND policies_with_optimized_calls = 0 
            THEN '❌ OPTIMIZATION NOT STARTED'
            ELSE '❓ UNKNOWN STATUS'
          END as overall_optimization_status,
          
          -- Progress percentage
          CASE 
            WHEN total_policies_with_auth > 0 THEN
              ROUND(policies_with_optimized_calls * 100.0 / total_policies_with_auth, 2)
            ELSE 0
          END as optimization_progress_percentage
          
        FROM validation_metrics;
      `
    };
  }

  /**
   * Generate patterns and templates for future AI agents
   * This creates reusable patterns that other agents can follow
   */
  generatePatternsForFutureAgents() {
    return {
      // Pattern 1: New Policy Creation Template
      new_policy_creation_pattern: {
        description: "Template for creating new RLS policies that are already optimized",
        template: `
          -- ✅ OPTIMIZED RLS Policy Template for Future Development
          -- Use this pattern when creating new policies to ensure they're already optimized
          
          CREATE POLICY "policy_name" ON "table_name"
          AS PERMISSIVE FOR [SELECT|INSERT|UPDATE|DELETE]
          TO authenticated
          USING (
            -- ✅ GOOD: Use subquery pattern for auth functions
            user_id = (SELECT auth.uid())
            AND status = 'active'
            
            -- ✅ GOOD: Complex conditions with optimized auth calls
            OR (
              role = 'admin' 
              AND ((SELECT auth.jwt()) ->> 'role') = 'admin'
            )
          )
          WITH CHECK (
            -- ✅ GOOD: Optimized auth calls in WITH CHECK clause
            user_id = (SELECT auth.uid())
            AND created_by = (SELECT auth.uid())
          );
        `,
        anti_patterns: `
          -- ❌ AVOID: Direct auth function calls (these need optimization)
          
          CREATE POLICY "bad_policy" ON "table_name"
          USING (
            user_id = auth.uid()  -- ❌ Direct call, needs optimization
            AND (auth.jwt() ->> 'role') = 'admin'  -- ❌ Direct call, needs optimization
          );
        `,
        validation_query: `
          -- Use this query to validate new policies follow the optimized pattern
          SELECT 
            policyname,
            CASE 
              WHEN (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%') OR
                   (qual LIKE '%auth.jwt()%' AND qual NOT LIKE '%(SELECT auth.jwt())%') OR
                   (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%') OR
                   (with_check LIKE '%auth.jwt()%' AND with_check NOT LIKE '%(SELECT auth.jwt())%')
              THEN '❌ NEEDS_OPTIMIZATION'
              WHEN (qual LIKE '%(SELECT auth.uid())%' OR qual LIKE '%(SELECT auth.jwt())%' OR
                    with_check LIKE '%(SELECT auth.uid())%' OR with_check LIKE '%(SELECT auth.jwt())%')
              THEN '✅ ALREADY_OPTIMIZED'
              ELSE '⚪ NO_AUTH_CALLS'
            END as optimization_status
          FROM pg_policies 
          WHERE schemaname = 'public' 
          AND tablename = 'your_new_table_name';
        `
      },

      // Pattern 2: Schema Migration with RLS Optimization
      schema_migration_pattern: {
        description: "Pattern for including RLS optimization in schema migrations",
        template: `
          -- Schema Migration with RLS Optimization Template
          -- Use this pattern when creating new tables or modifying existing ones
          
          BEGIN;
          
          -- 1. Create or modify table schema
          CREATE TABLE IF NOT EXISTS new_table (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            -- ... other columns
          );
          
          -- 2. Enable RLS
          ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
          
          -- 3. Create optimized policies from the start
          CREATE POLICY "new_table_select_policy" ON "new_table"
          AS PERMISSIVE FOR SELECT
          TO authenticated
          USING (user_id = (SELECT auth.uid()));  -- ✅ Already optimized
          
          CREATE POLICY "new_table_insert_policy" ON "new_table"
          AS PERMISSIVE FOR INSERT
          TO authenticated
          WITH CHECK (user_id = (SELECT auth.uid()));  -- ✅ Already optimized
          
          -- 4. Validate optimization (optional check)
          DO $$
          BEGIN
            IF EXISTS (
              SELECT 1 FROM pg_policies 
              WHERE schemaname = 'public' 
              AND tablename = 'new_table'
              AND (
                (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%') OR
                (qual LIKE '%auth.jwt()%' AND qual NOT LIKE '%(SELECT auth.jwt())%') OR
                (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%') OR
                (with_check LIKE '%auth.jwt()%' AND with_check NOT LIKE '%(SELECT auth.jwt())%')
              )
            ) THEN
              RAISE EXCEPTION 'New policies contain unoptimized auth function calls';
            END IF;
          END $$;
          
          COMMIT;
        `
      },

      // Pattern 3: API Development with RLS Awareness
      api_development_pattern: {
        description: "Pattern for developing APIs that work efficiently with optimized RLS",
        typescript_example: `
          // ✅ GOOD: API Route with RLS Optimization Awareness
          // This pattern ensures your API works efficiently with optimized RLS policies
          
          import { createClient } from '@supabase/supabase-js';
          
          export async function GET(request: Request) {
            const supabase = createClient(url, key);
            
            // ✅ GOOD: Let RLS handle filtering efficiently
            // The optimized policies will use (SELECT auth.uid()) efficiently
            const { data, error } = await supabase
              .from('your_table')
              .select('*')
              // Don't add manual user_id filtering - let RLS handle it
              .order('created_at', { ascending: false });
            
            if (error) {
              return Response.json({ error: error.message }, { status: 500 });
            }
            
            return Response.json({ data });
          }
          
          // ❌ AVOID: Manual filtering that duplicates RLS logic
          export async function BAD_GET(request: Request) {
            const supabase = createClient(url, key);
            const { data: { user } } = await supabase.auth.getUser();
            
            // ❌ This duplicates what RLS already does efficiently
            const { data, error } = await supabase
              .from('your_table')
              .select('*')
              .eq('user_id', user?.id)  // ❌ Redundant with RLS
              .order('created_at', { ascending: false });
            
            return Response.json({ data });
          }
        `
      },

      // Pattern 4: Testing Optimized RLS Policies
      testing_pattern: {
        description: "Pattern for testing RLS policies to ensure they work correctly after optimization",
        test_template: `
          -- RLS Policy Testing Template
          -- Use these queries to test that optimized policies work correctly
          
          -- Test 1: Verify policy exists and is optimized
          SELECT 
            policyname,
            cmd,
            qual,
            with_check,
            CASE 
              WHEN (qual LIKE '%(SELECT auth.uid())%' OR qual LIKE '%(SELECT auth.jwt())%' OR
                    with_check LIKE '%(SELECT auth.uid())%' OR with_check LIKE '%(SELECT auth.jwt())%')
              THEN '✅ OPTIMIZED'
              ELSE '❌ NOT_OPTIMIZED'
            END as optimization_status
          FROM pg_policies 
          WHERE schemaname = 'public' 
          AND tablename = 'test_table_name';
          
          -- Test 2: Verify policy behavior (run as different users)
          -- This should be run in your application tests
          SET ROLE authenticated;
          SET request.jwt.claims TO '{"sub": "user-id-1", "role": "authenticated"}';
          
          -- Should return only records for user-id-1
          SELECT * FROM test_table_name;
          
          -- Test 3: Performance test (check execution plan)
          EXPLAIN (ANALYZE, BUFFERS) 
          SELECT * FROM test_table_name 
          WHERE created_at > NOW() - INTERVAL '1 day';
        `
      },

      // Pattern 5: Monitoring and Maintenance
      monitoring_pattern: {
        description: "Pattern for ongoing monitoring of RLS optimization status",
        monitoring_queries: `
          -- Daily RLS Optimization Health Check
          -- Add this to your monitoring/alerting system
          
          WITH optimization_health AS (
            SELECT 
              COUNT(*) as total_policies_with_auth,
              COUNT(CASE 
                WHEN (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%') OR
                     (qual LIKE '%auth.jwt()%' AND qual NOT LIKE '%(SELECT auth.jwt())%') OR
                     (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%') OR
                     (with_check LIKE '%auth.jwt()%' AND with_check NOT LIKE '%(SELECT auth.jwt())%')
                THEN 1 
              END) as unoptimized_policies
            FROM pg_policies 
            WHERE schemaname = 'public'
            AND (
              qual LIKE '%auth.uid()%' OR 
              qual LIKE '%auth.jwt()%' OR
              with_check LIKE '%auth.uid()%' OR
              with_check LIKE '%auth.jwt()%'
            )
          )
          SELECT 
            total_policies_with_auth,
            unoptimized_policies,
            CASE 
              WHEN unoptimized_policies = 0 THEN '✅ ALL_OPTIMIZED'
              WHEN unoptimized_policies <= 5 THEN '⚠️ MINOR_ISSUES'
              ELSE '❌ OPTIMIZATION_NEEDED'
            END as health_status,
            ROUND(
              (total_policies_with_auth - unoptimized_policies) * 100.0 / 
              NULLIF(total_policies_with_auth, 0), 2
            ) as optimization_percentage
          FROM optimization_health;
        `
      }
    };
  }

  /**
   * Generate comprehensive validation report
   */
  async generateValidationReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportDir = 'analysis-reports/validation';
    
    // Ensure directory exists
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const queries = this.getOptimizationVerificationQueries();
    const patterns = this.generatePatternsForFutureAgents();

    const report = {
      title: 'Comprehensive RLS Optimization Validation Report',
      generated_at: this.results.timestamp,
      validation_queries: queries,
      patterns_for_future_agents: patterns,
      usage_instructions: {
        for_current_optimization: [
          "Execute validation queries against your database to check optimization status",
          "Use the validation checklist to ensure all policies are properly optimized",
          "Run before/after comparison to measure optimization impact"
        ],
        for_future_development: [
          "Follow the new policy creation pattern when adding tables",
          "Use the schema migration pattern for database changes",
          "Implement the API development pattern for efficient RLS usage",
          "Use the testing pattern to validate new policies",
          "Set up the monitoring pattern for ongoing health checks"
        ]
      },
      recommendations: this.generateValidationRecommendations()
    };

    // Save comprehensive report
    const reportPath = path.join(reportDir, `validation-report-${timestamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Save SQL queries as separate file
    const sqlPath = path.join(reportDir, `validation-queries-${timestamp}.sql`);
    const sqlContent = this.generateValidationSQL(queries);
    fs.writeFileSync(sqlPath, sqlContent);

    // Save patterns as separate file for easy reference
    const patternsPath = path.join(reportDir, `future-agent-patterns-${timestamp}.md`);
    const patternsMarkdown = this.generatePatternsMarkdown(patterns);
    fs.writeFileSync(patternsPath, patternsMarkdown);

    console.log(`💾 Validation system reports saved:`);
    console.log(`   📄 Comprehensive report: ${reportPath}`);
    console.log(`   🔍 Validation queries: ${sqlPath}`);
    console.log(`   📋 Future agent patterns: ${patternsPath}`);

    return { reportPath, sqlPath, patternsPath };
  }

  /**
   * Generate SQL file with all validation queries
   */
  generateValidationSQL(queries) {
    return `-- Comprehensive RLS Optimization Validation Queries
-- Generated: ${new Date().toISOString()}
-- 
-- Execute these queries to validate RLS policy optimization status
-- and ensure all policies are properly optimized for performance.

-- =============================================================================
-- 1. POLICY OPTIMIZATION STATUS BY TABLE
-- =============================================================================
${queries.policy_optimization_status}

-- =============================================================================
-- 2. NESTED SELECT DETECTION
-- =============================================================================
${queries.nested_select_detection}

-- =============================================================================
-- 3. BEFORE/AFTER COMPARISON
-- =============================================================================
${queries.before_after_comparison}

-- =============================================================================
-- 4. COMPREHENSIVE VALIDATION CHECKLIST
-- =============================================================================
${queries.validation_checklist}

-- =============================================================================
-- USAGE INSTRUCTIONS
-- =============================================================================
/*
1. Run query #1 to get optimization status by table
2. Run query #2 to detect any problematic nested SELECT patterns
3. Run query #3 to compare before/after optimization states
4. Run query #4 to get a comprehensive validation checklist

Expected Results:
- All tables should show 100% optimization_percentage
- No policies should appear in the nested SELECT detection query
- Validation checklist should show all ✅ PASS results
*/`;
  }

  /**
   * Generate markdown documentation for future agent patterns
   */
  generatePatternsMarkdown(patterns) {
    return `# RLS Optimization Patterns for Future AI Agents

Generated: ${new Date().toISOString()}

This document provides comprehensive patterns and templates for future AI agents working on V3 implementation or other features. Following these patterns ensures that new development maintains RLS optimization standards.

## 🎯 Quick Reference

- **Creating new policies?** → Use Pattern 1: New Policy Creation
- **Adding new tables?** → Use Pattern 2: Schema Migration  
- **Building APIs?** → Use Pattern 3: API Development
- **Testing policies?** → Use Pattern 4: Testing
- **Monitoring system?** → Use Pattern 5: Monitoring

---

## Pattern 1: New Policy Creation Template

${patterns.new_policy_creation_pattern.description}

### ✅ Optimized Policy Template
\`\`\`sql
${patterns.new_policy_creation_pattern.template}
\`\`\`

### ❌ Anti-Patterns to Avoid
\`\`\`sql
${patterns.new_policy_creation_pattern.anti_patterns}
\`\`\`

### 🔍 Validation Query
\`\`\`sql
${patterns.new_policy_creation_pattern.validation_query}
\`\`\`

---

## Pattern 2: Schema Migration with RLS Optimization

${patterns.schema_migration_pattern.description}

### 📝 Migration Template
\`\`\`sql
${patterns.schema_migration_pattern.template}
\`\`\`

---

## Pattern 3: API Development with RLS Awareness

${patterns.api_development_pattern.description}

### 💻 TypeScript Example
\`\`\`typescript
${patterns.api_development_pattern.typescript_example}
\`\`\`

---

## Pattern 4: Testing Optimized RLS Policies

${patterns.testing_pattern.description}

### 🧪 Test Template
\`\`\`sql
${patterns.testing_pattern.test_template}
\`\`\`

---

## Pattern 5: Monitoring and Maintenance

${patterns.monitoring_pattern.description}

### 📊 Monitoring Queries
\`\`\`sql
${patterns.monitoring_pattern.monitoring_queries}
\`\`\`

---

## 🚀 Implementation Guidelines for Future Agents

### When Adding New Features:
1. **Always use optimized patterns** from the start
2. **Validate new policies** using the provided queries
3. **Test performance impact** of new RLS policies
4. **Update monitoring** to include new tables

### When Modifying Existing Features:
1. **Check current optimization status** before making changes
2. **Preserve optimization** in any policy modifications
3. **Re-run validation** after changes
4. **Update documentation** if patterns change

### When Troubleshooting Performance:
1. **Check RLS optimization status** first
2. **Look for unoptimized policies** in affected tables
3. **Use monitoring queries** to identify issues
4. **Apply optimization patterns** to fix problems

---

## 📞 Integration with Current RLS Optimization Work

This document complements the RLS optimization work completed by the current agent. The patterns ensure that future development maintains the performance benefits achieved through systematic optimization.

### Current Optimization Status:
- ✅ Policy discovery and analysis system implemented
- ✅ Pattern transformation engine created
- ✅ Systematic optimization workflow established
- ✅ Validation system with future agent patterns

### For Future Agents:
- 📋 Follow these patterns for all new development
- 🔍 Use validation queries to check your work
- 📊 Monitor optimization status regularly
- 🔄 Update patterns if new requirements emerge

---

*Generated by Comprehensive RLS Optimization Validation System*
*Part of the systematic RLS performance optimization project*`;
  }

  /**
   * Generate validation recommendations
   */
  generateValidationRecommendations() {
    return [
      {
        priority: 'HIGH',
        action: 'Execute validation queries regularly',
        description: 'Run the provided validation queries weekly to ensure optimization status',
        impact: 'Maintains performance benefits and catches regressions early'
      },
      {
        priority: 'HIGH',
        action: 'Enforce patterns in development workflow',
        description: 'Require future agents to follow the provided patterns for new features',
        impact: 'Prevents introduction of unoptimized policies'
      },
      {
        priority: 'MEDIUM',
        action: 'Set up automated monitoring',
        description: 'Implement the monitoring pattern in your CI/CD pipeline',
        impact: 'Automatic detection of optimization regressions'
      },
      {
        priority: 'MEDIUM',
        action: 'Create development guidelines',
        description: 'Document these patterns in your development standards',
        impact: 'Ensures consistent optimization across all future development'
      },
      {
        priority: 'LOW',
        action: 'Regular pattern updates',
        description: 'Review and update patterns as new requirements emerge',
        impact: 'Keeps optimization strategies current with evolving needs'
      }
    ];
  }

  /**
   * Run comprehensive validation system
   */
  async run() {
    console.log('🚀 Starting Comprehensive RLS Optimization Validation System');
    console.log('=' .repeat(70));

    try {
      // Generate all validation components
      console.log('🔍 Generating validation queries...');
      const queries = this.getOptimizationVerificationQueries();
      
      console.log('📋 Creating patterns for future agents...');
      const patterns = this.generatePatternsForFutureAgents();
      
      console.log('📊 Generating comprehensive report...');
      const files = await this.generateValidationReport();

      console.log('\n✅ Comprehensive Validation System Complete!');
      console.log('=' .repeat(70));
      console.log('📊 System Components Generated:');
      console.log('   🔍 Optimization verification queries');
      console.log('   📋 Future agent development patterns');
      console.log('   🧪 Testing templates and procedures');
      console.log('   📊 Monitoring and maintenance queries');
      console.log('   📝 Comprehensive documentation');

      console.log('\n🎯 For Current Optimization:');
      console.log('   • Execute validation queries to check status');
      console.log('   • Use verification queries to measure progress');
      console.log('   • Run validation checklist for final verification');

      console.log('\n🚀 For Future Development:');
      console.log('   • Follow new policy creation patterns');
      console.log('   • Use schema migration templates');
      console.log('   • Implement API development best practices');
      console.log('   • Set up monitoring for ongoing health checks');

      return {
        success: true,
        files,
        queries,
        patterns
      };

    } catch (error) {
      console.error('\n❌ Validation System Generation Failed!');
      console.error('Error:', error.message);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export for use as module
module.exports = ComprehensiveValidationSystem;

// Run if called directly
if (require.main === module) {
  const system = new ComprehensiveValidationSystem();
  system.run().then(result => {
    process.exit(result.success ? 0 : 1);
  });
}