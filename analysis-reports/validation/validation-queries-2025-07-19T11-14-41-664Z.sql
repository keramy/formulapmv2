-- Comprehensive RLS Optimization Validation Queries
-- Generated: 2025-07-19T11:14:41.666Z
-- 
-- Execute these queries to validate RLS policy optimization status
-- and ensure all policies are properly optimized for performance.

-- =============================================================================
-- 1. POLICY OPTIMIZATION STATUS BY TABLE
-- =============================================================================

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
      

-- =============================================================================
-- 2. NESTED SELECT DETECTION
-- =============================================================================

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
      

-- =============================================================================
-- 3. BEFORE/AFTER COMPARISON
-- =============================================================================

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
      

-- =============================================================================
-- 4. COMPREHENSIVE VALIDATION CHECKLIST
-- =============================================================================

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
*/