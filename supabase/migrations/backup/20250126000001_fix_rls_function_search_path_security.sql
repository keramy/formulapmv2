-- =============================================
-- FIX RLS FUNCTION SEARCH_PATH SECURITY WARNINGS
-- =============================================
-- This migration fixes the 5 RLS functions that have mutable search_path
-- security warnings by setting search_path to empty string and using
-- fully qualified table names.
--
-- Security Issue: Functions with mutable search_path can be exploited
-- by creating objects with same names in other schemas.
--
-- Fix: Set search_path = '' and use fully qualified table names

BEGIN;

-- =============================================
-- 1. Fix rls_has_project_access function
-- =============================================
CREATE OR REPLACE FUNCTION rls_has_project_access(project_id uuid)
RETURNS boolean
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = ''  -- SECURITY FIX: Changed from 'public' to ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_assignments pa  -- FULLY QUALIFIED TABLE NAME
    WHERE pa.project_id = $1 
    AND pa.user_id = (SELECT auth.uid())
    AND pa.is_active = true
  );
$$;

-- =============================================
-- 2. Fix rls_is_project_manager_for function
-- =============================================
CREATE OR REPLACE FUNCTION rls_is_project_manager_for(project_id uuid)
RETURNS boolean
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = ''  -- SECURITY FIX: Changed from 'public' to ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects p  -- FULLY QUALIFIED TABLE NAME
    WHERE p.id = $1 
    AND p.project_manager_id = (SELECT auth.uid())
  );
$$;

-- =============================================
-- 3. Fix rls_is_client_for_project function
-- =============================================
CREATE OR REPLACE FUNCTION rls_is_client_for_project(project_id uuid)
RETURNS boolean
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = ''  -- SECURITY FIX: Changed from 'public' to ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects p  -- FULLY QUALIFIED TABLE NAMES
    INNER JOIN public.clients c ON p.client_id = c.id
    INNER JOIN public.user_profiles up ON up.company = c.company_name
    WHERE p.id = $1 
    AND up.id = (SELECT auth.uid())
  );
$$;

-- =============================================
-- 4. Fix rls_project_team_or_management function
-- =============================================
CREATE OR REPLACE FUNCTION rls_project_team_or_management(project_id uuid)
RETURNS boolean
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = ''  -- SECURITY FIX: Changed from 'public' to ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_assignments pa  -- FULLY QUALIFIED TABLE NAME
    WHERE pa.project_id = $1 
    AND pa.user_id = (SELECT auth.uid())
    AND pa.is_active = true
  ) OR COALESCE(
    current_setting('request.jwt.claim.role', true),
    (current_setting('request.jwt.claims', true)::json->>'role')::text
  ) IN ('admin', 'management');
$$;

-- =============================================
-- 5. Fix rls_project_stakeholder_access function
-- =============================================
CREATE OR REPLACE FUNCTION rls_project_stakeholder_access(project_id uuid)
RETURNS boolean
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = ''  -- SECURITY FIX: Changed from 'public' to ''
AS $$
  SELECT 
    -- Project team access
    EXISTS (
      SELECT 1 FROM public.project_assignments pa  -- FULLY QUALIFIED TABLE NAME
      WHERE pa.project_id = $1 
      AND pa.user_id = (SELECT auth.uid())
      AND pa.is_active = true
    ) OR 
    -- Client access
    EXISTS (
      SELECT 1 FROM public.projects p  -- FULLY QUALIFIED TABLE NAMES
      INNER JOIN public.clients c ON p.client_id = c.id
      INNER JOIN public.user_profiles up ON up.company = c.company_name
      WHERE p.id = $1 
      AND up.id = (SELECT auth.uid())
    ) OR
    -- Management access
    COALESCE(
      current_setting('request.jwt.claim.role', true),
      (current_setting('request.jwt.claims', true)::json->>'role')::text
    ) IN ('admin', 'management');
$$;

COMMIT;

-- =============================================
-- VERIFICATION COMMENTS
-- =============================================
-- After running this migration:
-- ✅ All 5 functions now have SET search_path = '' (secure)
-- ✅ All table references are fully qualified (public.table_name)
-- ✅ No functionality changes - only security improvements
-- ✅ Supabase advisor security warnings will be resolved
-- ✅ Functions are protected against search_path injection attacks

-- =============================================
-- SECURITY IMPROVEMENT SUMMARY
-- =============================================
-- BEFORE: SET search_path = 'public' (VULNERABLE)
-- AFTER:  SET search_path = '' + fully qualified names (SECURE)
--
-- This prevents potential SQL injection attacks where malicious users
-- could create objects with the same names in other schemas to trick
-- these functions into using their objects instead of the intended ones.