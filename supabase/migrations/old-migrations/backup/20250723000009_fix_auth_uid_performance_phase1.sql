-- Fix auth.uid() Performance Issues - Phase 1: user_profiles
-- This migration fixes the most critical performance issue: direct auth.uid() calls

-- 🚨 CRITICAL ISSUE: Direct auth.uid() calls cause PostgreSQL to execute the function 
-- for EVERY ROW in the result set, creating massive performance overhead.
-- 
-- ❌ BAD:  auth.uid() = id           (called once per row)
-- ✅ GOOD: id = (SELECT auth.uid())  (called once per query)

-- Fix user_profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (id = (SELECT auth.uid()));

-- Performance Analysis:
-- Before: auth.uid() called N times (where N = number of rows)
-- After:  auth.uid() called 1 time per query
-- Expected improvement: 10-1000x faster depending on table size