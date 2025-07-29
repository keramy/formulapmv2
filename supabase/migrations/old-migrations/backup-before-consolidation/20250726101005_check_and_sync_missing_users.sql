-- =====================================================
-- Check for Users in Auth but not in Profiles
-- And create missing profiles
-- =====================================================

DO $$
DECLARE
  missing_count INTEGER;
  user_record RECORD;
BEGIN
  RAISE NOTICE 'CHECKING FOR MISSING USER PROFILES';
  RAISE NOTICE '==================================';
  RAISE NOTICE '';
  
  -- Count users in auth but not in profiles
  SELECT COUNT(*) INTO missing_count
  FROM auth.users au
  LEFT JOIN user_profiles up ON au.id = up.id
  WHERE up.id IS NULL;
  
  RAISE NOTICE 'Found % users in auth without profiles', missing_count;
  RAISE NOTICE '';
  
  -- Create profiles for missing users
  FOR user_record IN (
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN user_profiles up ON au.id = up.id
    WHERE up.id IS NULL
  ) LOOP
    INSERT INTO user_profiles (id, email, first_name, last_name, role, is_active)
    VALUES (
      user_record.id,
      user_record.email,
      COALESCE(user_record.raw_user_meta_data->>'first_name', split_part(user_record.email, '@', 1)),
      COALESCE(user_record.raw_user_meta_data->>'last_name', 'User'),
      COALESCE(
        CASE 
          WHEN user_record.raw_user_meta_data->>'role' IN ('management', 'purchase_manager', 'technical_lead', 'project_manager', 'client', 'admin') 
          THEN user_record.raw_user_meta_data->>'role'
          ELSE 'client'
        END
      )::user_role,
      true
    );
    
    RAISE NOTICE '✅ Created profile for: %', user_record.email;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE 'SYNC COMPLETE - All auth users now have profiles!';
END $$;