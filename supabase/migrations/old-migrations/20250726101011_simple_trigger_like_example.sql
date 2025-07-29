-- =====================================================
-- Simple Trigger Like the Example - No Overengineering
-- =====================================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user_signup() CASCADE;

-- Create simple function like the example
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, first_name, last_name, role, is_active, created_at)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
    'client'::user_role,
    true,
    NEW.created_at
  );
  RETURN NEW;
END;
$$;

-- Create trigger exactly like the example
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

DO $$
BEGIN
  RAISE NOTICE 'SIMPLE TRIGGER CREATED (LIKE EXAMPLE)';
  RAISE NOTICE '===================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Using simple approach from documentation';
  RAISE NOTICE '✅ No overengineering or complex error handling';
  RAISE NOTICE '✅ If trigger fails, auth creation fails (correct behavior)';
  RAISE NOTICE '';
  RAISE NOTICE 'This should work exactly like the example!';
END $$;