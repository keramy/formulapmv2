-- RLS Policy Discovery and Analysis SQL Queries
-- Requirements: 3.1, 3.4
-- 
-- This file contains the core SQL queries for discovering and analyzing
-- RLS policies that require optimization for performance improvements.

-- =============================================================================
-- 1. POLICY DISCOVERY QUERY
-- Identifies all policies requiring optimization
-- =============================================================================

-- Query to find all policies with direct auth function calls that need optimization
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
-- 2. OPTIMIZATION PROGRESS TRACKING QUERY
-- Tracks optimization progress by table
-- =============================================================================

-- Query to track optimization progress and generate metrics by table
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
-- 3. COMPREHENSIVE POLICY INVENTORY QUERY
-- Generates complete policy inventory with optimization status
-- =============================================================================

-- Query to generate comprehensive policy inventory with detailed status
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

-- =============================================================================
-- 4. VALIDATION QUERIES FOR OPTIMIZATION TRACKING
-- Quick validation queries to check optimization status
-- =============================================================================

-- Quick count of policies by optimization status
SELECT 
  'TOTAL_POLICIES' as metric,
  COUNT(*) as count
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
  'NEEDS_OPTIMIZATION' as metric,
  COUNT(*) as count
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
  'ALREADY_OPTIMIZED' as metric,
  COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'public'
AND (
  qual LIKE '%(SELECT auth.uid())%' OR 
  qual LIKE '%(SELECT auth.jwt())%' OR
  with_check LIKE '%(SELECT auth.uid())%' OR 
  with_check LIKE '%(SELECT auth.jwt())%'
)

ORDER BY metric;

-- =============================================================================
-- 5. HIGH-PRIORITY TABLE IDENTIFICATION
-- Identifies tables with the most optimization opportunities
-- =============================================================================

-- Query to identify high-priority tables for optimization
SELECT 
  tablename,
  COUNT(*) as total_policies,
  SUM(CASE 
    WHEN (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%') OR
         (qual LIKE '%auth.jwt()%' AND qual NOT LIKE '%(SELECT auth.jwt())%') OR
         (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%') OR
         (with_check LIKE '%auth.jwt()%' AND with_check NOT LIKE '%(SELECT auth.jwt())%')
    THEN 1 ELSE 0
  END) as policies_needing_optimization,
  SUM(
    (LENGTH(qual) - LENGTH(REPLACE(qual, 'auth.uid()', ''))) / LENGTH('auth.uid()') +
    (LENGTH(COALESCE(with_check, '')) - LENGTH(REPLACE(COALESCE(with_check, ''), 'auth.uid()', ''))) / LENGTH('auth.uid()') +
    (LENGTH(qual) - LENGTH(REPLACE(qual, 'auth.jwt()', ''))) / LENGTH('auth.jwt()') +
    (LENGTH(COALESCE(with_check, '')) - LENGTH(REPLACE(COALESCE(with_check, ''), 'auth.jwt()', ''))) / LENGTH('auth.jwt()')
  ) as total_direct_calls,
  CASE 
    WHEN COUNT(*) > 0 THEN
      ROUND(
        SUM(CASE 
          WHEN (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%') OR
               (qual LIKE '%auth.jwt()%' AND qual NOT LIKE '%(SELECT auth.jwt())%') OR
               (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%') OR
               (with_check LIKE '%auth.jwt()%' AND with_check NOT LIKE '%(SELECT auth.jwt())%')
          THEN 1 ELSE 0
        END) * 100.0 / COUNT(*), 2
      )
    ELSE 0
  END as optimization_priority_score
FROM pg_policies 
WHERE schemaname = 'public'
AND (
  qual LIKE '%auth.uid()%' OR 
  qual LIKE '%auth.jwt()%' OR
  with_check LIKE '%auth.uid()%' OR
  with_check LIKE '%auth.jwt()%'
)
GROUP BY tablename
HAVING SUM(CASE 
  WHEN (qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%') OR
       (qual LIKE '%auth.jwt()%' AND qual NOT LIKE '%(SELECT auth.jwt())%') OR
       (with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%') OR
       (with_check LIKE '%auth.jwt()%' AND with_check NOT LIKE '%(SELECT auth.jwt())%')
  THEN 1 ELSE 0
END) > 0
ORDER BY total_direct_calls DESC, policies_needing_optimization DESC;

-- =============================================================================
-- 6. DETAILED POLICY ANALYSIS FOR SPECIFIC TABLES
-- Template query for analyzing specific tables in detail
-- =============================================================================

-- Example: Analyze policies for a specific table (replace 'table_name' with actual table)
/*
SELECT 
  policyname,
  cmd as policy_type,
  permissive,
  roles,
  qual as condition_clause,
  with_check as check_clause,
  -- Identify specific optimization needs
  CASE WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%' THEN 'YES' ELSE 'NO' END as needs_uid_optimization,
  CASE WHEN qual LIKE '%auth.jwt()%' AND qual NOT LIKE '%(SELECT auth.jwt())%' THEN 'YES' ELSE 'NO' END as needs_jwt_optimization,
  CASE WHEN with_check LIKE '%auth.uid()%' AND with_check NOT LIKE '%(SELECT auth.uid())%' THEN 'YES' ELSE 'NO' END as check_needs_uid_optimization,
  CASE WHEN with_check LIKE '%auth.jwt()%' AND with_check NOT LIKE '%(SELECT auth.jwt())%' THEN 'YES' ELSE 'NO' END as check_needs_jwt_optimization,
  -- Show what the optimized version would look like
  REPLACE(REPLACE(qual, 'auth.uid()', '(SELECT auth.uid())'), 'auth.jwt()', '(SELECT auth.jwt())') as optimized_qual,
  REPLACE(REPLACE(COALESCE(with_check, ''), 'auth.uid()', '(SELECT auth.uid())'), 'auth.jwt()', '(SELECT auth.jwt())') as optimized_with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'table_name'  -- Replace with actual table name
AND (
  qual LIKE '%auth.uid()%' OR 
  qual LIKE '%auth.jwt()%' OR
  with_check LIKE '%auth.uid()%' OR
  with_check LIKE '%auth.jwt()%'
)
ORDER BY policyname;
*/