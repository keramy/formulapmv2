-- RLS Policy Discovery and Analysis Queries
-- Generated: 2025-07-19T10:15:22.784Z
-- Execute these queries in your PostgreSQL database to analyze RLS policies

-- =============================================================================
-- 1. POLICY DISCOVERY QUERY
-- =============================================================================

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
    

-- =============================================================================
-- 2. OPTIMIZATION PROGRESS QUERY
-- =============================================================================

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
    

-- =============================================================================
-- 3. POLICY INVENTORY QUERY
-- =============================================================================

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
    
