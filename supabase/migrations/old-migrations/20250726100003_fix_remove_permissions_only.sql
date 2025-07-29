-- =====================================================
-- Fix: Only remove permissions column (role already exists)
-- =====================================================

-- Just drop the permissions column since role already exists
ALTER TABLE user_profiles DROP COLUMN IF EXISTS permissions;

-- Check what columns we have now
DO $$
DECLARE
  columns_list TEXT;
BEGIN
  SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) INTO columns_list
  FROM information_schema.columns 
  WHERE table_name = 'user_profiles' AND table_schema = 'public';
  
  RAISE NOTICE 'USER_PROFILES COLUMNS CLEANUP';
  RAISE NOTICE '============================';
  RAISE NOTICE '';
  RAISE NOTICE 'Current columns: %', columns_list;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Removed permissions (JSONB) if it existed';
  RAISE NOTICE '✅ Role column already exists as enum';
  RAISE NOTICE '✅ Ready for simple dropdown selection';
END $$;