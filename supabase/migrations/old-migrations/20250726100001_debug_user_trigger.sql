-- =====================================================
-- Debug User Signup Trigger
-- Add logging and error handling to see what's failing
-- =====================================================

-- Drop and recreate the function with better error handling
DROP FUNCTION IF EXISTS handle_new_user_signup() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_first_name TEXT;
  user_last_name TEXT;
  user_role TEXT;
BEGIN
  -- Log the trigger execution
  RAISE NOTICE 'Trigger fired for user: %', NEW.id;
  
  -- Extract values safely
  user_email := COALESCE(NEW.email, 'no-email@example.com');
  user_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', 'User');
  user_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', 'Name');
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'admin');
  
  RAISE NOTICE 'Extracted values - Email: %, Name: % %, Role: %', 
    user_email, user_first_name, user_last_name, user_role;
  
  -- Validate role is in enum
  IF user_role NOT IN ('management', 'purchase_manager', 'technical_lead', 'project_manager', 'client', 'admin') THEN
    RAISE NOTICE 'Invalid role %, defaulting to admin', user_role;
    user_role := 'admin';
  END IF;
  
  -- Insert with error handling
  BEGIN
    INSERT INTO public.user_profiles (id, email, first_name, last_name, role, is_active)
    VALUES (NEW.id, user_email, user_first_name, user_last_name, user_role::user_role, true);
    
    RAISE NOTICE 'Successfully created user_profiles record for %', user_email;
    
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE NOTICE 'ERROR creating user_profiles: % - %', SQLSTATE, SQLERRM;
      -- Don't fail the trigger, just log the error
      RETURN NEW;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_signup();

-- =====================================================
-- Test the user_profiles table constraints
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'DEBUGGING USER SIGNUP TRIGGER';
  RAISE NOTICE '============================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Enhanced trigger with logging created';
  RAISE NOTICE '✅ Error handling added';
  RAISE NOTICE '✅ Role validation added';
  RAISE NOTICE '';
  RAISE NOTICE 'Try creating a user now and check the logs for detailed error messages';
END $$;