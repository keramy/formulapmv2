-- =====================================================
-- Final Working Trigger - Execute as SUPERUSER
-- =====================================================

-- Grant necessary permissions first
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT ALL ON auth.users TO postgres;
GRANT USAGE ON SCHEMA public TO postgres;
GRANT ALL ON public.user_profiles TO postgres;

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_signup() CASCADE;

-- Create function as SUPERUSER
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Log the attempt
  RAISE LOG 'Creating profile for user: % (ID: %)', NEW.email, NEW.id;
  
  -- Simple insert with explicit schema references
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
    COALESCE(split_part(NEW.email, '@', 1), 'User'), -- Use email prefix as first name
    'User', -- Default last name
    'client'::public.user_role, -- Default role with explicit schema
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RAISE LOG 'Profile created successfully for user: %', NEW.email;
  RETURN NEW;
  
EXCEPTION 
  WHEN OTHERS THEN
    RAISE LOG 'Failed to create profile for user %: % %', NEW.email, SQLSTATE, SQLERRM;
    -- Don't block auth creation - return NEW anyway
    RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_signup();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.handle_new_user_signup() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user_signup() TO anon;

DO $$
BEGIN
  RAISE NOTICE 'FINAL WORKING TRIGGER CREATED';
  RAISE NOTICE '============================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Function: handle_new_user_signup() created with proper permissions';
  RAISE NOTICE '✅ Trigger: on_auth_user_created created on auth.users table';
  RAISE NOTICE '✅ Error handling: Logs errors but doesn''t block auth creation';
  RAISE NOTICE '✅ Permissions: Granted to authenticated and anon roles';
  RAISE NOTICE '';
  RAISE NOTICE 'NOW CREATE A TEST USER - IT SHOULD WORK!';
END $$;