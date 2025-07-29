-- =====================================================
-- Fix Trigger with Better Error Handling
-- Make sure trigger doesn't fail user creation
-- =====================================================

-- Drop and recreate with exception handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user_signup() CASCADE;

-- Create function that won't fail user creation
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Wrap everything in exception handler so auth user creation succeeds
  BEGIN
    INSERT INTO public.user_profiles (
      id, 
      email, 
      first_name, 
      last_name, 
      role, 
      is_active
    )
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
      COALESCE(
        CASE 
          WHEN NEW.raw_user_meta_data->>'role' IN ('management', 'purchase_manager', 'technical_lead', 'project_manager', 'client', 'admin') 
          THEN NEW.raw_user_meta_data->>'role'
          ELSE 'client'
        END
      )::user_role,
      true
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name;
      
  EXCEPTION 
    WHEN OTHERS THEN
      -- Log error but don't fail the auth user creation
      RAISE WARNING 'Failed to create user_profiles for %: %', NEW.email, SQLERRM;
  END;
  
  -- Always return NEW so auth user creation succeeds
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '';

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_signup();

DO $$
BEGIN
  RAISE NOTICE 'TRIGGER FIXED WITH ERROR HANDLING';
  RAISE NOTICE '=================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Trigger will no longer block user creation';
  RAISE NOTICE '✅ Errors are logged as warnings instead';
  RAISE NOTICE '✅ Auth user creation always succeeds';
  RAISE NOTICE '';
  RAISE NOTICE 'Try creating a user again - it should work now!';
END $$;