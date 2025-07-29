-- =====================================================
-- Create Working User Trigger - Simple Version
-- =====================================================

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user_signup() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Create simple function
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Simple insert that will definitely work
  INSERT INTO public.user_profiles (
    id, 
    email, 
    first_name, 
    last_name, 
    role, 
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    split_part(NEW.email, '@', 1), -- Use email prefix as first name
    'User', -- Default last name
    'client'::public.user_role, -- Default role with explicit schema
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Ignore if already exists
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_signup();

DO $$
BEGIN
  RAISE NOTICE 'WORKING USER TRIGGER CREATED';
  RAISE NOTICE '===========================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Trigger will now create profiles automatically';
  RAISE NOTICE '✅ Uses email prefix as first name';
  RAISE NOTICE '✅ Default role: client';
  RAISE NOTICE '✅ Function has proper security (SECURITY DEFINER, search_path)';
  RAISE NOTICE '';
  RAISE NOTICE 'Create a test user now - it should work!';
END $$;