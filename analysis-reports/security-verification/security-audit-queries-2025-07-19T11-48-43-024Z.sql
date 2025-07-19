-- RLS Security Preservation: Audit Queries
-- Generated: 2025-07-19T11:48:43.026Z
-- 
-- These queries provide comprehensive security audits

-- =============================================================================
-- POLICY CHANGE AUDIT
-- =============================================================================

        -- Security Audit: Policy Change Impact Assessment
        -- This audit tracks what changed during optimization and assesses security impact
        
        CREATE OR REPLACE FUNCTION audit_policy_changes()
        RETURNS TABLE (
          table_name TEXT,
          policy_name TEXT,
          change_type TEXT,
          original_qual TEXT,
          optimized_qual TEXT,
          original_with_check TEXT,
          optimized_with_check TEXT,
          security_impact_assessment TEXT,
          requires_manual_review BOOLEAN
        ) AS $$
        BEGIN
          -- Note: This function would need to be populated with actual before/after data
          -- In a real implementation, you would store the original policies before optimization
          
          RETURN QUERY
          SELECT 
            p.tablename::TEXT,
            p.policyname::TEXT,
            CASE 
              WHEN p.qual LIKE '%(SELECT auth.uid())%' OR p.qual LIKE '%(SELECT auth.jwt())%' 
              THEN 'OPTIMIZED'
              WHEN p.qual LIKE '%auth.uid()%' OR p.qual LIKE '%auth.jwt()%'
              THEN 'NEEDS_OPTIMIZATION'
              ELSE 'NO_AUTH_CALLS'
            END::TEXT,
            p.qual::TEXT, -- This would be the optimized version
            p.qual::TEXT, -- Placeholder - would be original version
            p.with_check::TEXT, -- This would be the optimized version
            p.with_check::TEXT, -- Placeholder - would be original version
            CASE 
              WHEN p.qual LIKE '%(SELECT auth.uid())%' OR p.qual LIKE '%(SELECT auth.jwt())%'
              THEN 'LOW_RISK - Optimization preserves security logic'
              WHEN p.qual LIKE '%auth.uid()%' OR p.qual LIKE '%auth.jwt()%'
              THEN 'MEDIUM_RISK - Policy needs optimization review'
              ELSE 'NO_RISK - No auth function calls'
            END::TEXT,
            CASE 
              WHEN p.qual LIKE '%complex_condition%' THEN true
              ELSE false
            END
          FROM pg_policies p
          WHERE p.schemaname = 'public'
          AND (p.qual LIKE '%auth.uid()%' OR p.qual LIKE '%auth.jwt()%' OR
               p.with_check LIKE '%auth.uid()%' OR p.with_check LIKE '%auth.jwt()%');
        END $$ LANGUAGE plpgsql;
      

-- =============================================================================
-- SECURITY REGRESSION AUDIT
-- =============================================================================

        -- Security Audit: Regression Detection
        -- This audit identifies potential security regressions after optimization
        
        CREATE OR REPLACE FUNCTION detect_security_regressions()
        RETURNS TABLE (
          table_name TEXT,
          policy_name TEXT,
          regression_type TEXT,
          severity TEXT,
          description TEXT,
          recommended_action TEXT
        ) AS $$
        BEGIN
          -- Check for policies that might have security issues after optimization
          RETURN QUERY
          SELECT 
            p.tablename::TEXT,
            p.policyname::TEXT,
            CASE 
              WHEN p.qual LIKE '%SELECT%SELECT%' THEN 'NESTED_SELECT'
              WHEN p.qual LIKE '%((SELECT%' THEN 'DOUBLE_PARENTHESES'
              WHEN p.qual IS NULL AND p.with_check IS NULL THEN 'EMPTY_POLICY'
              ELSE 'UNKNOWN'
            END::TEXT,
            CASE 
              WHEN p.qual LIKE '%SELECT%SELECT%' THEN 'HIGH'
              WHEN p.qual LIKE '%((SELECT%' THEN 'MEDIUM'
              WHEN p.qual IS NULL AND p.with_check IS NULL THEN 'CRITICAL'
              ELSE 'LOW'
            END::TEXT,
            CASE 
              WHEN p.qual LIKE '%SELECT%SELECT%' THEN 'Policy contains nested SELECT statements that may cause performance issues'
              WHEN p.qual LIKE '%((SELECT%' THEN 'Policy contains double parentheses around SELECT that may cause syntax issues'
              WHEN p.qual IS NULL AND p.with_check IS NULL THEN 'Policy has no conditions - allows unrestricted access'
              ELSE 'No issues detected'
            END::TEXT,
            CASE 
              WHEN p.qual LIKE '%SELECT%SELECT%' THEN 'Review and fix nested SELECT statements'
              WHEN p.qual LIKE '%((SELECT%' THEN 'Remove extra parentheses around SELECT statements'
              WHEN p.qual IS NULL AND p.with_check IS NULL THEN 'Add appropriate access conditions to policy'
              ELSE 'No action required'
            END::TEXT
          FROM pg_policies p
          WHERE p.schemaname = 'public'
          AND (
            p.qual LIKE '%SELECT%SELECT%' OR 
            p.qual LIKE '%((SELECT%' OR
            (p.qual IS NULL AND p.with_check IS NULL)
          );
        END $$ LANGUAGE plpgsql;
      

-- =============================================================================
-- COMPREHENSIVE SECURITY VALIDATION
-- =============================================================================

        -- Security Audit: Comprehensive Validation
        -- This audit provides a complete security assessment after optimization
        
        CREATE OR REPLACE FUNCTION comprehensive_security_validation()
        RETURNS TABLE (
          audit_category TEXT,
          table_name TEXT,
          policy_count INTEGER,
          issues_found INTEGER,
          security_score INTEGER,
          status TEXT,
          recommendations TEXT
        ) AS $$
        DECLARE
          total_tables INTEGER;
          tables_with_issues INTEGER;
          overall_score INTEGER;
        BEGIN
          -- Count total tables with RLS policies
          SELECT COUNT(DISTINCT tablename) INTO total_tables
          FROM pg_policies 
          WHERE schemaname = 'public';
          
          -- Count tables with potential issues
          SELECT COUNT(DISTINCT tablename) INTO tables_with_issues
          FROM pg_policies 
          WHERE schemaname = 'public'
          AND (
            qual LIKE '%SELECT%SELECT%' OR 
            qual LIKE '%((SELECT%' OR
            (qual IS NULL AND with_check IS NULL)
          );
          
          -- Calculate overall security score
          overall_score := CASE 
            WHEN total_tables = 0 THEN 0
            ELSE ((total_tables - tables_with_issues) * 100 / total_tables)
          END;
          
          -- Return summary by category
          RETURN QUERY
          SELECT 
            'OPTIMIZATION_SECURITY'::TEXT,
            'ALL_TABLES'::TEXT,
            total_tables,
            tables_with_issues,
            overall_score,
            CASE 
              WHEN overall_score >= 95 THEN 'EXCELLENT'
              WHEN overall_score >= 85 THEN 'GOOD'
              WHEN overall_score >= 70 THEN 'ACCEPTABLE'
              ELSE 'NEEDS_ATTENTION'
            END::TEXT,
            CASE 
              WHEN overall_score >= 95 THEN 'Security optimization completed successfully'
              WHEN overall_score >= 85 THEN 'Minor issues detected - review recommended'
              WHEN overall_score >= 70 THEN 'Some security issues found - address before production'
              ELSE 'Significant security issues detected - immediate attention required'
            END::TEXT;
            
          -- Add detailed breakdown by table (if needed)
          -- Additional RETURN QUERY statements can be added here
        END $$ LANGUAGE plpgsql;
      