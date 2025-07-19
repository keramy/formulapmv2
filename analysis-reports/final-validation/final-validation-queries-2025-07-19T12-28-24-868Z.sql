-- Final RLS Optimization Validation Queries
-- Generated: 2025-07-19T12:28:24.869Z
-- 
-- Execute these queries to validate complete optimization success
-- CRITICAL: Zero direct calls query MUST return no rows for success

-- =============================================================================
-- 1. MASTER VALIDATION QUERY
-- =============================================================================

        -- Master RLS Optimization Validation Query
        -- Validates complete optimization success across all Performance Advisor tables
        
        WITH performance_advisor_tables AS (
          SELECT unnest(ARRAY[
            'activity_summary', 'audit_logs', 'notifications',
            'tasks', 'task_comments', 'field_reports', 
            'invoices', 'invoice_items', 'payments', 'project_budgets',
            'system_settings', 'permission_templates', 'documents', 'document_approvals',
            'suppliers', 'mobile_devices', 'tenders'
          ]) as table_name
        ),
        policy_analysis AS (
          SELECT 
            p.tablename,
            p.policyname,
            p.qual,
            p.with_check,
            
            -- Check for direct auth calls (should be ZERO after optimization)
            CASE 
              WHEN (p.qual LIKE '%auth.uid()%' AND p.qual NOT LIKE '%(SELECT auth.uid())%') OR
                   (p.qual LIKE '%auth.jwt()%' AND p.qual NOT LIKE '%(SELECT auth.jwt())%') OR
                   (p.with_check LIKE '%auth.uid()%' AND p.with_check NOT LIKE '%(SELECT auth.uid())%') OR
                   (p.with_check LIKE '%auth.jwt()%' AND p.with_check NOT LIKE '%(SELECT auth.jwt())%')
              THEN 1 ELSE 0
            END as has_direct_calls,
            
            -- Check for optimized calls (should be present)
            CASE 
              WHEN (p.qual LIKE '%(SELECT auth.uid())%' OR p.qual LIKE '%(SELECT auth.jwt())%' OR
                    p.with_check LIKE '%(SELECT auth.uid())%' OR p.with_check LIKE '%(SELECT auth.jwt())%')
              THEN 1 ELSE 0
            END as has_optimized_calls,
            
            -- Overall optimization status
            CASE 
              WHEN (p.qual LIKE '%(SELECT auth.uid())%' OR p.qual LIKE '%(SELECT auth.jwt())%' OR
                    p.with_check LIKE '%(SELECT auth.uid())%' OR p.with_check LIKE '%(SELECT auth.jwt())%')
              THEN 'OPTIMIZED'
              WHEN (p.qual LIKE '%auth.uid()%' AND p.qual NOT LIKE '%(SELECT auth.uid())%') OR
                   (p.qual LIKE '%auth.jwt()%' AND p.qual NOT LIKE '%(SELECT auth.jwt())%') OR
                   (p.with_check LIKE '%auth.uid()%' AND p.with_check NOT LIKE '%(SELECT auth.uid())%') OR
                   (p.with_check LIKE '%auth.jwt()%' AND p.with_check NOT LIKE '%(SELECT auth.jwt())%')
              THEN 'NEEDS_OPTIMIZATION'
              ELSE 'NO_AUTH_CALLS'
            END as optimization_status
            
          FROM pg_policies p
          INNER JOIN performance_advisor_tables pat ON p.tablename = pat.table_name
          WHERE p.schemaname = 'public'
          AND (
            p.qual LIKE '%auth.uid()%' OR 
            p.qual LIKE '%auth.jwt()%' OR
            p.with_check LIKE '%auth.uid()%' OR
            p.with_check LIKE '%auth.jwt()%'
          )
        )
        SELECT 
          '🎯 FINAL OPTIMIZATION VALIDATION RESULTS' as validation_section,
          '' as separator,
          
          -- Critical Success Metrics
          COUNT(*) as total_policies_with_auth,
          SUM(has_direct_calls) as policies_with_direct_calls,
          SUM(has_optimized_calls) as policies_with_optimized_calls,
          COUNT(CASE WHEN optimization_status = 'OPTIMIZED' THEN 1 END) as fully_optimized_policies,
          COUNT(CASE WHEN optimization_status = 'NEEDS_OPTIMIZATION' THEN 1 END) as policies_still_needing_optimization,
          
          -- Success Criteria Validation
          CASE WHEN SUM(has_direct_calls) = 0 THEN '✅ ZERO_DIRECT_CALLS' ELSE '❌ DIRECT_CALLS_REMAIN' END as direct_calls_status,
          CASE WHEN COUNT(CASE WHEN optimization_status = 'OPTIMIZED' THEN 1 END) = COUNT(*) THEN '✅ ALL_OPTIMIZED' ELSE '❌ INCOMPLETE_OPTIMIZATION' END as optimization_completeness,
          
          -- Overall Success Status
          CASE 
            WHEN SUM(has_direct_calls) = 0 AND COUNT(CASE WHEN optimization_status = 'OPTIMIZED' THEN 1 END) = COUNT(*)
            THEN '🎉 OPTIMIZATION_SUCCESS'
            WHEN SUM(has_direct_calls) = 0 AND COUNT(CASE WHEN optimization_status = 'OPTIMIZED' THEN 1 END) > 0
            THEN '🔄 OPTIMIZATION_PARTIAL'
            ELSE '❌ OPTIMIZATION_INCOMPLETE'
          END as final_validation_status
          
        FROM policy_analysis;
      

-- =============================================================================
-- 2. TABLE-BY-TABLE VALIDATION
-- =============================================================================

        -- Table-by-Table Validation for Performance Advisor Tables
        -- Detailed validation results for each of the 17 critical tables
        
        WITH performance_advisor_tables AS (
          SELECT 
            table_name,
            expected_optimizations
          FROM (VALUES
            ('activity_summary', 2),
            ('audit_logs', 1),
            ('notifications', 1),
            ('tasks', 1),
            ('task_comments', 1),
            ('field_reports', 1),
            ('invoices', 3),
            ('invoice_items', 1),
            ('payments', 1),
            ('project_budgets', 2),
            ('system_settings', 1),
            ('permission_templates', 1),
            ('documents', 2),
            ('document_approvals', 1),
            ('suppliers', 2),
            ('mobile_devices', 1),
            ('tenders', 1)
          ) AS t(table_name, expected_optimizations)
        ),
        table_validation AS (
          SELECT 
            pat.table_name,
            pat.expected_optimizations,
            COUNT(p.policyname) as policies_found,
            
            -- Count optimization status
            COUNT(CASE 
              WHEN (p.qual LIKE '%(SELECT auth.uid())%' OR p.qual LIKE '%(SELECT auth.jwt())%' OR
                    p.with_check LIKE '%(SELECT auth.uid())%' OR p.with_check LIKE '%(SELECT auth.jwt())%')
              THEN 1 
            END) as optimized_policies,
            
            COUNT(CASE 
              WHEN (p.qual LIKE '%auth.uid()%' AND p.qual NOT LIKE '%(SELECT auth.uid())%') OR
                   (p.qual LIKE '%auth.jwt()%' AND p.qual NOT LIKE '%(SELECT auth.jwt())%') OR
                   (p.with_check LIKE '%auth.uid()%' AND p.with_check NOT LIKE '%(SELECT auth.uid())%') OR
                   (p.with_check LIKE '%auth.jwt()%' AND p.with_check NOT LIKE '%(SELECT auth.jwt())%')
              THEN 1 
            END) as unoptimized_policies,
            
            -- Validation status per table
            CASE 
              WHEN COUNT(CASE 
                WHEN (p.qual LIKE '%auth.uid()%' AND p.qual NOT LIKE '%(SELECT auth.uid())%') OR
                     (p.qual LIKE '%auth.jwt()%' AND p.qual NOT LIKE '%(SELECT auth.jwt())%') OR
                     (p.with_check LIKE '%auth.uid()%' AND p.with_check NOT LIKE '%(SELECT auth.uid())%') OR
                     (p.with_check LIKE '%auth.jwt()%' AND p.with_check NOT LIKE '%(SELECT auth.jwt())%')
                THEN 1 
              END) = 0 THEN '✅ FULLY_OPTIMIZED'
              WHEN COUNT(CASE 
                WHEN (p.qual LIKE '%(SELECT auth.uid())%' OR p.qual LIKE '%(SELECT auth.jwt())%' OR
                      p.with_check LIKE '%(SELECT auth.uid())%' OR p.with_check LIKE '%(SELECT auth.jwt())%')
                THEN 1 
              END) > 0 THEN '🔄 PARTIALLY_OPTIMIZED'
              ELSE '❌ NOT_OPTIMIZED'
            END as table_status
            
          FROM performance_advisor_tables pat
          LEFT JOIN pg_policies p ON (
            p.tablename = pat.table_name 
            AND p.schemaname = 'public'
            AND (
              p.qual LIKE '%auth.uid()%' OR 
              p.qual LIKE '%auth.jwt()%' OR
              p.with_check LIKE '%auth.uid()%' OR
              p.with_check LIKE '%auth.jwt()%'
            )
          )
          GROUP BY pat.table_name, pat.expected_optimizations
        )
        SELECT 
          table_name,
          expected_optimizations,
          policies_found,
          optimized_policies,
          unoptimized_policies,
          table_status,
          
          -- Progress percentage
          CASE 
            WHEN policies_found > 0 THEN
              ROUND(optimized_policies * 100.0 / policies_found, 1)
            ELSE 0
          END as optimization_percentage,
          
          -- Expectation vs Reality
          CASE 
            WHEN optimized_policies >= expected_optimizations THEN '✅ MEETS_EXPECTATIONS'
            WHEN optimized_policies > 0 THEN '⚠️ BELOW_EXPECTATIONS'
            ELSE '❌ NO_OPTIMIZATIONS'
          END as expectation_status
          
        FROM table_validation
        ORDER BY 
          CASE table_status
            WHEN '❌ NOT_OPTIMIZED' THEN 1
            WHEN '🔄 PARTIALLY_OPTIMIZED' THEN 2
            WHEN '✅ FULLY_OPTIMIZED' THEN 3
          END,
          table_name;
      

-- =============================================================================
-- 3. PERFORMANCE ADVISOR COMPLIANCE
-- =============================================================================

        -- Performance Advisor Compliance Verification
        -- Verifies that all Performance Advisor recommendations have been addressed
        
        WITH compliance_check AS (
          SELECT 
            COUNT(DISTINCT p.tablename) as tables_with_policies,
            
            -- Count total direct calls (should be ZERO)
            SUM(
              (LENGTH(COALESCE(p.qual, '')) - LENGTH(REPLACE(COALESCE(p.qual, ''), 'auth.uid()', ''))) / LENGTH('auth.uid()') +
              (LENGTH(COALESCE(p.with_check, '')) - LENGTH(REPLACE(COALESCE(p.with_check, ''), 'auth.uid()', ''))) / LENGTH('auth.uid()') +
              (LENGTH(COALESCE(p.qual, '')) - LENGTH(REPLACE(COALESCE(p.qual, ''), 'auth.jwt()', ''))) / LENGTH('auth.jwt()') +
              (LENGTH(COALESCE(p.with_check, '')) - LENGTH(REPLACE(COALESCE(p.with_check, ''), 'auth.jwt()', ''))) / LENGTH('auth.jwt()')
            ) as total_direct_calls,
            
            -- Count optimized calls (should be > 0)
            SUM(
              (LENGTH(COALESCE(p.qual, '')) - LENGTH(REPLACE(COALESCE(p.qual, ''), '(SELECT auth.uid())', ''))) / LENGTH('(SELECT auth.uid())') +
              (LENGTH(COALESCE(p.with_check, '')) - LENGTH(REPLACE(COALESCE(p.with_check, ''), '(SELECT auth.uid())', ''))) / LENGTH('(SELECT auth.uid())') +
              (LENGTH(COALESCE(p.qual, '')) - LENGTH(REPLACE(COALESCE(p.qual, ''), '(SELECT auth.jwt())', ''))) / LENGTH('(SELECT auth.jwt())') +
              (LENGTH(COALESCE(p.with_check, '')) - LENGTH(REPLACE(COALESCE(p.with_check, ''), '(SELECT auth.jwt())', ''))) / LENGTH('(SELECT auth.jwt())')
            ) as total_optimized_calls
            
          FROM pg_policies p
          WHERE p.schemaname = 'public'
          AND p.tablename IN (
            'activity_summary', 'audit_logs', 'notifications',
            'tasks', 'task_comments', 'field_reports', 
            'invoices', 'invoice_items', 'payments', 'project_budgets',
            'system_settings', 'permission_templates', 'documents', 'document_approvals',
            'suppliers', 'mobile_devices', 'tenders'
          )
          AND (
            p.qual LIKE '%auth.uid()%' OR 
            p.qual LIKE '%auth.jwt()%' OR
            p.with_check LIKE '%auth.uid()%' OR
            p.with_check LIKE '%auth.jwt()%'
          )
        )
        SELECT 
          '🎯 PERFORMANCE ADVISOR COMPLIANCE CHECK' as compliance_section,
          '' as separator,
          
          tables_with_policies as performance_advisor_tables_processed,
          total_direct_calls as remaining_direct_calls,
          total_optimized_calls as total_optimizations_applied,
          
          -- Compliance Status
          CASE 
            WHEN total_direct_calls = 0 AND total_optimized_calls > 0 
            THEN '🎉 FULLY_COMPLIANT'
            WHEN total_direct_calls = 0 AND total_optimized_calls = 0 
            THEN '⚠️ NO_POLICIES_FOUND'
            WHEN total_direct_calls > 0 AND total_optimized_calls > 0 
            THEN '🔄 PARTIALLY_COMPLIANT'
            ELSE '❌ NOT_COMPLIANT'
          END as compliance_status,
          
          -- Performance Impact Assessment
          CASE 
            WHEN total_optimized_calls >= 20 THEN '🚀 VERY_HIGH_IMPACT'
            WHEN total_optimized_calls >= 15 THEN '⚡ HIGH_IMPACT'
            WHEN total_optimized_calls >= 10 THEN '📈 MEDIUM_IMPACT'
            WHEN total_optimized_calls >= 5 THEN '📊 LOW_IMPACT'
            ELSE '❓ MINIMAL_IMPACT'
          END as performance_impact_assessment,
          
          -- Expected vs Actual
          23 as expected_total_optimizations, -- Based on our analysis
          CASE 
            WHEN total_optimized_calls >= 23 THEN '✅ EXCEEDS_EXPECTATIONS'
            WHEN total_optimized_calls >= 20 THEN '✅ MEETS_EXPECTATIONS'
            WHEN total_optimized_calls >= 15 THEN '⚠️ BELOW_EXPECTATIONS'
            ELSE '❌ SIGNIFICANTLY_BELOW'
          END as expectation_comparison
          
        FROM compliance_check;
      

-- =============================================================================
-- 4. ZERO DIRECT CALLS CHECK (CRITICAL)
-- =============================================================================

        -- Zero Direct Calls Verification
        -- CRITICAL: This query MUST return zero results for optimization to be considered successful
        
        SELECT 
          '❌ CRITICAL: Direct auth function calls still exist!' as alert_message,
          tablename,
          policyname,
          cmd as policy_type,
          
          -- Show the problematic patterns
          CASE 
            WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%' 
            THEN 'Direct auth.uid() in USING clause'
            WHEN qual LIKE '%auth.jwt()%' AND qual NOT LIKE '%(SELECT auth.jwt())%' 
            THEN 'Direct auth.jwt() in USING clause'
            ELSE NULL
          END as qual_issue,
          
          CASE 
            WHEN with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%' 
            THEN 'Direct auth.uid() in WITH CHECK clause'
            WHEN with_check LIKE '%auth.jwt()%' AND with_check NOT LIKE '%(SELECT auth.jwt())%' 
            THEN 'Direct auth.jwt() in WITH CHECK clause'
            ELSE NULL
          END as with_check_issue,
          
          qual as problematic_using_clause,
          with_check as problematic_with_check_clause,
          
          -- Suggested fix
          REPLACE(REPLACE(
            COALESCE(qual, ''), 
            'auth.uid()', '(SELECT auth.uid())'
          ), 'auth.jwt()', '(SELECT auth.jwt())') as suggested_qual_fix,
          
          REPLACE(REPLACE(
            COALESCE(with_check, ''), 
            'auth.uid()', '(SELECT auth.uid())'
          ), 'auth.jwt()', '(SELECT auth.jwt())') as suggested_with_check_fix
          
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND (
          (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%') OR
          (qual LIKE '%auth.jwt()%' AND qual NOT LIKE '%(SELECT auth.jwt())%') OR
          (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%') OR
          (with_check LIKE '%auth.jwt()%' AND with_check NOT LIKE '%(SELECT auth.jwt())%')
        )
        ORDER BY tablename, policyname;
        
        -- If this query returns NO ROWS, then ✅ SUCCESS: Zero direct calls achieved!
        -- If this query returns ANY ROWS, then ❌ FAILURE: Direct calls still exist and need fixing!
      

-- =============================================================================
-- 5. ALL POLICIES OPTIMIZED CHECK
-- =============================================================================

        -- All Policies Optimized Verification
        -- Confirms that all policies with auth functions are properly optimized
        
        WITH optimization_summary AS (
          SELECT 
            COUNT(*) as total_policies_with_auth,
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
          '📊 OPTIMIZATION COMPLETENESS REPORT' as report_section,
          '' as separator,
          
          total_policies_with_auth,
          optimized_policies,
          unoptimized_policies,
          
          -- Success criteria validation
          CASE 
            WHEN unoptimized_policies = 0 AND optimized_policies > 0 
            THEN '🎉 SUCCESS: All policies optimized!'
            WHEN unoptimized_policies = 0 AND optimized_policies = 0 
            THEN '⚠️ WARNING: No policies with auth functions found'
            WHEN unoptimized_policies > 0 
            THEN '❌ FAILURE: ' || unoptimized_policies || ' policies still need optimization'
            ELSE '❓ UNKNOWN: Unexpected state'
          END as optimization_status,
          
          -- Progress percentage
          CASE 
            WHEN total_policies_with_auth > 0 THEN
              ROUND(optimized_policies * 100.0 / total_policies_with_auth, 2)
            ELSE 0
          END as optimization_percentage,
          
          -- Final validation result
          CASE 
            WHEN unoptimized_policies = 0 AND optimized_policies > 0 THEN '✅ VALIDATION_PASSED'
            ELSE '❌ VALIDATION_FAILED'
          END as final_validation_result
          
        FROM optimization_summary;
      

-- =============================================================================
-- 6. PERFORMANCE ADVISOR FINAL CHECK
-- =============================================================================

        -- Performance Advisor Tables Final Validation
        -- Validates that all 17 critical Performance Advisor tables are optimized
        
        WITH expected_tables AS (
          SELECT unnest(ARRAY[
            'activity_summary', 'audit_logs', 'notifications',
            'tasks', 'task_comments', 'field_reports', 
            'invoices', 'invoice_items', 'payments', 'project_budgets',
            'system_settings', 'permission_templates', 'documents', 'document_approvals',
            'suppliers', 'mobile_devices', 'tenders'
          ]) as table_name
        ),
        table_status AS (
          SELECT 
            et.table_name,
            COUNT(p.policyname) as policies_with_auth,
            COUNT(CASE 
              WHEN (p.qual LIKE '%(SELECT auth.uid())%' OR p.qual LIKE '%(SELECT auth.jwt())%' OR
                    p.with_check LIKE '%(SELECT auth.uid())%' OR p.with_check LIKE '%(SELECT auth.jwt())%')
              THEN 1 
            END) as optimized_policies,
            COUNT(CASE 
              WHEN (p.qual LIKE '%auth.uid()%' AND p.qual NOT LIKE '%(SELECT auth.uid())%') OR
                   (p.qual LIKE '%auth.jwt()%' AND p.qual NOT LIKE '%(SELECT auth.jwt())%') OR
                   (p.with_check LIKE '%auth.uid()%' AND p.with_check NOT LIKE '%(SELECT auth.uid())%') OR
                   (p.with_check LIKE '%auth.jwt()%' AND p.with_check NOT LIKE '%(SELECT auth.jwt())%')
              THEN 1 
            END) as unoptimized_policies
          FROM expected_tables et
          LEFT JOIN pg_policies p ON (
            p.tablename = et.table_name 
            AND p.schemaname = 'public'
            AND (
              p.qual LIKE '%auth.uid()%' OR 
              p.qual LIKE '%auth.jwt()%' OR
              p.with_check LIKE '%auth.uid()%' OR
              p.with_check LIKE '%auth.jwt()%'
            )
          )
          GROUP BY et.table_name
        )
        SELECT 
          '🎯 PERFORMANCE ADVISOR TABLES FINAL VALIDATION' as validation_section,
          '' as separator,
          
          COUNT(*) as total_performance_advisor_tables,
          COUNT(CASE WHEN policies_with_auth > 0 THEN 1 END) as tables_with_auth_policies,
          COUNT(CASE WHEN unoptimized_policies = 0 AND optimized_policies > 0 THEN 1 END) as fully_optimized_tables,
          COUNT(CASE WHEN unoptimized_policies > 0 THEN 1 END) as tables_needing_optimization,
          SUM(optimized_policies) as total_optimizations_applied,
          SUM(unoptimized_policies) as total_policies_still_needing_optimization,
          
          -- Final Performance Advisor compliance status
          CASE 
            WHEN SUM(unoptimized_policies) = 0 AND SUM(optimized_policies) > 0 
            THEN '🎉 PERFORMANCE_ADVISOR_COMPLIANT'
            WHEN SUM(unoptimized_policies) = 0 AND SUM(optimized_policies) = 0 
            THEN '⚠️ NO_POLICIES_FOUND'
            ELSE '❌ PERFORMANCE_ADVISOR_NON_COMPLIANT'
          END as performance_advisor_compliance_status,
          
          -- Expected vs Actual comparison
          23 as expected_total_optimizations,
          CASE 
            WHEN SUM(optimized_policies) >= 23 THEN '✅ MEETS_OR_EXCEEDS_EXPECTATIONS'
            WHEN SUM(optimized_policies) >= 20 THEN '⚠️ CLOSE_TO_EXPECTATIONS'
            ELSE '❌ BELOW_EXPECTATIONS'
          END as expectation_comparison
          
        FROM table_status;
      

-- =============================================================================
-- VALIDATION SUCCESS CRITERIA
-- =============================================================================
/*
FOR OPTIMIZATION TO BE CONSIDERED SUCCESSFUL:

1. Query #4 (Zero Direct Calls Check) MUST return NO ROWS
2. Query #5 (All Policies Optimized) MUST show 100% optimization
3. Query #6 (Performance Advisor Final) MUST show compliance achieved
4. All queries should show ✅ SUCCESS indicators
5. Total optimizations should be >= 23 (expected from Performance Advisor analysis)

If any validation fails, use the suggested fixes and re-run optimization.
*/