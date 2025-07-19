-- RLS Policy Optimization Status Validation
-- Requirements: 3.1, 3.4
-- 
-- Quick validation queries to check current optimization status
-- and track progress of RLS policy optimization efforts.

-- =============================================================================
-- OPTIMIZATION STATUS SUMMARY
-- =============================================================================

-- Overall optimization status summary
SELECT 
  'OPTIMIZATION_STATUS_SUMMARY' as report_section,
  '' as separator;

SELECT 
  'Total Policies with Auth Calls' as metric,
  COUNT(*) as count,
  'policies' as unit
FROM pg_policies 
WHERE schemaname = 'public'
AND (
  qual LIKE '%auth.uid()%' OR 
  qual LIKE '%auth.jwt()%' OR
  with_check LIKE '%auth.uid()%' OR
  with_check LIKE '%auth.jwt()%'
)

UNION ALL

SELECT 
  'Policies Needing Optimization' as metric,
  COUNT(*) as count,
  'policies' as unit
FROM pg_policies 
WHERE schemaname = 'public'
AND (
  (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%') OR
  (qual LIKE '%auth.jwt()%' AND qual NOT LIKE '%(SELECT auth.jwt())%') OR
  (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%') OR
  (with_check LIKE '%auth.jwt()%' AND with_check NOT LIKE '%(SELECT auth.jwt())%')
)

UNION ALL

SELECT 
  'Already Optimized Policies' as metric,
  COUNT(*) as count,
  'policies' as unit
FROM pg_policies 
WHERE schemaname = 'public'
AND (
  qual LIKE '%(SELECT auth.uid())%' OR 
  qual LIKE '%(SELECT auth.jwt())%' OR
  with_check LIKE '%(SELECT auth.uid())%' OR 
  with_check LIKE '%(SELECT auth.jwt())%'
)

UNION ALL

SELECT 
  'Optimization Progress' as metric,
  CASE 
    WHEN total.count > 0 THEN
      ROUND(optimized.count * 100.0 / total.count, 1)
    ELSE 0
  END as count,
  'percent' as unit
FROM 
  (SELECT COUNT(*) as count FROM pg_policies 
   WHERE schemaname = 'public'
   AND (qual LIKE '%auth.uid()%' OR qual LIKE '%auth.jwt()%' OR
        with_check LIKE '%auth.uid()%' OR with_check LIKE '%auth.jwt()%')) total,
  (SELECT COUNT(*) as count FROM pg_policies 
   WHERE schemaname = 'public'
   AND (qual LIKE '%(SELECT auth.uid())%' OR qual LIKE '%(SELECT auth.jwt())%' OR
        with_check LIKE '%(SELECT auth.uid())%' OR with_check LIKE '%(SELECT auth.jwt())%')) optimized

ORDER BY 
  CASE metric
    WHEN 'Total Policies with Auth Calls' THEN 1
    WHEN 'Policies Needing Optimization' THEN 2
    WHEN 'Already Optimized Policies' THEN 3
    WHEN 'Optimization Progress' THEN 4
  END;

-- =============================================================================
-- TABLE-BY-TABLE OPTIMIZATION STATUS
-- =============================================================================

SELECT 
  '' as separator,
  'TABLE_OPTIMIZATION_STATUS' as report_section,
  '' as separator2;

SELECT 
  tablename,
  COUNT(*) as total_policies,
  COUNT(CASE 
    WHEN (qual LIKE '%(SELECT auth.uid())%' OR qual LIKE '%(SELECT auth.jwt())%' OR
          with_check LIKE '%(SELECT auth.uid())%' OR with_check LIKE '%(SELECT auth.jwt())%')
    THEN 1 
  END) as optimized,
  COUNT(CASE 
    WHEN (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%') OR
         (qual LIKE '%auth.jwt()%' AND qual NOT LIKE '%(SELECT auth.jwt())%') OR
         (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%') OR
         (with_check LIKE '%auth.jwt()%' AND with_check NOT LIKE '%(SELECT auth.jwt())%')
    THEN 1 
  END) as needs_optimization,
  CASE 
    WHEN COUNT(*) > 0 THEN
      ROUND(
        COUNT(CASE 
          WHEN (qual LIKE '%(SELECT auth.uid())%' OR qual LIKE '%(SELECT auth.jwt())%' OR
                with_check LIKE '%(SELECT auth.uid())%' OR with_check LIKE '%(SELECT auth.jwt())%')
          THEN 1 
        END) * 100.0 / COUNT(*), 1
      )
    ELSE 0
  END as progress_percent,
  CASE 
    WHEN COUNT(CASE 
      WHEN (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%') OR
           (qual LIKE '%auth.jwt()%' AND qual NOT LIKE '%(SELECT auth.jwt())%') OR
           (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%') OR
           (with_check LIKE '%auth.jwt()%' AND with_check NOT LIKE '%(SELECT auth.jwt())%')
      THEN 1 
    END) = 0 THEN '✅ COMPLETE'
    WHEN COUNT(CASE 
      WHEN (qual LIKE '%(SELECT auth.uid())%' OR qual LIKE '%(SELECT auth.jwt())%' OR
            with_check LIKE '%(SELECT auth.uid())%' OR with_check LIKE '%(SELECT auth.jwt())%')
      THEN 1 
    END) > 0 THEN '🔄 IN_PROGRESS'
    ELSE '❌ PENDING'
  END as status
FROM pg_policies 
WHERE schemaname = 'public'
AND (
  qual LIKE '%auth.uid()%' OR 
  qual LIKE '%auth.jwt()%' OR
  with_check LIKE '%auth.uid()%' OR
  with_check LIKE '%auth.jwt()%'
)
GROUP BY tablename
ORDER BY needs_optimization DESC, tablename;

-- =============================================================================
-- HIGH-PRIORITY TABLES FOR OPTIMIZATION
-- =============================================================================

SELECT 
  '' as separator,
  'HIGH_PRIORITY_TABLES' as report_section,
  '' as separator2;

SELECT 
  tablename,
  COUNT(*) as total_policies,
  COUNT(CASE 
    WHEN (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%') OR
         (qual LIKE '%auth.jwt()%' AND qual NOT LIKE '%(SELECT auth.jwt())%') OR
         (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%') OR
         (with_check LIKE '%auth.jwt()%' AND with_check NOT LIKE '%(SELECT auth.jwt())%')
    THEN 1 
  END) as policies_to_optimize,
  -- Count total direct function calls
  SUM(
    (LENGTH(qual) - LENGTH(REPLACE(qual, 'auth.uid()', ''))) / LENGTH('auth.uid()') +
    (LENGTH(COALESCE(with_check, '')) - LENGTH(REPLACE(COALESCE(with_check, ''), 'auth.uid()', ''))) / LENGTH('auth.uid()') +
    (LENGTH(qual) - LENGTH(REPLACE(qual, 'auth.jwt()', ''))) / LENGTH('auth.jwt()') +
    (LENGTH(COALESCE(with_check, '')) - LENGTH(REPLACE(COALESCE(with_check, ''), 'auth.jwt()', ''))) / LENGTH('auth.jwt()')
  ) as total_direct_calls,
  CASE 
    WHEN COUNT(CASE 
      WHEN (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%') OR
           (qual LIKE '%auth.jwt()%' AND qual NOT LIKE '%(SELECT auth.jwt())%') OR
           (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%') OR
           (with_check LIKE '%auth.jwt()%' AND with_check NOT LIKE '%(SELECT auth.jwt())%')
      THEN 1 
    END) >= 3 THEN '🔥 CRITICAL'
    WHEN COUNT(CASE 
      WHEN (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%') OR
           (qual LIKE '%auth.jwt()%' AND qual NOT LIKE '%(SELECT auth.jwt())%') OR
           (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%') OR
           (with_check LIKE '%auth.jwt()%' AND with_check NOT LIKE '%(SELECT auth.jwt())%')
      THEN 1 
    END) >= 2 THEN '⚠️ HIGH'
    ELSE '📋 MEDIUM'
  END as priority
FROM pg_policies 
WHERE schemaname = 'public'
AND (
  qual LIKE '%auth.uid()%' OR 
  qual LIKE '%auth.jwt()%' OR
  with_check LIKE '%auth.uid()%' OR
  with_check LIKE '%auth.jwt()%'
)
GROUP BY tablename
HAVING COUNT(CASE 
  WHEN (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%') OR
       (qual LIKE '%auth.jwt()%' AND qual NOT LIKE '%(SELECT auth.jwt())%') OR
       (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%') OR
       (with_check LIKE '%auth.jwt()%' AND with_check NOT LIKE '%(SELECT auth.jwt())%')
  THEN 1 
END) > 0
ORDER BY total_direct_calls DESC, policies_to_optimize DESC;

-- =============================================================================
-- VALIDATION CHECKLIST
-- =============================================================================

SELECT 
  '' as separator,
  'VALIDATION_CHECKLIST' as report_section,
  '' as separator2;

-- Check if any policies still have direct auth calls
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as check_result,
  'No Direct auth.uid() Calls' as check_description,
  COUNT(*) as failing_policies
FROM pg_policies 
WHERE schemaname = 'public'
AND qual LIKE '%auth.uid()%' 
AND qual NOT LIKE '%(SELECT auth.uid())%'

UNION ALL

SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as check_result,
  'No Direct auth.jwt() Calls' as check_description,
  COUNT(*) as failing_policies
FROM pg_policies 
WHERE schemaname = 'public'
AND qual LIKE '%auth.jwt()%' 
AND qual NOT LIKE '%(SELECT auth.jwt())%'

UNION ALL

SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as check_result,
  'No Direct auth.uid() in WITH CHECK' as check_description,
  COUNT(*) as failing_policies
FROM pg_policies 
WHERE schemaname = 'public'
AND with_check LIKE '%auth.uid()%' 
AND with_check NOT LIKE '%(SELECT auth.uid())%'

UNION ALL

SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as check_result,
  'No Direct auth.jwt() in WITH CHECK' as check_description,
  COUNT(*) as failing_policies
FROM pg_policies 
WHERE schemaname = 'public'
AND with_check LIKE '%auth.jwt()%' 
AND with_check NOT LIKE '%(SELECT auth.jwt())%'

ORDER BY 
  CASE check_result
    WHEN '❌ FAIL' THEN 1
    ELSE 2
  END,
  check_description;

-- =============================================================================
-- NEXT STEPS RECOMMENDATIONS
-- =============================================================================

SELECT 
  '' as separator,
  'NEXT_STEPS' as report_section,
  '' as separator2;

-- Generate recommendations based on current state
WITH optimization_stats AS (
  SELECT 
    COUNT(*) as total_policies,
    COUNT(CASE 
      WHEN (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%') OR
           (qual LIKE '%auth.jwt()%' AND qual NOT LIKE '%(SELECT auth.jwt())%') OR
           (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%') OR
           (with_check LIKE '%auth.jwt()%' AND with_check NOT LIKE '%(SELECT auth.jwt())%')
      THEN 1 
    END) as needs_optimization,
    COUNT(CASE 
      WHEN (qual LIKE '%(SELECT auth.uid())%' OR qual LIKE '%(SELECT auth.jwt())%' OR
            with_check LIKE '%(SELECT auth.uid())%' OR with_check LIKE '%(SELECT auth.jwt())%')
      THEN 1 
    END) as already_optimized
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
  CASE 
    WHEN needs_optimization = 0 THEN '🎉 All policies are optimized! Monitor for new policies.'
    WHEN needs_optimization <= 5 THEN '🔧 Few policies remaining. Complete optimization manually.'
    WHEN needs_optimization <= 15 THEN '⚡ Run systematic optimization on remaining policies.'
    ELSE '🚀 Execute comprehensive optimization workflow.'
  END as recommendation,
  needs_optimization as policies_remaining,
  ROUND(already_optimized * 100.0 / total_policies, 1) as current_progress_percent
FROM optimization_stats;