-- =====================================================
-- Check if trigger exists and is working
-- =====================================================

DO $$
DECLARE
  trigger_exists BOOLEAN;
  function_exists BOOLEAN;
BEGIN
  RAISE NOTICE 'TRIGGER DEBUGGING CHECK';
  RAISE NOTICE '====================';
  RAISE NOTICE '';
  
  -- Check if trigger exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created'
  ) INTO trigger_exists;
  
  -- Check if function exists
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'handle_new_user_signup'
  ) INTO function_exists;
  
  RAISE NOTICE 'Trigger exists: %', trigger_exists;
  RAISE NOTICE 'Function exists: %', function_exists;
  
  IF NOT trigger_exists THEN
    RAISE NOTICE '❌ PROBLEM: Trigger missing!';
  END IF;
  
  IF NOT function_exists THEN
    RAISE NOTICE '❌ PROBLEM: Function missing!';
  END IF;
  
  -- Show all triggers on auth.users
  RAISE NOTICE '';
  RAISE NOTICE 'All triggers on auth.users:';
  
  -- Simple check without loop
  IF trigger_exists THEN
    RAISE NOTICE '✅ Trigger on_auth_user_created is present';
  ELSE
    RAISE NOTICE '❌ Trigger on_auth_user_created is MISSING';
    RAISE NOTICE 'Need to recreate the trigger!';
  END IF;
  
END $$;