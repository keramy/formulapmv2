-- Enable RLS on system_settings table
-- Created: 2025-01-24
-- Purpose: Fix critical security issue - RLS policies exist but RLS not enabled
-- This is a SECURITY FIX - policies are not enforced without RLS enabled

-- ============================================================================
-- ENABLE RLS ON SYSTEM_SETTINGS TABLE
-- ============================================================================

-- Enable Row Level Security on system_settings table
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFY ALL TABLES HAVE RLS ENABLED
-- ============================================================================

-- Check and enable RLS on all policy-protected tables
DO $$
DECLARE
  table_record RECORD;
  rls_enabled BOOLEAN;
BEGIN
  RAISE NOTICE '🔒 ENABLING RLS ON ALL POLICY-PROTECTED TABLES';
  RAISE NOTICE '==================================================';
  RAISE NOTICE '';
  
  -- Check each table that has policies
  FOR table_record IN (
    SELECT DISTINCT schemaname, tablename
    FROM pg_policies 
    WHERE schemaname = 'public'
    ORDER BY tablename
  )
  LOOP
    -- Check if RLS is enabled
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = table_record.tablename
    AND n.nspname = table_record.schemaname;
    
    IF rls_enabled THEN
      RAISE NOTICE '✅ Table %: RLS already enabled', table_record.tablename;
    ELSE
      RAISE NOTICE '🔧 Table %: Enabling RLS now...', table_record.tablename;
      EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', 
                     table_record.schemaname, table_record.tablename);
      RAISE NOTICE '✅ Table %: RLS now enabled', table_record.tablename;
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎯 RLS ENABLEMENT COMPLETE - ALL POLICIES NOW ACTIVE';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================

-- Verify all tables with policies have RLS enabled
DO $$
DECLARE
  table_count INTEGER;
  rls_enabled_count INTEGER;
BEGIN
  -- Count tables with policies
  SELECT COUNT(DISTINCT tablename) INTO table_count
  FROM pg_policies 
  WHERE schemaname = 'public';
  
  -- Count tables with RLS enabled that have policies
  SELECT COUNT(DISTINCT c.relname) INTO rls_enabled_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_policies p ON p.tablename = c.relname AND p.schemaname = n.nspname
  WHERE n.nspname = 'public'
  AND c.relrowsecurity = true;
  
  RAISE NOTICE 'FINAL RLS VERIFICATION:';
  RAISE NOTICE '  Tables with policies: %', table_count;
  RAISE NOTICE '  Tables with RLS enabled: %', rls_enabled_count;
  
  IF table_count = rls_enabled_count THEN
    RAISE NOTICE '✅ SUCCESS: All policy-protected tables have RLS enabled';
  ELSE
    RAISE NOTICE '❌ ERROR: Some tables missing RLS - security vulnerability!';
  END IF;
END $$;