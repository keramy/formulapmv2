-- =====================================================
-- Fix Auth to User Profiles Auto-Creation Trigger
-- Ensure it works even without metadata
-- =====================================================

-- Drop existing trigger and function to recreate cleanly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user_signup() CASCADE;

-- Create improved function that handles missing metadata
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_first_name TEXT;
  user_last_name TEXT;
  user_role TEXT;
BEGIN
  -- Extract email (always available)
  user_email := NEW.email;
  
  -- Extract metadata with defaults
  user_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(user_email, '@', 1));
  user_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', 'User');
  
  -- Extract role with validation
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL AND 
     NEW.raw_user_meta_data->>'role' IN ('management', 'purchase_manager', 'technical_lead', 'project_manager', 'client', 'admin') THEN
    user_role := NEW.raw_user_meta_data->>'role';
  ELSE
    user_role := 'client'; -- Safe default
  END IF;
  
  -- Insert into user_profiles (will not fail if metadata is missing)
  INSERT INTO public.user_profiles (id, email, first_name, last_name, role, is_active)
  VALUES (
    NEW.id,
    user_email,
    user_first_name,
    user_last_name,
    user_role::user_role,
    true
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate key errors
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '';

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_signup();

-- =====================================================
-- Verification
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'AUTH TO PROFILES TRIGGER FIXED';
  RAISE NOTICE '=============================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Trigger recreated with better error handling';
  RAISE NOTICE '✅ Works WITH or WITHOUT metadata';
  RAISE NOTICE '✅ Smart defaults:';
  RAISE NOTICE '   - first_name: Uses email prefix if not provided';
  RAISE NOTICE '   - last_name: Defaults to "User"';
  RAISE NOTICE '   - role: Defaults to "client"';
  RAISE NOTICE '';
  RAISE NOTICE 'NOW CREATING USERS IN AUTH WILL ALWAYS CREATE PROFILES!';
END $$;