-- Fix Function Search Path Security Issues (Safe Approach)
-- Created: 2025-01-24
-- Purpose: Fix 7 security warnings about mutable search_path in functions
-- Security Issue: Functions without search_path='' are vulnerable to schema injection
-- NOTE: Use ALTER FUNCTION to add search_path without breaking dependencies

-- ============================================================================
-- SECURE ALL FUNCTIONS BY ALTERING SEARCH_PATH (SAFE APPROACH)
-- ============================================================================

-- 1. Secure is_management_role function
ALTER FUNCTION is_management_role() SET search_path = '';

-- 2. Secure update_updated_at_column function  
ALTER FUNCTION update_updated_at_column() SET search_path = '';

-- 3. Secure generate_scope_item_no function
ALTER FUNCTION generate_scope_item_no() SET search_path = '';

-- 4. Secure has_project_access function
ALTER FUNCTION has_project_access(UUID) SET search_path = '';

-- 5. Secure update_jwt_claims function
ALTER FUNCTION update_jwt_claims() SET search_path = '';

-- 6. Secure test_workflow_scenarios function
ALTER FUNCTION test_workflow_scenarios() SET search_path = '';

-- 7. Secure verify_role_permissions function
ALTER FUNCTION verify_role_permissions() SET search_path = '';

-- ============================================================================
-- VERIFICATION - CHECK ALL FUNCTIONS HAVE SECURE SEARCH_PATH
-- ============================================================================

DO $$
DECLARE
  func_record RECORD;
  insecure_count INTEGER := 0;
  total_count INTEGER := 0;
BEGIN
  RAISE NOTICE '🔒 FUNCTION SEARCH_PATH SECURITY VERIFICATION';
  RAISE NOTICE '===============================================';
  RAISE NOTICE '';
  
  -- Check all functions in public schema
  FOR func_record IN (
    SELECT 
      p.proname as function_name,
      CASE 
        WHEN p.proconfig IS NULL THEN 'NO CONFIG'
        WHEN 'search_path=' = ANY(p.proconfig) THEN 'SECURE'
        ELSE array_to_string(p.proconfig, ', ') 
      END as security_status
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    AND p.proname IN (
      'is_management_role', 'update_updated_at_column', 'test_workflow_scenarios',
      'generate_scope_item_no', 'verify_role_permissions', 'has_project_access',
      'update_jwt_claims'
    )
    ORDER BY p.proname
  )
  LOOP
    total_count := total_count + 1;
    
    IF func_record.security_status = 'SECURE' THEN
      RAISE NOTICE '✅ Function %: SECURE (search_path properly set)', func_record.function_name;
    ELSE
      RAISE NOTICE '❌ Function %: % - NEEDS SECURITY FIX', func_record.function_name, func_record.security_status;
      insecure_count := insecure_count + 1;
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE 'SECURITY SUMMARY:';
  RAISE NOTICE '  Total functions checked: %', total_count;
  RAISE NOTICE '  Secure functions: %', total_count - insecure_count;
  RAISE NOTICE '  Insecure functions: %', insecure_count;
  
  IF insecure_count = 0 THEN
    RAISE NOTICE '✅ SUCCESS: All 7 functions now have secure search_path configuration';
    RAISE NOTICE '✅ RESOLVED: All "Function Search Path Mutable" warnings fixed';
  ELSE
    RAISE NOTICE '❌ WARNING: % functions still have security vulnerabilities', insecure_count;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎯 FUNCTION SECURITY FIX COMPLETE - CSV WARNINGS RESOLVED';
END $$;